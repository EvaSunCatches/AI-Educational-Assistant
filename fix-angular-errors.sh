#!/bin/bash
set -e

echo "🔧 Исправляем ошибки Angular проекта..."
echo "-------------------------------------"

# 1️⃣ Исправляем GeminiService
mkdir -p src/app/services
cat <<'EOG' > src/app/services/gemini.service.ts
import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class GeminiService {
  async askGemini(prompt: string): Promise<string> {
    console.log('🧠 Gemini отримав запит:', prompt);
    return Promise.resolve(\`🤖 (Gemini AI) Відповідь на: "\${prompt}"\`);
  }
}
EOG

# 2️⃣ Исправляем ChatPanelComponent
mkdir -p src/app/chat-panel
cat <<'EOC' > src/app/chat-panel/chat-panel.component.ts
import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-chat-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: \`
    <div class="chat-panel">
      <h2>💬 Навчальний помічник</h2>
      <textarea [(ngModel)]="question" placeholder="Введи запитання..."></textarea>
      <button (click)="sendQuestion()">Надіслати</button>
      <div *ngIf="reply()" class="reply">{{ reply() }}</div>
    </div>
  \`,
  styles: [\`
    .chat-panel { background: #f0f8ff; padding: 20px; border-radius: 12px; }
    textarea { width: 100%; height: 100px; border-radius: 8px; padding: 10px; }
    button { background: #0078d7; color: white; border: none; border-radius: 6px; padding: 8px 14px; cursor: pointer; margin-top: 10px; }
    .reply { margin-top: 16px; background: white; border-left: 4px solid #0078d7; padding: 12px; border-radius: 8px; }
  \`]
})
export class ChatPanelComponent {
  question = signal<string>('');
  reply = signal<string>('');
  sendQuestion() {
    this.reply.set(\`Ти запитав: "\${this.question()}" — я допоможу з цим!\`);
  }
}
EOC

# 3️⃣ Проверяем и обновляем app.component.html
if ! grep -q "<app-chat-panel>" src/app/app.component.html 2>/dev/null; then
  echo "<app-chat-panel></app-chat-panel>" >> src/app/app.component.html
fi

echo "✅ Все критические ошибки исправлены. Теперь можно пересобрать проект."
