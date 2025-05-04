import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import eslintPlugin from 'vite-plugin-eslint';
import fs from 'fs';

// https://vitejs.dev/config/
export default defineConfig({
  define: {
    'process.env.NODE_ENV': JSON.stringify(
      process.env.NODE_ENV || 'development'
    ),
  },
  plugins: [react(), eslintPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'), // src **
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@use "@/styles/variables.scss" as *;`, // ** @use * as *
      },
    },
  },
  server: {
    // port: 8080,
    // port: 5173,
    // *********
    proxy: {
      '/api': {
        // *** /api ***，***** target **，********，**github*****
        target: 'https://api.github.com',
        changeOrigin: true,
        // * /api ****
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
    https: {
      key: fs.readFileSync(path.resolve(__dirname, 'ssl/private.key')),
      cert: fs.readFileSync(path.resolve(__dirname, 'ssl/fullchain.pem')),
    },
    host: '0.0.0.0', // *******（**）
    port: 3000,
  },
});
