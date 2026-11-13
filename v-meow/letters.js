// Eigene, spitze Display-Buchstaben im Stil des „MEOW“-Posters.
// Jede Glyphe: Breite w und ein SVG-Pfad in einem Raster mit Versalhöhe 100 (y von 0 bis 100, Spitzen dürfen etwas überstehen).
export const GLYPHS = {
  F: { w: 66, d: 'M0 0 L66 -3 L28 22 L28 40 L56 46 L28 58 L27 88 L10 110 L0 94 Z' },
  E: { w: 64, d: 'M0 0 L64 -3 L28 22 L28 39 L54 47 L28 56 L28 77 L68 103 L0 100 Z' },
  L: { w: 64, d: 'M0 8 L6 -9 L28 4 L28 76 L68 103 L0 100 Z' },
  I: { w: 31, d: 'M0 0 L31 -3 L27 62 L14 110 L3 62 Z' },
  K: { w: 72, d: 'M0 0 L28 -2 L28 37 L66 -9 L42 52 L74 109 L28 66 L26 94 L12 110 L0 94 Z' },
  S: { w: 66, d: 'M66 -7 C44 -2 22 -4 10 8 C-2 20 -2 40 10 48 L28 62 C34 66 34 72 26 76 L-4 105 C22 111 48 105 58 94 C70 80 68 58 52 50 L34 38 C28 34 28 26 36 22 Z' },
  X: { w: 84, d: 'M0 -7 L42 30 L86 -9 L58 50 L88 108 L42 71 L-4 107 L25 50 Z' },
};

/** Baut ein <svg> für einen Buchstaben. */
export function glyphSVG(ch) {
  const g = GLYPHS[ch];
  const pad = 10;
  return `<svg viewBox="${-pad} ${-pad - 4} ${g.w + pad * 2} ${118 + pad}" aria-hidden="true" focusable="false"><path d="${g.d}"/></svg>`;
}
