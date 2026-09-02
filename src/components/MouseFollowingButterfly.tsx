import { useEffect, useRef } from 'react';
import { motion, useSpring, useMotionValue } from 'motion/react';
import { Sparkles } from 'lucide-react';

export function MouseFollowingButterfly() {
  // Raw cursor motion values - initialized offscreen/upper-right
  const rawX = useMotionValue(typeof window !== 'undefined' ? window.innerWidth * 0.75 : 600);
  const rawY = useMotionValue(typeof window !== 'undefined' ? window.innerHeight * 0.35 : 250);
  const flightAngle = useMotionValue(0);

  // Smooth spring physics for natural, buttery 60fps flight inertia
  const smoothX = useSpring(rawX, { damping: 26, stiffness: 85, mass: 0.6 });
  const smoothY = useSpring(rawY, { damping: 26, stiffness: 85, mass: 0.6 });
  const smoothAngle = useSpring(flightAngle, { damping: 20, stiffness: 100 });

  const prevPos = useRef({ x: 0, y: 0, time: Date.now() });
  const isMoving = useRef(false);

  useEffect(() => {
    let idleTimer: ReturnType<typeof setTimeout>;
    let animationFrameId: number;
    let angle = 0;

    const handleMouseMove = (e: MouseEvent) => {
      isMoving.current = true;
      clearTimeout(idleTimer);

      const currentX = e.clientX;
      const currentY = e.clientY;

      const dx = currentX - prevPos.current.x;
      const dy = currentY - prevPos.current.y;
      const dist = Math.hypot(dx, dy);

      if (dist > 2) {
        let targetAngle = (Math.atan2(dy, dx) * 180) / Math.PI;
        if (targetAngle > 90) targetAngle = 180 - targetAngle;
        else if (targetAngle < -90) targetAngle = -180 - targetAngle;
        
        flightAngle.set(Math.max(-30, Math.min(30, targetAngle * 0.4)));
      }

      prevPos.current = { x: currentX, y: currentY, time: Date.now() };

      rawX.set(currentX + 32);
      rawY.set(currentY + 22);

      idleTimer = setTimeout(() => {
        isMoving.current = false;
      }, 1500);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        const touch = e.touches[0];
        isMoving.current = true;
        rawX.set(touch.clientX + 28);
        rawY.set(touch.clientY + 18);
        clearTimeout(idleTimer);
        idleTimer = setTimeout(() => {
          isMoving.current = false;
        }, 1500);
      }
    };

    const animateIdleFlight = () => {
      if (!isMoving.current) {
        angle += 0.025;
        const curX = rawX.get();
        const curY = rawY.get();
        rawX.set(curX + Math.sin(angle) * 0.8);
        rawY.set(curY + Math.cos(angle * 1.3) * 0.6);
        flightAngle.set(Math.sin(angle) * 8);
      }
      animationFrameId = requestAnimationFrame(animateIdleFlight);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    animationFrameId = requestAnimationFrame(animateIdleFlight);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
      cancelAnimationFrame(animationFrameId);
      clearTimeout(idleTimer);
    };
  }, [rawX, rawY, flightAngle]);

  return (
    <motion.div
      style={{
        position: 'fixed',
        left: 0,
        top: 0,
        x: smoothX,
        y: smoothY,
        rotate: smoothAngle,
        zIndex: 30,
      }}
      className="pointer-events-none select-none -translate-x-1/2 -translate-y-1/2 will-change-transform transform-gpu"
    >
      {/* Ambient soft glow aura without heavy blur layers */}
      <div
        className="absolute -top-3 -left-3 w-20 h-20 rounded-full opacity-40 -z-10 pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(251, 191, 36, 0.6) 0%, rgba(245, 158, 11, 0.2) 50%, transparent 70%)'
        }}
      />

      {/* Trailing Sparkle Emitter */}
      <motion.div
        animate={{
          y: [0, 14, 28],
          x: [0, -10, -18],
          opacity: [0.9, 0.4, 0],
        }}
        transition={{
          duration: 1.2,
          repeat: Infinity,
          ease: 'easeOut',
        }}
        className="absolute -bottom-2 -left-2 text-amber-300 pointer-events-none transform-gpu"
      >
        <Sparkles className="w-3.5 h-3.5" />
      </motion.div>

      {/* Butterfly (100% Click-through, Flapping wings) */}
      <div className="pointer-events-none select-none relative transform-gpu">
        <motion.div
          animate={{
            scaleX: [1, 0.4, 1],
            y: [0, -4, 0],
          }}
          transition={{
            duration: 0.45,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="relative origin-center pointer-events-none transform-gpu"
        >
          <img
            src="/images/golden-butterfly.png"
            alt="Golden Flying Butterfly"
            className="w-14 sm:w-16 h-auto object-contain pointer-events-none drop-shadow-md"
            draggable={false}
          />
        </motion.div>
      </div>
    </motion.div>
  );
}
