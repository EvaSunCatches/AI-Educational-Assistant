#!/usr/bin/env bash
set -euo pipefail

echo "=== 0) Путь запуска: $(pwd) ==="

# 1) Бэкап текущих критических файлов (если есть)
mkdir -p repair_backup
echo "Backing up existing files (if present) -> repair_backup/"
cp -v src/app/app.module.ts src/app/app.component.ts src/app/app.component.html src/app/app.component.css \
      src/app/components/chat-panel/chat-panel.component.ts src/app/services/gemini.service.ts src/main.ts \
      repair_backup/ 2>/dev/null || true

# 2) Убедимся, что нужные папки есть
mkdir -p src/app/components/chat-panel
mkdir -p src/app/services
mkdir -p src/assets

# 3) Удалим потенциально конфликтующие дубликаты корневого уровня (перенесём в бэкап)
if [ -f src/app.component.ts ]; then
  echo "Moving stray src/app.component.ts -> repair_backup/"
  mv src/app.component.ts repair_backup/app.component.ts.bak
fi

if [ -f src/index.css ]; then
  echo "Removing stray src/index.css (we use src/styles.css)"
  rm -f src/index.css
fi

# 4) Записываем корректный GeminiService (демо-реализация — заменить на реальный API позже)
cat > src/app/services/gemini.service.ts <<'TS'
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class GeminiService {
  constructor() {}

  async askGemini(subject: string, text: string): Promise<string> {
    // Демоверсия — вернёт понятный ответ без реального запроса к API.
    return Promise.resolve(
      `⚠️ Демо-відповідь (немає API-ключа).\nПредмет: ${subject}\n\nЗапит:\n${text}`
    );
  }

  async solveFromUrl(subject: string): Promise<string> {
    const url = prompt('Вставте URL завдання (демо):');
    if (!url) return '⚠️ Посилання не вказане.';
    return this.askGemini(subject, `Розв'яжи задачу з URL: ${url}`);
  }

  async solveFromImage(subject: string): Promise<string> {
    const b64 = prompt('Вставте base64-код зображення (демо):');
    if (!b64) return '⚠️ Зображення не надано.';
    return this.askGemini(subject, `Розв'яжи задачу зі зображення (base64).`);
  }
}
TS

# 5) ChatPanelComponent (встроенный шаблон; поддерживает [(ngModel)] и кнопки)
cat > src/app/components/chat-panel/chat-panel.component.ts <<'TS'
import { Component } from '@angular/core';
import { GeminiService } from '../../services/gemini.service';

