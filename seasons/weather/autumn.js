// Herbst (Zertifikate): Ahorn- und Buchenblätter fallen und taumeln. In Böen (state.gust) werden sie
// seitwärts mitgerissen und drehen schneller; dieselben Böen lassen in main.js die Zettel an der Leine schwingen.
// Über dem Lebenslauf fällt NIE ein Blatt: sein Bereich wird aus beiden Leinwänden ausgespart.

import { paths, rnd, pick, clipCv } from './shapes.js';

// [Spitze, Ansatz, Rückseite/Stiel] – aus Felix' Vinyl-Palette (Kirsche, Ochsenblut) plus Rost und Bernstein
const CHERRY = ['#e2324f', '#b3142f', '#6e0f22'];
const RUST = ['#e0702e', '#b0441c', '#6e260f'];
const AMBER = ['#f2b446', '#d9822a', '#8f4c14'];
const OXBLOOD = ['#962238', '#5e0f1f', '#3a0a14'];
const GOLD = ['#f5d264', '#e2a63c', '#9c6a1a'];
const MIX = [CHERRY, CHERRY, RUST, RUST, AMBER, AMBER, OXBLOOD, GOLD];

export function createAutumn(ctx, state) {
  const P = paths();
  let list = [];
  function spawn(p, first) {
    const d = p.front ? rnd(0.9, 1.2) : rnd(0.5, 0.72);
    if (first) { p.x = rnd(-20, ctx.W); p.y = rnd(-30, ctx.H); }
    else if (state.gust > 0.4 && Math.random() < 0.6) { p.x = -30; p.y = rnd(-20, ctx.H * 0.6); }  // Böe bringt Blätter von links
    else { p.x = rnd(-ctx.W * 0.2, ctx.W); p.y = -30; }
    Object.assign(p, {
      d, vy: rnd(34, 62), ph: rnd(0, 6.3), sf: rnd(0.8, 1.5), sw: rnd(18, 40),
      rot: rnd(0, 6.3), vr: rnd(-1.1, 1.1), fph: rnd(0, 6.3), fs: rnd(1.2, 2.4),
      s: (state.small ? 0.8 : 1) * rnd(1.35, 1.95) * d, c: pick(MIX), maple: Math.random() < 0.72,
    });
    return p;
  }
  function draw(g, p, alpha) {
    const flip = Math.cos(p.fph);
    const fx = (flip < 0 ? -1 : 1) * Math.max(0.12, Math.abs(flip));
    const front = flip >= 0;
    g.save();
    g.translate(p.x, p.y); g.rotate(p.rot); g.scale(fx * p.s, p.s);
    g.globalAlpha = alpha;
    const shape = p.maple ? P.maple : P.beech;
    // Stiel
    g.strokeStyle = p.c[2]; g.lineWidth = 0.9; g.lineCap = 'round';
    if (!p.maple) g.translate(0, 3);
    g.stroke(P.stem);
    if (!p.maple) g.translate(0, -3);
    // Fläche: Spitze heller, Ansatz satter; Rückseite stumpfer
    const gr = g.createLinearGradient(-4, -10, 4, 6);
    gr.addColorStop(0, front ? p.c[0] : p.c[1]); gr.addColorStop(1, front ? p.c[1] : p.c[2]);
    g.fillStyle = gr; g.fill(shape);
    if (front) {
      g.strokeStyle = 'rgba(255,226,200,.38)'; g.lineWidth = 0.4;
      g.stroke(p.maple ? P.mapleVeins : P.beechVeins);
    }
    g.restore();
  }
  return {
    resize() {
      const n = state.small ? 7 : 16;
      list = Array.from({ length: n }, (_, i) => spawn({ front: i % 7 < 3 }, true));
    },
    update(dt) {
      const a = state.autumn * state.clear;
      if (a < 0.01 || !dt) return;
      const gust = state.gust;
      const n = Math.ceil(list.length * Math.min(1, a * 1.4));
      const cf = clipCv(ctx.fgx, ctx), cb = clipCv(ctx.bgx, ctx);
      for (let i = 0; i < n; i++) {
        const p = list[i];
        const wind = 14 + gust * 260;
        p.x += (wind + Math.sin(state.time * p.sf + p.ph) * p.sw) * p.d * dt;
        p.y += p.vy * p.d * (1 - gust * 0.4) * dt;
        p.rot += (p.vr + Math.cos(state.time * p.sf + p.ph) * 0.5) * (1 + gust * 3) * dt;
        p.fph += p.fs * (1 + gust * 2.2) * dt;
        if (p.y > ctx.H + 40 || p.x > ctx.W + 50) spawn(p);
        draw(p.front ? ctx.fgx : ctx.bgx, p, a * (p.front ? 1 : 0.8));
      }
      if (cf) ctx.fgx.restore();
      if (cb) ctx.bgx.restore();
    },
  };
}
