import React, { useState, useEffect, useRef } from 'react';
import { 
  Volume2, Mic, MicOff, RotateCcw, Eye, EyeOff, 
  Settings2, Award, CheckCircle2, XCircle, ArrowRight, 
  Sparkles, Timer, Flame, Headphones, BookOpen, 
  ArrowLeft, Check, ChevronRight, Layers, VolumeX,
  Play, ShieldCheck, Zap
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { LESSON_DATA, LessonQuestion } from './data/lessons.ts';
import { STORED_VOICES, VoiceProfile, audioDeliveryService } from './utils/audioDeliveryService.ts';
import { SpeechRecognizer, evaluateAnswer } from './utils/speechRecognition.ts';

// 5 Modules metadata
const MODULES = [
  {
    setNumber: 1,
    title: "Workplace & Routine",
    subtitle: "High-Frequency Workplace & Daily Routine",
    description: "Phrasal verbs, everyday device actions, and workplace dialogs.",
    count: 10,
    badgeColor: "#4f46e5"
  },
  {
    setNumber: 2,
    title: "Campus & Technical",
    subtitle: "Campus, Academic & Technical Contexts",
    description: "Academic reports, system states, Wi-Fi networks, and exams.",
    count: 10,
    badgeColor: "#0ea5e9"
  },
  {
    setNumber: 3,
    title: "Travel & Transit",
    subtitle: "Travel, Transit & Public Encounters",
    description: "Airport boarding, flight services, baggage counters, and trains.",
    count: 10,
    badgeColor: "#10b981"
  },
  {
    setNumber: 4,
    title: "Food & Dining",
    subtitle: "Food, Dining & Social Situations",
    description: "Restaurant bills, condiments, tasting, and casual outings.",
    count: 10,
    badgeColor: "#f59e0b"
  },
  {
    setNumber: 5,
    title: "Health & Utilities",
    subtitle: "Health, Home Maintenance & Utilities",
    description: "Prescription schedules, home safety, utilities, and diagnostics.",
    count: 10,
    badgeColor: "#ec4899"
  }
];

export default function App() {
  // Navigation Screens: 'home' -> 'module-select' -> 'settings' -> 'lesson' -> 'summary'
  const [currentScreen, setCurrentScreen] = useState<'home' | 'module-select' | 'settings' | 'lesson' | 'summary'>('home');

  // Selected configurations
  const [selectedSet, setSelectedSet] = useState<number>(1);
  const [selectedVoice, setSelectedVoice] = useState<VoiceProfile>(STORED_VOICES[0]);
  const [mode, setMode] = useState<'test' | 'train'>('test');
  const [showSentenceText, setShowSentenceText] = useState<boolean>(true);

  // Lesson Execution State
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isSpeakingPhrase, setIsSpeakingPhrase] = useState<boolean>(false);
  const [isListeningMic, setIsListeningMic] = useState<boolean>(false);
  const [spokenText, setSpokenText] = useState<string>('');
  const [countdown, setCountdown] = useState<number>(5);
  const [score, setScore] = useState<number>(0);

  // Evaluation & Results
  const [evaluation, setEvaluation] = useState<{
    status: 'idle' | 'correct' | 'incorrect';
    matchedWord: string | null;
  }>({ status: 'idle', matchedWord: null });

  const [completedQuestions, setCompletedQuestions] = useState<{
    id: number;
    question: string;
    targetAnswers: string[];
    userAnswer: string;
    isCorrect: boolean;
    rationale: string;
  }[]>([]);

  // Refs
  const speechRecognizerRef = useRef<SpeechRecognizer | null>(null);
  const timerIntervalRef = useRef<any>(null);
  const autoNextTimeoutRef = useRef<any>(null);

  // Current Questions
  const currentQuestions = LESSON_DATA.filter(q => q.setNumber === selectedSet);
  const currentItem = currentQuestions[currentIndex] || currentQuestions[0];

  // Initialize SpeechRecognizer
  useEffect(() => {
    speechRecognizerRef.current = new SpeechRecognizer();

    return () => {
      speechRecognizerRef.current?.stop();
      audioDeliveryService.stop();
      clearInterval(timerIntervalRef.current);
      clearTimeout(autoNextTimeoutRef.current);
    };
  }, []);

  // Whenever user starts a lesson, prefetch this module's audio files
  useEffect(() => {
    if (currentScreen === 'settings' || currentScreen === 'lesson') {
      const ids = currentQuestions.map(q => q.id);
      audioDeliveryService.preloadSetAudio(ids, selectedVoice);
    }
  }, [currentScreen, selectedSet, selectedVoice]);

  // When question index changes in 'lesson' screen
  useEffect(() => {
    if (currentScreen === 'lesson') {
      resetForNewQuestion();
      const playTimer = setTimeout(() => {
        playPhrase();
      }, 300);
      return () => clearTimeout(playTimer);
    }
  }, [currentIndex, currentScreen]);

  const resetForNewQuestion = () => {
    audioDeliveryService.stop();
    speechRecognizerRef.current?.stop();
    clearInterval(timerIntervalRef.current);
    clearTimeout(autoNextTimeoutRef.current);

    setIsSpeakingPhrase(false);
    setIsListeningMic(false);
    setSpokenText('');
    setEvaluation({ status: 'idle', matchedWord: null });
    setCountdown(5);
  };

  const playPhrase = async () => {
    if (!currentItem) return;
    audioDeliveryService.stop();
    speechRecognizerRef.current?.stop();
    setIsSpeakingPhrase(true);

    // In Test Mode: Turn mic on by default immediately so student is primed to speak
    if (mode === 'test') {
      startMicListening();
    }

    await audioDeliveryService.playQuestionAudio(
      currentItem.id,
      currentItem.sentence,
      selectedVoice,
      () => setIsSpeakingPhrase(true),
      () => {
        setIsSpeakingPhrase(false);
        if (mode === 'test') {
          startTestTimerCountdown();
        }
      }
    );
  };

  const startTestTimerCountdown = () => {
    setCountdown(5);
    audioDeliveryService.playChime('beep');

    if (!speechRecognizerRef.current?.getIsListening()) {
      startMicListening();
    }

    clearInterval(timerIntervalRef.current);
    timerIntervalRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timerIntervalRef.current);
          handleTestTimerExpiry();
          return 0;
        }
        audioDeliveryService.playChime('tick');
        return prev - 1;
      });
    }, 1000);
  };

  const handleTestTimerExpiry = () => {
    speechRecognizerRef.current?.stop();
    setIsListeningMic(false);

    setSpokenText((currentSpoken) => {
      const evalRes = evaluateAnswer(currentSpoken, currentItem.targetAnswers);
      finalizeAnswer(evalRes.isCorrect, currentSpoken, evalRes.matchedWord);
      return currentSpoken;
    });
  };

  const startMicListening = () => {
    if (!speechRecognizerRef.current) return;
    setIsListeningMic(true);

    const langCode = selectedVoice.accent === 'British' ? 'en-GB' : (selectedVoice.accent === 'Indian' ? 'en-IN' : 'en-US');

    speechRecognizerRef.current.start(
      langCode,
      (result) => {
        setSpokenText(result.transcript);
        const evalRes = evaluateAnswer(result.transcript, currentItem.targetAnswers);
        if (evalRes.isCorrect) {
          clearInterval(timerIntervalRef.current);
          speechRecognizerRef.current?.stop();
          setIsListeningMic(false);
          finalizeAnswer(true, result.transcript, evalRes.matchedWord);
        }
      },
      () => {},
      () => setIsListeningMic(false)
    );
  };

  const stopMicListening = () => {
    speechRecognizerRef.current?.stop();
    setIsListeningMic(false);
  };

  const finalizeAnswer = (isCorrect: boolean, answerGiven: string, matchedWord: string | null) => {
    if (isCorrect) {
      audioDeliveryService.playChime('success');
      confetti({ particleCount: 40, spread: 60, origin: { y: 0.6 } });
      setEvaluation({ status: 'correct', matchedWord });
      setScore(s => s + 1);
    } else {
      audioDeliveryService.playChime('error');
      setEvaluation({ status: 'incorrect', matchedWord: null });
    }

    setCompletedQuestions(prev => [
      ...prev,
      {
        id: currentItem.id,
        question: currentItem.sentence,
        targetAnswers: currentItem.targetAnswers,
        userAnswer: answerGiven || '(No response)',
        isCorrect,
        rationale: currentItem.rationale
      }
    ]);

    if (mode === 'test') {
      clearTimeout(autoNextTimeoutRef.current);
      autoNextTimeoutRef.current = setTimeout(() => {
        advanceQuestion();
      }, 1800);
    }
  };

  const advanceQuestion = () => {
    if (currentIndex < currentQuestions.length - 1) {
      setCurrentIndex(c => c + 1);
    } else {
      setCurrentScreen('summary');
    }
  };

  const startPractice = () => {
    setCurrentIndex(0);
    setScore(0);
    setCompletedQuestions([]);
    setCurrentScreen('lesson');
  };

  /* ========================================================================= */
  /* Screen 1: HOME PAGE                                                      */
  /* ========================================================================= */
  if (currentScreen === 'home') {
    return (
      <div style={{ maxWidth: '480px', margin: '0 auto', minHeight: '100vh', background: '#fff', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ background: 'var(--primary)', color: '#fff', width: '38px', height: '38px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Headphones size={20} />
            </div>
            <div>
              <h1 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>VibeLingua</h1>
              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>Vercel Fast Audio Practice</p>
            </div>
          </div>
          <span style={{ fontSize: '0.75rem', background: '#ecfdf5', color: '#059669', fontWeight: 700, padding: '4px 10px', borderRadius: '12px' }}>
            Instant CDN ⚡
          </span>
        </div>

        <div style={{ padding: '2rem 1.5rem 1.5rem', textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', padding: '6px 14px', background: '#eef2ff', borderRadius: '20px', color: 'var(--primary)', fontSize: '0.8rem', fontWeight: 700, gap: '6px', alignItems: 'center', marginBottom: '1rem' }}>
            <Sparkles size={15} /> 50 Real-life Workplace & Academic Prompts
          </div>
          <h2 style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: '1.25', margin: '0 0 0.75rem 0' }}>
            Master Spoken English By Listening
          </h2>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.5' }}>
            Listen to native phrases with missing collocations. Speak the missing word in 5 seconds to test your fluency.
          </p>
        </div>

        <div style={{ padding: '1rem 1.5rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
            Available Curriculum
          </div>

          <div 
            onClick={() => setCurrentScreen('module-select')}
            style={{
              background: '#ffffff',
              border: '2px solid #e0e7ff',
              borderRadius: '18px',
              padding: '1.5rem',
              cursor: 'pointer',
              boxShadow: '0 10px 25px -5px rgba(99, 102, 241, 0.08)',
              transition: 'all 0.2s ease',
              position: 'relative'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'linear-gradient(135deg, #4f46e5, #6366f1)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <BookOpen size={22} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    Fill In The Blanks
                  </h3>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    Speech & Ear Comprehension
                  </span>
                </div>
              </div>
              <span style={{ background: '#ecfdf5', color: '#059669', fontSize: '0.75rem', fontWeight: 700, padding: '3px 8px', borderRadius: '6px' }}>
                5 Modules
              </span>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.4', margin: '0 0 1rem 0' }}>
              Listen to the sentence read aloud, hear the cue word <strong>"blank"</strong>, and speak your answer directly into the mic.
            </p>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-light)', paddingTop: '0.75rem' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>50 Questions Total</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--primary)', fontWeight: 700, fontSize: '0.85rem' }}>
                Start Lesson <ChevronRight size={16} />
              </div>
            </div>
          </div>
        </div>

        <div style={{ padding: '1.5rem', textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border-light)' }}>
          Studio Pre-recorded Voices & Real-time Speech Recognition
        </div>
      </div>
    );
  }

  /* ========================================================================= */
  /* Screen 2: 5 MODULES SELECTION                                            */
  /* ========================================================================= */
  if (currentScreen === 'module-select') {
    return (
      <div style={{ maxWidth: '480px', margin: '0 auto', minHeight: '100vh', background: '#fff', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button 
            onClick={() => setCurrentScreen('home')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex' }}
          >
            <ArrowLeft size={20} color="var(--text-main)" />
          </button>
          <div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>Select a Module</h2>
            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>5 Thematic Listening Sets</p>
          </div>
        </div>

        <div style={{ padding: '1.25rem 1.5rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {MODULES.map((m) => {
            return (
              <div
                key={m.setNumber}
                onClick={() => {
                  setSelectedSet(m.setNumber);
                  setCurrentScreen('settings');
                }}
                style={{
                  background: '#ffffff',
                  border: '1.5px solid var(--border-light)',
                  borderRadius: '16px',
                  padding: '1.1rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  boxShadow: 'var(--shadow-sm)',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    background: m.badgeColor,
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '1rem'
                  }}>
                    {m.setNumber}
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)' }}>
                      {m.title}
                    </h4>
                    <p style={{ margin: '2px 0 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {m.count} questions • {m.description}
                    </p>
                  </div>
                </div>
                <ChevronRight size={18} color="var(--text-muted)" />
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  /* ========================================================================= */
  /* Screen 3: PRE-LESSON SETTINGS                                            */
  /* ========================================================================= */
  if (currentScreen === 'settings') {
    const currentModule = MODULES.find(m => m.setNumber === selectedSet) || MODULES[0];

    return (
      <div style={{ maxWidth: '480px', margin: '0 auto', minHeight: '100vh', background: '#fff', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button 
            onClick={() => setCurrentScreen('module-select')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex' }}
          >
            <ArrowLeft size={20} color="var(--text-main)" />
          </button>
          <div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>Lesson Setup</h2>
            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>Set {currentModule.setNumber}: {currentModule.title}</p>
          </div>
        </div>

        <div style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem', overflowY: 'auto' }}>
          {/* Practice Mode */}
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Practice Mode
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '0.5rem' }}>
              <div
                onClick={() => setMode('test')}
                style={{
                  border: `2px solid ${mode === 'test' ? 'var(--danger)' : 'var(--border-light)'}`,
                  background: mode === 'test' ? 'var(--danger-light)' : '#fff',
                  borderRadius: '12px',
                  padding: '1rem',
                  cursor: 'pointer',
                  textAlign: 'center'
                }}
              >
                <Flame size={22} color={mode === 'test' ? 'var(--danger)' : 'var(--text-muted)'} style={{ marginBottom: '4px' }} />
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: mode === 'test' ? 'var(--danger)' : 'var(--text-main)' }}>
                  Test Mode
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  5s limit • Mic auto-on
                </div>
              </div>

              <div
                onClick={() => setMode('train')}
                style={{
                  border: `2px solid ${mode === 'train' ? 'var(--primary)' : 'var(--border-light)'}`,
                  background: mode === 'train' ? 'var(--primary-light)' : '#fff',
                  borderRadius: '12px',
                  padding: '1rem',
                  cursor: 'pointer',
                  textAlign: 'center'
                }}
              >
                <BookOpen size={22} color={mode === 'train' ? 'var(--primary)' : 'var(--text-muted)'} style={{ marginBottom: '4px' }} />
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: mode === 'train' ? 'var(--primary)' : 'var(--text-main)' }}>
                  Train Mode
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  Unlimited replays
                </div>
              </div>
            </div>
          </div>

          {/* Display Mode (Blind listening) */}
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Display Mode
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '0.5rem' }}>
              <div
                onClick={() => setShowSentenceText(true)}
                style={{
                  border: `2px solid ${showSentenceText ? 'var(--primary)' : 'var(--border-light)'}`,
                  background: showSentenceText ? 'var(--primary-light)' : '#fff',
                  borderRadius: '12px',
                  padding: '0.85rem',
                  cursor: 'pointer',
                  textAlign: 'center'
                }}
              >
                <Eye size={20} color={showSentenceText ? 'var(--primary)' : 'var(--text-muted)'} style={{ marginBottom: '2px' }} />
                <div style={{ fontWeight: 700, fontSize: '0.85rem', color: showSentenceText ? 'var(--primary)' : 'var(--text-main)' }}>
                  Text: ON
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                  See fill-in-blank
                </div>
              </div>

              <div
                onClick={() => setShowSentenceText(false)}
                style={{
                  border: `2px solid ${!showSentenceText ? 'var(--warning)' : 'var(--border-light)'}`,
                  background: !showSentenceText ? 'var(--warning-light)' : '#fff',
                  borderRadius: '12px',
                  padding: '0.85rem',
                  cursor: 'pointer',
                  textAlign: 'center'
                }}
              >
                <EyeOff size={20} color={!showSentenceText ? 'var(--warning)' : 'var(--text-muted)'} style={{ marginBottom: '2px' }} />
                <div style={{ fontWeight: 700, fontSize: '0.85rem', color: !showSentenceText ? 'var(--warning)' : 'var(--text-main)' }}>
                  Text: OFF (Blind)
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                  Ears only (Challenging)
                </div>
              </div>
            </div>
          </div>

          {/* Choose Voice & Accent */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Voice & Accent
              </label>
              <span style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 600 }}>
                Instant CDN Audio ⚡
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {STORED_VOICES.map((voice) => {
                const isSelected = selectedVoice.id === voice.id;
                return (
                  <div
                    key={voice.id}
                    onClick={() => {
                      setSelectedVoice(voice);
                      audioDeliveryService.playQuestionAudio(1, "Please remember to blank off the projector.", voice);
                    }}
                    style={{
                      border: `1.5px solid ${isSelected ? 'var(--primary)' : 'var(--border-light)'}`,
                      background: isSelected ? 'var(--primary-light)' : '#fff',
                      borderRadius: '12px',
                      padding: '0.75rem 1rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span style={{ fontSize: '1.4rem' }}>{voice.flag}</span>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-main)' }}>
                          {voice.name}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          {voice.accent} • {voice.gender}
                        </div>
                      </div>
                    </div>
                    {isSelected ? (
                      <Check size={18} color="var(--primary)" />
                    ) : (
                      <Volume2 size={16} color="var(--text-muted)" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Start Button (Instant, no waiting) */}
        <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--border-light)' }}>
          <button
            onClick={startPractice}
            style={{
              width: '100%',
              background: 'var(--primary)',
              color: '#fff',
              border: 'none',
              padding: '14px',
              borderRadius: '14px',
              fontWeight: 800,
              fontSize: '1rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)'
            }}
          >
            <span>Start Practice (Instant)</span>
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
    );
  }

  /* ========================================================================= */
  /* Screen 4: ACTIVE LESSON SCREEN                                           */
  /* ========================================================================= */
  if (currentScreen === 'lesson') {
    const totalCount = currentQuestions.length;
    const progressPercent = ((currentIndex + 1) / totalCount) * 100;
    const remainingCount = totalCount - (currentIndex + 1);

    return (
      <div style={{ maxWidth: '480px', margin: '0 auto', minHeight: '100vh', background: '#f8fafc', display: 'flex', flexDirection: 'column' }}>
        {/* Top Header with Progress and Remaining Count */}
        <div style={{ background: '#fff', borderBottom: '1px solid var(--border-light)', padding: '1rem 1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <button
              onClick={() => {
                audioDeliveryService.stop();
                speechRecognizerRef.current?.stop();
                setCurrentScreen('settings');
              }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, display: 'flex', color: 'var(--text-secondary)' }}
            >
              <ArrowLeft size={18} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--primary)' }}>
                {currentIndex + 1} of {totalCount}
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                ({remainingCount} more remaining)
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', background: 'var(--bg-subtle)', padding: '3px 8px', borderRadius: '8px', fontWeight: 600 }}>
              <span>{selectedVoice.flag}</span>
              <span>{mode === 'test' ? 'Test' : 'Train'}</span>
            </div>
          </div>

          {/* Progression Bar */}
          <div style={{ width: '100%', height: '8px', background: '#e2e8f0', borderRadius: '999px', overflow: 'hidden' }}>
            <div 
              style={{ 
                width: `${progressPercent}%`, 
                height: '100%', 
                background: 'linear-gradient(90deg, #4f46e5, #0ea5e9)',
                borderRadius: '999px',
                transition: 'width 0.3s ease'
              }} 
            />
          </div>
        </div>

        {/* Lesson Body */}
        <div style={{ padding: '1.25rem 1.5rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Card with Target Phrase */}
          <div style={{
            background: '#ffffff',
            border: '1.5px solid var(--border-light)',
            borderRadius: '20px',
            padding: '1.75rem 1.25rem',
            textAlign: 'center',
            boxShadow: 'var(--shadow-sm)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            minHeight: '180px',
            justifyContent: 'center',
            position: 'relative'
          }}>
            {/* Audio Waveform Indicator */}
            {isSpeakingPhrase && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '3px', marginBottom: '0.75rem' }}>
                <div className="wave-bar" style={{ animationDelay: '0s' }} />
                <div className="wave-bar" style={{ animationDelay: '0.2s' }} />
                <div className="wave-bar" style={{ animationDelay: '0.4s' }} />
                <div className="wave-bar" style={{ animationDelay: '0.1s' }} />
                <div className="wave-bar" style={{ animationDelay: '0.3s' }} />
                <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 700, marginLeft: '6px' }}>
                  Playing phrase (listening for "blank")...
                </span>
              </div>
            )}

            {/* Display Sentence or Blind listening notice */}
            {showSentenceText ? (
              <p style={{
                fontSize: '1.15rem',
                lineHeight: '1.6',
                color: 'var(--text-main)',
                fontWeight: 600,
                margin: 0
              }}>
                {currentItem.sentence.split(/(_______)/g).map((part, i) => {
                  if (part === '_______') {
                    return (
                      <span
                        key={i}
                        style={{
                          display: 'inline-block',
                          margin: '0 6px',
                          borderBottom: '3px solid var(--primary)',
                          color: evaluation.status === 'correct' ? 'var(--success)' : 'var(--primary)',
                          fontWeight: 800,
                          padding: '0 4px',
                          fontFamily: 'var(--font-mono)'
                        }}
                      >
                        {evaluation.matchedWord || '[ blank ]'}
                      </span>
                    );
                  }
                  return <span key={i}>{part}</span>;
                })}
              </p>
            ) : (
              <div style={{ textAlign: 'center', padding: '0.5rem' }}>
                <Headphones size={36} color="var(--primary)" style={{ marginBottom: '0.5rem' }} />
                <h4 style={{ margin: '0 0 4px 0', fontSize: '1rem', color: 'var(--text-main)' }}>Blind Listening Active</h4>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Sentence hidden. Listen carefully for the word <strong>"blank"</strong> and say what fits!
                </p>
              </div>
            )}

            {/* Re-listen button in Train Mode */}
            {mode === 'train' && (
              <button
                onClick={playPhrase}
                disabled={isSpeakingPhrase}
                style={{
                  marginTop: '1rem',
                  background: 'var(--primary-light)',
                  border: 'none',
                  color: 'var(--primary)',
                  padding: '6px 14px',
                  borderRadius: '20px',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
              >
                <Volume2 size={15} />
                <span>Re-listen</span>
              </button>
            )}
          </div>

          {/* Test Mode Timer Countdown Indicator */}
          {mode === 'test' && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '8px',
              background: countdown <= 2 ? 'var(--danger-light)' : '#fff',
              border: `1.5px solid ${countdown <= 2 ? 'var(--danger)' : 'var(--border-light)'}`,
              borderRadius: '12px'
            }}>
              <Timer size={18} color={countdown <= 2 ? 'var(--danger)' : 'var(--primary)'} />
              <span style={{ fontSize: '0.9rem', fontWeight: 800, color: countdown <= 2 ? 'var(--danger)' : 'var(--text-main)' }}>
                {countdown}s remaining to speak your answer
              </span>
            </div>
          )}

          {/* Mic Interaction Area */}
          <div style={{
            background: '#ffffff',
            border: '1.5px solid var(--border-light)',
            borderRadius: '20px',
            padding: '1.5rem',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1rem'
          }}>
            {/* Big Mic Button - default on in test mode */}
            <button
              onClick={() => {
                if (isListeningMic) {
                  stopMicListening();
                } else {
                  startMicListening();
                }
              }}
              style={{
                width: '76px',
                height: '76px',
                borderRadius: '50%',
                background: isListeningMic ? 'var(--danger)' : 'var(--primary)',
                color: '#fff',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: isListeningMic ? '0 0 20px rgba(239, 68, 68, 0.4)' : '0 8px 16px rgba(79, 70, 229, 0.25)',
                transition: 'all 0.2s ease'
              }}
              className={isListeningMic ? 'animate-mic-pulse' : ''}
            >
              {isListeningMic ? <Mic size={34} /> : <Mic size={34} />}
            </button>

            {/* Real-time Recognition Text */}
            <div style={{ minHeight: '44px' }}>
              {isListeningMic ? (
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--danger)', fontWeight: 700 }}>
                    {mode === 'test' ? 'Mic ON (Test Mode Active) • Say the missing word now!' : 'Listening... Speak the missing word!'}
                  </div>
                  {spokenText && (
                    <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '4px' }}>
                      "{spokenText}"
                    </div>
                  )}
                </div>
              ) : spokenText ? (
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Heard Word:</div>
                  <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)' }}>
                    "{spokenText}"
                  </div>
                </div>
              ) : (
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {mode === 'test'
                    ? 'Microphone is on. Speak your answer directly.'
                    : 'Tap microphone and speak the missing word.'}
                </div>
              )}
            </div>

            {/* Evaluation Result Feedback */}
            {evaluation.status !== 'idle' && (
              <div style={{
                width: '100%',
                background: evaluation.status === 'correct' ? 'var(--success-light)' : 'var(--danger-light)',
                border: `1.5px solid ${evaluation.status === 'correct' ? 'var(--success)' : 'var(--danger)'}`,
                borderRadius: '12px',
                padding: '0.75rem 1rem',
                textAlign: 'left'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 800, fontSize: '0.9rem', color: evaluation.status === 'correct' ? '#047857' : '#b91c1c' }}>
                  {evaluation.status === 'correct' ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
                  <span>{evaluation.status === 'correct' ? 'Correct Answer!' : 'Incorrect / Expired'}</span>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  Target: <strong>{currentItem.targetAnswers.join(' / ')}</strong>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px', fontStyle: 'italic' }}>
                  {currentItem.rationale}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Navigation Bar */}
        <div style={{ background: '#fff', borderTop: '1px solid var(--border-light)', padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button
            onClick={() => {
              if (currentIndex > 0) setCurrentIndex(c => c - 1);
            }}
            disabled={currentIndex === 0}
            style={{
              background: 'none',
              border: '1px solid var(--border-light)',
              padding: '10px 16px',
              borderRadius: '10px',
              fontSize: '0.85rem',
              fontWeight: 700,
              color: currentIndex === 0 ? 'var(--text-muted)' : 'var(--text-main)',
              cursor: currentIndex === 0 ? 'not-allowed' : 'pointer'
            }}
          >
            Previous
          </button>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {mode === 'train' && (
              <button
                onClick={() => {
                  const evalRes = evaluateAnswer(spokenText, currentItem.targetAnswers);
                  finalizeAnswer(evalRes.isCorrect, spokenText, evalRes.matchedWord);
                }}
                disabled={!spokenText || evaluation.status !== 'idle'}
                style={{
                  background: 'var(--primary-light)',
                  color: 'var(--primary)',
                  border: 'none',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  cursor: (!spokenText || evaluation.status !== 'idle') ? 'not-allowed' : 'pointer'
                }}
              >
                Check
              </button>
            )}

            <button
              onClick={advanceQuestion}
              style={{
                background: 'var(--primary)',
                color: '#fff',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '10px',
                fontSize: '0.85rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <span>{currentIndex === currentQuestions.length - 1 ? 'Finish' : 'Next'}</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ========================================================================= */
  /* Screen 5: LESSON SUMMARY / SCORECARD                                     */
  /* ========================================================================= */
  return (
    <div style={{ maxWidth: '480px', margin: '0 auto', minHeight: '100vh', background: '#fff', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '2rem 1.5rem', textAlign: 'center', flex: 1, overflowY: 'auto' }}>
        <div style={{
          width: '70px',
          height: '70px',
          borderRadius: '50%',
          background: 'var(--success-light)',
          color: 'var(--success)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '1rem'
        }}>
          <Award size={36} />
        </div>

        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0 0 4px 0' }}>Lesson Finished!</h2>
        <p style={{ margin: '0 0 1.5rem 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Set {selectedSet}: {MODULES.find(m => m.setNumber === selectedSet)?.title}
        </p>

        {/* Score Pill */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          background: 'var(--bg-subtle)',
          padding: '0.75rem 1.5rem',
          borderRadius: '16px',
          border: '1px solid var(--border-light)',
          marginBottom: '1.5rem'
        }}>
          <span style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--primary)' }}>{score}</span>
          <span style={{ fontSize: '1.1rem', color: 'var(--text-muted)' }}>/ {currentQuestions.length}</span>
          <span style={{
            fontSize: '0.8rem',
            fontWeight: 800,
            background: score / currentQuestions.length >= 0.7 ? 'var(--success-light)' : 'var(--warning-light)',
            color: score / currentQuestions.length >= 0.7 ? 'var(--success)' : 'var(--warning)',
            padding: '3px 8px',
            borderRadius: '6px'
          }}>
            {Math.round((score / currentQuestions.length) * 100)}%
          </span>
        </div>

        {/* Answer Breakdown */}
        <div style={{ textAlign: 'left', marginBottom: '1.5rem' }}>
          <h4 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
            Answer Review
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {completedQuestions.map((q, idx) => (
              <div
                key={idx}
                style={{
                  border: '1px solid var(--border-light)',
                  borderRadius: '12px',
                  padding: '0.75rem 1rem',
                  background: q.isCorrect ? '#ffffff' : '#fff5f5'
                }}
              >
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '3px' }}>
                  {q.question}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  You said: <strong style={{ color: q.isCorrect ? 'var(--success)' : 'var(--danger)' }}>"{q.userAnswer}"</strong> • Target: {q.targetAnswers.join(' / ')}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <button
            onClick={() => {
              setCurrentIndex(0);
              setScore(0);
              setCompletedQuestions([]);
              setCurrentScreen('lesson');
            }}
            style={{
              background: 'var(--primary)',
              color: '#fff',
              border: 'none',
              padding: '12px',
              borderRadius: '12px',
              fontWeight: 800,
              fontSize: '0.9rem',
              cursor: 'pointer'
            }}
          >
            Practice This Set Again
          </button>

          <button
            onClick={() => setCurrentScreen('module-select')}
            style={{
              background: '#fff',
              border: '1.5px solid var(--border-light)',
              color: 'var(--text-main)',
              padding: '12px',
              borderRadius: '12px',
              fontWeight: 700,
              fontSize: '0.9rem',
              cursor: 'pointer'
            }}
          >
            Choose Another Module
          </button>
        </div>
      </div>
    </div>
  );
}
