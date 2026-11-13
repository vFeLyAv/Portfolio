// v-quietblooms: Hero als Pixel-Mosaik mit scharfem Gesicht + Lupe am Cursor, Inhalte in DE/EN/RU.
import * as DE from '/shared/data.js';
import * as EN from '/shared/data.en.js';
import * as RU from '/shared/data.ru.js';
import { Mosaic } from './mosaic.js';

const DATA = { de: DE, en: EN, ru: RU };
const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---------- Oberflächen-Texte ----------
const UI = {
  de: {
    portfolio: 'Portfolio', city: 'Regensburg', langLabel: 'Sprache',
    credits: 'Design und Code: Feliks Kolomoiets — gebaut mit KI-Werkzeugen — Regensburg 2026',
    about: 'über mich', projects: 'projekte', certs: 'zertifikate', cv: 'lebenslauf', contact: 'kontakt',
    facts: 'Fun Facts', inProgress: 'In Arbeit',
    school: 'Schule', practice: 'Praxis', skills: 'Kenntnisse', languages: 'Sprachen', documents: 'Dokumente',
    verify: 'Echtheit prüfen', pdf: 'Zertifikat als PDF', course: 'Zum Kurs', visit: 'bunprise.de öffnen',
    status: { erhalten: 'erhalten', geplant: 'in Arbeit', folgt: 'folgt' },
    contactLead: 'Am einfachsten erreichst du mich per E-Mail oder auf Instagram.',
    copy: 'E-Mail kopieren', copied: 'Kopiert', copyFail: 'Bitte die Adresse markieren und kopieren',
    newTab: '(öffnet in neuem Tab)', onInsta: 'auf Instagram',
  },
  en: {
    portfolio: 'Portfolio', city: 'Regensburg', langLabel: 'Language',
    credits: 'Design and code: Feliks Kolomoiets — built with AI tools — Regensburg 2026',
    about: 'about me', projects: 'projects', certs: 'certificates', cv: 'cv', contact: 'contact',
    facts: 'Fun facts', inProgress: 'In progress',
    school: 'School', practice: 'Work experience', skills: 'Skills', languages: 'Languages', documents: 'Documents',
    verify: 'Verify certificate', pdf: 'Certificate as PDF', course: 'Go to course', visit: 'Open bunprise.de',
    status: {},
    contactLead: 'The easiest way to reach me is by e-mail or on Instagram.',
    copy: 'Copy e-mail', copied: 'Copied', copyFail: 'Please select the address and copy it',
    newTab: '(opens in a new tab)', onInsta: 'on Instagram',
  },
  ru: {
    portfolio: 'Портфолио', city: 'Регенсбург', langLabel: 'Язык',
    credits: 'Дизайн и код: Feliks Kolomoiets — сделано с ИИ-инструментами — Регенсбург 2026',
    about: 'обо мне', projects: 'проекты', certs: 'сертификаты', cv: 'резюме', contact: 'контакты',
    facts: 'Факты обо мне', inProgress: 'В процессе',
    school: 'Школа', practice: 'Практика', skills: 'Навыки', languages: 'Языки', documents: 'Документы',
    verify: 'Проверить подлинность', pdf: 'Сертификат в PDF', course: 'К курсу', visit: 'Открыть bunprise.de',
    status: {},
    contactLead: 'Проще всего написать мне на e-mail или в Instagram.',
    copy: 'Скопировать e-mail', copied: 'Скопировано', copyFail: 'Выделите адрес и скопируйте его',
    newTab: '(откроется в новой вкладке)', onInsta: 'в Instagram',
  },
};

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const ACCENTS = ['var(--rose)', 'var(--sky)', 'var(--poppy)', 'var(--leaf)', 'var(--amber)'];
const LEVEL_N = { Grundlagen: 1, gut: 2, fortgeschritten: 3, 'im Alltag': 3 };

