import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Stage2TypographyProps {
  onComplete: () => void;
}

interface Beat {
  id: number;
  text: string;
  emoji?: string;
  type: 'normal' | 'serif' | 'thinking' | 'energetic' | 'golden' | 'emotional' | 'final';
  duration: number;
  special?: string;
}

const BEATS: Beat[] = [
  { id: 1, text: 'Ohhhhh... the Birthday Girl is finally here!', emoji: '✨🎂', type: 'normal', duration: 5000 },
  { id: 2, text: 'Hello my love... my favorite human in the entire universe.', emoji: '🌸', type: 'serif', duration: 5500 },
  { id: 3, text: 'This special place was crafted for only one person in the world...', type: 'normal', duration: 5000 },
  { id: 4, text: 'For how long do you think I\'ve been secretly building this for you?', emoji: '🤔', type: 'normal', duration: 5000 },
  { id: 5, text: 'Mmmmmm... idk maybe 1 month?', emoji: '💭', type: 'thinking', duration: 4000 },
  { id: 6, text: 'No no no... 2 months?', emoji: '🤭', type: 'normal', duration: 3500 },
  { id: 7, text: 'NONONONONO... MOREEEEEE!', emoji: '🚀💫', type: 'energetic', duration: 4000 },
  { id: 8, text: 'Ahhhhh... for FIVE whole months I have been coding, designing, and pouring my whole soul into this...', type: 'golden', duration: 8000, special: 'counter' },
  { id: 9, text: 'Just for my angel... because you are the most precious, irreplaceable part of my life.', emoji: '🌻💖', type: 'emotional', duration: 6000 },
  { id: 10, text: 'Every photo, every letter, every song, and every hidden surprise was made with endless love for you, Divyanshi.', type: 'emotional', duration: 6500 },
  { id: 11, text: 'Are you ready to step into your birthday universe?', type: 'final', duration: 0 },
];

