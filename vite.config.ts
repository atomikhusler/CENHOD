import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: '/CENHOD/', 
  plugins: [
    svelte(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'script', // ⚡ FORCES the install prompt
      workbox: { 
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        maximumFileSizeToCacheInBytes: 10000000 
      },
      manifest: {
        name: 'CenHoD Elite',
        short_name: 'CenHoD',
        description: 'Secure Data Entry Node',
        theme_color: '#000000',
        background_color: '#000000',
        display: 'standalone',
        scope: '/CENHOD/',      // ⚡ STRICT SCOPE
        start_url: '/CENHOD/',  // ⚡ STRICT START URL
        icons: [
          {
            src: 'icon.svg',
            sizes: '192x192 512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
  build: {
    minify: false, 
    sourcemap: false,
    chunkSizeWarningLimit: 5000,
    rollupOptions: {
      output: {
        manualChunks: undefined
      }
    }
  }
});
