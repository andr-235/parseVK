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
