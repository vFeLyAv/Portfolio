// Jahreszeiten-Variante (aus Sky): beim Scrollen vergeht ein Jahr – Frühling, Sommer, Herbst, Winternacht.
// Wolken werden im Browser gezeichnet (Canvas), Ebenen bewegen sich mit Maus und Scroll.
// Fotos: alle in photos.js. Lebenslauf-Grafik: cv.js. Musik: deck.js (Knopf oben in der Leiste).
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { makeCloud, tintCloud } from './clouds.js';
import { initDeck } from './deck.js';
import { initWeather } from './weather/index.js';
import { installSymbols } from './weather/shapes.js';
import { photos } from './photos.js';
import { initCv } from './cv.js';
import { DATA, STR, initialLang, saveLang } from './i18n.js';

gsap.registerPlugin(ScrollTrigger);

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
const $ = (s) => document.querySelector(s);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

/* ================= Sprache (Deutsch / Englisch) ================= */
// D = Inhalte (data.js / data.en.js), T = feste Texte (i18n.js). Bei einem Wechsel wird alles neu geschrieben,
// ohne die Seite neu zu laden (Musik, Scrollposition und Zustände bleiben).
let LANG = initialLang();
let D = DATA[LANG];
let T = STR[LANG];
const alt = (p) => (LANG === 'en' && p.altEn) || (LANG === 'ru' && p.altRu) || p.alt || '';
const ext = () => `<span class="sr-only"> ${T.newTab}</span>`;
const stat = (o) => o.label || T.status[o.status] || o.status;   // Anzeige-Wort für einen Status (Code bleibt deutsch)

/* ================= Inhalte ================= */
installSymbols();   // #bloom und #leaf für Blüten an der Leine und Blätter an den Klammern
const bloom = (cls, style) => `<svg class="bloom ${cls}" style="${style}" aria-hidden="true" focusable="false"><use href="#bloom"/></svg>`;

/* ================= Fotos aus photos.js ================= */
// Foto in einem festen Rahmen: Fokuspunkt bleibt sichtbar, zoom vergrößert um diesen Punkt
function framedImg(p) {
  return `<img src="${esc(p.src)}" alt="${esc(alt(p))}" width="${p.w}" height="${p.h}"
    class="framed" style="--fx:${(p.focusX ?? 0.5) * 100}%;--fy:${(p.focusY ?? 0.5) * 100}%;--zoom:${p.zoom ?? 1}">`;
}
// Hero: Lage des Fotos ergibt sich aus Seitenverhältnis, Kopf-Oberkante und Körpermitte (CSS rechnet)
{
  const h = photos.hero, el = $('#person');
  el.style.setProperty('--ar', (h.w / h.h).toFixed(5));
  el.style.setProperty('--hx', h.bodyX); el.style.setProperty('--hy', h.headTop); el.style.setProperty('--size', h.size ?? 1);
  el.style.setProperty('--maxh', `${Math.round(h.h * 1.25)}px`);              // nie mehr als 1,25-fach vergrößern
  if (h.fade != null) el.style.setProperty('--fade', `${h.fade * 100}%`);
  if (h.fadeX != null) el.style.setProperty('--fadex', `${h.fadeX * 100}%`);
  if (h.fadeL != null) el.style.setProperty('--fadel', `${h.fadeL * 100}%`);
  // lose Luftballons, die langsam am Himmel aufsteigen (nur Deko, nur bei Varianten mit balloons)
  if (h.balloons && !reduce) {
    const loose = Array.from({ length: h.balloons }, (_, i) => `<svg class="loose__b" viewBox="0 0 40 80" style="--i:${i};--x:${[12, 78, 88, 22][i % 4]}%;--s:${[1, 0.75, 0.6, 0.85][i % 4]}">
      <defs><radialGradient id="lb${i}" cx=".35" cy=".3" r=".75"><stop offset="0" stop-color="#fff6b0"/><stop offset=".45" stop-color="#f6d23a"/><stop offset="1" stop-color="#d9a514"/></radialGradient></defs>
      <path d="M20 46 C 20 56, 15 62, 20 70 S 24 76, 20 80" fill="none" stroke="rgba(255,255,255,.75)" stroke-width="1"/>
      <ellipse cx="20" cy="22" rx="17" ry="20" fill="url(#lb${i})"/><path d="M17 41 l3 5 3-5z" fill="#d9a514"/>
      <ellipse cx="13" cy="14" rx="4" ry="6" fill="rgba(255,255,255,.55)" transform="rotate(-20 13 14)"/></svg>`).join('');
    $('#layerBack').insertAdjacentHTML('afterend', `<div class="loose" aria-hidden="true">${loose}</div>`);
  }
  if (h.screenX != null) el.style.setProperty('--sx', `${h.screenX * 100}%`);
  if (h.headAt != null) $('#stage').style.setProperty('--head-l', `${h.headAt * 100}svh`);
  // Handy (schmal): eigene Werte, falls angegeben
  if (h.sizeSmall != null) el.style.setProperty('--size-s', h.sizeSmall);
  if (h.screenXSmall != null) el.style.setProperty('--sx-s', `${h.screenXSmall * 100}%`);
  if (h.headAtSmall != null) $('#stage').style.setProperty('--head-s', `${h.headAtSmall * 100}svh`);
  el.innerHTML = `<img src="${esc(h.src)}" alt="${esc(alt(h))}" width="${h.w}" height="${h.h}" decoding="async" fetchpriority="high">`;
  if (h.front) el.classList.add('person--front');   // vor den vorderen Wolken
  if (h.nod) el.firstElementChild.style.transformOrigin = `${h.nod.x * 100}% ${h.nod.y * 100}%`;   // Drehpunkt am Hals
  // Projekte: stehendes Foto, Wolke unter den Füßen
  const p = photos.projects, st = $('#stand');
  st.style.setProperty('--ar', (p.w / p.h).toFixed(5));
  st.style.setProperty('--cx', p.cloudX ?? 0.75); st.style.setProperty('--cy', p.cloudY ?? 0.76); st.style.setProperty('--size', p.size ?? 1);
  // ganz feines warmes Gegenlicht nur rechts oben (dort steht die Sommersonne): dieselbe Figur als Maske, darin ein Verlauf
  st.insertAdjacentHTML('afterbegin', `<img src="${esc(p.src)}" alt="" width="${p.w}" height="${p.h}" decoding="async">
    ${p.rim ? `<span class="stand__rim" style="--rim:${p.rim};--m:url('${esc(p.src)}')"></span>` : ''}`);
}

// Über mich: Text und „Wusstest du?“-Karten links, rechts ein Foto an der Wäscheleine und darunter
// der Plattenspieler auf einer Wolke (#spin bleibt dasselbe Element, wird nach dem Neuschreiben nur wieder eingesetzt)
// (photos.about.frame: 'print' = Abzug mit weißem Rand an einer Klammer, 'film' = Filmbild an zwei Klammern)
const spinEl = document.getElementById('spin');
function renderAbout() {
  const pa = photos.about, film = pa.frame === 'film';
  $('#aboutPanel').innerHTML = `
  <div class="about__col">
    <p class="about__lead">${esc(T.aboutLead(D.person.first, D.person.city))}</p>
    <div class="about__text">${D.about.map((p) => `<p>${esc(p)}</p>`).join('')}</div>
    ${D.facts.length ? `<section class="facts" aria-labelledby="factsTitle">
      <h3 class="facts__title" id="factsTitle">${esc(T.factsTitle)}</h3>
      <div class="facts__deck">
        <span class="facts__under" aria-hidden="true"></span><span class="facts__under facts__under--2" aria-hidden="true"></span>
        <article class="fact" id="fact" aria-live="polite" aria-atomic="true"></article>
      </div>
      <div class="facts__nav">
        <button class="facts__btn facts__btn--prev" type="button" id="factPrev" aria-label="${esc(T.factPrev)}"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M10 3 5 8l5 5"/></svg></button>
        <button class="facts__btn" type="button" id="factNext">${esc(T.factNext)}</button>
      </div>
    </section>` : ''}
  </div>
  <div class="about__side">
  <figure class="pin" id="pin">
    <svg class="pin__svg" preserveAspectRatio="none" aria-hidden="true"><path/><path/></svg>
    ${bloom('bloom--pin', '--r:-14deg')}${bloom('bloom--pin bloom--sm', '--r:31deg')}
    <div class="pin__swing ${film ? 'pin__swing--film' : 'pin__swing--print'}" id="pinSwing">
      ${film
        ? `<svg class="peg" data-at=".16" aria-hidden="true"><use href="#peg"/></svg><svg class="peg" data-at=".84" aria-hidden="true"><use href="#peg"/></svg>
           <div class="film"><div class="film__frame">${framedImg(pa)}</div></div>`
        : `<svg class="peg" data-at=".5" aria-hidden="true"><use href="#peg"/></svg>
           <div class="print"><div class="print__frame" style="aspect-ratio:${pa.w} / ${pa.h}">${framedImg(pa)}</div></div>`}
    </div>
  </figure>
  </div>`;
  if (spinEl) $('#aboutPanel .about__side').append(spinEl);
  showFact(0);
}
// „Wusstest du?“: eine Karte nach der anderen (Zähler, weil es eine Reihe ist), mit kleinem Wegwerfen der alten Karte
let factI = 0;
function showFact(dir) {
  const card = $('#fact');
  if (!card || !D.facts.length) return;
  factI = Math.min(factI, D.facts.length - 1);
  const f = D.facts[factI];
  const fill = () => { card.innerHTML = `<p class="fact__n">${factI + 1} / ${D.facts.length}</p><h4 class="fact__t">${esc(f.title)}</h4><p class="fact__x">${esc(f.text)}</p>`; };
  if (!dir || reduce) { fill(); return; }
  card.classList.remove('is-in'); card.classList.add(dir > 0 ? 'is-out' : 'is-out-back');
  setTimeout(() => { fill(); card.classList.remove('is-out', 'is-out-back'); card.classList.add('is-in'); }, 230);
}
$('#aboutPanel').addEventListener('click', (e) => {
  const n = D.facts.length;
  if (e.target.closest('#factNext')) { factI = (factI + 1) % n; showFact(1); }
  else if (e.target.closest('#factPrev')) { factI = (factI - 1 + n) % n; showFact(-1); }
});

