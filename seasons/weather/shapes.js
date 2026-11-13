// Formen für Blüten und Blätter. Eine Quelle für beide Welten:
// Canvas zeichnet sie als Path2D (fliegende Teilchen), HTML benutzt sie als SVG-Symbol (hängt an Leine und Klammer).
// Koordinaten: Mitte bei 0/0, etwa 20 Einheiten groß.

// Kirschblüten-Blatt: unten schmal (Ansatz), oben breit mit kleiner Kerbe
export const PETAL = 'M0 8C-4 6.2-6 .6-4.7-4.2C-4-6.9-1.8-7.7-.8-6.4L0-5.2L.8-6.4C1.8-7.7 4-6.9 4.7-4.2C6 .6 4 6.2 0 8Z';

// Ahornblatt: fünf spitze Lappen, rechte Hälfte von oben nach unten, links gespiegelt
const MAPLE_R = [[0, -10], [1.2, -6.6], [3.2, -7.8], [2.9, -4], [6.4, -6.4], [6, -3.4], [9.6, -2.6], [7.2, -0.6], [7.8, 1.4], [4.6, 1.6], [6.2, 4.6], [2.6, 3.6], [0.7, 5]];
export const MAPLE = (() => {
  const r = MAPLE_R, l = MAPLE_R.slice(1, -1).reverse().map(([x, y]) => [-x, y]);
  const pts = [...r, [-0.7, 5], ...l];
  return `M${pts.map(([x, y]) => `${x} ${y}`).join('L')}Z`;
})();
export const MAPLE_VEINS = 'M0 4.6L0 -8M0 3.6L8 -2.3M0 3.6L-8 -2.3M0 4.4L5 3.6M0 4.4L-5 3.6';

// Buchenblatt: schlank, gewellter Rand angedeutet durch die Adern
export const BEECH = 'M0 -9C4.8 -6 5.4 2 0 8C-5.4 2 -4.8 -6 0 -9Z';
export const STEM = 'M0 4.6Q.6 7.5 .2 10.6';
export const BEECH_VEINS = 'M0 7.6L0 -7.5M0 -3L2.8 -5M0 -3L-2.8 -5M0 0.5L3.8 -1.6M0 0.5L-3.8 -1.6M0 4L3 2.2M0 4L-3 2.2';

// SVG-Symbole einmal ins Dokument legen: #bloom (Kirschblüte) und #leaf (Ahorn an der Klammer)
export function installSymbols() {
  const NS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('width', '0'); svg.setAttribute('height', '0');
  svg.setAttribute('aria-hidden', 'true'); svg.setAttribute('focusable', 'false');
  svg.style.position = 'absolute';
  const petals = [0, 72, 144, 216, 288].map((a) => `<path d="${PETAL}" transform="rotate(${a}) translate(0 -8.2)" fill="url(#bloomGrad)"/>`).join('');
  const stamens = Array.from({ length: 7 }, (_, i) => {
    const a = (i / 7) * Math.PI * 2, x = Math.cos(a) * 3.8, y = Math.sin(a) * 3.8;
    return `<path d="M0 0L${x.toFixed(2)} ${y.toFixed(2)}" stroke="#e67a93" stroke-width=".55"/><circle cx="${x.toFixed(2)}" cy="${y.toFixed(2)}" r=".8" fill="#c4234a"/>`;
  }).join('');
  svg.innerHTML = `<defs>
    <radialGradient id="bloomGrad" gradientUnits="userSpaceOnUse" cx="0" cy="0" r="17">
      <stop offset="0" stop-color="#e9708e"/><stop offset=".38" stop-color="#f4b3c0"/><stop offset="1" stop-color="#fff4f6"/>
    </radialGradient>
    <linearGradient id="leafGrad" gradientUnits="userSpaceOnUse" x1="-6" y1="-10" x2="6" y2="6">
      <stop offset="0" stop-color="#e8862c"/><stop offset=".5" stop-color="#d0193a"/><stop offset="1" stop-color="#7c1428"/>
    </linearGradient>
  </defs>
  <symbol id="bloom" viewBox="-17 -17 34 34" overflow="visible">${petals}<circle r="2.2" fill="#f7d98a"/>${stamens}</symbol>
  <symbol id="leaf" viewBox="-11 -11 22 22" overflow="visible">
    <path d="M0 4.6Q.6 7.5 .2 10.6" stroke="#5a1a14" stroke-width=".9" fill="none" stroke-linecap="round"/>
    <path d="${MAPLE}" fill="url(#leafGrad)"/>
    <path d="${MAPLE_VEINS}" stroke="#ffd9b8" stroke-opacity=".42" stroke-width=".45" fill="none" stroke-linecap="round"/>
  </symbol>`;
  document.body.prepend(svg);
}

// kleine Helfer für die Canvas-Module
let cache = null;
export function paths() {
  if (!cache) cache = {
    petal: new Path2D(PETAL),
    maple: new Path2D(MAPLE), mapleVeins: new Path2D(MAPLE_VEINS),
    beech: new Path2D(BEECH), beechVeins: new Path2D(BEECH_VEINS), stem: new Path2D(STEM),
  };
  return cache;
}
// Lebenslauf (Überschrift bis Unterkante Glas) großzügig aus einer Leinwand aussparen.
// Gibt true zurück, wenn ein save() offen ist (danach restore() aufrufen).
export function clipCv(g, ctx) {
  const t = document.getElementById('h-cv'), p = document.getElementById('cvPanel');
  if (!t || !p) return false;
  const a = t.getBoundingClientRect(), b = p.getBoundingClientRect();
  if (b.bottom < -40 || a.top > ctx.H + 40) return false;
  const pad = 28, l = Math.min(a.left, b.left) - pad, r = Math.max(a.right, b.right) + pad;
  g.save();
  g.beginPath();
  g.rect(0, 0, ctx.W, ctx.H);
  g.rect(l, a.top - pad, r - l, b.bottom - a.top + pad * 2);
  g.clip('evenodd');
  return true;
}
export const rnd = (a, b) => a + Math.random() * (b - a);
export const pick = (list) => list[Math.floor(Math.random() * list.length)];
