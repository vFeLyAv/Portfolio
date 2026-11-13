// X-Ray: Felix als Röntgenbild. Ein Scanner-Streifen zeigt das normale Foto,
// Anker am Körper tragen kurze Fakten wie Labels in einem Datensatz.
import { person, about, school, practice, projects, certificates, languages, interests, contact } from '/shared/data.js';

const $ = (s, el = document) => el.querySelector(s);
const el = (tag, cls, text) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
};
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const pad = (n, l = 4) => String(Math.max(0, Math.round(n))).padStart(l, '0');

const IMG_W = 1214, IMG_H = 1800;

/* ---------------------------------------------------------------- Inhalte */

function renderAbout() {
  const box = $('#aboutText');
  about.forEach((t) => box.append(el('p', null, t)));

  const dl = $('#aboutFacts');
  const row = (k, v, sub) => {
    const d = el('div');
    d.append(el('dt', null, k));
    const dd = el('dd', null, v);
    if (sub) dd.append(el('span', null, sub));
    d.append(dd);
    dl.append(d);
  };
  row('Wohnort', person.city);
  row('Schule', school[0].what, school[0].detail);
  const d = el('div');
  d.append(el('dt', null, 'Sprachen'));
  const dd = el('dd', 'about__langs');
  languages.forEach((l) => { const li = el('span', null, l.lang); li.append(el('i', null, l.level)); dd.append(li); });
  d.append(dd);
  dl.append(d);
}

const PROJECT_META = {
  'Bunprise': { tag: 'bunprise', layout: '' },
  'Diese Website': { tag: 'tiefenkarte', layout: 'proj--tall' },
  'Minecraft-Server': { tag: 'render', layout: 'proj--small' },
};

function renderProjects() {
  const list = $('#projectList');
  projects.forEach((p) => {
    const meta = PROJECT_META[p.title] || { tag: p.title.toLowerCase(), layout: '' };
    const art = el('article', `proj ${meta.layout}`.trim());

    const media = el('div', 'proj__media');
    const frame = el('figure', 'frame');
    const img = el('img');
    img.src = p.img; img.alt = altFor(p); img.loading = 'lazy'; img.decoding = 'async';
    frame.append(img);
    frame.append(el('span', 'frame__corner frame__corner--tl'), el('span', 'frame__corner frame__corner--br'));
    const tag = el('figcaption', 'frame__tag', meta.tag);
    const dims = el('span', 'frame__dims');
    dims.setAttribute('aria-hidden', 'true');
    img.addEventListener('load', () => { dims.textContent = `${img.naturalWidth} × ${img.naturalHeight} px`; }, { once: true });
    const probe = el('span', 'frame__probe');
    probe.setAttribute('aria-hidden', 'true');
    probe.append(el('span', 'frame__x'), el('span', 'frame__y'), el('span', 'frame__val'));
    frame.append(tag, dims, probe);
    media.append(frame);
    attachProbe(frame, img, meta.tag === 'tiefenkarte');

    const body = el('div', 'proj__body');
    const h = el('h3');
    if (p.icon) {
      const ic = el('img'); ic.src = p.icon; ic.alt = ''; ic.width = 44; ic.height = 44; ic.loading = 'lazy';
      h.append(ic);
    }
    h.append(document.createTextNode(p.title));
    body.append(h, el('p', 'proj__when', p.when), el('p', 'proj__text', p.text));

    art.append(media, body);
    list.append(art);
  });
}

function altFor(p) {
  if (p.title === 'Bunprise') return 'Vorschaubild der Web-App Bunprise: ein Hase unter dem Schriftzug „Pläne und Wünsche an einem Ort“.';
  if (p.title === 'Diese Website') return 'Tiefenkarte des Porträtfotos: helle Flächen sind nah, dunkle weit weg.';
  return 'In Blender gerenderte Szene vom Minecraft-Server.';
}

