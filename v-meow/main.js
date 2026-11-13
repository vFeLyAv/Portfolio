import * as de from '/shared/data.js';
import * as en from '/shared/data.en.js';
import * as ru from '/shared/data.ru.js';
import { glyphSVG } from './letters.js';
import { makeSticker, mountSticker } from './sticker.js';

const DATA = { de, en, ru };
const LANGS = [
  ['de', 'deutsch'],
  ['en', 'english'],
  ['ru', 'русский'],
];

// Oberflächen-Texte (alles andere kommt aus den Daten-Dateien)
const UI = {
  de: {
    about: 'Über mich', facts: 'Ein paar Dinge über mich', projects: 'Projekte', certs: 'Zertifikate', cv: 'Lebenslauf', contact: 'Kontakt',
    school: 'Schule', practice: 'Praxis', skills: 'Kenntnisse', languages: 'Sprachen', documents: 'Dokumente',
    verify: 'Echtheit prüfen', pdf: 'PDF ansehen', course: 'Zum Kurs', earnedOn: 'Erhalten am', inProgress: 'in Arbeit',
    visit: 'bunprise.de öffnen', email: 'E-Mail', copy: 'E-Mail kopieren', copied: 'Kopiert', copiedToast: 'E-Mail-Adresse kopiert',
    copyFail: 'Kopieren ging nicht. Bitte die Adresse markieren.', toTop: 'nach oben', langGroup: 'Sprache wählen', soon: 'folgt',
    stickerHero: 'Foto von Felix als Sticker. Zum Abziehen ziehen.', stickerSelfie: 'Selfie-Sticker von Felix. Zum Abziehen ziehen.',
    stickerWalk: 'Sticker: Felix läuft auf dich zu. Zum Abziehen ziehen.', levelOf: 'Stufe', of: 'von',
  },
  en: {
    about: 'About me', facts: 'A few things about me', projects: 'Projects', certs: 'Certificates', cv: 'CV', contact: 'Contact',
    school: 'School', practice: 'Work experience', skills: 'Skills', languages: 'Languages', documents: 'Documents',
    verify: 'Verify certificate', pdf: 'View PDF', course: 'Go to course', earnedOn: 'Earned on', inProgress: 'in progress',
    visit: 'Open bunprise.de', email: 'E-mail', copy: 'Copy e-mail', copied: 'Copied', copiedToast: 'E-mail address copied',
    copyFail: 'Copying did not work. Please select the address.', toTop: 'back to top', langGroup: 'Choose language', soon: 'coming soon',
    stickerHero: 'Photo of Felix as a sticker. Drag to peel it off.', stickerSelfie: 'Selfie sticker of Felix. Drag to peel it off.',
    stickerWalk: 'Sticker: Felix walking towards you. Drag to peel it off.', levelOf: 'Level', of: 'of',
  },
  ru: {
    about: 'Обо мне', facts: 'Пара фактов обо мне', projects: 'Проекты', certs: 'Сертификаты', cv: 'Резюме', contact: 'Контакт',
    school: 'Школа', practice: 'Практика', skills: 'Навыки', languages: 'Языки', documents: 'Документы',
    verify: 'Проверить подлинность', pdf: 'Открыть PDF', course: 'К курсу', earnedOn: 'Получен', inProgress: 'в процессе',
    visit: 'Открыть bunprise.de', email: 'E-mail', copy: 'Скопировать e-mail', copied: 'Скопировано', copiedToast: 'Адрес скопирован',
    copyFail: 'Не получилось скопировать. Выделите адрес вручную.', toTop: 'наверх', langGroup: 'Выбрать язык', soon: 'скоро',
    stickerHero: 'Фото Феликса в виде стикера. Потяните, чтобы отклеить.', stickerSelfie: 'Селфи-стикер Феликса. Потяните, чтобы отклеить.',
    stickerWalk: 'Стикер: Феликс идёт к тебе. Потяните, чтобы отклеить.', levelOf: 'Уровень', of: 'из',
  },
};

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (s = '') => String(s)
  .replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
  .replace(/(\S)–(\S)/g, '$1⁠–⁠$2'); // „11.–15.11.“ nicht am Strich umbrechen

