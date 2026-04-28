// svelte.config.js
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

export default {
  // This tells Svelte how to read TypeScript and Tailwind CSS inside your components
  preprocess: vitePreprocess(),
};