// Projekte. Bunprise: Banner-Video im Bild (die Maskottchen-.webm haben keine Transparenz, darum kein Overlay),
// ohne Animationen nur das Standbild. Bild und Knopf führen zu bunprise.de.
let videoIO = null;
function renderProjects() {
  const [mainProj, ...moreProj] = D.projects;
  const banner = mainProj.media?.banner?.[0];
  const media = banner && !reduce
    ? `<video class="proj__video" muted playsinline loop preload="none" poster="${esc(mainProj.img)}" width="1280" height="720" aria-hidden="true"><source src="${esc(banner)}" type="video/mp4"></video>`
    : `<img src="${mainProj.img}" alt="${esc(T.projAlt[mainProj.img] || '')}" width="1200" height="630" loading="lazy">`;
  $('#projectsPanel').innerHTML = `
  <article class="proj proj--main">
    ${mainProj.url
      ? `<a class="proj__img proj__img--link" href="${esc(mainProj.url)}" target="_blank" rel="noopener" tabindex="-1" aria-hidden="true">${media}</a>`
      : `<div class="proj__img">${media}</div>`}
    <div>
      <div class="proj__head">
        ${mainProj.icon ? `<img class="proj__icon" src="${mainProj.icon}" alt="" width="52" height="52" loading="lazy">` : ''}
        <div><h3 class="proj__title">${esc(mainProj.title)}</h3><span class="proj__when">${esc(mainProj.when)}</span></div>
      </div>
      <p>${esc(mainProj.text)}</p>
      ${mainProj.url ? `<a class="btn btn--ink proj__open" href="${esc(mainProj.url)}" target="_blank" rel="noopener">${esc(T.open(mainProj.title))}${ext()}</a>` : ''}
    </div>
  </article>
  <div class="proj__more">
    ${moreProj.map((p) => `
      <article class="proj proj--small">
        <div class="proj__img"><img src="${p.img}" alt="${esc(T.projAlt[p.img] || '')}" loading="lazy"></div>
        <div>
          <h3 class="proj__title">${esc(p.title)}</h3><span class="proj__when">${esc(p.when)}</span>
          <p>${esc(p.text)}</p>
        </div>
      </article>`).join('')}
  </div>`;
  // Video läuft nur, solange es im Bild ist
  videoIO?.disconnect();
  const v = $('.proj__video');
  if (v) { videoIO = new IntersectionObserver(([e]) => { if (e.isIntersecting) v.play().catch(() => {}); else v.pause(); }, { threshold: 0.2 }); videoIO.observe(v); }
}

// Zertifikate: erhaltene groß mit Nachweis, die anderen hängen an der Leine
let earnedCerts = [], openCerts = [];
function renderCertData() {
  earnedCerts = D.certificates.filter((c) => c.status === 'erhalten');
  openCerts = D.certificates.filter((c) => c.status !== 'erhalten');
  $('#certsLead').textContent = T.certsLead(earnedCerts.length);
}

/* ================= Kontakt: Winter-Postkarte ================= */
// Vorne die Schreibseite (Kontakt sofort lesbar) mit Briefmarke und Stempel „Regensburg“,
// hinten die Bildseite (photos.contact). „Umdrehen“ dreht die Karte; die verdeckte Seite ist inert.
const box = $('#postcard');
function renderContact() {
  const mail = D.contact.email, ig = D.contact.instagram, pc = photos.contact, sp = photos.stamp || pc;
  const back = box.classList.contains('is-flipped');
  const mailHTML = mail ? esc(mail).replace('@', '<wbr>@') : '';   // darf vor dem @ umbrechen
  box.innerHTML = `
    <div class="postcard__inner" id="pcInner">
      <div class="postcard__face postcard__write" id="pcWrite">
        <div class="postcard__msg contact">
          ${mail ? `
            <p class="contact__lead">${esc(T.mailLead)}</p>
            <p class="contact__mail"><a href="mailto:${esc(mail)}">${mailHTML}</a></p>
            <div class="contact__row">
              <button class="contact__copy" type="button" data-copy="${esc(mail)}"><span class="contact__copylbl">${esc(T.copy)}</span><span class="sr-only">${esc(T.copySr)}</span></button>
              ${ig ? `<a class="contact__ig" href="https://instagram.com/${encodeURIComponent(ig)}" target="_blank" rel="noopener" aria-label="Instagram: @${esc(ig)} ${esc(T.newTab)}">
                <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="3.5" width="17" height="17" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.2" cy="6.8" r="1" class="dotfill"/></svg>
                <span>@${esc(ig)}</span></a>` : ''}
            </div>` : `<p class="contact__lead">${esc(T.noMail)}</p>`}
        </div>
        <div class="postcard__side" aria-hidden="true">
          <span class="stamp-wrap"><span class="stamp">${sp?.src ? `<img src="${esc(sp.src)}" alt="" width="${sp.w}" height="${sp.h}" loading="eager" fetchpriority="high" style="object-position:${(sp.focusX ?? 0.5) * 100}% ${(sp.focusY ?? 0.5) * 100}%">` : ''}</span></span>
          <svg class="postmark" viewBox="0 0 120 120">
            <defs><path id="pmArc" d="M18 60a42 42 0 1 1 84 0"/></defs>
            <circle cx="60" cy="60" r="52"/><circle cx="60" cy="60" r="36"/>
            <text><textPath href="#pmArc" startOffset="50%" text-anchor="middle">Regensburg</textPath></text>
            <text x="60" y="66" text-anchor="middle" class="postmark__year">${esc(String(new Date().getFullYear()))}</text>
          </svg>
          <svg class="postmark__waves" viewBox="0 0 120 40"><path d="M0 8q10-7 20 0t20 0 20 0 20 0 20 0 20 0M0 20q10-7 20 0t20 0 20 0 20 0 20 0 20 0M0 32q10-7 20 0t20 0 20 0 20 0 20 0 20 0"/></svg>
          <span class="postcard__lines"><i></i><i></i><i></i></span>
        </div>
      </div>
      ${pc?.src ? `<div class="postcard__face postcard__pic" id="pcPic"><div class="pc-print">${framedImg(pc)}</div></div>` : ''}
    </div>
    ${pc?.src ? `<button class="postcard__flip" type="button" id="pcFlip" aria-pressed="false" aria-controls="pcInner">${esc(T.flip)}</button>` : ''}`;
  setFlip(back);
}
function setFlip(back) {
  const flip = $('#pcFlip'), write = $('#pcWrite'), pic = $('#pcPic');
  if (!flip) return;
  box.classList.toggle('is-flipped', back);
  flip.setAttribute('aria-pressed', String(back));
  write.inert = back; write.setAttribute('aria-hidden', String(back));
  pic.inert = !back; pic.setAttribute('aria-hidden', String(!back));
}
box.addEventListener('click', (e) => { if (e.target.closest('#pcFlip')) setFlip(!box.classList.contains('is-flipped')); });

/* ================= Kurze Meldungen (Toast) ================= */
const toast = $('#toast');
let toastTimer;
function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add('is-on');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('is-on'), 2600);
}

// E-Mail kopieren (mit Rückmeldung am Knopf und als Meldung)
async function copyText(t) {
  try { await navigator.clipboard.writeText(t); return true; } catch { /* älterer Weg */ }
  const ta = document.createElement('textarea');
  ta.value = t; ta.setAttribute('readonly', ''); ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0';
  document.body.append(ta); ta.select();
  let ok = false;
  try { ok = document.execCommand('copy'); } catch { ok = false; }
  ta.remove();
  return ok;
}
document.addEventListener('click', async (e) => {
  const b = e.target.closest('[data-copy]');
  if (!b) return;
  const ok = await copyText(b.dataset.copy);
  const lbl = b.querySelector('.contact__copylbl');
  if (ok) {
    lbl.textContent = T.copied; b.classList.add('is-done');
    showToast(T.copyToast);
    clearTimeout(b._t); b._t = setTimeout(() => { lbl.textContent = T.copy; b.classList.remove('is-done'); }, 2400);
  } else showToast(T.copyFail);
});

// feste Texte im HTML: data-t = Text, data-t-label = aria-label (Schlüssel aus i18n.js)
function applyStatic() {
  document.documentElement.lang = T.htmlLang;
  document.querySelector('meta[name="description"]')?.setAttribute('content', T.metaDesc);
  document.querySelectorAll('[data-t]').forEach((el) => { el.textContent = T[el.dataset.t]; });
  document.querySelectorAll('[data-t-label]').forEach((el) => el.setAttribute('aria-label', T[el.dataset.tLabel]));

  $('#person img')?.setAttribute('alt', alt(photos.hero));
  document.querySelectorAll('.tag--lang').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lang === LANG)));
}

renderAbout();
renderProjects();
renderCertData();
renderContact();

/* ================= Szene ================= */
const stage = $('#stage');
const hero = $('#top');
const personEl = $('#person');
const nameEl = $('#bigName');
const fogEl = $('#fog');
const fogVeil = $('#fogVeil');
const skySummer = $('#skySummer');
const skyAutumn = $('#skyAutumn');
const skyRays = $('#skyRays');
const skyDusk = $('#skyDusk');
const skyNight = $('#skyNight');
const floorEl = $("#floor");
const bankEl = $("#bank");
const layers = { far: $('#layerFar'), back: $('#layerBack'), front: $('#layerFront') };

