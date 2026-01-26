#!/bin/bash
# Helper functions for structured logging in CI/CD

log_info() {
  local message="$1"
  local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
  echo "[$timestamp] [INFO] $message"
}

log_error() {
  local message="$1"
  local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
  echo "[$timestamp] [ERROR] $message" >&2
}

log_warn() {
  local message="$1"
  local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
  echo "[$timestamp] [WARN] $message"
}

log_step_start() {
  local step_name="$1"
  local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
  echo "[$timestamp] [STEP_START] $step_name"
  echo "STEP_START_${step_name}=$(date +%s)" >> "$GITHUB_ENV"
}

log_step_end() {
  local step_name="$1"
  local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
  local start_var="STEP_START_${step_name}"
  local start_time="${!start_var:-$(date +%s)}"
  local end_time=$(date +%s)
  local duration=$((end_time - start_time))
  echo "[$timestamp] [STEP_END] $step_name (duration: ${duration}s)"
}

retry_with_backoff() {
  local max_attempts="${1:-3}"
  local delay="${2:-2}"
  local command="${@:3}"
  local attempt=0
  local last_error=""
  
  while [ $attempt -lt $max_attempts ]; do
    if eval "$command"; then
      return 0
    else
      last_error=$?
      attempt=$((attempt + 1))
      if [ $attempt -lt $max_attempts ]; then
        log_warn "Command failed (attempt $attempt/$max_attempts), retrying in ${delay}s..."
        sleep $delay
        delay=$((delay * 2))  # Exponential backoff
      fi
    fi
  done
  
  log_error "Command failed after $max_attempts attempts"
  return $last_error
}
