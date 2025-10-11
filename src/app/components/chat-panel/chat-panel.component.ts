import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GeminiService } from '../../services/gemini.service';

@Component({
  selector: 'app-chat-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
  <div class="chat-card">
    <h2>💬 AI Помічник</h2>
    <textarea [(ngModel)]="question" placeholder="Введіть своє запитання..." class="input"></textarea>
    <button (click)="sendQuestion()">Надіслати</button>
    <div *ngIf="reply()" class="reply">{{ reply() }}</div>
  </div>
  `,
  styles: [`
    .chat-card { max-width:600px; margin:40px auto; background:#f0f8ff; border-radius:12px; padding:20px; box-shadow:0 2px 10px rgba(0,0,0,0.1); }
    textarea.input { width:100%; height:120px; padding:10px; border-radius:8px; border:1px solid #ccc; margin-bottom:10px; }
    button { background:#0078d7; color:#fff; border:none; border-radius:6px; padding:10px 20px; cursor:pointer; }
    button:hover { background:#005fa3; }
    .reply { margin-top:16px; background:#fff; padding:12px; border-left:4px solid #0078d7; border-radius:8px; white-space:pre-line; }
  `]
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
