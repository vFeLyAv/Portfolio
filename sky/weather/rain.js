// Regen (Projekte): dünne Fäden hinter dem Glas und Wassertropfen AUF dem Glas.
// Die Tropfen sind kleine Elemente mit backdrop-filter: sie zeigen den Inhalt darunter
// heller, kontrastreicher und leicht verschwommen, mit Lichtpunkt oben und dunklem Rand unten
// – so wirkt es wie eine Linse aus Wasser. Ab und zu rinnt ein großer Tropfen hinunter.

const rnd = (a, b) => a + Math.random() * (b - a);

export function createRain(ctx, state) {
  const panel = document.getElementById('projectsPanel');
  /* ---------- Fäden ---------- */
  let streaks = [];
  function makeStreaks() {
    const n = state.small ? 80 : 220;
    streaks = Array.from({ length: n }, () => ({
      x: Math.random() * ctx.W * 1.2, y: Math.random() * ctx.H,
      len: rnd(10, 26), v: rnd(700, 1100), a: rnd(0.18, 0.42),
    }));
  }

  /* ---------- Tropfen auf dem Glas ---------- */
  const box = document.createElement('div');
  box.className = 'wx-drops'; box.setAttribute('aria-hidden', 'true');
  panel.append(box);
  let drops = [], slider = null, nextSlide = 1.5;
  function makeDrop(x, y, size) {
    const el = document.createElement('span');
    el.className = 'wx-drop';
    const d = { el, x, y, size, ry: rnd(0.92, 1.12) };
    el.style.width = `${size}px`; el.style.height = `${size * d.ry}px`;
    el.style.left = `${x}%`; el.style.top = `${y}%`;
    box.append(el);
    return d;
  }
  function seedDrops() {
    box.textContent = ''; drops = [];
    const n = state.small ? 22 : 46;
    for (let i = 0; i < n; i++) {
      const big = Math.random() < 0.3;
      drops.push(makeDrop(rnd(1, 98), rnd(2, 96), big ? rnd(12, 22) : rnd(4, 10)));
    }
  }
  seedDrops();

  function slide(dt) {
    // ein großer Tropfen rinnt in Schlangenlinie nach unten und hinterlässt kleine Perlen
    nextSlide -= dt;
    if (!slider && nextSlide <= 0) {
      const d = drops[Math.floor(Math.random() * drops.length)];
      if (d && d.size > 9 && d.y < 70) { slider = { d, v: 0, trail: 0, wob: Math.random() * 6 }; d.el.classList.add('wx-drop--run'); }
      nextSlide = rnd(1.2, 3.2);
    }
    if (!slider) return;
    const s = slider, h = panel.clientHeight || 1;
    s.v = Math.min(s.v + 140 * dt, 160);                   // px/s, wird schneller
    s.d.y += (s.v * dt / h) * 100;
    s.d.x += Math.sin(state.time * 3 + s.wob) * 0.02;
    s.d.el.style.top = `${s.d.y}%`; s.d.el.style.left = `${s.d.x}%`;
    s.trail += s.v * dt;
    if (s.trail > 22 && drops.length < 90) {                // Perlenspur
      s.trail = 0;
      drops.push(makeDrop(s.d.x + rnd(-0.15, 0.15), s.d.y - 1.2, rnd(2, 3.5)));
    }
    if (s.d.y > 103) {                                      // unten raus: oben neu ansetzen
      s.d.el.classList.remove('wx-drop--run');
      s.d.y = rnd(2, 30); s.d.x = rnd(2, 98);
      s.d.el.style.top = `${s.d.y}%`; s.d.el.style.left = `${s.d.x}%`;
      slider = null;
      if (drops.length > 70) drops.splice(46, 6).forEach((d) => d.el.remove());
    }
  }

  return {
    resize() { makeStreaks(); },
    update(dt) {
      const r = state.rain;
      box.style.opacity = Math.min(1, r * 1.5).toFixed(3);
      box.style.visibility = r < 0.01 ? 'hidden' : '';
      if (r < 0.01 || !dt) return;
      // Fäden (hinten)
      const g = ctx.bgx, n = Math.round(streaks.length * r);
      g.lineWidth = 1; g.lineCap = 'round';
      for (let i = 0; i < n; i++) {
        const p = streaks[i];
        p.y += p.v * dt; p.x -= p.v * dt * 0.16;
        if (p.y - p.len > ctx.H) { p.y = -p.len; p.x = Math.random() * ctx.W * 1.2; }
        g.strokeStyle = `rgba(222,232,255,${(p.a * r).toFixed(3)})`;
        g.beginPath(); g.moveTo(p.x, p.y); g.lineTo(p.x + p.len * 0.16, p.y - p.len); g.stroke();
      }
      if (r > 0.3) slide(dt);
    },
  };
}
