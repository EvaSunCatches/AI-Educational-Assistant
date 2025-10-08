import { Component, ChangeDetectionStrategy, signal, inject, viewChild, ElementRef, effect } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GeminiService, SolutionRequestDetails } from './services/gemini.service';
import { ChatPanelComponent } from './components/chat-panel/chat-panel.component';
import { ChatMessage } from './models/chat.model';

type Subject = 'Математика' | 'Українська мова та література' | 'Історія України';
type Word = { text: string; charIndex: number };

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, ChatPanelComponent],
})
export class AppComponent {
  private geminiService = inject(GeminiService);
  private sanitizer = inject(DomSanitizer);

  private static readonly SOLUTION_SEPARATOR = '---SOLUTION-SEPARATOR---';

  Math = Math;

  // State signals
  inputMode = signal<'url' | 'image'>('url');
  subject = signal<Subject>('Математика');
  
  // URL Input
  url = signal('');
  chapter = signal('');
  page = signal('');
  task = signal('');

  // Image Input
  imagePreview = signal<string | null>(null);
  imageBase64 = signal<string | null>(null);
  taskFromImage = signal('');
  isDragging = signal(false);
  isCameraOpen = signal(false);
  
  // Output & Interaction
  solution = signal<SafeHtml | string>('');
  rawSolutionText = signal(''); 
  taskStatement = signal<string | null>(null); 
  submittedImage = signal<string | null>(null); 
  isLoading = signal(false);
  loadingProgress = signal(0);
  private progressInterval: any = null;
  isChatting = signal(false);
  geminiError = this.geminiService.error;
  chatHistory = signal<ChatMessage[]>([]);
  
  // Voice Synthesis State
  speechState = signal<'playing' | 'paused' | 'stopped'>('stopped');
  speakingSection = signal<'task' | 'solution' | null>(null);
  voiceError = signal<string | null>(null);
  private synth: SpeechSynthesis;
  private ukrainianVoice: SpeechSynthesisVoice | undefined;
  private voicesLoadedPromise: Promise<void>;

  // Highlighting signals
  taskWords = signal<Word[]>([]);
  cleanTaskText = signal('');
  highlightedTaskWordIndex = signal(-1);
  solutionWords = signal<Word[]>([]);
  cleanSolutionText = signal('');
  private highlightedWordElement: HTMLElement | null = null;
  
  // Solution playback state
  private solutionSentences: { text: string; startChar: number; }[] = [];
  private currentSolutionSentenceIndex = 0;

  // View children
  videoElement = viewChild<ElementRef<HTMLVideoElement>>('videoElement');
  canvasElement = viewChild<ElementRef<HTMLCanvasElement>>('canvasElement');
  solutionContainer = viewChild<ElementRef<HTMLDivElement>>('solutionContainer');
  private mediaStream: MediaStream | null = null;

  constructor() {
    this.initSpeechSynthesis();
    
    effect(() => {
      if (this.isCameraOpen() && this.videoElement()) {
        this.startVideoStream();
      }
    });
  }
  
  private initSpeechSynthesis(): void {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
        this.voiceError.set('Синтез мовлення не підтримується цим браузером.');
        this.voicesLoadedPromise = Promise.reject('Speech synthesis not supported');
        return;
    }

    this.synth = window.speechSynthesis;

    this.voicesLoadedPromise = new Promise((resolve, reject) => {
        let timeoutId: any = null;

        const checkVoices = () => {
            const voices = this.synth.getVoices();
            if (voices.length > 0) {
                this.selectUkrainianVoice(voices);
                if (this.ukrainianVoice) {
                    resolve();
                } else {
                    reject('No suitable Ukrainian voice found.');
                }
                this.synth.onvoiceschanged = null;
                if (timeoutId) clearTimeout(timeoutId);
            }
        };

        timeoutId = setTimeout(() => {
            const voices = this.synth.getVoices();
             if (voices.length === 0) {
                this.voiceError.set('Не вдалося завантажити голоси для синтезу мовлення (тайм-аут).');
                reject('Voice loading timed out.');
                this.synth.onvoiceschanged = null;
             } else {
                checkVoices();
             }
        }, 1500);

        this.synth.onvoiceschanged = checkVoices;
        checkVoices(); 
    });
    
