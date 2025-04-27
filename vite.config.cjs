const { defineConfig } = require('vite');
const react = require('@vitejs/plugin-react');
const path = require('path');

module.exports = defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src/renderer'),
      '@/components': path.resolve(__dirname, 'src/renderer/components'),
      '@/lib': path.resolve(__dirname, 'src/renderer/lib'),
    },
  },
  server: {
    port: 5173,
  },
}); 