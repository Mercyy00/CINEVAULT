/**
 * Click ripple for primary actions.
 *
 * The previous implementation decided whether to ripple by reading the
 * button's innerText and matching against 'watch' | 'play' | 'add' |
 * 'surprise'. That coupled a visual effect to copy: renaming a button or
 * translating the UI silently removed the effect, and any button whose label
 * happened to contain "add" got one by accident.
 *
 * Elements now opt in explicitly with `data-ripple`, or by carrying the
 * `.ripple-container` class that already exists in index.css.
 */

const RIPPLE_SELECTOR = '[data-ripple], .ripple-container';
const RIPPLE_DURATION_MS = 600;

let installed = false;

export function installRippleEffect(): void {
  if (installed || typeof document === 'undefined') return;
  installed = true;

  document.addEventListener(
    'pointerdown',
    (event: PointerEvent) => {
      // Primary button only, and never when the user has asked for less motion.
      if (event.button !== 0) return;
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

      const target = event.target;
      if (!(target instanceof Element)) return;

      const host = target.closest<HTMLElement>(RIPPLE_SELECTOR);
      if (!host || host.hasAttribute('disabled')) return;

      const rect = host.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      // Guarantee the ripple is positioned and clipped without permanently
      // rewriting inline styles the component may own.
      if (getComputedStyle(host).position === 'static') {
        host.classList.add('ripple-container');
      }

      const size = Math.max(rect.width, rect.height);
      const ripple = document.createElement('span');
      ripple.className = 'ripple';
      ripple.style.width = `${size}px`;
      ripple.style.height = `${size}px`;
      ripple.style.left = `${event.clientX - rect.left - size / 2}px`;
      ripple.style.top = `${event.clientY - rect.top - size / 2}px`;

      host.appendChild(ripple);

      // Prefer the animation's own completion event; the timeout is a fallback
      // for the case where the animation never starts (e.g. display:none).
      let removed = false;
      const remove = () => {
        if (removed) return;
        removed = true;
        ripple.remove();
      };
      ripple.addEventListener('animationend', remove, { once: true });
      window.setTimeout(remove, RIPPLE_DURATION_MS + 100);
    },
    { passive: true }
  );
}