export default function Stage2Typography({ onComplete }: Stage2TypographyProps) {
  const [currentBeat, setCurrentBeat] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isSkipped, setIsSkipped] = useState(false);
  const [counterValue, setCounterValue] = useState(0);
  const [showCounter, setShowCounter] = useState(false);
  const [showEnterButton, setShowEnterButton] = useState(false);
  const [sparkles, setSparkles] = useState<{ id: number; x: number; y: number }[]>([]);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const counterRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sparkleIdRef = useRef(0);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const audioNodesRef = useRef<OscillatorNode[]>([]);

  // Ambient audio generation using Web Audio API
  const toggleAudio = useCallback(() => {
    if (isAudioPlaying) {
      // Stop audio
      audioNodesRef.current.forEach(node => {
        try { node.stop(); } catch { /* ignore */ }
      });
      audioNodesRef.current = [];
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
        audioCtxRef.current = null;
      }
      setIsAudioPlaying(false);
    } else {
      // Start ambient audio
      try {
        const ctx = new AudioContext();
        audioCtxRef.current = ctx;

        const notes = [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5
        const oscillators: OscillatorNode[] = [];

        notes.forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.value = freq;
          gain.gain.value = 0.015; // Very soft
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(ctx.currentTime + i * 0.3);
          oscillators.push(osc);
        });

        audioNodesRef.current = oscillators;
        setIsAudioPlaying(true);
      } catch {
        // Web Audio API not available
      }
    }
  }, [isAudioPlaying]);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      audioNodesRef.current.forEach(node => {
        try { node.stop(); } catch { /* ignore */ }
      });
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
      }
    };
  }, []);

  const advanceBeat = useCallback(() => {
    if (currentBeat < BEATS.length - 1) {
      setCurrentBeat(prev => prev + 1);
    }
  }, [currentBeat]);

  // Sparkle burst on beat 1
  useEffect(() => {
    if (currentBeat === 0 && !isSkipped) {
      const newSparkles = Array.from({ length: 12 }, () => ({
        id: sparkleIdRef.current++,
        x: 30 + Math.random() * 40,
        y: 30 + Math.random() * 40,
      }));
      setSparkles(newSparkles);
      setTimeout(() => setSparkles([]), 2000);
    }
  }, [currentBeat, isSkipped]);

  // Auto-advance timer
  useEffect(() => {
    if (isPaused || isSkipped) return;
    const beat = BEATS[currentBeat];
    if (!beat || beat.type === 'final') return;
    timerRef.current = setTimeout(() => advanceBeat(), beat.duration);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [currentBeat, isPaused, isSkipped, advanceBeat]);

  // Counter animation for beat 8
  useEffect(() => {
    if (currentBeat === 7 && BEATS[7].special === 'counter') {
      setShowCounter(true);
      setCounterValue(0);
      let count = 0;
      counterRef.current = setInterval(() => {
        count++;
        setCounterValue(count);
        if (count >= 5) {
          if (counterRef.current) clearInterval(counterRef.current);
          setTimeout(() => setShowCounter(false), 1800);
        }
      }, 700);
    }
    return () => { if (counterRef.current) clearInterval(counterRef.current); };
  }, [currentBeat]);

  // Show enter button on final beat
  useEffect(() => {
    if (currentBeat === BEATS.length - 1) {
      setTimeout(() => setShowEnterButton(true), 1500);
    }
  }, [currentBeat]);

  // Keyboard controls
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        if (currentBeat === BEATS.length - 1) return;
        if (timerRef.current) clearTimeout(timerRef.current);
        advanceBeat();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [currentBeat, advanceBeat]);

  const handleSkip = () => {
    setIsSkipped(true);
    setTimeout(() => onComplete(), 800);
  };

  const handleTap = () => {
    if (currentBeat === BEATS.length - 1) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    advanceBeat();
  };

  const beat = BEATS[currentBeat];
  const progress = ((currentBeat + 1) / BEATS.length) * 100;

  return (
    <motion.div
      className="fixed inset-0 flex flex-col items-center justify-center overflow-hidden select-none"
      style={{ background: '#0b0c10' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.5 }}
      onClick={handleTap}
    >
      {/* Dynamic background based on beat type */}
      <BeatBackground beatType={beat.type} beatId={beat.id} />

      {/* Energetic beat flash & shake overlay */}
      <AnimatePresence>
        {beat.type === 'energetic' && (
          <motion.div
            className="fixed inset-0 pointer-events-none z-[15]"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.8, 0, 0.5, 0, 0.3, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
            style={{
              background: 'radial-gradient(circle, rgba(232,133,42,0.15) 0%, rgba(255,77,109,0.08) 40%, transparent 65%)',
            }}
          />
        )}
      </AnimatePresence>

      {/* Controls */}
      <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-50 flex gap-1.5 sm:gap-2">
        <button
          onClick={(e) => { e.stopPropagation(); handleSkip(); }}
          className="px-2.5 py-1 sm:px-3 sm:py-1.5 text-[9px] sm:text-xs tracking-wider uppercase rounded-full border transition-all duration-300 hover:bg-white/5 active:scale-95"
          style={{ borderColor: 'rgba(232,133,42,0.25)', color: 'rgba(232,133,42,0.6)' }}
        >
          Skip
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); setIsPaused(!isPaused); }}
          className="px-2.5 py-1 sm:px-3 sm:py-1.5 text-[9px] sm:text-xs tracking-wider uppercase rounded-full border transition-all duration-300 hover:bg-white/5 active:scale-95"
          style={{ borderColor: 'rgba(255,77,109,0.25)', color: 'rgba(255,77,109,0.6)' }}
        >
          {isPaused ? '▶' : '⏸'}
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); toggleAudio(); }}
          className="px-2.5 py-1 sm:px-3 sm:py-1.5 text-[9px] sm:text-xs tracking-wider uppercase rounded-full border transition-all duration-300 hover:bg-white/5 active:scale-95"
          style={{ borderColor: isAudioPlaying ? 'rgba(232,133,42,0.4)' : 'rgba(255,255,255,0.15)', color: isAudioPlaying ? 'rgba(232,133,42,0.8)' : 'rgba(255,255,255,0.35)' }}
        >
          {isAudioPlaying ? '🔊' : '🔇'}
        </button>
      </div>

      {/* Progress bar */}
      <div className="absolute top-0 left-0 right-0 h-[2px] z-40" style={{ background: 'rgba(255,255,255,0.03)' }}>
        <motion.div
          className="h-full"
          style={{ background: 'linear-gradient(90deg, #e8852a, #ff4d6d, #f5a623)' }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>

      {/* Beat indicator */}
      <div className="absolute top-4 left-4 sm:top-5 sm:left-6 z-50">
        <span className="text-[9px] sm:text-[11px] tracking-[0.2em] uppercase font-light" style={{ color: 'rgba(232,133,42,0.35)' }}>
          {currentBeat + 1} / {BEATS.length}
        </span>
      </div>

      {/* Main content area */}
      <div className="relative z-10 flex flex-col items-center justify-center px-6 sm:px-10 md:px-16 lg:px-20 max-w-3xl mx-auto text-center min-h-[200px]">
        <AnimatePresence mode="wait">
          {!isSkipped && (
            <motion.div
              key={beat.id}
              className="w-full"
              initial={{ opacity: 0, y: 40, scale: 0.92, filter: 'blur(8px)' }}
              animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -40, scale: 0.92, filter: 'blur(8px)' }}
              transition={{ duration: 0.9, ease: [0.34, 1.56, 0.64, 1] }}
            >
              {/* Counter overlay for beat 8 */}
              <AnimatePresence>
                {showCounter && (
                  <motion.div
                    className="mb-8"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 1.8, opacity: 0 }}
                    transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
                  >
                    <div className="relative">
                      <motion.span
                        className="text-7xl sm:text-8xl md:text-9xl font-black block gradient-text-shimmer"
                        key={counterValue}
                        initial={{ scale: 0.3, opacity: 0, rotateX: -90 }}
                        animate={{ scale: 1, opacity: 1, rotateX: 0 }}
                        exit={{ scale: 2, opacity: 0 }}
                        transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
                      >
                        {counterValue}
                      </motion.span>
                      {/* Glow behind number */}
                      <motion.div
                        className="absolute inset-0 -z-10 blur-xl"
                        animate={{ opacity: [0.3, 0.6, 0.3] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        style={{ background: 'radial-gradient(circle, rgba(232,133,42,0.3), rgba(255,77,109,0.2), transparent)' }}
                      />
                    </div>
                    <motion.p
                      className="text-xs sm:text-sm mt-3 tracking-[0.3em] uppercase font-light"
                      style={{ color: 'rgba(232,133,42,0.6)' }}
                      animate={{ opacity: [0.4, 1, 0.4] }}
                      transition={{ duration: 1.2, repeat: Infinity }}
                    >
                      {counterValue === 1 ? 'Month' : 'Months'}
                    </motion.p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Beat content */}
              <BeatContent beat={beat} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Sparkle bursts */}
      {sparkles.map(s => (
        <motion.div
          key={s.id}
          className="absolute z-20 pointer-events-none text-lg sm:text-xl"
          style={{ left: `${s.x}%`, top: `${s.y}%`, color: '#f5a623' }}
          initial={{ scale: 0, opacity: 1, rotate: 0 }}
          animate={{ scale: [0, 1.5, 0], opacity: [1, 1, 0], rotate: 180, x: (Math.random() - 0.5) * 100, y: (Math.random() - 0.5) * 100 }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
        >
          ✦
        </motion.div>
      ))}

      {/* Enter button */}
      <AnimatePresence>
        {showEnterButton && (
          <motion.div
            className="absolute bottom-14 sm:bottom-16 md:bottom-20 z-30"
            initial={{ y: 40, opacity: 0, scale: 0.7 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, ease: [0.34, 1.56, 0.64, 1] }}
          >
            <motion.button
              onClick={(e) => { e.stopPropagation(); onComplete(); }}
              className="relative px-8 py-3 sm:px-10 sm:py-4 rounded-full text-sm sm:text-base font-medium tracking-wider overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, #e8852a, #ff4d6d)',
                color: '#fff',
                boxShadow: '0 0 30px rgba(232,133,42,0.3), 0 0 60px rgba(255,77,109,0.2), inset 0 1px 0 rgba(255,255,255,0.2)',
              }}
              whileHover={{ scale: 1.08, boxShadow: '0 0 50px rgba(232,133,42,0.5), 0 0 100px rgba(255,77,109,0.3)' }}
              whileTap={{ scale: 0.95 }}
              animate={{
                boxShadow: [
                  '0 0 30px rgba(232,133,42,0.3), 0 0 60px rgba(255,77,109,0.2)',
                  '0 0 50px rgba(232,133,42,0.5), 0 0 90px rgba(255,77,109,0.35)',
                  '0 0 30px rgba(232,133,42,0.3), 0 0 60px rgba(255,77,109,0.2)',
                ],
              }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
            >
              Enter My Birthday Vaults ✨
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tap hint */}
      {beat.type !== 'final' && !isSkipped && (
        <motion.div
          className="absolute bottom-5 sm:bottom-7 z-20"
          animate={{ opacity: [0.15, 0.5, 0.15] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        >
          <span className="text-[9px] sm:text-[11px] tracking-[0.2em] uppercase font-light" style={{ color: 'rgba(255,255,255,0.15)' }}>
            Tap or Space to continue
          </span>
        </motion.div>
      )}

      {/* Floating decorations */}
      <FloatingSparkles />

      {/* Vignette */}
      <div
        className="fixed inset-0 pointer-events-none z-[5]"
        style={{ background: 'radial-gradient(ellipse at center, transparent 40%, rgba(11,12,16,0.5) 75%, rgba(11,12,16,0.85) 100%)' }}
      />
    </motion.div>
  );
}

// Dynamic background per beat type
function BeatBackground({ beatType, beatId }: { beatType: Beat['type']; beatId: number }) {
  const gradientMap: Record<string, string> = {
    normal: 'radial-gradient(circle, rgba(232,133,42,0.04) 0%, rgba(255,77,109,0.02) 35%, transparent 60%)',
    serif: 'radial-gradient(circle, rgba(255,77,109,0.06) 0%, rgba(232,133,42,0.02) 35%, transparent 60%)',
    thinking: 'radial-gradient(circle, rgba(100,100,150,0.04) 0%, transparent 50%)',
    energetic: 'radial-gradient(circle, rgba(232,133,42,0.08) 0%, rgba(255,77,109,0.04) 30%, transparent 55%)',
    golden: 'radial-gradient(circle, rgba(232,133,42,0.08) 0%, rgba(245,166,35,0.04) 30%, transparent 55%)',
    emotional: 'radial-gradient(circle, rgba(255,77,109,0.05) 0%, rgba(232,133,42,0.03) 30%, transparent 55%)',
    final: 'radial-gradient(circle, rgba(232,133,42,0.06) 0%, rgba(255,77,109,0.04) 25%, transparent 50%)',
  };

  return (
    <div className="absolute inset-0 pointer-events-none z-0">
      <motion.div
        key={beatId}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{ width: '700px', height: '700px', background: gradientMap[beatType] || gradientMap.normal }}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1.2, ease: 'easeOut' }}
      >
        <motion.div
          className="absolute inset-0 rounded-full"
          animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.9, 0.5] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
          style={{ background: 'inherit' }}
        />
      </motion.div>
    </div>
  );
}

