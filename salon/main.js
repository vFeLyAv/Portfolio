// Salon (aus v-artheart): eine Museums-Salonwand. Jeder Goldrahmen hält eine Arbeit von Felix.
// Spotlight folgt dem Cursor, Klick auf einen Rahmen = näher herantreten (Zoom + großes Etikett).
// Aus „Jahreszeiten“ übernommen: Plattenspieler (deck.js), Bunprise-Banner als Video, Skip-Link,
// Kopieren mit Ersatzweg, Leseposition bleibt beim Sprachwechsel, Bilder werden vorab entpackt.
// Projekt-Extras und Design-Studien: works.js.
import { DATA, LANGS, UI, pickLang, saveLang } from './i18n.js';
import { PROJECT_LOOK, DEFAULT_LOOK, STUDIES, FACT_PHOTOS, studyImg, posterImg, studyUrl } from './works.js';
import { initDeck } from './deck.js';
import { LQIP } from './lqip.js';   // winzige Vorschauen (erzeugt mit _tools/lqip.py)
import framePng from './frame.png';   // Goldrahmen als Bild für den Leicht-Modus (siehe unten)
import { Bunny } from './vendor/bunny.js';   // echtes Bunprise-Maskottchen (gebündelt aus wishcal/packages/mascot)
import { initLight, initNotes, initLetters, lettersify, initOrnaments, preloadImages, buildCV, hangFacts, initExit } from './effects.js';
import { initPortrait } from './portrait3d.js';   // Mittelbild als 3D-Porträt (Tiefenkarte + WebGL)
import { initUhr } from './uhr.js';               // Pendeluhr im Saal IV (Regensburger Zeit)
import { markTorn, sealCerts, hangSconces } from './wow.js';   // Eintrittskarte, Wachssiegel, Wandleuchten
import './experimente.js';   // Türen zwischen den Sälen – abschaltbar (siehe Datei oder ?ohne=tueren)
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
const lite = document.documentElement.classList.contains('lite');   // Leicht-Modus (iPad/iPhone/Touch), gesetzt in index.html
const root = document.documentElement;

let lang = pickLang();
const d = () => DATA[lang];
const u = () => UI[lang];
const lvl = (x) => x.label ?? x.level;
const look = (i) => ({ ...DEFAULT_LOOK, ...PROJECT_LOOK[i] });
const newTab = () => `<span class="sr-only"> ${esc(u().newTab)}</span>`;
// Unscharfe Vorschau als Hintergrund des Bildes: sichtbar, bis das echte Foto geladen ist (danach liegt es darüber).
// pos = derselbe Ausschnitt wie object-position, damit die Vorschau genau unter dem späteren Bild liegt.
const ph = (src, pos = '50% 50%') => (LQIP[src] ? `background:url(${LQIP[src]}) ${pos} / cover no-repeat;` : '');

/* ------------------------------------------------------------ Exponate */

// Alle Bilder an der Wand. open = was beim Herantreten als großes Etikett erscheint.
// ratio = echtes Seitenverhältnis des Bildes (der Rahmen kommt außen dazu, nichts wird abgeschnitten).
function works() {
  const D = d(), U = u();
  const W = {
    suit: { img: '/img/felix/center-9594.jpg', ratio: '960 / 959', pos: '50% 30%', open: 'about', title: U.works.suit, meta: U.photo },   // Mittelbild: IMG_9594 (Hände rahmen das Bild)
    night: { img: '/img/sony-dsc06015-photo.jpg', ratio: '1256 / 1800', pos: '50% 50%', open: 'about', title: U.works.night, meta: U.works.nightMeta },
    balloons: { img: '/img/balloons-edit.jpg', ratio: '3 / 4', pos: '50% 48%', open: 'about', title: U.works.balloons, meta: U.photo },
  };
  D.projects.forEach((p, i) => {
    const L = look(i);
    const mat = L.mat[lang];
    W[`proj${i}`] = { img: L.img || p.img, video: L.video, ratio: L.ratio, pos: L.pos, open: `project:${i}`, title: p.title, meta: mat ? `${p.when}, ${mat}` : p.when };
  });
  D.certificates.filter((c) => c.status === 'erhalten').forEach((c, i) => {
    W[`cert${i + 1}`] = { img: c.img, ratio: '1584 / 1091', pos: '50% 50%', open: 'certs', title: c.title, meta: `${c.issuer}, ${c.date}`, liner: true };
  });
  return W;
}

// Bild oder (bei Bunprise) Video im Rahmen. Video: stumm, Schleife, läuft nur, solange es sichtbar ist.
function media(w, lazy) {
  // Foyer: Bunprise als kleine Bühne — Name und Satz oben, darunter der Hase, der ab und zu winkt (mountBunny)
  if (w.live === 'bunny') {
    return `<span class="bp-card"><span class="bp-name">Bunprise</span><span class="bp-sub">Plans and wishes – together with friends</span><span class="bp-bunny"></span></span>`;
  }
  if (w.video && !reduced) {
    return `<video src="${esc(w.video)}" poster="${esc(w.img)}" muted playsinline loop preload="none" aria-hidden="true" style="object-position:${w.pos};${ph(w.img, w.pos)}"></video>`;
  }
  return `<img src="${esc(w.img)}" alt="" ${lazy ? 'loading="lazy"' : ''} decoding="async" style="object-position:${w.pos};${ph(w.img, w.pos)}">`;
}