// Fadenkreuz über Projektbildern: zeigt echte Pixelkoordinaten im Originalbild
let depthData = null; // wird beim Hero-Aufbau gefüllt
function attachProbe(frame, img, isDepth) {
  const val = $('.frame__val', frame), x = $('.frame__x', frame), y = $('.frame__y', frame);
  const move = (e) => {
    if (e.pointerType === 'touch') return;
    const r = img.getBoundingClientRect();
    const fr = frame.getBoundingClientRect();
    // object-fit: contain berücksichtigen
    const nw = img.naturalWidth || 1, nh = img.naturalHeight || 1;
    const s = Math.min(r.width / nw, r.height / nh);
    const dw = nw * s, dh = nh * s, ox = r.left + (r.width - dw) / 2, oy = r.top + (r.height - dh) / 2;
    const px = (e.clientX - ox) / s, py = (e.clientY - oy) / s;
    if (px < 0 || py < 0 || px >= nw || py >= nh) { frame.classList.remove('is-probing'); return; }
    frame.classList.add('is-probing');
    const lx = e.clientX - fr.left, ly = e.clientY - fr.top;
    x.style.transform = `translateY(${ly}px)`;
    y.style.transform = `translateX(${lx}px)`;
    let text = `x ${pad(px)}  y ${pad(py)}`;
    if (isDepth && depthData) {
      const dx = Math.min(depthData.w - 1, Math.floor(px * depthData.w / nw));
      const dy = Math.min(depthData.h - 1, Math.floor(py * depthData.h / nh));
      text += `  tiefe ${(depthData.px[dy * depthData.w + dx] / 255).toFixed(2)}`;
    }
    val.textContent = text;
    const flip = lx > fr.width - 190;
    val.style.transform = `translate(${flip ? lx - val.offsetWidth - 8 : lx + 8}px, ${ly > 30 ? ly - 26 : ly + 8}px)`;
  };
  frame.addEventListener('pointermove', move);
  frame.addEventListener('pointerleave', () => frame.classList.remove('is-probing'));
}

function renderCerts() {
  const ul = $('#certList');
  certificates.forEach((c) => {
    const li = el('li', 'cert');
    const box = el('span', 'cert__box'); box.setAttribute('aria-hidden', 'true');
    const t = el('span', 'cert__title', c.title);
    t.append(el('span', 'cert__issuer', c.issuer));
    const st = el('span', 'cert__status', c.status === 'erhalten' ? 'erhalten' : 'in Arbeit');
    const a = el('a', 'cert__link', 'Zum Kurs');
    a.href = c.url; a.target = '_blank'; a.rel = 'noopener';
    a.setAttribute('aria-label', `Zum Kurs: ${c.title} (öffnet neuen Tab)`);
    li.append(box, t, st, a);
    ul.append(li);
  });
}

function table(caption, rows, cols = ['Zeitraum', 'Station'], plain = false) {
  const block = el('div', 'cv__block');
  block.append(el('h3', null, caption));
  const tbl = el('table');
  const head = el('thead');
  head.innerHTML = `<tr><th scope="col" class="sr-only">${cols[0]}</th><th scope="col" class="sr-only">${cols[1]}</th></tr>`;
  tbl.append(head);
  const tb = el('tbody');
  rows.forEach(([k, main, sub]) => {
    const tr = el('tr');
    const th = el('th', null, k); th.scope = 'row';
    const td = el('td');
    td.append(el(plain ? 'span' : 'strong', plain ? 'cv__plain' : null, main));
    if (sub) td.append(el('span', null, sub));
    tr.append(th, td);
    tb.append(tr);
  });
  tbl.append(tb);
  block.append(tbl);
  return block;
}

function renderCV() {
  const cv = $('#cv');
  // Neueste Station zuerst (deutsche Konvention); data.js ist bereits so sortiert.
  cv.append(table('Schulbildung', school.map((s) => [s.when, s.what, s.detail])));
  cv.append(table('Praktische Erfahrung', practice.map((s) => [s.when, s.what, s.detail])));
  cv.append(table('Sprachen', languages.map((l) => [l.lang, l.level]), ['Sprache', 'Niveau'], true));
  cv.append(table('Interessen', interests.map((i) => [i.what, i.detail]), ['Interesse', 'Details'], true));
}

function renderContact() {
  if (contact.email) {
    const span = $('.contact__mail');
    const a = el('a', 'contact__mail', contact.email);
    a.href = `mailto:${contact.email}`;
    span.replaceWith(a);
  }
  $('#footName').textContent = `${person.name}, ${person.city}`;
  $('#footPlace').textContent = `Foto: ${person.photoCaption}`;
}

/* ---------------------------------------------------------------- Toast, Menü */

let toastTimer;
function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('is-on');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('is-on'), 2600);
}
document.addEventListener('click', (e) => {
  if (e.target.closest('[data-pdf]')) toast('Das PDF folgt.');
});