// Word-by-word animated beat content
function BeatContent({ beat }: { beat: Beat }) {
  const words = beat.text.split(' ');

  return (
    <div>
      <motion.div className="leading-relaxed sm:leading-loose md:leading-loose">
        {words.map((word, i) => {
          const delay = i * getWordDelay(beat.type);
          return (
            <motion.span
              key={i}
              className="inline-block"
              style={{ marginRight: '0.3em', ...getWordStyle(beat) }}
              initial={{ opacity: 0, y: 20, scale: 0.7, filter: 'blur(4px)' }}
              animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
              transition={{
                delay,
                duration: 0.7,
                ease: [0.34, 1.56, 0.64, 1],
              }}
            >
              {renderWord(word, beat, i, words.length, delay)}
            </motion.span>
          );
        })}
        {beat.emoji && (
          <motion.span
            className="inline-block ml-2"
            initial={{ opacity: 0, scale: 0, rotate: -30 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ delay: words.length * getWordDelay(beat.type) + 0.4, duration: 0.9, ease: [0.34, 1.56, 0.64, 1] }}
          >
            {beat.emoji}
          </motion.span>
        )}
      </motion.div>

      {/* Beat-specific decorative elements */}
      {beat.type === 'energetic' && <EnergeticDecor />}
      {beat.type === 'emotional' && <EmotionalDecor />}
    </div>
  );
}

