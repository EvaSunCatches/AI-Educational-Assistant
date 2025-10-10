#!/bin/bash
echo "====================================="
echo "🧰 ANGULAR PROJECT DIAGNOSTICS REPORT"
echo "====================================="
echo

### 1️⃣ Проверка текущей директории
echo "📍 Текущая директория:"
pwd
echo

### 2️⃣ Проверка основных файлов проекта
echo "🔍 Проверка структуры проекта..."
ls -R | grep -E "angular.json|package.json|src|tsconfig|app|assets"
echo

### 3️⃣ Проверка наличия Angular CLI
echo "🧩 Проверка Angular CLI..."
cat package.json | grep "@angular/cli" || echo "⚠️ Angular CLI не найден в package.json"
echo

### 4️⃣ Проверка конфигурации Angular
if command -v jq >/dev/null 2>&1; then
  echo "🧱 Проверка angular.json (projects)..."
  cat angular.json | jq '.projects'
else
  echo "⚠️ jq не установлен. Для анализа JSON установи: brew install jq"
fi
echo

### 5️⃣ Проверка исходников
echo "📂 Проверка SRC..."
ls -R src/
echo

### 6️⃣ Проверка импортов и относительных путей
echo "🧠 Проверка импортов в src..."
grep -r "from './" src/ | grep -v node_modules || echo "✅ Импорты выглядят корректно"
echo

### 7️⃣ Проверка tsconfig.json
echo "🧮 Проверка TSCONFIG..."
grep "compilerOptions" -A 20 tsconfig.json
echo

### 8️⃣ Проверка сборки
echo "⚡ Проверка сборки (development)..."
npx ng build --configuration development || echo "❌ Ошибка сборки!"
echo

### 9️⃣ Проверка запуска dev-сервера
echo "🚀 Проверка запуска приложения..."
npx ng serve --open