const menuBtn = $('#menuBtn'), nav = $('#nav');
menuBtn.addEventListener('click', () => {
  const open = !nav.classList.contains('is-open');
  nav.classList.toggle('is-open', open);
  menuBtn.setAttribute('aria-expanded', String(open));
});
nav.addEventListener('click', (e) => {
  if (e.target.closest('a')) { nav.classList.remove('is-open'); menuBtn.setAttribute('aria-expanded', 'false'); }
});

/* ---------------------------------------------------------------- Hero */

// Anker in Pixeln des Originalbilds (1214 × 1800). Offsets = wohin das Label rückt (auch in Bildpixeln).
const ANCHORS = [
  { id: 'kopf', x: 600, y: 545, side: 'r', dx: 300, dy: -60,
    title: interests[1].what, detail: interests[1].detail },
  { id: 'auge', x: 478, y: 716, side: 'l', dx: -330, dy: 10,
    title: interests[2].what, detail: interests[2].detail.replace(/^Hobby:\s*/, '') },
  { id: 'mund', x: 512, y: 832, side: 'l', dx: -300, dy: 250,
    title: 'Sprachen', detail: languages.map((l) => l.lang).join(', ') },
  { id: 'arm', x: 860, y: 1420, side: 'r', dx: 210, dy: -60,
    title: interests[0].what, detail: interests[0].detail },
];

const hero = $('.hero');
const canvas = $('#scan');
const ctx = canvas.getContext('2d');
const svg = $('#lines');
const marksLayer = $('#marks');
const readout = $('#readout');
const first = $('#first');

const S = {
  W: 0, H: 0, dpr: 1,
  bx: 0, by: 0, bw: 0, bh: 0,   // gerenderte Bildbox
  band: 200,                     // Breite des Scan-Streifens
  x: -9999, target: 0,           // Mitte des Streifens (aktuell / Ziel)
  lastInput: 0, mode: 'intro',
  visible: true, dirty: true,
  narrow: false,
  pinned: null, hover: null, focus: null,
};

let photo, xray;

function loadImage(src) {
  return new Promise((res, rej) => {
    const i = new Image();
    i.decoding = 'async';
    i.onload = () => res(i);
    i.onerror = () => rej(new Error(`Bild fehlt: ${src}`));
    i.src = src;
  });
}

// Röntgen-Version des Fotos einmalig berechnen: Helligkeit invertieren, Tiefe als Dichte,
// Kanten (aus dem Alphakanal) leuchten wie bei einer echten Aufnahme.
function buildXray(img, depth) {
  const k = 0.75;
  const w = Math.round(IMG_W * k), h = Math.round(IMG_H * k);
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d', { willReadFrequently: true });
  g.drawImage(depth, 0, 0, w, h);
  const dpx = g.getImageData(0, 0, w, h).data;
  const dep = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) dep[i] = dpx[i * 4];
  depthData = { w, h, px: dep };

  g.clearRect(0, 0, w, h);
  g.drawImage(img, 0, 0, w, h);
  const id = g.getImageData(0, 0, w, h);
  const p = id.data;

  // Alpha weichzeichnen (Box-Blur, horizontal + vertikal) für den Kantenglanz
  const a = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) a[i] = p[i * 4 + 3] / 255;
  const blur = boxBlur(boxBlur(a, w, h, 9), w, h, 9);

  const stops = [
    [0.00, [14, 38, 48]],
    [0.45, [62, 128, 148]],
    [0.78, [176, 232, 248]],
    [1.00, [250, 254, 255]],
  ];
  const ramp = new Uint8ClampedArray(256 * 3);
  for (let i = 0; i < 256; i++) {
    const t = i / 255;
    let j = 0; while (j < stops.length - 2 && t > stops[j + 1][0]) j++;
    const [t0, c0] = stops[j], [t1, c1] = stops[j + 1];
    const f = Math.min(1, Math.max(0, (t - t0) / (t1 - t0)));
    for (let ch = 0; ch < 3; ch++) ramp[i * 3 + ch] = c0[ch] + (c1[ch] - c0[ch]) * f;
  }

  for (let i = 0; i < w * h; i++) {
    const al = a[i];
    if (al <= 0.002) { p[i * 4 + 3] = 0; continue; }
    const o = i * 4;
    const L = (0.299 * p[o] + 0.587 * p[o + 1] + 0.114 * p[o + 2]) / 255;
    const inv = 1 - L;
    const d = dep[i] / 255;
    const rim = Math.min(1, Math.max(0, (al - blur[i]) * 3.2));
    let v = 0.06 + Math.pow(inv, 2.4) * 0.62 + d * 0.22 + rim * 0.55;
    v = Math.min(1, Math.max(0, v));
    const r = (v * 255) | 0;
    p[o] = ramp[r * 3]; p[o + 1] = ramp[r * 3 + 1]; p[o + 2] = ramp[r * 3 + 2];
    p[o + 3] = Math.min(255, al * (0.68 + v * 0.5) * 255);
  }
  g.putImageData(id, 0, 0);
  return c;
}

