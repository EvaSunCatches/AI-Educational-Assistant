import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { ChatPanelComponent } from './chat-panel/chat-panel.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, ChatPanelComponent],
  template: `
    <main class="app-container">
      <h1>🎓 AI Educational Assistant for 5th Grade</h1>
      <chat-panel></chat-panel>
    </main>
  `,
  styles: [`
    .app-container {
      font-family: 'Segoe UI', Roboto, sans-serif;
      padding: 40px;
      background: linear-gradient(180deg, #f5f9ff, #eaf3ff);
      min-height: 100vh;
      text-align: center;
    }
    h1 {
      color: #0078d7;
      margin-bottom: 32px;
      font-weight: 600;
      text-shadow: 1px 1px 2px rgba(0,0,0,0.05);
    }
  `]
})
export class AppComponent {
  title = signal('AI Educational Assistant');
}
