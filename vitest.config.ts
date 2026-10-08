import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';

const rootPath = fs.realpathSync(process.cwd());

export default defineConfig({
  root: rootPath,
  plugins: [react()],
  resolve: {
    alias: {
      '@': rootPath,
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: [path.resolve(rootPath, 'src/__tests__/setup.ts')],
    include: ['src/**/*.test.{ts,tsx}'],
  },
});

