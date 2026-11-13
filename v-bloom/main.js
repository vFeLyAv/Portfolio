// v-bloom — Portfolio von Feliks im Stil des Plakats „In Bloom“:
// cremefarbenes Papier, riesige schmale Antiqua-Buchstaben, ein Strauß aus Code-Blumen davor.
import * as de from '/shared/data.js';
import * as en from '/shared/data.en.js';
import * as ru from '/shared/data.ru.js';
import { Garden, PAL, clamp } from './flora.js';

const DATA = { de, en, ru };
const LANGS = ['de', 'en', 'ru'];
const LANG_KEY = 'v-bloom-lang';
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

/* ------------------------------------------------------------------ Texte der Oberfläche */
const UI = {
  de: {
    title: 'Feliks Kolomoiets · Portfolio', desc: 'Portfolio und Lebenslauf von Feliks (Felix) Kolomoiets aus Regensburg.',
    skip: 'Zum Inhalt springen', langGroup: 'Sprache', tagline: 'Portfolio & Lebenslauf', scroll: 'Scrollen', region: ['Regensburg', 'Bayern'], month: 'Nov',
    about: 'Über mich', facts: 'Ein paar Dinge über mich', portraitAlt: 'Feliks im hellen Anzug mit Fliege',
    projects: 'Projekte', open: 'bunprise.de öffnen', newTab: '(öffnet in neuem Tab)',
    alt: { bunprise: 'Startbild der Web-App Bunprise mit dem Hasen-Maskottchen', site: 'Tiefenkarte eines Fotos von Feliks, lokal mit KI berechnet', mc: 'In Blender gerenderte Minecraft-Szene' },
    certs: 'Zertifikate', earned: 'erhalten', planned: 'in Arbeit', issued: 'Ausgestellt am', verify: 'Echtheit prüfen', pdf: 'PDF ansehen', course: 'Zum Kurs', certAlt: (t) => `Zertifikat „${t}“`,
    cv: 'Lebenslauf', school: 'Schule', practice: 'Praxis', skills: 'Kenntnisse', languages: 'Sprachen', documents: 'Dokumente', follows: 'folgt',
    contact: 'Kontakt', lead: 'Ich freue mich über Ihre Nachricht.', email: 'E-Mail', copy: 'E-Mail kopieren', copied: 'Kopiert', copyFail: 'Kopieren nicht möglich, bitte markieren', insta: 'Instagram',
    foot: 'Feliks Kolomoiets, Regensburg 2026',
  },
  en: {
    title: 'Feliks Kolomoiets · Portfolio', desc: 'Portfolio and CV of Feliks (Felix) Kolomoiets from Regensburg, Germany.',
    skip: 'Skip to content', langGroup: 'Language', tagline: 'Portfolio & CV', scroll: 'Scroll', region: ['Regensburg', 'Bavaria'], month: 'Nov',
    about: 'About me', facts: 'A few things about me', portraitAlt: 'Feliks in a light suit with a bow tie',
    projects: 'Projects', open: 'Open bunprise.de', newTab: '(opens in a new tab)',
    alt: { bunprise: 'Start screen of the Bunprise web app with its bunny mascot', site: 'Depth map of a photo of Feliks, computed locally with AI', mc: 'Minecraft scene rendered in Blender' },
    certs: 'Certificates', earned: 'earned', planned: 'in progress', issued: 'Issued', verify: 'Verify certificate', pdf: 'View PDF', course: 'Go to course', certAlt: (t) => `Certificate “${t}”`,
    cv: 'CV', school: 'School', practice: 'Practical experience', skills: 'Skills', languages: 'Languages', documents: 'Documents', follows: 'coming soon',
    contact: 'Contact', lead: 'I look forward to hearing from you.', email: 'Email', copy: 'Copy email', copied: 'Copied', copyFail: 'Copy failed, please select the address', insta: 'Instagram',
    foot: 'Feliks Kolomoiets, Regensburg 2026',
  },
  ru: {
    title: 'Feliks Kolomoiets · портфолио', desc: 'Портфолио и резюме Feliks (Felix) Kolomoiets из Регенсбурга.',
    skip: 'Перейти к содержанию', langGroup: 'Язык', tagline: 'Портфолио и резюме', scroll: 'Листайте', region: ['Регенсбург', 'Бавария'], month: 'Нояб',
    about: 'Обо мне', facts: 'Немного обо мне', portraitAlt: 'Феликс в светлом костюме с бабочкой',
    projects: 'Проекты', open: 'Открыть bunprise.de', newTab: '(откроется в новой вкладке)',
    alt: { bunprise: 'Заставка веб-приложения Bunprise с кроликом-талисманом', site: 'Карта глубины фотографии Феликса, рассчитанная ИИ на компьютере', mc: 'Сцена из Minecraft, отрендеренная в Blender' },
    certs: 'Сертификаты', earned: 'получен', planned: 'в процессе', issued: 'Выдан', verify: 'Проверить подлинность', pdf: 'Открыть PDF', course: 'К курсу', certAlt: (t) => `Сертификат «${t}»`,
    cv: 'Резюме', school: 'Школа', practice: 'Практика', skills: 'Навыки', languages: 'Языки', documents: 'Документы', follows: 'скоро',
    contact: 'Контакт', lead: 'Буду рад вашему письму.', email: 'E-mail', copy: 'Скопировать e-mail', copied: 'Скопировано', copyFail: 'Не получилось, выделите адрес вручную', insta: 'Instagram',
    foot: 'Feliks Kolomoiets, Регенсбург 2026',
  },
};
const LEVEL = { Grundlagen: 1, gut: 2, fortgeschritten: 3, 'im Alltag': 3 };

