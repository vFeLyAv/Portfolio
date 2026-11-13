// flora.js — Blumen, die nur aus Code entstehen (keine Fotos, keine Clipart).
// Jedes Blütenblatt ist ein Bézier-Pfad mit Farbverlauf, feinen Adern, Glanz und einer dunklen Kante.
// Die Blüten werden "in 3D" geneigt (Blatt kippt aus der Blütenebene), dadurch wirken Pfingstrosen wie Schalen.
// Eine fertig aufgeblühte Blüte wird einmal in ein kleines Canvas gemalt (Sprite) und danach nur noch gedreht:
// das spart Rechenzeit, damit alles flüssig im Wind schwingen kann.

const TAU = Math.PI * 2;
export const clamp = (v, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;
const easeOut = (t) => 1 - Math.pow(1 - clamp(t), 3);
const easeInOut = (t) => { t = clamp(t); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };

// kleiner Zufallsgenerator mit Startwert: gleiche Zahl → gleiche Blume (bei jedem Laden identisch)
export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const mix = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
const rgba = (c, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
const LIGHT = [255, 249, 244];
const DARK = [62, 8, 22];
const tone = (c, l) => (l >= 0 ? mix(c, LIGHT, l) : mix(c, DARK, -l));

// Farben aus dem Plakat: Korall-Pfingstrosen, Weinrot, dunkles Grün, Gold in der Mitte
const P = (o) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, hex(v)]));
export const PAL = {
  coral:  P({ base: '#B93445', mid: '#E9706A', tip: '#F7BBA9', edge: '#9C2F3E' }),
  blush:  P({ base: '#C8545F', mid: '#EF9B90', tip: '#FCDCD0', edge: '#AE4A56' }),
  salmon: P({ base: '#C64A3C', mid: '#EE8A6C', tip: '#FAD0BA', edge: '#A9443A' }),
  cream:  P({ base: '#D9A08F', mid: '#F5DCCF', tip: '#FFF6EF', edge: '#C38E80' }),
  wine:   P({ base: '#5E0B1E', mid: '#8E1C35', tip: '#C0475A', edge: '#4A0716' }),
  lilyPink: P({ throat: '#E9E0A6', body: '#D9506A', deep: '#B4294A', edge: '#FBE2E4', speck: '#701230' }),
  lilyFire: P({ throat: '#F2C24E', body: '#E25A3C', deep: '#C1302E', edge: '#F7C65E', speck: '#8C1F1A' }),
  anth:   P({ hi: '#A52E47', mid: '#6C1126', lo: '#360512', sp1: '#EED493', sp2: '#C8983F' }),
  bud:    P({ base: '#6E7C48', mid: '#7A1A30', tip: '#A8384C' }),
  budPink: P({ base: '#7D8A52', mid: '#E58B86', tip: '#F6C3B6' }),
  leaf:   P({ a: '#1F2B1B', b: '#4D6040', rib: '#93A27A' }),
  stem:   hex('#55683D'),
};

/* ------------------------------------------------------------------ Geometrie */

// Blatt aus der Blütenebene kippen: theta = Richtung in der Blüte (0 = nach oben),
// e = wie stark das Blatt aufgerichtet ist (0 = flach offen, ~1.4 = geschlossene Knospe)
function petalXform(ctx, theta, e, tilt, s, r0) {
  const dx = Math.sin(theta), dy = -Math.cos(theta);
  const ce = Math.cos(e), se = Math.sin(e);
  const Ax = dx * ce, Ay = dy * ce * tilt - se * s;
  const Px = Math.cos(theta), Py = Math.sin(theta) * tilt;
  ctx.transform(Px, Py, -Ax, -Ay, dx * r0, dy * r0 * tilt);
}
function dir3(theta, e, tilt, s) {
  const dx = Math.sin(theta), dy = -Math.cos(theta);
  return [dx * Math.cos(e), dy * Math.cos(e) * tilt - Math.sin(e) * s];
}

function smoothClosed(ctx, pts) {
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let k = 1; k < pts.length - 1; k++) {
    const mx = (pts[k][0] + pts[k + 1][0]) / 2, my = (pts[k][1] + pts[k + 1][1]) / 2;
    ctx.quadraticCurveTo(pts[k][0], pts[k][1], mx, my);
  }
  ctx.lineTo(pts[pts.length - 1][0], pts[pts.length - 1][1]);
  ctx.closePath();
}

// Fächerförmiges Pfingstrosen-Blatt mit gekräuselter Kante
function fanPath(ctx, L, phiMax, ruf, ph) {
  const N = 30, pts = [[0, 0]];
  for (let k = 0; k <= N; k++) {
    const u = (k / N) * 2 - 1;
    const phi = u * phiMax;
    let rr = L * Math.pow(Math.cos((u * Math.PI) / 2), 0.32);
    const top = 1 - Math.abs(u) * 0.35;
    rr *= 1 + ruf * top * (0.55 * Math.sin(u * 7 + ph[0]) + 0.3 * Math.sin(u * 15 + ph[1]) + 0.18 * Math.sin(u * 31 + ph[2]));
    pts.push([Math.sin(phi) * rr, -Math.cos(phi) * rr]);
  }
  pts.push([0, 0]);
  ctx.beginPath();
  smoothClosed(ctx, pts);
}

