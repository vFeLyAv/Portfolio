// Frühling (Hero + Über mich): Kirschblüten-Blätter treiben schräg durchs Bild.
// Jedes Blatt taumelt: es dreht sich (rotate) und kippt um die eigene Achse (scaleX läuft durch cos → Rückseite sichtbar).
// Ein Teil fliegt vorne (scharf, größer), ein Teil hinten hinter dem Glas (kleiner, durchs Glas verschwommen).

import { paths, rnd, pick } from './shapes.js';

// [Spitze, Ansatz]: helles Rosa bis Felix' Rosa #F4B3C0
const TONES = [['#fff6f8', '#f4b3c0'], ['#ffffff', '#f8d0d9'], ['#fde4eb', '#ea8ba3']];

export function createSpring(ctx, state) {
  const P = paths();
  let list = [];
  function spawn(p, first) {
    const d = p.front ? rnd(0.85, 1.2) : rnd(0.45, 0.7);
    if (first) { p.x = rnd(-20, ctx.W); p.y = rnd(-20, ctx.H); }
    else if (Math.random() < 0.6) { p.x = rnd(-60, ctx.W * 0.75); p.y = -24; }
    else { p.x = -24; p.y = rnd(-20, ctx.H * 0.65); }
    Object.assign(p, {
      d, vx: rnd(26, 52), vy: rnd(14, 30), ph: rnd(0, 6.3), sw: rnd(10, 26),
      rot: rnd(0, 6.3), vr: rnd(-0.9, 0.9), fph: rnd(0, 6.3), fs: rnd(1.3, 2.5),
      s: (state.small ? 0.85 : 1) * rnd(1.2, 1.7) * d, c: pick(TONES),
    });
    return p;
  }
  function draw(g, p, alpha) {
    const flip = Math.cos(p.fph);
    const fx = (flip < 0 ? -1 : 1) * Math.max(0.14, Math.abs(flip));
    g.save();
    g.translate(p.x, p.y); g.rotate(p.rot); g.scale(fx * p.s, p.s * (0.92 + 0.08 * Math.sin(p.fph * 0.5)));
    g.globalAlpha = alpha;
    const gr = g.createLinearGradient(0, 8, 0, -7);
    gr.addColorStop(0, p.c[1]); gr.addColorStop(1, p.c[0]);
    g.fillStyle = gr; g.fill(P.petal);
    if (flip < 0) { g.fillStyle = 'rgba(160,40,80,.13)'; g.fill(P.petal); }   // Rückseite etwas dunkler
    g.strokeStyle = 'rgba(214,96,128,.32)'; g.lineWidth = 0.4;              // feine Mittelfalte
    g.beginPath(); g.moveTo(0, 7); g.lineTo(0, -3.6); g.stroke();
    g.restore();
  }
  return {
    resize() {
      const n = state.small ? 10 : 26;
      list = Array.from({ length: n }, (_, i) => spawn({ front: i % 5 < 2 }, true));
    },
    update(dt) {
      const a = state.spring * state.clear;   // in der weißen Wolkenwand: keine Blüten davor
      if (a < 0.01 || !dt) return;
      const n = Math.ceil(list.length * Math.min(1, a * 1.4));
      const breeze = 0.75 + 0.5 * Math.sin(state.time * 0.31);           // Wind kommt und geht
      for (let i = 0; i < n; i++) {
        const p = list[i];
        p.x += (p.vx * breeze + Math.sin(state.time * 0.8 + p.ph) * p.sw) * p.d * dt;
        p.y += (p.vy + Math.cos(state.time * 1.1 + p.ph) * 8) * p.d * dt;
        p.rot += p.vr * dt;
        p.fph += p.fs * dt;
        if (p.x > ctx.W + 40 || p.y > ctx.H + 40) spawn(p);
        draw(p.front ? ctx.fgx : ctx.bgx, p, a * (p.front ? 0.95 : 0.75));
      }
    },
  };
}
