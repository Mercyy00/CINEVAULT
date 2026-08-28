import { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Volume2, VolumeX } from 'lucide-react';
import { useApp } from '../store';
import { cn } from '../lib/utils';

const INTRO_VISIT_KEY = 'cv:intro_visit_count';
const FULL_TITLE = 'CINEVAULT';
const FULL_TAGLINE = 'THE MULTIVERSE OF CINEMA';

export function CinematicIntro({ onComplete }: { onComplete: () => void }) {
  const { userProfile } = useApp();
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [displayedTitle, setDisplayedTitle] = useState('');
  const [displayedTagline, setDisplayedTagline] = useState('');
  const [showCat, setShowCat] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [isFirstVisit, setIsFirstVisit] = useState(true);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const soundPlayedRef = useRef(false);

  const INTRO_DURATION_MS = 3800;

  // Determine if it is 1st time visit vs 2nd+ time visit
  useEffect(() => {
    try {
      const visitCountStr = localStorage.getItem(INTRO_VISIT_KEY);
      const visitCount = visitCountStr ? parseInt(visitCountStr, 10) : 0;
      
      // If user is already logged in or has visited before, it's 2nd+ time
      if (visitCount > 0 || userProfile.isLoggedIn) {
        setIsFirstVisit(false);
      } else {
        setIsFirstVisit(true);
      }

      // Record this visit
      localStorage.setItem(INTRO_VISIT_KEY, (visitCount + 1).toString());
    } catch {
      setIsFirstVisit(false);
    }
  }, [userProfile.isLoggedIn]);

  // Audio synthesizer for typewriter keystroke clicks and cinematic bass swell
  const playCinematicAudio = () => {
    if (soundPlayedRef.current || isMuted) return;
    soundPlayedRef.current = true;

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      audioCtxRef.current = ctx;
      const now = ctx.currentTime;

      // 1. Deep sub-bass swell
      const subOsc = ctx.createOscillator();
      const subGain = ctx.createGain();
      subOsc.type = 'sine';
      subOsc.frequency.setValueAtTime(36, now);
      subOsc.frequency.exponentialRampToValueAtTime(72, now + 1.2);
      subOsc.frequency.exponentialRampToValueAtTime(30, now + 3.4);

      subGain.gain.setValueAtTime(0.001, now);
      subGain.gain.linearRampToValueAtTime(0.3, now + 1.0);
      subGain.gain.exponentialRampToValueAtTime(0.001, now + 3.6);

      subOsc.connect(subGain);
      subGain.connect(ctx.destination);
      subOsc.start(now);
      subOsc.stop(now + 3.7);

      // 2. High Shimmer Tone
      const chimeOsc = ctx.createOscillator();
      const chimeGain = ctx.createGain();
      chimeOsc.type = 'sine';
      chimeOsc.frequency.setValueAtTime(900, now + 1.2);
      chimeOsc.frequency.exponentialRampToValueAtTime(1800, now + 2.2);

      chimeGain.gain.setValueAtTime(0.001, now + 1.2);
      chimeGain.gain.linearRampToValueAtTime(0.05, now + 1.7);
      chimeGain.gain.exponentialRampToValueAtTime(0.001, now + 3.2);

      chimeOsc.connect(chimeGain);
      chimeGain.connect(ctx.destination);
      chimeOsc.start(now + 1.2);
      chimeOsc.stop(now + 3.4);
    } catch {
      // Audio autoplay policy fallback
    }
  };

  // Play subtle mechanical key click
  const playTypewriterClick = () => {
    if (isMuted || !audioCtxRef.current || audioCtxRef.current.state === 'closed') return;
    try {
      const ctx = audioCtxRef.current;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(800 + Math.random() * 400, now);
      gain.gain.setValueAtTime(0.015, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.05);
    } catch {
      // ignore
    }
  };

  // Typewriter and lifecycle sequencing
  useEffect(() => {
    const startTime = Date.now();
    playCinematicAudio();

    // Progress bar tick
    const progressInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, (elapsed / INTRO_DURATION_MS) * 100);
      setProgress(pct);
    }, 25);

    // 1. Reveal Cat Silhouette
    const tCat = setTimeout(() => {
      setShowCat(true);
    }, 300);

    // 2. Typewriter for Title "CINEVAULT"
    const titleTimeouts: NodeJS.Timeout[] = [];
    const titleStartDelay = 700;
    const titleSpeed = 90; // ms per char

    for (let i = 1; i <= FULL_TITLE.length; i++) {
      const timeout = setTimeout(() => {
        setDisplayedTitle(FULL_TITLE.substring(0, i));
        playTypewriterClick();
      }, titleStartDelay + i * titleSpeed);
      titleTimeouts.push(timeout);
    }

    // 3. Typewriter for Tagline "THE MULTIVERSE OF CINEMA"
    const taglineTimeouts: NodeJS.Timeout[] = [];
    const taglineStartDelay = titleStartDelay + FULL_TITLE.length * titleSpeed + 250;
    const taglineSpeed = 45; // ms per char

    for (let i = 1; i <= FULL_TAGLINE.length; i++) {
      const timeout = setTimeout(() => {
        setDisplayedTagline(FULL_TAGLINE.substring(0, i));
        if (i % 2 === 0) playTypewriterClick();
      }, taglineStartDelay + i * taglineSpeed);
      taglineTimeouts.push(timeout);
    }

    // 4. Exit Transition
    const tExit = setTimeout(() => {
      setIsExiting(true);
    }, INTRO_DURATION_MS - 600);

    // 5. Complete
    const tEnd = setTimeout(() => {
      onComplete();
    }, INTRO_DURATION_MS);

    return () => {
      clearInterval(progressInterval);
      clearTimeout(tCat);
      clearTimeout(tExit);
      clearTimeout(tEnd);
      titleTimeouts.forEach(clearTimeout);
      taglineTimeouts.forEach(clearTimeout);
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close().catch(() => {});
      }
    };
  }, [onComplete]);

  return (
    <div
      onClick={() => playCinematicAudio()}
      className={cn(
        'fixed inset-0 z-[99999] bg-black flex flex-col items-center justify-center select-none transition-all duration-700 overflow-hidden',
        isExiting ? 'opacity-0 scale-105 pointer-events-none filter blur-sm' : 'opacity-100'
      )}
    >
      {/* Background Ambience: Pure Pitch Black with very subtle center glow */}
      <div className="absolute inset-0 bg-black pointer-events-none" />
      
      {!isFirstVisit && (
        <div
          className="absolute w-96 h-96 rounded-full blur-[140px] pointer-events-none opacity-20 transition-all duration-1000"
          style={{ background: 'var(--theme-accent, #e8852a)' }}
        />
      )}

      {/* Main Content: Cat Silhouette + Typewriter Text */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center px-4 max-w-xl mx-auto">
        
        {/* Cat Silhouette */}
        <motion.div
          initial={{ opacity: 0, y: 15, scale: 0.9 }}
          animate={{
            opacity: showCat ? 1 : 0,
            y: showCat ? 0 : 15,
            scale: showCat ? 1 : 0.9,
          }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="mb-6 relative flex items-center justify-center"
        >
          {/* Subtle Ambient Ring behind Silhouette */}
          <div
            className={cn(
              'w-24 h-24 sm:w-28 sm:h-28 rounded-full flex items-center justify-center transition-all duration-700',
              isFirstVisit
                ? 'bg-white/5 border border-white/10 shadow-[0_0_30px_rgba(255,255,255,0.08)]'
                : 'bg-brand/10 border border-brand/25 shadow-[0_0_40px_var(--theme-accent-glow,rgba(232,133,42,0.3))]'
            )}
          >
            {/* Crisp Masked Cat Silhouette */}
            <div
              className={cn(
                'w-14 h-14 sm:w-16 sm:h-16 brand-logo-cat transition-all duration-500 drop-shadow-md',
                isFirstVisit ? '!bg-white' : ''
              )}
              style={
                !isFirstVisit
                  ? { backgroundColor: 'var(--theme-accent, #e8852a)' }
                  : undefined
              }
            />
          </div>
        </motion.div>

        {/* Typewriter Title: CINEVAULT */}
        <div className="min-h-[4rem] sm:min-h-[5.5rem] flex items-center justify-center">
          <h1
            className={cn(
              'text-4xl sm:text-6xl md:text-7xl font-display font-black tracking-[0.18em] transition-colors duration-500 inline-flex items-center',
              isFirstVisit ? 'text-white' : 'text-foreground'
            )}
          >
            {displayedTitle}
            {displayedTitle.length < FULL_TITLE.length && (
              <span
                className={cn(
                  'inline-block w-[3px] sm:w-[4px] h-8 sm:h-12 ml-1 animate-pulse',
                  isFirstVisit ? 'bg-white' : 'bg-brand'
                )}
                style={
                  !isFirstVisit
                    ? { backgroundColor: 'var(--theme-accent, #e8852a)' }
                    : undefined
                }
              />
            )}
          </h1>
        </div>

        {/* Typewriter Tagline: THE MULTIVERSE OF CINEMA */}
        <div className="min-h-[2rem] flex items-center justify-center mt-2">
          <p
            className={cn(
              'text-xs sm:text-sm md:text-base font-mono font-bold uppercase tracking-[0.4em] transition-colors duration-500',
              isFirstVisit ? 'text-white/70' : 'text-brand'
            )}
            style={
              !isFirstVisit
                ? { color: 'var(--theme-accent, #e8852a)' }
                : undefined
            }
          >
            {displayedTagline}
            {displayedTitle.length >= FULL_TITLE.length && displayedTagline.length < FULL_TAGLINE.length && (
              <span
                className={cn(
                  'inline-block w-[2px] h-3.5 sm:h-4 ml-1 animate-pulse',
                  isFirstVisit ? 'bg-white/70' : 'bg-brand'
                )}
              />
            )}
          </p>
        </div>
      </div>

      {/* Top Left: Sound Toggle */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsMuted(!isMuted);
          if (isMuted) playCinematicAudio();
        }}
        aria-label={isMuted ? 'Unmute intro' : 'Mute intro'}
        className={cn(
          'absolute top-6 left-6 z-40 p-2.5 rounded-full border transition-all cursor-pointer shadow-md',
          isFirstVisit
            ? 'bg-white/5 hover:bg-white/10 border-white/10 text-white/70 hover:text-white'
            : 'bg-black/60 hover:bg-white/10 border-white/15 text-white/80 hover:text-brand'
        )}
      >
        {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
      </button>

      {/* Bottom Right: Skip Button with Radial Progress */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onComplete();
        }}
        className={cn(
          'absolute bottom-8 right-8 z-40 flex items-center gap-2.5 px-4 py-2 rounded-full border transition-all hover:scale-105 cursor-pointer shadow-lg',
          isFirstVisit
            ? 'bg-white/5 hover:bg-white/10 border-white/15 text-white/80'
            : 'bg-black/80 hover:bg-white/10 border-white/15 text-white/90'
        )}
      >
        <span className="text-xs font-mono font-bold tracking-wider uppercase">
          Skip
        </span>

        {/* Circular Mini Progress Ring */}
        <div className="relative w-3.5 h-3.5 flex items-center justify-center">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 24 24">
            <circle
              cx="12"
              cy="12"
              r="9"
              className="stroke-white/20"
              strokeWidth="3"
              fill="transparent"
            />
            <circle
              cx="12"
              cy="12"
              r="9"
              stroke={isFirstVisit ? '#ffffff' : 'var(--theme-accent, #e8852a)'}
              className="transition-all duration-75"
              strokeWidth="3"
              strokeDasharray={56.5}
              strokeDashoffset={56.5 - (56.5 * progress) / 100}
              strokeLinecap="round"
              fill="transparent"
            />
          </svg>
        </div>
      </button>
    </div>
  );
}
