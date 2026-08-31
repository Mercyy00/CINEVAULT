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
    // Only generate source maps in development to prevent leaking source code in production
    sourcemap: mode === 'development',
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        // Optimize chunk splitting to prevent huge monolithic JS bundles
        manualChunks: {
          'vendor-firebase': ['firebase/app', 'firebase/auth', 'firebase/firestore'],
          'vendor-motion': ['motion/react'],
          'vendor-icons': ['lucide-react'],
          'vendor-dnd': ['@hello-pangea/dnd'],
        },
      },
    },
  },
  esbuild: {
    // Strip console and debugger statements from production bundles
    drop: mode === 'production' ? ['console', 'debugger'] : [],
  },
  server: {
    port: 3005,
    watch: {
      ignored: ['**/cinematic-kinetic-typography-component/**'],
    },
  },
}));
