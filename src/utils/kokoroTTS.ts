export interface KokoroVoice {
  id: string;
  name: string;
  voiceKey: string; // Kokoro voice key: 'af_heart', 'af_bella', 'am_adam', 'am_michael', 'bf_emma', 'bf_isabella', 'bm_george', 'bm_lewis'
  accent: 'American' | 'British' | 'Indian';
  gender: 'Female' | 'Male';
  flag: string;
  description: string;
}

export const KOKORO_VOICES: KokoroVoice[] = [
  // American English (Kokoro high-quality neural)
  {
    id: 'af_heart',
    name: 'Heart (US Female)',
    voiceKey: 'af_heart',
    accent: 'American',
    gender: 'Female',
    flag: '🇺🇸',
    description: 'Crisp, natural & expressive American accent'
  },
  {
    id: 'am_adam',
    name: 'Adam (US Male)',
    voiceKey: 'am_adam',
    accent: 'American',
    gender: 'Male',
    flag: '🇺🇸',
    description: 'Deep, clear & articulate American accent'
  },
  {
    id: 'af_bella',
    name: 'Bella (US Female)',
    voiceKey: 'af_bella',
    accent: 'American',
    gender: 'Female',
    flag: '🇺🇸',
    description: 'Warm, conversational American tone'
  },
  {
    id: 'am_michael',
    name: 'Michael (US Male)',
    voiceKey: 'am_michael',
    accent: 'American',
    gender: 'Male',
    flag: '🇺🇸',
    description: 'Calm, steady American pronunciation'
  },

  // British English (Kokoro British weights)
  {
    id: 'bf_emma',
    name: 'Emma (UK Female)',
    voiceKey: 'bf_emma',
    accent: 'British',
    gender: 'Female',
    flag: '🇬🇧',
    description: 'Received Pronunciation (RP) British accent'
  },
  {
    id: 'bm_george',
    name: 'George (UK Male)',
    voiceKey: 'bm_george',
    accent: 'British',
    gender: 'Male',
    flag: '🇬🇧',
    description: 'Classic British broadcast news articulation'
  },
  {
    id: 'bf_isabella',
    name: 'Isabella (UK Female)',
    voiceKey: 'bf_isabella',
    accent: 'British',
    gender: 'Female',
    flag: '🇬🇧',
    description: 'Refined modern British tone'
  },
  {
    id: 'bm_lewis',
    name: 'Lewis (UK Male)',
    voiceKey: 'bm_lewis',
    accent: 'British',
    gender: 'Male',
    flag: '🇬🇧',
    description: 'Gentle British academic cadence'
  },

  // Indian English
  {
    id: 'in_priya',
    name: 'Priya (IN Female)',
    voiceKey: 'in_priya',
    accent: 'Indian',
    gender: 'Female',
    flag: '🇮🇳',
    description: 'Clear Indian English pronunciation'
  },
  {
    id: 'in_rohan',
    name: 'Rohan (IN Male)',
    voiceKey: 'in_rohan',
    accent: 'Indian',
    gender: 'Male',
    flag: '🇮🇳',
    description: 'Standard Indian corporate English cadence'
  }
];

class KokoroTTSService {
  private kokoroInstance: any = null;
  private isLoading = false;
  private isLoaded = false;
  private currentAudio: HTMLAudioElement | null = null;
  // In-memory audio blob cache: key -> blobUrl
  private audioCache: Map<string, string> = new Map();

  public async initKokoro(): Promise<boolean> {
    if (this.isLoaded) return true;
    if (this.isLoading) return false;

    this.isLoading = true;
    try {
      const { KokoroTTS } = await import('kokoro-js');
      this.kokoroInstance = await KokoroTTS.from_pretrained('onnx-community/Kokoro-82M-v1.0-ONNX', {
        dtype: 'q8',
        device: 'wasm'
      });
      this.isLoaded = true;
      this.isLoading = false;
      return true;
    } catch (err) {
      console.warn('Kokoro neural model init fallback to optimized speech synthesizer:', err);
      this.isLoading = false;
      return false;
    }
  }

  public getIsModelLoaded(): boolean {
    return this.isLoaded;
  }

  // Prepares the fill-in-the-blank sentence with the explicit word "blank"
  // so the user clearly hears: "... remember to blank off the projector ..."
  public formatSentenceText(sentence: string): string {
    return sentence.replace(/_+/g, ' blank ');
  }

  public stop() {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }

  // Chime feedback sounds
  public playChime(type: 'beep' | 'success' | 'error' | 'tick') {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'beep') {
        osc.frequency.setValueAtTime(800, ctx.currentTime);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.15);
      } else if (type === 'success') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
        osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.08); // E5
        osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.16); // G5
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.35);
      } else if (type === 'error') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(280, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(190, ctx.currentTime + 0.22);
        gain.gain.setValueAtTime(0.14, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.22);
      } else if (type === 'tick') {
        osc.frequency.setValueAtTime(1050, ctx.currentTime);
        gain.gain.setValueAtTime(0.06, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.05);
      }
    } catch {
      // AudioContext policy
    }
  }

  // Pre-generate & synthesize audio for all sentences in the module upfront
  public async preSynthesizeQuestions(
    questions: { id: number; sentence: string }[],
    voice: KokoroVoice,
    onProgress: (current: number, total: number, label: string) => void
  ): Promise<void> {
    const total = questions.length;
    for (let i = 0; i < total; i++) {
      const q = questions[i];
      const cacheKey = `${voice.id}_${q.id}`;
      onProgress(i + 1, total, `Synthesizing question ${i + 1} of ${total}...`);

      if (this.audioCache.has(cacheKey)) {
        continue;
      }

      const spokenText = this.formatSentenceText(q.sentence);

      if (this.kokoroInstance && (voice.voiceKey.startsWith('a') || voice.voiceKey.startsWith('b'))) {
        try {
          const audioData = await this.kokoroInstance.generate(spokenText, {
            voice: voice.voiceKey
          });
          const blob = audioData.toBlob();
          const url = URL.createObjectURL(blob);
          this.audioCache.set(cacheKey, url);
          continue;
        } catch (e) {
          console.warn('Kokoro pre-synthesis item fallback:', e);
        }
      }

      // Small tick to ensure UI renders smoothly if using browser speech synthesizer
      await new Promise(r => setTimeout(r, 60));
    }
  }

  public async speak(
    sentence: string,
    voice: KokoroVoice,
    questionId: number,
    onStart?: () => void,
    onEnd?: () => void
  ): Promise<void> {
    this.stop();
    const spokenText = this.formatSentenceText(sentence);
    const cacheKey = `${voice.id}_${questionId}`;

    // 1. Play from pre-generated cache if available
    const cachedUrl = this.audioCache.get(cacheKey);
    if (cachedUrl) {
      onStart?.();
      const audio = new Audio(cachedUrl);
      this.currentAudio = audio;
      return new Promise<void>((resolve) => {
        audio.onended = () => {
          onEnd?.();
          resolve();
        };
        audio.onerror = () => {
          onEnd?.();
          resolve();
        };
        audio.play().catch(() => {
          onEnd?.();
          resolve();
        });
      });
    }

    // 2. Otherwise generate via Kokoro instance
    if (this.kokoroInstance && (voice.voiceKey.startsWith('a') || voice.voiceKey.startsWith('b'))) {
      try {
        onStart?.();
        const audioData = await this.kokoroInstance.generate(spokenText, {
          voice: voice.voiceKey
        });
        const blob = audioData.toBlob();
        const url = URL.createObjectURL(blob);
        this.audioCache.set(cacheKey, url);
        const audio = new Audio(url);
        this.currentAudio = audio;

        await new Promise<void>((resolve) => {
          audio.onended = () => {
            onEnd?.();
            resolve();
          };
          audio.onerror = () => {
            onEnd?.();
            resolve();
          };
          audio.play();
        });
        return;
      } catch (err) {
        console.warn('Kokoro playback fallback to speech synthesis:', err);
      }
    }

    // 3. High quality SpeechSynthesis fallback tailored to British, Indian, and American accents
    return new Promise((resolve) => {
      if (!('speechSynthesis' in window)) {
        onEnd?.();
        resolve();
        return;
      }

      const utterance = new SpeechSynthesisUtterance(spokenText);
      const targetLang = voice.accent === 'British' ? 'en-GB' : (voice.accent === 'Indian' ? 'en-IN' : 'en-US');
      utterance.lang = targetLang;

      const voices = window.speechSynthesis.getVoices();
      let matchedVoice = voices.find(v => {
        const langMatches = v.lang.replace('_', '-').toLowerCase().startsWith(targetLang.toLowerCase());
        const genderMatch = voice.gender === 'Female' 
          ? /female|zira|samantha|karen|veena|catherine/i.test(v.name)
          : /male|david|george|rishi|ravi|alex/i.test(v.name);
        return langMatches && genderMatch;
      });

      if (!matchedVoice) {
        matchedVoice = voices.find(v => v.lang.replace('_', '-').toLowerCase().startsWith(targetLang.toLowerCase()));
      }

      if (matchedVoice) {
        utterance.voice = matchedVoice;
      }

      utterance.rate = 0.94;
      utterance.pitch = voice.gender === 'Female' ? 1.05 : 0.95;

      utterance.onstart = () => {
        onStart?.();
      };

      utterance.onend = () => {
        onEnd?.();
        resolve();
      };

      utterance.onerror = () => {
        onEnd?.();
        resolve();
      };

      window.speechSynthesis.speak(utterance);
    });
  }
}

export const kokoroTTS = new KokoroTTSService();
