// v-goats: Felix im Wiesen-Plakat. Unscharfer Sprühname, der unter dem Cursor/Finger scharf wird.
import * as de from '/shared/data.js';
import * as en from '/shared/data.en.js';
import * as ru from '/shared/data.ru.js';
import { qrSVG } from './qr.js';

const DATA = { de, en, ru };
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// ---------------- Texte der Oberfläche ----------------
const UI = {
  de: {
    tag1: 'kannst du', tag2: 'ERKENNEN', tag3: 'wer das ist?', scan: 'scann mich', langGroup: 'Sprache',
    about: 'Über mich', facts: 'Fun Facts', projects: 'Projekte', certs: 'Zertifikate', cv: 'Lebenslauf',
    school: 'Schule', practice: 'Praxis', skills: 'Kenntnisse', languages: 'Sprachen', documents: 'Dokumente',
    contact: 'Kontakt', contactLead: 'Schreib mir', copy: 'E-Mail kopieren', copied: 'kopiert!', copyFail: 'Kopieren ging nicht, bitte markieren.',
    open: 'bunprise.de öffnen', verify: 'Echtheit prüfen', pdf: 'PDF ansehen', course: 'Zum Kurs',
    earned: 'erhalten', planned: 'in Arbeit', soon: 'folgt', issued: 'ausgestellt am',
    alt: ['Bunprise: Vorschaubild der Web-App', 'Tiefenkarte eines Fotos, berechnet mit Depth Anything V2', 'Blender-Render einer Szene vom Minecraft-Server'],
    certAlt: 'Zertifikat',
  },
  en: {
    tag1: 'can you', tag2: 'MAKE OUT', tag3: 'who this is?', scan: 'scan me', langGroup: 'Language',
    about: 'About me', facts: 'Fun facts', projects: 'Projects', certs: 'Certificates', cv: 'CV',
    school: 'School', practice: 'Practical experience', skills: 'Skills', languages: 'Languages', documents: 'Documents',
    contact: 'Contact', contactLead: 'Write to me', copy: 'Copy e-mail', copied: 'copied!', copyFail: 'Copy failed, please select the address.',
    open: 'Open bunprise.de', verify: 'Verify', pdf: 'View PDF', course: 'Course page',
    earned: 'earned', planned: 'in progress', soon: 'coming soon', issued: 'issued',
    alt: ['Bunprise: preview image of the web app', 'Depth map of a photo, computed with Depth Anything V2', 'Blender render of a scene from the Minecraft server'],
    certAlt: 'Certificate',
  },
  ru: {
    tag1: 'сможешь', tag2: 'РАЗГЛЯДЕТЬ', tag3: 'кто это?', scan: 'сканируй', langGroup: 'Язык',
    about: 'Обо мне', facts: 'Факты обо мне', projects: 'Проекты', certs: 'Сертификаты', cv: 'Резюме',
    school: 'Школа', practice: 'Практика', skills: 'Навыки', languages: 'Языки', documents: 'Документы',
    contact: 'Контакт', contactLead: 'Напиши мне', copy: 'Скопировать e-mail', copied: 'скопировано!', copyFail: 'Не получилось, выдели адрес вручную.',
    open: 'Открыть bunprise.de', verify: 'Проверить подлинность', pdf: 'Открыть PDF', course: 'К курсу',
    earned: 'получен', planned: 'в процессе', soon: 'скоро', issued: 'выдан',
    alt: ['Bunprise: превью веб-приложения', 'Карта глубины фотографии, рассчитанная Depth Anything V2', 'Рендер сцены с Minecraft-сервера в Blender'],
    certAlt: 'Сертификат',
  },
};
const LEVEL = { Grundlagen: 1, gut: 2, fortgeschritten: 3 };
const ARROW = '<svg aria-hidden="true"><use href="#star"/></svg>';

