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
COMMIT="${2:-unknown}"
AUTHOR="${3:-unknown}"
DURATION="${4:-0}"
REPOSITORY="${5:-}"
WORKFLOW="${6:-}"
RUN_URL="${7:-}"
DEPLOYED_SERVICES="${8:-}"
FULL_DEPLOY="${9:-false}"

format_duration() {
  local seconds=$1
  local hours=$((seconds / 3600))
  local minutes=$(((seconds % 3600) / 60))
  local secs=$((seconds % 60))
  
  if [ $hours -gt 0 ]; then
    echo "${hours}h ${minutes}m ${secs}s"
  elif [ $minutes -gt 0 ]; then
    echo "${minutes}m ${secs}s"
  else
    echo "${secs}s"
  fi
}

send_telegram() {
  local message="$1"
  local bot_token="${TELEGRAM_BOT_TOKEN:-}"
  local chat_id="${TELEGRAM_CHAT_ID:-}"
  
  if [ -z "$bot_token" ] || [ -z "$chat_id" ]; then
    log_warn "Telegram credentials not configured"
    return 1
  fi
  
  local escaped_message=$(echo "$message" | sed 's/"/\\"/g' | sed "s/'/\\'/g")
  local payload=$(cat <<EOF
{
  "chat_id": "$chat_id",
  "text": "$escaped_message",
  "parse_mode": "HTML",
  "disable_web_page_preview": true
}
EOF
)
  
  if curl -s -X POST "https://api.telegram.org/bot${bot_token}/sendMessage" \
    -H "Content-Type: application/json" \
    -d "$payload" > /dev/null 2>&1; then
    log_info "Telegram notification sent"
    return 0
  else
    log_error "Failed to send Telegram notification"
    return 1
  fi
}

send_slack() {
  local message="$1"
  local webhook_url="${SLACK_WEBHOOK_URL:-}"
  
  if [ -z "$webhook_url" ]; then
    log_warn "Slack webhook URL not configured"
    return 1
  fi
  
  local escaped_message=$(echo "$message" | sed 's/"/\\"/g')
  local payload=$(cat <<EOF
{
  "text": "$escaped_message",
  "username": "Deployment Bot",
  "icon_emoji": ":rocket:"
}
EOF
)
  
  if curl -s -X POST "$webhook_url" \
    -H "Content-Type: application/json" \
    -d "$payload" > /dev/null 2>&1; then
    log_info "Slack notification sent"
    return 0
  else
    log_error "Failed to send Slack notification"
    return 1
  fi
}

build_message() {
  local emoji=""
  local status_text=""
  
  if [ "$STATUS" = "success" ]; then
    emoji="✅"
    status_text="Успешно"
  else
    emoji="❌"
    status_text="Ошибка"
  fi
  
  local duration_text=$(format_duration "$DURATION")
  local services_text=""
  
  if [ -n "$DEPLOYED_SERVICES" ] && [ "$DEPLOYED_SERVICES" != "none" ]; then
    services_text="\n📦 Обновленные сервисы: $DEPLOYED_SERVICES"
    if [ "$FULL_DEPLOY" = "true" ]; then
      services_text="${services_text} (полный деплой)"
    fi
  fi
  
  local run_url_text=""
  if [ -n "$RUN_URL" ]; then
    run_url_text="\n🔗 <a href=\"$RUN_URL\">Подробности деплоя</a>"
  fi
  
  cat <<EOF
${emoji} <b>Деплой: ${status_text}</b>

📝 Коммит: <code>${COMMIT}</code>
👤 Автор: ${AUTHOR}
⏱️ Длительность: ${duration_text}
📦 Репозиторий: ${REPOSITORY}
🔄 Workflow: ${WORKFLOW}${services_text}${run_url_text}
EOF
}

main() {
  local message=$(build_message)
  
  log_info "Sending deployment notification (status: $STATUS)"
  
  # Try Telegram first, then Slack
  if ! send_telegram "$message"; then
    if ! send_slack "$message"; then
      log_warn "No notification channels configured or all failed"
      echo "$message"
    fi
  fi
}

main "$@"
