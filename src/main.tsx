import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { installRippleEffect } from './lib/ripple.ts';
import { registerServiceWorker } from './lib/registerServiceWorker.ts';

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
