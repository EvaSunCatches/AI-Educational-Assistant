import { Component } from '@angular/core';
import { GeminiService } from './gemini.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'AI Освітній Асистент';
  currentSubject = 'Математика';
  reply: string = '';

  constructor(private geminiService: GeminiService) {}

  async askQuestion() {
    const text = prompt('Введи своє запитання 👇');
    if (!text) return;
    this.reply = '⏳ Зачекай, думаю...';
    this.reply = await this.geminiService.askQuestion(this.currentSubject, text);
  }

  async solveFromUrl() {
    this.reply = '🔗 Обробляю посилання...';
    this.reply = await this.geminiService.solveFromUrl(this.currentSubject);
  }

  async solveFromImage() {
    this.reply = '🖼️ Аналізую зображення...';
    this.reply = await this.geminiService.solveFromImage(this.currentSubject); 
  }
}
