// v-knight: Plakat im Stil "Knight mit Blumen" – Pergament, große Antiqua-Versalien voller Blumen,
// gerahmtes Bild mit Felix in einer dunklen Blumenwiese, Ornamente, die sich beim Scrollen zeichnen,
// Wachssiegel auf den Zertifikaten.
import { DATA, STR, LANGS, initialLang, saveLang } from './i18n.js';
import { paintMeadow, bloomAt } from './meadow.js';
import { chain, rowOrnament, tile, seal, sparkle } from './ornaments.js';

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = matchMedia('(pointer: fine)').matches;
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = (s = '') => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

let lang = initialLang();

// ---------- Ornamente in die festen SVGs ----------
$$('svg.chain').forEach((s) => (s.innerHTML = chain()));
$$('svg.row-orn').forEach((s) => (s.innerHTML = rowOrnament()));

// ---------- Hilfen für die Inhalte ----------
const ext = (href, text, cls = 'link') =>
  `<a class="${cls}" href="${esc(href)}" target="_blank" rel="noopener">${esc(text)}<span class="sr-only"> ${esc(STR[lang].newTab)}</span></a>`;
const levelOf = { Grundlagen: 1, gut: 2, fortgeschritten: 3 };
function dots(level) {
  const n = levelOf[level];
  if (!n) return `<span class="lvl lvl--daily" aria-hidden="true"><svg viewBox="0 0 20 20">${sparkle(10, 10, 8, 0, 'x')}</svg></span>`;
  return `<span class="lvl" aria-hidden="true">${[1, 2, 3].map((i) => `<i class="${i <= n ? 'on' : ''}"></i>`).join('')}</span>`;
}
const frameLine = '<svg class="drawframe" data-draw aria-hidden="true"><rect class="o-l" pathLength="1" x="0" y="0" width="100%" height="100%" rx="22"/></svg>';
const secHead = (id, title) => `
  <header class="sec__head">
    <svg class="chain" data-draw viewBox="0 0 300 24" aria-hidden="true">${chain()}</svg>
    <h2 class="display" id="h-${id}">${esc(title)}</h2>
  </header>`;

