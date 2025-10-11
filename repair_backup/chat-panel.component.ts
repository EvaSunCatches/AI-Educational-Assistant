import { Component, ChangeDetectionStrategy, input, output, signal, effect, ElementRef, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatMessage } from '../../models/chat.model';

@Component({
  selector: 'app-chat-panel',
  templateUrl: './chat-panel.component.html',
  styleUrls: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
})
export class ChatPanelComponent {
  chatHistory = input.required<ChatMessage[]>();
  isGenerating = input.required<boolean>();
  
  messageSent = output<string>();

  userInput = signal('');
  isListening = signal(false);
  
  private recognition: any | null = null;
  private chatContainer = viewChild<ElementRef<HTMLDivElement>>('chatContainer');
  
  constructor() {
    this.setupSpeechRecognition();

    effect(() => {
      // Auto-scroll to bottom when chat history changes
      if (this.chatHistory() && this.chatContainer()) {
        this.scrollToBottom();
      }
    });
  }
  
  private setupSpeechRecognition() {
      try {
        // Fix: Cast window to `any` to access browser-specific SpeechRecognition APIs without TypeScript errors.
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SpeechRecognition) {
            this.recognition = new SpeechRecognition();
            this.recognition.continuous = false;
            this.recognition.lang = 'uk-UA';
            this.recognition.interimResults = false;
            this.recognition.maxAlternatives = 1;

            this.recognition.onresult = (event: any) => {
                const transcript = event.results[0][0].transcript;
                this.userInput.set(transcript);
                this.isListening.set(false);
            };

            this.recognition.onerror = (event: any) => {
                console.error('Speech recognition error:', event.error);
                this.isListening.set(false);
            };
            
            this.recognition.onend = () => {
                this.isListening.set(false);
            };
        }
    } catch (e) {
        console.error("Speech Recognition not supported by this browser.", e);
    }
  }

  sendMessage() {
    const message = this.userInput().trim();
    if (message && !this.isGenerating()) {
      this.messageSent.emit(message);
      this.userInput.set('');
    }
  }
  
  toggleListen() {
    if (!this.recognition) {
        console.warn('Розпізнавання мовлення не підтримується цим браузером.');
        return;
    }
      
    if (this.isListening()) {
      this.recognition.stop();
      this.isListening.set(false);
    } else {
      this.recognition.start();
      this.isListening.set(true);
    }
  }

  private scrollToBottom(): void {
    try {
      if (this.chatContainer()) {
        const element = this.chatContainer()!.nativeElement;
        element.scrollTop = element.scrollHeight;
      }
    } catch (err) {
      console.error('Could not scroll to bottom:', err);
    }
  }
}