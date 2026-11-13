// Wolken-Generator: zeichnet eine Wolke in ein <canvas>.
// Idee: viele überlappende Kugeln (große unten, kleine oben drauf), Licht von oben links,
// bläulicher Schatten unten, dann Rauschen am Rand, damit die Kanten ausfransen wie echte Wolken.

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

export function mulberry(a) {
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Rauschen in mehreren Größen (fraktal): einmal klein erzeugen, dann für jede Wolke
// ein zufälliges Stück davon hochskaliert verwenden (spart viel Rechenzeit).
let NOISE = null;
function noiseTexture() {
  if (NOISE) return NOISE;
  const W = 640, H = 320;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const ctx = c.getContext('2d');
  const r = mulberry(7);
  ctx.fillStyle = '#808080'; ctx.fillRect(0, 0, W, H);
  // viele weiche helle und dunkle Flecken in drei Größen → gleichmäßiges, rundes Rauschen
  const octaves = [[0.065, 0.32], [0.032, 0.3], [0.015, 0.28]];
  for (const [size, alpha] of octaves) {
    const rad = H * size;
    const count = Math.round((W * H) / (rad * rad) * 0.9);
    for (let i = 0; i < count; i++) {
      const x = r() * W, y = r() * H, rr = rad * (0.6 + 0.8 * r());
      const v = r() < 0.5 ? 0 : 255;
      const g = ctx.createRadialGradient(x, y, 0, x, y, rr);
      g.addColorStop(0, `rgba(${v},${v},${v},${alpha})`);
      g.addColorStop(1, `rgba(${v},${v},${v},0)`);
      ctx.fillStyle = g; ctx.fillRect(x - rr, y - rr, rr * 2, rr * 2);
    }
  }
  NOISE = c;
  return c;
}
function noiseField(W, H, r) {
  const tex = noiseTexture();
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const ctx = c.getContext('2d', { willReadFrequently: true });
  // Ausschnitt: etwa halb so hoch wie die Textur, Seitenverhältnis wie die Wolke
  const sh = tex.height * (0.45 + 0.1 * r()), sw = Math.min(tex.width, sh * (W / H));
  const sx = r() * (tex.width - sw), sy = r() * (tex.height - sh);
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(tex, sx, sy, sw, sh, 0, 0, W, H);
  return ctx.getImageData(0, 0, W, H).data;
}

export function makeCloud(seed, { px = 700, ar = 2.2, tall = 1, far = 0, soft = 1, rag = 1 } = {}) {
  const W = Math.round(px), H = Math.round(px / ar);
  const c = document.createElement('canvas');
  c.width = W; c.height = H; c.className = 'cloud';
  const ctx = c.getContext('2d', { willReadFrequently: true });
  const r = mulberry(seed);
  let P = [];

  // 1) große Grundkugeln entlang einer Kuppel (in freien Einheiten, später eingepasst)
  const big = 6 + Math.floor(r() * 4);
  const span = ar * 1.0;
  for (let i = 0; i < big; i++) {
    const u = (i + 0.2 + r() * 0.6) / big;               // 0..1 von links nach rechts
    const dome = Math.pow(Math.sin(Math.PI * u), 1.1);
    const rad = 0.16 + 0.22 * dome * (0.6 + 0.6 * r());
    const y = -rad * 0.5 - dome * 0.32 * tall * (0.5 + 0.5 * r());
    P.push({ x: u * span, y, r: rad, lvl: 0 });
  }
  // 2) kleinere Kugeln oben drauf (Blumenkohl-Struktur), zwei Stufen
  for (let lvl = 1; lvl <= 2; lvl++) {
    for (const p of P.filter((q) => q.lvl === lvl - 1)) {
      const kids = lvl === 1 ? 2 + Math.floor(r() * 3) : Math.floor(r() * 3);
      for (let k = 0; k < kids; k++) {
        const ang = -Math.PI * (0.15 + 0.7 * r());
        const rr = p.r * (0.38 + 0.25 * r());
        const d = p.r * (0.55 + 0.3 * r());
        P.push({ x: p.x + Math.cos(ang) * d, y: p.y + Math.sin(ang) * d * (0.7 + 0.4 * tall), r: rr, lvl });
      }
    }
  }
  // 3) flacher Boden
  for (let i = 0; i < 5; i++) {
    const u = 0.12 + 0.76 * r();
    P.push({ x: u * span, y: -0.06, r: 0.12 + 0.06 * r(), lvl: 0 });
  }
  // 4) in die Leinwand einpassen (mit Rand für Unschärfe)
  const m = H * 0.1;
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
  for (const p of P) { x0 = Math.min(x0, p.x - p.r); x1 = Math.max(x1, p.x + p.r); y0 = Math.min(y0, p.y - p.r); y1 = Math.max(y1, p.y + p.r * 0.7); }
  const s = Math.min((W - 2 * m) / (x1 - x0), (H - 2 * m) / (y1 - y0));
  const ox = (W - (x1 - x0) * s) / 2, oy = H - m - (y1 - y0) * s;
  P = P.map((p) => ({ ...p, x: ox + (p.x - x0) * s, y: oy + (p.y - y0) * s, r: p.r * s }));
  const base = H - m - H * 0.06;
  P.sort((a, b) => a.y - b.y); // obere zuerst, untere liegen davor

  // 5) Form-Maske: alle Kugeln weich gezeichnet (nur Deckkraft)
  const mk = document.createElement('canvas'); mk.width = W; mk.height = H;
  const mx = mk.getContext('2d', { willReadFrequently: true });
  // weiche Kreise per Verlauf statt Blur-Filter (viel schneller)
  for (const p of P) {
    const R = p.r + H * 0.04 * soft;
    const g = mx.createRadialGradient(p.x, p.y, 0, p.x, p.y, R);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(clamp((p.r - H * 0.04 * soft) / R, 0, 0.95), 'rgba(255,255,255,1)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    mx.fillStyle = g; mx.fillRect(p.x - R, p.y - R, R * 2, R * 2);
  }
  const mask = mx.getImageData(0, 0, W, H).data;

  // 6) Licht: jede Kugel oben links hell, unten rechts leicht im Schatten
  for (const p of P) {
    const g = ctx.createRadialGradient(p.x - p.r * 0.32, p.y - p.r * 0.42, p.r * 0.05, p.x - p.r * 0.08, p.y - p.r * 0.08, p.r * 1.2);
    g.addColorStop(0, '#ffffff');
    g.addColorStop(0.5, '#fbfcff');
    g.addColorStop(0.82, '#edf1fd');
    g.addColorStop(1, '#d6def8');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
  }
  // Unterseite bläulich; ferne Wolken nehmen Himmelsfarbe an
  ctx.globalCompositeOperation = 'source-atop';
  const g = ctx.createLinearGradient(0, base - H * 0.5, 0, base + H * 0.05);
  g.addColorStop(0, 'rgba(120,140,225,0)'); g.addColorStop(1, 'rgba(112,134,224,.34)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  ctx.globalCompositeOperation = 'source-over';

  // 7) Kante mit Rauschen ausfransen, Boden unregelmäßig weich auslaufen lassen
  const img = ctx.getImageData(0, 0, W, H);
  const d = img.data;
  const n = noiseField(W, H, r);
  const amp = 0.75 * rag;
  const edge = [212, 222, 248];
  const tint = [105, 140, 255];
  for (let yy = 0; yy < H; yy++) {
    for (let xx = 0; xx < W; xx++) {
      const i = (yy * W + xx) * 4;
      const a = mask[i + 3] / 255;
      if (a === 0) { d[i + 3] = 0; continue; }
      const nv = n[i] / 255 - 0.5;
      let na = clamp((a + nv * amp - 0.24) / 0.36, 0, 1);
      na = na * na * (3 - 2 * na);
      let bt = clamp(1 - (yy + nv * H * 0.05 - (base - H * 0.08)) / (H * 0.15), 0, 1);
      bt = bt * bt * (3 - 2 * bt);
      const ca = d[i + 3] / 255; // Deckkraft der beleuchteten Kugeln
      const sh = 1 + nv * 0.09;
      for (let k = 0; k < 3; k++) {
        let v = d[i + k] * ca + edge[k] * (1 - ca);
        v *= k === 2 ? 1 + nv * 0.03 : sh;
        if (far) v = v * (1 - far) + tint[k] * far;
        d[i + k] = clamp(v, 0, 255);
      }
      d[i + 3] = 255 * na * bt;
    }
  }
  ctx.putImageData(img, 0, 0);

  // 8) zum Schluss ganz leicht weichzeichnen
  const t = document.createElement('canvas'); t.width = W; t.height = H;
  t.getContext('2d').drawImage(c, 0, 0);
  ctx.clearRect(0, 0, W, H);
  ctx.filter = `blur(${Math.max(0.6, H * 0.004 * soft)}px)`;
  ctx.drawImage(t, 0, 0);
  ctx.filter = 'none';
  return c;
}

// Färbt eine fertige Wolke ein (Jahreszeiten): mit einem senkrechten Verlauf verrechnen,
// die Form (Deckkraft) bleibt gleich. stops = [[0, '#ffd6de'], [1, '#d0193a']]
// mode 'multiply' dunkelt ab (Nacht), 'color' tauscht nur den Farbton und behält Licht und Schatten (Herbst).
export function tintCloud(src, stops, alpha = 1, mode = 'multiply') {
  const c = document.createElement('canvas');
  c.width = src.width; c.height = src.height; c.className = src.className;
  const x = c.getContext('2d');
  x.drawImage(src, 0, 0);
  x.globalCompositeOperation = mode;
  const g = x.createLinearGradient(0, 0, 0, c.height);
  for (const [p, col] of stops) g.addColorStop(p, col);
  x.fillStyle = g; x.fillRect(0, 0, c.width, c.height);
  x.globalCompositeOperation = 'destination-in';
  x.globalAlpha = alpha;
  x.drawImage(src, 0, 0);
  return c;
}
