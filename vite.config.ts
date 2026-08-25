import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  build: {
    target: 'es2022',
    sourcemap: true,
    // Fail the build if a chunk gets unreasonably large rather than warning.
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        // Keep the big, rarely-changing vendor libraries in their own chunks
        // so an app-code deploy doesn't invalidate them in users' caches.
        manualChunks: {
          react: ['react', 'react-dom'],
          firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore'],
          motion: ['motion/react'],
        },
      },
    },
  },
  esbuild: {
    // Strip console/debugger from production bundles only.
    drop: mode === 'production' ? ['console', 'debugger'] : [],
  },
  server: {
    port: 3005,
  },
}));
