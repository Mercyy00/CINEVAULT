import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useAnimation } from 'motion/react';
import { useBirthdayMusic } from '../context/BirthdayMusicContext';

interface BirthdayTypographyIntroProps {
  onComplete: () => void;
}

type Stage = 'heart' | 'typography';

interface Particle {
  id: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  type: 'spark' | 'heart' | 'star' | 'dust';
  rotation: number;
  life: number;
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

export function BirthdayTypographyIntro({ onComplete }: BirthdayTypographyIntroProps) {
  const [stage, setStage] = useState<Stage>('heart');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const { playlist, playTrack, togglePlay, isPlaying, currentTrack } = useBirthdayMusic();

  const handleHeartComplete = useCallback(() => {
    // Start background romantic music track: "Kalank (Title Track)" by Arijit Singh
    try {
      const kalankTrackIdx = playlist.findIndex(t => t.title.toLowerCase().includes('kalank'));
      playTrack(kalankTrackIdx !== -1 ? kalankTrackIdx : 17);
    } catch (e) {
      console.warn('Audio play initiated:', e);
    }
    
    setIsTransitioning(true);
    setTimeout(() => {
      setStage('typography');
      setTimeout(() => setIsTransitioning(false), 200);
    }, 600);
  }, [playTrack, playlist]);

  const handleTypographyComplete = useCallback(() => {
    onComplete();
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-[9999] overflow-hidden select-none" style={{ background: '#0b0c10' }}>
      {/* Global Transition Overlay */}
      <AnimatePresence>
        {isTransitioning && (
          <motion.div
            className="fixed inset-0 z-[100] pointer-events-none"
            style={{ background: '#0b0c10' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: 'easeInOut' }}
          />
        )}
      </AnimatePresence>

      {/* Stage 1: Floating Heart Prologue */}
      <AnimatePresence mode="wait">
        {stage === 'heart' && (
          <motion.div
            key="stage-1-heart"
            className="fixed inset-0 z-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
          >
            <Stage1Heart onComplete={handleHeartComplete} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stage 2: Kinetic Typography Sequence */}
      <AnimatePresence mode="wait">
        {stage === 'typography' && (
          <motion.div
            key="stage-2-typography"
            className="fixed inset-0 z-20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
          >
            <Stage2Typography 
              onComplete={handleTypographyComplete}
              isPlayingMusic={isPlaying}
              onToggleMusic={togglePlay}
              currentTrackTitle={currentTrack?.title}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ========================================================================= */
/* STAGE 1: THE FLOATING 3D GLOWING HEART PROLOGUE                           */
/* ========================================================================= */
function Stage1Heart({ onComplete }: { onComplete: () => void }) {
  const [clickCount, setClickCount] = useState(0);
  const [showSubtext, setShowSubtext] = useState(false);
  const [isExploding, setIsExploding] = useState(false);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [showHeart, setShowHeart] = useState(false);
  const [showGlow, setShowGlow] = useState(false);
  const [fadeInComplete, setFadeInComplete] = useState(false);
  const particleIdRef = useRef(0);
  const heartControls = useAnimation();

  useEffect(() => {
    const glowTimer = setTimeout(() => setShowGlow(true), 400);
    const heartTimer = setTimeout(() => setShowHeart(true), 1000);
    const fadeTimer = setTimeout(() => setFadeInComplete(true), 2000);
    return () => {
      clearTimeout(glowTimer);
      clearTimeout(heartTimer);
      clearTimeout(fadeTimer);
    };
  }, []);

  const spawnParticles = useCallback((count: number, type: Particle['type'], spread: number) => {
    const newParticles: Particle[] = [];
    const colors = ['#e8852a', '#ff4d6d', '#f5a623', '#ff6b8a', '#ffd700', '#fff5e0'];
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.8;
      const speed = spread * (0.4 + Math.random() * 0.8);
      newParticles.push({
        id: particleIdRef.current++,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - (type === 'dust' ? Math.random() * 2 : 0),
        size: type === 'spark' ? 2 + Math.random() * 5 : type === 'dust' ? 1 + Math.random() * 3 : 8 + Math.random() * 14,
        color: colors[Math.floor(Math.random() * colors.length)],
        type,
        rotation: Math.random() * 360,
        life: 1 + Math.random() * 0.8,
      });
    }
    setParticles(prev => [...prev, ...newParticles]);
    const maxLife = Math.max(...newParticles.map(p => p.life));
    setTimeout(() => {
      setParticles(prev => prev.filter(p => !newParticles.includes(p)));
    }, maxLife * 1200);
  }, []);

  const handleClick = useCallback(() => {
    if (clickCount === 0) {
      setClickCount(1);
      heartControls.start({
        rotate: [0, -12, 12, -8, 8, -4, 4, -2, 0],
        scale: [1, 1.2, 0.9, 1.15, 0.95, 1.08, 0.98, 1.02, 1],
        transition: { duration: 1, ease: 'easeInOut' },
      });
      spawnParticles(30, 'spark', 90);
      spawnParticles(15, 'star', 70);
      setTimeout(() => setShowSubtext(true), 350);
    } else if (clickCount === 1) {
      setClickCount(2);
      setShowSubtext(false);
      setIsExploding(true);
      spawnParticles(50, 'heart', 160);
      spawnParticles(40, 'star', 130);
      spawnParticles(35, 'spark', 110);
      spawnParticles(60, 'dust', 180);
      setTimeout(() => onComplete(), 1800);
    }
  }, [clickCount, heartControls, spawnParticles, onComplete]);

  return (
    <motion.div
      className="fixed inset-0 flex items-center justify-center cursor-pointer select-none"
      style={{ background: '#0b0c10' }}
      onClick={handleClick}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.2 }}
    >
      {/* Deep Ambient Glow Layers */}
      <AnimatePresence>
        {showGlow && (
          <>
            <motion.div
              className="absolute rounded-full"
              style={{
                width: '400px',
                height: '400px',
                background: 'radial-gradient(circle, rgba(255,77,109,0.12) 0%, rgba(232,133,42,0.06) 35%, transparent 65%)',
              }}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 2, opacity: 0 }}
              transition={{ duration: 2.2, ease: 'easeOut' }}
            >
              <motion.div
                className="absolute inset-[-20%] rounded-full"
                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.9, 0.5] }}
                transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
                style={{ background: 'radial-gradient(circle, rgba(255,77,109,0.08) 0%, rgba(232,133,42,0.03) 40%, transparent 65%)' }}
              />
            </motion.div>
            <motion.div
              className="absolute rounded-full"
              style={{
                width: '600px',
                height: '600px',
                background: 'radial-gradient(circle, rgba(232,133,42,0.04) 0%, rgba(255,77,109,0.02) 40%, transparent 60%)',
              }}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 2.8, ease: 'easeOut', delay: 0.3 }}
            />
          </>
        )}
      </AnimatePresence>

      {/* Ambient Floating Particles */}
      <AmbientParticles />

      {/* Main Glowing SVG Heart */}
      <AnimatePresence>
        {showHeart && !isExploding && (
          <motion.div
            className="relative z-10"
            initial={{ scale: 0, opacity: 0, rotate: -10 }}
            animate={heartControls}
            exit={{ scale: 2.5, opacity: 0, rotate: 15 }}
            transition={{ duration: 1.2, ease: [0.34, 1.56, 0.64, 1] }}
          >
            <motion.svg
              viewBox="0 0 100 100"
              className="w-36 h-36 sm:w-48 sm:h-48 md:w-56 md:h-56"
              animate={{ scale: [1, 1.08, 1] }}
              transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
              style={{
                filter: 'drop-shadow(0 0 25px rgba(255,77,109,0.7)) drop-shadow(0 0 50px rgba(232,133,42,0.4)) drop-shadow(0 0 80px rgba(255,77,109,0.2))',
              }}
            >
              <defs>
                <radialGradient id="heartGlowGrad" cx="50%" cy="35%" r="65%" fx="50%" fy="35%">
                  <stop offset="0%" stopColor="#ff8fa8" />
                  <stop offset="30%" stopColor="#ff4d6d" />
                  <stop offset="60%" stopColor="#e8365a" />
                  <stop offset="100%" stopColor="#e8852a" />
                </radialGradient>
                <radialGradient id="heartInnerGrad" cx="40%" cy="30%" r="50%">
                  <stop offset="0%" stopColor="rgba(255,255,255,0.18)" />
                  <stop offset="100%" stopColor="rgba(255,255,255,0)" />
                </radialGradient>
                <filter id="heartBlurFilter">
                  <feGaussianBlur stdDeviation="2" />
                </filter>
              </defs>
              {/* Outer glow layer */}
              <path
                d="M50 90 C22 65, 0 40, 13 22 C20 10, 37 8, 50 26 C63 8, 80 10, 87 22 C100 40, 78 65, 50 90Z"
                fill="url(#heartGlowGrad)"
                filter="url(#heartBlurFilter)"
                opacity="0.4"
              />
              {/* Main heart body */}
              <path
                d="M50 90 C22 65, 0 40, 13 22 C20 10, 37 8, 50 26 C63 8, 80 10, 87 22 C100 40, 78 65, 50 90Z"
                fill="url(#heartGlowGrad)"
                stroke="rgba(255,255,255,0.2)"
                strokeWidth="0.3"
              />
              {/* Inner highlight */}
              <path
                d="M50 90 C22 65, 0 40, 13 22 C20 10, 37 8, 50 26 C63 8, 80 10, 87 22 C100 40, 78 65, 50 90Z"
                fill="url(#heartInnerGrad)"
              />
              {/* Specular highlights */}
              <ellipse cx="33" cy="28" rx="9" ry="6" fill="rgba(255,255,255,0.15)" transform="rotate(-25, 33, 28)" />
              <ellipse cx="67" cy="28" rx="7" ry="5" fill="rgba(255,255,255,0.1)" transform="rotate(25, 67, 28)" />
              <circle cx="38" cy="22" r="2" fill="rgba(255,255,255,0.2)" />
            </motion.svg>

            {/* Ring pulse around heart */}
            <motion.div
              className="absolute inset-[-15%] rounded-full border"
              style={{ borderColor: 'rgba(255,77,109,0.2)' }}
              animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0, 0.3] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeOut' }}
            />
            <motion.div
              className="absolute inset-[-25%] rounded-full border"
              style={{ borderColor: 'rgba(232,133,42,0.1)' }}
              animate={{ scale: [1, 1.4, 1], opacity: [0.2, 0, 0.2] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeOut', delay: 0.5 }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Explosion Heart on 2nd Click */}
      <AnimatePresence>
        {isExploding && (
          <motion.div
            className="absolute z-20"
            initial={{ scale: 1, opacity: 1 }}
            animate={{ scale: 4, opacity: 0 }}
            transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
          >
            <svg viewBox="0 0 100 100" className="w-36 h-36 sm:w-48 sm:h-48">
              <defs>
                <radialGradient id="explHeartGrad" cx="50%" cy="40%" r="60%">
                  <stop offset="0%" stopColor="#fff" />
                  <stop offset="40%" stopColor="#ff8fa8" />
                  <stop offset="100%" stopColor="#e8852a" />
                </radialGradient>
              </defs>
              <path d="M50 90 C22 65, 0 40, 13 22 C20 10, 37 8, 50 26 C63 8, 80 10, 87 22 C100 40, 78 65, 50 90Z" fill="url(#explHeartGrad)" />
            </svg>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Particle System */}
      {particles.map(p => (
        <motion.div
          key={p.id}
          className="absolute z-30 pointer-events-none"
          style={{ left: '50%', top: '50%' }}
          initial={{ x: 0, y: 0, scale: 1, opacity: 1, rotate: 0 }}
          animate={{
            x: p.vx * 9,
            y: p.vy * 9 + (p.type === 'dust' ? -40 : 0),
            scale: p.type === 'dust' ? [1, 0.3] : [1, 0.5, 0],
            opacity: [1, 0.8, 0],
            rotate: p.rotation + (p.type === 'heart' ? 360 : p.type === 'star' ? 180 : 0),
          }}
          transition={{ duration: p.life * 1.3, ease: p.type === 'dust' ? 'easeOut' : [0.16, 1, 0.3, 1] }}
        >
          {p.type === 'spark' && (
            <div
              className="rounded-full"
              style={{
                width: p.size,
                height: p.size,
                background: p.color,
                boxShadow: `0 0 ${p.size * 3}px ${p.color}, 0 0 ${p.size * 6}px ${p.color}40`,
              }}
            />
          )}
          {p.type === 'heart' && (
            <svg viewBox="0 0 100 100" style={{ width: p.size, height: p.size, filter: `drop-shadow(0 0 4px ${p.color})` }}>
              <path d="M50 88 C25 65, 2 42, 15 25 C22 15, 35 12, 50 28 C65 12, 78 15, 85 25 C98 42, 75 65, 50 88Z" fill={p.color} />
            </svg>
          )}
          {p.type === 'star' && (
            <div style={{ width: p.size, height: p.size, fontSize: p.size, lineHeight: 1, color: p.color, filter: `drop-shadow(0 0 ${p.size}px ${p.color})` }}>✦</div>
          )}
          {p.type === 'dust' && (
            <div
              className="rounded-full"
              style={{
                width: p.size,
                height: p.size,
                background: p.color,
                boxShadow: `0 0 ${p.size * 2}px ${p.color}`,
                opacity: 0.6,
              }}
            />
          )}
        </motion.div>
      ))}

      {/* 1st Click Subtext Prompt */}
      <AnimatePresence>
        {showSubtext && !isExploding && (
          <motion.div
            className="absolute z-20 px-6 py-4 text-center max-w-sm sm:max-w-md"
            style={{ top: '58%', left: '50%', x: '-50%' }}
            initial={{ y: 30, opacity: 0, scale: 0.9 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -30, opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.8, ease: [0.34, 1.56, 0.64, 1] }}
          >
            <motion.p
              className="text-sm sm:text-base md:text-lg font-light tracking-wide leading-relaxed"
              style={{ color: '#ff8fa8' }}
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
            >
              Oh... you touched my heart!
            </motion.p>
            <motion.p
              className="text-xs sm:text-sm md:text-base font-light tracking-wide mt-2"
              style={{ color: 'rgba(232,133,42,0.85)' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.8 }}
            >
              Tap it once more, Divu... 💖
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Initial Click Hint */}
      <AnimatePresence>
        {fadeInComplete && clickCount === 0 && (
          <motion.div
            className="absolute bottom-16 sm:bottom-20 z-10"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.8 }}
          >
            <motion.p
              className="text-xs sm:text-sm tracking-[0.25em] uppercase font-light"
              style={{ color: 'rgba(232,133,42,0.5)' }}
              animate={{ opacity: [0.3, 0.8, 0.3] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
            >
              Touch the heart
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Full-screen Flash Overlay on Explosion */}
      <AnimatePresence>
        {isExploding && (
          <>
            <motion.div
              className="fixed inset-0 z-40 pointer-events-none"
              style={{ background: 'radial-gradient(circle, rgba(255,200,180,0.4) 0%, rgba(255,77,109,0.2) 30%, rgba(232,133,42,0.1) 50%, transparent 70%)' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0.6, 0] }}
              transition={{ duration: 1.8, ease: 'easeOut' }}
            />
            <motion.div
              className="fixed inset-0 z-[39] pointer-events-none"
              style={{ background: '#0b0c10' }}
              initial={{ opacity: 1 }}
              animate={{ opacity: [1, 0, 0, 1] }}
              transition={{ duration: 2, ease: 'easeInOut', times: [0, 0.15, 0.7, 1] }}
            />
          </>
        )}
      </AnimatePresence>

      {/* Vignette Overlay */}
      <div
        className="fixed inset-0 pointer-events-none z-[5]"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 50%, rgba(11,12,16,0.6) 80%, rgba(11,12,16,0.9) 100%)',
        }}
      />
    </motion.div>
  );
}

