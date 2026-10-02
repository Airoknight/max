export type Accent = 'en-US' | 'en-GB' | 'en-IN' | 'en-AU';
export type Gender = 'female' | 'male';
export type VoiceEngine = 'kokoro' | 'system';

export interface VoiceOption {
  id: string;
  name: string;
  accent: Accent;
  accentLabel: string;
  gender: Gender;
  flag: string;
  kokoroVoiceId?: string; // e.g. af_heart, am_adam, bf_emma, bm_george
}

// Curated list of Kokoro voices & standard Web Speech voices
export const AVAILABLE_VOICES: VoiceOption[] = [
  {
    id: 'kokoro-us-f-heart',
    name: 'Sarah (Heart)',
    accent: 'en-US',
    accentLabel: 'American English',
    gender: 'female',
    flag: '🇺🇸',
    kokoroVoiceId: 'af_heart'
  },
  {
    id: 'kokoro-us-m-adam',
    name: 'Adam (Clear)',
    accent: 'en-US',
    accentLabel: 'American English',
    gender: 'male',
    flag: '🇺🇸',
    kokoroVoiceId: 'am_adam'
  },
  {
    id: 'kokoro-gb-f-emma',
    name: 'Emma (RP British)',
    accent: 'en-GB',
    accentLabel: 'British English',
    gender: 'female',
    flag: '🇬🇧',
    kokoroVoiceId: 'bf_emma'
  },
  {
    id: 'kokoro-gb-m-george',
    name: 'George (BBC British)',
    accent: 'en-GB',
    accentLabel: 'British English',
    gender: 'male',
    flag: '🇬🇧',
    kokoroVoiceId: 'bm_george'
  },
  {
    id: 'sys-in-f',
    name: 'Priya (Indian Standard)',
    accent: 'en-IN',
    accentLabel: 'Indian English',
    gender: 'female',
    flag: '🇮🇳'
  },
  {
    id: 'sys-in-m',
    name: 'Rohan (Indian Standard)',
    accent: 'en-IN',
    accentLabel: 'Indian English',
    gender: 'male',
    flag: '🇮🇳'
  },
  {
    id: 'kokoro-us-f-bella',
    name: 'Bella (Warm US)',
    accent: 'en-US',
    accentLabel: 'American English',
    gender: 'female',
    flag: '🇺🇸',
    kokoroVoiceId: 'af_bella'
  },
  {
    id: 'kokoro-us-m-michael',
    name: 'Michael (Natural US)',
    accent: 'en-US',
    accentLabel: 'American English',
    gender: 'male',
    flag: '🇺🇸',
    kokoroVoiceId: 'am_michael'
  }
];

class AudioSynthesizer {
  private isSpeaking = false;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private kokoroTTS: any = null;
  private kokoroLoading = false;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = () => {
        // reload voices
      };
    }
  }

  // Prepares sentence for TTS reading by replacing the "_______" blank with a short natural acoustic gap/pause
  public formatSentenceForSpeech(sentence: string): string {
    // Replace "_______" with " ... " to prompt a natural pause in TTS
    return sentence.replace(/_+/g, ' ... ');
  }

  // Play a soft high-tech acoustic chime before or after
  public playAudioChime(type: 'beep' | 'success' | 'error' | 'tick') {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'beep') {
        osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.15);
      } else if (type === 'success') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
        osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.08); // E5
        osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.16); // G5
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.4);
      } else if (type === 'error') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(260, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(180, ctx.currentTime + 0.25);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.25);
      } else if (type === 'tick') {
        osc.frequency.setValueAtTime(1000, ctx.currentTime);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.05);
      }
    } catch {
      // AudioContext policy handled gracefully
    }
  }

  public stop() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    this.isSpeaking = false;
  }

  public speak(
    sentence: string,
    voiceOption: VoiceOption,
    onStart?: () => void,
    onEnd?: () => void
  ): Promise<void> {
    return new Promise((resolve) => {
      this.stop();
      const textToSpeak = this.formatSentenceForSpeech(sentence);

      if (!('speechSynthesis' in window)) {
        console.warn('Speech synthesis not supported in this browser.');
        onEnd?.();
        resolve();
        return;
      }

      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      this.currentUtterance = utterance;

      // Select suitable voice
      const voices = window.speechSynthesis.getVoices();
      let matchedVoice = voices.find(v => v.lang === voiceOption.accent && (
        voiceOption.gender === 'female' 
          ? /female|zira|samantha|karen|catherine|veena/i.test(v.name)
          : /male|david|george|rishi|ravi/i.test(v.name)
      ));

      if (!matchedVoice) {
        matchedVoice = voices.find(v => v.lang.startsWith(voiceOption.accent.substring(0, 2)));
      }

      if (matchedVoice) {
        utterance.voice = matchedVoice;
      }

      utterance.lang = voiceOption.accent;
      utterance.rate = 0.95; // comfortable learning pace
      utterance.pitch = voiceOption.gender === 'female' ? 1.05 : 0.95;

      utterance.onstart = () => {
        this.isSpeaking = true;
        onStart?.();
      };

      utterance.onend = () => {
        this.isSpeaking = false;
        onEnd?.();
        resolve();
      };

      utterance.onerror = (e) => {
        console.error('Speech synthesis error:', e);
        this.isSpeaking = false;
        onEnd?.();
        resolve();
      };

      window.speechSynthesis.speak(utterance);
    });
  }
}

export const audioSynthesizer = new AudioSynthesizer();
