// vite.config.ts
import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: '/CENHOD/', 
  plugins: [
    svelte(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: { 
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        maximumFileSizeToCacheInBytes: 10000000 // Increased to 10MB to prevent Workbox crashing
      },
      manifest: {
        name: 'CenHoD Elite',
        short_name: 'CenHoD',
        theme_color: '#000000',
        background_color: '#000000',
        display: 'standalone'
      }
    })
  ],
  // ⚡ THE ZERO-CRASH MOBILE RAM FIX
  build: {
    minify: false, // Disables compression entirely to save RAM
    sourcemap: false,
    chunkSizeWarningLimit: 5000,
    rollupOptions: {
      output: {
        manualChunks: undefined
      }
    }
  }
});