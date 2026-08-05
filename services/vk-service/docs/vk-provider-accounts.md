# VK Provider Accounts, Scheduler and Credentials

## Credential source

`vk-service` accepts exactly one VK credential source:

- `VK_SERVICE_TOKEN_FILE` — path to a mounted file containing the token.

The service fails at startup when the path is not configured or the file is missing, unreadable
or empty. The credential is converted to `CredentialMaterial`; only the first 12 characters of
its SHA-256 digest are exposed as `display_version`. The raw token is registered with the
redaction layer and never stored in PostgreSQL, Kafka, logs, metrics or API responses.

## Account lifecycle

The `vk_provider_accounts` table contains the canonical `system-vk` account with one of these
states: `active`, `invalid`, `cooling_down`, or `disabled`.

| Event | Result |
|---|---|
| Startup and new credential digest | validate once through VK, then `active` or `invalid` |
| Startup and unchanged active digest | remain `active` without another validation |
| Authentication error during work | mark the credential version `invalid` and release work |
| Rate-limit cooldown | block claims until `cooldown_until` expires |
| File rotation | restart, validate the new digest, then reactivate the account |

The claim query and in-memory account gate both reject work while the account is not active.
There is no retry loop against an invalid credential.

## Token rotation

1. Validate a candidate file:

   ```bash
   uv run python scripts/validate_token.py validate-token --file ./secrets/vk_token_new
   ```

2. Replace the contents of the mounted production token file atomically.
3. Restart `vk-service`.
4. Verify `/health` and the `account-status` CLI command.
5. Confirm that the account is `active` and the displayed digest changed.

Rollback means restoring the previous token file contents and restarting the service. It does
not mean switching to an environment variable or bypassing provider-account validation.

## CLI

Run inside the service container:

```bash
uv run python scripts/validate_token.py <command>
```

| Command | Behavior |
|---|---|
| `validate-token --file <path>` | validates a candidate without modifying the active account |
| `account-status` | prints the persisted state of `system-vk` |

Exit codes are `0` for success, `1` for invalid credentials and `2` for configuration or
infrastructure errors. Output contains only account identity, display digest, status,
capabilities, validation time and sanitized errors.

## Scheduler

`FairScheduler` serializes requests per provider account and round-robins independent work lanes.
Retries are bounded by `VkRetryPolicy`; authentication failures are never retried. Rate-limit
codes apply account cooldowns and preserve queued work for later execution.

The supported topology is one canonical `system-vk` account. Scaling to multiple independent
provider accounts requires explicit account selection in the command contract and is outside the
current runtime.

## Metrics

| Metric | Labels |
|---|---|
| `vk_requests_total` | `account_id, method, outcome` |
| `vk_request_duration_seconds` | `account_id, method` |
| `vk_rate_limit_retries_total` | `account_id, code` |
| `vk_scheduler_queue_depth` | `account_id` |
| `vk_scheduler_wait_seconds` | `account_id` |
| `vk_account_status` | `account_id, status` |
| `vk_account_cooldown_seconds` | `account_id` |
| `vk_provider_account_info` | `account_id` plus credential digest info |

Raw credentials and full exception strings must never be included in labels, annotations or
traces.