function shadeFan(ctx, L, phi, it) {
  const c = it.col;
  fanPath(ctx, L, phi, it.ruf, it.ph);
  // weicher Schatten auf die Blätter darunter
  ctx.lineWidth = L * 0.06;
  ctx.strokeStyle = rgba(c.edge, 0.09);
  ctx.stroke();
  const g = ctx.createLinearGradient(0, 0, 0, -L);
  g.addColorStop(0, rgba(c.base));
  g.addColorStop(0.42, rgba(c.mid));
  g.addColorStop(1, rgba(c.tip));
  ctx.fillStyle = g;
  ctx.fill();
  ctx.save();
  ctx.clip();
  // Wölbung: eine Seite des Blatts liegt im Schatten, die andere fängt Licht
  const side = it.fold || 1;
  const fg = ctx.createLinearGradient(-L * 0.7 * side, 0, L * 0.7 * side, 0);
  fg.addColorStop(0, 'rgba(255,248,244,0.16)');
  fg.addColorStop(0.45, 'rgba(255,248,244,0)');
  fg.addColorStop(0.7, rgba(c.edge, 0));
  fg.addColorStop(1, rgba(c.edge, 0.32 * (it.foldK ?? 1)));
  ctx.fillStyle = fg;
  ctx.fillRect(-L, -L * 1.3, L * 2, L * 1.4);
  // feine, unregelmäßige Adern
  ctx.strokeStyle = rgba(c.edge, 0.06);
  ctx.lineWidth = Math.max(0.4, L * 0.0035);
  for (let v = 0; v < it.veins; v++) {
    const a = (v / (it.veins - 1) * 2 - 1) * phi * 0.85;
    const bend = Math.sin(v * 2.3 + it.ph[0]) * 0.18;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(Math.sin(a * 0.5 + bend) * L * 0.4, -L * 0.36, Math.sin(a) * L * 0.72, -Math.cos(a) * L * 0.72);
    ctx.stroke();
  }
  // Tiefe am Ansatz
  const bg = ctx.createRadialGradient(0, 0, 0, 0, 0, L * 0.5);
  bg.addColorStop(0, rgba(c.edge, 0.45));
  bg.addColorStop(1, rgba(c.edge, 0));
  ctx.fillStyle = bg;
  ctx.fillRect(-L, -L, L * 2, L * 2);
  // samtiger Glanz
  const sh = ctx.createRadialGradient(L * 0.12, -L * 0.72, 0, L * 0.12, -L * 0.72, L * 0.48);
  sh.addColorStop(0, 'rgba(255,250,246,0.26)');
  sh.addColorStop(1, 'rgba(255,250,246,0)');
  ctx.fillStyle = sh;
  ctx.fillRect(-L, -L * 1.4, L * 2, L * 1.4);
  ctx.restore();
  ctx.lineWidth = Math.max(0.5, L * 0.007);
  ctx.strokeStyle = rgba(c.edge, 0.4);
  ctx.stroke();
}

// Lilienblatt: lang, spitz, leicht gewellt und gebogen
function tepalHW(s, w, L) { return w * L * Math.pow(Math.sin(Math.PI * Math.pow(s, 0.78)), 0.85) * (1 - 0.2 * s); }
function tepalPath(ctx, L, it) {
  const N = 22, right = [], left = [];
  for (let k = 0; k <= N; k++) {
    const s = k / N;
    const cx = it.curl * L * s * s;
    let hw = tepalHW(s, it.w, L);
    hw *= 1 + it.wave * Math.sin(s * 24 + it.ph) * s;
    right.push([cx + hw, -L * s]);
    left.push([cx - hw * (1 + it.wave * 0.6 * Math.sin(s * 19 + it.ph * 2) * s), -L * s]);
  }
  ctx.beginPath();
  smoothClosed(ctx, right.concat(left.reverse()));
}
function shadeTepal(ctx, L, it, pal) {
  tepalPath(ctx, L, it);
  ctx.lineWidth = L * 0.05;
  ctx.strokeStyle = 'rgba(80,12,30,0.09)';
  ctx.stroke();
  const g = ctx.createLinearGradient(0, 0, 0, -L);
  g.addColorStop(0, rgba(pal.throat));
  g.addColorStop(0.2, rgba(tone(pal.body, it.light)));
  g.addColorStop(0.55, rgba(tone(pal.deep, it.light)));
  g.addColorStop(1, rgba(tone(pal.body, it.light + 0.12)));
  ctx.fillStyle = g;
  ctx.fill();
  ctx.save();
  ctx.clip();
  // heller Rand (wie bei einer Stargazer-Lilie)
  ctx.lineWidth = L * it.w * 0.55;
  ctx.strokeStyle = rgba(pal.edge, 0.32);
  ctx.stroke();
  ctx.lineWidth = L * it.w * 0.26;
  ctx.strokeStyle = rgba(pal.edge, 0.55);
  ctx.stroke();
  // Mittelrippe
  ctx.beginPath();
  for (let k = 1; k <= 18; k++) { const s = k / 20; ctx.lineTo(it.curl * L * s * s, -L * s); }
  ctx.strokeStyle = rgba(pal.throat, 0.55);
  ctx.lineWidth = Math.max(0.6, L * 0.014);
  ctx.stroke();
  // Sprenkel
  ctx.fillStyle = rgba(pal.speck, 0.85);
  for (const sp of it.specks) {
    const s = sp[0], hw = tepalHW(s, it.w, L);
    ctx.beginPath();
    ctx.ellipse(it.curl * L * s * s + sp[1] * hw * 0.55, -L * s, L * 0.009 * sp[2], L * 0.013 * sp[2], 0, 0, TAU);
    ctx.fill();
  }
  const sh = ctx.createRadialGradient(-L * 0.05, -L * 0.55, 0, -L * 0.05, -L * 0.55, L * 0.4);
  sh.addColorStop(0, 'rgba(255,245,245,0.22)');
  sh.addColorStop(1, 'rgba(255,245,245,0)');
  ctx.fillStyle = sh;
  ctx.fillRect(-L, -L * 1.2, L * 2, L * 1.2);
  ctx.restore();
  ctx.lineWidth = Math.max(0.5, L * 0.006);
  ctx.strokeStyle = rgba(pal.deep, 0.35);
  ctx.stroke();
}

