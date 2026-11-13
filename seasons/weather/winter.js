// Winter (Kontakt, Nacht): Flocken im kühlen Licht. Sie bleiben auf der Oberkante der Postkarte,
// der Briefmarke und den Knöpfen liegen und bilden kleine Schneekanten. Über dem Lebenslauf schneit es nie.
//
// Zum Anfassen: mit Maus oder Finger über eine Schneekante fahren schiebt den Schnee zur Seite;
// ein Teil fällt als Klumpen herunter und zerbröselt in Flocken. Solange es schneit, wächst die Kante langsam nach.
// Reine Deko auf der Leinwand (pointer-events: none) – kein Fokus, nichts blockiert Klicks.

import { rnd, clipCv } from './shapes.js';

const STEP = 4;          // Breite eines Schnee-Abschnitts in px
const BRUSH = 20;        // Radius der „Hand“ in px
const REGROW = 0.35;     // px pro Sekunde, bis zur Grundhöhe

export function createWinter(ctx, state) {
  let flakes = [];
  const bits = [];       // herunterfallende Klumpen und Krümel
  // Flächen: Oberkante der Postkarte und kleinere Kanten (Briefmarke, Knöpfe); max = höchste Schneekante
  const surfaces = [
    { sel: '#postcard', inset: 26, max: 8, base: 2.6 },
    { sel: '#postcard .stamp-wrap', inset: 3, max: 5, base: 2 },
    { sel: '#postcard .contact__copy', inset: 10, max: 4, base: 1.6 },
    { sel: '#postcard .contact__ig', inset: 12, max: 4, base: 1.6 },
  ].map((s) => ({ ...s, el: document.querySelector(s.sel), cap: [] }));
  const card = document.getElementById('postcard');
  // umgedrehte Karte: die kleinen Kanten (auf der Schreibseite) sind dann verdeckt.
  // Nach einem Sprachwechsel ist die Karte neu geschrieben: Elemente dann neu suchen.
  const rectOf = (sf) => {
    if (!sf.el?.isConnected) sf.el = document.querySelector(sf.sel);
    if (!sf.el) return null;
    const r = sf.el.getBoundingClientRect();
    return sf.sel !== '#postcard' && card?.classList.contains('is-flipped') ? null : r;
  };

  // Zeiger merken (Maus und Finger); nur die letzte Bewegung zählt
  const P = { x: -1e4, y: -1e4, px: -1e4, vx: 0, t: 0 };
  addEventListener('pointermove', (e) => {
    const now = performance.now(), dt = Math.max(8, now - P.t);
    P.vx = (e.clientX - P.x) / dt * 1000;
    P.px = P.x; P.x = e.clientX; P.y = e.clientY; P.t = now;
  }, { passive: true });

  const spawn = (f, first) => {
    f.x = rnd(0, ctx.W); f.y = first ? rnd(0, ctx.H) : rnd(-40, -5);
    f.r = rnd(0.8, 2.6); f.vy = rnd(22, 55) * (0.6 + f.r / 3); f.ph = rnd(0, 6.3); f.sw = rnd(8, 22);
    return f;
  };
  const seed = (sf, len) => Array.from({ length: len }, (_, i) => sf.base * (0.7 + Math.sin(i * 0.35) * 0.15) + Math.random() * sf.base * 0.5);

  // mit dem Zeiger über die Kante fahren: Schnee wegschieben, Klumpen fallen lassen
  function brush(sf, r, dt) {
    if (performance.now() - P.t > 90) return;                 // Zeiger steht still
    const top = r.top + 1;
    if (P.y < top - sf.max - BRUSH || P.y > top + 10) return;
    if (P.x < r.left - BRUSH || P.x > r.right + BRUSH) return;
    const dir = Math.sign(P.vx) || 1, speed = Math.min(1, Math.abs(P.vx) / 900);
    const c = Math.round((P.x - r.left) / STEP), reach = Math.ceil(BRUSH / STEP);
    let fallen = 0;
    for (let d = -reach; d <= reach; d++) {
      const i = c + d;
      if (sf.cap[i] === undefined || sf.cap[i] < 0.05) continue;
      const k = (1 - Math.abs(d) / (reach + 1)) * (0.35 + speed * 0.65);
      const take = sf.cap[i] * k;
      sf.cap[i] -= take;
      // ein Teil wird in Bewegungsrichtung weitergeschoben, der Rest fällt
      const j = i + dir * (2 + Math.round(speed * 3));
      if (sf.cap[j] !== undefined && j > 0 && j < sf.cap.length - 1) { sf.cap[j] = Math.min(sf.max, sf.cap[j] + take * 0.45); fallen += take * 0.55; }
      else fallen += take;                                        // über den Rand: alles fällt
    }
    // Klumpen erzeugen (größer bei mehr Schnee), mit Schwung in Bewegungsrichtung
    while (fallen > 0.6 && bits.length < 90) {
      const sz = Math.min(4.5, 1.2 + fallen * 0.35);
      bits.push({ x: P.x + rnd(-BRUSH * 0.6, BRUSH * 0.6), y: top - rnd(1, sf.max), vx: P.vx * 0.18 + rnd(-30, 30), vy: rnd(-60, -10), r: sz, clump: true, life: rnd(0.35, 0.7) });
      fallen -= sz * 0.9;
    }
  }

  function drawBits(g, dt, s) {
    for (let i = bits.length - 1; i >= 0; i--) {
      const b = bits[i];
      b.vy += (b.clump ? 900 : 380) * dt; b.vx *= 0.985;
      b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt;
      if (b.clump && b.life <= 0) {
        // Klumpen zerbröselt in kleine Flocken
        for (let k = 0; k < 5; k++) bits.push({ x: b.x, y: b.y, vx: b.vx * 0.4 + rnd(-70, 70), vy: b.vy * 0.25 + rnd(-90, -20), r: rnd(0.6, 1.4), clump: false, life: rnd(0.6, 1.2) });
        bits.splice(i, 1); continue;
      }
      if (b.y > ctx.H + 20 || (!b.clump && b.life <= 0)) { bits.splice(i, 1); continue; }
      const a = (b.clump ? 1 : Math.min(1, b.life * 1.6)) * Math.min(1, 0.4 + s);
      g.fillStyle = `rgba(250,247,255,${a.toFixed(3)})`;
      g.beginPath(); g.arc(b.x, b.y, b.r, 0, Math.PI * 2); g.fill();
      if (b.clump) { g.fillStyle = `rgba(200,190,225,${(a * 0.5).toFixed(3)})`; g.beginPath(); g.arc(b.x + b.r * 0.25, b.y + b.r * 0.3, b.r * 0.6, 0, Math.PI * 2); g.fill(); }
    }
  }

  return {
    resize() { flakes = Array.from({ length: state.small ? 70 : 180 }, () => spawn({}, true)); },
    update(dt) {
      const s = state.winter * state.clear;
      const g = ctx.fgx;
      // Schneekanten schmelzen langsam, wenn es nicht mehr schneit
      for (const sf of surfaces) if (s < 0.3) for (let i = 0; i < sf.cap.length; i++) sf.cap[i] *= 0.996;
      if ((s < 0.01 && !bits.length) || !dt) return;
      const rects = surfaces.map(rectOf);
      // es schneit schon eine Weile: beim ersten Mal liegt bereits eine dünne Schicht
      surfaces.forEach((sf, j) => {
        const r = rects[j];
        if (!r) return;
        const len = Math.ceil(r.width / STEP);
        if (sf.cap.length !== len) sf.cap = seed(sf, len);
        // nachwachsen, solange es schneit (nur bis zur Grundhöhe; Flocken legen mehr drauf)
        if (s > 0.3) for (let i = 0; i < len; i++) if (sf.cap[i] < sf.base) sf.cap[i] = Math.min(sf.base, sf.cap[i] + REGROW * dt * s);
        if (r.bottom > 0 && r.top < ctx.H) brush(sf, r, dt);
      });
      const n = Math.round(flakes.length * s);
      const clipped = clipCv(g, ctx);   // erste Flocken fallen schon neben dem Ende des Lebenslaufs, nie darüber
      for (let i = 0; i < n; i++) {
        const f = flakes[i];
        const y0 = f.y;
        f.y += f.vy * dt;
        f.x += Math.sin(state.time * 0.9 + f.ph) * f.sw * dt;
        // landet die Flocke auf einer Oberkante?
        for (let j = 0; j < surfaces.length; j++) {
          const r = rects[j], sf = surfaces[j];
          if (!r) continue;
          if (y0 < r.top && f.y >= r.top && f.x > r.left + sf.inset && f.x < r.right - sf.inset && Math.random() < 0.55) {
            const b = Math.floor((f.x - r.left) / STEP);
            for (let d = -2; d <= 2; d++) if (sf.cap[b + d] !== undefined) sf.cap[b + d] = Math.min(sf.max, sf.cap[b + d] + f.r * (d === 0 ? 0.7 : 0.3));
            spawn(f);
            break;
          }
        }
        if (f.y > ctx.H + 10) spawn(f);
        const gr = g.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.r * 2.2);
        gr.addColorStop(0, `rgba(250,248,255,${(0.95 * Math.min(1, s * 1.3)).toFixed(3)})`);
        gr.addColorStop(1, 'rgba(220,214,240,0)');
        g.fillStyle = gr;
        g.beginPath(); g.arc(f.x, f.y, f.r * 2.2, 0, Math.PI * 2); g.fill();
      }
      if (clipped) g.restore();
      // Schneekanten zeichnen (folgen den Elementen beim Scrollen)
      surfaces.forEach((sf, j) => {
        const r = rects[j];
        if (!r || !sf.cap.length || r.bottom < 0 || r.top > ctx.H) return;
        g.fillStyle = `rgba(255,248,252,${Math.min(1, 0.45 + s).toFixed(3)})`;
        g.beginPath(); g.moveTo(r.left + sf.inset, r.top + 1);
        for (let i = 0; i < sf.cap.length; i++) {
          const x = r.left + i * STEP;
          if (x < r.left + sf.inset || x > r.right - sf.inset) continue;
          const hgt = (sf.cap[i - 1] || 0) * 0.25 + sf.cap[i] * 0.5 + (sf.cap[i + 1] || 0) * 0.25;
          g.lineTo(x, r.top + 1 - hgt);
        }
        g.lineTo(r.right - sf.inset, r.top + 1); g.closePath(); g.fill();
      });
      drawBits(g, dt, s);
    },
  };
}