function getWordDelay(type: Beat['type']): number {
  switch (type) {
    case 'energetic': return 0.04;
    case 'final': return 0.1;
    case 'golden': return 0.06;
    default: return 0.07;
  }
}

function getWordStyle(beat: Beat): React.CSSProperties {
  switch (beat.type) {
    case 'normal':
      return {
        fontSize: 'clamp(1.15rem, 3.2vw, 1.7rem)',
        fontFamily: "'Inter', system-ui, sans-serif",
        fontWeight: 400,
        color: '#e2e2e2',
        letterSpacing: '0.02em',
      };
    case 'serif':
      return {
        fontSize: 'clamp(1.25rem, 3.8vw, 2rem)',
        fontFamily: "'Playfair Display', Georgia, 'Times New Roman', serif",
        fontWeight: 400,
        fontStyle: 'italic',
        letterSpacing: '0.04em',
      };
    case 'thinking':
      return {
        fontSize: 'clamp(1.1rem, 3vw, 1.5rem)',
        fontWeight: 300,
        color: '#b0b0c0',
        letterSpacing: '0.02em',
      };
    case 'energetic':
      return {
        fontSize: 'clamp(1.4rem, 4.5vw, 2.5rem)',
        fontWeight: 800,
        letterSpacing: '0.05em',
      };
    case 'golden':
      return {
        fontSize: 'clamp(1.05rem, 2.8vw, 1.45rem)',
        fontWeight: 400,
        color: '#e8c87a',
        letterSpacing: '0.02em',
      };
    case 'emotional':
      return {
        fontSize: 'clamp(1.15rem, 3.2vw, 1.7rem)',
        fontWeight: 400,
        letterSpacing: '0.025em',
      };
    case 'final':
      return {
        fontSize: 'clamp(1.3rem, 4vw, 2.2rem)',
        fontFamily: "'Playfair Display', Georgia, serif",
        fontWeight: 600,
        letterSpacing: '0.04em',
      };
    default:
      return {};
  }
}

