#!/bin/bash
set -euo pipefail

PORT_ERROR=0

check_port() {
  local port=$1
  local service=$2
  local is_critical=${3:-false}
  
  # Проверяем, занят ли порт Docker-контейнерами
  local docker_using_port=false
  if command -v docker > /dev/null 2>&1; then
    if docker ps --format "{{.Ports}}" 2>/dev/null | grep -q ":$port->" || \
       docker ps -a --format "{{.Ports}}" 2>/dev/null | grep -q ":$port->"; then
      docker_using_port=true
      echo "Port $port ($service) is used by Docker containers (will be released after stop)"
      return 0
    fi
  fi
  
  # Проверяем системные порты
  if command -v netstat > /dev/null 2>&1; then
    if netstat -tuln 2>/dev/null | grep -q ":$port "; then
      if [ "$is_critical" = "true" ] && [ "$docker_using_port" = "false" ]; then
        echo "Error: Port $port ($service) is already in use by non-Docker process and is critical"
        PORT_ERROR=1
        return 1
      else
        echo "Warning: Port $port is already in use (may be from previous deployment)"
        return 0
      fi
    fi
  elif command -v ss > /dev/null 2>&1; then
    if ss -tuln 2>/dev/null | grep -q ":$port "; then
      if [ "$is_critical" = "true" ] && [ "$docker_using_port" = "false" ]; then
        echo "Error: Port $port ($service) is already in use by non-Docker process and is critical"
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
  echo "Error: Critical ports are in use by non-Docker processes. Please stop conflicting services."
  exit 1
fi

echo "All critical ports are available or will be released after container stop"