/* ---------- Sprache ---------- */
function initialLang() {
  const q = new URLSearchParams(location.search).get('lang');
  if (q && DATA[q]) return q;
  try { const s = localStorage.getItem('felix-lang'); if (s && DATA[s]) return s; } catch { /* privat */ }
  return 'de';
}
let lang = initialLang();

function setLang(l, { save = true } = {}) {
  if (!DATA[l]) return;
  lang = l;
  document.documentElement.lang = l;
  if (save) {
    try { localStorage.setItem('felix-lang', l); } catch { /* egal */ }
    const u = new URL(location.href);
    u.searchParams.set('lang', l);
    history.replaceState(null, '', u);
  }
  render();
}

/* ---------- springende Buchstaben ---------- */
const POSES = [
  [-2.5, 0.035], [2, -0.04], [-1, 0.02], [2.5, -0.025], [-2, 0.04], [1, -0.02], [-3, 0.01], [1.5, 0.03],
];
function bouncyHTML(text) {
  let i = 0;
  const words = text.split(' ').map((w) => {
    const letters = [...w].map((ch) => {
      const [r, y] = POSES[i++ % POSES.length];
      return `<span class="bl" style="--r:${r}deg;--y:${y}em">${esc(ch)}</span>`;
    }).join('');
    return `<span class="bw">${letters}</span>`;
  }).join(' ');
  return `<span class="sr-only">${esc(text)}</span><span aria-hidden="true">${words}</span>`;
}

/* ---------- Rendern ---------- */
const BLOB_A = 'M118 62 C196 -6 318 22 356 72 C424 18 566 46 582 168 C596 262 536 302 556 382 C576 470 444 508 334 470 C232 438 150 500 80 430 C12 362 72 300 40 230 C10 152 50 112 118 62Z';
const BLOB_C = 'M300 30 C420 10 560 70 575 200 C590 330 520 470 360 480 C230 488 60 450 30 320 C5 210 110 50 300 30Z';
let clipId = 0;
function blobImage(src, alt, d = BLOB_A, pos = 'xMidYMid') {
  const id = `clip-${clipId++}`;
  return `<svg class="blobimg" viewBox="-36 -36 672 572" role="img" aria-label="${esc(alt)}">
    <defs><clipPath id="${id}"><path d="${d}"/></clipPath></defs>
    <path class="blobimg-edge" d="${d}"/>
    <image href="${src}" x="0" y="0" width="600" height="500" preserveAspectRatio="${pos} slice" clip-path="url(#${id})"/>
  </svg>`;
}
const SPARK = (cls = '') => `<svg class="spark ${cls}" aria-hidden="true" focusable="false"><use href="#spark"/></svg>`;
const LEVEL = { Grundlagen: 1, gut: 2, fortgeschritten: 3 };