function exhibit(id, w, { cls = '', label = true, lazy = true } = {}) {
  const U = u();
  if (!w) return '';
  return `
    <div class="exhibit ex-${id} ${cls}" style="--ratio:${w.ratio}">
      <button class="frame${w.liner ? ' frame-liner' : ''}" type="button" data-open="${w.open}"
        aria-label="${esc(`${w.title}, ${w.meta}. ${U.open}`)}">
        <span class="art">${media(w, lazy)}</span>
      </button>
      ${label ? `<p class="label" aria-hidden="true"><b>${esc(w.title)}</b><span>${esc(w.meta)}</span></p>` : ''}
    </div>`;
}

/* ------------------------------------------------------------ Inhalte */

const LEVEL = { Grundlagen: 1, gut: 2, fortgeschritten: 3, 'im Alltag': 3 };
const dots = (level) => {
  const n = LEVEL[level];
  if (!n) return '';
  return `<span class="dots" aria-hidden="true">${[1, 2, 3].map((i) => `<i class="${i <= n ? 'on' : ''}"></i>`).join('')}</span>`;
};

const aboutText = () => d().about.map((p) => `<p>${esc(p)}</p>`).join('');
const factList = (cls = 'facts') => `<ul class="${cls}">${d().facts.map((f, i) => `
  <li class="fact${FACT_PHOTOS[i] ? ' has-photo' : ''}" style="--r:${[-1.4, 0.9, -0.5, 1.2, -1, 0.6, -0.7][i % 7]}deg">
    <span class="fact-pin" aria-hidden="true"></span><span class="fact-no" aria-hidden="true">Nº ${i + 1}</span>
    ${FACT_PHOTOS[i] ? `<span class="fact-photo" aria-hidden="true"><img src="${esc(FACT_PHOTOS[i])}" alt="" loading="lazy" decoding="async" style="${ph(FACT_PHOTOS[i])}"></span>` : ''}
    <h4>${esc(f.title)}</h4><p>${esc(f.text)}</p>
  </li>`).join('')}</ul>`;

function projectCard(p, i, { heading = 'h3', id = '' } = {}) {
  const U = u();
  const mat = look(i).mat[lang];
  const H = heading;
  return `
    <${H} ${id ? `id="${id}"` : ''} class="card-title">${p.icon ? `<img class="card-icon" src="${esc(p.icon)}" alt="" width="44" height="44">` : ''}${esc(p.title)}</${H}>
    <p class="card-meta">${esc(p.when)}${mat ? `, ${esc(mat)}` : ''}</p>
    <p>${esc(p.text)}</p>
    ${p.url ? `<p class="actions"><a class="btn" href="${esc(p.url)}" target="_blank" rel="noopener">${esc(U[look(i).cta] || U.visit)}${newTab()}</a></p>` : ''}`;
}

function certCard(c, { heading = 'h3' } = {}) {
  const U = u();
  const H = heading;
  if (c.status === 'erhalten') {
    return `
      <${H} class="card-title">${esc(c.title)}</${H}>
      <p class="card-meta">${esc(c.issuer)}</p>
      <p class="card-status">${esc(U.earned)} ${esc(c.date)}</p>
      <p class="actions">
        <a class="btn" href="${esc(c.url)}" target="_blank" rel="noopener">${esc(U.verify)}${newTab()}</a>
        <a class="btn btn-ghost" href="${esc(c.pdf)}" target="_blank" rel="noopener">${esc(U.pdf)}${newTab()}</a>
      </p>`;
  }
  return `
    <${H} class="card-title">${esc(c.title)}</${H}>
    <p class="card-meta">${esc(c.issuer)}</p>
    <p class="card-status is-wip">${esc(c.label ?? U.inProgress)}</p>
    <p class="actions"><a class="btn btn-ghost" href="${esc(c.url)}" target="_blank" rel="noopener">${esc(U.course)}${newTab()}</a></p>`;
}

function renderSalon() {
  const W = works();
  // Reihenfolge = Tab-Reihenfolge: erst das große Bild in der Mitte, dann im Uhrzeigersinn
  // oben links hing früher „Im gelben Raum“ (öffnete wie das Mittelbild nur „Über mich“) → jetzt das Flipper-Projekt als Hochformat-Poster;
  // „Im gelben Raum“ hängt dafür unten links (dort war vorher „Auf dem Weihnachtsmarkt“, gefiel Felix nicht)
  const order = ['suit', 'proj0', 'proj1', 'proj2', 'cert2', 'balloons', 'cert1', 'proj3'];
  const map = { proj0: 'bunprise', proj1: 'depth', proj2: 'render', proj3: 'flipper' };   // CSS-Namen der Plätze an der Wand
  W.proj0 = { ...W.proj0, live: 'bunny' };   // im Foyer: winkender Hase statt Video
  W.proj3 = { ...W.proj3, img: '/img/flipper-poster.jpg', ratio: '3 / 4' };   // im Foyer: die Flipper-Seite im Hochformat (900×1200), passt in den Platz oben links
  $('[data-slot="salon"]').innerHTML = order.map((id) => exhibit(map[id] || id, W[id], { lazy: false })).join('');
  mountBunny();
}

