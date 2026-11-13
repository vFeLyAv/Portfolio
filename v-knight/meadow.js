// Malt eine dunkle Blumenwiese auf ein <canvas> (Blätter, Gänseblümchen, rote Blüten, Rosen, kleine Knospen).
// Alles wird per Zufall erzeugt, aber mit festem "seed": gleiche Zahl = gleiches Bild.
// mode: 'full'  = ganze Wiese mit dunklem Grund (Hintergrund im Bild-Rahmen, Füllung der großen Buchstaben)
//       'front' = nur ein Blumenbeet am unteren Rand, durchsichtig (liegt VOR Felix)

function rng(seed) { // kleiner, schneller Zufallsgenerator (mulberry32)
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const LEAF = ['#0d140b', '#121b0e', '#182313', '#1f2c18', '#28371e', '#314224', '#3c4f2b'];
const REDS = ['#9d1c20', '#b3262a', '#c63a2f', '#8a171b'];
const PINK = ['#b65b78', '#c8708a', '#a24766'];
const YELL = ['#d49a2a', '#e0ae3c', '#c9842a'];

export function paintMeadow(canvas, { seed = 7, mode = 'full', flowers = 1, scale = 1 } = {}) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const r = rng(seed);
  const R = (a, b) => a + r() * (b - a);
  const pick = (arr) => arr[Math.floor(r() * arr.length)];
  const s = scale; // Grundgröße der Blätter/Blüten in Canvas-Pixeln
  ctx.clearRect(0, 0, W, H);

  // In 'front' nur unteres Band, sonst die ganze Fläche
  const yTop = mode === 'front' ? H * 0.8 : -20 * s;
  const yIn = (y) => mode !== 'front' || y > yTop + (H - yTop) * 0.15 * r();

  if (mode === 'full') {
    const g = ctx.createRadialGradient(W * 0.5, H * 0.45, 0, W * 0.5, H * 0.5, Math.max(W, H) * 0.75);
    g.addColorStop(0, '#182214');
    g.addColorStop(1, '#070a06');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }

  function leaf(x, y, ang, len, col, alpha) {
    const w = len * R(0.22, 0.34);
    ctx.save();
    ctx.translate(x, y); ctx.rotate(ang);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(len * 0.45, -w, len, 0);
    ctx.quadraticCurveTo(len * 0.45, w, 0, 0);
    ctx.fill();
    // Mittelrippe, etwas heller
    ctx.globalAlpha = alpha * 0.45;
    ctx.strokeStyle = '#5d7140';
    ctx.lineWidth = Math.max(0.6, len * 0.018);
    ctx.beginPath(); ctx.moveTo(len * 0.05, 0); ctx.quadraticCurveTo(len * 0.5, -w * 0.12, len * 0.92, 0); ctx.stroke();
    ctx.restore();
  }

  function blade(x, y, len, col) { // Grashalm
    ctx.save();
    ctx.strokeStyle = col; ctx.globalAlpha = R(0.5, 0.9);
    ctx.lineWidth = R(1.2, 2.6) * s;
    ctx.lineCap = 'round';
    const bend = R(-0.6, 0.6) * len;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + bend * 0.3, y - len * 0.6, x + bend, y - len); ctx.stroke();
    ctx.restore();
  }

  // 1) Blätter in Schichten: hinten dunkel, vorne heller
  const area = (W * (H - Math.max(0, yTop))) / (s * s);
  const layers = mode === 'front' ? [[0.0016, 2, 5], [0.0012, 3, 6]] : [[0.0022, 0, 3], [0.0018, 1, 4], [0.0013, 2, 6], [0.0006, 4, 7]];
  let li = 0;
  for (const [dens, c0, c1] of layers) {
    if (mode === 'full' && li++ === 2) {
      for (let i = 0; i < area * 0.00012; i++) {
        const x = R(0, W), y = R(0, H), rr = R(40, 140) * s;
        const sg = ctx.createRadialGradient(x, y, 0, x, y, rr);
        sg.addColorStop(0, 'rgba(0,0,0,.45)'); sg.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = sg; ctx.fillRect(x - rr, y - rr, rr * 2, rr * 2);
      }
    }
    const n = Math.round(area * dens);
    for (let i = 0; i < n; i++) {
      const x = R(-30, W + 30), y = R(Math.max(yTop, -30), H + 30);
      if (!yIn(y)) continue;
      // Blätter wachsen in kleinen Büscheln
      const k = 1 + Math.floor(r() * 3), base = R(0, Math.PI * 2);
      for (let j = 0; j < k; j++) leaf(x, y, base + R(-0.9, 0.9), R(22, 64) * s, LEAF[Math.floor(R(c0, c1))], R(0.75, 1));
    }
    for (let i = 0; i < n * 0.25; i++) {
      const y = R(Math.max(yTop, 0), H + 20);
      if (yIn(y)) blade(R(0, W), y, R(30, 80) * s, pick(LEAF.slice(2)));
    }
  }

  // 2) Blüten
  function shadow(on) { ctx.shadowColor = on ? 'rgba(0,0,0,.55)' : 'transparent'; ctx.shadowBlur = on ? 10 * s : 0; ctx.shadowOffsetY = on ? 3 * s : 0; }

  function daisy(x, y, rad) {
    const n = 13 + Math.floor(r() * 6), rot = R(0, 6.3);
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
    shadow(true);
    for (let i = 0; i < n; i++) {
      ctx.save(); ctx.rotate((i / n) * Math.PI * 2 + R(-0.06, 0.06));
      const len = rad * R(0.85, 1.05);
      const g = ctx.createLinearGradient(0, 0, len, 0);
      g.addColorStop(0, '#bfb59f'); g.addColorStop(0.35, '#ece5d4'); g.addColorStop(1, '#f6f1e5');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.ellipse(len * 0.55, 0, len * 0.5, rad * 0.13, 0, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
    shadow(false);
    const cg = ctx.createRadialGradient(-rad * 0.08, -rad * 0.08, 0, 0, 0, rad * 0.3);
    cg.addColorStop(0, '#f0c24e'); cg.addColorStop(1, '#b8781d');
    ctx.fillStyle = cg; ctx.beginPath(); ctx.arc(0, 0, rad * 0.27, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(90,50,10,.45)';
    for (let i = 0; i < 14; i++) { const a = R(0, 6.3), d = R(0, rad * 0.22); ctx.beginPath(); ctx.arc(Math.cos(a) * d, Math.sin(a) * d, rad * 0.025, 0, 7); ctx.fill(); }
    ctx.restore();
  }

  function redFlower(x, y, rad, cols = REDS) { // Anemone/Mohn: 5–6 runde Blätter
    const n = 5 + Math.floor(r() * 2), rot = R(0, 6.3), col = pick(cols);
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
    shadow(true);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const px = Math.cos(a) * rad * 0.5, py = Math.sin(a) * rad * 0.5;
      const g = ctx.createRadialGradient(0, 0, rad * 0.1, px, py, rad * 0.62);
      g.addColorStop(0, '#4d0b0e'); g.addColorStop(0.45, col); g.addColorStop(1, col);
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.ellipse(px, py, rad * 0.55, rad * 0.45, a, 0, Math.PI * 2); ctx.fill();
    }
    shadow(false);
    // feine Adern
    ctx.strokeStyle = 'rgba(40,5,8,.35)'; ctx.lineWidth = Math.max(0.6, rad * 0.02);
    for (let i = 0; i < n * 3; i++) { const a = R(0, 6.3); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a) * rad * R(0.5, 0.9), Math.sin(a) * rad * R(0.5, 0.9)); ctx.stroke(); }
    ctx.fillStyle = '#1a0c08'; ctx.beginPath(); ctx.arc(0, 0, rad * 0.16, 0, 7); ctx.fill();
    ctx.fillStyle = '#d7a33a';
    for (let i = 0; i < 10; i++) { const a = (i / 10) * 6.28; ctx.beginPath(); ctx.arc(Math.cos(a) * rad * 0.22, Math.sin(a) * rad * 0.22, rad * 0.035, 0, 7); ctx.fill(); }
    ctx.restore();
  }

  function rose(x, y, rad) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(R(0, 6.3));
    shadow(true);
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, rad);
    g.addColorStop(0, '#5e0f13'); g.addColorStop(0.7, '#9c1d22'); g.addColorStop(1, '#b8312d');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, rad, 0, 7); ctx.fill();
    shadow(false);
    ctx.lineCap = 'round';
    for (let i = 0; i < 9; i++) {
      const rr = rad * (0.95 - i * 0.1), a0 = i * 1.9;
      ctx.strokeStyle = i % 2 ? 'rgba(220,90,80,.55)' : 'rgba(50,5,8,.55)';
      ctx.lineWidth = Math.max(1, rad * 0.07);
      ctx.beginPath(); ctx.arc(rad * 0.04 * i * 0.3, 0, Math.max(1, rr), a0, a0 + 3.4); ctx.stroke();
    }
    ctx.restore();
  }

  function bud(x, y, rad, cols) { // kleine fünfblättrige Blüte
    const col = pick(cols), rot = R(0, 6.3);
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
    shadow(true);
    ctx.fillStyle = col;
    for (let i = 0; i < 5; i++) { const a = (i / 5) * 6.28; ctx.beginPath(); ctx.ellipse(Math.cos(a) * rad * 0.45, Math.sin(a) * rad * 0.45, rad * 0.45, rad * 0.32, a, 0, 7); ctx.fill(); }
    shadow(false);
    ctx.fillStyle = 'rgba(60,30,5,.7)'; ctx.beginPath(); ctx.arc(0, 0, rad * 0.18, 0, 7); ctx.fill();
    ctx.restore();
  }

  function sprinkle(x, y, rad) { // Schleierkraut: Wolke aus winzigen hellen Punkten
    ctx.save();
    for (let i = 0; i < 18; i++) {
      const a = R(0, 6.3), d = R(0, rad);
      ctx.fillStyle = r() < 0.7 ? 'rgba(236,229,212,.9)' : 'rgba(214,190,150,.9)';
      ctx.beginPath(); ctx.arc(x + Math.cos(a) * d, y + Math.sin(a) * d, R(1, 2.4) * s, 0, 7); ctx.fill();
    }
    ctx.restore();
  }

  const nFlowers = Math.round(area * 0.00042 * flowers);
  const kinds = [
    [0.33, (x, y) => daisy(x, y, R(16, 30) * s)],
    [0.27, (x, y) => redFlower(x, y, R(14, 24) * s)],
    [0.03, (x, y) => rose(x, y, R(12, 20) * s)],
    [0.08, (x, y) => redFlower(x, y, R(11, 17) * s, PINK)],
    [0.15, (x, y) => bud(x, y, R(5, 9) * s, YELL)],
    [0.14, (x, y) => sprinkle(x, y, R(10, 22) * s)],
  ];
  for (let i = 0; i < nFlowers; i++) {
    const x = R(0, W), y = R(Math.max(yTop, 0), H);
    if (!yIn(y)) continue;
    let t = r();
    for (const [p, fn] of kinds) { if ((t -= p) <= 0) { fn(x, y); break; } }
    // ein paar Blätter wieder darüber, damit Blüten "in" der Wiese sitzen
    if (r() < 0.35) leaf(x + R(-20, 20) * s, y + R(-10, 20) * s, R(0, 6.3), R(20, 44) * s, pick(LEAF.slice(3)), 0.95);
  }

  // 3) Körnung + Vignette (nur bei der vollen Wiese)
  if (mode === 'full') {
    try {
      const img = ctx.getImageData(0, 0, W, H), d = img.data;
      for (let i = 0; i < d.length; i += 4) { const n = (r() - 0.5) * 22; d[i] += n; d[i + 1] += n; d[i + 2] += n; }
      ctx.putImageData(img, 0, 0);
    } catch { /* egal */ }
    const v = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.max(W, H) * 0.75);
    v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,.6)');
    ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
  }
}