// x/y = Mitte als Anteil der Bühne, w = Breite als Anteil der Bühnenbreite,
// d = Tiefe (für Parallax), side = in welche Richtung die Wolke beim Scrollen ausweicht
const SCENE = {
  wide: [
    { l: 'far', x: 0.13, y: 0.33, w: 0.2, ar: 2.6, d: 0.15, side: -0.3, far: 0.28, seed: 11 },
    { l: 'far', x: 0.64, y: 0.12, w: 0.13, ar: 3, d: 0.12, side: 0.2, far: 0.32, seed: 12, tall: 0.6 },
    { l: 'far', x: 0.95, y: 0.5, w: 0.2, ar: 2.4, d: 0.18, side: 0.4, far: 0.25, seed: 13 },
    { l: 'back', x: 0.16, y: 0.6, w: 0.36, ar: 2.2, d: 0.4, side: -1, seed: 21 },
    { l: 'back', x: 0.83, y: 0.62, w: 0.4, ar: 2.1, d: 0.42, side: 1, seed: 22 },
    { l: 'front', x: 0.3, y: 0.74, w: 0.21, ar: 3.2, d: 0.9, side: -1, seed: 34, tall: 0.6 },
    { l: 'front', x: 0.1, y: 0.97, w: 0.56, ar: 2, d: 1, side: -1, seed: 31 },
    { l: 'front', x: 0.9, y: 0.97, w: 0.56, ar: 2, d: 1, side: 1, seed: 33 },
    { l: 'front', x: 0.5, y: 1.06, w: 0.74, ar: 2.4, d: 1.1, side: 0.25, seed: 32 },
    { l: 'front', x: 0.71, y: 0.8, w: 0.24, ar: 3, d: 0.95, side: 1, seed: 35, tall: 0.6 },
    // die Wolke, auf der er sitzt: direkt unter dem angehobenen Schuh
    { l: 'front', x: 0.45, y: 0.94, w: 0.3, ar: 2.2, d: 1, side: -0.35, seed: 36 },
    { l: 'front', x: 0.55, y: 0.99, w: 0.34, ar: 2.3, d: 1.05, side: 0.35, seed: 37 },
  ],
  tall: [
    { l: 'far', x: 0.18, y: 0.17, w: 0.42, ar: 2.6, d: 0.15, side: -0.4, far: 0.28, seed: 11 },
    { l: 'back', x: 0.06, y: 0.56, w: 0.7, ar: 2.2, d: 0.4, side: -1, seed: 21 },
    { l: 'back', x: 0.96, y: 0.6, w: 0.75, ar: 2.1, d: 0.42, side: 1, seed: 22 },
    { l: 'front', x: 0.16, y: 0.76, w: 0.52, ar: 3, d: 0.9, side: -1, seed: 34, tall: 0.6 },
    { l: 'front', x: 0.02, y: 0.9, w: 1.05, ar: 2, d: 1, side: -1, seed: 31 },
    { l: 'front', x: 1.0, y: 0.89, w: 1.0, ar: 2, d: 1, side: 1, seed: 33 },
    { l: 'front', x: 0.5, y: 1.0, w: 1.35, ar: 2.4, d: 1.1, side: 0.2, seed: 32 },
    { l: 'front', x: 0.36, y: 0.9, w: 0.7, ar: 2.2, d: 1, side: -0.3, seed: 36 },
  ],
};
const SKY = [
  { x: 0.05, y: 0.15, w: 0.24, ar: 2.8, d: 0.06, sp: 0.004, far: 0.3, seed: 51 },
  { x: 0.45, y: 0.42, w: 0.18, ar: 3.2, d: 0.1, sp: 0.006, far: 0.34, seed: 52, tall: 0.6 },
  { x: 0.8, y: 0.2, w: 0.3, ar: 2.5, d: 0.08, sp: 0.005, far: 0.26, seed: 53 },
  { x: 0.25, y: 0.75, w: 0.34, ar: 2.3, d: 0.12, sp: 0.007, far: 0.22, seed: 54 },
  { x: 0.7, y: 0.95, w: 0.28, ar: 2.7, d: 0.14, sp: 0.005, far: 0.3, seed: 55 },
  { x: 0.95, y: 0.62, w: 0.2, ar: 3, d: 0.09, sp: 0.006, far: 0.34, seed: 56, tall: 0.6 },
  { x: 0.12, y: 1.25, w: 0.26, ar: 2.6, d: 0.11, sp: 0.004, far: 0.3, seed: 57 },
];
const FOG = [
  { x: 0.5, y: 0.5, w: 1.1, ar: 2.4, seed: 32 },
  { x: 0.18, y: 0.32, w: 0.8, ar: 2, seed: 33, flip: 1 },
  { x: 0.84, y: 0.36, w: 0.8, ar: 2, seed: 31, flip: 1 },
  { x: 0.25, y: 0.78, w: 0.9, ar: 2.2, seed: 21 },
  { x: 0.78, y: 0.76, w: 0.9, ar: 2.1, seed: 22 },
];
const BANK = [
  { x: 0.12, y: 0.5, w: 0.62, ar: 2, seed: 31, flip: 1 },
  { x: 0.52, y: 0.58, w: 0.8, ar: 2.4, seed: 32 },
  { x: 0.92, y: 0.48, w: 0.62, ar: 2, seed: 33 },
];
const FLOOR = [
  { x: 0.1, y: 0.7, w: 0.5, ar: 2, seed: 33, flip: 1 },
  { x: 0.5, y: 0.82, w: 0.62, ar: 2.4, seed: 32, flip: 1 },
  { x: 0.9, y: 0.7, w: 0.5, ar: 2, seed: 31, flip: 1 },
];

let W = innerWidth, H = stage.clientHeight, mode = '';
let heroClouds = [], skyClouds = [], fogClouds = [], floorClouds = [], bankClouds = [];
const res = Math.min(devicePixelRatio || 1, 1.5) * 0.55;

// Wolken mit gleichem Seed werden nur einmal gezeichnet und danach kopiert
const cache = new Map();
function cloudCanvas(s, widthBase) {
  const key = `${s.seed}|${s.ar}|${s.tall ?? 1}|${s.far || 0}`;
  const hit = cache.get(key);
  if (hit) {
    const c = document.createElement('canvas');
    c.width = hit.width; c.height = hit.height; c.className = 'cloud';
    c.getContext('2d').drawImage(hit, 0, 0);
    return c;
  }
  const c = makeCloud(s.seed, { px: clamp(s.w * widthBase * res, 140, 1100), ar: s.ar, tall: s.tall ?? 1, far: s.far || 0 });
  cache.set(key, c);
  return c;
}
function spawn(list, host, widthBase, tint) {
  return list.map((s, i) => {
    let el = cloudCanvas(s, widthBase);
    if (tint) el = tintCloud(el, tint);
    host.append(el);
    return { ...s, el, ph: (s.seed * 1.7) % 6.28, sp2: 0.12 + (i % 4) * 0.03 };
  });
}
// Jahreszeiten: dieselbe Wolke in fünf Farben übereinander, je nach Abschnitt eingeblendet.
// Frühling = weiß (Grundbild), Sommer = warme Unterseite, Herbst = Bernstein bis Rost,
// Spätherbst = schwere grau-violette Schneewolken, Nacht = dunkle Schatten (verblassen dann fast ganz).
const SUMMER = [[0, '#ffffff'], [0.65, '#fff7ea'], [1, '#ffe6c2']];
const AUTUMN = [[0, '#ffc78f'], [0.55, '#f08a4b'], [1, '#c2452a']];
const SNOW = [[0, '#d8d0dc'], [0.55, '#9d8ea8'], [1, '#5b4a66']];
const NIGHT = [[0, '#6e5a72'], [1, '#2a1424']];
const SNOWY = [[0, '#ece6f2'], [0.6, '#a593b2'], [1, '#4a3858']];   // Wolken im Kontakt: oben verschneit, unten Nacht
function spawnSets(list, host, widthBase) {
  return list.map((s, i) => {
    const day = cloudCanvas(s, widthBase);
    const sum = tintCloud(day, SUMMER), aut = tintCloud(day, AUTUMN, 0.94, 'color');
    const snow = tintCloud(day, SNOW), night = tintCloud(day, NIGHT, 0.85);
    day.className = sum.className = aut.className = snow.className = night.className = '';
    const set = document.createElement('div');
    set.className = 'cloudset';
    set.append(day, sum, aut, snow, night);
    host.append(set);
    return { ...s, el: set, sum, aut, snow, night, ph: (s.seed * 1.7) % 6.28, sp2: 0.12 + (i % 4) * 0.03 };
  });
}
// einzelne, stillstehende Wolke in einen Behälter setzen (Breite per CSS)
function staticCloud(host, s, tint) {
  let c = cloudCanvas(s, W);
  if (tint) c = tintCloud(c, tint);
  c.className = '';
  c.style.cssText = 'width:100%;height:auto;max-width:none';
  host.append(c);
}
function sizeClouds(list, base) {
  for (const c of list) { c.pw = c.w * base; c.ph2 = c.pw / c.ar; c.el.style.width = `${c.pw}px`; }
}
function buildHero() {
  const m = W / H < 0.85 ? 'tall' : 'wide';
  if (m === mode) return;
  mode = m;
  Object.values(layers).forEach((l) => (l.innerHTML = ''));
  heroClouds = SCENE[m].map((s) => spawn([s], layers[s.l], W)[0]);
  sizeClouds(heroClouds, W);
}
function buildAll() {
  buildHero();
  // die Klammer an der Hero-Leine bleibt vorerst leer (Felix hängt dort später etwas auf)
  // der Rest ist erst beim Scrollen zu sehen: kurz danach zeichnen
  setTimeout(() => {
    skyClouds = spawnSets(SKY, $('#skyClouds'), Math.max(W, 900));
    sizeClouds(skyClouds, Math.max(W, 900));
    fogClouds = spawn(FOG, fogEl, Math.max(W, H * 1.2));
    sizeClouds(fogClouds, Math.max(W, H * 1.2));
    bankClouds = spawn(BANK, bankEl, Math.max(W, H * 0.9));
    sizeClouds(bankClouds, Math.max(W, H * 0.9));
    floorClouds = spawn(FLOOR, floorEl, Math.max(W, H * 0.9), NIGHT);
    sizeClouds(floorClouds, Math.max(W, H * 0.9));
    staticCloud($('#standCloud'), { seed: 33, ar: 1.7, tall: 1.3, w: 0.42 }, SUMMER);
    staticCloud($('#spinCloud'), { seed: 51, ar: 2.6, tall: 1.1, w: 0.3 });
    measureY();
    if (reduce) frame(0, 16);
  }, 60);
}
// Lage der Abschnitte für die Jahreszeit
const Y = { proj: 1e9, zert: 1e9, k: 1e9 };
function measureY() {
  Y.proj = $('#projekte').getBoundingClientRect().top + scrollY;
  Y.zert = $('#zertifikate').getBoundingClientRect().top + scrollY;
  Y.k = $('#kontakt').getBoundingClientRect().top + scrollY;
}
// Sterne für die Nacht
function drawStars() {
  const c = $('#stars');
  c.width = innerWidth; c.height = innerHeight;
  const x = c.getContext('2d');
  let a = 99;
  const r = () => { a = (a * 16807) % 2147483647; return a / 2147483647; };
  const n = Math.round((c.width * c.height) / 5200);
  for (let i = 0; i < n; i++) {
    const sx = r() * c.width, syy = Math.pow(r(), 1.6) * c.height * 0.85, rad = 0.4 + r() * r() * 1.3;
    x.fillStyle = `rgba(255,${230 + Math.round(r() * 25)},${225 + Math.round(r() * 30)},${(0.25 + r() * 0.7).toFixed(2)})`;
    x.beginPath(); x.arc(sx, syy, rad, 0, Math.PI * 2); x.fill();
  }
}
function resizeAll() {
  W = innerWidth; H = stage.clientHeight;
  buildHero();
  sizeClouds(heroClouds, W);
  sizeClouds(skyClouds, Math.max(W, 900));
  sizeClouds(fogClouds, Math.max(W, H * 1.2));
  sizeClouds(floorClouds, Math.max(W, H * 0.9));
  sizeClouds(bankClouds, Math.max(W, H * 0.9));
  drawHeroLine();
  buildCerts();
  drawPinLine();
  CV?.layout();
  drawStars();
  measureY();
}

