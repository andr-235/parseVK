#!/bin/bash
set -euo pipefail

# Source logging helper if available
if [ -f "$(dirname "$0")/log-helper.sh" ]; then
  source "$(dirname "$0")/log-helper.sh"
else
  log_info() { echo "[INFO] $1"; }
  log_error() { echo "[ERROR] $1" >&2; }
  log_warn() { echo "[WARN] $1"; }
fi

STATUS="${1:-unknown}"
DURATION="${2:-0}"
COMMIT="${3:-unknown}"
DEPLOYED_SERVICES="${4:-}"
FULL_DEPLOY="${5:-false}"
METRICS_FILE="${6:-/opt/parseVK/.deployment-metrics.prom}"

# Prometheus metrics format
cat >> "$METRICS_FILE" <<EOF
# HELP deployment_duration_seconds Deployment duration in seconds
# TYPE deployment_duration_seconds gauge
deployment_duration_seconds{status="$STATUS",full_deploy="$FULL_DEPLOY"} $DURATION

# HELP deployment_total Total number of deployments
# TYPE deployment_total counter
deployment_total{status="$STATUS"} 1

# HELP deployment_last_timestamp Timestamp of last deployment
# TYPE deployment_last_timestamp gauge
deployment_last_timestamp{status="$STATUS"} $(date +%s)
EOF

log_info "Exported deployment metrics to $METRICS_FILE"

# If Prometheus is available, try to push metrics
PROMETHEUS_URL="${PROMETHEUS_URL:-http://localhost:9090}"
if curl -s -f -m 5 "$PROMETHEUS_URL/-/healthy" > /dev/null 2>&1; then
  log_info "Prometheus is available, metrics will be scraped"
else
  log_warn "Prometheus is not available, metrics saved to file only"
fi
