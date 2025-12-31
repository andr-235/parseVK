#!/bin/bash

# Скрипт для запуска системы мониторинга ParseVK

echo "🚀 Запуск системы мониторинга ParseVK..."

# Запуск сервисов мониторинга
docker-compose -f docker-compose.deploy.yml up -d prometheus grafana node-exporter

echo "✅ Сервисы запущены!"
echo ""
echo "📊 Доступ к сервисам:"
echo "  Prometheus: http://localhost:9090"
echo "  Grafana:    http://localhost:3001 (admin/admin123)"
echo "  Node Exp.:  http://localhost:9100"
echo ""
echo "📈 Метрики API: http://localhost:3000/api/metrics"
echo ""
echo "🛑 Для остановки: docker-compose down"
