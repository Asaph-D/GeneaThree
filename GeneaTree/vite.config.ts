import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  envPrefix: ['VITE_', 'NEXT_PUBLIC_'],
  plugins: [react()],
  server: {
    watch: { ignored: ['**/test-artifacts/**'] },
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