function boxBlur(src, w, h, r) {
  const tmp = new Float32Array(w * h), out = new Float32Array(w * h);
  const n = 2 * r + 1;
  for (let y = 0; y < h; y++) {
    let s = 0; const row = y * w;
    for (let x = -r; x <= r; x++) s += src[row + Math.min(w - 1, Math.max(0, x))];
    for (let x = 0; x < w; x++) {
      tmp[row + x] = s / n;
      s += src[row + Math.min(w - 1, x + r + 1)] - src[row + Math.max(0, x - r)];
    }
  }
  for (let x = 0; x < w; x++) {
    let s = 0;
    for (let y = -r; y <= r; y++) s += tmp[Math.min(h - 1, Math.max(0, y)) * w + x];
    for (let y = 0; y < h; y++) {
      out[y * w + x] = s / n;
      s += tmp[Math.min(h - 1, y + r + 1) * w + x] - tmp[Math.max(0, y - r) * w + x];
    }
  }
  return out;
}

/* Anker + Labels im DOM */
const notes = ANCHORS.map((A) => {
  const btn = el('button', 'mark');
  btn.type = 'button';
  btn.setAttribute('aria-label', `Anmerkung ${A.id}: ${A.title}`);
  btn.setAttribute('aria-describedby', `note-${A.id}`);
  btn.dataset.id = A.id;
  marksLayer.append(btn);

  const note = el('div', 'note');
  note.id = `note-${A.id}`;
  note.setAttribute('role', 'tooltip');
  note.append(el('span', 'note__tag', A.id));
  note.append(el('b', null, A.title));
  note.append(el('span', 'note__detail', A.detail));
  note.append(el('span', 'note__xy', `x ${pad(A.x)}  y ${pad(A.y)}`));
  hero.append(note);

  const ns = 'http://www.w3.org/2000/svg';
  const line = document.createElementNS(ns, 'line');
  const dot = document.createElementNS(ns, 'circle'); dot.setAttribute('r', '2.5');
  svg.append(line, dot);

  btn.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') { S.hover = A.id; S.dirty = true; } });
  btn.addEventListener('pointerleave', () => { if (S.hover === A.id) { S.hover = null; S.dirty = true; } });
  btn.addEventListener('focus', () => { S.focus = A.id; S.dirty = true; });
  btn.addEventListener('blur', () => { if (S.focus === A.id) { S.focus = null; S.dirty = true; } });
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    S.pinned = S.pinned === A.id ? null : A.id;
    S.dirty = true;
  });
  return { A, btn, note, line, dot, ax: 0, ay: 0, on: false };
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && (S.pinned || S.focus)) {
    S.pinned = null; S.dirty = true;
    if (document.activeElement?.classList.contains('mark')) document.activeElement.blur();
  }
});

function layout() {
  const r = hero.getBoundingClientRect();
  S.W = r.width; S.H = r.height;
  S.narrow = S.W < 900;
  S.dpr = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = Math.round(S.W * S.dpr);
  canvas.height = Math.round(S.H * S.dpr);
  svg.setAttribute('viewBox', `0 0 ${S.W} ${S.H}`);

  // Bildbox: so groß, dass der Kopf oben im Bild sitzt und die Hüfte unten abschneidet
  S.bh = S.H * (S.narrow ? 1.08 : 1.18);
  S.bw = S.bh * IMG_W / IMG_H;
  S.by = S.H - S.bh;
  S.bx = S.W * 0.5 - (S.narrow ? 0.45 : 0.46) * S.bw;
  S.band = S.narrow ? Math.max(120, S.W * 0.34) : Math.min(320, Math.max(170, S.bw * 0.28));

  fitName();
  placeNotes();
  S.dirty = true;
}

// "Feliks" so groß setzen, dass es fast die ganze Breite füllt
function fitName() {
  first.style.fontSize = '100px';
  const w = first.getBoundingClientRect().width;
  let size = (S.W * (S.narrow ? 0.96 : 0.92)) / w * 100;
  size = Math.min(size, S.H * 0.62);
  first.style.fontSize = `${size}px`;
  first.style.top = `${S.H * (S.narrow ? 0.17 : 0.14)}px`;
}