function renderWord(word: string, beat: Beat, index: number, _totalWords: number, delay: number) {
  const isHighlight = checkHighlight(word, beat);

  if (beat.type === 'serif') {
    return <span className="gradient-text-shimmer">{word}</span>;
  }

  if (beat.type === 'energetic') {
    return (
      <motion.span
        className="gradient-text"
        animate={index % 3 === 0 ? { scale: [1, 1.08, 1] } : {}}
        transition={{ duration: 0.6, delay: delay + 0.3, ease: 'easeInOut' }}
      >
        {word}
      </motion.span>
    );
  }

  if (beat.type === 'emotional' && isHighlight) {
    return <span className="gradient-text font-semibold">{word}</span>;
  }

  if (beat.type === 'emotional') {
    return <span style={{ color: '#d4d4d4' }}>{word}</span>;
  }

  if (beat.type === 'final') {
    return <span className="gradient-text-shimmer" style={{ textShadow: '0 0 20px rgba(232,133,42,0.3), 0 0 40px rgba(255,77,109,0.2)' }}>{word}</span>;
  }

  if (beat.type === 'thinking') {
    return (
      <motion.span
        className="inline-block"
        animate={{ x: [0, -2, 2, -1, 1, 0] }}
        transition={{ duration: 0.5, delay: delay + 0.2 }}
      >
        {word}
      </motion.span>
    );
  }

  if (beat.type === 'golden' && isHighlight) {
    return (
      <span className="gradient-text font-semibold" style={{ WebkitTextFillColor: 'transparent' }}>
        {word}
      </span>
    );
  }

  if (isHighlight) {
    return (
      <span className="gradient-text font-semibold" style={{ WebkitTextFillColor: 'transparent' }}>
        {word}
      </span>
    );
  }

  return word;
}