// ---------------- Rendern ----------------
function render(lang) {
  const d = DATA[lang], t = UI[lang];
  document.documentElement.lang = lang;
  $$('[data-t]').forEach(el => { if (t[el.dataset.t]) el.textContent = t[el.dataset.t]; });
  $('.lang').setAttribute('aria-label', t.langGroup);
  $$('.lang button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.lang === lang)));

  // Zitat-Block im Hero: ein Fun Fact (Kochshow)
  const fact = d.facts[3];
  $('#qHead').textContent = fact.title;
  $('#qText').textContent = fact.text;

  $('#aboutText').innerHTML = d.about.map(p => `<p>${esc(p)}</p>`).join('');
  $('#factsList').innerHTML = d.facts.map(f => `<li><h4>${esc(f.title)}</h4><p>${esc(f.text)}</p></li>`).join('');

  $('#projectList').innerHTML = d.projects.map((p, i) => {
    const cls = i === 0 ? '' : i === 1 ? ' proj--flip' : ' proj--small';
    const icon = p.icon ? `<img src="${p.icon}" alt="" width="40" height="40">` : '';
    const link = p.url ? `<a class="link" href="${p.url}" target="_blank" rel="noopener">${ARROW}${esc(t.open)}</a>` : '';
    const frags = i < 2 ? `<div class="frag frag--p1" data-seed="${80 + i * 7}" aria-hidden="true"></div><div class="frag frag--p2" data-seed="${83 + i * 7}" aria-hidden="true"></div>` : '';
    return `<article class="proj${cls}">
      <figure class="proj__media">${frags}<img src="${p.img}" alt="${esc(t.alt[i] || p.title)}" loading="lazy" decoding="async"></figure>
      <div class="proj__body">
        <span class="meta">${esc(p.when)}</span>
        <h3 class="proj__title">${icon}${esc(p.title)}</h3>
        <p class="proj__text">${esc(p.text)}</p>
        ${link}
      </div>
    </article>`;
  }).join('');

  const statusLabel = c => c.label || (c.status === 'erhalten' ? t.earned : t.planned);
  $('#certsEarned').innerHTML = d.certificates.filter(c => c.status === 'erhalten').map(c => `
    <figure class="cert">
      <a class="cert__img" href="${c.pdf}" target="_blank" rel="noopener">
        <img src="${c.img}" alt="${esc(t.certAlt)}: ${esc(c.title)}" loading="lazy" decoding="async">
        <span class="cert__badge" aria-hidden="true"><svg><use href="#star"/></svg><span>${esc(statusLabel(c))}</span></span>
      </a>
      <figcaption>
        <h3 class="cert__title">${esc(c.title)}</h3>
        <p class="cert__issuer">${esc(c.issuer)}</p>
        <span class="meta">${esc(t.issued)} ${esc(c.date)}</span>
        <div class="cert__links">
          <a class="link" href="${c.url}" target="_blank" rel="noopener">${ARROW}${esc(t.verify)}</a>
          <a class="link" href="${c.pdf}" target="_blank" rel="noopener">${ARROW}${esc(t.pdf)}</a>
        </div>
      </figcaption>
    </figure>`).join('');
  $('#certsPlanned').innerHTML = d.certificates.filter(c => c.status !== 'erhalten').map(c => `
    <li>
      <div><strong>${esc(c.title)}</strong><span class="cert__issuer">${esc(c.issuer)}</span></div>
      <p class="hand">${esc(statusLabel(c))}</p>
      <a class="link" href="${c.url}" target="_blank" rel="noopener">${ARROW}${esc(t.course)}</a>
    </li>`).join('');

  const tl = list => list.map(x => `<li><span class="meta">${esc(x.when)}</span><strong>${esc(x.what)}</strong><span class="d">${esc(x.detail)}</span></li>`).join('');
  $('#school').innerHTML = tl(d.school);
  $('#practice').innerHTML = tl(d.practice);

  $('#skills').innerHTML = d.skills.map(g => `
    <div class="skills__group"><h4>${esc(g.group)}</h4>
      ${g.items.map(s => {
        const n = LEVEL[s.level];
        const sq = n ? `<span class="sq" aria-hidden="true">${[1, 2, 3].map(k => `<i class="${k <= n ? '' : 'off'}"></i>`).join('')}</span>` : '';
        return `<div class="skill"><span>${esc(s.what)}</span><span class="skill__lvl">${sq}${esc(s.label || s.level)}</span></div>`;
      }).join('')}
    </div>`).join('');
  $('#languages').innerHTML = d.languages.map(l => `<li><span>${esc(l.lang)}</span><span class="skill__lvl">${esc(l.label || l.level)}</span></li>`).join('');
  $('#documents').innerHTML = d.documents.map(x => `<li class="doc"><span>${esc(x.title)}<small>${esc(x.when)}</small></span><span class="hand">${esc(x.label || t.soon)}</span></li>`).join('');

  $('#copyStatus').textContent = '';
  requestAnimationFrame(() => applyMasks($('#projectList')));
}

// Überschriften: Inhalt in <span> (Sprühfilter) packen, data-t wandert mit
$$('.big').forEach(h => {
  const s = document.createElement('span');
  s.textContent = h.textContent;
  if (h.dataset.t) { s.dataset.t = h.dataset.t; delete h.dataset.t; }
  h.textContent = ''; h.append(s);
});

// ---------------- Sprache ----------------
function pickLang() {
  const q = new URLSearchParams(location.search).get('lang');
  if (q && DATA[q]) return q;
  try { const s = localStorage.getItem('felix-lang'); if (s && DATA[s]) return s; } catch {}
  return 'de';
}
let lang = pickLang();
render(lang);
$$('.lang button').forEach(b => b.addEventListener('click', () => {
  lang = b.dataset.lang;
  try { localStorage.setItem('felix-lang', lang); } catch {}
  const u = new URL(location.href); u.searchParams.set('lang', lang); history.replaceState(null, '', u);
  render(lang);
}));

// ---------------- QR-Code ----------------
$('#qr').innerHTML = qrSVG('https://felya.pages.dev', { dark: '#111', light: '#fff' });

// ---------------- Zufall, Texturen ----------------
function rng(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const hash2 = (x, y, s) => {
  let h = Math.imul(x * 374761393 + y * 668265263 + s * 2246822519, 3266489917);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};
const DPR = () => Math.min(window.devicePixelRatio || 1, 1.5);

// Papierkorn
(() => {
  const c = document.createElement('canvas'); c.width = c.height = 180;
  const x = c.getContext('2d'), img = x.createImageData(180, 180), R = rng(7);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = R() < .5 ? 0 : 255;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
    img.data[i + 3] = Math.floor(R() * (v ? 26 : 16));
  }
  x.putImageData(img, 0, 0);
  document.documentElement.style.setProperty('--noise', `url(${c.toDataURL()})`);
})();

const GREENS = ['#2c4d1d', '#385e26', '#456f30', '#547f3a', '#638c45', '#759a52', '#88a962', '#9db876'];

// Grashalme in Bändern zeichnen (wenige stroke()-Aufrufe → schnell)
function blades(ctx, { w, h, y0, y1, density, len, width, R, palette, lean = 6, alpha = .9, tFrom = 0 }) {
  const bands = 10;
  for (let b = 0; b < bands; b++) {
    const ya = y0 + (y1 - y0) * (b / bands), yb = y0 + (y1 - y0) * ((b + 1) / bands);
    const t = tFrom + (1 - tFrom) * ((b + .5) / bands);
    const paths = palette.map(() => new Path2D());
    const count = Math.round(w * (yb - ya) * density(t));
    for (let i = 0; i < count; i++) {
      const x = R() * w, y = ya + R() * (yb - ya);
      const L = len(t) * (.55 + R() * .9);
      const lx = (R() - .5) * lean * (.4 + t) + (R() - .5) * L * .35;
      const p = paths[Math.floor(R() * palette.length)];
      p.moveTo(x, y);
      p.quadraticCurveTo(x + lx * .15, y - L * .55, x + lx, y - L);
    }
    ctx.lineWidth = width(t); ctx.lineCap = 'round'; ctx.globalAlpha = alpha;
    paths.forEach((p, k) => { ctx.strokeStyle = palette[k]; ctx.stroke(p); });
  }
  ctx.globalAlpha = 1;
}

function sizeCanvas(c) {
  const w = c.clientWidth, h = c.clientHeight, d = DPR();
  c.width = Math.max(1, Math.round(w * d)); c.height = Math.max(1, Math.round(h * d));
  const ctx = c.getContext('2d'); ctx.setTransform(d, 0, 0, d, 0, 0);
  return { ctx, w, h };
}

function drawField(c, seed = 3) {
  const { ctx, w, h } = sizeCanvas(c);
  const R = rng(seed), k = Math.max(.6, h / 600);
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, '#b3bfa6'); g.addColorStop(.16, '#89a36d'); g.addColorStop(.45, '#668b4a'); g.addColorStop(1, '#466f35');
  ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  // weiche Flecken für unruhigen Rasen
  for (let i = 0; i < 46; i++) {
    const t = .15 + R() * .85, x = R() * w, y = t * h, r = (40 + R() * 160) * (.4 + t) * k;
    ctx.save(); ctx.translate(x, y); ctx.scale(1, .32);
    const rg = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
    const dark = R() < .55;
    rg.addColorStop(0, dark ? 'rgba(38,66,18,.28)' : 'rgba(170,196,112,.22)'); rg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = rg; ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  }
  blades(ctx, {
    w, h, y0: h * .02, y1: h * 1.04, R, palette: GREENS,
    density: t => (.05 + .05 * t) / k,
    len: t => (2 + 20 * Math.pow(t, 1.6)) * k,
    width: t => .5 + 1.3 * t * k,
    lean: 8 * k, alpha: .85,
  });
}