/* ---------- Wäscheleine im Hero ---------- */
const heroLine = $('#heroLine');
const hangs = [...document.querySelectorAll('.hang')];   // Sprach-Anhänger „Deutsch“ und „English“
// Quadratische Kurve von links nach rechts, leicht durchhängend
const LINE = { y0: 30, c: 130, y1: 15 };
const lineY = (t) => (1 - t) ** 2 * LINE.y0 + 2 * t * (1 - t) * LINE.c + t ** 2 * LINE.y1;
function drawHeroLine() {
  const path = $('#heroLinePath');
  path.setAttribute('d', `M0 ${LINE.y0} Q500 ${LINE.c} 1000 ${LINE.y1}`);
  let ghost = path.nextElementSibling;
  if (!ghost) { ghost = document.createElementNS('http://www.w3.org/2000/svg', 'path'); path.after(ghost); ghost.style.opacity = '.35'; }
  ghost.setAttribute('d', `M0 ${LINE.y0 + 2} Q520 ${LINE.c + 3} 1000 ${LINE.y1 + 1.5}`);
  const lh = heroLine.clientHeight;
  hangs.forEach((hang, i) => {
    const t = W < 700 ? [0.16, 0.6, 0.83][i] : parseFloat(hang.dataset.at);   // Stelle der Klammer auf der Leine (0 = links, 1 = rechts)
    hang.style.left = `${t * W - hang.offsetWidth / 2}px`;
    hang.style.top = `${(lineY(t) / 100) * lh + 10}px`;
  });
  // ein paar Kirschblüten haben sich in der Leine verfangen
  if (!heroLine.querySelector('.bloom')) {
    heroLine.insertAdjacentHTML('beforeend', BLOOMS_LINE.map((b) => bloom(b.sm ? 'bloom--sm' : '', `--r:${b.r}deg`)).join(''));
  }
  heroLine.querySelectorAll('.bloom').forEach((el, i) => {
    const b = BLOOMS_LINE[i], s = parseFloat(getComputedStyle(el).width) || 20;
    el.style.left = `${b.t * W - s / 2}px`;
    el.style.top = `${(lineY(b.t) / 100) * lh - s * 0.42}px`;
  });
}
// Blüten an der Hero-Leine: Felix wollte sie nicht mehr (Liste leer lassen; Format: { t: 0.13, r: 12, sm: 1 })
const BLOOMS_LINE = [];

/* ---------- Zertifikate an der Wäscheleine ---------- */
// Erhaltene Zertifikate hängen als Abzüge an Klammern (außermittig, daher schräg – jedes etwas anders),
// die Kurse in Arbeit hängen danach als schlichte Zettel.
const certHost = $('#certLines');
// Klammer-Stelle (Anteil der Kartenbreite) und Neigung je Abzug, abwechselnd links/rechts geklammert
const PEGS = [{ at: 0.36, tilt: -2.5 }, { at: 0.64, tilt: 2.2 }, { at: 0.42, tilt: -1.4 }];
let certLayout = '';
const pegSVG = (cls = '') => `<svg class="peg peg--jaws ${cls}" viewBox="0 0 22 58" aria-hidden="true">
  <g class="jaw jaw--l"><rect x="2" y="0" width="8.5" height="58" rx="3.5" fill="url(#wood)"/><path d="M4 6v44" stroke="#8d5a2e" stroke-opacity=".22" stroke-width=".8"/></g>
  <g class="jaw jaw--r"><rect x="11.5" y="0" width="8.5" height="58" rx="3.5" fill="url(#wood)"/><path d="M14 6v44" stroke="#8d5a2e" stroke-opacity=".22" stroke-width=".8"/></g>
  <rect x="1" y="25" width="20" height="6" rx="2.5" fill="#b9c0d1"/><rect x="1" y="25" width="20" height="2" rx="1" fill="#eef1f8"/>
</svg>`;
// ein Herbstblatt, das in einer Klammer hängen geblieben ist (Stiel steckt hinter der Klammer)
const caughtLeaf = (style, cls = '') => `<svg class="leafy ${cls}" style="${style}" aria-hidden="true" focusable="false"><use href="#leaf"/></svg>`;
function earnedHTML(c, n) {
  const { at, tilt } = PEGS[n % PEGS.length];
  return `<li class="cert cert--earned" data-peg="${at}" style="--peg:${at * 100}">
    <div class="cert__swing badge-swing" style="transform-origin:${at * 100}% 10px">
      ${n === 0 ? caughtLeaf(`left:calc(${at * 100}% - 2px);--r:-128deg`) : ''}
      ${pegSVG()}
      <button class="badge" type="button" data-cert="${earnedCerts.indexOf(c)}" style="transform-origin:${at * 100}% 0;--tilt:${tilt}deg"
        aria-label="${esc(T.certOpen(c.title))}" aria-haspopup="dialog">
        <span class="badge__print"><img src="${esc(c.img)}" alt="" draggable="false"></span>
        <span class="badge__meta"><span class="cert__state cert__state--done">${esc(stat(c))}</span> ${esc(c.date || '')}</span>
      </button>
    </div>
  </li>`;
}
function noteHTML(c, i) {
  const tilt = [-1.4, 0.9, -0.6, 1.3][i % 4];
  return `<li class="cert" style="--tilt:${tilt}deg" data-peg="0.5">
    <div class="cert__swing">
      ${i === 2 ? caughtLeaf('left:calc(50% + 2px);--r:112deg', 'leafy--sm') : ''}
      <svg class="peg" aria-hidden="true"><use href="#peg"/></svg>
      <article class="cert__paper">
        <span class="cert__state">${esc(stat(c))}</span>
        <h3 class="cert__title">${esc(c.title)}</h3>
        <p class="cert__issuer">${esc(c.issuer)}</p>
        <a class="cert__link" href="${esc(c.url)}" target="_blank" rel="noopener">${esc(T.toCourse)}<span class="sr-only">: ${esc(c.title)} ${esc(T.newTab)}</span></a>
      </article>
    </div>
  </li>`;
}
function buildCerts(force = false) {
  // breit: Abzüge an einer Leine, Zettel an der nächsten; mittel: je zwei an einer Leine; schmal: alles untereinander
  const L = W >= 1000 ? 'wide' : W >= 560 ? 'mid' : 'narrow';
  if (L !== certLayout || force) {   // force: neu schreiben (z. B. nach Sprachwechsel)
    certLayout = L;
    const items = [...earnedCerts.map((c) => ({ c, earned: true })), ...openCerts.map((c) => ({ c }))];
    const rows = [];
    const earnedIt = items.filter((it) => it.earned), noteIt = items.filter((it) => !it.earned);
    const chunk = (arr, per) => { for (let i = 0; i < arr.length; i += per) rows.push(arr.slice(i, i + per)); };
    const [pe, pn] = L === 'wide' ? [3, 4] : L === 'mid' ? [2, 2] : [1, 1];
    chunk(earnedIt, pe); chunk(noteIt, pn);
    let k = 0, e = 0;
    certHost.innerHTML = rows.map((row) => {
      const cols = row.map((it) => (it.earned ? 'minmax(0, 500px)' : '1fr')).join(' ');
      return `<div class="row${row[0].earned ? ' row--earned' : ''}${row.length === 1 && row[0].earned ? ' row--solo' : ''}" style="--cols:${cols}">
        <svg class="row__svg" preserveAspectRatio="none" aria-hidden="true"><path/><path/></svg>
        <ul>${row.map((it) => (it.earned ? earnedHTML(it.c, e++) : noteHTML(it.c, k++))).join('')}</ul>
      </div>`;
    }).join('');
    for (let i = swings.length - 1; i >= 0; i--) if (swings[i].group === 'certs') swings.splice(i, 1);
    certHost.querySelectorAll('.cert__swing').forEach((el, i) => {
      const s = addSwing(el, i + 1, 1, 'certs');
      if (el.classList.contains('badge-swing')) initBadge(el, s);
    });
  }
  certHost.querySelectorAll('.row').forEach((row) => {
    const w = row.clientWidth, y0 = 16, sag = row.querySelectorAll('.cert').length === 1 ? 12 : 26;
    const svg = row.querySelector('svg');
    svg.setAttribute('viewBox', `0 0 ${w} 120`);
    const [a, b] = svg.querySelectorAll('path');
    a.setAttribute('d', `M0 ${y0} Q${w / 2} ${y0 + 2 * sag} ${w} ${y0}`);
    b.setAttribute('d', `M0 ${y0 + 1.5} Q${w * 0.53} ${y0 + 2 * sag + 2.5} ${w} ${y0 + 0.8}`);
    row.querySelectorAll('.cert').forEach((li) => {
      const t = (li.offsetLeft + li.offsetWidth * parseFloat(li.dataset.peg || 0.5)) / w;
      li.style.setProperty('--y', `${y0 + 4 * sag * t * (1 - t)}px`);
    });
  });
}

