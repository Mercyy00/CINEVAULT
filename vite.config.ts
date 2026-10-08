import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import { defineConfig } from 'vite';

const rootPath = fs.realpathSync(process.cwd());

export default defineConfig(({ mode }) => ({
  root: rootPath,
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': rootPath,
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
      ignored: [
        '**/_birthday_backup/**',
        '**/cinematic-kinetic-typography-component/**',
        '**/public/music/**',
        '**/public/videos/**',
        '**/data/**',
        '**/*.mp3',
        '**/*.mp4',
        '**/*.wav',
      ],
    },
  },
}));
