import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class GeminiService {

  constructor() {}

  async askQuestion(subject: string, question: string): Promise<string> {
    console.log(`🧠 Запитання по темі: ${subject}`);
    return `🤖 Відповідь: Я думаю, що "${question}" — це чудове запитання! Але поки що я працюю в демо-режимі 🧩`;
  }

  async solveFromUrl(subject: string): Promise<string> {
    console.log(`🌍 Обробка посилання по темі: ${subject}`);
    return `🔗 Демо-режим: Аналізую посилання для предмету "${subject}"...`;
  }

  async solveFromImage(subject: string): Promise<string> {
    console.log(`🖼️ Аналіз зображення для теми: ${subject}`);
    return `📷 Демо-відповідь: Поки що обробка зображень недоступна 😅`;
  }
}