    this.voicesLoadedPromise.catch(err => {
      console.error("Voice initialization failed:", err);
    });
  }
  
  private selectUkrainianVoice(voices: SpeechSynthesisVoice[]): void {
    let selectedVoice: SpeechSynthesisVoice | undefined;
    let selectionReason = '';
  
    const voicesUK = voices.filter(v => v.lang.startsWith('uk'));
    
    const lesyaEnhancedVoice = voicesUK.find(v => 
        v.name.toLowerCase().includes('леся (улучшенный)') ||
        v.name.toLowerCase().includes('леся (покращений)') ||
        v.name.toLowerCase().includes('lesya (enhanced)')
    );
    if (lesyaEnhancedVoice) {
        selectedVoice = lesyaEnhancedVoice;
        selectionReason = `Found specific enhanced voice 'Lesya' as requested.`;
    }
  
    if (!selectedVoice) {
      const lesyaVoice = voicesUK.find(v => v.name.toLowerCase().includes('lesya') || v.name.toLowerCase().includes('леся'));
      if (lesyaVoice) {
        selectedVoice = lesyaVoice;
        selectionReason = `Found standard Ukrainian voice 'Lesya'.`;
      }
    }
  
    if (!selectedVoice) {
      selectedVoice = voices.find(voice => voice.lang === 'uk-UA');
      if (selectedVoice) selectionReason = `Found voice with exact language match 'uk-UA'.`;
    }
  
    if (!selectedVoice && voicesUK.length > 0) {
      selectedVoice = voicesUK[0];
      if (selectedVoice) selectionReason = `Found first available Ukrainian voice ('${selectedVoice.name}').`;
    }
    
    this.ukrainianVoice = selectedVoice;
    
    if (this.ukrainianVoice) {
      console.log(`%cSpeech Synthesis Activated`, 'color: green; font-weight: bold;');
      console.log(`Voice Selected: ${this.ukrainianVoice.name} | Language: ${this.ukrainianVoice.lang}`);
      console.log(`Reason: ${selectionReason}`);
      this.voiceError.set(null);
    } else {
      console.error('CRITICAL: No suitable Ukrainian voice available.');
      this.voiceError.set('На цьому пристрої не знайдено відповідного українського голосу для озвучення.');
    }
  }

  setSubject(newSubject: string): void {
    this.subject.set(newSubject as Subject);
  }

  handleDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(true);
  }

  handleDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);
  }

  handleDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);
    if (event.dataTransfer?.files[0]) {
      this.processFile(event.dataTransfer.files[0]);
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.processFile(input.files[0]);
    }
  }
  
  private processFile(file: File): void {
    if (!file.type.startsWith('image/')) {
        console.error("File is not an image.");
        return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      this.imagePreview.set(result);
      this.imageBase64.set(result.split(',')[1]);
    };
    reader.readAsDataURL(file);
  }

  async openCamera(): Promise<void> {
    if (!navigator.mediaDevices?.getUserMedia) {
        alert('Камера не підтримується вашим браузером.');
        return;
    }
    try {
        this.closeCamera();
        this.imagePreview.set(null);
        this.imageBase64.set(null);
        this.mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        this.isCameraOpen.set(true);
    } catch (err) {
        console.error("Error accessing camera: ", err);
        alert('Не вдалося отримати доступ до камери. Будь ласка, перевірте дозволи.');
    }
  }

  private async startVideoStream(): Promise<void> {
    if (!this.mediaStream || !this.videoElement()) return;
    const video = this.videoElement()!.nativeElement;
    video.srcObject = this.mediaStream;
    try {
      await video.play();
    } catch (err) {
      console.error("Error playing video stream:", err);
    }
  }
  
  capturePhoto(): void {
    if (!this.videoElement() || !this.canvasElement()) return;
    const video = this.videoElement()!.nativeElement;
    const canvas = this.canvasElement()!.nativeElement;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const context = canvas.getContext('2d');
    if (context) {
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg');
      this.imagePreview.set(dataUrl);
      this.imageBase64.set(dataUrl.split(',')[1]);
    }
    this.closeCamera();
  }
  
  closeCamera(): void {
    if (this.mediaStream) {
        this.mediaStream.getTracks().forEach(track => track.stop());
    }
    this.isCameraOpen.set(false);
    this.mediaStream = null;
  }

  private formatSolutionText(text: string): string {
    let html = text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  
    html = html.replace(/((?:^\s*[\*\-]\s+.*\n?)+)/gm, (match) => {
      const items = match.trim().split('\n').map(item => `<li>${item.replace(/^\s*[\*\-]\s+/, '')}</li>`).join('');
      return `<ul class="list-disc list-inside space-y-1 mb-4">${items}</ul>`;
    });
  
    html = html.replace(/((?:^\s*\d+\.\s+.*\n?)+)/gm, (match) => {
      const items = match.trim().split('\n').map(item => `<li>${item.replace(/^\s*\d+\.\s+/, '')}</li>`).join('');
      return `<ol class="list-decimal list-inside space-y-1 mb-4">${items}</ol>`;
    });
  
    const parts = html.split(/(<(?:ul|ol)[\s\S]*?<\/(?:ul|ol)>)/g);
    const finalHtml = parts.map(part => {
      if (part.startsWith('<ul') || part.startsWith('<ol')) {
        return part;
      }
      const trimmedPart = part.trim();
      if (trimmedPart) {
        return `<p>${trimmedPart.replace(/\n/g, '<br>')}</p>`;
      }
      return '';
    }).join('');

    return finalHtml;
  }

  async getHelp(): Promise<void> {
    if (this.isLoading()) return;

    this.isLoading.set(true);
    this.solution.set('');
    this.rawSolutionText.set('');
    this.taskStatement.set(null);
    this.taskWords.set([]);
    this.solutionWords.set([]);
    this.chatHistory.set([]);
    this.geminiError.set(null);
    this.submittedImage.set(null);
    this.loadingProgress.set(0);

    if (this.progressInterval) clearInterval(this.progressInterval);

    this.progressInterval = setInterval(() => {
      this.loadingProgress.update(p => {
        if (p >= 95) {
          if (this.progressInterval) clearInterval(this.progressInterval);
          this.progressInterval = null;
          return p;
        }
        return Math.min(p + 5, 95);
      });
    }, 250);

    try {
      let result: string;
      if (this.inputMode() === 'url') {
        result = await this.geminiService.getSolution(this.subject(), {
          mode: 'url', url: this.url(), chapter: this.chapter(), page: this.page(), task: this.task()
        });
      } else {
        this.submittedImage.set(this.imagePreview());
        result = await this.geminiService.getSolution(this.subject(), {
          mode: 'image', task: this.taskFromImage(), imageBase64: this.imageBase64()!
        });
      }
      
      const parts = result.split(AppComponent.SOLUTION_SEPARATOR);
      
      const taskTextWithHeader = parts[0];
      const taskText = taskTextWithHeader.replace('**Умова завдання:**', '').replace(/\*\*/g, '').trim();
      
      const solutionText = parts.length > 1 ? parts[1].trim() : result.replace(taskTextWithHeader, '').trim();
      
      this.taskStatement.set(taskText);
      this.prepareTaskForKaraoke(taskText);

      this.rawSolutionText.set(solutionText);
      this.prepareSolutionForKaraoke(solutionText);
      
      this.chatHistory.set([{ role: 'model', text: this.formatSolutionText(solutionText) }]);
    } finally {
      if (this.progressInterval) clearInterval(this.progressInterval);
      this.loadingProgress.set(100);
      setTimeout(() => this.isLoading.set(false), 500);
    }
  }

  async handleUserMessage(message: string): Promise<void> {
      if (this.isChatting()) return;
      this.isChatting.set(true);
      const userMessage: ChatMessage = { role: 'user', text: message };
      this.chatHistory.update(history => [...history, userMessage]);
      try {
          const responseText = await this.geminiService.getClarification(this.subject(), this.chatHistory(), message);
          const formattedResponse = this.formatSolutionText(responseText);
          const modelMessage: ChatMessage = { role: 'model', text: formattedResponse };
          this.chatHistory.update(history => [...history, modelMessage]);
      } finally {
          this.isChatting.set(false);
      }
  }

  private expandAbbreviationsForSpeech(text: string): string {
    let result = text;
    // This regex handles numbers (including decimals), optional space, and the unit with an optional dot.
    // It replaces the unit with its full Ukrainian plural form for better pronunciation.
    result = result.replace(/(\d+(?:\.\d+)?)\s*(мм\.?)/gi, '$1 міліметрів');
    result = result.replace(/(\d+(?:\.\d+)?)\s*(см\.?)/gi, '$1 сантиметрів');
    result = result.replace(/(\d+(?:\.\d+)?)\s*(м\.?)/gi, '$1 метрів');
    
    return result;
  }

  private prepareTaskForKaraoke(text: string): void {
      if (!text) {
          this.taskWords.set([]);
          this.cleanTaskText.set('');
          return;
      }
      const expandedText = this.expandAbbreviationsForSpeech(text);
      const words = expandedText.match(/\S+/g) || [];
      const cleanText = words.join(' ');
      this.cleanTaskText.set(cleanText);

      const wordsWithIndices: Word[] = [];
      let charIndex = 0;
      for (const word of words) {
          wordsWithIndices.push({ text: word, charIndex });
          charIndex += word.length + 1;
      }
      this.taskWords.set(wordsWithIndices);
  }

  private prepareSolutionForKaraoke(text: string): void {
    if (!text) {
        this.solutionWords.set([]);
        this.cleanSolutionText.set('');
        this.solution.set('');
        return;
    }

    const expandedText = this.expandAbbreviationsForSpeech(text);
    const formattedHtml = this.formatSolutionText(expandedText);
    const tokens = formattedHtml.match(/<[^>]+>|[^<>\s]+|\s+/g) || [];
    
    let finalHtmlBuilder = '';
    const cleanTextWords: string[] = [];
    let wordIndex = 0;

    for (const token of tokens) {
        if (token.startsWith('<') && token.endsWith('>')) {
            finalHtmlBuilder += token;
        } else if (/\s+/.test(token)) {
            finalHtmlBuilder += token;
        } else {
            const wordId = `s-word-${wordIndex++}`;
            finalHtmlBuilder += `<span id="${wordId}">${token}</span>`;
            cleanTextWords.push(token);
        }
    }
    
    this.solution.set(this.sanitizer.bypassSecurityTrustHtml(finalHtmlBuilder));

    const cleanText = cleanTextWords.join(' ');
    this.cleanSolutionText.set(cleanText);

    const wordsWithIndices: Word[] = [];
    let currentIndex = 0;
    for (const word of cleanTextWords) {
        wordsWithIndices.push({ text: word, charIndex: currentIndex });
        currentIndex += word.length + 1; 
    }
    this.solutionWords.set(wordsWithIndices);

    // Split into sentences for playback control
    this.solutionSentences = [];
    if (cleanText) {
        let searchOffset = 0;
        const sentenceFragments = cleanText.match(/[^.!?…]+[.!?…]?/g) || [];

        for (const fragment of sentenceFragments) {
            const sentenceText = fragment.trim();
            if (sentenceText) {
                const startChar = cleanText.indexOf(sentenceText, searchOffset);
                if (startChar !== -1) {
                    this.solutionSentences.push({ text: sentenceText, startChar });
                    searchOffset = startChar + sentenceText.length;
                }
            }
        }
    }
  }

  async playOrStop(section: 'task' | 'solution'): Promise<void> {
    try {
      await this.voicesLoadedPromise;
    } catch (e) {
      // The error is already set in the signal. The UI will display it.
      // No need for a disruptive alert.
      console.error('Could not play speech:', e);
      return;
    }

    if (section === 'task') {
        const isPlayingTask = this.speakingSection() === 'task' && this.speechState() !== 'stopped';
        this.synth.cancel(); 

        if (isPlayingTask) {
            this.resetSpeechState();
        } else {
            this.resetSpeechHighlights();
            this.speakingSection.set('task');
            this.speechState.set('playing');
            this.speakTaskKaraoke();
        }
        return;
    }

    // section === 'solution'
    const isPlayingSolution = this.speakingSection() === 'solution' && this.speechState() !== 'stopped';
    
    if (isPlayingSolution) {
        this.synth.cancel();
        const nextIndex = this.currentSolutionSentenceIndex + 1;
        this.speechState.set('playing'); 
        
        if (nextIndex < this.solutionSentences.length) {
            this.speakSolutionSentenceByIndex(nextIndex);
        } else {
            this.resetSpeechState();
        }
    } else {
        this.synth.cancel(); // It might be playing the task, so cancel it.
        this.resetSpeechHighlights();
        this.speakingSection.set('solution');
        this.speechState.set('playing');
        this.speakSolutionSentenceByIndex(0);
    }
  }

  togglePauseResume(): void {
    if (this.speechState() === 'playing') {
      this.synth.pause();
      this.speechState.set('paused');
    } else if (this.speechState() === 'paused') {
      this.synth.resume();
      this.speechState.set('playing');
    }
  }
  
  private resetSpeechHighlights(): void {
    this.highlightedTaskWordIndex.set(-1);
    if (this.highlightedWordElement) {
        this.highlightedWordElement.classList.remove('bg-yellow-200', 'rounded');
        this.highlightedWordElement = null;
    }
  }

  private resetSpeechState(): void {
    this.speechState.set('stopped');
    this.speakingSection.set(null);
    this.resetSpeechHighlights();
  }

  private speakTaskKaraoke(): void {
    const text = this.cleanTaskText() ?? '';
    if (!text) {
        this.resetSpeechState();
        return;
    };
    
    const utterance = new SpeechSynthesisUtterance(text);
    if (this.ukrainianVoice) utterance.voice = this.ukrainianVoice;

    utterance.onboundary = (event) => {
        if (this.speechState() !== 'playing' || this.speakingSection() !== 'task') return;
        const charIndex = event.charIndex;
        let currentWordIndex = -1;
        const words = this.taskWords();
        for (let i = words.length - 1; i >= 0; i--) {
            if (words[i].charIndex <= charIndex) {
                currentWordIndex = i;
                break;
            }
        }
        this.highlightedTaskWordIndex.set(currentWordIndex);
    };
    
    utterance.onend = () => {
      if (this.speakingSection() === 'task') this.resetSpeechState();
    };
    utterance.onerror = (e) => {
      if (e.error !== 'canceled') console.error('Speech error:', e.error, e);
      if (this.speakingSection() === 'task') this.resetSpeechState();
    };
    this.synth.speak(utterance);
  }
  
  private speakSolutionSentenceByIndex(index: number): void {
    if (index >= this.solutionSentences.length || this.speechState() !== 'playing') {
        if (this.speechState() !== 'stopped') this.resetSpeechState();
        return;
    }
    
    this.currentSolutionSentenceIndex = index;
    const sentence = this.solutionSentences[index];
    const utterance = new SpeechSynthesisUtterance(sentence.text);
    if (this.ukrainianVoice) utterance.voice = this.ukrainianVoice;

    utterance.onboundary = (event) => {
        if (this.speechState() !== 'playing' || this.speakingSection() !== 'solution') return;
        
        const globalCharIndex = sentence.startChar + event.charIndex;
        let currentWordIndex = -1;
        const words = this.solutionWords();

        for (let i = words.length - 1; i >= 0; i--) {
            if (words[i].charIndex <= globalCharIndex) {
                currentWordIndex = i;
                break;
            }
        }
        if (currentWordIndex !== -1) {
            this.highlightSolutionWord(currentWordIndex);
        }
    };

    utterance.onend = () => {
        if (this.speechState() === 'playing' && this.speakingSection() === 'solution') {
            setTimeout(() => this.speakSolutionSentenceByIndex(this.currentSolutionSentenceIndex + 1), 50);
        }
    };

    utterance.onerror = (e) => {
        if (e.error !== 'canceled') {
            console.error('Speech error:', e.error, e);
            this.resetSpeechState();
        }
    };
    
    this.synth.speak(utterance);
  }

  private highlightSolutionWord(wordIndex: number): void {
    const container = this.solutionContainer()?.nativeElement;
    if (!container) return;

    const wordElement = container.querySelector(`#s-word-${wordIndex}`) as HTMLElement;

    if (wordElement && wordElement !== this.highlightedWordElement) {
        if (this.highlightedWordElement) {
            this.highlightedWordElement.classList.remove('bg-yellow-200', 'rounded');
        }
        wordElement.classList.add('bg-yellow-200', 'rounded');
        this.highlightedWordElement = wordElement;

        const containerRect = container.getBoundingClientRect();
        const wordRect = wordElement.getBoundingClientRect();

        const isVisible = (
            wordRect.top >= containerRect.top &&
            wordRect.bottom <= containerRect.bottom
        );

        if (!isVisible) {
            wordElement.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
        }
    }
  }
}