function render() {
  const D = DATA[lang];
  const T = UI[lang];

  $$('[data-text]').forEach((el) => {
    const key = el.dataset.text;
    const val = key === 'caption' ? D.person.photoCaption : T[key];
    if (el.classList.contains('bouncy')) el.innerHTML = bouncyHTML(val);
    else el.textContent = val;
  });
  $$('[data-i18n-label]').forEach((el) => el.setAttribute('aria-label', T[el.dataset.i18nLabel]));

  // Sprachumschalter (Kleingedrucktes)
  $$('.lang').forEach((box) => {
    box.innerHTML = LANGS.map(([code, name]) =>
      `<button type="button" class="lang-btn" lang="${code}" data-lang="${code}" aria-pressed="${code === lang}">${name}</button>`).join('');
  });

  // Über mich
  $('[data-slot="about"]').innerHTML = D.about.map((p) => `<p>${esc(p)}</p>`).join('');
  $('[data-slot="facts"]').innerHTML = D.facts.map((f) =>
    `<li class="fact"><p class="fact-title">${esc(f.title)}</p><p class="fact-text">${esc(f.text)}</p></li>`).join('');

  // Projekte
  const [bun, site, mc] = D.projects;
  $('[data-slot="projects"]').innerHTML = `
    <article class="proj proj-main">
      <div class="proj-art">${blobImage(bun.img, bun.title)}${SPARK('spark-p1')}
        <img class="proj-icon" src="${bun.icon}" alt="" width="120" height="120">
      </div>
      <div class="proj-text">
        <p class="when">${esc(bun.when)}</p>
        <h3 class="proj-title">${esc(bun.title)}</h3>
        <p>${esc(bun.text)}</p>
        <p><a class="pill" href="${bun.url}" target="_blank" rel="noopener">${esc(T.visit)}</a></p>
      </div>
    </article>
    <article class="proj proj-flip">
      <div class="proj-art">${blobImage(site.img, site.title, BLOB_C)}${SPARK('spark-p2')}</div>
      <div class="proj-text">
        <p class="when">${esc(site.when)}</p>
        <h3 class="proj-title">${esc(site.title)}</h3>
        <p>${esc(site.text)}</p>
      </div>
    </article>
    <article class="proj proj-small">
      <div class="proj-art">${blobImage(mc.img, mc.title, BLOB_C)}</div>
      <div class="proj-text">
        <p class="when">${esc(mc.when)}</p>
        <h3 class="proj-title">${esc(mc.title)}</h3>
        <p>${esc(mc.text)}</p>
      </div>
    </article>`;

  // Zertifikate
  $('[data-slot="certs"]').innerHTML = D.certificates.map((c) => {
    if (c.status === 'erhalten') {
      return `<article class="cert cert-earned">
        <a class="cert-img" href="${c.pdf}" target="_blank" rel="noopener"><img src="${c.img}" alt="${esc(c.title)}" loading="lazy" width="1200" height="927"></a>
        <h3 class="cert-title">${esc(c.title)}</h3>
        <p class="cert-meta">${esc(c.issuer)}</p>
        <p class="cert-meta"><strong>${esc(T.earnedOn)} ${esc(c.date)}</strong></p>
        <p class="cert-links"><a class="pill" href="${c.url}" target="_blank" rel="noopener">${esc(T.verify)}</a><a class="pill pill-ghost" href="${c.pdf}" target="_blank" rel="noopener">${esc(T.pdf)}</a></p>
      </article>`;
    }
    return `<article class="cert cert-slot">
      <div class="slot-shape">${SPARK('slot-spark')}<p class="slot-status">${esc(c.label || T.inProgress)}</p></div>
      <div class="slot-text">
        <h3 class="cert-title">${esc(c.title)}</h3>
        <p class="cert-meta">${esc(c.issuer)}</p>
        <p class="cert-links"><a class="pill pill-ghost" href="${c.url}" target="_blank" rel="noopener">${esc(T.course)}</a></p>
      </div>
    </article>`;
  }).join('');

  // Lebenslauf
  const tl = (items) => `<ol class="tl">${items.map((x) => `<li>
      <p class="when">${esc(x.when)}</p><p class="tl-what">${esc(x.what)}</p><p class="tl-detail">${esc(x.detail)}</p></li>`).join('')}</ol>`;
  const levelDots = (lvl) => {
    const n = LEVEL[lvl];
    if (!n) return '';
    return `<span class="dots" aria-hidden="true">${[1, 2, 3].map((k) => `<svg class="dot ${k <= n ? 'on' : ''}"><use href="#spark"/></svg>`).join('')}</span>`;
  };
  $('[data-slot="cv"]').innerHTML = `
    <div class="cv-grid">
      <div class="cv-col">
        <h3 class="cv-h">${esc(T.school)}</h3>${tl(D.school)}
        <h3 class="cv-h">${esc(T.practice)}</h3>${tl(D.practice)}
      </div>
      <div class="cv-col">
        <h3 class="cv-h">${esc(T.skills)}</h3>
        ${D.skills.map((g) => `<div class="skill-group"><p class="skill-g">${esc(g.group)}</p><ul class="skills">${g.items.map((s) =>
          `<li><span class="skill-what">${esc(s.what)}</span><span class="skill-lvl">${levelDots(s.level)}<span>${esc(s.label || s.level)}</span></span></li>`).join('')}</ul></div>`).join('')}
        <h3 class="cv-h">${esc(T.languages)}</h3>
        <ul class="skills langs">${D.languages.map((l) => `<li><span class="skill-what">${esc(l.lang)}</span><span class="skill-lvl"><span>${esc(l.label || l.level)}</span></span></li>`).join('')}</ul>
        <h3 class="cv-h">${esc(T.documents)}</h3>
        <ul class="docs">${D.documents.map((d) => `<li><span class="doc-what">${esc(d.title)}<span class="doc-when">${esc(d.when)}</span></span><span class="doc-status">${esc(d.label || T.soon)}</span></li>`).join('')}</ul>
      </div>
    </div>`;

  // Kontakt
  const c = D.contact;
  $('[data-slot="contact"]').innerHTML = `
    <p class="c-label">${esc(T.email)}</p>
    <p class="c-big"><a href="mailto:${c.email}">${esc(c.email)}</a></p>
    <p><button type="button" class="pill copy-btn" data-copy="${c.email}">${esc(T.copy)}</button></p>
    <p class="c-label">Instagram</p>
    <p class="c-big"><a href="https://www.instagram.com/${c.instagram}/" target="_blank" rel="noopener">@${esc(c.instagram)}</a></p>`;

  // Umriss-Echo hinter jedem Abschnittstitel
  $$('.sec').forEach((sec) => {
    const h = sec.querySelector('h2[data-text]');
    if (!h || sec.classList.contains('sec-contact')) return;
    let e = sec.querySelector(':scope > .echo');
    if (!e) { e = document.createElement('div'); e.className = 'echo'; e.setAttribute('aria-hidden', 'true'); sec.prepend(e); }
    e.textContent = Array(3).fill(T[h.dataset.text].toLowerCase()).join(' ');
  });

  bindLetterHover();
}

