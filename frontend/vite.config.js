import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/',
  plugins: [react()],
  define: {
    __API_BASE__: JSON.stringify('/api'),
  },
  server: {
    host: true,
    port: 3333,
    strictPort: true,
    open: false,
  }
});
