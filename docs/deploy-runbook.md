[← Testing](testing.md) · [Back to README](../README.md) · [Design System →](design.md)

# Deploy Runbook

## Production model

Production runs on a self-hosted Debian runner in the local network. Application images are built on that server from the exact validated semantic-release commit. Deploy and rollback do not require GHCR or Docker Hub access.

The fixed invariants are:

- CI and Security run on GitHub-hosted runners;
- production accepts only the latest reachable `chore(release): ... [skip ci]` commit;
- application images are built locally with persistent Docker/BuildKit cache;
- external pulls are disabled by default;
- every healthy deployment is snapshotted under local immutable tags;
- rollback activates saved local images and never rebuilds them;
- Compose starts releases with `--no-build --pull never`;
- Alembic downgrade is never automatic.

## Required server state

- repository checkout: `/opt/parseVK`;
- production environment: `/opt/parseVK/.env`;
- Docker Engine and Docker Compose;
- `git`, `jq`, `python3`, `awk`, `df`;
- required external Docker networks;
- all pinned base/runtime images already present locally;
- enough free space for a new build while current and previous releases remain protected.

Default storage thresholds:

| Variable | Default |
|---|---:|
| `PRODUCTION_MIN_FREE_PROJECT_GB` | 10 GiB |
| `PRODUCTION_MIN_FREE_DOCKER_GB` | 15 GiB |

Set these values in `/opt/parseVK/.env` when the server requires different limits. The same server-side values are used by deploy and the scheduled integrity check. Rollback validates the target manifest and local image IDs but deliberately skips the build-space threshold because it does not build images.

## Release flow

1. Merge commit passes incremental CI.
2. Semantic Release creates the version commit.
3. Full Release CI and Security validate the exact release SHA.
4. Release Deploy Coordinator dispatches production deploy.
5. The self-hosted runner loads deployment metadata.
6. The currently running release is refreshed as a local rollback snapshot.
7. Production preflight validates Compose, networks, local runtime/base images, disk space and rollback integrity.
8. Service catalog determines changed build targets.
9. Changed application images are built locally.
10. A complete candidate manifest snapshots every application image.
11. Compose starts the candidate with `--no-build --pull never`.
12. Container and HTTP health checks run.
13. The candidate is promoted and deployment metadata rotates current/previous releases.

No application image is downloaded from GHCR during this flow.

## Local release files

Runtime state is stored outside Git history:

```text
/opt/parseVK/.deployment-metadata.json
/opt/parseVK/.releases/<commit>/release.json
```

Image tags use:

```text
parsevk-release/<service>:sha-<commit>
```

The manifest records the active tag, immutable release tag and Docker image ID for every build target. Integrity validation rejects missing targets, empty image maps, incorrect commit/status fields and incomplete image records.

## Rollback

Rollback without an explicit SHA selects `previous_successful_commit`.

The workflow:

1. validates the exact target successful manifest and its complete service coverage;
2. confirms every local immutable tag still points to the recorded image ID;
3. retags those images as active Compose images;
4. starts only runtime services with `--no-build --pull never`;
5. performs health checks;
6. rotates deployment metadata only after success.

Rollback does not run old migration/init jobs, does not perform database downgrade and is not blocked merely because free space fell below the build threshold.

## Production integrity workflow

`Production Integrity` runs daily and can be started manually. It is read-only and checks:

- free space on the project and Docker filesystems;
- validity and field types of deployment metadata;
- complete current and previous successful manifests relative to the service catalog;
- existence and image-ID match of rollback tags.

It never runs build, pull, login, promote, activate or cleanup commands.

## Troubleshooting

### Insufficient disk space

Inspect storage without deleting release images:

```bash
df -h /opt/parseVK
docker info --format '{{.DockerRootDir}}'
docker system df
```

Do not remove tags referenced by current or previous deployment metadata. Cache cleanup must be deliberate and outside an active deploy.

### Missing base image

The deploy fails before stopping the healthy release. Seed the exact pinned image on the server, then rerun the latest-release deployment. Do not enable external pulls as a permanent workaround.

### Broken rollback set

Run the manual `Production Integrity` workflow. Check:

```bash
cat /opt/parseVK/.deployment-metadata.json
find /opt/parseVK/.releases -maxdepth 3 -name release.json -print
docker image ls 'parsevk-release/*'
```

Restore the missing local image/tag before deploying another release.

### Build failure

The current release remains running until candidate startup. Review the failed build logs and confirm that the required dependency layers are available in the local BuildKit cache.

## See also

- [Configuration](configuration.md)
- [Testing](testing.md)
