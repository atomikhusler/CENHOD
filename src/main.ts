// src/main.ts
import App from './App.svelte';
import { registerSW } from 'virtual:pwa-register';

// ⚡ Activate the Silent Background Updater & Offline Caching
registerSW({ 
  immediate: true,
  onOfflineReady() {
    console.log('App is ready to work offline');
  }
});

const app = new App({
  target: document.getElementById('app')!,
});

export default app;