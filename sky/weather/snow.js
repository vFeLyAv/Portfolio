// Schnee (Kontakt, Nacht): Flocken im roten Licht. Sie bleiben auf dem Plattenspieler und
// auf der oberen Kante des Kontakt-Glases liegen und bilden eine kleine Schneekante.

const rnd = (a, b) => a + Math.random() * (b - a);
const STEP = 4;   // Breite eines Schnee-Abschnitts in px

export function createSnow(ctx, state) {
  let flakes = [];
  const surfaces = [
    { el: document.querySelector('#player .deck'), inset: 26, cap: [] },
    { el: document.getElementById('contactPanel'), inset: 40, cap: [] },
  ].filter((s) => s.el);
  const spawn = (f, first) => {
    f.x = rnd(0, ctx.W); f.y = first ? rnd(0, ctx.H) : rnd(-40, -5);
    f.r = rnd(0.8, 2.6); f.vy = rnd(22, 55) * (0.6 + f.r / 3); f.ph = rnd(0, 6.3); f.sw = rnd(8, 22);
    return f;
  };
  return {
    resize() { flakes = Array.from({ length: state.small ? 70 : 180 }, () => spawn({}, true)); },
    update(dt) {
      const s = state.snow;
      const g = ctx.fgx;
      // Schneekanten schmelzen langsam, wenn es nicht mehr schneit
      for (const sf of surfaces) if (s < 0.3) for (let i = 0; i < sf.cap.length; i++) sf.cap[i] *= 0.996;
      if (s < 0.01 || !dt) return;
      const rects = surfaces.map((sf) => sf.el.getBoundingClientRect());
      // es schneit schon eine Weile: beim ersten Mal liegt bereits eine dünne Schicht
      surfaces.forEach((sf, j) => {
        const len = Math.ceil(rects[j].width / STEP);
        if (sf.cap.length !== len) sf.cap = Array.from({ length: len }, (_, i) => 1.6 + Math.sin(i * 0.35) * 0.6 + Math.random() * 1.2);
      });
      const n = Math.round(flakes.length * s);
      for (let i = 0; i < n; i++) {
        const f = flakes[i];
        const y0 = f.y;
        f.y += f.vy * dt;
        f.x += Math.sin(state.time * 0.9 + f.ph) * f.sw * dt;
        // landet die Flocke auf einer Oberkante?
        for (let j = 0; j < surfaces.length; j++) {
          const r = rects[j], sf = surfaces[j];
          if (y0 < r.top && f.y >= r.top && f.x > r.left + sf.inset && f.x < r.right - sf.inset && Math.random() < 0.55) {
            const len = Math.ceil(r.width / STEP);
            if (sf.cap.length !== len) sf.cap = new Array(len).fill(0);
            const b = Math.floor((f.x - r.left) / STEP);
            for (let d = -2; d <= 2; d++) if (sf.cap[b + d] !== undefined) sf.cap[b + d] = Math.min(8, sf.cap[b + d] + f.r * (d === 0 ? 0.7 : 0.3));
            spawn(f);
          }
        }
        if (f.y > ctx.H + 10) spawn(f);
        const gr = g.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.r * 2.2);
        gr.addColorStop(0, `rgba(255,240,242,${(0.95 * s).toFixed(3)})`);
        gr.addColorStop(1, 'rgba(255,200,210,0)');
        g.fillStyle = gr;
        g.beginPath(); g.arc(f.x, f.y, f.r * 2.2, 0, Math.PI * 2); g.fill();
      }
      // Schneekanten zeichnen (folgen dem Element beim Scrollen)
      surfaces.forEach((sf, j) => {
        const r = rects[j];
        if (!sf.cap.length || r.bottom < 0 || r.top > ctx.H) return;
        g.fillStyle = `rgba(255,244,246,${Math.min(1, 0.4 + s).toFixed(3)})`;
        g.beginPath(); g.moveTo(r.left + sf.inset, r.top + 1);
        for (let i = 0; i < sf.cap.length; i++) {
          const x = r.left + i * STEP;
          if (x < r.left + sf.inset || x > r.right - sf.inset) continue;
          const hgt = (sf.cap[i - 1] || 0) * 0.25 + sf.cap[i] * 0.5 + (sf.cap[i + 1] || 0) * 0.25;
          g.lineTo(x, r.top + 1 - hgt);
        }
        g.lineTo(r.right - sf.inset, r.top + 1); g.closePath(); g.fill();
      });
    },
  };
}