/* ------------------------------------------------------------------ Blütenarten */

function makePeony(seed, pal, opt = {}) {
  const r = rng(seed);
  const rings = opt.rings ?? 6;
  const items = [];
  for (let i = 0; i < rings; i++) {
    const t = i / (rings - 1);
    const n = Math.round(lerp(10, 6, t)) + (r() < 0.5 ? 0 : 1);
    const off = r() * TAU;
    for (let j = 0; j < n; j++) {
      const theta = off + ((j + (r() - 0.5) * 0.45) / n) * TAU;
      const front = -Math.cos(theta);
      const light = Math.cos(theta + 0.9) * 0.07 + (r() - 0.5) * 0.12 - t * 0.04;
      const eOpen = lerp(0.12, 1.28, Math.pow(t, 0.7)) + (r() - 0.5) * 0.24;
      items.push({
        kind: 'petal', theta, front,
        len: lerp(1, 0.5, t) * (0.84 + r() * 0.28),
        phi: lerp(1.05, 0.9, t) * (0.82 + r() * 0.3), fold: r() < 0.5 ? -1 : 1, foldK: 0.5 + r() * 0.8,
        r0: lerp(0.08, 0.03, t),
        eOpen, eClosed: 1.32 + (r() - 0.5) * 0.1,
        delay: 0.34 * t + r() * 0.05,
        ruf: lerp(0.07, 0.13, t) * (0.6 + r() * 0.8),
        ph: [r() * TAU, r() * TAU, r() * TAU],
        veins: 5 + ((r() * 4) | 0),
        col: { base: tone(pal.base, light - t * 0.05), mid: tone(pal.mid, light), tip: tone(pal.tip, light * 0.6), edge: pal.edge },
        key: i + front * Math.sin(eOpen) * 0.9,
      });
    }
  }
  items.push({ kind: 'stamens', key: rings - 1 + 0.05 });
  items.sort((a, b) => a.key - b.key);
  const stamens = [];
  for (let k = 0; k < 90; k++) stamens.push({ a: r() * TAU, rho: Math.sqrt(r()), h: 0.4 + r() * 0.9, c: r() });
  stamens.sort((a, b) => Math.sin(a.a) * a.rho - Math.sin(b.a) * b.rho);
  return { type: 'peony', items, stamens, reach: 1.35 };
}

function drawStamens(ctx, D, b, R, tilt, s) {
  const k = easeOut((b - 0.3) / 0.5);
  if (k <= 0.01) return;
  const rad = R * 0.2 * k;
  ctx.save();
  ctx.scale(1, tilt);
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, rad * 1.2);
  g.addColorStop(0, 'rgba(140,72,22,1)');
  g.addColorStop(0.55, 'rgba(200,135,48,1)');
  g.addColorStop(1, 'rgba(215,160,70,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(0, 0, rad * 1.2, 0, TAU);
  ctx.fill();
  ctx.restore();
  const aw = Math.max(0.7, R * 0.015);
  ctx.lineWidth = Math.max(0.4, R * 0.004);
  for (const st of D.stamens) {
    const x = Math.cos(st.a) * st.rho * rad, y = Math.sin(st.a) * st.rho * rad * tilt;
    const h = st.h * R * 0.09 * k;
    const tx = x * 1.35, ty = y * 1.35 - h * (s + 0.3);
    ctx.strokeStyle = 'rgba(238,210,146,0.85)';
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(tx, ty);
    ctx.stroke();
    ctx.fillStyle = st.c < 0.5 ? '#DDA035' : st.c < 0.85 ? '#C47D24' : '#F3C75C';
    ctx.beginPath();
    ctx.ellipse(tx, ty, aw * 1.3, aw * 0.75, st.a, 0, TAU);
    ctx.fill();
  }
}

function drawPeony(ctx, D, b, R, tilt) {
  const s = Math.sqrt(1 - tilt * tilt);
  const g = easeOut(b / 0.5);
  for (const it of D.items) {
    if (it.kind === 'stamens') { drawStamens(ctx, D, b, R, tilt, s); continue; }
    const t = easeInOut((b - it.delay) / 0.62);
    const e = lerp(it.eClosed, it.eOpen, t);
    const L = R * it.len * lerp(0.42, 1, t) * lerp(0.6, 1, g);
    const phi = it.phi * lerp(0.5, 1, t);
    ctx.save();
    petalXform(ctx, it.theta, e, tilt, s, R * it.r0 * t);
    shadeFan(ctx, L, phi, it);
    ctx.restore();
  }
}

