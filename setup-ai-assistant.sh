#!/bin/bash
echo "⚙️  Полная настройка и авто-деплой AI Educational Assistant..."
echo "---------------------------------------------------------------"

# 1️⃣ Проверка и установка зависимостей
echo "📦 Проверяю и устанавливаю недостающие пакеты..."
npm install @angular/forms @angular/common angular-cli-ghpages --save-dev --force > /dev/null 2>&1

# 2️⃣ Очистка старых билдов
rm -rf dist .angular 2>/dev/null

# 3️⃣ Сборка проекта с правильным путём
echo "🚀 Выполняется сборка проекта..."
npx ng build --configuration production --base-href "/AI-Educational-Assistant/"

# Определяем реальную папку билда
BUILD_DIR=$(find dist -type d -name "ai-educational-assistant-for-5th-grade" | head -n 1)

if [ -z "$BUILD_DIR" ]; then
  echo "⚠️ Не найдена папка билда. Пробую fallback..."
  BUILD_DIR=$(find dist -type d -maxdepth 1 | head -n 1)
fi

if [ -z "$BUILD_DIR" ]; then
  echo "❌ Ошибка: не удалось найти сборку Angular."
  exit 1
fi

echo "📂 Найдена сборка: $BUILD_DIR"

# 4️⃣ Создаём .nojekyll и 404.html
touch "$BUILD_DIR/.nojekyll"
cp "$BUILD_DIR/index.html" "$BUILD_DIR/404.html" 2>/dev/null || true

# 5️⃣ Публикация на GitHub Pages
echo "🌐 Деплой на GitHub Pages..."
npx angular-cli-ghpages --dir="$BUILD_DIR" --no-silent || {
  echo "⚠️ angular-cli-ghpages не установлен — переустанавливаю..."
  npm install -g angular-cli-ghpages
  npx angular-cli-ghpages --dir="$BUILD_DIR"
}

# 6️⃣ Финальное сообщение
echo "✅ Готово! Сайт опубликован:"
echo "🔗 https://evasuncatches.github.io/AI-Educational-Assistant/"