function checkHighlight(word: string, beat: Beat): boolean {
  const highlights: Record<number, string[]> = {
    1: ['Ohhhhh', 'Birthday', 'finally'],
    3: ['special', 'only', 'one'],
    4: ['secretly'],
    5: ['maybe', 'month'],
    6: ['months'],
    8: ['FIVE', 'coding', 'designing', 'soul'],
    9: ['angel', 'precious', 'irreplaceable'],
    10: ['every', 'endless', 'Divyanshi.'],
  };
  const words = highlights[beat.id] || [];
  const clean = word.replace(/[.,!?]/g, '');
  return words.some(h => clean.toLowerCase() === h.toLowerCase().replace(/[.,!?]/g, ''));
}

// Decorative elements for energetic beats
function EnergeticDecor() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {Array.from({ length: 8 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute"
          style={{
            left: `${20 + i * 8}%`,
            top: `${20 + (i % 3) * 20}%`,
            width: 2,
            height: 2,
            background: i % 2 === 0 ? '#e8852a' : '#ff4d6d',
            borderRadius: '50%',
            boxShadow: `0 0 8px ${i % 2 === 0 ? '#e8852a' : '#ff4d6d'}`,
          }}
          animate={{
            y: [0, -30, 0],
            opacity: [0, 1, 0],
            scale: [0, 1.5, 0],
          }}
          transition={{
            duration: 1.5,
            delay: i * 0.15,
            repeat: Infinity,
            ease: 'easeOut',
          }}
        />
      ))}
    </div>
  );
}

// Decorative elements for emotional beats
function EmotionalDecor() {
  return (
    <motion.div
      className="absolute -bottom-8 left-1/2 -translate-x-1/2 flex gap-3 text-base sm:text-lg pointer-events-none"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.5, duration: 0.8 }}
    >
      {['✦', '♡', '✦'].map((s, i) => (
        <motion.span
          key={i}
          style={{ color: i === 1 ? 'rgba(255,77,109,0.4)' : 'rgba(232,133,42,0.3)' }}
          animate={{ y: [0, -5, 0], opacity: [0.3, 0.8, 0.3] }}
          transition={{ duration: 2, delay: i * 0.3, repeat: Infinity, ease: 'easeInOut' }}
        >
          {s}
        </motion.span>
      ))}
    </motion.div>
  );
}

// Floating sparkle decoration
function FloatingSparkles() {
  const sparkles = Array.from({ length: 15 }, (_, i) => ({
    id: i,
    x: 5 + Math.random() * 90,
    y: 5 + Math.random() * 90,
    delay: Math.random() * 5,
    duration: 3 + Math.random() * 5,
    size: 8 + Math.random() * 14,
  }));

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-[2]">
      {sparkles.map(s => (
        <motion.div
          key={s.id}
          className="absolute"
          style={{
            left: `${s.x}%`,
            top: `${s.y}%`,
            fontSize: s.size,
            color: s.id % 3 === 0 ? 'rgba(232,133,42,0.12)' : s.id % 3 === 1 ? 'rgba(255,77,109,0.1)' : 'rgba(255,255,255,0.05)',
          }}
          animate={{ opacity: [0, 0.7, 0], scale: [0, 1, 0], rotate: [0, 180] }}
          transition={{ duration: s.duration, delay: s.delay, repeat: Infinity, ease: 'easeInOut' }}
        >
          ✦
        </motion.div>
      ))}
    </div>
  );
}
