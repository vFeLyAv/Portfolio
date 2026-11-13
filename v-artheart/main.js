// v-artheart: eine Museums-Salonwand. Jeder Goldrahmen hält eine Arbeit von Felix.
// Spotlight folgt dem Cursor, Klick auf einen Rahmen = näher herantreten (Zoom + großes Etikett).
import { DATA, LANGS, UI, pickLang, saveLang } from './i18n.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;

let lang = pickLang();
const d = () => DATA[lang];
const u = () => UI[lang];
const lvl = (x) => x.label ?? x.level;

/* ------------------------------------------------------------ Exponate */

// Alle Bilder an der Wand. open = was beim Herantreten als großes Etikett erscheint.
function works() {
  const D = d(), U = u();
  const [bun, site, mc] = D.projects;
  const [c1, c2] = D.certificates;
  return {
    suit: { img: '/img/sony-dsc02437-photo.jpg', ratio: '3 / 4', pos: '70% 40%', open: 'about', title: U.works.suit, meta: U.photo },
    night: { img: '/img/sony-dsc06015-photo.jpg', ratio: '1256 / 1800', pos: '50% 50%', open: 'about', title: U.works.night, meta: U.works.nightMeta },
    balloons: { img: '/img/balloons-edit.jpg', ratio: '3 / 4', pos: '50% 48%', open: 'about', title: U.works.balloons, meta: U.photo },
    market: { img: '/img/sony-dsc01805-photo.jpg', ratio: '3 / 2', pos: '50% 40%', open: 'about', title: U.works.market, meta: U.photo },
    bunprise: { img: bun.img, ratio: '40 / 21', pos: '50% 50%', open: 'project:0', title: bun.title, meta: `${bun.when}, ${U.mat.bunprise}` },
    depth: { img: site.img, ratio: '3 / 4', pos: '50% 40%', open: 'project:1', title: site.title, meta: `${site.when}, ${U.mat.site}` },
    render: { img: mc.img, ratio: '4 / 3', pos: '50% 50%', open: 'project:2', title: mc.title, meta: `${mc.when}, ${U.mat.mc}` },
    cert1: { img: c1.img, ratio: '1584 / 1091', pos: '50% 50%', open: 'certs', title: c1.title, meta: `${c1.issuer}, ${c1.date}`, liner: true },
    cert2: { img: c2.img, ratio: '1584 / 1091', pos: '50% 50%', open: 'certs', title: c2.title, meta: `${c2.issuer}, ${c2.date}`, liner: true },
  };
}

function exhibit(id, w, { cls = '', label = true, lazy = true } = {}) {
  const U = u();
  return `
    <div class="exhibit ex-${id} ${cls}" style="--ratio:${w.ratio}">
      <button class="frame${w.liner ? ' frame-liner' : ''}" type="button" data-open="${w.open}"
        aria-label="${esc(`${w.title}, ${w.meta}. ${U.open}`)}">
        <span class="art"><img src="${esc(w.img)}" alt="" ${lazy ? 'loading="lazy"' : ''} decoding="async" style="object-position:${w.pos}"></span>
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
  <li class="fact" style="--r:${[-1.4, 0.9, -0.5, 1.2, -1, 0.6, -0.7][i % 7]}deg">
    <h4>${esc(f.title)}</h4><p>${esc(f.text)}</p>
  </li>`).join('')}</ul>`;

function projectCard(p, i, { heading = 'h3', id = '' } = {}) {
  const U = u();
  const mat = [U.mat.bunprise, U.mat.site, U.mat.mc][i];
  const H = heading;
  return `
    <${H} ${id ? `id="${id}"` : ''} class="card-title">${p.icon ? `<img class="card-icon" src="${esc(p.icon)}" alt="" width="44" height="44">` : ''}${esc(p.title)}</${H}>
    <p class="card-meta">${esc(p.when)}, ${esc(mat)}</p>
    <p>${esc(p.text)}</p>
    ${p.url ? `<p class="actions"><a class="btn" href="${esc(p.url)}" target="_blank" rel="noopener">${esc(U.visit)}</a></p>` : ''}`;
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
        <a class="btn" href="${esc(c.url)}" target="_blank" rel="noopener">${esc(U.verify)}</a>
        <a class="btn btn-ghost" href="${esc(c.pdf)}" target="_blank" rel="noopener">${esc(U.pdf)}</a>
      </p>`;
  }
  return `
    <${H} class="card-title">${esc(c.title)}</${H}>
    <p class="card-meta">${esc(c.issuer)}</p>
    <p class="card-status is-wip">${esc(c.label ?? U.inProgress)}</p>
    <p class="actions"><a class="btn btn-ghost" href="${esc(c.url)}" target="_blank" rel="noopener">${esc(U.course)}</a></p>`;
}

