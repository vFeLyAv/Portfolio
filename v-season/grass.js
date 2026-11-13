// Die Wiese: tausende Grashalme auf einem Canvas, gezeichnet von oben (wie auf dem Poster).
// - Ein fester „Boden“ (viele kurze Halme + Licht/Schatten-Flecken) wird einmal vorgerendert.
// - Darüber ca. 1000–5000 längere Halme, die sich im Wind wiegen.
// - Zeiger/Finger: die Halme biegen sich vom Zeiger weg, schnelle Bewegungen hinterlassen eine Böe.
// - Tiefenunschärfe: eine verkleinerte Kopie liegt oben/unten (per CSS-Maske) über dem scharfen Bild.
// - Beim Scrollen wandert die Wiese langsam mit (Parallaxe, nahtlos wiederholt).

const COLORS = ['#2a4818', '#35581a', '#42681d', '#507a21', '#608a25', '#729b2b', '#88ae33', '#a2c03f', '#bccf52', '#d6e073'];
const TAU = Math.PI * 2;

function mulberry32(a) {
  return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

export function initGrass(canvas, blurCanvas) {
  const ctx = canvas.getContext('2d', { alpha: false });
  const bctx = blurCanvas ? blurCanvas.getContext('2d') : null;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const PAR = 0.32;            // Parallaxe-Faktor beim Scrollen
  const MARGIN = 70;           // Rand oben/unten, damit lange Halme nicht abgeschnitten werden

  let W = 0, H = 0, HW = 0, dpr = 1, tile = null;
  let blades = null;           // Float32Array: x, y, L, a, w, ph  (6 Werte je Halm)
  let buckets = [];            // Halm-Indizes je Farbe (dunkel zuerst)
  let field = null, fcols = 0, frows = 0; const CELL = 48;
  const ptr = { x: -9999, y: -9999, vx: 0, vy: 0, on: 0, target: 0, lastT: 0 };
  let raf = 0, running = false, t0 = performance.now();

  // Lichtfeld: helle Sonnenflecken / dunkle Stellen, nahtlos in y (Periode HW)
  const light = (x, y) => {
    const ky = TAU / HW;
    return 0.5
      + 0.22 * Math.sin(x * 0.0036 + Math.sin(y * ky * 2) * 1.4) * Math.cos(y * ky * 3 + x * 0.0013)
      + 0.16 * Math.sin(x * 0.0105 + 1.3) * Math.sin(y * ky * 7 + 0.7)
      + 0.1 * Math.sin(x * 0.021 + y * ky * 11);
  };

  function build() {
    const rect = canvas.getBoundingClientRect();
    W = Math.max(320, Math.round(rect.width)); H = Math.max(320, Math.round(rect.height));
    HW = H + MARGIN * 2;
    dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    if (blurCanvas) { blurCanvas.width = Math.ceil(W / 4); blurCanvas.height = Math.ceil(H / 4); }
    const small = W < 700;
    const rnd = mulberry32(1234);

    // --- Boden vorrendern ---
    tile = document.createElement('canvas');
    tile.width = Math.round(W * dpr); tile.height = Math.round(HW * dpr);
    const g = tile.getContext('2d');
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.fillStyle = '#365a21'; g.fillRect(0, 0, W, HW);
    const blob = (x, y, r, col) => {
      for (const yy of [y - HW, y, y + HW]) {
        if (yy + r < 0 || yy - r > HW) continue;
        const gr = g.createRadialGradient(x, yy, 0, x, yy, r);
        gr.addColorStop(0, col); gr.addColorStop(1, 'rgba(0,0,0,0)');
        g.fillStyle = gr; g.fillRect(x - r, yy - r, r * 2, r * 2);
      }
    };
    for (let i = 0; i < (W * HW) / 26000; i++) {
      const x = rnd() * W, y = rnd() * HW, l = light(x, y);
      blob(x, y, 60 + rnd() * 160, l > 0.5 ? `rgba(182,214,96,${0.2 + rnd() * 0.2})` : `rgba(14,34,8,${0.16 + rnd() * 0.2})`);
    }
    // viele kurze, feste Halme für die Dichte
    const nStatic = Math.round((W * HW) / (small ? 55 : 70));
    const sb = COLORS.map(() => []);
    for (let i = 0; i < nStatic; i++) {
      const x = rnd() * W, y = rnd() * HW;
      const l = light(x, y);
      const ci = Math.max(0, Math.min(COLORS.length - 2, Math.floor(l * 7 + rnd() * 3.2 - 1.8)));
      sb[ci].push(x, y, (small ? 5 : 7) + rnd() * (small ? 9 : 13), (rnd() - 0.5) * 1.8);
    }
    g.lineCap = 'round';
    sb.forEach((arr, ci) => {
      g.strokeStyle = COLORS[ci]; g.lineWidth = 1.3; g.beginPath();
      for (let k = 0; k < arr.length; k += 4) {
        const x = arr[k], y = arr[k + 1], L = arr[k + 2], a = arr[k + 3];
        for (const yy of [y, y + HW, y - HW]) {
          if (yy < -20 || yy > HW + 20) continue;
          g.moveTo(x, yy); g.quadraticCurveTo(x + Math.sin(a) * L * 0.5 + 1.5, yy - Math.cos(a) * L * 0.5, x + Math.sin(a) * L, yy - Math.cos(a) * L);
        }
      }
      g.stroke();
    });
    // winzige gelbe Blüten wie auf dem Poster
    for (let i = 0; i < (W * HW) / 90000; i++) {
      const x = rnd() * W, y = rnd() * HW;
      if (light(x, y) < 0.55) continue;
      g.fillStyle = rnd() < 0.7 ? 'rgba(236,214,92,.85)' : 'rgba(255,250,235,.8)';
      g.beginPath(); g.arc(x, y, 1.2 + rnd() * 1.4, 0, TAU); g.fill();
    }

    // --- bewegliche Halme ---
    const n = Math.round(Math.min(5200, Math.max(1100, (W * H) / (small ? 300 : 420))));
    blades = new Float32Array(n * 6);
    const tmp = COLORS.map(() => []);
    for (let i = 0; i < n; i++) {
      const x = rnd() * W, y = rnd() * HW;
      const l = light(x, y);
      const ci = Math.max(1, Math.min(COLORS.length - 1, Math.floor(l * 7.5 + rnd() * 3.4 - 1.6)));
      const L = (small ? 13 : 18) + rnd() ** 1.6 * (small ? 22 : 32);
      const o = i * 6;
      blades[o] = x; blades[o + 1] = y; blades[o + 2] = L;
      blades[o + 3] = (rnd() - 0.5) * 1.3;            // Neigung (0 = nach oben)
      blades[o + 4] = (small ? 0.9 : 1.1) + rnd() * 1.3; // halbe Breite am Fuß
      blades[o + 5] = rnd() * TAU;
      tmp[ci].push(i);
    }
    buckets = tmp.map((arr, ci) => ({ color: COLORS[ci], idx: Int32Array.from(arr) }));

    fcols = Math.ceil(W / CELL) + 1; frows = Math.ceil(H / CELL) + 1;
    field = new Float32Array(fcols * frows * 2);
  }

  function draw(now) {
    const t = (now - t0) / 1000;
    const still = reduce.matches;
    const off = ((window.scrollY * PAR) % HW + HW) % HW;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    // Boden (zweimal für die Wiederholung)
    ctx.drawImage(tile, 0, -off - MARGIN, W, HW);
    ctx.drawImage(tile, 0, HW - off - MARGIN, W, HW);

    // Zeigerstärke weich nachführen
    ptr.on += (ptr.target - ptr.on) * 0.12;
    const R = W < 700 ? 110 : 150, R2 = R * R;
    const pOn = still ? 0 : ptr.on;

    // Böenfeld: abklingen lassen
    if (!still) for (let i = 0; i < field.length; i++) field[i] *= 0.93;

    for (const b of buckets) {
      ctx.fillStyle = b.color;
      ctx.beginPath();
      const idx = b.idx;
      for (let k = 0; k < idx.length; k++) {
        const o = idx[k] * 6;
        const x = blades[o];
        let y = blades[o + 1] - off; if (y < 0) y += HW; y -= MARGIN;
        if (y < -10 || y > H + 60) continue;
        const L = blades[o + 2], a = blades[o + 3], w = blades[o + 4], ph = blades[o + 5];
        const sa = Math.sin(a), ca = Math.cos(a);
        const tx0 = x + sa * L, ty0 = y - ca * L;
        let dx = 0, dy = 0;
        if (!still) {
          const sway = Math.sin(t * 1.25 + x * 0.006 + y * 0.003 + ph * 0.35) * 0.7 + Math.sin(t * 0.55 + x * 0.0022 - y * 0.001) * 1.1;
          dx = sway * L * 0.09; dy = Math.abs(sway) * L * 0.02;
          const cx = Math.min(fcols - 1, Math.max(0, (x / CELL) | 0)), cy = Math.min(frows - 1, Math.max(0, (y / CELL) | 0));
          const fi = (cy * fcols + cx) * 2;
          dx += field[fi] * L * 0.045; dy += field[fi + 1] * L * 0.045;
          if (pOn > 0.01) {
            const ex = tx0 - ptr.x, ey = ty0 - ptr.y, d2 = ex * ex + ey * ey;
            if (d2 < R2) {
              const d = Math.sqrt(d2) + 0.001; let f = 1 - d / R; f = f * f * pOn * L * 1.1;
              dx += (ex / d) * f; dy += (ey / d) * f;
            }
          }
          const m2 = dx * dx + dy * dy, lim = L * 0.95;
          if (m2 > lim * lim) { const s = lim / Math.sqrt(m2); dx *= s; dy *= s; }
        }
        const tx = tx0 + dx, ty = ty0 + dy;
        const mx = x + sa * L * 0.5 + dx * 0.35, my = y - ca * L * 0.5 + dy * 0.35;
        const px = ca * w, py = sa * w;
        ctx.moveTo(x - px, y - py);
        ctx.quadraticCurveTo(mx - px * 0.55, my - py * 0.55, tx, ty);
        ctx.quadraticCurveTo(mx + px * 0.55, my + py * 0.55, x + px, y + py);
        ctx.closePath();
      }
      ctx.fill();
    }
    if (bctx) bctx.drawImage(canvas, 0, 0, blurCanvas.width, blurCanvas.height);
  }

  function loop(now) {
    draw(now);
    raf = running ? requestAnimationFrame(loop) : 0;
  }
  function start() {
    if (reduce.matches) { running = false; requestAnimationFrame(draw); return; }
    if (!running) { running = true; raf = requestAnimationFrame(loop); }
  }
  function stop() { running = false; cancelAnimationFrame(raf); raf = 0; }

  // Zeiger: Maus (hover) und Finger (beim Wischen)
  function push(x, y, now) {
    const dt = Math.max(8, now - (ptr.lastT || now - 16));
    const vx = ptr.x > -9000 ? (x - ptr.x) / dt * 16 : 0, vy = ptr.x > -9000 ? (y - ptr.y) / dt * 16 : 0;
    ptr.x = x; ptr.y = y; ptr.lastT = now; ptr.target = 1;
    if (!field) return;
    const sp = Math.min(60, Math.hypot(vx, vy));
    if (sp < 1) return;
    const cx = Math.round(x / CELL), cy = Math.round(y / CELL), rr = 3;
    for (let j = -rr; j <= rr; j++) for (let i = -rr; i <= rr; i++) {
      const X = cx + i, Y = cy + j; if (X < 0 || Y < 0 || X >= fcols || Y >= frows) continue;
      const f = Math.max(0, 1 - Math.hypot(i, j) / (rr + 0.5)) * 0.22;
      const fi = (Y * fcols + X) * 2;
      field[fi] = Math.max(-28, Math.min(28, field[fi] + vx * f));
      field[fi + 1] = Math.max(-28, Math.min(28, field[fi + 1] + vy * f));
    }
  }
  window.addEventListener('pointermove', (e) => { if (e.pointerType === 'mouse') push(e.clientX, e.clientY, performance.now()); }, { passive: true });
  document.documentElement.addEventListener('pointerleave', () => { ptr.target = 0; });
  window.addEventListener('blur', () => { ptr.target = 0; });
  window.addEventListener('touchmove', (e) => { const t = e.touches[0]; if (t) push(t.clientX, t.clientY, performance.now()); }, { passive: true });
  window.addEventListener('touchstart', (e) => { const t = e.touches[0]; if (t) { ptr.x = t.clientX; ptr.y = t.clientY; ptr.lastT = performance.now(); ptr.target = 1; } }, { passive: true });
  window.addEventListener('touchend', () => { ptr.target = 0; }, { passive: true });

  // Größe: nur neu bauen, wenn sich die Breite ändert oder die Höhe deutlich (Adressleiste am Handy)
  let lastW = 0, lastH = 0, rt = 0;
  const onResize = () => {
    clearTimeout(rt);
    rt = setTimeout(() => {
      const r = canvas.getBoundingClientRect();
      if (Math.abs(r.width - lastW) < 2 && Math.abs(r.height - lastH) < 140) return;
      lastW = r.width; lastH = r.height; build(); draw(performance.now());
    }, 150);
  };
  window.addEventListener('resize', onResize);
  window.addEventListener('scroll', () => { if (!running) requestAnimationFrame(draw); }, { passive: true });
  reduce.addEventListener?.('change', () => { stop(); start(); });

  const r0 = canvas.getBoundingClientRect(); lastW = r0.width; lastH = r0.height;
  build(); draw(performance.now()); start();
  return { start, stop };
}