function drawFront(c, seed = 9) {
  const { ctx, w, h } = sizeCanvas(c);
  ctx.clearRect(0, 0, w, h);
  const R = rng(seed), k = Math.max(.7, h / 260);
  if ('filter' in ctx) ctx.filter = 'blur(1.4px)';
  blades(ctx, {
    w, h, y0: h * .45, y1: h * 1.05, R, palette: GREENS.slice(0, 6), tFrom: .2,
    density: t => (.006 + .03 * t * t) / k,
    len: t => (16 + 70 * t) * k,
    width: t => (1.2 + 2.6 * t) * Math.min(k, 1.6),
    lean: 26 * k, alpha: .95,
  });
  if ('filter' in ctx) ctx.filter = 'none';
}

// Nahe, sattere Gras-Textur für die Pixel-Fenster (ein Bild, überall wiederverwendet)
(() => {
  const c = document.createElement('canvas'); const W = 720, H = 520; c.width = W; c.height = H;
  const ctx = c.getContext('2d'), R = rng(21);
  ctx.fillStyle = '#577f3a'; ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < 60; i++) {
    const x = R() * W, y = R() * H, r = 30 + R() * 110;
    const rg = ctx.createRadialGradient(x, y, 0, x, y, r);
    rg.addColorStop(0, R() < .5 ? 'rgba(36,70,16,.35)' : 'rgba(176,206,110,.3)'); rg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = rg; ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }
  blades(ctx, {
    w: W, h: H, y0: 0, y1: H + 20, R, palette: ['#29491a', '#375d24', '#45702e', '#56843a', '#679648', '#7ba757', '#91b96a', '#a9c983'], tFrom: .6,
    density: () => .085, len: t => 10 + 18 * t, width: () => 1.5, lean: 10, alpha: .9,
  });
  document.documentElement.style.setProperty('--grass', `url(${c.toDataURL('image/jpeg', .84)})`);
})();