function renderSalon() {
  const W = works();
  // Reihenfolge = Tab-Reihenfolge: erst das große Bild in der Mitte, dann im Uhrzeigersinn
  const order = ['suit', 'bunprise', 'depth', 'render', 'cert2', 'market', 'cert1', 'balloons'];
  $('[data-slot="salon"]').innerHTML = order.map((id) => exhibit(id, W[id], { lazy: false })).join('');
}

function renderAbout() {
  const W = works();
  $('[data-slot="about"]').innerHTML = `
    <div class="about-grid">
      ${exhibit('night', W.night, { cls: 'inline' })}
      <div class="panel about-text">${aboutText()}</div>
    </div>
    <h3 class="sub">${esc(u().facts)}</h3>
    ${factList()}`;
}

function renderProjects() {
  const W = works();
  const ids = ['bunprise', 'depth', 'render'];
  $('[data-slot="projects"]').innerHTML = d().projects.map((p, i) => `
    <article class="work work-${i}">
      ${exhibit(ids[i], W[ids[i]], { cls: 'inline', label: false })}
      <div class="card">${projectCard(p, i)}</div>
    </article>`).join('');
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
        <p class="gb-big"><a href="mailto:${esc(C.email)}">${esc(C.email)}</a></p>
        <p class="actions"><button class="btn copy" type="button">${esc(U.copy)}</button> <span class="copy-status" role="status"></span></p>
        <p class="gb-label">${esc(U.instagram)}</p>
        <p class="gb-big"><a href="https://www.instagram.com/${esc(C.instagram)}/" target="_blank" rel="noopener">@${esc(C.instagram)}</a></p>
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
        <span class="t-code">FK 26 ${String(i + 1).padStart(2, '0')}</span>
        <span class="t-big">${l.toUpperCase()}</span>
        <span class="t-name">${esc(U.langName[l])}</span>
      </button>`).join('');
  });
}

function renderStatic() {
  const U = u();
  $$('[data-i18n]').forEach((el) => {
    const v = el.dataset.i18n.split('.').reduce((o, k) => o?.[k], U);
    if (typeof v === 'string') el.textContent = v;
  });
  document.title = U.docTitle;
  document.documentElement.lang = lang;
}

function render() {
  renderStatic();
  renderSalon();
  renderAbout();
  renderProjects();
  renderCerts();
  renderCV();
  renderContact();
  renderTickets();
}

/* ------------------------------------------------------------ Sprache */

document.addEventListener('click', (e) => {
  const t = e.target.closest('.ticket');
  if (!t || t.dataset.lang === lang) return;
  const wasExit = !!t.closest('.tickets-exit');
  lang = t.dataset.lang;
  saveLang(lang);
  const url = new URL(location.href);
  if (url.searchParams.has('lang')) { url.searchParams.set('lang', lang); history.replaceState(null, '', url); }
  render();
  fitHeadline();
  // Fokus auf dem gleichen Ticket halten
  $(`${wasExit ? '.tickets-exit ' : '.admission '}.ticket[data-lang="${lang}"]`)?.focus();
});

/* ------------------------------------------------------------ Kontakt */

async function copyMail() {
  const U = u();
  const status = $('.copy-status');
  try {
    await navigator.clipboard.writeText(d().contact.email);
    status.textContent = U.copied;
  } catch {
    status.textContent = U.copyFail;
  }
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

// FELIX -> FELIKS: Start auf FELIX (Klasse hl-felix aus dem <head>). Das X verschwimmt wie ein Echo,
// K und S treten aus der Unschärfe. Ohne JS und bei reduzierter Bewegung steht sofort FELIKS.
function feliksEcho() {
  const ks = $('.hl-ks'), x = $('.hl-x');
  const showFinal = () => {
    root.classList.remove('hl-felix');
    ks.getAnimations().forEach((an) => an.cancel());
    x.getAnimations().forEach((an) => an.cancel());
  };
  if (reduced || !root.classList.contains('hl-felix')) { showFinal(); return; }
  // Breiten messen: X im Felix-Zustand, KS im Endzustand
  const wX = x.getBoundingClientRect().width;
  root.classList.remove('hl-felix');
  const wKs = ks.getBoundingClientRect().width;
  const opts = { duration: 1500, easing: 'cubic-bezier(.6,.05,.25,1)', fill: 'both', delay: 1800 };
  x.animate([
    { width: `${wX}px`, opacity: 1, filter: 'blur(0px)' },
    { width: '0px', opacity: 0, filter: 'blur(16px)' },
  ], opts);
  const a = ks.animate([
    { width: '0px', opacity: 0, filter: 'blur(14px)' },
    { width: `${wKs}px`, opacity: 1, filter: 'blur(0px)' },
  ], { ...opts, delay: 1950 });
  // danach die Animationen lösen: CSS zeigt FELIKS, Größenänderungen bleiben sauber
  a.finished.then(showFinal).catch(() => {});
}

/* ------------------------------------------------------------ Licht */

const root = document.documentElement;
let mx = innerWidth * 0.5, my = innerHeight * 0.36, tx = mx, ty = my, lightRaf = 0;
function setLight(x, y) { root.style.setProperty('--mx', `${x.toFixed(1)}px`); root.style.setProperty('--my', `${y.toFixed(1)}px`); }
function lightLoop() {
  mx += (tx - mx) * 0.14; my += (ty - my) * 0.14;
  setLight(mx, my);
  lightRaf = Math.abs(tx - mx) + Math.abs(ty - my) > 0.5 ? requestAnimationFrame(lightLoop) : 0;
}
function aimLight(x, y) {
  tx = x; ty = y;
  if (reduced) { mx = x; my = y; setLight(x, y); return; }
  if (!lightRaf) lightRaf = requestAnimationFrame(lightLoop);
}
setLight(mx, my);
if (finePointer) {
  addEventListener('pointermove', (e) => { if (!root.classList.contains('is-zoomed')) aimLight(e.clientX, e.clientY); }, { passive: true });
}

/* ------------------------------------------------------------ Gehen (Scroll) */

const foyer = $('.foyer');
let walkRaf = 0;
function walk() {
  walkRaf = 0;
  const y = Math.min(scrollY, innerHeight * 1.2);
  foyer.style.setProperty('--walk', (y / innerHeight).toFixed(4));
}
if (!reduced) addEventListener('scroll', () => { if (!walkRaf) walkRaf = requestAnimationFrame(walk); }, { passive: true });

/* ------------------------------------------------------------ Herantreten */

const viewer = $('.viewer');
let active = null; // { btn, room }

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
  // certs
  return `<p class="v-kicker">${esc(U.room)} III</p><h2 id="viewer-title">${esc(U.rooms.certs)}</h2>
    <div class="v-certs">${D.certificates.map((c) => `<div class="v-cert">${certCard(c, { heading: 'h3' })}</div>`).join('')}</div>`;
}

// Seite darf beim Herantreten nicht scrollen; Scrollbar-Breite ausgleichen, damit nichts springt
function lockScroll() {
  const sbw = innerWidth - root.clientWidth;
  root.style.paddingRight = sbw ? `${sbw}px` : '';
  root.classList.add('is-zoomed');
}
function unlockScroll() {
  root.classList.remove('is-zoomed');
  root.style.paddingRight = '';
}

function openViewer(btn) {
  const room = btn.closest('.room');
  $('[data-slot="viewer"]').innerHTML = viewerContent(btn.dataset.open);
  active = { btn, room };
  const show = () => {
    if (!viewer.open) viewer.showModal();
    viewer.scrollTop = 0;
    $('.viewer-panel').scrollTop = 0;
  };
  lockScroll();
  if (reduced) { show(); return; }

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
  aimLight(t.x, t.y);
  btn.classList.add('is-near');
  setTimeout(show, 720);
}

function closeViewer() {
  if (!active) return;
  const { btn, room } = active;
  active = null;
  btn.classList.remove('is-near');
  room.style.transform = '';
  const done = () => {
    room.classList.remove('zooming');
    room.style.transformOrigin = '';
    unlockScroll();
  };
  if (reduced) done(); else setTimeout(done, 800);
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
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
Promise.race([document.fonts.ready, wait(2500)]).then(() => { root.dataset.ready = '1'; fitHeadline(); feliksEcho(); });
document.fonts.addEventListener?.('loadingdone', () => fitHeadline());
addEventListener('resize', () => { fitHeadline(); });

if (import.meta.env.DEV) { const { addSwitch } = await import('/shared/switch.js'); addSwitch('v-artheart'); }
