import { Injectable, signal } from '@angular/core';
import { GoogleGenAI, GenerateContentResponse, Type, Part, GenerationConfig } from '@google/genai';
import { ChatMessage } from '../models/chat.model';

export type SolutionRequestDetails = 
  | { mode: 'url', url: string, chapter: string, page: string, task: string } 
  | { mode: 'image', task: string, imageBase64: string };

@Injectable({
  providedIn: 'root',
})
export class GeminiService {
  private ai: GoogleGenAI | null = null;
  public error = signal<string | null>(null);

  /**
   * The maximum number of messages to include in the chat history for context.
   * This helps control API costs by limiting token usage.
   */
  private readonly CHAT_HISTORY_LIMIT = 10;

  constructor() {
    try {
      // The API key is sourced from environment variables, as per the guidelines.
      this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    } catch (e) {
      console.error('Failed to initialize GoogleGenAI:', e);
      this.error.set('Не вдалося ініціалізувати Google AI. Перевірте ключ API.');
    }
  }

  private generateBasePrompt(subject: string): string {
    return `Ви - експертний, терплячий та детальний репетитор для учня 5-го класу в Україні. Ваша основна мова для всіх пояснень - українська.

Предмет: ${subject}
Клас: 5-й

Завдання: Проаналізуйте наданий текст завдання.

**Формат виводу:**
1.  **Повторення умови завдання:** Спочатку дослівно повторіть повну умову завдання, яке ви розв'язуєте. Почніть цей блок з "**Умова завдання:**".
2.  **Вставте тут унікальний роздільник:** \`---SOLUTION-SEPARATOR---\`
3.  **Детальне розв'язання:**
    - Для Математики: Надайте покрокове, вичерпне пояснення процесу розв'язання, переконуючись, що кожен логічний крок є чітким та добре обґрунтованим для п'ятикласника. Використовуйте подвійні зірочки для виділення **ключових термінів** або **важливих чисел**.
    - Для Української мови/Історії України:
        1. Надайте всебічне, доступне пояснення необхідного аналізу/відповіді.
        2. Одразу після пояснення, надайте коротке, одно-двох реченнями резюме основного сенсу тексту/теми (**Краткий смисл:**).
4.  **Кінцева відповідь:** Чітко позначте кінцеву відповідь словом "**Відповідь:**". Саму відповідь також виділіть жирним шрифтом за допомогою подвійних зірочок. Наприклад: **Відповідь:** **Правильна відповідь**.

**Правила форматування:**
-   Для виділення жирним шрифтом використовуйте **тільки подвійні зірочки** (наприклад, \`**текст**\`). Не використовуйте одинарні.
-   Весь текст повинен бути легкочитним. Уникайте будь-яких інших спеціальних символів форматування.

Мета: Переконатися, що учень повністю розуміє "як" і "чому", а не просто отримує кінцеву відповідь.
`;
  }

  /**
   * Generates a step-by-step solution for a given task.
   * @param subject The school subject.
   * @param details The details of the task, either from a URL or an image.
   * @returns A promise that resolves to the formatted solution text.
   */
  async getSolution(subject: string, details: SolutionRequestDetails): Promise<string> {
    if (!this.ai) {
      const errorMessage = 'Сервіс AI не ініціалізовано.';
      this.error.set(errorMessage);
      return `Помилка: ${errorMessage}`;
    }

    this.error.set(null);
    const systemInstruction = this.generateBasePrompt(subject);
    const parts: Part[] = [];
    let userPrompt: string;

    const config: GenerationConfig = {
      systemInstruction,
    };

    if (details.mode === 'url') {
      userPrompt = `Увага: виконай точний пошук в Інтернеті. Твоя мета - знайти **дослівний** текст завдання.

**Інструкції для пошуку:**
1.  **Джерело:** Український підручник '${subject} 5 клас'.
2.  **Посилання:** ${details.url || 'не вказано'}.
3.  **Сторінка:** ${details.page || 'не вказано'}.
4.  **Номер завдання:** ${details.task || 'не вказано'}.

**Завдання:**
1.  Перейди за посиланням і знайди вказану сторінку.
2.  На цій сторінці знайди завдання з номером ${details.task || 'не вказано'}.
3.  **Важливо:** Переконайся, що номер сторінки та номер завдання **точно** відповідають запиту.
4.  Коли знайдеш **точний** текст завдання, розв'яжи його згідно з твоїми системними інструкціями.`;
      parts.push({ text: userPrompt });
      if (details.url) {
        // Enable the Google Search tool to allow the model to find the textbook content online.
        config.tools = [{googleSearch: {}}];
      }
    } else { // image mode
      userPrompt = `Завдання з наданого зображення. Якщо потрібно, опиши, що зображено, і виконай завдання. Користувач вказав: "${details.task}"`;
      parts.push({
        inlineData: {
          mimeType: 'image/jpeg',
          data: details.imageBase64,
        },
      });
      parts.push({ text: userPrompt });
    }

    try {
      const response: GenerateContentResponse = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts },
        config, // Use the dynamically created config
      });
      return response.text;
    } catch (e) {
      const error = e as Error;
      console.error('Error calling Gemini API for solution:', error);
      const errorMessage = `Виникла помилка під час обробки вашого запиту: ${error.message}. Спробуйте ще раз.`;
      this.error.set(errorMessage);
      return 'Помилка отримання відповіді від AI.';
    }
  }
  
  /**
   * Provides a clarification or answers a follow-up question based on chat history.
   * @param subject The school subject.
   * @param chatHistory The existing conversation history.
   * @param newQuestion The user's new question.
   * @returns A promise that resolves to the AI's response.
   */
  async getClarification(subject: string, chatHistory: ChatMessage[], newQuestion: string): Promise<string> {
     if (!this.ai) {
      const errorMessage = 'Сервіс AI не ініціалізовано.';
      this.error.set(errorMessage);
      return `Помилка: ${errorMessage}`;
    }
    
    this.error.set(null);
    const systemInstruction = `${this.generateBasePrompt(subject)}
    Ви ведете діалог з учнем. Використовуйте історію діалогу, щоб точно відповісти на запитання учня, зосереджуючись на конкретній галузі нерозуміння, підтримуючи підбадьорливий тон.
    `;
    
    // Cost optimization: Send only the last N messages to limit token count.
    const truncatedHistory = chatHistory.slice(-this.CHAT_HISTORY_LIMIT);

    const history = truncatedHistory.map(msg => ({
        role: msg.role,
        parts: [{ text: msg.text }]
    }));

    const chat = this.ai.chats.create({
        model: 'gemini-2.5-flash',
        config: { systemInstruction },
        history
    });

    try {
        const response: GenerateContentResponse = await chat.sendMessage(newQuestion);
        return response.text;
    } catch (e) {
        const error = e as Error;
        console.error('Error in chat with Gemini API:', error);
        const errorMessage = `Виникла помилка під час діалогу: ${error.message}. Спробуйте ще раз.`;
        this.error.set(errorMessage);
        return 'Помилка отримання відповіді від AI.';
    }
  }
}
