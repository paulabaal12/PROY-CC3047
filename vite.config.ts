/// <reference types="vitest" />
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

// `base` is configurable through VITE_BASE. The default './' (relative paths) works
// on GitHub Pages under any repo name because routing uses HashRouter.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    base: env.VITE_BASE || './',
    plugins: [react()],
    resolve: {
      alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
    },
    css: {
      preprocessorOptions: {
        scss: { api: 'modern-compiler', loadPaths: [fileURLToPath(new URL('./src', import.meta.url))] },
      },
    },
    build: {
      chunkSizeWarningLimit: 700,
      rollupOptions: {
        output: {
          manualChunks: {
            react: ['react', 'react-dom', 'react-router-dom'],
            mui: ['@mui/material', '@emotion/react', '@emotion/styled'],
            charts: ['recharts'],
            dnd: ['@dnd-kit/core', '@dnd-kit/utilities'],
          },
        },
      },
    },
    test: {
      environment: 'node',
      include: ['src/**/*.test.ts'],
    },
  };
});
