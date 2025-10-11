#!/bin/bash
echo "=== 🤖 Полное развёртывание AI Educational Assistant ==="

# 1️⃣ Проверяем наличие зависимостей
npm install @angular/forms @angular/common @angular/router @angular/animations --force

# 2️⃣ Создаём GeminiService
cat << 'EOC' > src/app/services/gemini.service.ts
import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class GeminiService {
  async askGemini(prompt: string): Promise<string> {
    console.log("GeminiService.askGemini() called with:", prompt);
    return Promise.resolve(`🤖 Відповідь Gemini: "${prompt.slice(0, 80)}..."`);
  }
}
EOC

# 3️⃣ Создаём ChatPanelComponent
cat << 'EOC' > src/app/components/chat-panel/chat-panel.component.ts
import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GeminiService } from '../../services/gemini.service';

@Component({
  selector: 'app-chat-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: \`
  <div class="chat-card">
    <h2>💬 AI Помічник</h2>
    <textarea [(ngModel)]="question" placeholder="Введіть своє запитання..." class="input"></textarea>
    <button (click)="sendQuestion()">Надіслати</button>
    <div *ngIf="reply()" class="reply">{{ reply() }}</div>
  </div>
  \`,
  styles: [\`
    .chat-card { max-width:600px; margin:40px auto; background:#f0f8ff; border-radius:12px; padding:20px; box-shadow:0 2px 10px rgba(0,0,0,0.1); }
    textarea.input { width:100%; height:120px; padding:10px; border-radius:8px; border:1px solid #ccc; margin-bottom:10px; }
    button { background:#0078d7; color:#fff; border:none; border-radius:6px; padding:10px 20px; cursor:pointer; }
    button:hover { background:#005fa3; }
    .reply { margin-top:16px; background:#fff; padding:12px; border-left:4px solid #0078d7; border-radius:8px; white-space:pre-line; }
  \`]
})
export class ChatPanelComponent {
  question = signal<string>('');
  reply = signal<string>('');

  constructor(private gemini: GeminiService) {}

  async sendQuestion() {
    const q = this.question().trim();
    if (!q) return;
    this.reply.set('🔄 Обробка запиту...');
    const res = await this.gemini.askGemini(q);
    this.reply.set(res);
  }
}
EOC

# 4️⃣ Главный компонент приложения
cat << 'EOC' > src/app/app.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChatPanelComponent } from './components/chat-panel/chat-panel.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, ChatPanelComponent],
  template: \`
    <header style="background:#2563eb;color:white;padding:20px;border-radius:0 0 12px 12px;box-shadow:0 2px 6px rgba(0,0,0,0.2);">
      <h1 style="margin:0;font-size:1.8rem;">AI Помічник — 5-й клас 🇺🇦</h1>
      <p style="margin:0;font-size:1rem;opacity:0.9;">Пояснення навчальних завдань простою мовою</p>
    </header>
    <main><app-chat-panel></app-chat-panel></main>
  \`
})
export class AppComponent {}
EOC

# 5️⃣ main.ts
cat << 'EOC' > src/main.ts
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
bootstrapApplication(AppComponent).catch(err => console.error(err));
EOC

# 6️⃣ Сборка и деплой
echo "=== ⚙️ Сборка проекта ==="
rm -rf dist .angular
npx ng build --configuration production --base-href "/AI-Educational-Assistant/"

echo "=== 📦 Коммит и пуш в main ==="
git add .
git commit -m "Auto full deploy $(date)" || true
git push origin main

echo "=== 🌐 Публикация на GitHub Pages ==="
npx angular-cli-ghpages --dir=dist/ai-educational-assistant-for-5th-grade --no-silent

echo "✅ Успешно! Проверь сайт:"
echo "🔗 https://evasuncatches.github.io/AI-Educational-Assistant/"