// ---------- Seiteninhalt (wird bei Sprachwechsel neu aufgebaut) ----------
function buildMain() {
  const t = STR[lang];
  const d = DATA[lang];
  const [bun, web, mc] = d.projects;
  const facts = d.facts.filter((_, i) => i !== 0 && i !== 2); // 0 und 2 stehen schon im Bild oben

  const about = `
  <section class="about" id="about" aria-labelledby="h-about">
    <div class="strip">
      ${tile()}
      <div class="strip__text">
        <h2 class="label label--center" id="h-about">${esc(t.about)}</h2>
        ${d.about.map((p) => `<p>${esc(p)}</p>`).join('')}
      </div>
      ${tile()}
    </div>
    <svg class="row-orn" data-draw viewBox="0 0 360 30" aria-hidden="true">${rowOrnament()}</svg>
    <div class="about__grid">
      <figure class="frame frame--about">
        <div class="frame__clip"><img src="/img/sony-dsc02437-photo.jpg" width="1800" height="1200" loading="lazy" alt="${esc(t.aboutAlt)}"></div>
        ${frameLine}
      </figure>
      <ul class="facts" role="list">
        ${facts.map((f) => `<li class="fact"><h3 class="fact__t">${esc(f.title)}</h3><p>${esc(f.text)}</p></li>`).join('')}
      </ul>
    </div>
  </section>`;

  const projects = `
  <section class="sec" id="projects" aria-labelledby="h-projects">
    ${secHead('projects', t.projects)}
    <article class="proj proj--main">
      <figure class="frame frame--bun">
        <div class="frame__clip"><img src="${esc(bun.img)}" width="1200" height="630" loading="lazy" alt="${esc(t.bunAlt)}"></div>
        ${frameLine}
      </figure>
      <div class="proj__text">
        <p class="label">${esc(bun.when)}</p>
        <h3 class="display-sm">${esc(bun.title)}</h3>
        <p>${esc(bun.text)}</p>
        ${ext(bun.url, t.openSite, 'btn')}
      </div>
    </article>
    <article class="proj proj--web">
      <div class="proj__text">
        <p class="label">${esc(web.when)}</p>
        <h3 class="display-sm">${esc(web.title)}</h3>
        <p>${esc(web.text)}</p>
      </div>
      <div class="pair">
        <figure class="frame frame--pair">
          <div class="frame__clip frame__clip--dark"><img src="/img/person.webp" width="1214" height="1800" loading="lazy" alt="BiRefNet"></div>
          <figcaption class="label">BiRefNet</figcaption>
        </figure>
        <figure class="frame frame--pair">
          <div class="frame__clip"><img src="${esc(web.img)}" width="1214" height="1800" loading="lazy" alt="${esc(t.webAlt)}"></div>
          <figcaption class="label">Depth Anything V2</figcaption>
        </figure>
      </div>
    </article>
    <article class="proj proj--small">
      <figure class="frame frame--mc"><div class="frame__clip"><img src="${esc(mc.img)}" width="1600" height="1200" loading="lazy" alt="${esc(t.mcAlt)}"></div></figure>
      <div class="proj__text">
        <p class="label">${esc(mc.when)}</p>
        <h3 class="fact__t">${esc(mc.title)}</h3>
        <p>${esc(mc.text)}</p>
      </div>
    </article>
  </section>`;

  const earned = d.certificates.filter((c) => c.status === 'erhalten');
  const wip = d.certificates.filter((c) => c.status !== 'erhalten');
  const certs = `
  <section class="sec" id="certs" aria-labelledby="h-certs">
    ${secHead('certs', t.certs)}
    <div class="certs">
      ${earned.map((c, i) => `
      <article class="cert">
        <figure class="frame frame--cert">
          <div class="frame__clip frame__clip--paper"><img src="${esc(c.img)}" width="1584" height="1091" loading="lazy" alt="${esc(t.certAlt)}: ${esc(c.title)}"></div>
          ${frameLine}
          <button class="seal" type="button" aria-label="${esc(t.seal)}">${seal(i + 3)}</button>
        </figure>
        <h3 class="fact__t">${esc(c.title)}</h3>
        <p class="cert__meta">${esc(c.issuer)}<br>${esc(t.earned)} ${esc(c.date)}</p>
        <p class="cert__links">${ext(c.url, t.verify)} ${ext(c.pdf, t.pdf)}</p>
      </article>`).join('')}
    </div>
    <div class="certs certs--wip">
      ${wip.map((c) => `
      <article class="cert cert--wip">
        <span class="seal-empty" aria-hidden="true"><svg viewBox="0 0 120 120"><circle cx="60" cy="60" r="50"/>${sparkle(60, 60, 14, 0, 'x')}</svg></span>
        <div>
          <p class="label">${esc(c.label || t.wip)}</p>
          <h3 class="fact__t">${esc(c.title)}</h3>
          <p class="cert__meta">${esc(c.issuer)}</p>
          <p class="cert__links">${ext(c.url, t.course)}</p>
        </div>
      </article>`).join('')}
    </div>
  </section>`;

  const timeline = (items) => `<ol class="tl" role="list">${items.map((x) => `
      <li><p class="tl__when">${esc(x.when)}</p><p class="tl__what">${esc(x.what)}</p><p class="tl__detail">${esc(x.detail)}</p></li>`).join('')}</ol>`;
  const sub = (title) => `<h3 class="sub"><svg viewBox="0 0 20 20" aria-hidden="true">${sparkle(10, 10, 7, 0, 'x')}</svg>${esc(title)}</h3>`;

  const cv = `
  <section class="sec" id="cv" aria-labelledby="h-cv">
    ${secHead('cv', t.cv)}
    <div class="cv">
      <div class="cv__col">${sub(t.school)}${timeline(d.school)}</div>
      <div class="cv__col">${sub(t.practice)}${timeline(d.practice)}</div>
    </div>
    <div class="cv cv--three">
      ${d.skills.map((g) => `
      <div class="cv__col">${sub(g.group)}
        <ul class="rows" role="list">${g.items.map((it) => `<li><span>${esc(it.what)}</span><span class="rows__lvl">${dots(it.level)}${esc(it.label || it.level)}</span></li>`).join('')}</ul>
      </div>`).join('')}
    </div>
    <div class="cv cv--three">
      <div class="cv__col">${sub(t.languages)}
        <ul class="rows" role="list">${d.languages.map((l) => `<li><span>${esc(l.lang)}</span><span class="rows__lvl">${esc(l.label || l.level)}</span></li>`).join('')}</ul>
      </div>
      <div class="cv__col">${sub(t.interests)}
        <ul class="rows rows--stack" role="list">${d.interests.map((x) => `<li><span>${esc(x.what)}</span><span class="rows__detail">${esc(x.detail)}</span></li>`).join('')}</ul>
      </div>
      <div class="cv__col">${sub(t.documents)}
        <ul class="rows rows--stack" role="list">${d.documents.map((x) => `<li><span>${esc(x.title)}</span><span class="rows__detail">${esc(x.when)} · <em class="due">${esc(x.label || x.status)}</em></span></li>`).join('')}</ul>
      </div>
    </div>
  </section>`;

  const c = d.contact;
  const contact = `
  <section class="sec contact" id="contact" aria-labelledby="h-contact">
    <header class="sec__head">
      <svg class="chain" data-draw viewBox="0 0 300 24" aria-hidden="true">${chain()}</svg>
      <h2 class="display display--flowers" id="h-contact">${esc(t.contact)}</h2>
    </header>
    <div class="strip strip--contact">
      ${tile()}
      <div class="strip__text">
        <p class="label label--center">E-Mail</p>
        <p class="mail"><a href="mailto:${esc(c.email)}">${esc(c.email)}</a></p>
        <p><button class="btn btn--ghost" type="button" data-copy="${esc(c.email)}">${esc(t.copy)}</button></p>
        <p class="copy-status" role="status" aria-live="polite"></p>
        <p class="label label--center label--gap">Instagram</p>
        <p class="insta">${ext('https://www.instagram.com/' + c.instagram + '/', '@' + c.instagram)}</p>
      </div>
      ${tile()}
    </div>
  </section>`;

  $('#main').innerHTML = about + projects + certs + cv + contact;
}

