import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class GeminiService {
  async askGemini(prompt: string): Promise<string> {
    console.log("GeminiService.askGemini() called with:", prompt);
    return Promise.resolve(`🤖 Відповідь Gemini: "${prompt.slice(0, 80)}..."`);
  }
}