const toScreen = (ix, iy) => [S.bx + ix * S.bw / IMG_W, S.by + iy * S.bh / IMG_H];

function placeNotes() {
  const s = S.bw / IMG_W;
  const topSafe = 78;
  notes.forEach((n) => {
    const [ax, ay] = toScreen(n.A.x, n.A.y);
    n.ax = ax; n.ay = ay;
    n.btn.style.transform = `translate(${ax}px, ${ay}px)`;
    const nw = n.note.offsetWidth || 240, nh = n.note.offsetHeight || 90;
    let lx, ly, px, py; // Label-Position (oben links) und Andockpunkt der Linie
    if (S.narrow) {
      // Handy: alle Labels im gleichen Fach unten, Linie führt zum Anker
      lx = 16; ly = S.H * 0.6;
      ly = Math.min(ly, S.H - nh - 150);
      px = lx + 14; py = ly - 18;
    } else {
      const tx = ax + n.A.dx * s, ty = ay + n.A.dy * s;
      lx = n.A.side === 'r' ? tx : tx - nw;
      ly = ty;
      lx = Math.max(16, Math.min(S.W - nw - 16, lx));
      ly = Math.max(topSafe + 22, Math.min(S.H - nh - 140, ly));
      px = n.A.side === 'r' ? lx : lx + nw;
      py = ly - 1;
    }
    n.note.style.transform = '';
    n.note.style.left = `${lx}px`;
    n.note.style.top = `${ly}px`;
    n.line.setAttribute('x1', ax); n.line.setAttribute('y1', ay);
    n.line.setAttribute('x2', px); n.line.setAttribute('y2', py);
    n.dot.setAttribute('cx', px); n.dot.setAttribute('cy', py);
  });
}

function updateNotes() {
  const half = S.band / 2;
  const single = S.pinned || S.focus || S.hover;
  notes.forEach((n) => {
    let on;
    if (S.narrow) on = S.pinned === n.A.id || S.focus === n.A.id;
    else on = single ? (n.A.id === S.pinned || n.A.id === S.focus || n.A.id === S.hover)
                     : Math.abs(n.ax - S.x) < half && S.mode !== 'intro-hidden';
    if (on !== n.on) {
      n.on = on;
      n.note.classList.toggle('is-on', on);
      n.btn.classList.toggle('is-on', on);
      n.line.classList.toggle('is-on', on);
      n.dot.classList.toggle('is-on', on);
      n.btn.setAttribute('aria-expanded', String(on));
    }
  });
}

function draw() {
  const { dpr, W, H, bx, by, bw, bh } = S;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, W, H);
  ctx.drawImage(xray, bx, by, bw, bh);

  const l = S.x - S.band / 2, r = S.x + S.band / 2;
  ctx.save();
  ctx.beginPath(); ctx.rect(l, 0, S.band, H); ctx.clip();
  ctx.fillStyle = 'rgba(191, 239, 255, 0.045)';
  ctx.fillRect(l, 0, S.band, H);
  ctx.drawImage(photo, bx, by, bw, bh);
  ctx.restore();

  // Kanten des Streifens mit Lineal-Strichen
  ctx.strokeStyle = 'rgba(191, 239, 255, 0.75)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(Math.round(l) + 0.5, 0); ctx.lineTo(Math.round(l) + 0.5, H);
  ctx.moveTo(Math.round(r) - 0.5, 0); ctx.lineTo(Math.round(r) - 0.5, H);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(191, 239, 255, 0.45)';
  ctx.beginPath();
  // Striche bleiben am Bild fest (wie ein Maßstab), nicht am Streifen
  const step = bh / 60;
  for (let i = 0, y = by; y < H; i++, y += step) {
    if (y < 0) continue;
    const len = i % 5 === 0 ? 9 : 4;
    ctx.moveTo(Math.round(l), Math.round(y) + 0.5); ctx.lineTo(Math.round(l) + len, Math.round(y) + 0.5);
    ctx.moveTo(Math.round(r), Math.round(y) + 0.5); ctx.lineTo(Math.round(r) - len, Math.round(y) + 0.5);
  }
  ctx.stroke();

  // Anzeige unten rechts: Position des Scanners im Originalbild
  const ix = (S.x - bx) / bw * IMG_W;
  const inside = ix > 0 && ix < IMG_W;
  readout.innerHTML = `scan <b>x ${inside ? pad(ix) : '----'}</b> / ${IMG_W}<br>person.webp`;

  // Name hinten bewegt sich minimal gegen den Scanner (Tiefe)
  const off = (S.x - W / 2) * -0.018;
  first.style.transform = `translateX(${off.toFixed(1)}px)`;
}

