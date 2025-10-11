import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { GeminiService } from '../services/gemini.service';

@Component({
  selector: 'chat-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
  <div class="chat-card">
    <h2>💬 AI Chat Assistant</h2>
    <textarea [(ngModel)]="question" placeholder="Запитай мене що завгодно..."></textarea>
    <button (click)="sendQuestion()" [disabled]="gemini.loading()">Відправити</button>
    
    <div class="loader" *ngIf="gemini.loading()">⌛ Обробка запиту...</div>
    <div class="reply" *ngIf="reply()">{{ reply() }}</div>
  </div>
  `,
  styles: [`
    .chat-card {
      background: #ffffff;
      border-radius: 16px;
      box-shadow: 0 6px 20px rgba(0,0,0,0.08);
      padding: 24px;
      max-width: 600px;
      margin: 0 auto;
      transition: all 0.3s ease-in-out;
    }
    .chat-card:hover { transform: translateY(-4px); box-shadow: 0 10px 25px rgba(0,0,0,0.1); }
    textarea { width: 100%; height: 100px; border-radius: 10px; padding: 12px; border: 1px solid #ccc; resize: none; font-size: 14px; }
    button { background: #0078d7; color: white; border: none; border-radius: 8px; padding: 10px 20px; cursor: pointer; margin-top: 12px; transition: 0.2s; }
    button:hover { background: #005fa3; }
    button:disabled { opacity: 0.6; cursor: not-allowed; }
    .loader { margin-top: 12px; color: #555; font-style: italic; }
    .reply { margin-top: 16px; background: #f0f8ff; border-left: 4px solid #0078d7; padding: 14px; border-radius: 8px; text-align: left; }
  `]
})
export class ChatPanelComponent {
  question = signal<string>('');
  reply = signal<string>('');
  constructor(public gemini: GeminiService) {}

  async sendQuestion() {
    const q = this.question().trim();
    if (!q) {
      this.reply.set('⚠️ Введіть питання.');
      return;
    }
    const answer = await this.gemini.askGemini(q);
    this.reply.set(answer);
    this.question.set('');
  }
}
