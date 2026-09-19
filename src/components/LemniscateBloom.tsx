import { useEffect, useRef } from 'react';

export interface LemniscateBloomProps {
  /** Size in pixels or CSS units, e.g. 64, 80, "5rem". Defaults to 72 */
  size?: number | string;
  /** CSS class applied to the container, defaults to 'text-brand' */
  className?: string;
  /** Stroke width of the base lemniscate guide track. Defaults to 2.2 */
  strokeWidth?: number;
  /** Number of orbiting particles forming the bloom trail. Defaults to 24 */
  particleCount?: number;
  /** Trail span percentage (0 to 1). Defaults to 0.3 */
  trailSpan?: number;
  /** Loop duration in milliseconds for one full cycle. Defaults to 3000ms */
  durationMs?: number;
  /** Pulse breathing duration in milliseconds. Defaults to 4200ms */
  pulseDurationMs?: number;
  /** Rotation duration in ms if rotation is enabled. Defaults to 12000ms */
  rotationDurationMs?: number;
  /** Whether the lemniscate rotates over time. Defaults to false as in specification */
  rotate?: boolean;
  /** Base scale parameter `a`. Defaults to 15.5 */
  lemniscateA?: number;
  /** Bloom expansion boost. Defaults to 4.0 */
  lemniscateBoost?: number;
  /** Ambient dynamic glow behind the curve */
  glow?: boolean;
  /** Optional accessible status label */
  ariaLabel?: string;
}

/**
 * Lemniscate Bloom Loader
 *
 * Mathematically derived from the Bernoulli Lemniscate:
 *   a = 15.5 + 4.0s
 *   x(t) = 50 + a cos t / (1 + sin² t)
 *   y(t) = 50 + a sin t cos t / (1 + sin² t)
 *
 * Lightweight, GPU-accelerated, runs via requestAnimationFrame directly on the SVG DOM
 * without triggering React re-renders.
 */
export function LemniscateBloom({
  size = 72,
  className = 'text-brand',
  strokeWidth = 2.2,
  particleCount = 24,
  trailSpan = 0.3,
  durationMs = 3000,
  pulseDurationMs = 4200,
  rotationDurationMs = 12000,
  rotate = false,
  lemniscateA = 15.5,
  lemniscateBoost = 4.0,
  glow = true,
  ariaLabel = 'Loading',
}: LemniscateBloomProps) {
  const groupRef = useRef<SVGGElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const circlesRef = useRef<SVGCircleElement[]>([]);

  useEffect(() => {
    const group = groupRef.current;
    const path = pathRef.current;
    if (!group || !path) return;

    // Clean up any stale elements
    circlesRef.current.forEach((c) => c.remove());
    circlesRef.current = [];

    const SVG_NS = 'http://www.w3.org/2000/svg';
    const particles = Array.from({ length: particleCount }, () => {
      const circle = document.createElementNS(SVG_NS, 'circle');
      circle.setAttribute('fill', 'currentColor');
      group.appendChild(circle);
      return circle;
    });
    circlesRef.current = particles;

    let animId: number;
    const startedAt = performance.now();

    const point = (progress: number, detailScale: number) => {
      const t = progress * Math.PI * 2;
      const scale = lemniscateA + detailScale * lemniscateBoost;
      const denom = 1 + Math.sin(t) ** 2;
      return {
        x: 50 + (scale * Math.cos(t)) / denom,
        y: 50 + (scale * Math.sin(t) * Math.cos(t)) / denom,
      };
    };

    const normalizeProgress = (progress: number) => ((progress % 1) + 1) % 1;

    const getDetailScale = (time: number) => {
      const pulseProgress = (time % pulseDurationMs) / pulseDurationMs;
      const pulseAngle = pulseProgress * Math.PI * 2;
      return 0.52 + ((Math.sin(pulseAngle + 0.55) + 1) / 2) * 0.48;
    };

    const getRotation = (time: number) => {
      if (!rotate) return 0;
      return -((time % rotationDurationMs) / rotationDurationMs) * 360;
    };

    const buildPath = (detailScale: number, steps = 180) => {
      let d = '';
      for (let i = 0; i <= steps; i++) {
        const pt = point(i / steps, detailScale);
        d += `${i === 0 ? 'M' : 'L'} ${pt.x.toFixed(2)} ${pt.y.toFixed(2)}`;
      }
      return d;
    };

    const getParticle = (index: number, progress: number, detailScale: number) => {
      const tailOffset = index / (particleCount - 1);
      const pt = point(normalizeProgress(progress - tailOffset * trailSpan), detailScale);
      const fade = Math.pow(1 - tailOffset, 0.56);
      return {
        x: pt.x,
        y: pt.y,
        radius: 0.9 + fade * 2.7,
        opacity: 0.04 + fade * 0.96,
      };
    };

    const render = (now: number) => {
      const time = now - startedAt;
      const progress = (time % durationMs) / durationMs;
      const detailScale = getDetailScale(time);

      if (rotate) {
        group.setAttribute('transform', `rotate(${getRotation(time)} 50 50)`);
      }
      path.setAttribute('d', buildPath(detailScale));

      for (let i = 0; i < particles.length; i++) {
        const p = getParticle(i, progress, detailScale);
        const node = particles[i];
        if (node) {
          node.setAttribute('cx', p.x.toFixed(2));
          node.setAttribute('cy', p.y.toFixed(2));
          node.setAttribute('r', p.radius.toFixed(2));
          node.setAttribute('opacity', p.opacity.toFixed(3));
        }
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      particles.forEach((c) => c.remove());
      circlesRef.current = [];
    };
  }, [
    particleCount,
    trailSpan,
    durationMs,
    pulseDurationMs,
    rotationDurationMs,
    rotate,
    lemniscateA,
    lemniscateBoost,
  ]);

  const numericSize = typeof size === 'number' ? `${size}px` : size;

  return (
    <div
      role="status"
      aria-label={ariaLabel}
      className={`inline-flex items-center justify-center relative select-none shrink-0 ${className}`}
      style={{ width: numericSize, height: numericSize }}
    >
      {glow && (
        <div
          className="absolute inset-0 rounded-full blur-xl opacity-35 bg-current pointer-events-none transform scale-90"
          aria-hidden="true"
        />
      )}
      <svg
        viewBox="0 0 100 100"
        fill="none"
        className="w-full h-full overflow-visible relative z-10 drop-shadow-sm"
        aria-hidden="true"
      >
        <g ref={groupRef}>
          <path
            ref={pathRef}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.14"
          />
        </g>
      </svg>
    </div>
  );
}