const personCenter = () => S.bx + 0.445 * S.bw;

function tick(t) {
  requestAnimationFrame(tick);
  if (!S.visible || !xray) return;

  if (S.mode === 'idle' && !reduced.matches && t - S.lastInput > 3500) {
    S.target = personCenter() + Math.sin((t - S.lastInput) / 2600) * S.bw * 0.3;
  }
  const prev = S.x;
  if (S.mode === 'intro') introStep(t);
  else if (reduced.matches) S.x = S.target;
  else S.x += (S.target - S.x) * 0.14;

  if (Math.abs(S.x - prev) > 0.05 || S.dirty) {
    draw();
    updateNotes();
    S.dirty = false;
  }
}

function setTargetFromEvent(e) {
  const r = hero.getBoundingClientRect();
  S.target = e.clientX - r.left;
  S.lastInput = performance.now();
  if (S.mode === 'intro') endIntro();
}

// Einmaliger Durchlauf beim Laden: der Scanner fährt einmal über Felix und kommt am Kopf zur Ruhe
const intro = { t0: 0, a: 0, b: 0, c: 0 };
const easeInOut = (p) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);
function introStep(t) {
  if (!intro.t0) intro.t0 = t;
  const e = t - intro.t0, d1 = 1700, d2 = 1100;
  if (e < d1) S.x = intro.a + (intro.b - intro.a) * easeInOut(e / d1);
  else if (e < d1 + d2) S.x = intro.b + (intro.c - intro.b) * easeInOut((e - d1) / d2);
  else { S.x = S.target = intro.c; endIntro(); }
}
function endIntro() {
  S.mode = 'idle';
  S.lastInput = performance.now();
}

function bindPointer() {
  let dragging = false;
  hero.addEventListener('pointermove', (e) => {
    if (e.pointerType === 'mouse' || dragging) setTargetFromEvent(e);
  });
  hero.addEventListener('pointerdown', (e) => {
    if (e.target.closest('.mark')) return;
    dragging = true;
    setTargetFromEvent(e);
    if (e.pointerType !== 'mouse' && S.narrow && S.pinned) { S.pinned = null; S.dirty = true; }
  });
  const stop = () => { dragging = false; S.lastInput = performance.now(); };
  hero.addEventListener('pointerup', stop);
  hero.addEventListener('pointercancel', stop);
  hero.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') S.lastInput = performance.now(); });
  // Tastatur: Pfeile verschieben den Scanner, wenn ein Anker fokussiert ist
  marksLayer.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    e.preventDefault();
    if (S.mode === 'intro') endIntro();
    S.target = Math.max(0, Math.min(S.W, S.target + (e.key === 'ArrowLeft' ? -40 : 40)));
    S.lastInput = performance.now();
  });
}

async function initHero() {
  layout();
  try {
    const [img, depth] = await Promise.all([loadImage('/img/person.webp'), loadImage('/img/depth.png')]);
    photo = img;
    xray = buildXray(img, depth);
  } catch (err) {
    console.warn(err);
    return;
  }
  hero.classList.add('is-ready');
  layout();

  const head = toScreen(560, 700)[0];
  if (reduced.matches) {
    S.x = S.target = head;
    S.mode = 'idle';
    S.lastInput = performance.now();
  } else {
    intro.a = S.x = S.bx - S.band;
    intro.b = S.bx + S.bw * 0.86;
    intro.c = S.target = head;
  }
  S.dirty = true;
  requestAnimationFrame(tick);
}

new IntersectionObserver(([entry]) => { S.visible = entry.isIntersecting; if (S.visible) S.dirty = true; })
  .observe(hero);

let resizeRaf;
window.addEventListener('resize', () => {
  cancelAnimationFrame(resizeRaf);
  resizeRaf = requestAnimationFrame(() => {
    const ratio = S.W ? S.x / S.W : 0.5;
    layout();
    if (S.mode !== 'intro') { S.x = S.target = ratio * S.W; }
  });
});

/* ---------------------------------------------------------------- Start */

renderAbout();
renderProjects();
renderCerts();
renderCV();
renderContact();
bindPointer();
document.fonts.ready.then(() => { layout(); });
initHero();
if (import.meta.env?.DEV) window.__xray = S; // nur zum Testen im Dev-Server

import { addSwitch } from '/shared/switch.js';
addSwitch('xray');
