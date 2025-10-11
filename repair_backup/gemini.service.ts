import { Injectable } from '@angular/core';
import { signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class GeminiService {
  loading = signal(false);
  lastAnswer = signal<string>('');

  async askGemini(question: string): Promise<string> {
    this.loading.set(true);
    try {
      // Симуляция ответа от модели Gemini
      await new Promise(r => setTimeout(r, 1200));
      const reply = `🤖 (Gemini AI) Відповідь на: "${question}" — навчимося цьому разом!`;
      this.lastAnswer.set(reply);
      return reply;
    } finally {
      this.loading.set(false);
    }
  }
}
