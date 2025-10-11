import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class GeminiService {
  constructor() {}

  async askGemini(subject: string, text: string): Promise<string> {
    // Демоверсия — вернёт понятный ответ без реального запроса к API.
    return Promise.resolve(
      `⚠️ Демо-відповідь (немає API-ключа).\nПредмет: ${subject}\n\nЗапит:\n${text}`
    );
  }

  async solveFromUrl(subject: string): Promise<string> {
    const url = prompt('Вставте URL завдання (демо):');
    if (!url) return '⚠️ Посилання не вказане.';
    return this.askGemini(subject, `Розв'яжи задачу з URL: ${url}`);
  }

  async solveFromImage(subject: string): Promise<string> {
    const b64 = prompt('Вставте base64-код зображення (демо):');
    if (!b64) return '⚠️ Зображення не надано.';
    return this.askGemini(subject, `Розв'яжи задачу зі зображення (base64).`);
  }
}