// Bunprise-Hase im Foyer: Idle (blinzeln, schnuppern) und alle paar Sekunden „greet“ (Sternaugen, winkt).
// Nur solange das Foyer sichtbar ist; bei reduzierter Bewegung steht er still (macht das Paket selbst).
let bunny = null, bunnyTimer = 0, foyerSeen = true;
function mountBunny() {
  bunny?.destroy(); clearInterval(bunnyTimer);
  const host = $('.bp-bunny');
  if (!host) return;
  bunny = new Bunny(host, { coat: 'fawn', ears: 'lop', size: Math.max(60, Math.round(host.clientWidth)), idle: true, interactive: false });
  const greet = () => { if (foyerSeen && !document.hidden) bunny?.play('greet'); };
  setTimeout(greet, 1400);
  bunnyTimer = setInterval(greet, 6500);
}
new IntersectionObserver(([e]) => { foyerSeen = e.isIntersecting; }).observe($('.foyer'));
addEventListener('resize', () => { const h = $('.bp-bunny'); if (bunny && h) bunny.setSize(Math.max(60, Math.round(h.clientWidth))); });

const spinEl = $('#spin');
function renderAbout() {
  const W = works();
  $('[data-slot="about"]').innerHTML = `
    <div class="about-grid">
      ${exhibit('night', W.night, { cls: 'inline' })}
      <div class="panel about-text">${aboutText()}</div>
    </div>
    <div class="about-lower">
      <div class="about-facts">
        <h3 class="sub">${esc(u().facts)}</h3>
        ${factList()}
      </div>
      <div class="spin-slot"></div>
    </div>`;
  $('.spin-slot').append(spinEl);   // derselbe Plattenspieler, Musik läuft weiter
}

function renderProjects() {
  const W = works();
  $('[data-slot="projects"]').innerHTML = d().projects.map((p, i) => `
    <article class="work work-${i < 3 ? i : 'n'}${i >= 3 && i % 2 ? ' work-flip' : ''}">
      ${exhibit(`proj${i}`, W[`proj${i}`], { cls: 'inline', label: false })}
      <div class="card">${projectCard(p, i)}</div>
    </article>`).join('');
}

// Vom Poster zur Website: großes Bild der Website, das Poster steckt klein davor
function renderStudies() {
  const U = u();
  $('[data-slot="studies"]').innerHTML = `
    <section class="studies" aria-labelledby="t-studies">
      <h3 class="sub" id="t-studies">${esc(U.studies)}</h3>
      <p class="studies-lead">${esc(U.studiesLead)}</p>
      <div class="study-grid">
        ${STUDIES.map((s, i) => {
          const name = s.name[lang], url = studyUrl(s);
          const poster = s.poster === false
            ? `<div class="frame frame-empty" aria-hidden="true"><span class="art"><span class="empty-note">${esc(U.noPoster)}</span></span></div>`
            : `<button class="frame frame-liner" type="button" data-open="study:${i}" aria-label="${esc(`${U.poster}: ${U.posterFrom(s.from)}. ${U.open}`)}">
                 <span class="art"><img src="${esc(posterImg(s))}" alt="" loading="lazy" decoding="async" style="${ph(posterImg(s))}"></span></button>`;
          return `
          <article class="study">
            <div class="study-pair">
              <div class="exhibit study-site" style="--ratio:16 / 10">
                <button class="frame" type="button" data-open="study:${i}" aria-label="${esc(`${U.website} ${name}. ${U.open}`)}">
                  <span class="art"><img src="${esc(studyImg(s))}" alt="" loading="lazy" decoding="async" style="${ph(studyImg(s))}"></span>
                </button>
              </div>
              <div class="exhibit study-poster" style="--ratio:${s.poster === false ? '4 / 5' : '4 / 5'}">${poster}</div>
            </div>
            <p class="study-plaque" aria-hidden="true">${esc(name)}</p>
          </article>`;
        }).join('')}
      </div>
    </section>`;
}

function renderCerts() {
  const W = works();
  const earned = d().certificates.filter((c) => c.status === 'erhalten');
  const wip = d().certificates.filter((c) => c.status !== 'erhalten');
  $('[data-slot="certs"]').innerHTML = `
    <div class="certs-earned">
      ${earned.map((c, i) => `
        <article class="cert">
          ${exhibit(`cert${i + 1}`, W[`cert${i + 1}`], { cls: 'inline', label: false })}
          <div class="card">${certCard(c)}</div>
        </article>`).join('')}
    </div>
    <div class="certs-wip">
      ${wip.map((c) => `
        <article class="cert">
          <div class="exhibit inline" style="--ratio:4 / 3"><div class="frame frame-empty" aria-hidden="true"><span class="art"><span class="empty-note">${esc(u().emptyFrame)}</span></span></div></div>
          <div class="card">${certCard(c)}</div>
        </article>`).join('')}
    </div>`;
}

function renderCV() {
  const D = d(), U = u();
  const line = (x) => `<li><span class="when">${esc(x.when)}</span><b>${esc(x.what)}</b><span class="detail">${esc(x.detail)}</span></li>`;
  $('[data-slot="cv"]').innerHTML = `
    <div class="infopanel">
      <div class="ip-col">
        <h3>${esc(U.school)}</h3>
        <ol class="timeline">${D.school.map(line).join('')}</ol>
        <h3>${esc(U.practice)}</h3>
        <ol class="timeline">${D.practice.map(line).join('')}</ol>
      </div>
      <div class="ip-col">
        <h3>${esc(U.skills)}</h3>
        ${D.skills.map((g) => `
          <h4>${esc(g.group)}</h4>
          <ul class="skills">${g.items.map((s) => `<li><span>${esc(s.what)}</span><span class="lv">${dots(s.level)}<em>${esc(lvl(s))}</em></span></li>`).join('')}</ul>`).join('')}
        <h3>${esc(U.languages)}</h3>
        <ul class="skills">${D.languages.map((l) => `<li><span>${esc(l.lang)}</span><span class="lv"><em>${esc(lvl(l))}</em></span></li>`).join('')}</ul>
        <h3>${esc(U.interests)}</h3>
        <ul class="plain">${D.interests.map((x) => `<li><b>${esc(x.what)}</b> <span class="detail">${esc(x.detail)}</span></li>`).join('')}</ul>
        <h3>${esc(U.documents)}</h3>
        <ul class="docs">${D.documents.map((x) => `<li><span><b>${esc(x.title)}</b> <span class="detail">${esc(x.when)}</span></span><span class="tag">${esc(x.label ?? x.status)}</span></li>`).join('')}</ul>
      </div>
    </div>`;
  buildCV($('[data-slot="cv"]'));   // baut sich beim Hinscrollen Stück für Stück auf (effects.js)
}

