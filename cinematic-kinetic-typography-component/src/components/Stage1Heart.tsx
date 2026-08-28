import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';

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

interface Stage1HeartProps {
  onComplete: () => void;
}

export default function Stage1Heart({ onComplete }: Stage1HeartProps) {
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
    const glowTimer = setTimeout(() => setShowGlow(true), 600);
    const heartTimer = setTimeout(() => setShowHeart(true), 1600);
    const fadeTimer = setTimeout(() => setFadeInComplete(true), 3000);
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
        rotate: [0, -10, 10, -8, 8, -4, 4, -2, 0],
        scale: [1, 1.18, 0.92, 1.12, 0.96, 1.06, 0.98, 1.02, 1],
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
      setTimeout(() => onComplete(), 2200);
    }
  }, [clickCount, heartControls, spawnParticles, onComplete]);

  return (
    <motion.div
      className="fixed inset-0 flex items-center justify-center cursor-pointer select-none"
      style={{ background: '#0b0c10' }}
      onClick={handleClick}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.5 }}
    >
      {/* Deep ambient glow layers */}
      <AnimatePresence>
        {showGlow && (
          <>
            {/* Primary glow */}
            <motion.div
              className="absolute rounded-full"
              style={{
                width: '400px',
                height: '400px',
                background: 'radial-gradient(circle, rgba(255,77,109,0.1) 0%, rgba(232,133,42,0.05) 35%, transparent 65%)',
              }}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 2, opacity: 0 }}
              transition={{ duration: 2.5, ease: 'easeOut' }}
            >
              <motion.div
                className="absolute inset-[-20%] rounded-full"
                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.9, 0.5] }}
                transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
                style={{ background: 'radial-gradient(circle, rgba(255,77,109,0.08) 0%, rgba(232,133,42,0.03) 40%, transparent 65%)' }}
              />
            </motion.div>
            {/* Secondary ambient */}
            <motion.div
              className="absolute rounded-full"
              style={{
                width: '600px',
                height: '600px',
                background: 'radial-gradient(circle, rgba(232,133,42,0.03) 0%, rgba(255,77,109,0.015) 40%, transparent 60%)',
              }}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 3, ease: 'easeOut', delay: 0.5 }}
            />
          </>
        )}
      </AnimatePresence>

      {/* Ambient floating particles */}
      <AmbientParticles />

      {/* Main Heart */}
      <AnimatePresence>
        {showHeart && !isExploding && (
          <motion.div
            className="relative z-10"
            initial={{ scale: 0, opacity: 0, rotate: -10 }}
            animate={heartControls}
            exit={{ scale: 2.5, opacity: 0, rotate: 15 }}
            transition={{ duration: 1.4, ease: [0.34, 1.56, 0.64, 1] }}
          >
            <motion.svg
              viewBox="0 0 100 100"
              className="w-32 h-32 sm:w-44 sm:h-44 md:w-52 md:h-52 lg:w-60 lg:h-60"
              animate={{ scale: [1, 1.07, 1] }}
              transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
              style={{
                filter: 'drop-shadow(0 0 25px rgba(255,77,109,0.7)) drop-shadow(0 0 50px rgba(232,133,42,0.4)) drop-shadow(0 0 80px rgba(255,77,109,0.2))',
              }}
            >
              <defs>
                <radialGradient id="heartGlow" cx="50%" cy="35%" r="65%" fx="50%" fy="35%">
                  <stop offset="0%" stopColor="#ff8fa8" />
                  <stop offset="30%" stopColor="#ff4d6d" />
                  <stop offset="60%" stopColor="#e8365a" />
                  <stop offset="100%" stopColor="#e8852a" />
                </radialGradient>
                <radialGradient id="heartInner" cx="40%" cy="30%" r="50%">
                  <stop offset="0%" stopColor="rgba(255,255,255,0.15)" />
                  <stop offset="100%" stopColor="rgba(255,255,255,0)" />
                </radialGradient>
                <filter id="heartBlur">
                  <feGaussianBlur stdDeviation="2" />
                </filter>
              </defs>
              {/* Outer glow layer */}
              <path
                d="M50 90 C22 65, 0 40, 13 22 C20 10, 37 8, 50 26 C63 8, 80 10, 87 22 C100 40, 78 65, 50 90Z"
                fill="url(#heartGlow)"
                filter="url(#heartBlur)"
                opacity="0.4"
              />
              {/* Main heart body */}
              <path
                d="M50 90 C22 65, 0 40, 13 22 C20 10, 37 8, 50 26 C63 8, 80 10, 87 22 C100 40, 78 65, 50 90Z"
                fill="url(#heartGlow)"
                stroke="rgba(255,255,255,0.15)"
                strokeWidth="0.3"
              />
              {/* Inner highlight */}
              <path
                d="M50 90 C22 65, 0 40, 13 22 C20 10, 37 8, 50 26 C63 8, 80 10, 87 22 C100 40, 78 65, 50 90Z"
                fill="url(#heartInner)"
              />
              {/* Specular highlights */}
              <ellipse cx="33" cy="28" rx="9" ry="6" fill="rgba(255,255,255,0.12)" transform="rotate(-25, 33, 28)" />
              <ellipse cx="67" cy="28" rx="7" ry="5" fill="rgba(255,255,255,0.08)" transform="rotate(25, 67, 28)" />
              <circle cx="38" cy="22" r="2" fill="rgba(255,255,255,0.15)" />
            </motion.svg>

            {/* Ring pulse around heart */}
            <motion.div
              className="absolute inset-[-15%] rounded-full border"
              style={{ borderColor: 'rgba(255,77,109,0.15)' }}
              animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0, 0.3] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeOut' }}
            />
            <motion.div
              className="absolute inset-[-25%] rounded-full border"
              style={{ borderColor: 'rgba(232,133,42,0.08)' }}
              animate={{ scale: [1, 1.4, 1], opacity: [0.2, 0, 0.2] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeOut', delay: 0.5 }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Explosion heart */}
      <AnimatePresence>
        {isExploding && (
          <motion.div
            className="absolute z-20"
            initial={{ scale: 1, opacity: 1 }}
            animate={{ scale: 4, opacity: 0 }}
            transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
          >
            <svg viewBox="0 0 100 100" className="w-32 h-32 sm:w-44 sm:h-44 md:w-52 md:h-52">
              <defs>
                <radialGradient id="explHeart" cx="50%" cy="40%" r="60%">
                  <stop offset="0%" stopColor="#fff" />
                  <stop offset="40%" stopColor="#ff8fa8" />
                  <stop offset="100%" stopColor="#e8852a" />
                </radialGradient>
              </defs>
              <path d="M50 90 C22 65, 0 40, 13 22 C20 10, 37 8, 50 26 C63 8, 80 10, 87 22 C100 40, 78 65, 50 90Z" fill="url(#explHeart)" />
            </svg>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Particle system */}
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

      {/* Subtext */}
      <AnimatePresence>
        {showSubtext && !isExploding && (
          <motion.div
            className="absolute z-20 px-6 py-4 text-center max-w-sm sm:max-w-md"
            style={{ top: '58%', left: '50%', x: '-50%' }}
            initial={{ y: 30, opacity: 0, scale: 0.9 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -30, opacity: 0, scale: 0.9 }}
            transition={{ duration: 1, ease: [0.34, 1.56, 0.64, 1] }}
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
              style={{ color: 'rgba(232,133,42,0.8)' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.8 }}
            >
              Tap it once more, Divu... 💖
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Click hint */}
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
              style={{ color: 'rgba(232,133,42,0.45)' }}
              animate={{ opacity: [0.25, 0.75, 0.25] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
            >
              Touch the heart
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Full-screen flash overlay on explosion */}
      <AnimatePresence>
        {isExploding && (
          <>
            <motion.div
              className="fixed inset-0 z-40 pointer-events-none"
              style={{ background: 'radial-gradient(circle, rgba(255,200,180,0.4) 0%, rgba(255,77,109,0.2) 30%, rgba(232,133,42,0.1) 50%, transparent 70%)' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0.6, 0] }}
              transition={{ duration: 2, ease: 'easeOut' }}
            />
            <motion.div
              className="fixed inset-0 z-[39] pointer-events-none"
              style={{ background: '#0b0c10' }}
              initial={{ opacity: 1 }}
              animate={{ opacity: [1, 0, 0, 1] }}
              transition={{ duration: 2.2, ease: 'easeInOut', times: [0, 0.15, 0.7, 1] }}
            />
          </>
        )}
      </AnimatePresence>

      {/* Vignette overlay */}
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
