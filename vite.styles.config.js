// Build der Stil-Varianten für https://felya-styles.pages.dev → site/dist-styles
// Online stehen NUR die Varianten, die das Portfolio unter „Vom Poster zur Website“ zeigt (STUDIES in salon/works.js).
// Eine Quelle: Studie dort eintragen oder entfernen = Variante hier dabei oder nicht.
// Normaler Produktions-Build: keine Varianten-Leiste, keine Auswahlseite, kein Entwickler-Code.
// Hochladen nur über _tools\deploy-styles.ps1 (Projekt „felya-styles“).
import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import { STUDIES } from './salon/works.js';

const pages = STUDIES.filter((s) => !s.here).map((s) => s.id);   // die Seite „Salon“ selbst ist das Portfolio

export default defineConfig({
  build: {
    outDir: resolve(__dirname, 'dist-styles'),
    emptyOutDir: true,
    rollupOptions: {
      input: Object.fromEntries(pages.map((p) => [p, resolve(__dirname, `${p}/index.html`)])),
    },
  },
});
