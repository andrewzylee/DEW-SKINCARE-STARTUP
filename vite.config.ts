import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// STACK — Vite config. Mobile-first web prototype, no backend.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5180,
    host: true,
  },
});
