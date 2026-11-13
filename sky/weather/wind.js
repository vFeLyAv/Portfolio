// Wind (Über mich): ein paar Blütenblätter treiben vorbei und taumeln dabei.
// Dass Leine, Polaroid und Wolken stärker schwingen, regelt main.js über state.wind.

const rnd = (a, b) => a + Math.random() * (b - a);
const COLORS = [['#fff6f8', '#f4b3c0'], ['#fffbe0', '#f6ee5a'], ['#ffffff', '#cfe0ff']];

export function createWind(ctx, state) {
  let petals = [];
  const spawn = (p, first) => {
    p.x = first ? rnd(0, ctx.W) : rnd(-60, -20);
    p.y = rnd(ctx.H * 0.1, ctx.H * 0.85);
    p.vx = rnd(70, 140); p.ph = rnd(0, 6.3); p.rot = rnd(0, 6.3); p.vr = rnd(-2, 2);
    p.s = rnd(5, 9); p.c = COLORS[Math.floor(Math.random() * COLORS.length)];
    return p;
  };
  return {
    resize() { petals = Array.from({ length: state.small ? 3 : 7 }, () => spawn({}, true)); },
    update(dt) {
      const w = state.wind;
      if (w < 0.01 || !dt) return;
      const g = ctx.fgx, n = Math.round(petals.length * w + 0.4);
      for (let i = 0; i < n; i++) {
        const p = petals[i];
        p.x += p.vx * dt * (0.6 + w);
        p.y += Math.sin(state.time * 1.6 + p.ph) * 22 * dt + 6 * dt;
        p.rot += p.vr * dt;
        if (p.x > ctx.W + 40) spawn(p);
        const flip = Math.cos(state.time * 2.4 + p.ph);       // taumeln: Blatt dreht sich um die eigene Achse
        g.save();
        g.translate(p.x, p.y); g.rotate(p.rot); g.scale(1, Math.max(0.15, Math.abs(flip)));
        g.globalAlpha = 0.9 * w;
        const gr = g.createLinearGradient(-p.s, 0, p.s, 0);
        gr.addColorStop(0, p.c[0]); gr.addColorStop(1, p.c[1]);
        g.fillStyle = gr;
        g.beginPath(); g.ellipse(0, 0, p.s, p.s * 0.55, 0, 0, Math.PI * 2); g.fill();
        g.restore();
      }
      g.globalAlpha = 1;
    },
  };
}
