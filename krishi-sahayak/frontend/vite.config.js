import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '..', 'VITE_');
  const configuredApiUrl = env.VITE_API_URL || 'http://localhost:4000/api';
  const apiUrl = new URL(configuredApiUrl);
  if (apiUrl.hostname === 'localhost') apiUrl.hostname = '127.0.0.1';

  return {
    envDir: '..',
    plugins: [react()],
    server: {
      host: '0.0.0.0',
      proxy: {
        '/api': { target: apiUrl.origin, changeOrigin: true },
      },
    },
  };
});
