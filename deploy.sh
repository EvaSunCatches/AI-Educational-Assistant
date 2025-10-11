#!/bin/bash
echo "🌐 === AI Educational Assistant — авто-деплой на GitHub Pages (v2 с токеном) ==="

# 1️⃣ Проверяем, что мы в корне проекта
if [ ! -f "angular.json" ]; then
  echo "❌ Ошибка: запусти скрипт из корня Angular проекта (где angular.json)"
  exit 1
fi

# 2️⃣ Проверяем git-репозиторий
if [ ! -d ".git" ]; then
  echo "⚙️  Git-репозиторий не найден, инициализирую..."
  git init
  git remote add origin https://github.com/EvaSunCatches/AI-Educational-Assistant.git
fi

# 3️⃣ Проверяем токен GitHub
if ! git config --global credential.helper | grep -q "store"; then
  echo "🔐 GitHub токен не найден. Введи персональный токен:"
  echo "👉 Создай его на https://github.com/settings/tokens (Classic, с правами repo, workflow)"
  read -p "Твой токен: " GH_TOKEN
  echo "https://${GH_TOKEN}:x-oauth-basic@github.com" > ~/.git-credentials
  git config --global credential.helper store
  echo "✅ Токен сохранён в ~/.git-credentials"
else
  echo "🔑 GitHub токен уже сохранён — push будет выполняться без запроса пароля."
fi

# 4️⃣ Проверяем текущую ветку
current_branch=$(git branch --show-current 2>/dev/null)
if [ "$current_branch" != "main" ]; then
  echo "🔄 Переключаюсь на ветку main..."
  git checkout main 2>/dev/null || git checkout -b main
fi

# 5️⃣ Добавляем изменения в git
echo "🧾 Фиксирую последние изменения..."
git add .
git commit -m "Auto-deploy $(date '+%Y-%m-%d %H:%M:%S')" || echo "⚠️ Нет новых изменений для коммита."

# 6️⃣ Отправляем в GitHub
echo "📤 Отправляю изменения в GitHub (ветка main)..."
git push origin main || echo "⚠️ Не удалось выполнить push (проверь токен или доступ)."

# 7️⃣ Сборка проекта
echo "🧱 Сборка Angular проекта..."
rm -rf dist .angular
npx ng build --configuration production --base-href "/AI-Educational-Assistant/"

# 8️⃣ Проверка и подготовка для GitHub Pages
BUILD_DIR="dist/ai-educational-assistant-for-5th-grade"
if [ ! -d "$BUILD_DIR" ]; then
  BUILD_DIR="dist"
fi

touch "$BUILD_DIR/.nojekyll"
cp "$BUILD_DIR/index.html" "$BUILD_DIR/404.html" 2>/dev/null || true

# 9️⃣ Деплой на GitHub Pages
echo "🚀 Публикую на GitHub Pages..."
npx angular-cli-ghpages --dir="$BUILD_DIR" --no-silent || {
  echo "⚙️ Устанавливаю angular-cli-ghpages..."
  npm install -g angular-cli-ghpages
  npx angular-cli-ghpages --dir="$BUILD_DIR"
}

echo "✅ Готово! Сайт доступен по адресу:"
echo "🔗 https://evasuncatches.github.io/AI-Educational-Assistant/"