// weitere Wege neben der E-Mail: [Beschriftung, Link, Text, neuer Tab?]; fehlende Angaben fallen einfach weg
// jede Zeile: [Beschriftung, [[Link, Text, neuer Tab?], …]]; Telegram darf mehrere Namen haben
function contactRows(C) {
  const U = u(), digits = (C.phone || '').replace(/[^\d+]/g, '');
  const tg = [].concat(C.telegram || []);
  return [
    C.phone && [U.phone, [[`tel:${digits}`, C.phone, false]]],
    C.phone && ['WhatsApp', [[`https://wa.me/${digits.replace('+', '')}`, C.phone, true]]],
    tg.length && ['Telegram', tg.map((n) => [`https://t.me/${n}`, `@${n}`, true])],
    C.instagram && [U.instagram, [[`https://www.instagram.com/${C.instagram}/`, `@${C.instagram}`, true]]],
    C.github && ['GitHub', [[`https://github.com/${C.github}`, `github.com/${C.github}`, true]]],
  ].filter(Boolean);
}

function renderContact() {
  const C = d().contact, U = u();
  $('[data-slot="contact"]').innerHTML = `
    <div class="book">
      <div class="page page-l">
        <p class="gb-title">${esc(U.guestbook)}</p>
        <p class="gb-line">${esc(U.guestLine)}</p>
        <div class="gb-rules" aria-hidden="true"></div>
      </div>
      <div class="page page-r">
        <p class="gb-label">${esc(U.email)}</p>
        <p class="gb-big"><a href="mailto:${esc(C.email)}">${esc(C.email).replace('@', '<wbr>@')}</a></p>
        <p class="actions"><button class="btn copy" type="button">${esc(U.copy)}</button> <span class="copy-status" role="status"></span></p>
        <ul class="gb-more">${contactRows(C).map(([label, links]) => `
          <li><span class="gb-label">${esc(label)}</span><span class="gb-links">${links.map(([href, text, ext]) => `<a href="${esc(href)}"${ext ? ' target="_blank" rel="noopener"' : ''}>${esc(text)}${ext ? newTab() : ''}</a>`).join('')}</span></li>`).join('')}
        </ul>
      </div>
    </div>
    <div class="exit-row">
      <div class="tickets tickets-exit" role="group" aria-label="${esc(U.langGroup)}"></div>
      <a class="to-top" href="#foyer">${esc(U.toTop)}</a>
    </div>`;
  $('.copy').addEventListener('click', copyMail);
}

function renderTickets() {
  const U = u();
  $$('.tickets').forEach((box) => {
    box.setAttribute('aria-label', U.langGroup);
    box.innerHTML = LANGS.map((l, i) => `
      <button class="ticket" type="button" lang="${l}" data-lang="${l}" aria-pressed="${l === lang}" style="--tr:${[-4, 2, 5][i]}deg">
        <span class="t-code">${esc(U.ticketWord)}</span>
        <span class="t-big">${l.toUpperCase()}</span>
        <span class="t-name">${esc(U.langName[l])}</span>
      </button>`).join('');
  });
}

function renderStatic() {
  const U = u();
  const get = (key) => key.split('.').reduce((o, k) => o?.[k], U);
  $$('[data-i18n]').forEach((el) => { const v = get(el.dataset.i18n); if (typeof v === 'string') el.textContent = v; });
  $$('.room-head h2').forEach((h) => lettersify(h));
  $$('[data-i18n-aria]').forEach((el) => { const v = get(el.dataset.i18nAria); if (typeof v === 'string') el.setAttribute('aria-label', v); });
  document.title = U.docTitle;
  document.documentElement.lang = lang;
  $('meta[name="description"]')?.setAttribute('content', U.metaDesc);
}

function render() {
  renderStatic();
  renderSalon();
  renderAbout();
  initPortrait(document);   // 3D-Bilder (Foyer + Saal I), nach jedem Neuzeichnen (Sprachwechsel) neu aufsetzen
  hangFacts($('.room-about .facts'));   // Exponat-Karten: werden beim Hinscrollen aufgehängt (effects.js)
  renderProjects();
  renderStudies();
  renderCerts();
  sealCerts();   // Wachssiegel (wow.js)
  renderCV();
  renderContact();
  renderTickets();
  markTorn();    // abgerissene Karte behält Rand + Stempel (wow.js)
  watchVideos();
  preloadImages();
  if (deckReady) markSleeves();   // Beschriftungen der Hüllen in der neuen Sprache
}
let deckReady = false;

/* ------------------------------------------------------------ Videos */

