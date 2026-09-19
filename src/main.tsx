import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { installRippleEffect } from './lib/ripple.ts';
import { registerServiceWorker } from './lib/registerServiceWorker.ts';

// Auto-recover from stale chunks when a new deployment goes live
window.addEventListener('vite:preloadError', (event) => {
  event.preventDefault();
  const hasReloaded = sessionStorage.getItem('cv_chunk_reload');
  if (!hasReloaded) {
    sessionStorage.setItem('cv_chunk_reload', 'true');
    window.location.reload();
  }
});

// Reset reload guard on clean boot
sessionStorage.removeItem('cv_chunk_reload');

installRippleEffect();
registerServiceWorker();

const container = document.getElementById('root');
if (!container) {
  throw new Error('Root element #root is missing from index.html');
}

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>
);
