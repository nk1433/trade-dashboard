import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import process from 'process';

export default defineConfig(({ mode }) => {
  const { VITE_PORT: port } = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    server: {
      port,
    },
  };
});