// Videos (Bunprise-Banner) laufen nur, solange sie zu sehen sind
let videoIO = null;
function watchVideos() {
  videoIO?.disconnect();
  const vids = $$('video');
  if (!vids.length) return;
  videoIO = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.isIntersecting) { e.target.preload = 'auto'; e.target.play().catch(() => {}); } else e.target.pause();
    }
  }, { threshold: 0.15 });
  vids.forEach((v) => videoIO.observe(v));
}

/* ------------------------------------------------------------ Sprache */

document.addEventListener('click', (e) => {
  const t = e.target.closest('.ticket');
  if (!t || t.dataset.lang === lang) return;
  const wasExit = !!t.closest('.tickets-exit');
  // Stelle merken, an der man gerade liest, damit sie nach dem Umschreiben nicht springt
  const anchor = $$('.room').find((s) => s.getBoundingClientRect().bottom > 120);
  const before = anchor?.getBoundingClientRect().top;
  lang = t.dataset.lang;
  saveLang(lang);
  const url = new URL(location.href);
  if (url.searchParams.has('lang')) { url.searchParams.set('lang', lang); history.replaceState(null, '', url); }
  render();
  fitHeadline();
  if (anchor && before != null) {
    const dy = anchor.getBoundingClientRect().top - before;
    if (Math.abs(dy) > 1) scrollBy(0, dy);
  }
  // Fokus auf dem gleichen Ticket halten
  $(`${wasExit ? '.tickets-exit ' : '.admission '}.ticket[data-lang="${lang}"]`)?.focus({ preventScroll: true });
});

/* ------------------------------------------------------------ Kontakt */

async function copyText(text) {
  try { await navigator.clipboard.writeText(text); return true; } catch { /* älterer Weg */ }
  const ta = document.createElement('textarea');
  ta.value = text; ta.setAttribute('readonly', ''); ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0';
  document.body.append(ta); ta.select();
  let ok = false;
  try { ok = document.execCommand('copy'); } catch { ok = false; }
  ta.remove();
  return ok;
}
async function copyMail() {
  const U = u();
  const status = $('.copy-status');
  status.textContent = (await copyText(d().contact.email)) ? U.copied : U.copyFail;
  clearTimeout(copyMail.t);
  copyMail.t = setTimeout(() => { status.textContent = ''; }, 3200);
}

/* ------------------------------------------------------------ Headline */

// Zeile 2 (KOLOMOIETS) bekommt genau die Breite von FELIKS (dem Endzustand).
function fitHeadline() {
  const l1 = $('.hl-1'), l2 = $('.hl-2');
  const probe = document.createElement('span');
  probe.className = 'hl-probe';
  probe.textContent = 'FELIKS';
  l1.append(probe);
  const w1 = probe.getBoundingClientRect().width;
  probe.remove();
  l2.style.fontSize = '';
  const base = parseFloat(getComputedStyle(l2).fontSize);
  const w2 = l2.getBoundingClientRect().width;
  if (w1 && w2) l2.style.fontSize = `${(base * w1 / w2).toFixed(2)}px`;
}

// FELIKS ⇄ FELIX: Start auf FELIX (Klasse hl-felix aus dem <head>), kurz danach wird daraus FELIKS.
// Danach wechselt jeder Klick auf den Vornamen hin und her. Das X verschwimmt wie ein Echo,
// K und S treten aus der Unschärfe (und umgekehrt). Ohne JS und bei reduzierter Bewegung: sofortiger Wechsel.
const nameBtn = $('.hl-btn');
let nameTouched = false, nameAnim = null;
const isFelix = () => root.classList.contains('hl-felix');
// natürliche Breite eines Textstücks in der Schrift der ersten Zeile
function textWidth(t) {
  const probe = document.createElement('span');
  probe.className = 'hl-probe'; probe.textContent = t;
  $('.hl-1').append(probe);
  const w = probe.getBoundingClientRect().width;
  probe.remove();
  return w;
}
let nameTarget = isFelix();   // Zustand, zu dem der Name gerade hinläuft (Klick mitten in der Animation kehrt um)
function setName(toFelix, delay = 0) {
  const ks = $('.hl-ks'), x = $('.hl-x');
  // laufende Animation sofort beenden und ihren Endzustand übernehmen
  if (nameAnim) { const prev = nameAnim; nameAnim = null; prev.commit(); }
  nameTarget = toFelix;
  nameBtn.setAttribute('aria-pressed', String(toFelix));
  if (reduced) { root.classList.toggle('hl-felix', toFelix); return; }
  const wKs = textWidth('KS'), wX = textWidth('X');
  const shown = { opacity: 1, filter: 'blur(0px)' };
  const opts = { duration: toFelix ? 1100 : 1500, easing: 'cubic-bezier(.6,.05,.25,1)', fill: 'both', delay };
  const out = toFelix ? ks : x, inn = toFelix ? x : ks;
  const wOut = toFelix ? wKs : wX, wIn = toFelix ? wX : wKs;
  const anims = [
    out.animate([{ width: `${wOut}px`, ...shown }, { width: '0px', opacity: 0, filter: 'blur(16px)' }], opts),
    inn.animate([{ width: '0px', opacity: 0, filter: 'blur(14px)' }, { width: `${wIn}px`, ...shown }], { ...opts, delay: delay + 150 }),
  ];
  // danach die Animationen lösen: CSS zeigt den Endzustand, Größenänderungen bleiben sauber
  const me = { commit: () => { root.classList.toggle('hl-felix', toFelix); anims.forEach((an) => an.cancel()); } };
  nameAnim = me;
  anims[1].finished.then(() => { if (nameAnim === me) { nameAnim = null; me.commit(); } }).catch(() => {});
}
nameBtn.setAttribute('aria-pressed', String(isFelix()));
nameBtn.addEventListener('click', () => { nameTouched = true; setName(!nameTarget); });
function feliksEcho() {
  if (!isFelix()) { nameBtn.setAttribute('aria-pressed', 'false'); return; }
  if (reduced) { setName(false); return; }
  setTimeout(() => { if (!nameTouched && isFelix()) setName(false); }, 1800);
}

