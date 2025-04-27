// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // … your existing resolve, server, etc. …
  optimizeDeps: {
    include: [
      'react',
      'react-dom',             // ← add this
      'react/jsx-runtime',
      'poseidon-lite',
      // …other includes…
    ],
    commonjsOptions: {
      include: [
        /node_modules\/react\//,
        /node_modules\/react-dom\//,   // ← and add this
        /node_modules\/poseidon-lite/
      ]
    }
  },
  build: {
    sourcemap: false,
    commonjsOptions: {
      include: [
        /node_modules\/react\//,
        /node_modules\/react-dom\//,   // ← and add here too
        /node_modules\/poseidon-lite/
      ]
    }
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    allowedHosts: true,
    proxy: { '/api': { target: 'http://localhost:3001', changeOrigin: true } }
  }
});