/* ---------- Hero-Schriftzug FELIX → FELIKS ---------- */
// Start: „FELIX“ (so sagen viele). Dann fällt das X ab und K + S springen hinein → „FELIKS“.
// Ohne Bewegung (reduced) steht gleich FELIKS da.
const HERO_POSE = {
  F: [-4, 0.02, 1], E: [4, 0.1, 0.9], L: [-3, -0.02, 1], I: [6, 0.06, 0.96], K: [3, 0.04, 0.95], S: [-5, 0.08, 0.92], X: [-4, 0.0, 1.08],
};
function letterHTML(ch, extra = '') {
  const [r, y, s] = HERO_POSE[ch];
  return `<span class="ltr ${extra}" data-ch="${ch}"><span class="pose" style="--r:${r}deg;--y:${y * 100}%;--s:${s}">${glyphSVG(ch)}</span></span>`;
}
function buildWordmark() {
  const box = $('.wordmark .letters');
  if (reduced) {
    box.innerHTML = ['F', 'E', 'L', 'I', 'K', 'S'].map((c) => letterHTML(c)).join('');
    return;
  }
  // .new = K und S zusammen in einer Hülle (liegt zuerst unsichtbar über dem X)
  box.innerHTML = ['F', 'E', 'L', 'I'].map((c) => letterHTML(c)).join('')
    + `<span class="swap">${letterHTML('X', 'old')}<span class="new">${letterHTML('K')}${letterHTML('S')}</span></span>`;
  playIntro();
}

function playIntro() {
  const box = $('.wordmark .letters');
  const ltrs = $$('.ltr', box);
  const swap = $('.swap', box);
  const olds = $$('.old', box);
  const x = $('.new', box);                 // Hülle mit K + S (Name „x“ von früher: das, was neu hineinspringt)
  const news = $$('.ltr', x);
  const dropIn = (el, delay) => el.animate([
    { transform: 'translateY(-120%) rotate(-14deg)', opacity: 0 },
    { transform: 'translateY(9%) rotate(4deg) scaleY(.86)', opacity: 1, offset: 0.55 },
    { transform: 'translateY(-6%) rotate(-2deg) scaleY(1.04)', offset: 0.78 },
    { transform: 'none', opacity: 1 },
  ], { duration: 760, delay, easing: 'cubic-bezier(.3,.7,.4,1)', fill: 'backwards' });

  x.style.opacity = '0';
  ltrs.filter((l) => !x.contains(l)).forEach((l, i) => dropIn(l, 120 + i * 95));

  setTimeout(() => {
    // das X fällt ab, K und S springen hinein
    const wOld = swap.getBoundingClientRect().width;
    const wNew = x.getBoundingClientRect().width;
    swap.style.width = wOld + 'px';
    olds.forEach((o, i) => o.animate([
      { transform: 'none', opacity: 1 },
      { transform: `translateY(-14%) rotate(${i ? 8 : -8}deg)`, opacity: 1, offset: 0.25 },
      { transform: `translateY(150%) rotate(${i ? 50 : -38}deg)`, opacity: 0 },
    ], { duration: 650, delay: i * 70, easing: 'cubic-bezier(.5,0,.8,.5)', fill: 'forwards' }));
    requestAnimationFrame(() => {
      swap.style.transition = 'width .55s cubic-bezier(.5,1.6,.5,1) .3s';
      swap.style.width = wNew + 'px';
    });
    setTimeout(() => {
      x.style.opacity = '';
      news.forEach((l, i) => dropIn(l, i * 70));
    }, 420);
    setTimeout(() => {
      olds.forEach((o) => o.remove());
      x.replaceWith(...news);               // Hülle auflösen: K und S stehen jetzt ganz normal im Wort
      swap.style.width = '';
      swap.style.transition = '';
    }, 1300);
  }, 1900);
}