/* ---------- Porträt an der Leine (Über mich) ---------- */
function drawPinLine() {
  // Leine über die ganze Breite des Glases, das Porträt hängt an einer Klammer daran
  const pin = $('#pin'), panel = $('#aboutPanel'), swing = $('#pinSwing');
  if (!pin) return;
  // Leine von Nagel zu Nagel: an beiden Rändern des Glases eingeschlagen, dazwischen hängt sie natürlich durch
  const pr = panel.getBoundingClientRect();
  const w = panel.clientWidth, off = pin.getBoundingClientRect().left - pr.left - panel.clientLeft, y0 = 22;
  const N = Math.min(26, w * 0.04);                    // Abstand der Nägel vom Rand
  const sag = Math.min(46, 12 + (w - 2 * N) * 0.03);   // längere Leine hängt mehr durch
  const svg = pin.querySelector('svg');
  Object.assign(svg.style, { left: `${-off}px`, width: `${w}px` });
  svg.setAttribute('viewBox', `0 0 ${w} 120`);
  const [a, b] = svg.querySelectorAll('path');
  a.setAttribute('d', `M${N} ${y0} Q${w / 2} ${y0 + 2 * sag} ${w - N} ${y0}`);
  b.setAttribute('d', `M${N} ${y0 + 1.5} Q${w * 0.52} ${y0 + 2 * sag + 2.5} ${w - N} ${y0 + 0.8}`);
  if (!svg.querySelector('.pin__nail')) {
    svg.insertAdjacentHTML('beforeend', '<g class="pin__nail"><circle r="4.6"/><circle r="1.6" class="pin__nailhi"/></g><g class="pin__nail"><circle r="4.6"/><circle r="1.6" class="pin__nailhi"/></g>');
  }
  const nails = svg.querySelectorAll('.pin__nail');
  nails[0].setAttribute('transform', `translate(${N} ${y0})`);
  nails[1].setAttribute('transform', `translate(${w - N} ${y0})`);
  // Höhe der Leine an der Stelle x (im Koordinatensystem des Glases)
  const yAtX = (x) => { const u = clamp((x - N) / (w - 2 * N), 0, 1); return y0 + 4 * sag * u * (1 - u); };
  const y = yAtX(off + swing.offsetLeft + swing.offsetWidth / 2);
  swing.style.paddingTop = `${y + 14}px`;
  swing.style.transformOrigin = `50% ${y}px`;
  // Klammern (data-at = Stelle auf der Breite des Bildes) sitzen genau auf der Leine
  swing.querySelectorAll('.peg').forEach((peg) => {
    const at = parseFloat(peg.dataset.at ?? 0.5);
    peg.style.left = `${at * 100}%`;
    peg.style.top = `${yAtX(off + swing.offsetLeft + swing.offsetWidth * at) - 10}px`;
  });
  // zwei Blüten auf der Leine, links neben dem Bild
  const tLeft = (off + swing.offsetLeft) / w;
  pin.querySelectorAll('.bloom').forEach((el, i) => {
    const bt = Math.max(0.04, tLeft - [0.08, 0.04][i]), s = parseFloat(getComputedStyle(el).width) || 20;
    el.style.left = `${bt * w - off - s / 2}px`;
    el.style.top = `${yAtX(bt * w) - s * 0.42}px`;
  });
}

/* ---------- Schwingen (Feder-Physik) ---------- */
const swings = [];
// alle Schwinger einer Gruppe entfernen (vor dem Neubau eines Bereichs, z. B. nach Sprachwechsel)
function dropSwings(group) { for (let i = swings.length - 1; i >= 0; i--) if (swings[i].group === group) swings.splice(i, 1); }
function addSwing(el, i, gain, group) {
  const s = { el, a: 0, v: 0, i, gain, group, held: false };
  swings.push(s);
  const push = (e) => {
    if (s.held) return;
    const r = el.getBoundingClientRect();
    const dir = e.clientX < r.left + r.width / 2 ? 1 : -1; // weg vom Zeiger
    s.v += dir * (55 + Math.random() * 25);
  };
  el.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') push(e); });
  el.addEventListener('pointerdown', (e) => { if (!el.classList.contains('badge-swing')) push(e); });
  return s;
}
const hangSwings = hangs.map((h, i) => addSwing(h, i, 1.3, 'hero'));
addSwing($('#pinSwing'), 7, 0.8, 'about');

/* ================= Zustand & Eingaben ================= */
const S = { drift: 0, mx: 0, my: 0, tx: 0, ty: 0, p: 0, fog: 0, intro: reduce ? 0 : 1, nameIn: reduce ? 1 : 0, vel: 0, scrollY: 0 };

if (fine && !reduce) {
  addEventListener('pointermove', (e) => {
    S.tx = (e.clientX / W - 0.5) * 2;
    S.ty = (e.clientY / innerHeight - 0.5) * 2;
    // Wolke an der Leine: Zeiger in der Nähe schubst sie an
    hangs.forEach((hang, i) => {
      const r = hang.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
      if (dx * dx + dy * dy < 160 * 160) hangSwings[i].v += clamp(e.movementX, -30, 30) * 0.7;
    });
  }, { passive: true });
  // Glanzpunkt auf dem Glas folgt dem Zeiger
  document.addEventListener('pointermove', (e) => {
    const g = e.target.closest && e.target.closest('.glass');
    if (!g) return;
    const r = g.getBoundingClientRect();
    g.style.setProperty('--gx', `${e.clientX - r.left}px`);
    g.style.setProperty('--gy', `${e.clientY - r.top}px`);
  }, { passive: true });
}

/* ================= Scrollen ================= */
let lenis = null;
if (!reduce) {
  lenis = new Lenis({ lerp: 0.09 });
  lenis.on('scroll', (l) => { S.vel = l.velocity; ScrollTrigger.update(); });
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
}

