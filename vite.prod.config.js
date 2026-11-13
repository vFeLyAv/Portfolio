// Produktions-Build: NUR die Hauptseite „Salon“ (salon/, seit 10.11.2026; vorher Jahreszeiten/seasons).
// Ergebnis liegt in site/dist-prod/ – salon/index.html wird dort zu dist-prod/index.html.
// Die anderen Varianten und alle _shots-Testdateien kommen nicht mit (die Varianten laufen auf felya-styles.pages.dev).
// /shared, /img und /certs funktionieren weiter: /shared wird mitgebündelt, img und certs kommen aus public/.
// Nur lokal bauen und ansehen (npm run build:prod, npm run preview:prod) – hochladen nur über _tools\deploy.ps1.
import { resolve } from 'node:path';
import { existsSync, renameSync, rmSync } from 'node:fs';
import { defineConfig } from 'vite';

const OUT = resolve(__dirname, 'dist-prod');
const PAGE = 'salon';

// kleiner Schritt nach dem Bauen: salon/index.html → index.html (die Pfade darin sind absolut, z. B. /assets/…)
const flatten = () => ({
  name: 'hauptseite-als-startseite',
  apply: 'build',
  closeBundle() {
    const from = resolve(OUT, `${PAGE}/index.html`);
    if (!existsSync(from)) return;
    renameSync(from, resolve(OUT, 'index.html'));
    rmSync(resolve(OUT, PAGE), { recursive: true, force: true });
  },
});

export default defineConfig({
  server: { host: '127.0.0.1' },
  preview: { host: '127.0.0.1' },
  plugins: [flatten()],
  build: {
    // Goldrahmen und Tapete direkt ins CSS: sonst sieht man beim Laden kurz nur einfarbige Rechtecke,
    // bis die Datei da ist. Sonst gilt Vites Grenze (Dateien unter 4 KB werden eingebettet).
    assetsInlineLimit: (file) => (/[\\/]salon[\\/](frame\.svg|damask\.png)$/.test(file) ? true : undefined),
    outDir: OUT,
    emptyOutDir: true,
    rollupOptions: {
      input: { index: resolve(__dirname, `${PAGE}/index.html`) },
    },
  },
});