function AmbientParticles() {
  const dots = Array.from({ length: 40 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: 0.5 + Math.random() * 2.5,
    delay: Math.random() * 6,
    duration: 3 + Math.random() * 8,
    color: Math.random() > 0.6 ? 'rgba(232,133,42,0.25)' : Math.random() > 0.3 ? 'rgba(255,77,109,0.2)' : 'rgba(255,255,255,0.08)',
    glowSize: 2 + Math.random() * 4,
  }));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-[1]">
      {dots.map(d => (
        <motion.div
          key={d.id}
          className="absolute rounded-full"
          style={{
            left: `${d.x}%`,
            top: `${d.y}%`,
            width: d.size,
            height: d.size,
            background: d.color,
            boxShadow: `0 0 ${d.glowSize}px ${d.color}`,
          }}
          animate={{
            y: [-15, 15, -15],
            x: [-5, 5, -5],
            opacity: [0.15, 0.7, 0.15],
          }}
          transition={{
            duration: d.duration,
            delay: d.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

/* ========================================================================= */
/* STAGE 2: THE KINETIC TYPOGRAPHY STORY SEQUENCE                            */
/* ========================================================================= */
interface Stage2TypographyProps {
  onComplete: () => void;
  isPlayingMusic: boolean;
  onToggleMusic: () => void;
  currentTrackTitle?: string;
}

function Stage2Typography({ onComplete, isPlayingMusic, onToggleMusic, currentTrackTitle }: Stage2TypographyProps) {
  const [currentBeat, setCurrentBeat] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isSkipped, setIsSkipped] = useState(false);
  const [counterValue, setCounterValue] = useState(0);
  const [showCounter, setShowCounter] = useState(false);
  const [showEnterButton, setShowEnterButton] = useState(false);
  const [sparkles, setSparkles] = useState<{ id: number; x: number; y: number }[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const counterRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sparkleIdRef = useRef(0);

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

  // Counter animation for beat 8 (5 Months reveal)
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
          setTimeout(() => setShowCounter(false), 2200);
        }
      }, 700);
    }
    return () => { if (counterRef.current) clearInterval(counterRef.current); };
  }, [currentBeat]);

  // Show enter button on final beat
  useEffect(() => {
    if (currentBeat === BEATS.length - 1) {
      setTimeout(() => setShowEnterButton(true), 1200);
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
    setTimeout(() => onComplete(), 600);
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
      transition={{ duration: 1.2 }}
      onClick={handleTap}
    >
      {/* Dynamic Background Based on Beat Type */}
      <BeatBackground beatType={beat.type} beatId={beat.id} />

      {/* Energetic Beat Flash & Shake Overlay */}
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

      {/* Top Controls Bar */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-50 flex gap-2">
        <button
          onClick={(e) => { e.stopPropagation(); handleSkip(); }}
          className="px-3 py-1.5 text-[10px] sm:text-xs tracking-wider uppercase rounded-full border transition-all duration-300 hover:bg-white/10 active:scale-95 cursor-pointer"
          style={{ borderColor: 'rgba(232,133,42,0.3)', color: 'rgba(232,133,42,0.85)' }}
        >
          Skip
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); setIsPaused(!isPaused); }}
          className="px-3 py-1.5 text-[10px] sm:text-xs tracking-wider uppercase rounded-full border transition-all duration-300 hover:bg-white/10 active:scale-95 cursor-pointer"
          style={{ borderColor: 'rgba(255,77,109,0.3)', color: 'rgba(255,77,109,0.85)' }}
        >
          {isPaused ? '▶' : '⏸'}
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onToggleMusic(); }}
          className="px-3 py-1.5 text-[10px] sm:text-xs tracking-wider uppercase rounded-full border transition-all duration-300 hover:bg-white/10 active:scale-95 cursor-pointer flex items-center gap-1.5"
          style={{ borderColor: isPlayingMusic ? 'rgba(232,133,42,0.4)' : 'rgba(255,255,255,0.2)', color: isPlayingMusic ? 'rgba(232,133,42,0.9)' : 'rgba(255,255,255,0.5)' }}
          title={isPlayingMusic ? 'Mute Music' : 'Play Music'}
        >
          <span>{isPlayingMusic ? '🔊' : '🔇'}</span>
          <span className="hidden sm:inline font-mono font-bold text-[10px]">
            {isPlayingMusic ? (currentTrackTitle || 'Kalank') : 'Muted'}
          </span>
        </button>
      </div>

      {/* Top Progress Line */}
      <div className="absolute top-0 left-0 right-0 h-[2px] z-40" style={{ background: 'rgba(255,255,255,0.05)' }}>
        <motion.div
          className="h-full"
          style={{ background: 'linear-gradient(90deg, #e8852a, #ff4d6d, #f5a623)' }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>

      {/* Beat Counter Indicator */}
      <div className="absolute top-4 left-4 sm:top-6 sm:left-6 z-50">
        <span className="text-[10px] sm:text-xs tracking-[0.2em] uppercase font-mono font-medium" style={{ color: 'rgba(232,133,42,0.5)' }}>
          {currentBeat + 1} / {BEATS.length}
        </span>
      </div>

      {/* Main Narrative Area */}
      <div className="relative z-10 flex flex-col items-center justify-center px-6 sm:px-10 md:px-16 lg:px-20 max-w-3xl mx-auto text-center min-h-[220px]">
        <AnimatePresence mode="wait">
          {!isSkipped && (
            <motion.div
              key={beat.id}
              className="w-full"
              initial={{ opacity: 0, y: 35, scale: 0.92, filter: 'blur(8px)' }}
              animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -35, scale: 0.92, filter: 'blur(8px)' }}
              transition={{ duration: 0.8, ease: [0.34, 1.56, 0.64, 1] }}
            >
              {/* Counter Overlay for Beat 8 */}
              <AnimatePresence>
                {showCounter && (
                  <motion.div
                    className="mb-6"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 1.6, opacity: 0 }}
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
                      {/* Ambient Glow Behind Counter */}
                      <motion.div
                        className="absolute inset-0 -z-10 blur-xl"
                        animate={{ opacity: [0.3, 0.6, 0.3] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        style={{ background: 'radial-gradient(circle, rgba(232,133,42,0.35), rgba(255,77,109,0.2), transparent)' }}
                      />
                    </div>
                    <motion.p
                      className="text-xs sm:text-sm mt-2 tracking-[0.3em] uppercase font-mono font-bold"
                      style={{ color: 'rgba(232,133,42,0.8)' }}
                      animate={{ opacity: [0.4, 1, 0.4] }}
                      transition={{ duration: 1.2, repeat: Infinity }}
                    >
                      {counterValue === 1 ? 'Month' : 'Months'}
                    </motion.p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Word-by-Word Beat Content */}
              <BeatContent beat={beat} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Sparkle Bursts */}
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

      {/* Final Beat Enter Button */}
      <AnimatePresence>
        {showEnterButton && (
          <motion.div
            className="absolute bottom-14 sm:bottom-16 md:bottom-20 z-30"
            initial={{ y: 40, opacity: 0, scale: 0.7 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            transition={{ duration: 1, ease: [0.34, 1.56, 0.64, 1] }}
          >
            <motion.button
              onClick={(e) => { e.stopPropagation(); onComplete(); }}
              className="relative px-8 py-3.5 sm:px-10 sm:py-4 rounded-full text-sm sm:text-base font-display font-black tracking-wider overflow-hidden cursor-pointer"
              style={{
                background: 'linear-gradient(135deg, #e8852a, #ff4d6d)',
                color: '#fff',
                boxShadow: '0 0 30px rgba(232,133,42,0.35), 0 0 60px rgba(255,77,109,0.25), inset 0 1px 0 rgba(255,255,255,0.3)',
              }}
              whileHover={{ scale: 1.08, boxShadow: '0 0 50px rgba(232,133,42,0.5), 0 0 100px rgba(255,77,109,0.4)' }}
              whileTap={{ scale: 0.95 }}
              animate={{
                boxShadow: [
                  '0 0 30px rgba(232,133,42,0.35), 0 0 60px rgba(255,77,109,0.25)',
                  '0 0 50px rgba(232,133,42,0.55), 0 0 90px rgba(255,77,109,0.4)',
                  '0 0 30px rgba(232,133,42,0.35), 0 0 60px rgba(255,77,109,0.25)',
                ],
              }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
            >
              Enter My Birthday Vaults ✨
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tap or Space Hint */}
      {beat.type !== 'final' && !isSkipped && (
        <motion.div
          className="absolute bottom-5 sm:bottom-7 z-20"
          animate={{ opacity: [0.2, 0.6, 0.2] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        >
          <span className="text-[10px] sm:text-xs tracking-[0.2em] uppercase font-light" style={{ color: 'rgba(255,255,255,0.25)' }}>
            Tap or Space to continue
          </span>
        </motion.div>
      )}

      {/* Floating Sparkle Elements */}
      <FloatingSparkles />

      {/* Vignette */}
      <div
        className="fixed inset-0 pointer-events-none z-[5]"
        style={{ background: 'radial-gradient(ellipse at center, transparent 40%, rgba(11,12,16,0.5) 75%, rgba(11,12,16,0.85) 100%)' }}
      />
    </motion.div>
  );
}

function BeatBackground({ beatType, beatId }: { beatType: Beat['type']; beatId: number }) {
  const gradientMap: Record<string, string> = {
    normal: 'radial-gradient(circle, rgba(232,133,42,0.05) 0%, rgba(255,77,109,0.02) 35%, transparent 60%)',
    serif: 'radial-gradient(circle, rgba(255,77,109,0.07) 0%, rgba(232,133,42,0.02) 35%, transparent 60%)',
    thinking: 'radial-gradient(circle, rgba(100,100,150,0.05) 0%, transparent 50%)',
    energetic: 'radial-gradient(circle, rgba(232,133,42,0.1) 0%, rgba(255,77,109,0.05) 30%, transparent 55%)',
    golden: 'radial-gradient(circle, rgba(232,133,42,0.1) 0%, rgba(245,166,35,0.05) 30%, transparent 55%)',
    emotional: 'radial-gradient(circle, rgba(255,77,109,0.06) 0%, rgba(232,133,42,0.03) 30%, transparent 55%)',
    final: 'radial-gradient(circle, rgba(232,133,42,0.08) 0%, rgba(255,77,109,0.05) 25%, transparent 50%)',
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
            className="inline-block ml-2 text-2xl sm:text-3xl"
            initial={{ opacity: 0, scale: 0, rotate: -30 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ delay: words.length * getWordDelay(beat.type) + 0.3, duration: 0.8, ease: [0.34, 1.56, 0.64, 1] }}
          >
            {beat.emoji}
          </motion.span>
        )}
      </motion.div>

      {beat.type === 'energetic' && <EnergeticDecor />}
      {beat.type === 'emotional' && <EmotionalDecor />}
    </div>
  );
}

function getWordDelay(type: Beat['type']): number {
  switch (type) {
    case 'energetic': return 0.04;
    case 'final': return 0.08;
    case 'golden': return 0.06;
    default: return 0.07;
  }
}

function getWordStyle(beat: Beat): React.CSSProperties {
  switch (beat.type) {
    case 'normal':
      return {
        fontSize: 'clamp(1.2rem, 3.2vw, 1.8rem)',
        fontWeight: 500,
        color: '#f0f0f0',
        letterSpacing: '0.01em',
      };
    case 'serif':
      return {
        fontSize: 'clamp(1.3rem, 3.8vw, 2.1rem)',
        fontStyle: 'italic',
        fontWeight: 400,
        letterSpacing: '0.03em',
      };
    case 'thinking':
      return {
        fontSize: 'clamp(1.15rem, 3vw, 1.6rem)',
        fontWeight: 300,
        color: '#b0b0c0',
        letterSpacing: '0.02em',
      };
    case 'energetic':
      return {
        fontSize: 'clamp(1.4rem, 4.5vw, 2.6rem)',
        fontWeight: 900,
        letterSpacing: '0.04em',
      };
    case 'golden':
      return {
        fontSize: 'clamp(1.15rem, 2.8vw, 1.55rem)',
        fontWeight: 500,
        color: '#e8c87a',
        letterSpacing: '0.02em',
      };
    case 'emotional':
      return {
        fontSize: 'clamp(1.2rem, 3.2vw, 1.8rem)',
        fontWeight: 500,
        letterSpacing: '0.02em',
      };
    case 'final':
      return {
        fontSize: 'clamp(1.35rem, 4vw, 2.3rem)',
        fontWeight: 700,
        letterSpacing: '0.03em',
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
        className="gradient-text font-black"
        animate={index % 2 === 0 ? { scale: [1, 1.08, 1] } : {}}
        transition={{ duration: 0.6, delay: delay + 0.2, ease: 'easeInOut' }}
      >
        {word}
      </motion.span>
    );
  }

  if (beat.type === 'emotional' && isHighlight) {
    return <span className="gradient-text font-bold">{word}</span>;
  }

  if (beat.type === 'emotional') {
    return <span style={{ color: '#e0e0e0' }}>{word}</span>;
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
      <span className="gradient-text font-bold" style={{ WebkitTextFillColor: 'transparent' }}>
        {word}
      </span>
    );
  }

  if (isHighlight) {
    return (
      <span className="gradient-text font-bold" style={{ WebkitTextFillColor: 'transparent' }}>
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

function EmotionalDecor() {
  return (
    <motion.div
      className="absolute -bottom-8 left-1/2 -translate-x-1/2 flex gap-3 text-base sm:text-lg pointer-events-none"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.2, duration: 0.8 }}
    >
      {['✦', '♡', '✦'].map((s, i) => (
        <motion.span
          key={i}
          style={{ color: i === 1 ? 'rgba(255,77,109,0.5)' : 'rgba(232,133,42,0.4)' }}
          animate={{ y: [0, -5, 0], opacity: [0.3, 0.9, 0.3] }}
          transition={{ duration: 2, delay: i * 0.3, repeat: Infinity, ease: 'easeInOut' }}
        >
          {s}
        </motion.span>
      ))}
    </motion.div>
  );
}

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
            color: s.id % 3 === 0 ? 'rgba(232,133,42,0.15)' : s.id % 3 === 1 ? 'rgba(255,77,109,0.12)' : 'rgba(255,255,255,0.06)',
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
