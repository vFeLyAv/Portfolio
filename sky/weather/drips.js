// Nach dem Regen (Zertifikate, Abendrot): an der Wäscheleine und unter den Klammern bilden sich Tropfen,
// werden schwerer und fallen. Die Leine glänzt nass. Dazu ein schwacher Regenbogen am Himmelsrand.

const rnd = (a, b) => a + Math.random() * (b - a);

export function createDrips(ctx, state) {
  const panel = document.querySelector('.certs');
  const cv = document.createElement('canvas');
  cv.className = 'wx-drips'; cv.setAttribute('aria-hidden', 'true');
  panel.append(cv);
  const g = cv.getContext('2d');
  const bow = document.getElementById('skyBow');
  let srcs = [], w = 0, h = 0, measured = 0;

  // Tropfstellen: unter jeder Klammer und an einigen Punkten der Leine (in Panel-Koordinaten)
  function measure() {
    const pr = panel.getBoundingClientRect();
    w = panel.clientWidth; h = panel.clientHeight;
    cv.width = Math.round(w * ctx.dpr); cv.height = Math.round(h * ctx.dpr);
    srcs = [];
    panel.querySelectorAll('.cert .peg').forEach((peg) => {
      const r = peg.getBoundingClientRect();
      srcs.push(src(r.left + r.width / 2 - pr.left, r.bottom - pr.top - 2, 6.2));
    });
    panel.querySelectorAll('.row__svg').forEach((svg) => {
      const path = svg.querySelector('path'), sr = svg.getBoundingClientRect();
      if (!path || !path.getTotalLength) return;
      const L = path.getTotalLength(), n = state.small ? 3 : 7;
      for (let i = 0; i < n; i++) {
        const pt = path.getPointAtLength(L * (0.06 + 0.88 * Math.random()));
        srcs.push(src(sr.left - pr.left + pt.x, sr.top - pr.top + pt.y + 1, 4.4));
      }
    });
    measured = performance.now();
  }
  const src = (x, y, max) => ({ x, y, max, r: rnd(0, max), grow: rnd(0.6, 1.4), fy: 0, vy: 0, falling: false });

  function drawDrop(x, y, r, stretch) {
    // kleine Wasserkugel: dunkler Rand unten, heller Punkt oben links
    const gr = g.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.1, x, y, r * 1.1);
    gr.addColorStop(0, 'rgba(255,255,255,1)');
    gr.addColorStop(0.3, 'rgba(255,236,244,.55)');
    gr.addColorStop(0.8, 'rgba(150,60,110,.45)');
    gr.addColorStop(1, 'rgba(70,15,50,.85)');
    g.fillStyle = gr;
    g.beginPath(); g.ellipse(x, y, r, r * stretch, 0, 0, Math.PI * 2); g.fill();
  }

  return {
    resize() { measured = 0; },
    update(dt) {
      const k = state.drips;
      panel.style.setProperty('--wet', (k * 0.9).toFixed(3));
      if (bow) bow.style.opacity = (k * 0.6).toFixed(3);
      cv.style.visibility = k < 0.01 ? 'hidden' : '';
      if (k < 0.01 || !dt) return;
      if (!measured || performance.now() - measured > 2500) measure();   // Leine schwingt, Layout kann sich ändern
      g.setTransform(ctx.dpr, 0, 0, ctx.dpr, 0, 0);
      g.clearRect(0, 0, w, h);
      g.globalAlpha = Math.min(1, k * 1.3);
      for (const s of srcs) {
        if (!s.falling) {
          s.r += s.grow * dt * 0.9;
          if (s.r >= s.max) { s.falling = true; s.fy = s.y; s.vy = 0; }
          drawDrop(s.x, s.y + s.r * 0.9, Math.max(0.3, s.r), 1.15);
        } else {
          s.vy += 1100 * dt; s.fy += s.vy * dt;
          drawDrop(s.x, s.fy + s.max, s.max * 0.7, 1.9);
          g.strokeStyle = 'rgba(255,236,244,.35)'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(s.x, s.fy + s.max - s.vy * 0.03); g.lineTo(s.x, s.fy); g.stroke();
          if (s.fy > s.y + 320 || s.fy > h) { s.falling = false; s.r = 0; s.grow = rnd(0.5, 1.3); }
        }
      }
      g.globalAlpha = 1;
    },
  };
}
