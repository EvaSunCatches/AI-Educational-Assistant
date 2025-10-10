import { Component } from '@angular/core';
import { GeminiService } from './services/gemini.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html'
})
export class AppComponent {
  activeTab: string = 'link';
  subject: string = 'Математика';
  bookUrl: string = '';
  section: string = '';
  page: string = '';
  task: string = '';
  response: string = '';

  constructor(private geminiService: GeminiService) {}

  async getHelp() {
    const prompt = `Учень 5-го класу. Предмет: ${this.subject}. 
    URL: ${this.bookUrl || 'немає'}.
    Розділ: ${this.section}, сторінка: ${this.page}, завдання: ${this.task}.
    Поясни рішення простою мовою.`;

    try {
      this.response = '🔄 Обробка запиту...';
      const result = await this.geminiService.askGemini(prompt);
      this.response = result || 'Вибачте, не вдалося отримати відповідь.';
    } catch (err) {
      this.response = 'Помилка при отриманні відповіді.';
      console.error(err);
    }
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.response = `📸 Фото "${file.name}" завантажено. 
      Аналіз триває...`;
      // тут можна додати логіку для розпізнавання через Gemini Vision API
    }
  }
}