@Component({
  selector: 'app-chat-panel',
  template: \`
  <div class="card">
    <h2>AI Помічник (5 клас)</h2>

    <label>Введіть ваше завдання</label>
    <textarea [(ngModel)]="question" placeholder="Опишіть завдання..."></textarea>

    <label>Оберіть предмет</label>
    <select [(ngModel)]="subject">
      <option>Математика</option>
      <option>Українська мова</option>
      <option>Історія України</option>
    </select>

    <div class="controls">
      <button (click)="ask()">📘 Отримати допомогу</button>
      <button (click)="solveUrl()">🌐 Розв'язати по посиланню</button>
      <button (click)="solveImage()">🖼️ Розпізнати зображення</button>
      <input type="file" (change)="onFileSelected($event)" />
    </div>

    <div class="reply" *ngIf="reply">{{ reply }}</div>
  </div>
  \`,
  styles: [\`
    .card { max-width:800px; margin:20px auto; padding:18px; border-radius:12px; background:#ffffffd9; box-shadow:0 8px 24px rgba(0,0,0,0.06); }
    textarea { width:100%; min-height:120px; padding:10px; border-radius:8px; margin-top:8px; }
    select { width:100%; padding:8px; margin-top:8px; border-radius:6px; }
    .controls { margin-top:12px; }
    button { margin-right:8px; padding:8px 12px; border-radius:8px; cursor:pointer; }
    .reply { margin-top:14px; padding:12px; background:#f8fafc; border-left:4px solid #0284c7; white-space:pre-wrap; border-radius:6px; }
  \`]
})
export class ChatPanelComponent {
  question = '';
  reply = '';
  subject = 'Математика';

  constructor(private gemini: GeminiService) {}

  async ask() {
    this.reply = '⏳ Обробка...';
    this.reply = await this.gemini.askGemini(this.subject, this.question);
  }

  async solveUrl() {
    this.reply = '⏳ Обробка посилання...';
    this.reply = await this.gemini.solveFromUrl(this.subject);
  }

  async solveImage() {
    this.reply = '⏳ Обробка зображення...';
    this.reply = await this.gemini.solveFromImage(this.subject);
  }

  onFileSelected(event: any) {
    const f = event.target.files?.[0];
    if (!f) return;
    this.reply = \`📸 Файл "\${f.name}" завантажено (демо). Для реальної обробки треба передати base64 у сервіс.\`;
  }
}
TS

# 6) AppComponent (шапка + router-outlet)
cat > src/app/app.component.ts <<'TS'
import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  template: \`
    <header style="background:linear-gradient(90deg,#93c5fd,#fde68a);padding:14px;color:#042c58">
      <div style="max-width:1000px;margin:0 auto;display:flex;align-items:center;gap:12px">
        <img src="assets/avatar.png" alt="avatar" style="width:54px;height:54px;border-radius:50%;object-fit:cover" onerror="this.style.display='none'">
        <div>
          <div style="font-weight:600">AI Помічник — 5-й клас</div>
          <div style="font-size:0.85rem;opacity:0.85">Пояснення українською мовою</div>
        </div>
      </div>
    </header>
    <main style="padding:20px">
      <router-outlet></router-outlet>
    </main>
  \`
})
export class AppComponent {}
TS

# 7) AppRoutingModule (главная — ChatPanelComponent)
cat > src/app/app-routing.module.ts <<'TS'
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ChatPanelComponent } from './components/chat-panel/chat-panel.component';

const routes: Routes = [
  { path: '', component: ChatPanelComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
TS

# 8) AppModule (FormsModule импортирован; ChatPanelComponent и AppComponent зарегистрированы)
cat > src/app/app.module.ts <<'TS'
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { AppComponent } from './app.component';
import { ChatPanelComponent } from './components/chat-panel/chat-panel.component';
import { AppRoutingModule } from './app-routing.module';
import { GeminiService } from './services/gemini.service';

@NgModule({
  declarations: [AppComponent, ChatPanelComponent],
  imports: [BrowserModule, FormsModule, AppRoutingModule],
  providers: [GeminiService],
  bootstrap: [AppComponent]
})
export class AppModule {}
TS

# 9) main.ts (bootstrap через AppModule)
cat > src/main.ts <<'TS'
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppModule } from './app/app.module';

platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => console.error(err));
TS

# 10) Простейший styles.css (подключён в angular.json)
cat > src/styles.css <<'CSS'
/* Базовые стили (можно заменить Tailwind позже) */
:root { --accent: #0078d7; --bg: #f0f8ff; --card:#ffffffd9; }
body { margin:0; font-family: system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial; background:var(--bg); color:#042c58; }
CSS

# 11) Удалим старые / конфликтующие временные сборки
rm -rf dist .angular node_modules/.cache || true

# 12) Обновим angular.json стили и assets (на случай, если чего-то нет)
# (используем npx ng config, безопасно — если не сработает, продолжим билд)
npx ng config projects.app.architect.build.options.styles '["src/styles.css"]' 2>/dev/null || true
npx ng config projects.app.architect.build.options.assets '["src/assets"]' 2>/dev/null || true

# 13) Устанавливаем зависимости (если нужно)
npm install

# 14) Сборка production
echo "=== Building production (ng build --configuration production) ==="
npx ng build --configuration production

echo "=== Build finished. Проверьте папку dist/ и запустите локальный сервер (например: npx http-server dist) ==="
