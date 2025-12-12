#!/bin/bash

# Скрипт для локального обновления версий в package.json перед созданием тега
# Использование: ./scripts/bump-version.sh <version>
# Пример: ./scripts/bump-version.sh 0.3.7

set -e

VERSION="$1"

if [ -z "$VERSION" ]; then
  echo "Ошибка: Укажите версию"
  echo "Использование: $0 <version>"
  echo "Пример: $0 0.3.7"
  exit 1
fi

# Проверка формата версии
if ! echo "$VERSION" | grep -qE '^[0-9]+\.[0-9]+\.[0-9]+$'; then
  echo "Ошибка: Неверный формат версии. Ожидается формат X.Y.Z (например, 0.3.7)"
  exit 1
fi

echo "Обновление версий до $VERSION..."

# Обновление версии в api/package.json
if [ -f "api/package.json" ]; then
  cd api
  npm version "$VERSION" --no-git-tag-version
  cd ..
  echo "✓ Обновлен api/package.json"
else
  echo "⚠ Предупреждение: api/package.json не найден"
fi

# Обновление версии в front/package.json
if [ -f "front/package.json" ]; then
  cd front
  npm version "$VERSION" --no-git-tag-version
  cd ..
  echo "✓ Обновлен front/package.json"
else
  echo "⚠ Предупреждение: front/package.json не найден"
fi

# Обновление версии в корневом package.json
if [ -f "package.json" ]; then
  node -e "
    const fs = require('fs');
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    pkg.version = '$VERSION';
    fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
  "
  echo "✓ Обновлен package.json (корневой)"
else
  echo "⚠ Предупреждение: package.json не найден"
fi

echo ""
echo "✅ Все версии обновлены до $VERSION"
echo ""
echo "Следующие шаги:"
echo "1. Проверьте изменения: git diff"
echo "2. Закоммитьте изменения: git add api/package.json front/package.json package.json && git commit -m 'chore: bump version to $VERSION'"
echo "3. Создайте тег: git tag -a v$VERSION -m 'Release v$VERSION'"
echo "4. Запушьте изменения и тег: git push origin main && git push origin v$VERSION"