// ---------- Sprache anwenden ----------
function applyLang(l, save = false) {
  lang = l;
  const t = STR[l];
  document.documentElement.lang = l;
  document.title = t.title;
  $('meta[name="description"]').setAttribute('content', t.desc);
  $$('[data-t]').forEach((el) => (el.textContent = t[el.dataset.t]));
  $$('[data-alt]').forEach((el) => (el.alt = t[el.dataset.alt]));
  // Notizen im Bild: Fun Fact 0 (Spitzname) und 2 (Sprachen)
  $$('[data-note]').forEach((el) => {
    const f = DATA[l].facts[+el.dataset.note];
    el.innerHTML = `<p class="note__t">${esc(f.title)}</p><p>${esc(f.text)}</p>`;
  });
  $$('[data-langs]').forEach((g) => {
    g.setAttribute('aria-label', t.langGroup);
    g.innerHTML = LANGS.map((x) => `<button type="button" lang="${x}" aria-pressed="${x === l}" data-lang="${x}">${x.toUpperCase()}</button>`).join('<span aria-hidden="true">✦</span>');
  });
  buildMain();
  wireMain();
  if (save) {
    saveLang(l);
    const u = new URL(location.href);
    if (u.searchParams.has('lang')) { u.searchParams.set('lang', l); history.replaceState(null, '', u); }
  }
  setMeadowVars();
  updateDraw();
}

document.addEventListener('click', (e) => {
  const b = e.target.closest('[data-lang]');
  if (b && b.dataset.lang !== lang) {
    const group = b.closest('[data-langs]');
    const idx = $$('[data-langs]').indexOf(group);
    applyLang(b.dataset.lang, true);
    $$('[data-langs]')[idx]?.querySelector(`[data-lang="${b.dataset.lang}"]`)?.focus();
  }
});