// Anker-Links (z. B. „Zum Inhalt springen“) weich ansteuern und Fokus mitnehmen
document.addEventListener('click', (e) => {
  const a = e.target.closest('a[href^="#"]');
  if (!a) return;
  const id = a.getAttribute('href').slice(1);
  const target = document.getElementById(id);
  if (!target) return;
  e.preventDefault();
  const head = target.querySelector('h2') || target;
  const y = id === 'top' ? 0 : head.getBoundingClientRect().top + scrollY - 24;
  if (lenis) lenis.scrollTo(y, { duration: 1.6 });
  else scrollTo({ top: y });
  if (id !== 'top') { if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1'); target.focus({ preventScroll: true }); }
});

ScrollTrigger.create({ trigger: hero, start: 'top top', end: 'bottom bottom', onUpdate: (s) => (S.p = s.progress) });
ScrollTrigger.create({
  trigger: hero,
  start: () => `top+=${(hero.offsetHeight - innerHeight) * 0.45} top`,
  end: () => `bottom top+=${innerHeight * 0.3}`,
  onUpdate: (s) => (S.fog = s.progress),
});
// Physik nur rechnen, wenn die Leine sichtbar ist
let heroVisible = true;
const VIS = { hero: true, about: false, certs: false, cv: false };
new IntersectionObserver(([e]) => (VIS.certs = e.isIntersecting)).observe($('#zertifikate'));
new IntersectionObserver(([e]) => (VIS.cv = e.isIntersecting)).observe($('#lebenslauf'));
new IntersectionObserver(([e]) => (VIS.about = e.isIntersecting)).observe($('#ueber'));
new IntersectionObserver(([e]) => (heroVisible = VIS.hero = e.isIntersecting)).observe(hero);

/* ================= Bild für Bild ================= */
// Dichte der weißen Wolkenwand beim Durchflug (0…1). Auch die Teilchen (weather/) fragen das ab,
// damit Blüten in der Wolkenwand im selben Moment verschwinden.
const fogBump = (f) => smooth(0, 0.35, f) * (1 - smooth(0.62, 1, f));
const tf = (el, x, y, s = 1, extra = '') => (el.style.transform = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0) scale(${s.toFixed(4)})${extra}`);

let MUSIC_ON = false;                 // läuft gerade Musik? (für das Kopfnicken im Hero F)
const NOD = { a: 0, on: false };
function frame(time, dtMs) {
  const dt = Math.min((dtMs || 16) / 1000, 1 / 30);
  if (fine) { S.mx += (S.tx - S.mx) * 0.05; S.my += (S.ty - S.my) * 0.05; }
  else if (!reduce) { S.mx = Math.sin(time * 0.23) * 0.35; S.my = Math.cos(time * 0.19) * 0.2 - S.p * 0.5; }
  const p = S.p;
  const sy = scrollY;
  if (!reduce) S.drift += dt * (1 + WX.breeze * 4);   // Wolken ziehen bei Wind schneller

  // Hero
  if (heroVisible) {
    for (const c of heroClouds) {
      const drift = Math.sin(time * c.sp2 + c.ph) * 0.012 * W;
      const bob = Math.cos(time * c.sp2 * 0.8 + c.ph) * 0.007 * H;
      const part = c.side * (p * 0.62 - S.intro * 0.16) * W * (0.5 + c.d * 0.5);
      const s = 1 + p * c.d * 1.2;
      const lift = c.l === 'front' ? p * H * 0.22 : -p * H * 0.06;
      const x = c.x * W - c.pw / 2 + drift + part + S.mx * c.d * 42;
      const y = c.y * H - c.ph2 / 2 + bob + S.my * c.d * 22 + lift;
      tf(c.el, x, y, s);
      c.el.style.opacity = c.l === 'front' ? 1 : (1 - smooth(0.7, 1, p)).toFixed(3);
    }
    const fade = 1 - smooth(0.6, 0.9, p);
    PT.x = S.mx * 26; PT.y = S.my * 14 - p * H * 0.06 + S.intro * H * 0.03; PT.s = 1 + p * 0.14 + S.intro * 0.025;
    if (photos.hero.bob && !reduce) { PT.y += Math.sin(time * 0.85) * H * 0.012; PT.x += Math.sin(time * 0.37) * W * 0.003; }   // schwebt mit den Ballons
    if (photos.hero.walk && !reduce) PT.y -= Math.abs(Math.sin(time * 1.7)) * H * 0.006;   // geht ganz leicht auf und ab
    tf(personEl, PT.x, PT.y, PT.s);
    // Kopfnicken im Takt (84 BPM), nur solange die Musik läuft; weich ein- und ausblenden
    if (photos.hero.nod && !reduce) {
      NOD.a += ((MUSIC_ON ? 1 : 0) - NOD.a) * Math.min(1, dt * 4);
      if (NOD.a > 0.002 || NOD.on) {
        const beat = (time * 84 / 60) % 1, k = Math.pow(Math.sin(Math.PI * beat), 2) * NOD.a;
        personEl.firstElementChild.style.transform = NOD.a > 0.002 ? `translateY(${(k * 6).toFixed(2)}px) rotate(${(k * 2.4 - 0.6 * NOD.a).toFixed(3)}deg)` : '';
        NOD.on = NOD.a > 0.002;
      }
    }
    personEl.style.opacity = fade.toFixed(3);
    tf(nameEl, S.mx * 12, S.my * 8 - p * H * 0.3 + (1 - S.nameIn) * H * 0.08, 1 + p * 0.3);
    nameEl.style.opacity = (S.nameIn * (1 - smooth(0.55, 0.85, p))).toFixed(3);
    heroLine.style.transform = `translate3d(0,${(-p * H * 0.3).toFixed(1)}px,0)`;
    heroLine.style.opacity = (1 - smooth(0.2, 0.6, p)).toFixed(3);
  }

  // Durchflug
  const f = S.fog;
  const bump = fogBump(f); // ganz weiß in der Mitte des Durchflugs
  if (bump > 0.004 && !reduce) {
    fogEl.style.visibility = 'visible';
    for (const c of fogClouds) {
      const spread = 1 + f * 1.6;
      const x = W / 2 + (c.x - 0.5) * W * spread - c.pw / 2;
      const y = H / 2 + (c.y - 0.5) * H * spread - c.ph2 / 2 - (f - 0.5) * H * 0.3;
      tf(c.el, x, y, 0.55 + f * 2.2, c.flip ? ' scaleX(-1)' : '');
      c.el.style.opacity = clamp(bump * 1.2, 0, 1).toFixed(3);
    }
    fogVeil.style.opacity = (bump * 0.93).toFixed(3);
  } else fogEl.style.visibility = 'hidden';

  // Himmel hinten
  // Jahreszeit: jeder Wechsel liegt an der Grenze zweier Abschnitte und läuft über etwa einen Bildschirm
  const ih = innerHeight, mid = sy + ih * 0.5;
  const summer = smooth(Y.proj - ih * 0.35, Y.proj + ih * 0.35, mid);
  const autumn = smooth(Y.zert - ih * 0.35, Y.zert + ih * 0.35, mid);
  // Spätherbst: unter dem Ende des Lebenslaufs wird es dämmrig, die Wolken werden schwer und grau-violett,
  // dann sinkt die Nacht von oben herab und die Wolken verblassen dahinter fast ganz.
  const dusk = smooth(Y.k - ih * 1.25, Y.k - ih * 0.25, mid);
  const night = smooth(Y.k - ih * 0.5, Y.k + ih * 0.3, mid);
  // Sommer blendet über, der Herbst steigt vom Horizont nach oben, die Nacht sinkt von oben herab (Maske über --a)
  skySummer.style.opacity = summer.toFixed(3);
  skyAutumn.style.opacity = autumn > 0.001 ? '1' : '0';
  skyAutumn.style.setProperty('--a', autumn.toFixed(3));
  skyDusk.style.opacity = dusk.toFixed(3);
  skyNight.style.opacity = night > 0.001 ? '1' : '0';
  skyNight.style.setProperty('--a', night.toFixed(3));
  // Sonnenstrahlen drehen sich langsam mit dem Scrollen (nur sichtbar im Sommer)
  if (summer > 0.01 && autumn < 0.99) skyRays.style.transform = `rotate(${(sy * 0.008).toFixed(2)}deg)`;
  setSun(summer, autumn);
  const cloudAlpha = (1 - night * 0.72).toFixed(3);
  for (const c of skyClouds) {
    c.sum.style.opacity = summer.toFixed(3); c.aut.style.opacity = autumn.toFixed(3);
    c.snow.style.opacity = dusk.toFixed(3); c.night.style.opacity = night.toFixed(3);
    c.el.style.opacity = cloudAlpha;
  }
  const band = innerHeight * 1.6;
  for (const c of skyClouds) {
    const span = W + c.pw * 1.2;
    const x = (((c.x * W + S.drift * c.sp * W) % span) + span) % span - c.pw * 0.6;
    let y = c.y * innerHeight - sy * c.d * 1.4 + S.my * c.d * 30;
    y = (((y + innerHeight * 0.3) % band) + band) % band - innerHeight * 0.3 - c.ph2 / 2;
    tf(c.el, x + S.mx * c.d * 40, y);
  }

  // Wolkenbank unter dem Hero und Wolkenboden ganz unten
  for (const [list, host] of [[bankClouds, bankEl], [floorClouds, floorEl]]) {
    const h = host.clientHeight;
    for (const c of list) {
      tf(c.el, c.x * W - c.pw / 2 + Math.sin(time * 0.1 + c.seed) * 0.015 * W, c.y * h - c.ph2 / 2, 1, c.flip ? " scaleX(-1)" : "");
    }
  }

  // Schwingen
  if (!reduce) {
    const wind = clamp(S.vel * 5, -150, 150);
    for (const s of swings) {
      if (!VIS[s.group] || s.held) continue;
      // Lebenslauf: kein Wind, nur Anstupsen mit dem Zeiger – damit man dort in Ruhe lesen kann
      const calm = s.group === 'cv';
      const gust = calm ? 0 : WX.breeze;  // Frühlingsbrise bei „Über mich“, Herbstböen bei den Zertifikaten
      const breeze = calm ? 0 : (Math.sin(time * 0.9 + s.i * 1.7) * 5 + Math.sin(time * 0.37 + s.i) * 3) * (1 + gust * 2.5)
        + gust * (16 + 12 * Math.sin(time * 1.3 + s.i));
      const acc = -38 * s.a - 3.2 * s.v + ((calm ? 0 : wind) + breeze) * s.gain;
      s.v += acc * dt;
      s.a = clamp(s.a + s.v * dt, -28, 28);
      s.el.style.transform = `rotate(${s.a.toFixed(2)}deg)`;
    }
  }
}

/* ================= Name: Felix → Feliks ================= */
// Start: „Felix“ (so sagen viele), dann wird daraus die richtige Schreibweise „Feliks“.
// K und S ziehen sich zusammen und verschwimmen, ein X quillt an der Stelle des K auf wie eine Wolke,
// die übrigen Buchstaben rücken nach. M.t = Lücke schließen (0…1), M.x = X da (0…1, federt über 1).
const nameBtn = $('#nameBtn');
const slotK = nameBtn.querySelector('.lt--k'), slotS = nameBtn.querySelector('.lt--s');
const gK = nameBtn.querySelector('.g--k'), gS = nameBtn.querySelector('.g--s'), gX = nameBtn.querySelector('.g--x');
const M = { t: 1, x: 1 };
const NW = { k: 0.5, s: 0.4, x: 0.5 }; // Breiten in em, werden gemessen
function measureName() {
  const fs = parseFloat(getComputedStyle(nameEl).fontSize) || 1;
  slotK.style.width = ''; slotS.style.width = '';
  NW.s = gS.offsetWidth / fs;
  NW.x = gX.offsetWidth / fs;
  NW.k = gK.offsetWidth / fs;
  renderName();
}
function renderName() {
  const e = clamp(M.t, 0, 1), x = M.x;
  slotK.style.width = `${(NW.k + (NW.x - NW.k) * e).toFixed(4)}em`;
  slotS.style.width = `${(NW.s * (1 - e)).toFixed(4)}em`;
  gK.style.transform = `scale(${(1 - 0.6 * e).toFixed(3)}, ${(1 - 0.18 * e).toFixed(3)})`;
  gK.style.opacity = clamp(1 - e * 1.5, 0, 1).toFixed(3);
  gK.style.filter = e > 0.01 ? `blur(${(e * 0.07).toFixed(3)}em)` : '';
  gS.style.transform = `translateX(${(-0.12 * e).toFixed(3)}em) scale(${Math.max(0.001, 1 - 0.85 * e).toFixed(3)}, ${(1 - 0.25 * e).toFixed(3)})`;
  gS.style.opacity = clamp(1 - e * 1.3, 0, 1).toFixed(3);
  gS.style.filter = e > 0.01 ? `blur(${(e * 0.09).toFixed(3)}em)` : '';
  const xs = Math.max(0.001, 0.25 + 0.75 * x);
  gX.style.transform = `translateX(-50%) scale(${xs.toFixed(3)})`;
  gX.style.opacity = clamp(x * 1.6, 0, 1).toFixed(3);
  gX.style.filter = x < 0.99 ? `blur(${((1 - clamp(x, 0, 1)) * 0.1).toFixed(3)}em)` : '';
}
let felix = true, nameTouched = false, nameTl = null;
function setName(v) {
  felix = v;
  nameBtn.setAttribute('aria-pressed', String(v));
  if (nameTl) nameTl.kill();
  if (reduce) { M.t = M.x = v ? 1 : 0; renderName(); return; }
  nameBtn.classList.remove('wave'); void nameBtn.offsetWidth; nameBtn.classList.add('wave');
  nameTl = gsap.timeline({ onUpdate: renderName });
  if (v) {
    nameTl.to(M, { t: 1, duration: 1.05, ease: 'power2.inOut' }, 0)
      .to(M, { x: 1, duration: 1.2, ease: 'elastic.out(1, 0.45)' }, 0.38);
  } else {
    nameTl.to(M, { x: 0, duration: 0.45, ease: 'power2.in' }, 0)
      .to(M, { t: 0, duration: 1.05, ease: 'power2.inOut' }, 0.12);
  }
}
nameBtn.addEventListener('click', () => { nameTouched = true; setName(!felix); });
nameBtn.addEventListener('animationend', (e) => { if (e.target === nameBtn.lastElementChild?.lastElementChild) nameBtn.classList.remove('wave'); });

/* ================= Foto im Hero ================= */
// (Die Notiz-Punkte am Foto sind entfernt – Felix wollte sie nicht mehr.)
const PT = { x: 0, y: 0, s: 1 };   // aktuelle Verschiebung/Zoom des Fotos (Parallax)

/* ================= Zertifikat: greifen, öffnen, umdrehen ================= */
const lb = $('#lb'), lbFly = $('#lbFly'), lbTilt = $('#lbTilt'), lbCard = $('#lbCard');
const lbFlip = $('#lbFlip'), lbClose = $('#lbClose'), lbBackdrop = $('#lbBackdrop'), lbBack = $('#lbBack'), lbDialog = $('#lbDialog');
let star = null, starI = 0;
// Vorder- und Rückseite des gerade geöffneten Zertifikats (i = Nummer in earnedCerts), in der aktuellen Sprache
function renderLb(i = starI) {
  starI = Math.min(i, Math.max(0, earnedCerts.length - 1));
  star = earnedCerts[starI] || null;
  if (!star) return;
  $('#lbImg').src = star.img;
  $('#lbImg').alt = T.lbAlt(star.title, star.issuer, D.person.name);
  lbBack.innerHTML = `<div class="lb__backin">
    <span class="cert__state cert__state--done">${esc(stat(star))}</span>
    <h2 class="lb__title" id="lbTitle">${esc(star.title)}</h2>
    <dl class="lb__facts">
      <div><dt>${esc(T.lbIssuer)}</dt><dd>${esc(star.issuer)}</dd></div>
      ${star.date ? `<div><dt>${esc(T.lbIssued)}</dt><dd>${esc(star.date)}</dd></div>` : ''}
      <div><dt>${esc(T.lbFor)}</dt><dd>${esc(D.person.name)}</dd></div>
    </dl>
    <div class="lb__actions">
      ${star.url ? `<a class="btn btn--ink" href="${esc(star.url)}" target="_blank" rel="noopener">${esc(star.verify ? T.verify : T.toCourse)}${ext()}</a>` : ''}
      ${star.pdf ? `<a class="btn btn--line" href="${esc(star.pdf)}" target="_blank" rel="noopener">${esc(T.pdfView)}${ext()}</a>` : ''}
    </div>
  </div>`;
  lbBack.inert = !LBX.back;
}const LBX = { open: false, back: false, btn: null, swingEl: null, swing: null, busy: false };
if (reduce) lb.classList.add('lb--flat');
renderLb();

function initBadge(el, s) {
  const btn = el.querySelector('.badge');
  let drag = null, suppress = false;
  const angleAt = (e) => (Math.atan2(e.clientX - drag.px, e.clientY - drag.py) * 180) / Math.PI;
  btn.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'mouse' || e.button !== 0 || reduce) return; // Finger: nur antippen
    const li = el.parentElement, r = li.getBoundingClientRect();
    drag = { px: r.left + r.width * parseFloat(li.dataset.peg || 0.5), py: r.top + parseFloat(getComputedStyle(li).paddingTop) + 10, x0: e.clientX, y0: e.clientY, moved: false, t: performance.now() };
    drag.ang0 = angleAt(e); drag.a0 = s.a;
    btn.setPointerCapture(e.pointerId);
  });
  btn.addEventListener('pointermove', (e) => {
    if (!drag) return;
    if (!drag.moved && Math.hypot(e.clientX - drag.x0, e.clientY - drag.y0) > 6) { drag.moved = true; s.held = true; btn.classList.add('is-held'); }
    if (!drag.moved) return;
    const now = performance.now(), dt = Math.max(0.008, (now - drag.t) / 1000); drag.t = now;
    const na = clamp(drag.a0 - (angleAt(e) - drag.ang0), -50, 50);
    s.v = clamp((na - s.a) / dt, -500, 500);
    s.a = na;
    el.style.transform = `rotate(${na.toFixed(2)}deg)`;
  });
  const end = () => {
    if (!drag) return;
    if (drag.moved) { suppress = true; s.held = false; btn.classList.remove('is-held'); }
    drag = null;
  };
  btn.addEventListener('pointerup', end);
  btn.addEventListener('pointercancel', end);
  btn.addEventListener('click', () => { if (suppress) { suppress = false; return; } openBadge(btn, el, s, +btn.dataset.cert || 0); });
}

const jaws = (root) => [root.querySelector('.jaw--l'), root.querySelector('.jaw--r')];
function srcTransform() {
  // von der Karte an der Leine zur Karte in der Mitte (FLIP: First, Last, Invert, Play)
  const from = LBX.btn.querySelector('.badge__print').getBoundingClientRect();
  gsap.set(lbFly, { clearProps: 'transform' });
  const to = lbFly.getBoundingClientRect();
  return {
    x: from.left + from.width / 2 - (to.left + to.width / 2),
    y: from.top + from.height / 2 - (to.top + to.height / 2),
    scale: from.width / to.width,
    rotation: (LBX.swing ? LBX.swing.a : 0) - 2.5,
  };
}
function setBack(v, instant = false) {
  LBX.back = v;
  lbFlip.setAttribute('aria-pressed', String(v));
  lb.classList.toggle('is-back', v);
  lbBack.inert = !v;
  if (reduce || instant) gsap.set(lbCard, { rotationY: reduce ? 0 : v ? 180 : 0 });
  else gsap.to(lbCard, { rotationY: v ? 180 : 0, duration: 0.75, ease: 'power2.inOut' });
}
function openBadge(btn, el, s, i = 0) {
  if (LBX.open || LBX.busy || !earnedCerts[i]) return;
  renderLb(i);
  // die große Karte bekommt das Seitenverhältnis dieses Zertifikats
  const im = btn.querySelector('img');
  if (im?.naturalWidth) lbCard.style.setProperty('--lbar', (im.naturalWidth / im.naturalHeight).toFixed(4));
  LBX.open = true; LBX.btn = btn; LBX.swingEl = el; LBX.swing = s;
  lb.hidden = false;
  setBack(false, true);
  lenis?.stop();
  document.documentElement.classList.add('lb-open');
  const print = btn.querySelector('.badge__print');
  if (reduce) {
    gsap.set([lbBackdrop, lbDialog, lbDialog.querySelector('.lb__bar')], { opacity: 1 });
    lbFlip.focus();
    return;
  }
  LBX.busy = true;
  // an der Leine (Zertifikate): Klammer öffnet sich; aus dem Lebenslauf (ohne Leine): nur fliegen
  if (s) s.held = true;
  if (el) gsap.to(jaws(el), { rotation: (i) => (i ? 16 : -16), svgOrigin: '11 28', duration: 0.18, ease: 'power2.out' });
  const from = srcTransform();
  gsap.set(lbDialog.querySelector('.lb__bar'), { opacity: 0 });
  gsap.fromTo(lbBackdrop, { opacity: 0 }, { opacity: 1, duration: 0.5 });
  gsap.fromTo(lbFly, from, {
    x: 0, y: 0, scale: 1, rotation: 0, duration: 0.8, delay: 0.12, ease: 'power3.inOut',
    onStart: () => { print.style.visibility = 'hidden'; },
    onComplete: () => { LBX.busy = false; gsap.to(lbDialog.querySelector('.lb__bar'), { opacity: 1, duration: 0.25 }); lbFlip.focus(); },
  });
}
function closeBadge() {
  if (!LBX.open || LBX.busy) return;
  const { btn, swingEl: el, swing: s } = LBX;
  const print = btn.querySelector('.badge__print');
  const done = () => {
    lb.hidden = true; LBX.open = false; LBX.busy = false;
    print.style.visibility = '';
    gsap.set([lbFly, lbTilt, lbCard], { clearProps: 'transform' });
    lenis?.start();
    document.documentElement.classList.remove('lb-open');
    btn.focus({ preventScroll: true });
  };
  if (reduce) { done(); return; }
  LBX.busy = true;
  if (LBX.back) setBack(false);
  gsap.to(lbTilt, { rotationX: 0, rotationY: 0, duration: 0.3 });
  gsap.to(lbDialog.querySelector('.lb__bar'), { opacity: 0, duration: 0.15 });
  gsap.to(lbBackdrop, { opacity: 0, duration: 0.6, delay: 0.15 });
  const to = srcTransform();
  gsap.fromTo(lbFly, { x: 0, y: 0, scale: 1, rotation: 0 }, {
    ...to, duration: 0.75, ease: 'power3.inOut',
    onComplete: () => {
      done();
      if (s) { s.held = false; s.v += 70; }                          // kleiner Schubs beim Wiederanklammern
      if (el) gsap.to(jaws(el), { rotation: 0, svgOrigin: '11 28', duration: 0.6, ease: 'elastic.out(1.2, 0.35)' });
    },
  });
}
lbFlip.addEventListener('click', () => setBack(!LBX.back));
lbCard.addEventListener('click', (e) => { if (!e.target.closest('a')) setBack(!LBX.back); });
lbClose.addEventListener('click', closeBadge);
lbBackdrop.addEventListener('click', closeBadge);
lb.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') { e.preventDefault(); closeBadge(); return; }
  if (e.key !== 'Tab') return;
  // Fokus bleibt im Fenster
  const f = [...(LBX.back ? lbBack.querySelectorAll('a') : []), lbFlip, lbClose];
  const i = f.indexOf(document.activeElement);
  e.preventDefault();
  f[(i + (e.shiftKey ? -1 : 1) + f.length) % f.length].focus();
});
// leichte 3D-Neigung, die dem Zeiger folgt (nur Maus)
if (fine && !reduce) {
  lb.addEventListener('pointermove', (e) => {
    if (LBX.busy) return;
    const r = lbFly.getBoundingClientRect();
    const nx = clamp((e.clientX - (r.left + r.width / 2)) / (r.width / 2), -1.2, 1.2);
    const ny = clamp((e.clientY - (r.top + r.height / 2)) / (r.height / 2), -1.2, 1.2);
    gsap.to(lbTilt, { rotationY: nx * 7, rotationX: -ny * 6, duration: 0.5, ease: 'power2.out' });
  });
  lb.addEventListener('pointerleave', () => gsap.to(lbTilt, { rotationX: 0, rotationY: 0, duration: 0.6 }));
}

/* ================= Musik: die Sommersonne ist die Schallplatte ================= */
// Musik gibt es nur am Plattenspieler in „Über mich“ (Platte anklicken, Knopf am Koffer). Nie automatisch.
let DECK = null;
const sunEl = $('#sun');
function initMusic() {
  DECK = initDeck(spinEl, { variant: 'case', onChange: (on) => { MUSIC_ON = on; spinEl.classList.toggle('is-playing', on); } });
}
// Sichtbarkeit der Sonne folgt dem Sommer (aus frame); unsichtbar ist sie nicht bedienbar (inert)
let sunShown = null;
function setSun(summer, autumn) {
  if (!sunEl) return;   // die Sonne steht außerhalb des Bildes, es gibt kein eigenes Element mehr
  // erst wenn der Sommer richtig da ist (kein blasser Geist über „Über mich“), mit dem Herbst wieder weg
  const a = clamp((summer - 0.35) / 0.45, 0, 1) * (1 - clamp(autumn * 1.6, 0, 1));
  sunEl.style.opacity = a.toFixed(3);
  const on = a > 0.5;
  if (on !== sunShown) { sunShown = on; sunEl.classList.toggle('is-on', on); }
}

/* ================= Start ================= */
const WX = initWeather({ reduce, veil: () => (reduce ? 0 : fogBump(S.fog)) }).state;   // Jahreszeiten-Effekte je Abschnitt (weather/*.js)
// Lebenslauf als Weg an der Leine (cv.js); bei Sprachwechsel neu gebaut
let CV = null;
function renderCv() {
  dropSwings('cv');
  CV = initCv($('#cvPanel'), { addSwing, dropSwings, fine, data: D, t: T });
  // Zertifikat im Lebenslauf öffnet dasselbe große Zertifikat wie an der Leine
  CV.certBtns.forEach((b) => b.addEventListener('click', () => openBadge(b, null, null, +b.dataset.cert || 0)));
}
renderCv();
applyStatic();

/* ================= Sprachwechsel DE | EN ================= */
// Echte Knöpfe mit aria-pressed. Beim Wechsel wird jeder Text neu geschrieben (ohne Neuladen);
// spielerisch: die Buchstaben des großen Namens kippen kurz, alles an den Leinen schaukelt.
function setLang(l) {
  if (l === LANG || !STR[l]) return;
  // Stelle merken, an der man gerade liest, damit sie nach dem Umschreiben nicht springt
  const anchor = [...document.querySelectorAll('.sec')].find((s) => s.getBoundingClientRect().bottom > 120);
  const before = anchor?.getBoundingClientRect().top;
  LANG = l; D = DATA[l]; T = STR[l];
  saveLang(l);
  try { const u = new URL(location.href); if (u.searchParams.has('lang')) { u.searchParams.set('lang', l); history.replaceState(null, '', u); } } catch { /* egal */ }
  applyStatic();
  renderAbout();
  dropSwings('about'); addSwing($('#pinSwing'), 7, 0.8, 'about');
  renderProjects();
  renderCertData(); renderLb();
  renderCv();
  renderContact();
  resizeAll(); buildCerts(true);
  ScrollTrigger.refresh();
  if (anchor && before != null) {
    const d = anchor.getBoundingClientRect().top - before;
    if (Math.abs(d) > 1) { if (lenis) lenis.scrollTo(scrollY + d, { immediate: true }); else scrollBy(0, d); }
  }
  if (!reduce) {
    nameBtn.classList.remove('flip'); void nameBtn.offsetWidth; nameBtn.classList.add('flip');
    for (const s of swings) s.v += (Math.random() < 0.5 ? -1 : 1) * (60 + Math.random() * 50);
  }
}
// Anhänger an der Hero-Leine: angeklickter Anhänger schaukelt kräftig, dann wechselt die Sprache
document.querySelectorAll('.tag--lang').forEach((b, i) => b.addEventListener('click', () => {
  if (!reduce) hangSwings[i].v += (i % 2 ? -1 : 1) * 90;
  setLang(b.dataset.lang);
}));
nameBtn.addEventListener('animationend', (e) => { if (e.animationName === 'langFlip' && e.target === nameBtn.lastElementChild?.lastElementChild) nameBtn.classList.remove('flip'); });

buildAll();
resizeAll();
addEventListener('load', () => {
  measureY();
  // Bilder schon vorher entpacken (wenn der Browser Zeit hat), damit es beim ersten Hinscrollen nicht ruckelt
  const idle = window.requestIdleCallback || ((f) => setTimeout(f, 300));
  idle(() => { for (const im of document.images) if (im.complete && im.naturalWidth) im.decode?.().catch(() => {}); }, { timeout: 3000 });
});
frame(0, 16);
measureName();
initMusic();
// ohne Animationen trotzdem die Jahreszeit beim Scrollen anpassen
if (reduce) { let q = 0; addEventListener('scroll', () => { cancelAnimationFrame(q); q = requestAnimationFrame(() => frame(0, 16)); }, { passive: true }); }
// einmal von selbst: kurz nach dem Lade-Moment wird aus „Felix“ → „Feliks“
setTimeout(() => { if (!nameTouched && felix) setName(false); }, reduce ? 1500 : 3400);
if (!reduce) {
  gsap.ticker.add((t, d) => frame(t, d));
  gsap.to(S, { intro: 0, duration: 2.8, ease: 'power3.out', delay: 0.05 });
  gsap.to(S, { nameIn: 1, duration: 1.6, ease: 'power2.out', delay: 0.35 });
  hangSwings.forEach((s, i) => (s.v = i % 2 ? -40 : 50));
}

let rT;
addEventListener('resize', () => {
  clearTimeout(rT);
  rT = setTimeout(() => { resizeAll(); measureName(); ScrollTrigger.refresh(); if (reduce) frame(0, 16); }, 120);
});
document.fonts && document.fonts.ready.then(() => { buildCerts(); CV?.layout(); measureName(); measureY(); ScrollTrigger.refresh(); if (reduce) frame(0, 16); });

// Umschalter zwischen den Varianten nur beim Entwickeln (im fertigen Build fällt dieser Teil ganz weg)
if (import.meta.env.DEV) import('/shared/switch.js').then((m) => m.addSwitch('seasons'));

