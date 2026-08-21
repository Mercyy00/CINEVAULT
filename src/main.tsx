import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Global ripple effect for primary buttons
document.addEventListener('mousedown', (e) => {
  const target = (e.target as HTMLElement).closest('button');
  if (!target) return;
  const text = target.innerText.toLowerCase();
  if (text.includes('watch') || text.includes('play') || text.includes('add') || text.includes('surprise')) {
    const rect = target.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Ensure button is position relative and overflow hidden
    if (getComputedStyle(target).position === 'static') {
      target.style.position = 'relative';
    }
    target.style.overflow = 'hidden';

    const ripple = document.createElement('span');
    ripple.className = 'ripple';
    
    // Calculate size based on button dimensions to cover it fully
    const size = Math.max(rect.width, rect.height);
    ripple.style.width = ripple.style.height = `${size}px`;
    ripple.style.left = `${x - size / 2}px`;
    ripple.style.top = `${y - size / 2}px`;
    
    target.appendChild(ripple);
    setTimeout(() => {
      ripple.remove();
    }, 600);
  }
});


// PWA Installation & Service Worker Injection
const manifest = {
  name: "CineVault",
  short_name: "CineVault",
  start_url: "./",
  display: "standalone",
  background_color: "#0a0a0a",
  theme_color: "#e8852a",
  icons: [
    { src: "/favicon.png", sizes: "192x192", type: "image/png" },
    { src: "/favicon.png", sizes: "512x512", type: "image/png" }
  ]
};

const manifestString = JSON.stringify(manifest);
const manifestUrl = 'data:application/json;base64,' + btoa(manifestString);

let link = document.querySelector('link[rel="manifest"]') as HTMLLinkElement | null;
if (!link) {
  link = document.createElement('link') as HTMLLinkElement;
  link.rel = 'manifest';
  document.head.appendChild(link);
}
(link as HTMLLinkElement).href = manifestUrl;

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').catch((err) => console.error("SW registration failed:", err));
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
