import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-chat-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="chat-panel">
      <h2>💬 AI Освітній Помічник</h2>
      <textarea
        placeholder="Введіть своє запитання..."
        [(ngModel)]="question"
      ></textarea>
      <button (click)="sendQuestion()">Надіслати</button>

      <div class="reply" *ngIf="reply()">
        <strong>AI:</strong> {{ reply() }}
      </div>
    </div>
  `,
  styles: [`
    .chat-panel { background:#f8fafc; padding:20px; border-radius:12px; box-shadow:0 2px 6px rgba(0,0,0,0.08); }
    textarea { width:100%; height:100px; border-radius:8px; padding:10px; border:1px solid #cbd5e1; }
    button { background:#2563eb; color:#fff; border:none; border-radius:6px; padding:8px 14px; cursor:pointer; margin-top:10px; }
    .reply { margin-top:16px; background:white; border-left:4px solid #2563eb; padding:12px; border-radius:8px; }
  `]
})
export class ChatPanelComponent {
  question = signal<string>('');
  reply = signal<string>('');

  sendQuestion() {
    const q = this.question().trim();
    if (!q) return;
    this.reply.set(`Ти запитав: "${q}" — зараз поясню!`);
  }
}