/* ------------------------------------------------------------ Licht, Staub, Buchstaben (effects.js) */

const light = initLight();
// weiches Scrollen mit dem Mausrad (Lenis, wie in „Jahreszeiten“); Touch bleibt nativ. Anker-Links gleiten mit.
// Im großen Etikett (Dialog) scrollt der Text normal (data-lenis-prevent).
const lenis = reduced ? null : new Lenis({ lerp: 0.1, anchors: { offset: 0 } });
if (lenis) { const lraf = (t) => { lenis.raf(t); requestAnimationFrame(lraf); }; requestAnimationFrame(lraf); }
initLetters();
// großer Name: jeder Buchstabe einzeln (die Hülle ist schon für Vorleseprogramme beschriftet)
$$('.hl-base, .hl-ks, .hl-x, .hl-2').forEach((el) => lettersify(el, false));

/* ------------------------------------------------------------ Gehen (Scroll) */

const foyer = $('.foyer');
// Leicht-Modus: vorgebackener Schatten mit echter Transparenz statt depth.png + 6 Filter + Maske + mix-blend
// (WebKit/iPad zeigte sonst ein schwarzes Rechteck). Erzeugt mit _tools/ghost-bake.py.
if (lite) { const g = $('.ghost', foyer); if (g) g.src = '/img/depth-ghost.webp'; }
// Leicht-Modus: Rahmen-PNG im Hintergrund laden und erst danach einschalten (bis dahin zeigt das CSS das eingebettete SVG)
if (lite) { const im = new Image(); im.src = framePng; im.decode().then(() => root.classList.add('frame-png'), () => {}); }
let walkRaf = 0;
function walk() {
  walkRaf = 0;
  const y = Math.min(scrollY, innerHeight * 1.2);
  foyer.style.setProperty('--walk', (y / innerHeight).toFixed(4));
}
// Nur mit Maus: auf Tablets/Handys (alle iPad-Browser = WebKit) kostet das Verschieben der vielen Bilder bei jedem
// Scroll-Bild zu viel – dort steht das Foyer still (CSS: @media (hover: none)).
if (!reduced && !lite) addEventListener('scroll', () => { if (!walkRaf) walkRaf = requestAnimationFrame(walk); }, { passive: true });

/* ------------------------------------------------------------ Herantreten */

const viewer = $('.viewer');
let active = null;        // { btn, room }: das Bild, an das man gerade herangetreten ist (auch schon während der Hinfahrt)
let finishClose = null;   // räumt nach dem Zurücktreten auf: 0,8 s später – oder sofort, wenn gleich das nächste Bild geöffnet wird

function viewerContent(key) {
  const D = d(), U = u();
  if (key === 'about') {
    return `<p class="v-kicker">${esc(U.room)} I</p><h2 id="viewer-title">${esc(U.rooms.about)}</h2>
      <div class="v-text">${aboutText()}</div>
      <h3 class="v-sub">${esc(U.facts)}</h3>${factList('facts facts-compact')}`;
  }
  if (key.startsWith('project:')) {
    const i = +key.split(':')[1];
    return `<p class="v-kicker">${esc(U.room)} II, ${esc(U.rooms.projects)}</p>${projectCard(D.projects[i], i, { heading: 'h2', id: 'viewer-title' })}`;
  }
  if (key.startsWith('study:')) {
    const s = STUDIES[+key.split(':')[1]], url = studyUrl(s);
    return `<p class="v-kicker">${esc(U.room)} II, ${esc(U.studies)}</p><h2 id="viewer-title">${esc(s.name[lang])}</h2>
      <div class="v-compare${s.poster === false ? ' v-compare-solo' : ''}">
        ${s.poster === false ? '' : `<figure><img src="${esc(posterImg(s))}" alt="${esc(U.posterFrom(s.from))}"><figcaption>${esc(U.poster)}</figcaption></figure>`}
        <figure><img src="${esc(studyImg(s))}" alt="${esc(`${U.website} ${s.name[lang]}`)}"><figcaption>${esc(U.website)}</figcaption></figure>
      </div>
      <p class="card-meta">${s.poster === false ? esc(U.noPoster) : esc(U.posterFrom(s.from))}${s.pin ? ` · <a href="${esc(s.pin)}" target="_blank" rel="noopener">${esc(U.pin)}${newTab()}</a>` : ''}</p>
      <p>${esc(s.text[lang])}</p>
      ${url ? `<p class="actions"><a class="btn" href="${esc(url)}" target="_blank" rel="noopener">${esc(U.live)}${newTab()}</a></p>` : `<p class="here">${esc(U.here)}</p>`}`;
  }
  // certs
  return `<p class="v-kicker">${esc(U.room)} III</p><h2 id="viewer-title">${esc(U.rooms.certs)}</h2>
    <div class="v-certs">${D.certificates.map((c) => `<div class="v-cert">${certCard(c, { heading: 'h3' })}</div>`).join('')}</div>`;
}

