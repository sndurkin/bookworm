import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'

// https://vitejs.dev/config/
export default defineConfig({
  root: 'web',
  build: {
    outDir: 'dist',
  },
  server: {
    watch: {
      usePolling: true,
    },
  },
  plugins: [svelte()],
})