function makeLily(seed, pal) {
  const r = rng(seed);
  const off = r() * TAU;
  const items = [];
  for (let k = 0; k < 6; k++) {
    const outer = k % 2 === 0;
    const theta = off + (k / 6) * TAU + (r() - 0.5) * 0.18;
    const front = -Math.cos(theta);
    items.push({
      theta, outer,
      len: (outer ? 0.94 : 1) * (0.9 + r() * 0.15),
      w: outer ? 0.19 : 0.25, curl: (r() - 0.5) * 0.3, wave: outer ? 0.03 : 0.07, ph: r() * TAU,
      eOpen: -0.08 + (r() - 0.5) * 0.3, eClosed: 1.36, delay: (outer ? 0 : 0.08) + r() * 0.04,
      light: Math.cos(theta + 0.9) * 0.06 + (r() - 0.5) * 0.06,
      specks: Array.from({ length: 14 + ((r() * 12) | 0) }, () => [0.1 + r() * 0.45, (r() - 0.5) * 1.4, 0.6 + r() * 0.8]),
      key: (outer ? 0 : 0.5) + front * 0.3,
    });
  }
  items.sort((a, b) => a.key - b.key);
  const stam = [];
  for (let k = 0; k < 6; k++) stam.push({ theta: off + ((k + 0.5) / 6) * TAU + (r() - 0.5) * 0.3, e: 0.55 + r() * 0.35, len: 0.6 + r() * 0.14, bend: (r() - 0.5) * 0.3 });
  stam.sort((a, b) => -Math.cos(a.theta) + Math.cos(b.theta));
  return { type: 'lily', items, stam, reach: 1.3 };
}

function drawLily(ctx, D, b, R, tilt, pal) {
  const s = Math.sqrt(1 - tilt * tilt);
  const g = easeOut(b / 0.45);
  for (const it of D.items) {
    const t = easeInOut((b - it.delay) / 0.7);
    const e = lerp(it.eClosed, it.eOpen, t);
    const L = R * it.len * lerp(0.55, 1, g);
    const w0 = it.w;
    it.w = w0 * lerp(0.75, 1, t);
    ctx.save();
    petalXform(ctx, it.theta, e, tilt, s, R * 0.02);
    shadeTepal(ctx, L, it, pal);
    ctx.restore();
    it.w = w0;
  }
  const k = easeOut((b - 0.4) / 0.5);
  if (k <= 0.01) return;
  // Staubblätter und Griffel
  for (const st of D.stam) {
    const [ax, ay] = dir3(st.theta, st.e, tilt, s);
    const len = R * st.len * k;
    const tx = ax * len, ty = ay * len;
    ctx.strokeStyle = 'rgba(214,226,170,0.95)';
    ctx.lineWidth = Math.max(0.6, R * 0.009);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(tx * 0.5 + ty * st.bend, ty * 0.5 - tx * st.bend, tx, ty);
    ctx.stroke();
    ctx.fillStyle = '#7A2C14';
    ctx.beginPath();
    ctx.ellipse(tx, ty, R * 0.05, R * 0.017, Math.atan2(ty, tx) + Math.PI / 2, 0, TAU);
    ctx.fill();
    ctx.fillStyle = 'rgba(205,98,44,0.75)';
    ctx.beginPath();
    ctx.ellipse(tx - R * 0.006, ty - R * 0.006, R * 0.03, R * 0.008, Math.atan2(ty, tx) + Math.PI / 2, 0, TAU);
    ctx.fill();
  }
  const [px, py] = dir3(0.3, 1.0, tilt, s);
  ctx.strokeStyle = 'rgba(190,206,140,0.95)';
  ctx.lineWidth = Math.max(0.8, R * 0.014);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(px * R * 0.4, py * R * 0.4 + R * 0.05, px * R * 0.72 * k, py * R * 0.72 * k);
  ctx.stroke();
  ctx.fillStyle = '#8FA35A';
  ctx.beginPath();
  ctx.arc(px * R * 0.72 * k, py * R * 0.72 * k, R * 0.028, 0, TAU);
  ctx.fill();
}