// Seite darf beim Herantreten nicht scrollen; Scrollbar-Breite ausgleichen, damit nichts springt
function lockScroll() {
  const sbw = innerWidth - root.clientWidth;
  root.style.paddingRight = sbw ? `${sbw}px` : '';
  root.classList.add('is-zoomed');
  lenis?.stop();
}
function unlockScroll() {
  root.classList.remove('is-zoomed');
  lenis?.start();
  root.style.paddingRight = '';
}

function openViewer(btn) {
  if (active) return;     // schon unterwegs zu einem Bild: ein zweiter Klick würde zwei Bilder „nah“ hinterlassen
  finishClose?.();        // Rückfahrt vom letzten Bild sofort beenden, sonst gibt ihr Timer die Seite gleich wieder frei
  const room = btn.closest('.room');
  $('[data-slot="viewer"]').innerHTML = viewerContent(btn.dataset.open);
  active = { btn, room };
  const show = () => {
    if (!viewer.open) viewer.showModal();
    viewer.scrollTop = 0;
    $('.viewer-panel').scrollTop = 0;
  };
  lockScroll();
  // Leicht-Modus: kein Heranzoomen des ganzen Saals (WebKit/iPad zeichnet dabei eine riesige Ebene neu → Ruckeln),
  // das große Etikett gleitet direkt herein.
  if (reduced || lite) { show(); return; }

  const r = btn.getBoundingClientRect();
  const s = room.getBoundingClientRect();
  const vw = innerWidth, vh = innerHeight, narrow = vw < 860;
  const t = narrow ? { x: vw / 2, y: vh * 0.2, w: vw * 0.84, h: vh * 0.3 } : { x: vw * 0.28, y: vh / 2, w: vw * 0.46, h: vh * 0.82 };
  const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
  const k = Math.min(t.w / r.width, t.h / r.height);
  room.style.transformOrigin = `${(cx - s.left).toFixed(1)}px ${(cy - s.top).toFixed(1)}px`;
  room.classList.add('zooming');
  requestAnimationFrame(() => {
    room.style.transform = `translate(${(t.x - cx).toFixed(1)}px, ${(t.y - cy).toFixed(1)}px) scale(${k.toFixed(3)})`;
  });
  light.aim(t.x, t.y);
  btn.classList.add('is-near');
  setTimeout(show, 720);
}

function closeViewer() {
  if (!active) return;
  const { btn, room } = active;
  active = null;
  btn.classList.remove('is-near');
  room.style.transform = '';
  // Der Saal fährt 0,8 s lang zurück; erst danach wird die Seite wieder freigegeben.
  const timer = reduced || lite ? 0 : setTimeout(() => finishClose?.(), 800);
  finishClose = () => {
    clearTimeout(timer);
    finishClose = null;
    room.classList.remove('zooming');
    room.style.transformOrigin = '';
    unlockScroll();
    light.release();
  };
  if (!timer) finishClose();
  btn.focus({ preventScroll: true });
}

document.addEventListener('click', (e) => {
  const btn = e.target.closest('.frame[data-open]');
  if (btn) openViewer(btn);
});
$('.viewer-close').addEventListener('click', () => viewer.close());
viewer.addEventListener('click', (e) => { if (e.target === viewer) viewer.close(); });
viewer.addEventListener('close', closeViewer);

/* ------------------------------------------------------------ Start */

render();
initOrnaments();   // Goldornamente unter den Saal-Überschriften (zeichnen sich beim Scrollen)
initExit(light);   // am Ende: Dämmerung, Ausgang-Schild springt flackernd an (effects.js)
initUhr();         // Pendeluhr neben „Lebenslauf“
hangSconces();     // Wandleuchten in jedem Saal, gehen beim Betreten an (wow.js)
// Grammophon: Musik nur nach Klick, nie automatisch. Beim Spielen wird es im Saal etwas wärmer, der Trichter atmet im Takt.
const notes = initNotes(spinEl);
const DECK = initDeck(spinEl, { variant: 'gramo', onChange: (on) => { if (on) spinEl.classList.remove('untouched'); spinEl.classList.toggle('is-playing', on); root.classList.toggle('music-on', on); notes.set(on); }, onTrack: (i) => markSleeves(i) });
// Plattenhüllen (Wand und Kiste): Klick = diese Platte auflegen; die Hülle der aufgelegten Platte ist leer
function markSleeves(i = DECK.track()) {
  $$('.sleeve[data-track]').forEach((b) => {
    const on = +b.dataset.track === i;
    b.classList.toggle('is-on', on); b.setAttribute('aria-pressed', String(on));
    const t = b.querySelector('.cover b').textContent; b.setAttribute('aria-label', on ? u().putBack(t) : u().putOn(t));
  });
}
// leere Hülle nochmal anklicken = Platte zurück in die Hülle, die Hausplatte (0) liegt wieder auf
document.addEventListener('click', (e) => { const b = e.target.closest('.sleeve[data-track]'); if (!b) return; const t = +b.dataset.track; DECK.setTrack(DECK.track() === t ? 0 : t); });
markSleeves(0);
// Schimmer um die Platte aus, sobald man sie das erste Mal anfasst (auch nur zum Scratchen)
spinEl.addEventListener('pointerdown', () => spinEl.classList.remove('untouched'), { once: true });
deckReady = true;

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
Promise.race([document.fonts.ready, wait(2500)]).then(() => { root.dataset.ready = '1'; fitHeadline(); feliksEcho(); });

