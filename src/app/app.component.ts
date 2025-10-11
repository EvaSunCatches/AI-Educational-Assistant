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
