import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ChatPanelComponent } from './components/chat-panel/chat-panel.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, ChatPanelComponent],
  template: `
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
      <app-chat-panel></app-chat-panel>
    </main>
  `
})
export class AppComponent {}
