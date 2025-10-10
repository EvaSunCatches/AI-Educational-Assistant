import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class GeminiService {
  private apiKey = 'YOUR_API_KEY_HERE'; // 🔑 вставь сюда свой ключ Gemini API
  private apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

  constructor() {}

  async askQuestion(subject: string, question: string): Promise<string> {
    try {
      const response = await fetch(`${this.apiUrl}?key=${this.apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: `Subject: ${subject}\nQuestion: ${question}` }],
            },
          ],
        }),
      });

      const data = await response.json();
      return data?.candidates?.[0]?.content?.parts?.[0]?.text || '⚠️ No response from Gemini API.';
    } catch (error) {
      console.error('Gemini API error:', error);
      return '❌ Failed to connect to Gemini API.';
    }
  }

  async solveFromUrl(subject: string): Promise<string> {
    const url = prompt('🔗 Вставьте ссылку на задачу:');
    if (!url) return '⚠️ Не указана ссылка.';
    const question = `Solve this ${subject} problem from the following URL: ${url}`;
    return await this.askQuestion(subject, question);
  }

  async solveFromImage(subject: string): Promise<string> {
    const imageBase64 = prompt('🖼️ Вставьте base64 код изображения:');
    if (!imageBase64) return '⚠️ Изображение не предоставлено.';
    const question = `Solve this ${subject} problem using this image (base64 encoded).`;
    return await this.askQuestion(subject, question);
  }
}
