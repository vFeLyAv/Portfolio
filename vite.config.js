import { resolve } from 'node:path';
import { defineConfig } from 'vite';

// Mehrere Seiten: Auswahl + vier Stil-Varianten
export default defineConfig({
  server: { host: '127.0.0.1' }, // nur auf diesem PC erreichbar
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        night: resolve(__dirname, 'night/index.html'),
        vinyl: resolve(__dirname, 'vinyl/index.html'),
        sky: resolve(__dirname, 'sky/index.html'),
        xray: resolve(__dirname, 'xray/index.html'),
        seasons: resolve(__dirname, 'seasons/index.html'),
        vmask: resolve(__dirname, 'v-mask/index.html'),
        vknight: resolve(__dirname, 'v-knight/index.html'),
        vink: resolve(__dirname, 'v-ink/index.html'),
        vmeow: resolve(__dirname, 'v-meow/index.html'),
        vbloom: resolve(__dirname, 'v-bloom/index.html'),
        vgoats: resolve(__dirname, 'v-goats/index.html'),
        vquietblooms: resolve(__dirname, 'v-quietblooms/index.html'),
        vwon: resolve(__dirname, 'v-won/index.html'),
        vseason: resolve(__dirname, 'v-season/index.html'),
        vartheart: resolve(__dirname, 'v-artheart/index.html'),
        vface: resolve(__dirname, 'v-face/index.html'),
        salon: resolve(__dirname, 'salon/index.html'),
      },
    },
  },
});