// Anthurie: herzförmiges, glänzendes, weinrotes Hochblatt mit Kolben
function makeAnth(seed) {
  const r = rng(seed);
  return { type: 'anth', veins: Array.from({ length: 9 }, (_, i) => ({ a: (i / 8) * 2 - 1, w: 0.8 + r() * 0.4 })), dots: Array.from({ length: 70 }, () => [r(), r()]), reach: 1.35 };
}
function heartPath(ctx, R) {
  // flaches, leicht schiefes Herz mit langer Spitze (kein Valentinsherz)
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.bezierCurveTo(R * 0.22, -R * 0.08, R * 0.66, -R * 0.12, R * 0.8, R * 0.12);
  ctx.bezierCurveTo(R * 0.94, R * 0.42, R * 0.7, R * 0.86, R * 0.3, R * 1.22);
  ctx.quadraticCurveTo(R * 0.14, R * 1.38, R * 0.2, R * 1.62);
  ctx.quadraticCurveTo(-R * 0.04, R * 1.36, -R * 0.24, R * 1.16);
  ctx.bezierCurveTo(-R * 0.6, R * 0.8, -R * 0.82, R * 0.46, -R * 0.72, R * 0.14);
  ctx.bezierCurveTo(-R * 0.62, -R * 0.1, -R * 0.2, -R * 0.08, 0, 0);
  ctx.closePath();
}
function drawAnth(ctx, D, b, R) {
  const t = easeInOut(b / 0.85);
  const pal = PAL.anth;
  ctx.save();
  ctx.transform(0.9, 0.18, -0.34, 0.72, 0, 0); // schräg von der Seite gesehen
  ctx.scale(lerp(0.22, 1, t), lerp(0.55, 1, t));
  heartPath(ctx, R);
  const g = ctx.createRadialGradient(R * 0.3, R * 0.25, R * 0.05, R * 0.05, R * 0.4, R * 1.25);
  g.addColorStop(0, rgba(pal.hi));
  g.addColorStop(0.45, rgba(pal.mid));
  g.addColorStop(1, rgba(pal.lo));
  ctx.fillStyle = g;
  ctx.fill();
  ctx.save();
  ctx.clip();
  for (const v of D.veins) {
    const ex = v.a * R * 0.85, ey = R * (0.2 + (1 - Math.abs(v.a)) * 1.25);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(ex * 0.15, ey * 0.55, ex, ey);
    ctx.strokeStyle = 'rgba(30,2,10,0.35)';
    ctx.lineWidth = R * 0.012 * v.w;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,190,200,0.08)';
    ctx.lineWidth = R * 0.008;
    ctx.translate(R * 0.01, 0);
    ctx.stroke();
    ctx.translate(-R * 0.01, 0);
  }
  // Lackglanz
  ctx.save();
  ctx.translate(-R * 0.32, R * 0.22);
  ctx.rotate(-0.7);
  const hl = ctx.createRadialGradient(0, 0, 0, 0, 0, R * 0.42);
  hl.addColorStop(0, 'rgba(255,225,230,0.32)');
  hl.addColorStop(1, 'rgba(255,225,230,0)');
  ctx.scale(1, 0.28);
  ctx.fillStyle = hl;
  ctx.beginPath();
  ctx.arc(0, 0, R * 0.42, 0, TAU);
  ctx.fill();
  ctx.restore();
  ctx.restore();
  ctx.lineWidth = Math.max(0.6, R * 0.008);
  ctx.strokeStyle = 'rgba(30,2,10,0.5)';
  ctx.stroke();
  ctx.restore();
  // Kolben
  const k = easeOut((b - 0.35) / 0.6);
  if (k <= 0.01) return;
  const N = 16, left = [], right = [];
  const len = R * 0.8 * k;
  for (let i = 0; i <= N; i++) {
    const s = i / N;
    const x = len * 0.55 * s + len * 0.12 * s * s, y = -len * 0.8 * s + len * 0.15 * s * s;
    const w = R * lerp(0.075, 0.022, s);
    const nx = 0.82, ny = 0.57;
    left.push([x - nx * w, y - ny * w]);
    right.push([x + nx * w, y + ny * w]);
  }
  ctx.beginPath();
  smoothClosed(ctx, left.concat(right.reverse()));
  const sg = ctx.createLinearGradient(-R * 0.06, -R * 0.06, R * 0.06, R * 0.06);
  sg.addColorStop(0, rgba(pal.sp1));
  sg.addColorStop(1, rgba(pal.sp2));
  ctx.fillStyle = sg;
  ctx.fill();
  ctx.save();
  ctx.clip();
  ctx.fillStyle = 'rgba(150,100,30,0.35)';
  for (const [u, v] of D.dots) {
    const x = len * 0.55 * u + len * 0.12 * u * u, y = -len * 0.8 * u + len * 0.15 * u * u;
    const w = R * lerp(0.075, 0.022, u) * (v * 2 - 1);
    ctx.beginPath();
    ctx.arc(x + 0.82 * w, y + 0.57 * w, R * 0.008, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
}

// Knospe (spitz, weinrot oder rosa) mit grünen Kelchblättern
function makeBud(seed) { const r = rng(seed); return { type: 'bud', lean: (r() - 0.5) * 0.3, reach: 1.4 }; }
function drawBud(ctx, D, b, R, pal) {
  const t = easeOut(b);
  ctx.save();
  ctx.rotate(D.lean);
  ctx.scale(lerp(0.5, 1, t), lerp(0.5, 1, t));
  ctx.beginPath();
  ctx.moveTo(0, R * 0.1);
  ctx.bezierCurveTo(R * 0.48, -R * 0.1, R * 0.38, -R * 0.75, 0, -R * 1.25);
  ctx.bezierCurveTo(-R * 0.4, -R * 0.75, -R * 0.46, -R * 0.1, 0, R * 0.1);
  const g = ctx.createLinearGradient(0, R * 0.1, 0, -R * 1.2);
  g.addColorStop(0, rgba(pal.base));
  g.addColorStop(0.35, rgba(pal.mid));
  g.addColorStop(1, rgba(pal.tip));
  ctx.fillStyle = g;
  ctx.fill();
  ctx.strokeStyle = 'rgba(40,5,15,0.35)';
  ctx.lineWidth = Math.max(0.5, R * 0.015);
  ctx.stroke();
  ctx.save();
  ctx.clip();
  ctx.strokeStyle = 'rgba(255,230,230,0.18)';
  ctx.lineWidth = R * 0.03;
  ctx.beginPath();
  ctx.moveTo(-R * 0.05, 0);
  ctx.quadraticCurveTo(R * 0.12, -R * 0.6, 0, -R * 1.2);
  ctx.stroke();
  const sh = ctx.createLinearGradient(-R * 0.4, 0, R * 0.4, 0);
  sh.addColorStop(0, 'rgba(255,240,240,0.18)');
  sh.addColorStop(0.5, 'rgba(255,240,240,0)');
  sh.addColorStop(1, 'rgba(30,0,10,0.25)');
  ctx.fillStyle = sh;
  ctx.fillRect(-R, -R * 1.4, R * 2, R * 1.6);
  ctx.restore();
  // Kelchblätter
  for (const sgn of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(0, R * 0.15);
    ctx.quadraticCurveTo(sgn * R * 0.42, -R * 0.05, sgn * R * 0.16, -R * 0.42);
    ctx.quadraticCurveTo(sgn * R * 0.08, -R * 0.08, 0, R * 0.15);
    ctx.fillStyle = '#4E6236';
    ctx.fill();
  }
  ctx.restore();
}

/* ------------------------------------------------------------------ Sprites */

class Flower {
  constructor(spec) {
    this.spec = spec;
    const seed = spec.seed ?? 1;
    if (spec.type === 'peony') this.D = makePeony(seed, spec.pal, spec);
    else if (spec.type === 'lily') this.D = makeLily(seed, spec.pal);
    else if (spec.type === 'anth') this.D = makeAnth(seed);
    else this.D = makeBud(seed);
    this.sprite = null;
  }
  paint(ctx, b) {
    const { R, tilt = 0.82, pal } = this.spec;
    const D = this.D;
    if (D.type === 'peony') drawPeony(ctx, D, b, R, tilt);
    else if (D.type === 'lily') drawLily(ctx, D, b, R, tilt, pal);
    else if (D.type === 'anth') drawAnth(ctx, D, b, R);
    else drawBud(ctx, D, b, R, pal);
  }
  bake(scale) {
    const half = this.spec.R * this.D.reach;
    const px = Math.ceil(half * 2 * scale);
    const c = document.createElement('canvas');
    c.width = c.height = px;
    const x = c.getContext('2d');
    x.scale(scale, scale);
    x.translate(half, half);
    x.rotate(this.spec.face ?? 0);
    this.paint(x, 1);
    this.sprite = c;
    this.half = half;
  }
  draw(ctx, b, scale) {
    if (b <= 0.001 && this.spec.hideClosed) return;
    if (b >= 0.999) {
      if (!this.sprite) this.bake(scale);
      ctx.drawImage(this.sprite, -this.half, -this.half, this.half * 2, this.half * 2);
      return;
    }
    ctx.save();
    ctx.rotate(this.spec.face ?? 0);
    this.paint(ctx, b);
    ctx.restore();
  }
}

/* ------------------------------------------------------------------ Blätter & Schleierkraut */

function drawLeaf(ctx, L, w, curl, open = 1) {
  const pal = PAL.leaf;
  L *= lerp(0.4, 1, open);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.bezierCurveTo(w * L, -L * 0.22, w * L * 0.85, -L * 0.72, curl * L, -L);
  ctx.bezierCurveTo(-w * L * 0.7, -L * 0.7, -w * L * 0.9, -L * 0.2, 0, 0);
  const g = ctx.createLinearGradient(-w * L, 0, w * L, 0);
  g.addColorStop(0, rgba(pal.a));
  g.addColorStop(0.55, rgba(pal.b));
  g.addColorStop(1, rgba(pal.a));
  ctx.fillStyle = g;
  ctx.fill();
  ctx.strokeStyle = rgba(pal.rib, 0.5);
  ctx.lineWidth = Math.max(0.5, L * 0.012);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(curl * L * 0.2, -L * 0.5, curl * L * 0.95, -L * 0.95);
  ctx.stroke();
}

function makeGyp(seed, R) {
  const r = rng(seed);
  const pts = [];
  for (let i = 0; i < 46; i++) {
    const a = -Math.PI / 2 + (r() - 0.5) * 2.4, d = Math.sqrt(r()) * R;
    pts.push([Math.cos(a) * d, Math.sin(a) * d * 0.8, 0.6 + r() * 0.7]);
  }
  return pts;
}
function drawGyp(ctx, pts, R, open) {
  ctx.strokeStyle = 'rgba(110,128,80,0.55)';
  ctx.lineWidth = Math.max(0.4, R * 0.008);
  ctx.beginPath();
  for (const p of pts) { ctx.moveTo(0, R * 0.6); ctx.quadraticCurveTo(p[0] * 0.3, p[1] * 0.4, p[0] * open, p[1] * open); }
  ctx.stroke();
  for (const p of pts) {
    const rr = R * 0.045 * p[2] * open;
    if (rr < 0.3) continue;
    ctx.fillStyle = 'rgba(160,150,140,0.5)';
    ctx.beginPath(); ctx.arc(p[0] * open + rr * 0.2, p[1] * open + rr * 0.3, rr, 0, TAU); ctx.fill();
    ctx.fillStyle = '#FCF8F2';
    ctx.beginPath(); ctx.arc(p[0] * open, p[1] * open, rr, 0, TAU); ctx.fill();
  }
}

/* ------------------------------------------------------------------ einzelne Blütenblätter (fallend, unscharf) */

function petalSprite(L, col, blur, seed) {
  const r = rng(seed);
  const it = { col, ruf: 0.07, ph: [r() * TAU, r() * TAU, r() * TAU], veins: 6 };
  const pad = blur * 2.5 + 4;
  const w = Math.ceil(L * 1.6 + pad * 2), h = Math.ceil(L * 1.15 + pad * 2);
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const x = c.getContext('2d');
  const canFilter = blur > 0 && typeof x.filter === 'string' && (x.filter = 'blur(1px)', x.filter === 'blur(1px)');
  if (blur > 0 && !canFilter) {
    // Fallback: klein malen, groß skalieren = weich
    const f = Math.max(0.08, 4 / blur);
    const t = document.createElement('canvas');
    t.width = Math.ceil(w * f); t.height = Math.ceil(h * f);
    const tx = t.getContext('2d');
    tx.scale(f, f); tx.translate(w / 2, h - pad - L * 0.08);
    shadeFan(tx, L, 0.85, it);
    x.imageSmoothingQuality = 'high';
    x.drawImage(t, 0, 0, w, h);
  } else {
    x.filter = blur > 0 ? `blur(${blur}px)` : 'none';
    x.translate(w / 2, h - pad - L * 0.08);
    shadeFan(x, L, 0.85, it);
  }
  return { c, w, h, ax: w / 2, ay: h - pad - L * 0.08 - L * 0.5 };
}

/* ------------------------------------------------------------------ Garten (eine Szene, 1–2 Canvas) */

export const pointer = { x: -9999, y: -9999, vx: 0, vy: 0, t: 0, inside: false };
if (typeof window !== 'undefined') {
  window.addEventListener('pointermove', (e) => {
    const now = performance.now();
    const dt = Math.max(8, now - pointer.t);
    if (pointer.t) { pointer.vx = lerp(pointer.vx, (e.clientX - pointer.x) / dt, 0.5); pointer.vy = lerp(pointer.vy, (e.clientY - pointer.y) / dt, 0.5); }
    pointer.x = e.clientX; pointer.y = e.clientY; pointer.t = now; pointer.inside = true;
  }, { passive: true });
  document.addEventListener('pointerleave', () => { pointer.inside = false; });
}

export class Garden {
  // canvases: { back?: HTMLCanvasElement, front: HTMLCanvasElement }
  // layout(w, h) → { items: [...], petals?: {...} }
  // progress(): 0..1 wie weit die Szene aufgeblüht ist (Zeit oder Scrollposition)
  constructor({ canvases, layout, progress, still = false, dprMax = 2, maxDelay = 0.35 }) {
    this.cv = canvases;
    this.layout = layout;
    this.progress = progress;
    this.still = still;
    this.dprMax = dprMax;
    this.maxDelay = maxDelay;
    this.visible = true;
    this.items = [];
    this.lastB = -1;
    this.resize();
  }
  resize() {
    const ref = this.cv.front;
    const rect = ref.getBoundingClientRect();
    this.w = Math.max(1, rect.width);
    this.h = Math.max(1, rect.height);
    this.dpr = Math.min(window.devicePixelRatio || 1, this.dprMax);
    for (const c of [this.cv.back, this.cv.front]) {
      if (!c) continue;
      c.width = Math.round(this.w * this.dpr);
      c.height = Math.round(this.h * this.dpr);
    }
    const L = this.layout(this.w, this.h);
    this.items = L.items.map((s, i) => {
      const it = { ...s, a: 0, v: 0, ph: (s.seed ?? i) * 1.7, idle: s.idle ?? 0.025 };
      if (['peony', 'lily', 'anth', 'bud'].includes(s.type)) it.fl = new Flower(s);
      if (s.type === 'gyp') it.gyp = makeGyp(s.seed ?? i, s.R);
      it.flex = s.flex ?? (s.base ? 1 : 0.4);
      return it;
    });
    this.petals = (L.petals || []).map((p, i) => ({ ...p, spr: petalSprite(p.L, p.col, p.blur || 0, 97 + i), ox: 0, oy: 0, vx: 0, vy: 0 }));
    this.lastB = -1;
    this.dirty = true;
  }
  // Blühfortschritt eines Elements (gestaffelt)
  bOf(it, B) { return clamp((B - (it.delay ?? 0)) / (1 - this.maxDelay)); }

  frame(now, dt) {
    // Höchstens ~60 Bilder/s neu malen: auf 144/165-Hz-Bildschirmen sonst 2–3× so viel Grafikarbeit,
    // ohne dass man es sieht (die Seite selbst scrollt trotzdem mit voller Bildrate).
    if (!this.dirty && this.lastDraw && now - this.lastDraw < 15) return;
    dt = this.lastDraw ? now - this.lastDraw : dt;
    this.lastDraw = now;
    const B = this.progress();
    if (this.still && !this.dirty && Math.abs(B - this.lastB) < 0.0005) return;
    this.dirty = false;
    this.lastB = B;
    const rect = this.cv.front.getBoundingClientRect();
    const mx = pointer.x - rect.left, my = pointer.y - rect.top;
    const near = pointer.inside && mx > -200 && my > -200 && mx < this.w + 200 && my < this.h + 200;
    const wind = near ? (mx / this.w - 0.5) : 0;
    const k = Math.min(dt, 50) / 16.7;
    if (!this.still) {
      for (const it of this.items) {
        const hx = it.x, hy = it.y;
        let target = Math.sin(now * 0.0006 * (0.7 + (it.ph % 1)) + it.ph) * it.idle + wind * 0.05 * it.flex;
        if (near) {
          const dx = hx - mx, dy = hy - my, d = Math.hypot(dx, dy), rad = (it.R || 60) * 2.6 + 60;
          if (d < rad) {
            const f = 1 - d / rad;
            target += Math.sign(dx) * f * 0.16 * it.flex;
            it.v += pointer.vx * 0.0045 * f * it.flex * k;
          }
        }
        it.v += (target - it.a) * 0.035 * k;
        it.v *= Math.pow(0.9, k);
        it.a += it.v * k;
      }
    }
    for (const which of ['back', 'front']) {
      const c = this.cv[which];
      if (!c) continue;
      const ctx = c.getContext('2d');
      ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      ctx.clearRect(0, 0, this.w, this.h);
      const list = this.items.filter((it) => (it.layer || 'front') === which);
      // 1) Stiele
      ctx.lineCap = 'round';
      for (const it of list) if (it.base && it.type !== 'leaf') this.stem(ctx, it, B);
      // 2) Blätter und Schleierkraut
      for (const it of list) if (it.type === 'leaf') this.leaf(ctx, it, B);
      for (const it of list) if (it.type === 'gyp') this.gypsophila(ctx, it, B);
      // 3) Blüten
      for (const it of list) if (it.fl) this.head(ctx, it, B);
      if (which === 'front') this.drawPetals(ctx, now, mx, my, near, k, B);
    }
  }
  pivot(it) { return it.base || { x: it.x, y: it.y }; }
  rot(it, x, y) {
    const p = this.pivot(it), c = Math.cos(it.a), s = Math.sin(it.a);
    const dx = x - p.x, dy = y - p.y;
    return [p.x + dx * c - dy * s, p.y + dx * s + dy * c];
  }
  stem(ctx, it, B) {
    const b = this.bOf(it, B);
    const [hx, hy] = this.rot(it, it.x, it.y);
    const p = it.base;
    const bend = it.bend ?? 0.15;
    const cx = lerp(p.x, it.x, 0.5) + (it.y - p.y) * bend, cy = lerp(p.y, it.y, 0.5);
    const [qx, qy] = this.rot(it, cx, cy);
    ctx.strokeStyle = rgba(mix(PAL.stem, [40, 50, 30], it.layer === 'back' ? 0.15 : 0));
    ctx.lineWidth = it.stemW ?? Math.max(1.4, (it.R || 40) * 0.035);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.quadraticCurveTo(qx, qy, hx, hy);
    ctx.stroke();
    // Blätter am Stiel
    if (it.leaves) for (const lf of it.leaves) {
      const t = lf.at;
      const x = (1 - t) * (1 - t) * p.x + 2 * (1 - t) * t * qx + t * t * hx;
      const y = (1 - t) * (1 - t) * p.y + 2 * (1 - t) * t * qy + t * t * hy;
      const tx = 2 * (1 - t) * (qx - p.x) + 2 * t * (hx - qx), ty = 2 * (1 - t) * (qy - p.y) + 2 * t * (hy - qy);
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(Math.atan2(ty, tx) + Math.PI / 2 + lf.ang + it.a * 0.5);
      drawLeaf(ctx, lf.L, lf.w ?? 0.22, lf.curl ?? 0.1, easeOut(b * 1.4));
      ctx.restore();
    }
  }
  leaf(ctx, it, B) {
    const b = this.bOf(it, B);
    ctx.save();
    ctx.translate(it.x, it.y);
    ctx.rotate(it.ang + it.a);
    drawLeaf(ctx, it.L, it.w ?? 0.22, it.curl ?? 0.1, easeOut(b * 1.3));
    ctx.restore();
  }
  gypsophila(ctx, it, B) {
    const b = this.bOf(it, B);
    ctx.save();
    ctx.translate(it.x, it.y);
    ctx.rotate(it.a * 1.4);
    drawGyp(ctx, it.gyp, it.R, lerp(0.3, 1, easeOut(b)));
    ctx.restore();
  }
  head(ctx, it, B) {
    const b = this.bOf(it, B);
    const [hx, hy] = this.rot(it, it.x, it.y);
    ctx.save();
    ctx.translate(hx, hy);
    ctx.rotate((it.rot ?? 0) + it.a * 1.25);
    it.fl.draw(ctx, b, this.dpr * (it.spriteScale ?? 1));
    ctx.restore();
  }
  drawPetals(ctx, now, mx, my, near, k, B) {
    if (!this.petals.length) return;
    const vis = easeOut((B - 0.15) / 0.6);
    if (vis <= 0) return;
    for (const p of this.petals) {
      let x, y, ang;
      if (p.fall && !this.still) {
        // langsam fallendes Blatt, das dem Mauszeiger ausweicht
        p.t = (p.t ?? p.start ?? 0) + 0.00006 * p.speed * k * 16.7;
        const tt = p.t % 1;
        x = p.x * this.w + Math.sin(tt * 6 + p.seed) * 40 + p.ox;
        y = lerp(-0.1, 1.1, tt) * this.h + p.oy;
        if (near) {
          const dx = x - mx, dy = y - my, d = Math.hypot(dx, dy);
          if (d < 140) { p.vx += (dx / (d + 1)) * (1 - d / 140) * 1.4 * k; p.vy += (dy / (d + 1)) * (1 - d / 140) * 1.4 * k; }
        }
        p.vx *= Math.pow(0.93, k); p.vy *= Math.pow(0.93, k);
        p.ox += p.vx * k; p.oy += p.vy * k;
        p.ox *= Math.pow(0.995, k); p.oy *= Math.pow(0.995, k);
        ang = p.ang + tt * p.spin;
      } else {
        // große unscharfe Blätter im Vordergrund: schweben leicht, Parallaxe zur Maus
        const par = near ? (mx / this.w - 0.5) : 0, parY = near ? (my / this.h - 0.5) : 0;
        x = p.x * this.w - par * (p.depth ?? 30) + (this.still ? 0 : Math.sin(now * 0.0004 + p.seed) * 6);
        y = p.y * this.h - parY * (p.depth ?? 30) * 0.6 + (this.still ? 0 : Math.cos(now * 0.00033 + p.seed) * 8);
        ang = p.ang + (this.still ? 0 : Math.sin(now * 0.0003 + p.seed) * 0.03);
      }
      ctx.save();
      ctx.globalAlpha = vis * (p.alpha ?? 1);
      ctx.translate(x, y);
      ctx.rotate(ang);
      if (p.fall && !this.still) {
        const f = Math.cos(now * 0.0009 * p.speed + p.seed);
        ctx.scale(Math.sign(f || 1) * Math.max(0.18, Math.abs(f)), 1);
      }
      ctx.drawImage(p.spr.c, -p.spr.ax, -p.spr.ay);
      ctx.restore();
    }
  }
}

export { PAL as COLORS };