// ---------- Wachssiegel + Kopieren ----------
const press = (s) => { s.classList.remove('is-pressed'); void s.offsetWidth; s.classList.add('is-pressed'); };
function checkSeals() { // ein Siegel drückt sich auf, sobald es ganz im Bild ist
  for (const s of $$('.seal:not(.is-pressed)')) if (s.getBoundingClientRect().bottom < innerHeight * 0.92) press(s);
}
function wireMain() {
  $$('.seal').forEach((s) => {
    if (reduce) s.classList.add('is-pressed', 'no-anim');
    s.addEventListener('click', () => press(s));
  });
  checkSeals();
  $$('[data-copy]').forEach((b) => b.addEventListener('click', async () => {
    const status = $('.copy-status');
    try {
      await navigator.clipboard.writeText(b.dataset.copy);
      b.textContent = STR[lang].copied;
      status.textContent = STR[lang].copied + ': ' + b.dataset.copy;
      setTimeout(() => { b.textContent = STR[lang].copy; }, 2200);
    } catch {
      status.textContent = STR[lang].copyFail;
      const r = document.createRange(); r.selectNodeContents($('.mail a')); getSelection().removeAllRanges(); getSelection().addRange(r);
    }
  }));
}

// ---------- Blumenwiese: Bild-Rahmen + Füllung der großen Buchstaben ----------
const panel = $('[data-panel]');
const bg = $('.panel__bg'), fg = $('.panel__fg');
const blooms = []; // vom Besucher gepflanzte Blumen (relative Koordinaten)
let meadowURL = '';
let lastSize = '';

function paintPanel() {
  const dpr = Math.min(devicePixelRatio || 1, 2);
  const w = bg.clientWidth, h = bg.clientHeight;
  if (!w || !h) return;
  const key = `${Math.round(w / 40)}x${Math.round(h / 40)}`;
  if (key === lastSize) return;
  lastSize = key;
  const s = dpr * Math.min(1.35, Math.max(0.7, h / 680));
  for (const c of [bg, fg]) { c.width = Math.round(w * dpr); c.height = Math.round(h * dpr); }
  paintMeadow(bg, { seed: 11, mode: 'full', scale: s, flowers: 0.3 });
  paintMeadow(fg, { seed: 29, mode: 'front', scale: s * 1.1, flowers: 0.75 });
  const ctx = fg.getContext('2d');
  for (const b of blooms) bloomAt(ctx, b.x * fg.width, b.y * fg.height, b.r * s, b.kind, 1, b.seed);
}

function paintLetters() {
  const c = document.createElement('canvas');
  c.width = 1500; c.height = 520;
  paintMeadow(c, { seed: 5, mode: 'full', scale: 1.5, flowers: 0.6 });
  return new Promise((res) => c.toBlob((b) => { meadowURL = URL.createObjectURL(b); res(); }, 'image/jpeg', 0.88));
}
function setMeadowVars() {
  if (!meadowURL) return;
  $$('.name, .display--flowers').forEach((el) => el.style.setProperty('--meadow', `url(${meadowURL})`));
  document.documentElement.classList.add('has-meadow');
}