// Eingang: dunkel, bis Schriften und Foyer-Bilder entpackt sind (höchstens 1,6 s, versteckt das Nachladen),
// dann weich hell + Zoom (Felix 13.11.: Dunkel + Zoom war am besten, nur das Ende darf nicht abreißen). Das Foyer
// gleitet aus leichter Vergrößerung (und am Computer aus Unschärfe) an seinen Platz. Danach Klassen weg (keine Restkosten).
// erst wenn der Browser durchatmet (requestIdleCallback, höchstens 0,6 s warten): sonst fiel das Hellwerden genau
// in die schwere erste Zeichenarbeit und ruckelte
const idle = (f) => (window.requestIdleCallback ? requestIdleCallback(f, { timeout: 600 }) : setTimeout(f, 120));
// wartet, bis ein CSS-Übergang WIRKLICH fertig ist (nicht nach der Uhr: ist das Handy gerade beschäftigt, startet der
// Übergang später – ein fester Timer nahm dann den Vorhang mitten im Hellwerden weg = „Abriss“, Felix 13.11.)
const transitionDone = (el, prop) => new Promise((r) => {
  if (!el) { r(); return; }
  const h = (e) => { if (e.target === el && e.propertyName === prop) { el.removeEventListener('transitionend', h); el.removeEventListener('transitioncancel', h); r(); } };
  el.addEventListener('transitionend', h); el.addEventListener('transitioncancel', h);
});
function lightsUp(ready) {
  ready.then(() => idle(() => requestAnimationFrame(() => requestAnimationFrame(() => {
    const done = Promise.all([transitionDone($('.curtain'), 'opacity'), transitionDone($('.salon', foyer), 'scale')]);
    root.classList.add('lights-on');
    // Klassen erst weg, wenn Vorhang UND Zoom ausgelaufen sind (Sicherung 8 s, falls ein Ereignis ausbleibt)
    Promise.race([done, wait(8000)]).then(() => root.classList.remove('intro', 'lights-on'));
  }))));
}
if (root.classList.contains('intro')) {
  const foyerImgs = $$('.foyer img').map((im) => (im.complete ? Promise.resolve() : new Promise((r) => { im.addEventListener('load', r, { once: true }); im.addEventListener('error', r, { once: true }); })).then(() => im.decode?.()).catch(() => {}));
  lightsUp(Promise.race([Promise.all([document.fonts.ready, ...foyerImgs, wait(200)]), wait(1600)]));
}
// „Zurück zum Eingang“: Licht geht aus (0,7 s), man steht wieder im Foyer, das Licht geht an wie beim Hereinkommen.
// Fängt den Klick in der Capture-Phase ab, VOR Lenis (das sonst sofort selbst zum Anker gleitet).
addEventListener('click', (e) => {
  const a = e.target.closest?.('a.to-top');
  if (!a || reduced) return;   // reduzierte Bewegung: normaler Link
  e.preventDefault(); e.stopImmediatePropagation();
  if (root.classList.contains('lights-out') || root.classList.contains('intro')) return;   // läuft schon
  root.classList.add('lights-out');
  setTimeout(() => {
    lenis ? lenis.scrollTo(0, { immediate: true, force: true }) : scrollTo(0, 0);
    root.classList.remove('lights-on');
    root.classList.add('intro', 'snap');   // Vorhang bleibt zu; snap: Foyer sofort vergrößert, ohne Übergang
    root.classList.remove('lights-out');
    requestAnimationFrame(() => root.classList.remove('snap'));
    lightsUp(wait(350));
  }, 700);
}, true);
document.fonts.addEventListener?.('loadingdone', () => fitHeadline());
addEventListener('resize', () => { fitHeadline(); });
// Nur mit Maus (Desktop): auf iPad/Handy füllt das ALLE Bilder entpackt in den Speicher → WebKit wirft dann
// beim Scrollen gezeichnete Stücke weg (Felix' iPad, 10.11.2026). Dort reicht preloadImages() (1,5 Bildschirme voraus).
if (!lite) addEventListener('load', () => {
  // Bilder schon vorher entpacken (wenn der Browser Zeit hat), damit es beim ersten Hinscrollen nicht ruckelt
  const idle = window.requestIdleCallback || ((f) => setTimeout(f, 300));
  idle(() => { for (const im of document.images) if (im.complete && im.naturalWidth) im.decode?.().catch(() => {}); }, { timeout: 3000 });
});

if (import.meta.env.DEV) { const { addSwitch } = await import('/shared/switch.js'); addSwitch('salon'); }

// Nur beim Entwickeln, mit …/salon/?fps: kleiner Zähler oben links – Bilder pro Sekunde, längstes Bild der letzten
// 2 Sekunden und alle Ruckler (> 25 ms) seit dem Laden. Klick darauf setzt die Ruckler auf 0.
if (import.meta.env.DEV && new URLSearchParams(location.search).has('fps')) {
  const box = document.createElement('div');
  box.style.cssText = 'position:fixed;left:8px;top:8px;z-index:2000;padding:6px 9px;font:600 12px/1.35 ui-monospace,monospace;color:#fff;background:rgba(0,0,0,.72);border-radius:6px;white-space:pre;cursor:pointer';
  document.body.append(box);
  let last = performance.now(), janks = 0;
  const frames = [];
  box.addEventListener('click', () => { janks = 0; });
  const loop = (t) => {
    const d = t - last; last = t;
    frames.push([t, d]); if (d > 25) janks++;
    while (frames.length && t - frames[0][0] > 2000) frames.shift();
    if (frames.length % 10 === 0) box.textContent = `${Math.round(frames.length / 2)} fps\nmax ${Math.round(Math.max(...frames.map((f) => f[1])))} ms\nRuckler ${janks}`;
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}
