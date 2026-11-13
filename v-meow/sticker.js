// Sticker: aus einem freigestellten Foto wird per Canvas ein „Die-cut“-Aufkleber mit dickem, leicht unruhigem weißem Rand.
// Hover: eine Ecke rollt sich hoch (Canvas-Faltung). Ziehen: Sticker wird abgezogen, folgt dem Zeiger und federt zurück.

const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

function loadImage(src) {
  return new Promise((res, rej) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => res(img);
    img.onerror = rej;
    img.src = src;
  });
}

// kleiner deterministischer Zufall, damit der Rand bei jedem Laden gleich aussieht
function rng(seed) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

// Ein echter Die-cut-Sticker hat keine Löcher: alles, was von außen nicht erreichbar ist, wird weiß gefüllt.
function fillHoles(ctx, w, h) {
  const img = ctx.getImageData(0, 0, w, h);
  const a = img.data;
  const out = new Uint8Array(w * h);
  const stack = new Int32Array(w * h);
  let sp = 0;
  const push = (i) => { if (!out[i] && a[i * 4 + 3] < 140) { out[i] = 1; stack[sp++] = i; } };
  for (let x = 0; x < w; x++) { push(x); push((h - 1) * w + x); }
  for (let y = 0; y < h; y++) { push(y * w); push(y * w + w - 1); }
  while (sp) {
    const i = stack[--sp];
    const x = i % w;
    if (x > 0) push(i - 1);
    if (x < w - 1) push(i + 1);
    if (i >= w) push(i - w);
    if (i < w * (h - 1)) push(i + w);
  }
  for (let i = w; i < w * (h - 1); i++) {
    if (out[i] || a[i * 4 + 3] === 255) continue;
    // weiche Außenkante (grenzt an „außen“) bleibt weich, Löcher und deren Ränder werden gefüllt
    if (a[i * 4 + 3] >= 140 && (out[i - 1] || out[i + 1] || out[i - w] || out[i + w])) continue;
    a[i * 4] = 255; a[i * 4 + 1] = 250; a[i * 4 + 2] = 242; a[i * 4 + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  return a;
}

/**
 * Erzeugt die Sticker-Grafiken.
 * opts: { width, border, mask: (ctx, w, h) => void  (Pfad, mit dem die Kanten weich abgerundet werden), seed }
 * Ergebnis: { front, back, w, h, corner: {x,y} }
 */
export async function makeSticker(src, opts = {}) {
  const img = await loadImage(src);
  const W = opts.width || 900;
  const scale = W / img.naturalWidth;
  const iw = Math.round(img.naturalWidth * scale);
  const ih = Math.round(img.naturalHeight * scale);
  const b = opts.border || Math.round(W * 0.03);
  const pad = b * 2 + 6;
  const w = iw + pad * 2, h = ih + pad * 2;

  // 1) Foto (optional mit Maske, damit gerade Bildkanten zu weichen Rundungen werden)
  const photo = document.createElement('canvas');
  photo.width = w; photo.height = h;
  const pc = photo.getContext('2d');
  pc.drawImage(img, pad, pad, iw, ih);
  if (opts.mask) {
    pc.globalCompositeOperation = 'destination-in';
    pc.beginPath();
    opts.mask(pc, iw, ih, pad);
    pc.fill();
    pc.globalCompositeOperation = 'source-over';
  }

  // 2) Silhouette um b Pixel „aufblasen“: Foto ringsum versetzt stempeln, danach weiß einfärben.
  const sil = document.createElement('canvas');
  sil.width = w; sil.height = h;
  const sc = sil.getContext('2d');
  const rand = rng(opts.seed || 7);
  const steps = 96;
  const wob = Array.from({ length: 7 }, () => rand() * Math.PI * 2);
  for (let i = 0; i < steps; i++) {
    const a = (i / steps) * Math.PI * 2;
    // leicht schwankender Radius = handgeschnittener Rand
    const r = b * (0.86 + 0.1 * Math.sin(a * 3 + wob[0]) + 0.06 * Math.sin(a * 7 + wob[1]) + 0.13 * (rand() - 0.5));
    sc.drawImage(photo, Math.cos(a) * r, Math.sin(a) * r);
    sc.drawImage(photo, Math.cos(a) * r * 0.55, Math.sin(a) * r * 0.55);
  }
  sc.globalCompositeOperation = 'source-in';
  sc.fillStyle = '#fffaf2';
  sc.fillRect(0, 0, w, h);
  const data = fillHoles(sc, w, h);

  // 3) Vorderseite = weißer Rand + Foto
  const front = document.createElement('canvas');
  front.width = w; front.height = h;
  const fc = front.getContext('2d');
  fc.drawImage(sil, 0, 0);
  fc.drawImage(photo, 0, 0);

  // 4) Rückseite = Silhouette in hellem Papier-Grau
  const back = document.createElement('canvas');
  back.width = w; back.height = h;
  const bc = back.getContext('2d');
  bc.drawImage(sil, 0, 0);
  bc.globalCompositeOperation = 'source-in';
  bc.fillStyle = '#efe6da';
  bc.fillRect(0, 0, w, h);

  // 5) Ecke zum Abziehen: von unten rechts diagonal Richtung Mitte laufen, bis der Sticker beginnt
  let corner = { x: w * 0.8, y: h * 0.8 };
  const tx = opts.cornerFrom?.[0] ?? 1, ty = opts.cornerFrom?.[1] ?? 1;
  for (let t = 0; t < 1; t += 0.004) {
    const x = Math.round(w * (tx + (0.5 - tx) * t));
    const y = Math.round(h * (ty + (0.5 - ty) * t));
    if (x < 0 || y < 0 || x >= w || y >= h) continue;
    if (data[(y * w + x) * 4 + 3] > 200) { corner = { x, y }; break; }
  }
  return { front, back, w, h, corner };
}

/**
 * Macht aus einem Container einen interaktiven Sticker.
 * el: Element (am besten <button>), in das ein Canvas gesetzt wird.
 */
export function mountSticker(el, art, opts = {}) {
  const cv = document.createElement('canvas');
  cv.width = art.w; cv.height = art.h;
  cv.className = 'sticker-canvas';
  cv.setAttribute('aria-hidden', 'true');
  el.append(cv);
  el.style.setProperty('--ar', `${art.w} / ${art.h}`);
  const ctx = cv.getContext('2d');
  const flap = document.createElement('canvas');
  flap.width = art.w; flap.height = art.h;
  const fx = flap.getContext('2d');

  const C = art.corner;
  // Faltrichtung: von der Ecke zur Mitte
  let ux = art.w / 2 - C.x, uy = art.h / 2 - C.y;
  const ul = Math.hypot(ux, uy); ux /= ul; uy /= ul;
  const diag = Math.hypot(art.w, art.h);

  function draw(fold) {
    ctx.clearRect(0, 0, art.w, art.h);
    if (fold < 1) { ctx.drawImage(art.front, 0, 0); return; }
    const d = fold;
    // Punkt auf der Falzlinie + Linienrichtung
    const px = C.x + ux * d, py = C.y + uy * d;
    const lx = -uy, ly = ux;
    const far = diag * 2;
    // a) bleibender Teil
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(px + lx * far, py + ly * far);
    ctx.lineTo(px - lx * far, py - ly * far);
    ctx.lineTo(px - lx * far + ux * far, py - ly * far + uy * far);
    ctx.lineTo(px + lx * far + ux * far, py + ly * far + uy * far);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(art.front, 0, 0);
    ctx.restore();
    // b) umgeklappte Lasche: Spiegelung an der Falzlinie, Rückseite sichtbar
    fx.clearRect(0, 0, art.w, art.h);
    fx.save();
    const k = C.x * ux + C.y * uy + d;
    fx.transform(1 - 2 * ux * ux, -2 * ux * uy, -2 * ux * uy, 1 - 2 * uy * uy, 2 * k * ux, 2 * k * uy);
    fx.beginPath();
    fx.moveTo(px + lx * far, py + ly * far);
    fx.lineTo(px - lx * far, py - ly * far);
    fx.lineTo(px - lx * far - ux * far, py - ly * far - uy * far);
    fx.lineTo(px + lx * far - ux * far, py + ly * far - uy * far);
    fx.closePath();
    fx.clip();
    fx.drawImage(art.back, 0, 0);
    fx.restore();
    // Schattierung auf der Lasche (dunkler an der Falz)
    fx.save();
    fx.globalCompositeOperation = 'source-atop';
    const g = fx.createLinearGradient(px, py, px + ux * d, py + uy * d);
    g.addColorStop(0, 'rgba(120,70,30,.28)');
    g.addColorStop(0.35, 'rgba(255,255,255,.0)');
    g.addColorStop(1, 'rgba(255,255,255,.55)');
    fx.fillStyle = g;
    fx.fillRect(0, 0, art.w, art.h);
    fx.restore();
    ctx.save();
    ctx.shadowColor = 'rgba(60,20,0,.35)';
    ctx.shadowBlur = 18;
    ctx.shadowOffsetX = -ux * 6;
    ctx.shadowOffsetY = 8;
    ctx.drawImage(flap, 0, 0);
    ctx.restore();
  }

  // Feder-Zustand
  const st = { fold: 0, foldT: 0, fv: 0, x: 0, y: 0, vx: 0, vy: 0, tx: 0, ty: 0, r: 0, vr: 0, tr: 0, s: 1, vs: 0, ts: 1 };
  let dragging = false, hovering = false, raf = 0, start = null;
  const hoverFold = () => diag * (opts.hoverFold || 0.075);
  const dragFold = () => diag * (opts.dragFold || 0.16);

  function scaleRatio() { return art.w / el.getBoundingClientRect().width || 1; }

  function tick() {
    raf = 0;
    const k = 0.14, damp = 0.72; // weiche, aber hüpfende Feder
    st.fv = (st.fv + (st.foldT - st.fold) * k) * damp; st.fold += st.fv;
    if (!dragging) {
      st.vx = (st.vx + (st.tx - st.x) * 0.09) * 0.8; st.x += st.vx;
      st.vy = (st.vy + (st.ty - st.y) * 0.09) * 0.8; st.y += st.vy;
    }
    st.vr = (st.vr + (st.tr - st.r) * 0.1) * 0.78; st.r += st.vr;
    st.vs = (st.vs + (st.ts - st.s) * 0.12) * 0.7; st.s += st.vs;
    el.style.setProperty('--sx', st.x.toFixed(1) + 'px');
    el.style.setProperty('--sy', st.y.toFixed(1) + 'px');
    el.style.setProperty('--sr', st.r.toFixed(2) + 'deg');
    el.style.setProperty('--ss', st.s.toFixed(3));
    draw(Math.max(0, st.fold));
    const moving = Math.abs(st.fv) + Math.abs(st.foldT - st.fold) + Math.abs(st.vx) + Math.abs(st.vy) + Math.abs(st.x - st.tx) + Math.abs(st.y - st.ty) + Math.abs(st.vr) + Math.abs(st.r - st.tr) + Math.abs(st.vs) + Math.abs(st.s - st.ts);
    if (moving > 0.05 || dragging) raf = requestAnimationFrame(tick);
  }
  const kick = () => { if (!raf) raf = requestAnimationFrame(tick); };

  draw(0);
  if (reduced()) {
    // ohne Bewegung: Ecke zeigt beim Hover nur statisch hoch
    el.addEventListener('pointerenter', () => draw(hoverFold()));
    el.addEventListener('pointerleave', () => draw(0));
    el.addEventListener('focus', () => draw(hoverFold()));
    el.addEventListener('blur', () => draw(0));
    return;
  }

  el.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') { hovering = true; st.foldT = hoverFold(); kick(); } });
  el.addEventListener('pointerleave', () => { hovering = false; if (!dragging) { st.foldT = 0; kick(); } });

  el.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    dragging = true;
    start = { px: e.clientX, py: e.clientY, x: st.x, y: st.y, ratio: 1 };
    try { el.setPointerCapture(e.pointerId); } catch { /* synthetische Events */ }
    el.classList.add('is-lifted');
    st.foldT = dragFold(); st.ts = 1.06; st.tr = (opts.liftTilt ?? -4);
    kick();
  });
  el.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const nx = start.x + (e.clientX - start.px);
    const ny = start.y + (e.clientY - start.py);
    st.vx = nx - st.x; st.vy = ny - st.y;
    st.x = nx; st.y = ny;
    st.tr = (opts.liftTilt ?? -4) + Math.max(-10, Math.min(10, st.vx * 0.6));
    if (Math.hypot(e.clientX - start.px, e.clientY - start.py) > 6) el.dataset.moved = '1';
    kick();
  });
  const release = () => {
    if (!dragging) return;
    dragging = false;
    el.classList.remove('is-lifted');
    st.tx = 0; st.ty = 0; st.ts = 1; st.tr = 0;
    st.foldT = hovering ? hoverFold() : 0;
    // „Plopp“ beim Zurückschnappen
    st.vs = -0.05;
    kick();
    setTimeout(() => { delete el.dataset.moved; }, 0);
  };
  el.addEventListener('pointerup', release);
  el.addEventListener('pointercancel', release);
  el.addEventListener('lostpointercapture', release);

  // Tastatur: Enter/Leertaste = einmal kurz anheben und zurückfedern
  el.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    e.preventDefault();
    st.foldT = dragFold(); st.ts = 1.06; st.tr = -4; st.ty = -24; kick();
    setTimeout(() => { st.foldT = 0; st.ts = 1; st.tr = 0; st.ty = 0; st.vs = -0.05; kick(); }, 380);
  });
  el.addEventListener('focus', () => { if (!dragging) { st.foldT = hoverFold(); kick(); } });
  el.addEventListener('blur', () => { if (!dragging && !hovering) { st.foldT = 0; kick(); } });

  // kleiner „Wackler“ von außen (z. B. beim Einblenden)
  return {
    nudge() { st.vs = 0.06; st.vr = 3; kick(); },
  };
}
