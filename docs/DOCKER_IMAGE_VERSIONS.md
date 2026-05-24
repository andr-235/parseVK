# Docker image versions

Docker images are pinned to explicit version tags so deployments do not change
silently after `docker compose pull` or image rebuilds.

## Pinned images

| Component | Image tag |
| --- | --- |
| PostgreSQL 15 deploy databases and backup image | `postgres:15.18-alpine` |
| PostgreSQL 16 local service databases | `postgres:16.14` |
| Redis | `redis:7.4.9-alpine` |
| Kafka | `apache/kafka:4.1.0` |
| Prometheus | `prom/prometheus:v3.11.3` |
| Node Exporter | `prom/node-exporter:v1.11.1` |
| Grafana | `grafana/grafana:13.0.1-security-01` |
| Bun API build/runtime | `oven/bun:1.3.14` |
| Bun frontend build | `oven/bun:1.3.14-alpine` |
| Nginx frontend runtime | `nginx:1.30.2-alpine` |
| Python service base image | `python:3.12.13-slim` |

## Update policy

Do not use `latest`, major-only, or distro-only tags for deployment images or
Dockerfile base images. Version updates should be made in a normal pull request
that includes:

- the image tags being changed;
- a short reason for the update, such as a security fix or planned dependency
  refresh;
- `docker compose config --quiet` validation for changed compose files.
