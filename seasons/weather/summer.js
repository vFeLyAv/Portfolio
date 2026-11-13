// Sommer (Projekte): ein paar Pusteblumen-Samen schweben langsam in der warmen Luft nach oben.
// Sie fliegen nur HINTER dem Glas: draußen am Himmel scharf, hinter den Projekten weich verschwommen,
// so bleibt der Text darauf ruhig lesbar.

import { rnd } from './shapes.js';

const FIL = 13;   // Härchen pro Schirm

export function createSummer(ctx, state) {
  let list = [];
  function spawn(p, first) {
    Object.assign(p, {
      x: first ? rnd(0, ctx.W) : rnd(-30, ctx.W * 0.6),
      y: first ? rnd(0, ctx.H) : ctx.H + rnd(10, 40),
      vx: rnd(10, 26), vy: -rnd(8, 20), ph: rnd(0, 6.3), sw: rnd(8, 18),
      s: (state.small ? 0.85 : 1) * rnd(1.1, 1.7), tilt: rnd(-0.3, 0.3),
      len: Array.from({ length: FIL }, () => rnd(7, 9)),
    });
    if (!first && Math.random() < 0.4) { p.x = -20; p.y = rnd(ctx.H * 0.3, ctx.H); }
    return p;
  }
  function draw(g, p, alpha) {
    g.save();
    g.translate(p.x, p.y);
    g.rotate(p.tilt + Math.sin(state.time * 0.7 + p.ph) * 0.3);
    g.scale(p.s, p.s);
    g.globalAlpha = alpha;
    // Same (unten) und Stiel
    g.fillStyle = 'rgba(120,84,40,.85)';
    g.beginPath(); g.ellipse(0, 7, 0.75, 2.1, 0, 0, Math.PI * 2); g.fill();
    g.strokeStyle = 'rgba(255,250,236,.85)'; g.lineWidth = 0.32;
    g.beginPath(); g.moveTo(0, 5); g.lineTo(0, -4); g.stroke();
    // Schirm aus feinen Härchen, leicht gebogen, mit hellen Spitzen
    g.strokeStyle = 'rgba(255,251,240,.78)'; g.lineWidth = 0.28;
    g.beginPath();
    for (let k = 0; k < FIL; k++) {
      const ang = -Math.PI / 2 + (k / (FIL - 1) - 0.5) * 2.5;
      const L = p.len[k], ex = Math.cos(ang) * L, ey = -4 + Math.sin(ang) * L;
      g.moveTo(0, -4);
      g.quadraticCurveTo(ex * 0.45, -4 + Math.sin(ang) * L * 0.6 - 1.2, ex, ey);
    }
    g.stroke();
    g.fillStyle = 'rgba(255,253,245,.95)';
    for (let k = 0; k < FIL; k++) {
      const ang = -Math.PI / 2 + (k / (FIL - 1) - 0.5) * 2.5;
      g.beginPath(); g.arc(Math.cos(ang) * p.len[k], -4 + Math.sin(ang) * p.len[k], 0.42, 0, Math.PI * 2); g.fill();
    }
    g.restore();
  }
  return {
    resize() { list = Array.from({ length: state.small ? 5 : 11 }, () => spawn({}, true)); },
    update(dt) {
      const a = state.summer * state.clear;
      if (a < 0.01 || !dt) return;
      const n = Math.ceil(list.length * Math.min(1, a * 1.4));
      for (let i = 0; i < n; i++) {
        const p = list[i];
        p.x += (p.vx + Math.sin(state.time * 0.5 + p.ph) * p.sw) * dt;
        p.y += (p.vy + Math.cos(state.time * 0.9 + p.ph) * 6) * dt;
        if (p.x > ctx.W + 30 || p.y < -40) spawn(p);
        draw(ctx.bgx, p, a * 0.9);
      }
    },
  };
}