// Eine einzelne Blume, die auf Klick aufblüht (p = 0..1)
export function bloomAt(ctx, x, y, rad, kind, p, seed) {
  const r = rng(seed);
  const e = 1 - Math.pow(1 - p, 3);
  ctx.save();
  ctx.translate(x, y); ctx.rotate(r() * 6.3 + (1 - e) * -1.2); ctx.scale(e, e);
  ctx.shadowColor = 'rgba(0,0,0,.5)'; ctx.shadowBlur = 10; ctx.shadowOffsetY = 3;
  if (kind === 0) { // Gänseblümchen
    const n = 15;
    for (let i = 0; i < n; i++) {
      ctx.save(); ctx.rotate((i / n) * 6.283);
      ctx.fillStyle = '#efe9da';
      ctx.beginPath(); ctx.ellipse(rad * 0.55, 0, rad * 0.5, rad * 0.13, 0, 0, 7); ctx.fill();
      ctx.restore();
    }
    ctx.shadowColor = 'transparent';
    ctx.fillStyle = '#d99a2b'; ctx.beginPath(); ctx.arc(0, 0, rad * 0.27, 0, 7); ctx.fill();
  } else { // rote Blüte
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * 6.283;
      ctx.fillStyle = i % 2 ? '#b3262a' : '#c63a2f';
      ctx.beginPath(); ctx.ellipse(Math.cos(a) * rad * 0.5, Math.sin(a) * rad * 0.5, rad * 0.55, rad * 0.45, a, 0, 7); ctx.fill();
    }
    ctx.shadowColor = 'transparent';
    ctx.fillStyle = '#1a0c08'; ctx.beginPath(); ctx.arc(0, 0, rad * 0.17, 0, 7); ctx.fill();
  }
  ctx.restore();
}