// ---------------- Pixel-Kanten (statische Glitch-Fragmente) ----------------
function pixelMask(el) {
  const w = el.clientWidth, h = el.clientHeight;
  if (!w || !h) return;
  const seed = +el.dataset.seed || 1;
  const isFrag = el.classList.contains('frag');
  const cell = Math.round(Math.max(9, Math.min(isFrag ? 26 : 18, Math.min(w, h) / (isFrag ? 7 : 12))));
  const cols = Math.ceil(w / cell), rows = Math.ceil(h / cell);
  const R = rng(seed);
  const pad = isFrag ? 0 : el.dataset.pad ? +el.dataset.pad : Math.max(2, Math.round(Math.min(cols, rows) * .14));
  let d = '';
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
    const n = hash2(x >> 1, y >> 1, seed) * .65 + R() * .35;
    let on;
    if (isFrag) {
      const cx = (x / cols - .5) * 2, cy = (y / rows - .5) * 2;
      const r = Math.hypot(cx * .8, cy);
      on = n < .8 - r * .62;
    } else {
      const inside = x >= pad && x < cols - pad && y >= pad && y < rows - pad;
      const dist = inside
        ? -Math.min(x - pad, cols - pad - 1 - x, y - pad, rows - pad - 1 - y)
        : Math.max(pad - x, x - (cols - pad - 1), pad - y, y - (rows - pad - 1));
      if (dist <= -2) on = true;
      else if (dist <= 0) on = n < .86;
      else if (dist === 1) on = n < .48;
      else if (dist === 2) on = n < .2;
      else on = R() < .035;
    }
    if (on) d += `M${x} ${y}h1v1h-1z`;
  }
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${cols} ${rows}' width='${cols * cell}' height='${rows * cell}' shape-rendering='crispEdges'><path d='${d}'/></svg>`;
  const url = `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
  el.style.webkitMaskImage = url; el.style.maskImage = url;
  const sz = `${cols * cell}px ${rows * cell}px`;
  el.style.webkitMaskSize = sz; el.style.maskSize = sz;
}
// ResizeObserver: Maske neu, sobald sich die Größe ändert (z. B. wenn ein Bild fertig geladen ist)
const masked = new WeakMap();
const ro = new ResizeObserver(es => es.forEach(e => {
  const k = Math.round(e.contentRect.width) + 'x' + Math.round(e.contentRect.height);
  if (masked.get(e.target) !== k) { masked.set(e.target, k); pixelMask(e.target); }
}));
function applyMasks(root = document) { $$('.win, .frag, .facts__bg', root).forEach(el => ro.observe(el)); }

// ---------------- Wiese zeichnen ----------------
const field = $('#field'), front = $('#front'), field2 = $('#field2');
function drawAll() {
  drawField(field, 3); drawFront(front, 9); drawField(field2, 5);
}
drawAll();
applyMasks();
let lastSize = `${innerWidth}x${field.clientHeight}`, rt;
addEventListener('resize', () => {
  clearTimeout(rt);
  rt = setTimeout(() => {
    measure();
    const size = `${innerWidth}x${field.clientHeight}`;
    if (size !== lastSize) { lastSize = size; drawAll(); if (name.classList.contains('s3')) buildSpray(); } // Handy-Adressleiste: nicht jedes Mal neu malen
  }, 200);
});

// ---------------- Name: Intro + Fokus-Linse + Parallaxe ----------------
const hero = $('.hero'), name = $('#name');
const layers = { field: $('.layer--field'), wins: $('.layer--wins'), felix: $('.layer--felix'), front: $('.layer--front') };
let nameRect = name.getBoundingClientRect(), heroH = hero.offsetHeight;
// Der Name ist horizontal gestreckt (scaleX) → Zeiger-Koordinaten zurückrechnen
let sx = 1;
function measure() {
  const r = name.getBoundingClientRect();
  sx = parseFloat(getComputedStyle(name).getPropertyValue('--sx')) || 1;
  nameRect = { left: r.left + scrollX, top: r.top + scrollY, width: r.width / sx, height: r.height };
  heroH = hero.offsetHeight;
}
measure();

const S = { px: 0, py: 0, tx: 0, ty: 0, lx: 0, ly: 0, ltx: 0, lty: 0, user: false, visible: true, running: false, lensOn: false, lastMx: null, lastMy: null };
// Startposition der Linse: über „FE“
S.lx = S.ltx = nameRect.width * .28; S.ly = S.lty = nameRect.height * .5;

function setLens(x, y) {
  const mx = Math.round(x), my = Math.round(y);
  if (mx === S.lastMx && my === S.lastMy) return;
  S.lastMx = mx; S.lastMy = my;
  name.style.setProperty('--mx', mx + 'px');
  name.style.setProperty('--my', my + 'px');
}
function pointAt(cx, cy) {
  S.user = true;
  S.ltx = (cx + scrollX - nameRect.left) / sx; S.lty = cy + scrollY - nameRect.top;
  S.tx = (cx / innerWidth - .5) * 2; S.ty = (cy / innerHeight - .5) * 2;
  if (reduced) setLens(S.ltx, S.lty); else kick();
}
hero.addEventListener('pointermove', e => { if (e.pointerType === 'mouse' || e.pointerType === 'pen') pointAt(e.clientX, e.clientY); });
hero.addEventListener('pointerdown', e => pointAt(e.clientX, e.clientY));
hero.addEventListener('touchmove', e => { const t = e.touches[0]; if (t) pointAt(t.clientX, t.clientY); }, { passive: true });

function frame(now) {
  S.running = false;
  if (!S.visible || document.hidden) return;
  // Leerlauf: Linse wandert langsam über den Namen, bis jemand zeigt
  if (!S.user && S.lensOn) {
    const t = now / 1000;
    S.ltx = nameRect.width * (.5 + .4 * Math.sin(t * .42));
    S.lty = nameRect.height * (.52 + .2 * Math.sin(t * .77 + 1));
  }
  S.lx += (S.ltx - S.lx) * .14; S.ly += (S.lty - S.ly) * .14;
  S.px += (S.tx - S.px) * .06; S.py += (S.ty - S.py) * .06;
  if (S.lensOn) setLens(S.lx, S.ly);
  const sc = Math.min(scrollY, heroH);
  layers.field.style.transform = `translate3d(${S.px * -10}px, ${sc * .22 + S.py * -4}px, 0)`;
  layers.wins.style.transform = `translate3d(${S.px * 16}px, ${sc * .1 + S.py * 6}px, 0)`;
  layers.felix.style.transform = `translate3d(${S.px * -22}px, ${sc * .06 + S.py * -3}px, 0)`;
  layers.front.style.transform = `translate3d(${S.px * -40}px, ${sc * -.04 + S.py * -8}px, 0)`;
  const settled = S.user && Math.abs(S.ltx - S.lx) < .3 && Math.abs(S.lty - S.ly) < .3 && Math.abs(S.tx - S.px) < .002 && Math.abs(S.ty - S.py) < .002;
  if (!settled || !S.lensOn) kick();
}
function kick() { if (!S.running && !reduced) { S.running = true; requestAnimationFrame(frame); } }
if (!reduced) addEventListener('scroll', kick, { passive: true });
new IntersectionObserver(([e]) => { S.visible = e.isIntersecting; if (S.visible) kick(); }).observe(hero);
document.addEventListener('visibilitychange', kick);

// Sprühnebel: Schrift leicht versetzt mehrfach malen, weichzeichnen, daraus zufällige Pünktchen am Rand
function buildSpray() {
  const cv = $('.name__spray');
  const fs = parseFloat(getComputedStyle(name).fontSize);
  const padX = .3 * fs, padY = .25 * fs;
  const w = Math.ceil(name.offsetWidth + 2 * padX), h = Math.ceil(name.offsetHeight + 2 * padY);
  if (!cv || w < 10 || h < 10) return;
  cv.width = w; cv.height = h;
  const t = document.createElement('canvas'); t.width = w; t.height = h;
  const tx = t.getContext('2d');
  tx.font = `400 ${fs}px Anton`;
  // Grundlinie direkt im DOM messen: ein unsichtbarer Punkt sitzt genau auf der Schrift-Grundlinie
  const ink = name.querySelector('.name__layer--blur .ink');
  const probe = document.createElement('span');
  probe.style.cssText = 'display:inline-block;width:0;height:0;vertical-align:baseline';
  ink.append(probe);
  const base = padY + probe.getBoundingClientRect().bottom - name.getBoundingClientRect().top;
  probe.remove();
  const ls = -.012 * fs, R = rng(17);
  for (let k = 0; k < 7; k++) {
    tx.globalAlpha = k === 0 ? 1 : .35;
    const ox = (R() - .5) * .06 * fs, oy = (R() - .5) * .08 * fs;
    let x = padX;
    for (const ch of 'FELIX') { tx.fillText(ch, x + ox, base + oy); x += tx.measureText(ch).width + ls; }
  }
  const b = document.createElement('canvas'); b.width = w; b.height = h;
  const bx = b.getContext('2d', { willReadFrequently: true });
  const rad = Math.max(5, fs * .075);
  if ('filter' in bx) { bx.filter = `blur(${rad}px)`; bx.drawImage(t, 0, 0); }
  else { const s = document.createElement('canvas'), k = 10; s.width = Math.ceil(w / k); s.height = Math.ceil(h / k); s.getContext('2d').drawImage(t, 0, 0, s.width, s.height); bx.drawImage(s, 0, 0, w, h); }
  const src = bx.getImageData(0, 0, w, h).data;
  const ctx = cv.getContext('2d'), out = ctx.createImageData(w, h), o = out.data;
  for (let i = 0; i < src.length; i += 4) {
    const a = src[i + 3] / 255;
    if (a < .03) continue;
    const prob = a * (1 - a) * .42; // am Rand am dichtesten
    if (R() < prob) { o[i] = 36; o[i + 1] = 27; o[i + 2] = 22; o[i + 3] = 140 + R() * 115; }
  }
  ctx.putImageData(out, 0, 0);
}

function startIntro() {
  if (reduced) {
    name.classList.add('s1', 's2', 's3');
    buildSpray();
    S.lensOn = true; setLens(S.lx, S.ly);
    return;
  }
  setTimeout(() => name.classList.add('s1'), 60);
  setTimeout(() => name.classList.add('s2'), 1900);
  setTimeout(() => { buildSpray(); name.classList.add('s3'); S.lensOn = true; measure(); setLens(S.lx, S.ly); kick(); }, 3300);
  kick();
}
const fontsReady = document.fonts ? Promise.race([document.fonts.ready, new Promise(r => setTimeout(r, 1500))]) : Promise.resolve();
fontsReady.then(() => { measure(); startIntro(); });

// ---------------- Überschriften kommen in den Fokus ----------------
const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .35 });
$$('.big').forEach(h => reduced ? h.classList.add('in') : io.observe(h));

// ---------------- E-Mail kopieren ----------------
$('#copy').addEventListener('click', async () => {
  const mail = DATA[lang].contact.email, st = $('#copyStatus'), t = UI[lang];
  try {
    await navigator.clipboard.writeText(mail);
    st.textContent = t.copied;
  } catch {
    const ta = Object.assign(document.createElement('textarea'), { value: mail });
    ta.style.cssText = 'position:fixed;opacity:0'; document.body.append(ta); ta.select();
    let ok = false; try { ok = document.execCommand('copy'); } catch {}
    ta.remove(); st.textContent = ok ? t.copied : t.copyFail;
  }
  clearTimeout(st._t); st._t = setTimeout(() => { st.textContent = ''; }, 2600);
});

if (import.meta.env.DEV) { const { addSwitch } = await import('/shared/switch.js'); addSwitch('v-goats'); }