/* ---------- Wackeln bei Hover ---------- */
function jelly(el) {
  if (reduced || el.getAnimations().some((a) => a.id === 'jelly')) return;
  const a = el.animate([
    { transform: 'none' },
    { transform: 'scale(1.12, .86) rotate(-6deg)', offset: 0.25 },
    { transform: 'scale(.92, 1.1) rotate(5deg)', offset: 0.5 },
    { transform: 'scale(1.04, .97) rotate(-2deg)', offset: 0.75 },
    { transform: 'none' },
  ], { duration: 620, easing: 'ease-out', composite: 'add' });
  a.id = 'jelly';
}
function bindLetterHover() {
  $$('.bl').forEach((el) => el.addEventListener('pointerenter', () => jelly(el)));
}

/* ---------- Scroll-Wackeln: Buchstaben neigen sich mit der Scroll-Geschwindigkeit ---------- */
function scrollWobble() {
  if (reduced) return;
  let lastY = scrollY, v = 0, a = 0, av = 0, raf = 0;
  const loop = () => {
    raf = 0;
    const y = scrollY;
    const dv = y - lastY; lastY = y;
    v += (dv - v) * 0.3;
    const target = Math.max(-14, Math.min(14, v * 0.35));
    av = (av + (target - a) * 0.12) * 0.8; a += av;
    document.documentElement.style.setProperty('--wob', a.toFixed(2));
    if (Math.abs(a) + Math.abs(av) + Math.abs(v) > 0.02) raf = requestAnimationFrame(loop);
    else document.documentElement.style.setProperty('--wob', '0');
  };
  addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(loop); }, { passive: true });
}

/* ---------- Funkelsterne, wo man klickt ---------- */
function sparklePops() {
  if (reduced) return;
  const layer = $('.pops');
  const COLORS = ['#ffd9ab', '#fffaf2', '#4b1c05', '#ff6a0d'];
  document.addEventListener('pointerdown', (e) => {
    if (e.button !== 0 || e.target.closest('a, button, input, .sticker')) return;
    const n = 6;
    for (let i = 0; i < n; i++) {
      const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      s.innerHTML = '<use href="#spark"/>';
      const size = i === 0 ? 46 : 14 + Math.random() * 22;
      s.setAttribute('width', size); s.setAttribute('height', size);
      s.style.left = e.clientX - size / 2 + 'px';
      s.style.top = e.clientY - size / 2 + 'px';
      s.style.fill = i === 0 ? COLORS[0] : COLORS[i % COLORS.length];
      layer.append(s);
      const ang = (i / n) * Math.PI * 2 + Math.random() * 0.6;
      const dist = i === 0 ? 0 : 40 + Math.random() * 50;
      s.animate([
        { transform: 'translate(0,0) scale(0) rotate(0deg)', opacity: 1 },
        { transform: `translate(${Math.cos(ang) * dist * 0.8}px, ${Math.sin(ang) * dist * 0.8}px) scale(1.15) rotate(45deg)`, opacity: 1, offset: 0.45 },
        { transform: `translate(${Math.cos(ang) * dist}px, ${Math.sin(ang) * dist + 14}px) scale(0) rotate(90deg)`, opacity: 0 },
      ], { duration: 720 + Math.random() * 200, easing: 'cubic-bezier(.2,.8,.3,1)' }).onfinish = () => s.remove();
    }
  });
}

