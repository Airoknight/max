// Speech Recognition evaluation helper

export interface RecognitionResult {
  transcript: string;
  isFinal: boolean;
}

export class SpeechRecognizer {
  private recognition: any = null;
  private isListening = false;
  private onResultCallback?: (result: RecognitionResult) => void;
  private onErrorCallback?: (err: any) => void;
  private onEndCallback?: () => void;

  constructor() {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.maxAlternatives = 3;

      this.recognition.onresult = (event: any) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }

        const transcript = (finalTranscript || interimTranscript).trim();
        if (this.onResultCallback && transcript) {
          this.onResultCallback({
            transcript,
            isFinal: Boolean(finalTranscript)
          });
        }
      };

      this.recognition.onerror = (event: any) => {
        if (event.error !== 'no-speech') {
          console.warn('SpeechRecognition error:', event.error);
        }
        if (this.onErrorCallback) {
          this.onErrorCallback(event.error);
        }
      };

      this.recognition.onend = () => {
        this.isListening = false;
        if (this.onEndCallback) {
          this.onEndCallback();
        }
      };
    }
  }

  public isSupported(): boolean {
    return Boolean((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
  }

  public start(
    lang: string,
    onResult: (result: RecognitionResult) => void,
    onError?: (err: any) => void,
    onEnd?: () => void
  ) {
    if (!this.recognition) return;
    this.stop();

    this.onResultCallback = onResult;
    this.onErrorCallback = onError;
    this.onEndCallback = onEnd;
    this.recognition.lang = lang || 'en-US';

    try {
      this.recognition.start();
      this.isListening = true;
    } catch (e) {
      console.warn('Could not start recognition:', e);
    }
  }

  public stop() {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch (e) {
        // ignore
      }
      this.isListening = false;
    }
  }

  public getIsListening() {
    return this.isListening;
  }
}

// Answer evaluation function
export function evaluateAnswer(spokenText: string, targetAnswers: string[]): {
  isCorrect: boolean;
  matchedWord: string | null;
  confidence: number;
} {
  if (!spokenText || !spokenText.trim()) {
    return { isCorrect: false, matchedWord: null, confidence: 0 };
  }

  // Tokenize spoken words & sanitize
  const cleanSpoken = spokenText.toLowerCase().replace(/[^a-z0-9\s-]/g, ' ');
  const words = cleanSpoken.split(/\s+/).filter(Boolean);

  for (const target of targetAnswers) {
    const cleanTarget = target.toLowerCase().trim();

    // Check 1: Direct match in spoken tokens
    if (words.includes(cleanTarget)) {
      return { isCorrect: true, matchedWord: target, confidence: 1.0 };
    }

    // Check 2: Compound phrase match (e.g., 'no-parking' vs 'no parking')
    const normalizedTarget = cleanTarget.replace(/-/g, ' ');
    if (cleanSpoken.includes(normalizedTarget) || cleanSpoken.includes(cleanTarget)) {
      return { isCorrect: true, matchedWord: target, confidence: 0.95 };
    }

    // Check 3: Check fuzzy phonetic / slight inflection distance (e.g. "turn" vs "turns", "switched" vs "switch")
    for (const word of words) {
      if (word.startsWith(cleanTarget) || cleanTarget.startsWith(word)) {
        if (Math.abs(word.length - cleanTarget.length) <= 2) {
          return { isCorrect: true, matchedWord: target, confidence: 0.85 };
        }
      }
    }
  }

  return { isCorrect: false, matchedWord: null, confidence: 0 };
}