// Klick in die Wiese: an der Stelle blüht eine Blume auf
panel.addEventListener('click', (e) => {
  if (e.target.closest('.note')) return;
  const rect = fg.getBoundingClientRect();
  const b = { x: (e.clientX - rect.left) / rect.width, y: (e.clientY - rect.top) / rect.height, r: 16 + Math.random() * 12, kind: Math.random() < 0.6 ? 0 : 1, seed: (Math.random() * 1e9) | 0 };
  if (blooms.length > 40) blooms.shift();
  blooms.push(b);
  const ctx = fg.getContext('2d');
  const dpr = fg.width / rect.width;
  const s = dpr * Math.min(1.35, Math.max(0.7, rect.height / 680));
  if (reduce) { bloomAt(ctx, b.x * fg.width, b.y * fg.height, b.r * s, b.kind, 1, b.seed); return; }
  // Aufblühen: auf eine Kopie des Zustands vorher immer neu zeichnen
  const before = ctx.getImageData(0, 0, fg.width, fg.height);
  const t0 = performance.now();
  const step = (now) => {
    const p = Math.min(1, (now - t0) / 650);
    ctx.putImageData(before, 0, 0);
    bloomAt(ctx, b.x * fg.width, b.y * fg.height, b.r * s, b.kind, p, b.seed);
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
});

// ---------- FELIX → FELIKS (is-x = „FELIX“) ----------
const swap = $('.swap');
let isX = false, nameTouched = false;
function measureSwap() {
  swap.style.setProperty('--wks', ($('.L--k').offsetWidth + $('.L--s').offsetWidth) + 'px');
  swap.style.setProperty('--wx', $('.L--x').offsetWidth + 'px');
}
function setX(on) { isX = on; swap.classList.toggle('is-x', on); swap.parentElement.classList.toggle('is-x', on); }
$('.name').addEventListener('click', () => { nameTouched = true; setX(!isX); });

// ---------- Ornamente zeichnen sich beim Scrollen ----------
let t0 = performance.now();
function updateDraw() {
  const vh = innerHeight;
  const tp = reduce ? 1 : Math.min(1, (performance.now() - t0) / 1400);
  const atEnd = scrollY + vh >= document.documentElement.scrollHeight - 8; // ganz unten: alles fertig zeichnen
  for (const el of $$('[data-draw]')) {
    const top = el.getBoundingClientRect().top;
    let p = reduce ? 1 : Math.max(0, Math.min(1, (vh * 0.98 - top) / (vh * 0.45)));
    if (atEnd && top < vh) p = 1;
    if (top < vh) p = Math.min(p, tp); // was schon beim Laden sichtbar ist, zeichnet sich beim Start
    el.style.setProperty('--p', p.toFixed(3));
  }
}
let ticking = false;
addEventListener('scroll', () => {
  if (ticking) return; ticking = true;
  requestAnimationFrame(() => { ticking = false; updateDraw(); parallax(); checkSeals(); });
}, { passive: true });
(function intro() { updateDraw(); if (performance.now() - t0 < 1500) requestAnimationFrame(intro); })();

// ---------- leichte Tiefe: Maus bewegt Wiese, Felix und Vorderblumen unterschiedlich ----------
let mx = 0, my = 0;
function parallax() {
  if (reduce) return;
  const sy = Math.min(scrollY, innerHeight);
  panel.style.setProperty('--mx', mx.toFixed(3));
  panel.style.setProperty('--my', my.toFixed(3));
  panel.style.setProperty('--sy', (sy / innerHeight).toFixed(3));
  $('.name').style.setProperty('--mx', mx.toFixed(3));
}
if (finePointer && !reduce) {
  $('.hero').addEventListener('pointermove', (e) => {
    mx = (e.clientX / innerWidth) * 2 - 1; my = (e.clientY / innerHeight) * 2 - 1;
    requestAnimationFrame(parallax);
  });
}

// ---------- Start ----------
applyLang(lang);
const resize = () => { paintPanel(); measureSwap(); updateDraw(); };
let rt;
addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(resize, 180); });
// Name: startet als FELIX (so sagen viele), dann wird daraus die richtige Schreibweise FELIKS.
// Ohne Bewegung (reduced) steht gleich FELIKS da. Klick auf den Namen schaltet weiter hin und her.
measureSwap();                             // erst mit Ersatzschrift messen (sonst klafft eine Lücke hinter dem X)
if (!reduce) setX(true);                   // gleicher Zustand wie .felix-first → kein Übergang beim Start
document.documentElement.classList.remove('felix-first');
document.fonts.ready.then(() => {
  measureSwap();
  if (!reduce) setTimeout(() => { if (!nameTouched) setX(false); }, 1900);
});
requestAnimationFrame(() => { paintPanel(); paintLetters().then(setMeadowVars); });

if (import.meta.env.DEV) { const { addSwitch } = await import('/shared/switch.js'); addSwitch('v-knight'); }