function initialLang() {
  try {
    const q = new URLSearchParams(location.search).get('lang');
    if (LANGS.includes(q)) return q;
    const saved = localStorage.getItem(LANG_KEY);
    if (LANGS.includes(saved)) return saved;
  } catch { /* privater Modus */ }
  const nav = (navigator.language || 'de').toLowerCase();
  return nav.startsWith('de') ? 'de' : nav.startsWith('ru') || nav.startsWith('uk') ? 'ru' : nav.startsWith('en') ? 'en' : 'de';
}
let lang = initialLang();

/* ------------------------------------------------------------------ Hilfen */
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const ext = (href, label, cls = '') => `<a class="${cls}" href="${esc(href)}" target="_blank" rel="noopener">${label}<span class="sr-only"> ${esc(UI[lang].newTab)}</span></a>`;
const lbl = (o, key = 'level') => o.label || o[key];
const dots = (n) => `<span class="dots" aria-hidden="true">${[1, 2, 3].map((i) => `<i class="${i <= n ? 'on' : ''}"></i>`).join('')}</span>`;

/* ------------------------------------------------------------------ Inhalte */
function render() {
  const t = UI[lang], d = DATA[lang];
  document.documentElement.lang = lang;
  document.title = t.title;
  $('meta[name="description"]').setAttribute('content', t.desc);
  $('.skip').textContent = t.skip;
  $$('[data-ui]').forEach((el) => { el.textContent = t[el.dataset.ui]; });
  $$('.langs').forEach((g) => g.setAttribute('aria-label', t.langGroup));
  $$('.langs button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lang === lang)));
  $('#region').innerHTML = t.region.map(esc).join('<br>');

  // Überschriften (riesige schmale Buchstaben)
  $$('[data-title]').forEach((h) => { h.dataset.text = t[h.dataset.title]; });

  // Über mich
  $('#aboutText').innerHTML = d.about.map((p) => `<p>${esc(p)}</p>`).join('');
  $('#portrait').alt = t.portraitAlt;
  $('#factsList').innerHTML = d.facts.map((f) => `<li><h4>${esc(f.title)}</h4><p>${esc(f.text)}</p></li>`).join('');

  // Projekte (Bunprise groß, Website, Minecraft klein und zuletzt)
  const [bun, site, mc] = d.projects;
  $('#projects').innerHTML = `
    <article class="proj proj--lead">
      <figure class="proj__img frame"><img src="${esc(bun.img)}" alt="${esc(t.alt.bunprise)}" width="1200" height="630" loading="lazy"></figure>
      <div class="proj__text">
        <p class="caps">${esc(bun.when)}</p>
        <h3 class="proj__title tall" data-text="${esc(bun.title)}">${esc(bun.title)}</h3>
        <p>${esc(bun.text)}</p>
        ${ext(bun.url, esc(t.open), 'btn')}
      </div>
    </article>
    <article class="proj proj--site">
      <figure class="proj__img frame"><img src="${esc(site.img)}" alt="${esc(t.alt.site)}" width="1214" height="1800" loading="lazy"></figure>
      <div class="proj__text">
        <p class="caps">${esc(site.when)}</p>
        <h3 class="proj__title tall" data-text="${esc(site.title)}">${esc(site.title)}</h3>
        <p>${esc(site.text)}</p>
      </div>
    </article>
    <article class="proj proj--small">
      <figure class="proj__img frame"><img src="${esc(mc.img)}" alt="${esc(t.alt.mc)}" width="1600" height="1200" loading="lazy"></figure>
      <div class="proj__text">
        <p class="caps">${esc(mc.when)}</p>
        <h3 class="proj__title proj__title--sm tall" data-text="${esc(mc.title)}">${esc(mc.title)}</h3>
        <p>${esc(mc.text)}</p>
      </div>
    </article>`;

  // Zertifikate
  const got = d.certificates.filter((c) => c.status === 'erhalten');
  const wip = d.certificates.filter((c) => c.status !== 'erhalten');
  $('#certs').innerHTML = `
    <div class="certs__got">${got.map((c) => `
      <article class="cert">
        <figure class="frame"><img src="${esc(c.img)}" alt="${esc(t.certAlt(c.title))}" width="1584" height="1080" loading="lazy"></figure>
        <p class="caps">${esc(c.issuer)}</p>
        <h3 class="cert__title">${esc(c.title)}</h3>
        <p class="cert__meta"><span class="status status--got">${esc(lang === 'de' ? t.earned : lbl(c, 'status'))}</span> ${esc(t.issued)} ${esc(c.date)}</p>
        <p class="cert__links">${ext(c.url, esc(t.verify), 'btn')} ${ext(c.pdf, esc(t.pdf), 'link')}</p>
      </article>`).join('')}
    </div>
    <ul class="certs__wip">${wip.map((c) => `
      <li>
        <span class="status">${esc(lang === 'de' ? t.planned : lbl(c, 'status'))}</span>
        <h3 class="cert__title">${esc(c.title)}</h3>
        <p class="caps">${esc(c.issuer)}</p>
        ${ext(c.url, esc(t.course), 'link')}
      </li>`).join('')}
    </ul>`;

  // Lebenslauf (neueste zuerst — so stehen die Daten schon sortiert in data.js)
  const rows = (list) => list.map((r) => `<li><span class="when">${esc(r.when)}</span><div><h4>${esc(r.what)}</h4><p>${esc(r.detail)}</p></div></li>`).join('');
  $('#cv').innerHTML = `
    <div class="cv__col"><h3 class="cv__h">${esc(t.school)}</h3><ol class="timeline">${rows(d.school)}</ol></div>
    <div class="cv__col"><h3 class="cv__h">${esc(t.practice)}</h3><ol class="timeline">${rows(d.practice)}</ol></div>
    <div class="cv__col cv__col--skills"><h3 class="cv__h">${esc(t.skills)}</h3>
      ${d.skills.map((g) => `<div class="skillgroup"><p class="caps">${esc(g.group)}</p><ul>${g.items.map((s) => `<li><span>${esc(s.what)}</span><span class="lvl">${dots(LEVEL[s.level] || 1)}${esc(lbl(s))}</span></li>`).join('')}</ul></div>`).join('')}
    </div>
    <div class="cv__col"><h3 class="cv__h">${esc(t.languages)}</h3>
      <ul class="plain">${d.languages.map((l) => `<li><span>${esc(l.lang)}</span><span class="lvl">${esc(lbl(l))}</span></li>`).join('')}</ul>
      <h3 class="cv__h cv__h--docs">${esc(t.documents)}</h3>
      <ul class="plain docs">${d.documents.map((x) => `<li><span>${esc(x.title)}<small>${esc(x.when)}</small></span><span class="lvl lvl--soon">${esc(x.label || t.follows)}</span></li>`).join('')}</ul>
    </div>`;

  // Kontakt
  const c = d.contact;
  $('#mail').href = `mailto:${c.email}`;
  $('#mail').textContent = c.email;
  $('#copy').textContent = t.copy;
  $('#insta').href = `https://www.instagram.com/${c.instagram}/`;
  $('#insta').innerHTML = `@${esc(c.instagram)}<span class="sr-only"> ${esc(t.newTab)}</span>`;
  $('#handle').textContent = `@${c.instagram}`;
}

/* ------------------------------------------------------------------ hohe, schmale Buchstaben */
// Bodoni Moda (Latein) / Playfair Display (Kyrillisch), waagerecht gestaucht wie die Plakatschrift.
const FAMILY = '"Bodoni Moda", "Playfair Display", serif';
const metricCache = new Map();
function metrics(cyr) {
  const key = cyr ? 'c' : 'l';
  if (metricCache.has(key)) return metricCache.get(key);
  const c = document.createElement('canvas').getContext('2d');
  c.font = `900 200px ${FAMILY}`;
  const m = c.measureText(cyr ? 'НЕЖ' : 'HEI');
  const r = { cap: m.actualBoundingBoxAscent / 200, asc: (m.fontBoundingBoxAscent || 180) / 200, desc: (m.fontBoundingBoxDescent || 50) / 200 };
  metricCache.set(key, r);
  return r;
}
// setzt Schriftgröße so, dass Großbuchstaben genau capPx hoch sind, und liefert den Versatz zur Grundlinie
function sizeFor(capPx, cyr) {
  const m = metrics(cyr);
  const F = capPx / m.cap;
  const half = (F - (m.asc + m.desc) * F) / 2;
  return { F, top: -(half + m.asc * F - capPx) };
}

function fitTall(h, maxW, maxCap, kMin = 0.36, kMax = 0.58) {
  const text = (h.dataset.text || '').toUpperCase();
  const cyr = /[Ѐ-ӿ]/.test(text);
  let inner = h.querySelector('.tall__in');
  if (!inner) { h.textContent = ''; inner = document.createElement('span'); inner.className = 'tall__in'; h.append(inner); }
  if (inner.textContent !== text) inner.textContent = text;
  let cap = maxCap;
  let { F, top } = sizeFor(cap, cyr);
  inner.style.fontSize = F + 'px';
  let nat = inner.offsetWidth;
  let k = clamp(maxW / nat, kMin, kMax);
  if (nat * k > maxW) {
    cap *= maxW / (nat * k);
    ({ F, top } = sizeFor(cap, cyr));
    inner.style.fontSize = F + 'px';
    nat = inner.offsetWidth;
  }
  inner.style.top = top + 'px';
  inner.style.transform = `scaleX(${k})`;
  h.style.width = nat * k + 'px';
  h.style.height = cap + 'px';
  h.setAttribute('aria-label', h.dataset.text);
  return { k, cap };
}

/* ------------------------------------------------------------------ Held: FELIX → FELIKS */
// Start: „FELIX“ (so sagen viele), dann wächst die richtige Schreibweise „FELIKS“ heraus.
const hero = $('.hero');
const nameEl = $('#heroName');
const felix = $('#felix');
const LETTERS = ['F', 'E', 'L', '|', 'I', 'X', 'K', 'S'];
const geom = { fx: 0, desk: true, w: {} };
let morphed = false;

function buildName() {
  nameEl.innerHTML = LETTERS.map((ch) => ch === '|'
    ? '<span class="gap"></span>'
    : `<span class="lt${ch === 'K' || ch === 'S' ? ' is-off' : ''}" data-ch="${ch}"><span class="lt__in">${ch}</span></span>`).join('');
  $('.gap', nameEl).append(felix);
}

function layoutHero() {
  const W = hero.clientWidth, H = hero.clientHeight;
  const desk = W >= 760 && W / H > 0.95;
  geom.desk = desk;
  hero.classList.toggle('is-desk', desk);
  const margin = Math.max(16, Math.min(W * 0.032, 64));
  const aspect = (felix.naturalWidth || 542) / (felix.naturalHeight || 1606);
  let fh = H * 1.06;
  const fw = fh * aspect;
  let felixTop = H * 0.04;
  const gapW = desk ? fw * 0.8 : 0;
  let cap = desk ? H * 0.47 : Math.min(H * 0.3, W * 0.62);
  const avail = W - margin * 2;
  let { F, top } = sizeFor(cap, false);
  const lts = $$('.lt', nameEl);
  const ins = lts.map((l) => l.firstChild);
  const measure = () => { ins.forEach((i) => { i.style.fontSize = F + 'px'; }); return ins.map((i) => i.offsetWidth); };
  let nat = measure();
  const sumOf = (chs) => chs.reduce((s, ch) => s + nat[lts.findIndex((l) => l.dataset.ch === ch)], 0);
  const full = sumOf(['F', 'E', 'L', 'I', 'K', 'S']);
  let k = (avail - gapW) / full;
  if (k > 0.56) k = 0.56;
  if (k < 0.4) { cap *= k / 0.4; k = 0.4; ({ F, top } = sizeFor(cap, false)); nat = measure(); }
  lts.forEach((l, i) => {
    geom.w[l.dataset.ch] = nat[i] * k;
    l.firstChild.style.top = top + 'px';
    l.firstChild.style.transform = `scaleX(${k})`;
  });
  nameEl.style.setProperty('--cap', cap + 'px');
  nameEl.style.setProperty('--gap', gapW + 'px');
  // Handy: Name oben wie ein Zeitschriftentitel, Felix steht davor
  const nameBottom = desk ? H * 0.17 : H - Math.max(92, H * 0.115) - cap;
  nameEl.style.bottom = nameBottom + 'px';
  if (!desk) { felixTop = H - nameBottom - cap * 0.42; fh = H - felixTop + H * 0.16; }
  // Felix steht in der Lücke, die Füße verschwinden im Strauß
  const offset = felixTop + fh - (H - nameBottom);
  felix.style.height = fh + 'px';
  felix.style.bottom = -offset + 'px';
  // Endposition (nach FELIKS) für den Strauß berechnen
  const finalW = sumOf(['F', 'E', 'L', 'I', 'K', 'S']) * k + gapW;
  const leftW = sumOf(['F', 'E', 'L']) * k;
  geom.fx = (W - finalW) / 2 + leftW + gapW / 2;
  geom.nameTop = H - nameBottom - cap;
  geom.nameBottom = H - nameBottom;
  geom.cap = cap;
  const tag = $('.print--tag');
  tag.style.top = H - nameBottom + Math.max(14, H * 0.024) + 'px';
  // Untertitel bleibt an der Kante von „FELIX“ (wie bisher), sonst stößt er links an „Regensburg“
  const felixW = sumOf(['F', 'E', 'L', 'I', 'X']) * k + gapW;
  tag.style.left = desk ? (W - felixW) / 2 + 'px' : '0px';
  tag.style.right = desk ? 'auto' : '0px';
  tag.style.textAlign = desk ? 'left' : 'center';
}

// Die Verwandlung läuft per JavaScript (nicht per CSS-Übergang), damit sie im Takt der Blumen bleibt.
// mst.p: 1 = FELIX (Start), 0 = FELIKS (Ende). Ohne Bewegung (reduced) steht gleich FELIKS da.
const mst = reduced ? { p: 0, from: 0, to: 0, t0: 0, done: false } : { p: 1, from: 1, to: 1, t0: 0, done: false };
function morph(on = true) {
  morphed = on;
  Object.assign(mst, { from: mst.p, to: on ? 1 : 0, t0: performance.now(), done: false });
}
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
function applyName(now, force = false) {
  if (mst.done && !force) return;
  const t = reduced ? 1 : clamp((now - mst.t0) / 1500);
  mst.p = mst.from + (mst.to - mst.from) * ease(t);
  if (t >= 1) mst.done = true;
  const p = mst.p;
  for (const l of $$('.lt', nameEl)) {
    const ch = l.dataset.ch, w = geom.w[ch] || 0;
    // p 1 → 0 (jetzt die Richtung beim Start): das X sinkt in den Strauß, K und S wachsen heraus
    let q = 0;
    if (ch === 'K') q = clamp(p * 1.25);
    else if (ch === 'S') q = clamp(p * 1.25 - 0.2);
    else if (ch === 'X') q = 1 - clamp(p * 1.3 - 0.3);
    l.style.width = w * (1 - ease(q)) + 'px';
    l.firstChild.style.translate = `0 ${q * 108}%`;
  }
}

/* ------------------------------------------------------------------ Blumen-Layouts */
function heroLayout(w, h) {
  const fx = geom.fx || w / 2;
  const items = [];
  const add = (o) => items.push(o);
  let petals;
  if (geom.desk) {
    const u = h, base = { x: fx, y: h * 1.32 }, bb = { x: fx, y: h * 1.25 };
    const below = (x, dx = 0) => ({ x: x + dx, y: h * 1.18 });
    // hinter den Buchstaben
    add({ layer: 'back', type: 'bud', pal: PAL.bud, R: u * 0.04, x: fx - w * 0.07, y: h * 0.09, base: bb, seed: 3, delay: 0.02, bend: -0.05 });
    add({ layer: 'back', type: 'gyp', R: u * 0.08, x: fx + w * 0.105, y: h * 0.3, base: bb, seed: 4, delay: 0.1 });
    add({ layer: 'back', type: 'gyp', R: u * 0.07, x: fx - w * 0.2, y: h * 0.31, base: bb, seed: 5, delay: 0.15 });
    add({ layer: 'back', type: 'anth', R: u * 0.13, x: fx - w * 0.165, y: h * 0.17, rot: -0.45, base: bb, seed: 6, delay: 0.0, bend: 0.12,
      leaves: [{ at: 0.45, ang: -0.8, L: u * 0.17, w: 0.26 }] });
    add({ layer: 'back', type: 'lily', pal: PAL.lilyFire, R: u * 0.12, x: fx + w * 0.175, y: h * 0.17, tilt: 0.72, face: 0.6, base: bb, seed: 7, delay: 0.06, bend: -0.12,
      leaves: [{ at: 0.5, ang: 0.9, L: u * 0.16 }] });
    add({ layer: 'back', type: 'bud', pal: PAL.bud, R: u * 0.045, x: fx + w * 0.085, y: h * 0.07, base: bb, seed: 8, delay: 0.1 });
    add({ layer: 'back', type: 'bud', pal: PAL.budPink, R: u * 0.04, x: fx + w * 0.27, y: h * 0.3, base: bb, seed: 9, delay: 0.14, bend: -0.2 });
    add({ layer: 'back', type: 'lily', pal: PAL.lilyPink, R: u * 0.1, x: fx - w * 0.255, y: h * 0.44, tilt: 0.8, face: -0.4, base: bb, seed: 10, delay: 0.12, bend: 0.2 });
    add({ layer: 'back', type: 'peony', pal: PAL.salmon, R: u * 0.12, x: fx + w * 0.215, y: h * 0.46, tilt: 0.82, face: 0.3, base: bb, seed: 11, delay: 0.08 });
    add({ layer: 'back', type: 'peony', pal: PAL.blush, R: u * 0.095, x: fx - w * 0.13, y: h * 0.5, tilt: 0.86, face: -0.2, base: bb, seed: 12, delay: 0.18 });
    add({ layer: 'back', type: 'peony', pal: PAL.coral, R: u * 0.105, x: fx - w * 0.33, y: h * 0.33, tilt: 0.8, face: 0.5, base: bb, seed: 13, delay: 0.1, bend: 0.25, leaves: [{ at: 0.62, ang: -1.0, L: u * 0.15 }] });
    add({ layer: 'back', type: 'bud', pal: PAL.bud, R: u * 0.035, x: fx - w * 0.27, y: h * 0.2, base: bb, seed: 14, delay: 0.16, bend: 0.2 });
    add({ layer: 'back', type: 'peony', pal: PAL.wine, R: u * 0.07, x: fx + w * 0.3, y: h * 0.6, tilt: 0.85, face: -0.4, base: bb, seed: 15, delay: 0.2, bend: -0.2 });
    // vor Felix' Beinen
    add({ layer: 'front', type: 'leaf', x: fx - w * 0.15, y: h * 1.02, ang: -1.0, L: u * 0.24, w: 0.24, seed: 20, delay: 0.05 });
    add({ layer: 'front', type: 'leaf', x: fx + w * 0.17, y: h * 1.03, ang: 0.95, L: u * 0.22, w: 0.24, curl: -0.1, seed: 21, delay: 0.08 });
    add({ layer: 'front', type: 'leaf', x: fx + w * 0.03, y: h * 1.04, ang: 0.25, L: u * 0.2, w: 0.2, seed: 22, delay: 0.1 });
    add({ layer: 'front', type: 'gyp', R: u * 0.075, x: fx + w * 0.055, y: h * 0.71, base: below(fx + w * 0.055, w * 0.02), seed: 23, delay: 0.2 });
    add({ layer: 'front', type: 'gyp', R: u * 0.06, x: fx - w * 0.12, y: h * 0.75, base: below(fx - w * 0.12, -w * 0.02), seed: 24, delay: 0.24 });
    add({ layer: 'front', type: 'bud', pal: PAL.bud, R: u * 0.05, x: fx + w * 0.16, y: h * 0.6, base: below(fx + w * 0.16, -w * 0.02), seed: 25, delay: 0.12, bend: -0.1 });
    add({ layer: 'front', type: 'peony', pal: PAL.wine, R: u * 0.07, x: fx - w * 0.15, y: h * 0.84, tilt: 0.86, face: 0.5, base: below(fx - w * 0.15, w * 0.03), seed: 26, delay: 0.1 });
    add({ layer: 'front', type: 'lily', pal: PAL.lilyPink, R: u * 0.115, x: fx + w * 0.12, y: h * 0.74, tilt: 0.68, face: -0.7, base: below(fx + w * 0.12, -w * 0.03), seed: 27, delay: 0.1,
      leaves: [{ at: 0.35, ang: 0.7, L: u * 0.14 }] });
    add({ layer: 'front', type: 'leaf', x: fx - w * 0.38, y: h * 1.02, ang: -0.6, L: u * 0.18, w: 0.24, seed: 31, delay: 0.1 });
    add({ layer: 'front', type: 'peony', pal: PAL.salmon, R: u * 0.08, x: fx - w * 0.33, y: h * 0.985, tilt: 0.82, face: 0.6, base: below(fx - w * 0.33, w * 0.02), seed: 32, delay: 0.22 });
    add({ layer: 'front', type: 'peony', pal: PAL.cream, R: u * 0.1, x: fx - w * 0.1, y: h * 0.95, tilt: 0.8, face: 0.4, base, seed: 28, delay: 0.2 });
    add({ layer: 'front', type: 'peony', pal: PAL.blush, R: u * 0.125, x: fx + w * 0.075, y: h * 0.91, tilt: 0.84, face: -0.3, base, seed: 29, delay: 0.14 });
    add({ layer: 'front', type: 'peony', pal: PAL.coral, R: u * 0.155, x: fx - w * 0.025, y: h * 0.86, tilt: 0.78, face: 0.15, base, seed: 30, delay: 0.04 });
    petals = [
      { x: 0.08, y: 0.97, L: u * 0.42, blur: 20, col: PAL.coral, ang: 0.55, depth: 60, seed: 1 },
      { x: 0.93, y: 0.62, L: u * 0.3, blur: 14, col: PAL.wine, ang: -2.3, depth: 45, seed: 2 },
      { x: 0.035, y: 0.5, L: u * 0.16, blur: 7, col: PAL.blush, ang: 1.25, depth: 25, seed: 3, alpha: 0.95 },
      { x: 0.66, y: 1.02, L: u * 0.2, blur: 10, col: PAL.wine, ang: -0.4, depth: 35, seed: 4 },
      { x: 0.44, y: 0.02, L: u * 0.17, blur: 12, col: PAL.blush, ang: 2.6, depth: 30, seed: 5, alpha: 0.9 },
      { x: 0.22, y: 0.78, L: u * 0.09, blur: 4, col: PAL.coral, ang: 0.9, depth: 18, seed: 6 },
      ...[0.3, 0.42, 0.62, 0.78, 0.86, 0.18, 0.52, 0.7, 0.1].map((x, i) => ({ fall: true, x, L: u * (0.026 + (i % 3) * 0.01), col: [PAL.coral, PAL.blush, PAL.wine, PAL.salmon][i % 4], ang: i * 1.3, spin: 4 + i, speed: 0.6 + (i % 3) * 0.25, start: i / 6, seed: i * 2.1 })),
    ];
  } else {
    const u = w, base = { x: fx, y: h * 1.25 }, bb = { x: fx, y: h * 1.2 };
    add({ layer: 'back', type: 'anth', R: u * 0.2, x: w * 0.2, y: h * 0.22, rot: -0.4, base: bb, seed: 6, bend: 0.1, leaves: [{ at: 0.5, ang: -0.8, L: u * 0.22 }] });
    add({ layer: 'back', type: 'lily', pal: PAL.lilyFire, R: u * 0.2, x: w * 0.82, y: h * 0.2, tilt: 0.72, face: 0.6, base: bb, seed: 7, delay: 0.06, bend: -0.1 });
    add({ layer: 'back', type: 'bud', pal: PAL.bud, R: u * 0.06, x: w * 0.66, y: h * 0.1, base: bb, seed: 8, delay: 0.1 });
    add({ layer: 'back', type: 'gyp', R: u * 0.12, x: w * 0.3, y: h * 0.4, base: bb, seed: 4, delay: 0.1 });
    add({ layer: 'front', type: 'leaf', x: w * 0.12, y: h * 1.02, ang: -0.9, L: u * 0.36, w: 0.24, seed: 20 });
    add({ layer: 'front', type: 'leaf', x: w * 0.9, y: h * 1.02, ang: 0.9, L: u * 0.34, w: 0.24, curl: -0.1, seed: 21 });
    add({ layer: 'front', type: 'gyp', R: u * 0.12, x: w * 0.62, y: h * 0.8, base, seed: 23, delay: 0.2 });
    add({ layer: 'front', type: 'lily', pal: PAL.lilyPink, R: u * 0.2, x: w * 0.84, y: h * 0.83, tilt: 0.68, face: -0.7, base, seed: 27, delay: 0.1 });
    add({ layer: 'front', type: 'peony', pal: PAL.cream, R: u * 0.18, x: w * 0.16, y: h * 0.95, tilt: 0.8, face: 0.4, base, seed: 28, delay: 0.2 });
    add({ layer: 'front', type: 'peony', pal: PAL.blush, R: u * 0.22, x: w * 0.7, y: h * 0.96, tilt: 0.84, face: -0.3, base, seed: 29, delay: 0.14 });
    add({ layer: 'front', type: 'peony', pal: PAL.coral, R: u * 0.27, x: w * 0.42, y: h * 0.92, tilt: 0.78, face: 0.15, base, seed: 30, delay: 0.04 });
    petals = [
      { x: 0.02, y: 0.62, L: u * 0.3, blur: 10, col: PAL.coral, ang: 1.2, depth: 0, seed: 1 },
      { x: 1.0, y: 0.45, L: u * 0.24, blur: 9, col: PAL.wine, ang: -2.3, depth: 0, seed: 2 },
      ...[0.25, 0.55, 0.8].map((x, i) => ({ fall: true, x, L: u * 0.05, col: [PAL.coral, PAL.blush, PAL.wine][i], ang: i, spin: 4 + i, speed: 0.7, start: i / 3, seed: i * 2.1 })),
    ];
  }
  return { items, petals };
}

// Sträuße an den Abschnitts-Überschriften. t = Rechteck der Überschrift im Canvas, c = Höhe der Großbuchstaben
const SECTION_FLORA = {
  about: (t, c, w) => {
    const r = Math.min(t.x + t.w, w - c * 0.75), b = { x: r + c * 0.1, y: t.y + c * 2.3 };
    return [
      { layer: 'back', type: 'lily', pal: PAL.lilyPink, R: c * 0.42, x: r + c * 0.1, y: t.y - c * 0.05, tilt: 0.74, face: -0.6, base: b, seed: 41, delay: 0.05, leaves: [{ at: 0.6, ang: 0.8, L: c * 0.4 }] },
      { layer: 'back', type: 'bud', pal: PAL.bud, R: c * 0.12, x: r - c * 0.55, y: t.y - c * 0.35, base: b, seed: 42, delay: 0.12 },
      { layer: 'front', type: 'gyp', R: c * 0.22, x: r - c * 0.35, y: t.y + c * 0.62, base: b, seed: 43, delay: 0.2 },
      { layer: 'front', type: 'peony', pal: PAL.coral, R: c * 0.5, x: r + c * 0.12, y: t.y + c * 0.82, tilt: 0.8, face: 0.2, base: b, seed: 44, delay: 0 },
      { layer: 'front', type: 'peony', pal: PAL.cream, R: c * 0.28, x: r + c * 0.62, y: t.y + c * 1.0, tilt: 0.84, face: -0.4, base: b, seed: 45, delay: 0.18 },
    ];
  },
  projects: (t, c) => {
    const l = Math.max(t.x, c * 0.45), b = { x: l + c * 0.3, y: t.y + c * 2.3 };
    return [
      { layer: 'back', type: 'anth', R: c * 0.48, x: l + c * 0.2, y: t.y + c * 0.05, rot: -0.35, base: b, seed: 51, delay: 0, leaves: [{ at: 0.55, ang: -0.9, L: c * 0.42 }] },
      { layer: 'back', type: 'bud', pal: PAL.budPink, R: c * 0.12, x: l + c * 0.95, y: t.y - c * 0.3, base: b, seed: 52, delay: 0.12 },
      { layer: 'front', type: 'peony', pal: PAL.salmon, R: c * 0.36, x: l - c * 0.05, y: t.y + c * 0.92, tilt: 0.82, face: 0.3, base: b, seed: 53, delay: 0.1 },
      { layer: 'front', type: 'gyp', R: c * 0.2, x: l + c * 0.6, y: t.y + c * 0.85, base: b, seed: 54, delay: 0.22 },
    ];
  },
  certs: (t, c, w) => {
    // Blüten wachsen hinter den Buchstaben hervor (wie über „BLOOM“ auf dem Plakat)
    const r = Math.min(t.x + t.w, w - c * 0.3), b = { x: r - c * 0.6, y: t.y + c * 2.3 };
    return [
      { layer: 'back', type: 'lily', pal: PAL.lilyFire, R: c * 0.4, x: r - c * 1.25, y: t.y - c * 0.22, tilt: 0.74, face: 0.5, base: b, seed: 61, delay: 0, leaves: [{ at: 0.55, ang: -0.9, L: c * 0.4 }] },
      { layer: 'back', type: 'peony', pal: PAL.blush, R: c * 0.32, x: r - c * 0.5, y: t.y - c * 0.12, tilt: 0.84, base: b, seed: 64, delay: 0.12 },
      { layer: 'back', type: 'bud', pal: PAL.bud, R: c * 0.1, x: r - c * 0.9, y: t.y - c * 0.6, base: b, seed: 63, delay: 0.15 },
      { layer: 'front', type: 'lily', pal: PAL.lilyPink, R: c * 0.26, x: r + c * 0.12, y: t.y + c * 0.95, tilt: 0.7, face: -0.5, base: b, seed: 62, delay: 0.1 },
    ];
  },  cv: (t, c, w) => {
    const r = Math.min(t.x + t.w, w - c * 0.7), b = { x: r + c * 0.1, y: t.y + c * 2.3 };
    return [
      { layer: 'back', type: 'peony', pal: PAL.wine, R: c * 0.28, x: r - c * 0.55, y: t.y + c * 0.05, tilt: 0.84, face: 0.2, base: b, seed: 71, delay: 0.1, leaves: [{ at: 0.55, ang: -0.9, L: c * 0.36 }] },
      { layer: 'back', type: 'gyp', R: c * 0.22, x: r + c * 0.15, y: t.y - c * 0.1, base: b, seed: 72, delay: 0.2 },
      { layer: 'front', type: 'peony', pal: PAL.blush, R: c * 0.46, x: r + c * 0.38, y: t.y + c * 0.82, tilt: 0.8, face: -0.2, base: b, seed: 73, delay: 0 },
      { layer: 'front', type: 'bud', pal: PAL.budPink, R: c * 0.12, x: r - c * 0.35, y: t.y + c * 0.5, base: b, seed: 74, delay: 0.15 },
    ];
  },
  contact: (t, c, w) => {
    const l = Math.max(t.x, c * 0.45), r = Math.min(t.x + t.w, w - c * 0.45);
    const bl = { x: l, y: t.y + c * 2.4 }, br = { x: r, y: t.y + c * 2.4 };
    return [
      { layer: 'back', type: 'anth', R: c * 0.42, x: r + c * 0.15, y: t.y - c * 0.05, rot: 0.4, base: br, seed: 81, delay: 0.05, leaves: [{ at: 0.5, ang: 0.9, L: c * 0.4 }] },
      { layer: 'back', type: 'lily', pal: PAL.lilyFire, R: c * 0.38, x: l + c * 0.2, y: t.y - c * 0.1, tilt: 0.72, face: -0.5, base: bl, seed: 82, delay: 0.08 },
      { layer: 'front', type: 'gyp', R: c * 0.22, x: l + c * 0.75, y: t.y + c * 0.8, base: bl, seed: 83, delay: 0.2 },
      { layer: 'front', type: 'peony', pal: PAL.coral, R: c * 0.48, x: l - c * 0.05, y: t.y + c * 0.85, tilt: 0.8, face: 0.2, base: bl, seed: 84, delay: 0 },
      { layer: 'front', type: 'peony', pal: PAL.salmon, R: c * 0.38, x: r - c * 0.15, y: t.y + c * 0.95, tilt: 0.82, face: -0.3, base: br, seed: 85, delay: 0.1 },
      { layer: 'front', type: 'lily', pal: PAL.lilyPink, R: c * 0.32, x: r + c * 0.4, y: t.y + c * 0.5, tilt: 0.7, face: -0.6, base: br, seed: 86, delay: 0.15 },
    ];
  },
};

/* ------------------------------------------------------------------ Gärten anlegen */
const gardens = [];
let heroStart = 0;

function scrollProgress(el, from = 1, to = 0.42) {
  return () => {
    if (reduced) return 1;
    const r = el.getBoundingClientRect(), vh = innerHeight;
    return clamp((vh * from - r.top) / (vh * (from - to)));
  };
}

function setupGardens() {
  const heroG = new Garden({
    canvases: { back: $('.hero__cv--back'), front: $('.hero__cv--front') },
    layout: heroLayout,
    progress: () => (reduced ? 1 : heroStart ? clamp((performance.now() - heroStart) / 2800) : 0),
    still: reduced,
    dprMax: 1.75,
  });
  heroG.el = hero;
  gardens.push(heroG);

  $$('.sec').forEach((sec) => {
    const head = $('.sec__head', sec);
    const h2 = $('.tall', head);
    const kind = h2.dataset.title;
    const front = $('.sec__flora--front', head), back = $('.sec__flora--back', head);
    const g = new Garden({
      canvases: { back, front },
      layout: (w, h) => {
        const cr = front.getBoundingClientRect(), tr = h2.getBoundingClientRect();
        const t = { x: tr.left - cr.left, y: tr.top - cr.top, w: tr.width, h: tr.height };
        return { items: SECTION_FLORA[kind](t, tr.height, w, h) };
      },
      progress: scrollProgress(head),
      still: reduced,
    });
    g.el = head;
    gardens.push(g);
  });

  // kleine Pfingstrose an der Ecke des Porträts
  const pf = $('#portraitFlora');
  if (pf) {
    const g = new Garden({
      canvases: { front: pf },
      layout: (w, h) => {
        const c = Math.min(w, h);
        const b = { x: w * 0.5, y: h * 1.2 };
        return { items: [
          { type: 'leaf', x: w * 0.72, y: h * 0.98, ang: 0.55, L: c * 0.34, w: 0.24, curl: -0.1, seed: 91 },
          { type: 'bud', pal: PAL.bud, R: c * 0.07, x: w * 0.4, y: h * 0.36, base: b, seed: 92, delay: 0.12 },
          { type: 'peony', pal: PAL.blush, R: c * 0.19, x: w * 0.32, y: h * 0.68, tilt: 0.84, face: -0.3, base: b, seed: 93, delay: 0.1 },
          { type: 'peony', pal: PAL.coral, R: c * 0.25, x: w * 0.6, y: h * 0.74, tilt: 0.8, face: 0.3, base: b, seed: 94, delay: 0 },
        ] };
      },
      progress: scrollProgress(pf, 1, 0.5),
      still: reduced,
    });
    g.el = pf;
    gardens.push(g);
  }

  const io = new IntersectionObserver((ents) => {
    for (const e of ents) { const g = gardens.find((x) => x.el === e.target); if (g) { g.visible = e.isIntersecting; g.dirty = true; } }
  }, { rootMargin: '200px 0px' });
  gardens.forEach((g) => io.observe(g.el));
}

let last = performance.now();
let introDone = false;
function tick(now) {
  const dt = now - last;
  last = now;
  applyName(now);
  if (heroStart && !introDone) {
    const t = reduced ? 1 : clamp((now - heroStart) / 900);
    felix.style.opacity = t;
    felix.style.translate = `-50% ${(1 - ease(t)) * 3}%`;
    if (t >= 1) introDone = true;
  }
  for (const g of gardens) if (g.visible) g.frame(now, dt);
  requestAnimationFrame(tick);
}

/* ------------------------------------------------------------------ Größe, Sprache, Kopieren */
function layoutAll() {
  layoutHero();
  applyName(performance.now(), true);
  const W = document.documentElement.clientWidth, H = innerHeight;
  const desk = W >= 760;
  $$('.sec .tall').forEach((h) => {
    const maxW = h.parentElement.clientWidth;
    fitTall(h, maxW, desk ? Math.min(H * 0.3, W * 0.16) : Math.min(H * 0.14, W * 0.26));
  });
  $$('.proj__title').forEach((h) => {
    const sm = h.classList.contains('proj__title--sm');
    fitTall(h, h.parentElement.clientWidth, desk ? (sm ? 64 : Math.min(H * 0.12, 124)) : (sm ? 46 : 70), 0.4, 0.62);
  });
  gardens.forEach((g) => g.resize());
}

function setLang(l, save = true) {
  if (!LANGS.includes(l) || (l === lang && document.documentElement.dataset.ready)) return;
  lang = l;
  if (save) { try { localStorage.setItem(LANG_KEY, l); } catch { /* egal */ } }
  try { const u = new URL(location.href); if (u.searchParams.has('lang')) { u.searchParams.set('lang', l); history.replaceState(null, '', u); } } catch { /* egal */ }
  render();
  layoutAll();
}

document.addEventListener('click', (e) => {
  const b = e.target.closest('.langs button');
  if (b) setLang(b.dataset.lang);
});

$('#copy').addEventListener('click', async () => {
  const t = UI[lang], btn = $('#copy'), email = DATA[lang].contact.email;
  let ok = false;
  try { await navigator.clipboard.writeText(email); ok = true; } catch {
    const r = document.createRange(); r.selectNodeContents($('#mail'));
    const s = getSelection(); s.removeAllRanges(); s.addRange(r);
    try { ok = document.execCommand('copy'); } catch { ok = false; }
  }
  btn.textContent = ok ? t.copied : t.copyFail;
  btn.classList.toggle('is-done', ok);
  $('#copyStatus').textContent = ok ? t.copied : t.copyFail;
  clearTimeout(btn._t);
  btn._t = setTimeout(() => { btn.textContent = UI[lang].copy; btn.classList.remove('is-done'); }, 2200);
});

/* ------------------------------------------------------------------ Start */
buildName();
render();
document.documentElement.dataset.ready = '1';
// Schriften ausdrücklich laden (sonst misst die Seite mit der Ersatzschrift)
await Promise.race([
  Promise.all([
    document.fonts.load('900 100px "Bodoni Moda"', 'FELIKSX'),
    document.fonts.load('400 44px "Bodoni Moda"', '2026'),
    document.fonts.load('italic 500 40px "Bodoni Moda"', 'Ab'),
    document.fonts.load('900 100px "Playfair Display"', 'ОБОМНЕ'),
    document.fonts.load('400 20px "EB Garamond"', 'Aa Яя'),
    document.fonts.load('600 20px "EB Garamond"', 'Aa Яя'),
  ]).catch(() => {}),
  new Promise((r) => setTimeout(r, 3000)),
]);
try { await Promise.race([felix.decode(), new Promise((r) => setTimeout(r, 2500))]); } catch { /* Bild fehlt → trotzdem weiter */ }
metricCache.clear();
layoutAll();
setupGardens();
hero.classList.add('is-in');
heroStart = performance.now();
requestAnimationFrame(tick);
// FELIX → FELIKS: erst „Felix“ zeigen, dann wachsen K und S heraus (reduced: steht schon auf FELIKS)
if (!reduced) setTimeout(() => morph(false), 3200);

let rT;
let lastW = innerWidth;
addEventListener('resize', () => {
  clearTimeout(rT);
  rT = setTimeout(() => {
    // auf dem Handy ändert die Adressleiste die Höhe beim Scrollen: dann nicht alles neu malen
    if (innerWidth === lastW && matchMedia('(pointer: coarse)').matches) return;
    lastW = innerWidth;
    metricCache.clear();
    layoutAll();
  }, 150);
});

if (import.meta.env.DEV) { const { addSwitch } = await import('/shared/switch.js'); addSwitch('v-bloom'); }
