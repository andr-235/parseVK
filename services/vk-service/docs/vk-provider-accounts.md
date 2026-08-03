# VK Provider Accounts, Scheduler and Metrics

This document covers the credential lifecycle, scheduler fairness model, CLI tooling and
the Prometheus metric contract introduced in PR #285 (issue #285).

## Credential sources and precedence

`SecretProvider` resolves the VK credential in this order (see `app/infrastructure/secrets/`):

1. `VK_SERVICE_TOKEN_FILE` — path to a mounted token file. Wins over the legacy env var.
2. `VK_SERVICE_VK_TOKEN` (deprecated) — legacy env path. If it is the only source, a
   deprecation warning is logged: the fallback is **not silent**.

If neither is set, the service fails fast at boot. A credential is hashed into
`CredentialMaterial` (SHA-256): only `display_version` (first 12 hex chars) is ever logged,
serialized or shown in `/health` and the CLI; the raw secret is redacted from errors.

## Account lifecycle and state machine

The `vk_provider_accounts` table holds one row per account key (`system-vk` today) with
status `active` / `invalid` / `cooling_down` / `disabled`.

| Event | Result |
|-------|--------|
| Startup reconciliation, version changed | validate once via `users.get` (`users.test_token`) → `active` or `invalid` |
| Startup reconciliation, same version, row `active` | no validation, stays `active` |
| Startup reconciliation, same version, row `invalid` | stays `invalid` (operator action required) |
| `cooldown_until` in the future | stays `cooling_down` until expiry |
| Task hits `VkApiAuthError` | transition to `invalid` (`became_invalid` flag), task released **without retry/backoff** |
| Token rotated, new version | startup reconciliation validates and flips back to `active` |

While `invalid`, the worker gate (SQL filter on `claim_next` + in-memory `AccountGate`) blocks
new claims; in-flight tasks are released to pending without consuming a terminal failure.
There is no silent retry loop against a dead credential.

### Operator playbook: rotate a token

1. Replace the token file contents (or env var) with the new token.
2. Restart the vk-service container.
3. Startup reconciliation detects the new `credential_version`, validates once and sets the
   account `active`.
4. Verify: `GET /health` → `vkAccountStatus: "active"`, `vkTokenConfigured: "yes"`; or run the
   CLI `account-status` subcommand.
5. Optional pre-flight: validate the candidate file without touching the live account:

```bash
uv run python scripts/validate_token.py validate-token --file ./secrets/vk_token_new
```

## CLI: scripts/validate_token.py

Run inside the container: `uv run python scripts/validate_token.py <command>`.

| Subcommand | Behavior | Exit codes |
|------------|----------|------------|
| `validate-token --file <path>` | probes `users.get` with the candidate credential via its own local scheduler; does **not** modify the active account; works while the account is `invalid` | `0` ok / `1` auth failure / `2` infra or config error |
| `account-status` | prints the DB status of `system-vk` | `0` active / `1` invalid / `2` unconfigured, infra or config error |

Output is JSON: `{account_key, display_version, status, capabilities, validated_at, ok, errors[]}`.
The raw secret never appears in output; error payloads are sanitized through redaction.

## Scheduler fairness model

`FairScheduler` (one instance per account key) round-robins lanes within an account:

- each in-flight request holds one slot per account (`asyncio.Lock`);
- lanes rotate; a lane's next request is only picked when `not_before` has passed;
- retries (transient/rate-limit categories) respect `VkRetryPolicy` budgets, exponential
  backoff and account cooldowns (flood code 6, hard limit code 29);
- auth errors are never retried.

The supported deployment topology for this phase is one `system-vk` account and one active
`vk-service` replica. Multiple active replicas or a distributed rate limiter are outside the
scope of issue #285.

## Prometheus metric contract

Exposed on the standard `/metrics` endpoint alongside `prometheus-fastapi-instrumentator`.

| Metric | Labels | Source |
|--------|--------|--------|
| `vk_requests_total` | `account_id, method, outcome` | scheduler hook (all traffic flows through the scheduler) |
| `vk_request_duration_seconds` | `account_id, method` | scheduler hook |
| `vk_rate_limit_retries_total` | `account_id, code` | scheduler retry hook |
| `vk_scheduler_queue_depth` | `account_id` | scheduler hook (snapshot at completion) |
| `vk_scheduler_wait_seconds` | `account_id` | scheduler hook |
| `vk_account_status` | `account_id, status` (gauge, 1 on current status) | reconciliation + executor transitions |
| `vk_account_cooldown_seconds` | `account_id` | reconciliation (from `cooldown_until`) |
| `vk_provider_account_info` | `account_id` (info carries `credential_version`) | reconciliation + executor transitions |

`outcome` ∈ `success | auth | rate_limit | infra | domain`. The credential version appears
**only** in `vk_provider_account_info` and structured logs — never as a label on request
counters.

## Alert impact and recommended signals

The change introduces provider-account and scheduler signals that should be wired into the
existing Prometheus/Alertmanager deployment. The exact thresholds may be tuned after the
production observation window, but the following conditions are the minimum operational set:

| Condition | Suggested severity | Operator action |
|-----------|--------------------|-----------------|
| `system-vk` is not `active` for 5 minutes | critical | Check `/health`, run `account-status`, validate a candidate token and rotate the mounted secret if needed. |
| `vk_account_cooldown_seconds{account_id="system-vk"} > 0` for 10 minutes | warning | Inspect VK rate-limit codes and reduce the configured target request rate if cooldowns repeat. |
| Increase in `vk_rate_limit_retries_total` over 15 minutes | warning | Compare code 6/29 frequency, queue depth and request rate; verify that retries remain within budget. |
| Sustained scheduler queue depth or wait-time growth for 15 minutes | warning | Check for a blocked account, slow VK responses, an oversized workload or an incorrectly high input rate. |
| No successful VK requests while pending VK work exists | critical | Verify account status, worker health, lease ownership and scheduler progress. |

Alert payloads must include only `account_id`, status, method and VK error category/code. Raw
credentials and full exception strings must never be included in labels, annotations or traces.

## Rollback and legacy-removal preconditions

### Rollback procedure

1. Stop the `vk-service` replica before changing credential configuration.
2. Keep the `vk_provider_accounts` migration applied. The table is additive and does not
   require rollback to restore the previous credential source.
3. Unset `VK_SERVICE_TOKEN_FILE` and provide the existing token through the deprecated
   `VK_SERVICE_VK_TOKEN` environment variable.
4. Start exactly one `vk-service` replica and verify `/health`, `account-status` and task claims.
5. If the provider account remains `invalid`, validate the credential with the CLI and rotate it;
   do not bypass the account gate or write the raw token to the database.
6. Preserve the new metrics and audit columns during the rollback window so attempts remain
   attributable and operators can compare the legacy and mounted-file paths.

The compatibility fallback changes only the secret source. It does not disable the provider
account gate, credential-version audit, scheduler fairness or retry safeguards.

### Preconditions for removing the legacy env fallback

The deprecated `VK_SERVICE_VK_TOKEN` path may be deleted only after all of the following are true:

- production uses `VK_SERVICE_TOKEN_FILE` exclusively;
- at least one full credential rotation has been completed through candidate validation and
  startup reconciliation;
- the agreed observation window completes with no unexplained task loss, restart loop or token
  leakage;
- account-status, cooldown, retry and queue alerts are enabled and tested;
- rollback documentation and secret-mount deployment instructions have been exercised;
- no deployment manifests, CI jobs or operator runbooks still reference the legacy variable;
- issue #285 is merged and the dependent execution-attempt work no longer requires the legacy
  path for compatibility testing.