// Wort in gemischte Buchstaben zerlegen: 1. Buchstabe Schreibschrift, einer in der Mitte Pixel, langes Wortende wieder Schreibschrift
function mix(text) {
  return text.split(' ').map((word) => {
    const ch = [...word];
    const n = ch.length;
    const pix = new Set([Math.floor(n * 0.62)]);
    if (n >= 8) pix.add(Math.floor(n * 0.3));
    const spans = ch.map((c, i) => {
      let k = 'g';
      if (i === 0) k = 's';
      else if (i === n - 1 && n >= 6) k = 's';
      else if (pix.has(i)) k = 'p';
      return `<span class="ch ${k}">${esc(c)}</span>`;
    }).join('');
    return `<span class="w">${spans}</span>`;
  }).join(' ');
}

// ---------- Sprache ----------
const LANGS = ['de', 'en', 'ru'];
function initialLang() {
  const q = new URLSearchParams(location.search).get('lang');
  if (q && LANGS.includes(q)) return q;
  try { const s = localStorage.getItem('feliks-lang'); if (LANGS.includes(s)) return s; } catch { /* privat */ }
  return 'de';
}
let lang = initialLang();

function setLang(l, save = true) {
  lang = l;
  document.documentElement.lang = l;
  if (save) {
    try { localStorage.setItem('feliks-lang', l); } catch { /* privat */ }
    const u = new URL(location.href); u.searchParams.set('lang', l); history.replaceState(null, '', u);
  }
  document.querySelectorAll('[data-lang]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lang === l)));
  render();
}
document.querySelectorAll('[data-lang]').forEach((b) => b.addEventListener('click', () => setLang(b.dataset.lang)));

// ---------- Inhalte rendern ----------
const slot = (name) => document.querySelector(`[data-slot="${name}"]`);
const statusText = (item) => item.label || UI[lang].status[item.status] || item.status;
const levelText = (item) => item.label || item.level;

function render() {
  const t = UI[lang];
  const d = DATA[lang];
  document.querySelectorAll('[data-t]').forEach((el) => { el.textContent = t[el.dataset.t]; });
  document.querySelectorAll('[data-mix]').forEach((el) => { el.innerHTML = mix(t[el.dataset.mix]); el.setAttribute('aria-label', t[el.dataset.mix]); });

  slot('about').innerHTML = d.about.map((p) => `<p>${esc(p)}</p>`).join('');
  slot('facts').innerHTML = d.facts.map((f, i) => `
    <li><span class="sq" style="--c:${ACCENTS[i % ACCENTS.length]}" aria-hidden="true"></span><b>${esc(f.title)}</b><span class="t">${esc(f.text)}</span></li>`).join('');

  slot('projects').innerHTML = d.projects.map((p, i) => `
    <article class="proj proj--${i + 1}">
      <figure class="proj__media" data-mosaic>
        <img src="${p.img}" alt="${esc(p.title)}" loading="lazy" decoding="async">
      </figure>
      <div class="proj__body">
        <p class="proj__when">${esc(p.when)}</p>
        <h3 class="proj__title">${esc(p.title)}</h3>
        <p class="proj__text">${esc(p.text)}</p>
        ${p.url ? `<a class="link" href="${p.url}" target="_blank" rel="noopener">${esc(t.visit)}<span class="sr-only"> ${esc(t.newTab)}</span></a>` : ''}
      </div>
    </article>`).join('');

  const earned = d.certificates.filter((c) => c.status === 'erhalten');
  const progress = d.certificates.filter((c) => c.status !== 'erhalten');
  slot('earned').innerHTML = earned.map((c) => `
    <li class="cert">
      <a href="${c.pdf}" target="_blank" rel="noopener" tabindex="-1" aria-hidden="true"><img class="cert__img" src="${c.img}" alt="" loading="lazy" decoding="async"></a>
      <h3 class="cert__title">${esc(c.title)}</h3>
      <p class="cert__meta">${esc(c.issuer)}<br><span class="chip">${esc(statusText(c))}</span> ${esc(c.date)}</p>
      <p class="cert__links">
        <a class="link" href="${c.url}" target="_blank" rel="noopener">${esc(t.verify)}<span class="sr-only"> ${esc(t.newTab)}</span></a>
        <a class="link" href="${c.pdf}" target="_blank" rel="noopener">${esc(t.pdf)}<span class="sr-only"> ${esc(t.newTab)}</span></a>
      </p>
    </li>`).join('');
  slot('progress').innerHTML = progress.map((c) => `
    <li>
      <h4>${esc(c.title)}</h4>
      <p>${esc(c.issuer)} <span class="chip chip--soft">${esc(statusText(c))}</span></p>
      <a class="link" href="${c.url}" target="_blank" rel="noopener">${esc(t.course)}<span class="sr-only"> ${esc(t.newTab)}</span></a>
    </li>`).join('');

  const tl = (rows) => `<ul class="tl">${rows.map((r) => `<li><span class="when">${esc(r.when)}</span><span><b>${esc(r.what)}</b><span class="d">${esc(r.detail)}</span></span></li>`).join('')}</ul>`;
  slot('cv').innerHTML = `
    <div class="cv__col">
      <div><h3 class="minor">${esc(t.school)}</h3>${tl(d.school)}</div>
      <div><h3 class="minor">${esc(t.practice)}</h3>${tl(d.practice)}</div>
    </div>
    <div class="cv__col">
      <div><h3 class="minor">${esc(t.skills)}</h3>
        <div class="skills">${d.skills.map((g) => `
          <div><h4>${esc(g.group)}</h4><ul>${g.items.map((it) => `
            <li><span>${esc(it.what)}</span><span class="lvl" data-n="${LEVEL_N[it.level] || 1}"><i aria-hidden="true"><b></b></i>${esc(levelText(it))}</span></li>`).join('')}</ul></div>`).join('')}
        </div>
      </div>
      <div><h3 class="minor">${esc(t.languages)}</h3>
        <ul class="langs-list">${d.languages.map((l) => `<li><span>${esc(l.lang)}</span><span class="lvl-t">${esc(levelText(l))}</span></li>`).join('')}</ul>
      </div>
      <div><h3 class="minor">${esc(t.documents)}</h3>
        <ul class="docs">${d.documents.map((doc) => `<li><span><span class="when">${esc(doc.when)}</span>${esc(doc.title)}</span><span class="chip chip--none">${esc(statusText(doc))}</span></li>`).join('')}</ul>
      </div>
    </div>`;

  const mail = slot('mail');
  mail.textContent = d.contact.email; mail.href = `mailto:${d.contact.email}`;
  const insta = slot('insta');
  insta.textContent = `@${d.contact.instagram} ${t.onInsta}`;
  insta.href = `https://instagram.com/${d.contact.instagram}`;
  document.querySelector('.copy-status').textContent = '';

  setupProjectMosaics();
}

// ---------- E-Mail kopieren ----------
document.querySelector('.btn-copy').addEventListener('click', async () => {
  const st = document.querySelector('.copy-status');
  const email = DATA[lang].contact.email;
  try {
    await navigator.clipboard.writeText(email);
    st.textContent = UI[lang].copied;
  } catch {
    st.textContent = UI[lang].copyFail;
  }
  clearTimeout(st._t); st._t = setTimeout(() => { st.textContent = ''; }, 2600);
});

// ---------- Hero-Mosaik ----------
const hero = document.querySelector('.hero');
const heroCanvas = document.querySelector('.hero__mosaic');
const spark = document.querySelector('.hero__spark');
let heroMosaic = null;

function heroOpts() {
  const narrow = innerWidth < 700;
  return {
    // Gesicht + Mütze + Hände im Foto sony-dsc01805 (1800 x 1200)
    focus: narrow ? { x: 0.478, y: 0.36, rx: 0.15, ry: 0.2 } : { x: 0.478, y: 0.39, rx: 0.2, ry: 0.25 },
    anchor: narrow ? { x: 0.5, y: 0.36 } : { x: 0.5, y: 0.37 },
    cols: narrow ? 13 : 34, minBlock: 26, maxBlock: 72,
    lens: narrow ? 120 : 210,
    filter: 'saturate(1.38) contrast(1.06) brightness(1.07)',
    shade: [[0, 'rgba(255,255,255,1)'], [0.5, 'rgba(255,255,255,1)'], [1, 'rgba(120,70,110,1)']],
    vignette: 'rgb(118,72,112)',
  };
}

function placeSpark() {
  if (!heroMosaic || !heroMosaic.col) return;
  const m = heroMosaic, dpr = m.dpr;
  const x = (m.fx + m.frx * 0.95) / dpr, y = (m.fy - m.fry * 0.62) / dpr;
  const w = spark.getBoundingClientRect().width || 200;
  spark.style.left = `${Math.min(innerWidth - w * 0.6, x - w * 0.5)}px`;
  spark.style.top = `${y - w * 0.125}px`;
  spark.style.opacity = '1';
}

const heroImg = new Image();
heroImg.decoding = 'async';
heroImg.src = '/img/sony-dsc01805-photo.jpg';
heroImg.decode().then(() => {
  heroMosaic = new Mosaic(heroCanvas, heroImg, heroOpts());
  heroMosaic.resize();
  placeSpark();
  drawBands();
}).catch(() => { hero.style.background = '#3a2430'; });

// Lupe: Maus/Stift bewegt sie, Touch: ziehen
hero.addEventListener('pointermove', (e) => {
  if (!heroMosaic || e.pointerType === 'touch') return;
  const r = heroCanvas.getBoundingClientRect();
  heroMosaic.point(e.clientX - r.left, e.clientY - r.top);
});
hero.addEventListener('pointerleave', (e) => { if (heroMosaic && e.pointerType !== 'touch') heroMosaic.release(); });
let touchTimer = 0;
const onTouch = (e) => {
  if (!heroMosaic) return;
  const tp = e.touches[0]; if (!tp) return;
  const r = heroCanvas.getBoundingClientRect();
  heroMosaic.point(tp.clientX - r.left, tp.clientY - r.top);
  clearTimeout(touchTimer);
};
hero.addEventListener('touchstart', onTouch, { passive: true });
hero.addEventListener('touchmove', onTouch, { passive: true });
hero.addEventListener('touchend', () => { clearTimeout(touchTimer); touchTimer = setTimeout(() => heroMosaic && heroMosaic.release(), 1400); }, { passive: true });

new IntersectionObserver(([en]) => { if (heroMosaic) heroMosaic.setVisible(en.isIntersecting); }).observe(hero);

// ---------- Pixel-Bänder: die letzte Mosaikreihe des Hero "rieselt" in die Seite ----------
const hashf = (i, j) => { const s = Math.sin(i * 12.9898 + j * 78.233) * 43758.5453; return s - Math.floor(s); };
function drawBand(canvas, colors, block, rows, up) {
  const dpr = Math.min(1.5, devicePixelRatio || 1);
  const w = canvas.getBoundingClientRect().width || innerWidth;
  const hCss = Math.round(block * rows);
  canvas.style.height = `${hCss}px`;
  canvas.width = Math.round(w * dpr); canvas.height = Math.round(hCss * dpr);
  const ctx = canvas.getContext('2d');
  const b = block * dpr;
  const night = [27, 17, 26];
  for (let r = 0; r < rows; r++) {
    const p = Math.pow(1 - r / rows, 1.7);
    for (let i = 0; i < colors.length; i++) {
      if (hashf(i, r + (up ? 50 : 0)) > p) continue;
      const k = r / rows * 0.3;
      const c = colors[i].map((v, ch) => Math.round(v * (1 - k) + night[ch] * k));
      ctx.fillStyle = `rgb(${c})`;
      const y = up ? (rows - 1 - r) * b : r * b;
      ctx.fillRect(Math.round(i * b), Math.round(y), Math.ceil(b), Math.ceil(b));
    }
  }
}
function drawBands() {
  if (!heroMosaic || !heroMosaic.col) return;
  const { colors, block } = heroMosaic.bottomRow(0.62);
  drawBand(document.querySelector('.band--down'), colors, block, 5, false);
  // oben vor dem Kontakt: dieselben Farben, gespiegelt aufsteigend
  drawBand(document.querySelector('.band--up'), colors.slice().reverse(), block, 4, true);
}

// ---------- Projektbilder: Mosaik am Rand, Mitte scharf; Lupe beim Darüberfahren ----------
const projMosaics = new Set();
const projIO = new IntersectionObserver((entries) => {
  for (const en of entries) {
    const fig = en.target;
    if (en.isIntersecting && !fig._m) startProjectMosaic(fig);
    if (fig._m) fig._m.setVisible(en.isIntersecting);
  }
}, { rootMargin: '200px' });

function startProjectMosaic(fig) {
  const img = fig.querySelector('img');
  const go = () => {
    const canvas = document.createElement('canvas');
    canvas.setAttribute('aria-hidden', 'true');
    fig.append(canvas);
    const m = new Mosaic(canvas, img, {
      focus: { x: 0.5, y: 0.5, rx: img.naturalWidth / img.naturalHeight * 0.37, ry: 0.52 },
      cols: 16, minBlock: 14, maxBlock: 52, lens: 150, filter: 'saturate(1.15)', maxDpr: 2, jitter: 0.2,
    });
    fig._m = m; projMosaics.add(m);
    m.resize();
    fig.addEventListener('pointermove', (e) => { const r = canvas.getBoundingClientRect(); m.point(e.clientX - r.left, e.clientY - r.top); });
    fig.addEventListener('pointerleave', () => m.release());
  };
  if (img.complete && img.naturalWidth) go(); else img.addEventListener('load', go, { once: true });
}

function setupProjectMosaics() {
  projMosaics.clear();
  document.querySelectorAll('[data-mosaic]').forEach((fig) => projIO.observe(fig));
}

// ---------- Größe ändern ----------
let rzT = 0, lastW = innerWidth, lastH = innerHeight;
addEventListener('resize', () => {
  clearTimeout(rzT);
  rzT = setTimeout(() => {
    // auf dem Handy ändert die Adressleiste ständig die Höhe: nur bei echter Änderung neu rechnen
    if (innerWidth === lastW && Math.abs(innerHeight - lastH) < 120) return;
    lastW = innerWidth; lastH = innerHeight;
    if (heroMosaic) { heroMosaic.o = Object.assign(heroMosaic.o, heroOpts()); heroMosaic.resize(); placeSpark(); drawBands(); }
    projMosaics.forEach((m) => m.resize());
  }, 160);
});

// ---------- FELIX -> FELIKS ----------
// Start: „felix“ (so sagen viele; Klasse name-felix kommt aus dem <head>). Dann schrumpft das x,
// k+s wachsen nach (CSS-Übergänge), und zum Schluss springt das "k" kurz durch die drei Schriften.
// Endzustand ist immer „feliks“ (ohne JS und bei reduzierter Bewegung sofort).
function nameAnimation() {
  const root = document.documentElement;
  const ks = [...document.querySelectorAll('.name .ks')];
  const xx = document.querySelector('.name .xx');
  const showFinal = () => {
    root.classList.remove('name-felix');
    ks.forEach((el) => el.removeAttribute('style'));
    xx.removeAttribute('style');
  };
  if (REDUCED || !root.classList.contains('name-felix')) { showFinal(); return; }
  const SWAP = 1800; // so lange steht „felix“
  setTimeout(() => {
    const xw = xx.getBoundingClientRect().width;
    root.classList.remove('name-felix');
    const kw = ks.map((el) => el.getBoundingClientRect().width); // Zielbreiten von k und s
    ks.forEach((el) => Object.assign(el.style, { width: '0px', opacity: '0', overflow: 'hidden' }));
    Object.assign(xx.style, { width: xw + 'px', opacity: '1', overflow: 'hidden' });
    void xx.offsetWidth;
    const tr = 'width .62s cubic-bezier(.65,0,.35,1), opacity .5s ease';
    ks.forEach((el, i) => Object.assign(el.style, { transition: tr, width: kw[i] + 'px', opacity: '1' }));
    Object.assign(xx.style, { transition: tr, width: '0px', opacity: '0' });
  }, SWAP);
  const k = ks[0];
  const steps = ['s', 'p', 'g', 'p', 'g'];
  setTimeout(showFinal, SWAP + 700);
  steps.forEach((cls, i) => setTimeout(() => { k.classList.remove('g', 'p', 's'); k.classList.add(cls); }, SWAP + 760 + i * 110));
}

// ---------- Start ----------
setLang(lang, false);
document.fonts.ready.then(() => { nameAnimation(); placeSpark(); });

if (import.meta.env.DEV) { const { addSwitch } = await import('/shared/switch.js'); addSwitch('v-quietblooms'); }
