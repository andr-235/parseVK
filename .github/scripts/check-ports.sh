#!/bin/bash
set -euo pipefail

PORT_ERROR=0

check_port() {
  local port=$1
  local service=$2
  local is_critical=${3:-false}
  
  if command -v netstat > /dev/null 2>&1; then
    if netstat -tuln 2>/dev/null | grep -q ":$port "; then
      if [ "$is_critical" = "true" ]; then
        echo "Error: Port $port ($service) is already in use and is critical"
        PORT_ERROR=1
        return 1
      else
        echo "Warning: Port $port is already in use (may be from previous deployment)"
        return 0
      fi
    fi
  elif command -v ss > /dev/null 2>&1; then
    if ss -tuln 2>/dev/null | grep -q ":$port "; then
      if [ "$is_critical" = "true" ]; then
        echo "Error: Port $port ($service) is already in use and is critical"
        PORT_ERROR=1
        return 1
      else
        echo "Warning: Port $port is already in use (may be from previous deployment)"
        return 0
      fi
    fi
  fi
  echo "Port $port ($service) is available"
  return 0
}

echo "=== Checking port availability ==="

check_port 3000 "API" true
check_port 8080 "Frontend" true

if [ $PORT_ERROR -eq 1 ]; then
  echo "Error: Critical ports are in use. Please stop conflicting services."
  exit 1
fi

echo "All critical ports are available"

