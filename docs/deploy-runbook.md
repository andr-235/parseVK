# Deploy Runbook

## Overview

Production deployment runs via GitHub Actions self-hosted runner on the Debian server. Triggered by successful CI push to `main`.

## Pre-deployment Checklist

- [ ] `.env` exists on server (`/opt/parseVK/.env`)
- [ ] Docker volumes exist: `docker volume ls | grep parsevk`
- [ ] Server has access to: Docker Hub, GHCR, PyPI (for `pip install uv`)
- [ ] Server has `jq` and `curl` installed

## Deployment Flow

1. GitHub Actions workflow (`deploy.yml`) triggers on CI success
2. `Checkout code` → fetches the target commit
3. `Load deployment metadata` → reads `.deployment-metadata.json`
4. `Update code` → `git checkout -f` to target commit
5. `Production preflight` → validates env, compose config, registry access, PyPI
6. `Detect changed services` → diffs against last deployed commit
7. `Build and start containers` → builds changed services, then `docker compose up -d`
8. `Update deployment metadata` → records successful commit

## Changed Services Detection

The workflow detects which services need rebuilding by comparing against the last successful deploy:

| Pattern | Service(s) rebuilt |
|---------|-------------------|
| `front/`, `docker/frontend.*` | `frontend` |
| `docker/db-backup/` | `db_backup` |
| `services/api-gateway/` | `api-gateway` |
| `services/identity-service/` | `identity-service`, `identity-migrate`, `identity-seed-admin` |
| `services/tasks-service/` | `tasks-service`, `tasks-migrate` |
| `services/vk-service/` | `vk-service`, `vk-migrate` |
| `services/content-service/` | `content-service`, `content-migrate` |
| `services/moderation-service/` | `moderation-service`, `moderation-migrate` |
| `services/telegram-service/` | `telegram-service` |
| `services/im-service/` | `im-service`, `im-migrate` |
| First deploy (no previous commit) | All of the above |

## Troubleshooting

### Build fails with "Process completed with exit code 1"

1. Check GitHub Actions logs for the specific error
2. Common causes:
   - **PyPI unreachable** → verify `curl https://pypi.org/simple/uv/` on server
   - **Docker Hub rate limit** → wait and retry
   - **Build timeout** → increase `timeout-minutes` in deploy.yml
3. Manual rebuild: SSH to server, `cd /opt/parseVK && docker compose build <service>`

### Container fails to start

1. Check logs: `docker compose logs --tail=50 <service>`
2. Verify `.env` has all required variables
3. Check port conflicts: `ss -tlnp | grep <port>`

## Manual Deploy

```bash
./deploy.sh USER@SERVER_HOST
```
