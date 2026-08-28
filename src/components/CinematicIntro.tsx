import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion } from 'motion/react';
import { Volume2, VolumeX, Sparkles, Film } from 'lucide-react';
import { useApp } from '../store';
import { cn } from '../lib/utils';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  maxAlpha: number;
  hue: number;
  pulseSpeed: number;
}

export function CinematicIntro({ onComplete }: { onComplete: () => void }) {
  const { userProfile } = useApp();
  const [phase, setPhase] = useState<0 | 1 | 2 | 3 | 4>(0);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const soundPlayedRef = useRef(false);

  const INTRO_DURATION_MS = 4200;

  // Synthesize cinematic audio with Web Audio API
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
      subOsc.frequency.setValueAtTime(40, now);
      subOsc.frequency.exponentialRampToValueAtTime(80, now + 1.2);
      subOsc.frequency.exponentialRampToValueAtTime(32, now + 3.8);

      subGain.gain.setValueAtTime(0.001, now);
      subGain.gain.linearRampToValueAtTime(0.35, now + 1.2);
      subGain.gain.exponentialRampToValueAtTime(0.001, now + 4.0);

      subOsc.connect(subGain);
      subGain.connect(ctx.destination);
      subOsc.start(now);
      subOsc.stop(now + 4.2);

      // 2. Warm Brass / Cinema Chords (Golden Resonator)
      const chordFreqs = [110, 164.81, 220, 277.18, 329.63, 440, 659.25];
      chordFreqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        osc.type = idx % 2 === 0 ? 'sawtooth' : 'triangle';
        osc.frequency.setValueAtTime(freq, now + 0.6);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(200, now + 0.6);
        filter.frequency.exponentialRampToValueAtTime(2800, now + 2.2);
        filter.frequency.exponentialRampToValueAtTime(400, now + 4.0);

        gain.gain.setValueAtTime(0.0001, now + 0.6);
        gain.gain.linearRampToValueAtTime(0.04 / (idx * 0.4 + 1), now + 1.8);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 4.0);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + 0.6);
        osc.stop(now + 4.2);
      });

      // 3. Shimmering high sparkle chime
      const chimeOsc = ctx.createOscillator();
      const chimeGain = ctx.createGain();
      chimeOsc.type = 'sine';
      chimeOsc.frequency.setValueAtTime(1200, now + 1.8);
      chimeOsc.frequency.exponentialRampToValueAtTime(2400, now + 2.8);

      chimeGain.gain.setValueAtTime(0.001, now + 1.8);
      chimeGain.gain.linearRampToValueAtTime(0.08, now + 2.3);
      chimeGain.gain.exponentialRampToValueAtTime(0.001, now + 3.8);

      chimeOsc.connect(chimeGain);
      chimeGain.connect(ctx.destination);
      chimeOsc.start(now + 1.8);
      chimeOsc.stop(now + 4.0);
    } catch {
      // Audio policy fallback
    }
  };

  // Phase scheduling
  useEffect(() => {
    const startTime = Date.now();

    playCinematicAudio();

    // Progression timer
    const progressInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, (elapsed / INTRO_DURATION_MS) * 100);
      setProgress(pct);
    }, 30);

    const t1 = setTimeout(() => setPhase(1), 400);   // Portal ignition
    const t2 = setTimeout(() => setPhase(2), 1400);  // Emblem & rings materialize
    const t3 = setTimeout(() => setPhase(3), 2400);  // Typography & shockwave
    const t4 = setTimeout(() => setPhase(4), 3600);  // Warp speed dissolve
    const tEnd = setTimeout(() => onComplete(), INTRO_DURATION_MS);

    return () => {
      clearInterval(progressInterval);
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(tEnd);
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close().catch(() => {});
      }
    };
  }, [onComplete]);

  // Interactive 3D tilt tracking
  const handleMouseMove = (e: React.MouseEvent) => {
    const { innerWidth, innerHeight } = window;
    const x = (e.clientX / innerWidth - 0.5) * 2;
    const y = (e.clientY / innerHeight - 0.5) * 2;
    setMousePos({ x, y });
  };

  // Canvas particle starfield & floating cinema embers
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    const particles: Particle[] = Array.from({ length: 65 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.8,
      vy: -Math.random() * 1.2 - 0.2,
      size: Math.random() * 2.5 + 0.8,
      alpha: Math.random() * 0.3,
      maxAlpha: Math.random() * 0.7 + 0.3,
      hue: Math.random() > 0.4 ? 42 : 25, // Golden / amber hues
      pulseSpeed: Math.random() * 0.03 + 0.01,
    }));

    let tick = 0;

    const render = () => {
      tick++;
      ctx.clearRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;

      // Volumetric radial glow from center
      const gradient = ctx.createRadialGradient(cx, cy, 20, cx, cy, Math.max(width, height) * 0.6);
      gradient.addColorStop(0, 'rgba(232, 133, 42, 0.12)');
      gradient.addColorStop(0.35, 'rgba(212, 168, 83, 0.05)');
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // Animate drifting cinema embers
      particles.forEach((p) => {
        p.x += p.vx + mousePos.x * 0.5;
        p.y += p.vy + mousePos.y * 0.5;
        p.alpha += Math.sin(tick * p.pulseSpeed) * 0.015;
        p.alpha = Math.max(0.1, Math.min(p.maxAlpha, p.alpha));

        if (p.y < -10) p.y = height + 10;
        if (p.x < -10) p.x = width + 10;
        if (p.x > width + 10) p.x = -10;

        ctx.save();
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 90%, 65%, ${p.alpha})`;
        ctx.shadowBlur = 12;
        ctx.shadowColor = `hsla(${p.hue}, 95%, 60%, ${p.alpha * 0.8})`;
        ctx.fill();
        ctx.restore();
      });

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, [mousePos]);

  // Letters of CineVault for staggered entrance
  const titleLetters = useMemo(() => 'CINEVAULT'.split(''), []);

  return (
    <div
      onMouseMove={handleMouseMove}
      onClick={() => playCinematicAudio()}
      className={cn(
        'fixed inset-0 z-[99999] bg-[#06070a] flex items-center justify-center overflow-hidden select-none transition-opacity duration-700',
        phase === 4 ? 'opacity-0 pointer-events-none scale-105 filter blur-sm' : 'opacity-100'
      )}
      style={{ perspective: 1200 }}
    >
      {/* Background Canvas Particles */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />

      {/* Anamorphic Lens Flare Horizontal Streak */}
      <motion.div
        initial={{ opacity: 0, scaleX: 0.1 }}
        animate={{
          opacity: phase >= 1 ? [0, 0.9, 0.4, 0.8, 0.2] : 0,
          scaleX: phase >= 1 ? [0.2, 1.8, 1.2, 2.2, 1] : 0.1,
          scaleY: phase >= 3 ? [1, 2.5, 0.8] : 1,
        }}
        transition={{ duration: 3.2, ease: 'easeOut' }}
        className="absolute top-1/2 left-0 right-0 h-[2px] -translate-y-1/2 bg-gradient-to-r from-transparent via-[#ffd066] to-transparent shadow-[0_0_28px_#e8852a,0_0_60px_#d4a853] pointer-events-none z-0"
      />

      {/* Cinematic Vignette Overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(0,0,0,0.85)_100%)] pointer-events-none z-10" />

      {/* Film Grain Texture */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none z-10 mix-blend-screen bg-repeat"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Main 3D Centered Content */}
      <motion.div
        animate={{
          rotateY: mousePos.x * 9,
          rotateX: -mousePos.y * 9,
          scale: phase === 4 ? 1.4 : phase >= 3 ? 1.05 : 1,
        }}
        transition={{ type: 'spring', damping: 25, stiffness: 120 }}
        className="relative z-20 flex flex-col items-center justify-center text-center px-4"
      >
        {/* Kinetic Glowing Aperture Rings */}
        <div className="relative w-36 h-36 sm:w-44 sm:h-44 md:w-52 md:h-52 flex items-center justify-center mb-6">
          {/* Outer Dashed Orbit Ring */}
          <motion.div
            initial={{ opacity: 0, rotate: 0, scale: 0.6 }}
            animate={{
              opacity: phase >= 1 ? 0.7 : 0,
              rotate: 360,
              scale: phase >= 2 ? 1 : 0.8,
            }}
            transition={{
              rotate: { duration: 16, repeat: Infinity, ease: 'linear' },
              opacity: { duration: 0.8 },
              scale: { duration: 1 },
            }}
            className="absolute inset-0 rounded-full border border-dashed border-[#e8852a]/40 shadow-[0_0_20px_rgba(232,133,42,0.2)]"
          />

          {/* Inner Counter-Rotating Hex Ring */}
          <motion.div
            initial={{ opacity: 0, rotate: 0, scale: 0.4 }}
            animate={{
              opacity: phase >= 1 ? 0.6 : 0,
              rotate: -360,
              scale: phase >= 2 ? 1 : 0.6,
            }}
            transition={{
              rotate: { duration: 12, repeat: Infinity, ease: 'linear' },
              opacity: { duration: 0.6, delay: 0.2 },
            }}
            className="absolute inset-4 rounded-full border border-dotted border-[#ffd066]/50 shadow-[0_0_30px_rgba(212,168,83,0.3)]"
          />

          {/* Glowing Ambient Core Flare */}
          <motion.div
            initial={{ opacity: 0, scale: 0.2 }}
            animate={{
              opacity: phase >= 1 ? [0.3, 0.9, 0.6, 0.8] : 0,
              scale: phase >= 2 ? [0.9, 1.25, 1.05] : 0.5,
            }}
            transition={{ duration: 2.5, repeat: Infinity, repeatType: 'reverse' }}
            className="absolute w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-gradient-to-tr from-[#e8852a] via-[#ffd066] to-[#ff7a00] blur-2xl opacity-60"
          />

          {/* Central CineVault Emblem / Monolith */}
          <motion.div
            initial={{ opacity: 0, scale: 0, rotateY: 180 }}
            animate={{
              opacity: phase >= 1 ? 1 : 0,
              scale: phase >= 2 ? 1 : 0.7,
              rotateY: phase >= 1 ? 0 : 180,
            }}
            transition={{ type: 'spring', damping: 18, stiffness: 90 }}
            className="relative z-10 w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-2xl bg-gradient-to-b from-[#1c1d24] via-[#0d0e14] to-[#07070a] border border-[#ffd066]/40 p-4 shadow-[0_15px_35px_rgba(0,0,0,0.8),0_0_40px_rgba(232,133,42,0.4)] flex items-center justify-center backdrop-blur-xl group"
          >
            {userProfile.logoStyle === 'cat' ? (
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-tr from-[#e8852a] to-[#ffd066] brand-logo-cat drop-shadow-[0_0_20px_rgba(255,208,102,0.8)] animate-pulse" />
            ) : (
              <div className="relative flex items-center justify-center">
                <Film className="w-10 h-10 sm:w-12 sm:h-12 text-[#ffd066] drop-shadow-[0_0_18px_rgba(232,133,42,0.9)]" />
                <Sparkles className="w-5 h-5 text-white absolute -top-1 -right-1 animate-bounce drop-shadow-[0_0_10px_#fff]" />
              </div>
            )}

            {/* Inner Metallic Specular Highlight */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-white/10 via-transparent to-transparent pointer-events-none" />
          </motion.div>
        </div>

        {/* Staggered Cinematic Typography */}
        <div className="flex items-center justify-center gap-1.5 sm:gap-2.5 md:gap-3.5 mb-3 overflow-hidden py-1">
          {titleLetters.map((char, index) => (
            <motion.span
              key={index}
              initial={{ opacity: 0, y: 35, rotateX: 90, filter: 'blur(8px)' }}
              animate={{
                opacity: phase >= 2 ? 1 : 0,
                y: phase >= 2 ? 0 : 35,
                rotateX: phase >= 2 ? 0 : 90,
                filter: phase >= 2 ? 'blur(0px)' : 'blur(8px)',
              }}
              transition={{
                duration: 0.8,
                delay: 0.6 + index * 0.07,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-display font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-b from-[#ffffff] via-[#f7dca3] to-[#d4a853] drop-shadow-[0_4px_16px_rgba(0,0,0,0.9)] inline-block"
            >
              {char}
            </motion.span>
          ))}
        </div>

        {/* Luminous Tagline & Laser Horizon */}
        <motion.div
          initial={{ opacity: 0, y: 15, letterSpacing: '0.2em' }}
          animate={{
            opacity: phase >= 3 ? 1 : 0,
            y: phase >= 3 ? 0 : 15,
            letterSpacing: phase >= 3 ? '0.45em' : '0.2em',
          }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className="flex flex-col items-center gap-2 mt-1"
        >
          <p className="text-[10px] sm:text-xs md:text-sm font-mono uppercase font-bold text-[#e8852a] tracking-[0.45em] drop-shadow-[0_0_12px_rgba(232,133,42,0.8)]">
            The Multiverse of Cinema
          </p>

          <div className="flex items-center gap-2 w-48 sm:w-64 opacity-70">
            <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-[#ffd066]" />
            <span className="w-1.5 h-1.5 rounded-full bg-[#ffd066] shadow-[0_0_8px_#ffd066]" />
            <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-[#ffd066]" />
          </div>
        </motion.div>
      </motion.div>

      {/* Top Left: Sound Control */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsMuted(!isMuted);
          if (isMuted) playCinematicAudio();
        }}
        aria-label={isMuted ? 'Unmute intro audio' : 'Mute intro audio'}
        className="absolute top-6 left-6 z-40 p-2.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white backdrop-blur-xl transition-all cursor-pointer shadow-lg"
      >
        {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-brand" />}
      </motion.button>

      {/* Bottom Right: Skip Intro Pill with Radial Progress */}
      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onComplete();
        }}
        className="absolute bottom-8 right-8 z-40 flex items-center gap-3 px-5 py-2.5 rounded-full bg-[#12131a]/80 hover:bg-brand/20 border border-white/15 hover:border-brand/50 text-white/90 hover:text-white backdrop-blur-2xl transition-all hover:scale-105 cursor-pointer shadow-[0_8px_25px_rgba(0,0,0,0.6)] group"
      >
        <span className="text-xs sm:text-sm font-bold tracking-wider uppercase font-display">
          Skip Intro
        </span>

        {/* Circular Mini Progress Ring */}
        <div className="relative w-4 h-4 flex items-center justify-center">
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
              className="stroke-[#e8852a] transition-all duration-75"
              strokeWidth="3"
              strokeDasharray={56.5}
              strokeDashoffset={56.5 - (56.5 * progress) / 100}
              strokeLinecap="round"
              fill="transparent"
            />
          </svg>
        </div>
      </motion.button>
    </div>
  );
}
