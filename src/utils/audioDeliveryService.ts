export interface VoiceProfile {
  id: string;
  name: string;
  key: string; // Matches public/audio/{key}_{id}.mp3
  accent: 'American' | 'British' | 'Indian';
  gender: 'Female' | 'Male';
  flag: string;
  description: string;
}

export const STORED_VOICES: VoiceProfile[] = [
  // American English
  {
    id: 'us_female',
    name: 'Jenny (US Female)',
    key: 'us_female',
    accent: 'American',
    gender: 'Female',
    flag: '🇺🇸',
    description: 'Crisp, natural & expressive American accent'
  },
  {
    id: 'us_male',
    name: 'Guy (US Male)',
    key: 'us_male',
    accent: 'American',
    gender: 'Male',
    flag: '🇺🇸',
    description: 'Deep, clear & articulate American accent'
  },

  // British English
  {
    id: 'uk_female',
    name: 'Sonia (UK Female)',
    key: 'uk_female',
    accent: 'British',
    gender: 'Female',
    flag: '🇬🇧',
    description: 'RP British accent with clear diction'
  },
  {
    id: 'uk_male',
    name: 'Ryan (UK Male)',
    key: 'uk_male',
    accent: 'British',
    gender: 'Male',
    flag: '🇬🇧',
    description: 'BBC British style articulation'
  },

  // Indian English
  {
    id: 'in_female',
    name: 'Neerja (IN Female)',
    key: 'in_female',
    accent: 'Indian',
    gender: 'Female',
    flag: '🇮🇳',
    description: 'Fluent Indian standard English pronunciation'
  },
  {
    id: 'in_male',
    name: 'Prabhat (IN Male)',
    key: 'in_male',
    accent: 'Indian',
    gender: 'Male',
    flag: '🇮🇳',
    description: 'Clear Indian corporate English cadence'
  }
];

class AudioDeliveryService {
  private currentAudio: HTMLAudioElement | null = null;

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

  // Pre-load audio elements in browser cache for instantaneous zero-latency playback
  public preloadSetAudio(questionIds: number[], voice: VoiceProfile) {
    for (const qId of questionIds) {
      const audioUrl = `/audio/${voice.key}_${qId}.mp3`;
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.as = 'audio';
      link.href = audioUrl;
      document.head.appendChild(link);
    }
  }

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
        osc.frequency.setValueAtTime(523.25, ctx.currentTime);
        osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.08);
        osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.16);
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
      // Audio context handled
    }
  }

  public async playQuestionAudio(
    questionId: number,
    sentenceText: string,
    voice: VoiceProfile,
    onStart?: () => void,
    onEnd?: () => void
  ): Promise<void> {
    this.stop();

    // 1. Try static CDN audio file from /audio/ (Instant on Vercel)
    const audioUrl = `/audio/${voice.key}_${questionId}.mp3`;

    return new Promise<void>((resolve) => {
      const audio = new Audio(audioUrl);
      this.currentAudio = audio;

      let hasStarted = false;

      audio.onplay = () => {
        hasStarted = true;
        onStart?.();
      };

      audio.onended = () => {
        onEnd?.();
        resolve();
      };

      audio.onerror = () => {
        // Fallback to client speech synthesis if static file can't be fetched
        console.warn(`Audio file ${audioUrl} not found, falling back to speech synthesis`);
        this.fallbackSpeechSynthesis(sentenceText, voice, onStart, onEnd).then(resolve);
      };

      audio.play().catch(() => {
        if (!hasStarted) {
          this.fallbackSpeechSynthesis(sentenceText, voice, onStart, onEnd).then(resolve);
        }
      });
    });
  }

  private fallbackSpeechSynthesis(
    sentence: string,
    voice: VoiceProfile,
    onStart?: () => void,
    onEnd?: () => void
  ): Promise<void> {
    return new Promise((resolve) => {
      if (!('speechSynthesis' in window)) {
        onEnd?.();
        resolve();
        return;
      }

      const spokenText = sentence.replace(/_+/g, ' blank ');
      const utterance = new SpeechSynthesisUtterance(spokenText);
      const targetLang = voice.accent === 'British' ? 'en-GB' : (voice.accent === 'Indian' ? 'en-IN' : 'en-US');
      utterance.lang = targetLang;

      const voices = window.speechSynthesis.getVoices();
      const matched = voices.find(v => v.lang.replace('_', '-').toLowerCase().startsWith(targetLang.toLowerCase()));
      if (matched) utterance.voice = matched;

      utterance.onstart = () => onStart?.();
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

export const audioDeliveryService = new AudioDeliveryService();
