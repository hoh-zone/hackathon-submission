import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    target: 'es2020',
  },
  plugins: [react()],
	server: {
		port: 5173,
		host: '0.0.0.0',
		allowedHosts: ['*', 'all', '1834-2407-cdc0-b00a-00-9.ngrok-free.app']
	},
});
