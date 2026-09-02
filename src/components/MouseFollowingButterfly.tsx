import { useState, useEffect, useRef } from 'react';
import { motion, useSpring, useMotionValue } from 'motion/react';
import { Sparkles } from 'lucide-react';

export function MouseFollowingButterfly() {
  const [isMouseActive, setIsMouseActive] = useState(false);
  const [flightAngle, setFlightAngle] = useState(0);

  // Raw cursor motion values (start near upper-right/middle)
  const rawX = useMotionValue(typeof window !== 'undefined' ? window.innerWidth * 0.75 : 600);
  const rawY = useMotionValue(typeof window !== 'undefined' ? window.innerHeight * 0.35 : 250);

  // Smooth spring physics for natural, lifelike flight inertia
  const springConfig = { damping: 22, stiffness: 65, mass: 0.8 };
  const smoothX = useSpring(rawX, springConfig);
  const smoothY = useSpring(rawY, springConfig);

  const prevPos = useRef({ x: 0, y: 0, time: Date.now() });

  useEffect(() => {
    let idleTimer: ReturnType<typeof setTimeout>;
    let animationFrameId: number;
    let angle = 0;

    const handleMouseMove = (e: MouseEvent) => {
      setIsMouseActive(true);
      clearTimeout(idleTimer);

      const currentX = e.clientX;
      const currentY = e.clientY;

      // Calculate flight rotation angle based on movement vector
      const dx = currentX - prevPos.current.x;
      const dy = currentY - prevPos.current.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > 3) {
        // Target angle in degrees (-45 to 45 degree natural bank)
        let targetAngle = (Math.atan2(dy, dx) * 180) / Math.PI;
        // Adjust for butterfly facing direction
        if (targetAngle > 90) targetAngle = 180 - targetAngle;
        else if (targetAngle < -90) targetAngle = -180 - targetAngle;
        
        setFlightAngle(Math.max(-35, Math.min(35, targetAngle * 0.5)));
      }

      prevPos.current = { x: currentX, y: currentY, time: Date.now() };

      // Trailing offset so the butterfly hovers gracefully beside the cursor
      rawX.set(currentX + 35);
      rawY.set(currentY + 25);

      // Return to gentle idle wandering if mouse stops
      idleTimer = setTimeout(() => {
        setIsMouseActive(false);
      }, 2500);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        const touch = e.touches[0];
        setIsMouseActive(true);
        rawX.set(touch.clientX + 30);
        rawY.set(touch.clientY + 20);
      }
    };

    // Autonomous gentle floating drift when mouse is idle
    const animateIdleFlight = () => {
      if (!isMouseActive && typeof window !== 'undefined') {
        angle += 0.018;
        const currentTargetX = rawX.get();
        const currentTargetY = rawY.get();
        
        // Gentle figure-8 / elliptical wander
        rawX.set(currentTargetX + Math.sin(angle) * 1.5);
        rawY.set(currentTargetY + Math.cos(angle * 1.5) * 1.2);
        setFlightAngle(Math.sin(angle) * 12);
      }
      animationFrameId = requestAnimationFrame(animateIdleFlight);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchmove', handleTouchMove);
    animationFrameId = requestAnimationFrame(animateIdleFlight);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
      cancelAnimationFrame(animationFrameId);
      clearTimeout(idleTimer);
    };
  }, [rawX, rawY, isMouseActive]);

  return (
    <motion.div
      style={{
        position: 'fixed',
        left: 0,
        top: 0,
        x: smoothX,
        y: smoothY,
        rotate: flightAngle,
        zIndex: 30,
      }}
      className="pointer-events-none select-none -translate-x-1/2 -translate-y-1/2 will-change-transform"
    >
      {/* Radiant Golden Glow Aura */}
      <motion.div
        animate={{
          opacity: [0.35, 0.85, 0.35],
          scale: [0.85, 1.3, 0.85],
        }}
        transition={{
          duration: 2.2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="absolute -top-4 -left-4 w-24 h-24 rounded-full blur-[26px] bg-gradient-to-r from-amber-400/50 via-yellow-300/40 to-pink-500/30 -z-10 pointer-events-none"
      />

      {/* Trailing Magic Sparkle Emitter */}
      <motion.div
        animate={{
          y: [0, 18, 35],
          x: [0, -12, -24],
          opacity: [0.95, 0.5, 0],
          scale: [0.8, 1.2, 0.3],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: 'easeOut',
        }}
        className="absolute -bottom-3 -left-3 text-amber-300 pointer-events-none"
      >
        <Sparkles className="w-4 h-4 drop-shadow-[0_0_8px_rgba(251,191,36,0.95)]" />
      </motion.div>

      {/* Butterfly (100% Click-through) */}
      <div className="pointer-events-none select-none relative">
        {/* Flapping Wing Animation Container */}
        <motion.div
          animate={{
            scaleX: [1, 0.38, 1],
            y: [0, -6, 0],
          }}
          transition={{
            duration: 0.48,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="relative origin-center pointer-events-none"
        >
          <img
            src="/images/golden-butterfly.png"
            alt="Golden Flying Butterfly"
            className="w-14 sm:w-16 md:w-20 h-auto object-contain filter drop-shadow-[0_8px_22px_rgba(245,158,11,0.7)] pointer-events-none"
            draggable={false}
          />
        </motion.div>
      </div>
    </motion.div>
  );
}