/* ---------- Klicks: Sprache, Kopieren ---------- */
let toastT = 0;
function toast(msg) {
  const t = $('.toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastT);
  toastT = setTimeout(() => t.classList.remove('show'), 2200);
}
document.addEventListener('click', async (e) => {
  const lb = e.target.closest('.lang-btn');
  if (lb) {
    const keepFocus = lb.closest('.lang') === $('.hero .lang') ? '.hero' : '.foot';
    setLang(lb.dataset.lang);
    $(`${keepFocus} .lang-btn[data-lang="${lb.dataset.lang}"]`)?.focus();
    return;
  }
  const cb = e.target.closest('.copy-btn');
  if (cb) {
    try {
      await navigator.clipboard.writeText(cb.dataset.copy);
      cb.textContent = UI[lang].copied;
      toast(UI[lang].copiedToast);
      setTimeout(() => { cb.textContent = UI[lang].copy; }, 2000);
    } catch {
      toast(UI[lang].copyFail);
    }
  }
});

/* ---------- Sticker ---------- */
async function stickers() {
  const dpr = Math.min(2, devicePixelRatio || 1);
  const heroEl = $('.sticker-hero');
  const heroW = Math.round(Math.min(1500, heroEl.getBoundingClientRect().width * dpr * 1.05));
  // Hero: unten rund abschneiden (das Foto endet gerade) – wie der Blob-Ausschnitt auf dem Poster
  const hero = await makeSticker('/img/sony-dsc01805-person.webp', {
    width: Math.max(600, heroW), border: Math.round(Math.max(600, heroW) * 0.026), seed: 3,
    mask: (c, w, h, p) => { c.rect(p, p, w, h * 0.55); c.ellipse(p + w * 0.5, p + h * 0.52, w * 0.5, h * 0.47, 0, 0, Math.PI * 2); },
  });
  const h = mountSticker(heroEl, hero, { liftTilt: -5 });
  heroEl.classList.add('ready');
  if (!reduced) heroEl.animate([
    { transform: 'translateY(60px) rotate(8deg) scale(.7)', opacity: 0 },
    { transform: 'translateY(-12px) rotate(-3deg) scale(1.04)', opacity: 1, offset: 0.6 },
    { transform: 'none', opacity: 1 },
  ], { duration: 820, easing: 'cubic-bezier(.3,.7,.4,1)', composite: 'add' });
  void h;

  const later = async () => {
    const selfieEl = $('.sticker-selfie');
    const sw = Math.round(Math.min(1100, selfieEl.getBoundingClientRect().width * dpr * 1.05)) || 800;
    const selfie = await makeSticker('/img/hero-img_2183-person.webp', {
      width: Math.max(500, sw), border: Math.round(Math.max(500, sw) * 0.03), seed: 11,
      mask: (c, w, hh, p) => { c.ellipse(p + w * 0.46, p + hh * 0.5, w * 0.47, hh * 0.52, 0, 0, Math.PI * 2); },
    });
    mountSticker(selfieEl, selfie, { liftTilt: 5 });
    selfieEl.classList.add('ready');

    const walkEl = $('.sticker-walk');
    const ww = Math.round(Math.min(800, walkEl.getBoundingClientRect().width * dpr * 1.05)) || 500;
    const walk = await makeSticker('/img/hero-dsc05325-person.webp', { width: Math.max(360, ww), border: Math.round(Math.max(360, ww) * 0.05), seed: 5, cornerFrom: [1, 0.62] });
    mountSticker(walkEl, walk, { liftTilt: 6, hoverFold: 0.06 });
    walkEl.classList.add('ready');
  };
  (window.requestIdleCallback || setTimeout)(later, { timeout: 800 });
}

/* ---------- Hintergrund: Reihen aus Umriss-Wörtern ---------- */
function outlineRows() {
  $$('.outline-rows').forEach((box) => {
    const w = box.dataset.word;
    const row = Array(6).fill(w).join(' ');
    box.innerHTML = Array.from({ length: 7 }, (_, i) => `<span class="orow" style="--i:${i}">${row}</span>`).join('');
  });
}

/* ---------- Start ---------- */
document.documentElement.lang = lang;
outlineRows();
render();
buildWordmark();
scrollWobble();
sparklePops();
stickers().catch((err) => console.warn('Sticker konnte nicht geladen werden', err));
$('.wordmark').addEventListener('pointerenter', () => $$('.wordmark .ltr').forEach((l, i) => setTimeout(() => jelly(l), i * 60)));

if (import.meta.env.DEV) { const { addSwitch } = await import('/shared/switch.js'); addSwitch('v-meow'); }
