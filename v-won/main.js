// v-won: Mode-Magazin-Collage. Buchstaben-Stapel FELIKS -> FELIX über dem Foto.
import { DATA, LANGS, UI, pickLang, saveLang, t } from './i18n.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

let lang = pickLang();

/* ---------------------------------------------------------------- Inhalte */

const LEVEL = { Grundlagen: 1, gut: 2, fortgeschritten: 3, 'im Alltag': 3 };
const heartSvg = '<svg viewBox="0 0 40 36" aria-hidden="true"><path d="M20 33 C4 22 1 14 3 8 C5 2 13 0 20 8 C27 0 35 2 37 8 C39 14 36 22 20 33Z"/></svg>';
const hearts = (lvl) => {
  const n = LEVEL[lvl] ?? 0;
  if (!n) return '';
  return `<span class="hearts" aria-hidden="true">${[1, 2, 3].map((i) => `<i class="${i <= n ? 'on' : ''}">${heartSvg}</i>`).join('')}</span>`;
};

function render() {
  const d = DATA[lang];
  const u = UI[lang];
  const slot = (name) => $(`[data-slot="${name}"]`);

  slot('about').innerHTML = d.about.map((p) => `<p>${esc(p)}</p>`).join('');

  slot('facts').innerHTML = d.facts.map((f, i) => `
    <li class="fact" style="--r:${[-1.2, 0.8, -0.4, 1.1, -0.9, 0.5, -0.6][i % 7]}deg">
      <h4>${esc(f.title)}</h4>
      <p>${esc(f.text)}</p>
    </li>`).join('');

  const [bun, site, mc] = d.projects;
  slot('projects').innerHTML = `
    <article class="proj proj-feature">
      <a class="frame proj-img" href="${esc(bun.url)}" target="_blank" rel="noopener" tabindex="-1" aria-hidden="true">
        <img src="${esc(bun.img)}" alt="" loading="lazy">
      </a>
      <div class="proj-body">
        <p class="year">${esc(bun.when)}</p>
        <h3 class="proj-title"><img class="proj-icon" src="${esc(bun.icon)}" alt="" width="56" height="56">${esc(bun.title)}</h3>
        <p>${esc(bun.text)}</p>
        <p><a class="pill pill-solid" href="${esc(bun.url)}" target="_blank" rel="noopener">${esc(u.visit)}</a></p>
      </div>
    </article>
    <article class="proj proj-feature proj-alt">
      <figure class="frame proj-img diptych"><img src="/img/sony-dsc06015-photo.jpg" alt="" loading="lazy"><img src="${esc(site.img)}" alt="" loading="lazy"></figure>
      <div class="proj-body">
        <p class="year">${esc(site.when)}</p>
        <h3 class="proj-title">${esc(site.title)}</h3>
        <p>${esc(site.text)}</p>
      </div>
    </article>
    <article class="proj proj-small">
      <figure class="frame proj-img"><img src="${esc(mc.img)}" alt="" loading="lazy"></figure>
      <div class="proj-body">
        <p class="year">${esc(mc.when)}</p>
        <h3 class="proj-title">${esc(mc.title)}</h3>
        <p>${esc(mc.text)}</p>
      </div>
    </article>`;

  const earned = d.certificates.filter((c) => c.status === 'erhalten');
  const planned = d.certificates.filter((c) => c.status !== 'erhalten');
  slot('certsEarned').innerHTML = earned.map((c, i) => `
    <article class="cert" style="--r:${i % 2 ? 1.4 : -1.6}deg">
      <a class="frame cert-img" href="${esc(c.pdf)}" target="_blank" rel="noopener" tabindex="-1" aria-hidden="true">
        <img src="${esc(c.img)}" alt="" loading="lazy">
      </a>
      <div class="cert-body">
        <p class="status status-done">${esc(c.label ?? c.status)}</p>
        <h3>${esc(c.title)}</h3>
        <p class="issuer">${esc(c.issuer)}</p>
        <p class="date">${esc(u.issued)} ${esc(c.date)}</p>
        <p class="actions">
          <a class="pill pill-solid" href="${esc(c.url)}" target="_blank" rel="noopener">${esc(u.verify)}</a>
          <a class="pill" href="${esc(c.pdf)}" target="_blank" rel="noopener">${esc(u.pdf)}</a>
        </p>
      </div>
    </article>`).join('');
  slot('certsPlanned').innerHTML = planned.map((c) => `
    <li class="planned">
      <div>
        <h4>${esc(c.title)}</h4>
        <p class="issuer">${esc(c.issuer)}</p>
      </div>
      <p class="status">${esc(c.label ?? c.status)}</p>
      <a class="pill" href="${esc(c.url)}" target="_blank" rel="noopener">${esc(u.course)}</a>
    </li>`).join('');

  const tl = (rows) => rows.map((r) => `
    <li><span class="when">${esc(r.when)}</span><span class="what">${esc(r.what)}</span><span class="detail">${esc(r.detail)}</span></li>`).join('');
  slot('school').innerHTML = tl(d.school);
  slot('practice').innerHTML = tl(d.practice);

  slot('skills').innerHTML = d.skills.map((g) => `
    <div class="skill-group">
      <h4>${esc(g.group)}</h4>
      <ul>${g.items.map((it) => `<li><span class="skill-name">${esc(it.what)}</span>${hearts(it.level)}<span class="lvl">${esc(it.label ?? it.level)}</span></li>`).join('')}</ul>
    </div>`).join('');
  slot('languages').innerHTML = d.languages.map((l) => `<li><span>${esc(l.lang)}</span><span class="lvl">${esc(l.label ?? l.level)}</span></li>`).join('');
  slot('documents').innerHTML = d.documents.map((x) => `<li><span class="doc-title">${esc(x.title)}</span><span class="when">${esc(x.when)}</span><span class="status">${esc(x.label ?? x.status)}</span></li>`).join('');

  const mail = slot('mail');
  mail.href = `mailto:${d.contact.email}`;
  mail.textContent = d.contact.email;
  const insta = slot('insta');
  insta.href = `https://www.instagram.com/${d.contact.instagram}/`;
  insta.textContent = `@${d.contact.instagram}`;
}

function applyStatic() {
  document.documentElement.lang = lang;
  $$('[data-i18n]').forEach((el) => { el.textContent = t(lang, el.dataset.i18n); });
  $$('[data-i18n-alt]').forEach((el) => { el.alt = t(lang, el.dataset.i18nAlt); });
  $$('[data-i18n-aria]').forEach((el) => el.setAttribute('aria-label', t(lang, el.dataset.i18nAria)));
  $$('.lang button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lang === lang)));
  $('.copied').textContent = '';
}

function setLang(l) {
  if (!LANGS.includes(l)) return;
  lang = l;
  saveLang(l);
  applyStatic();
  render();
  requestAnimationFrame(layout); // Breiten der Schrift können sich ändern
}

$$('.lang button').forEach((b) => b.addEventListener('click', () => setLang(b.dataset.lang)));

$('.copy').addEventListener('click', async () => {
  const out = $('.copied');
  const email = DATA[lang].contact.email;
  try {
    await navigator.clipboard.writeText(email);
    out.textContent = t(lang, 'copied');
  } catch {
    const r = document.createRange();
    r.selectNodeContents($('[data-slot="mail"]'));
    const s = getSelection(); s.removeAllRanges(); s.addRange(r);
    out.textContent = t(lang, 'copyFail');
  }
  clearTimeout(out._t);
  out._t = setTimeout(() => { out.textContent = ''; }, 2600);
});

/* ---------------------------------------------------------------- Der Stapel */

const hero = $('.hero');
const stack = $('.stack');

// Ausschnitt des Fotos in jedem Buchstaben (in % der Bildfläche) + Tiefe für Parallaxe
const GLYPHS = {
  F: { bx: 22, by: 48, speed: 0.10, depth: 1.0 },
  E: { bx: 41, by: 70, speed: 0.30, depth: 0.55 },
  L: { bx: 64, by: 44, speed: 0.17, depth: 1.25 },
  I: { bx: 47, by: 30, speed: 0.44, depth: 0.8 },
  K: { bx: 30, by: 80, speed: 0.24, depth: 1.1 },
  S: { bx: 58, by: 66, speed: 0.36, depth: 0.7 },
  X: { bx: 36, by: 62, speed: 0.30, depth: 1.15 },
};
// seitlicher Versatz (in Schriftgrößen) – das Zickzack des Posters
const ZIG6 = { F: -0.2, E: 0.17, L: -0.13, I: 0.24, K: -0.18, S: 0.12 };
const ZIG5 = { F: -0.2, E: 0.17, L: -0.13, I: 0.26, X: -0.06 };

const els = {};
for (const ch of Object.keys(GLYPHS)) {
  const g = document.createElement('span');
  g.className = 'glyph';
  g.dataset.ch = ch;
  g.style.setProperty('--bx', GLYPHS[ch].bx + '%');
  g.style.setProperty('--by', GLYPHS[ch].by + '%');
  g.innerHTML = `<span class="g-par"><span class="g-fold"><span class="g-back">${ch}</span><span class="g-face">${ch}</span></span></span>`;
  stack.append(g);
  els[ch] = g;
}

let felix = reduced; // Endzustand sofort bei reduzierter Bewegung
const surname = $('.surname');
surname.innerHTML = 'KOLOMOIETS'.split('').map((c) => `<span>${c}</span>`).join('');

let H = 0;
function layout() {
  const W = hero.clientWidth;
  H = hero.clientHeight;
  const mobile = W < 760;
  const L = mobile ? Math.min(H * 0.2, W * 0.42) : Math.min(H * 0.275, W * 0.2);
  stack.style.setProperty('--L', L + 'px');
  const order = felix ? ['F', 'E', 'L', 'I', 'X'] : ['F', 'E', 'L', 'I', 'K', 'S'];
  const zig = felix ? ZIG5 : ZIG6;
  const cap = L * 0.708;
  const capTop = L * 0.2075; // Abstand Box-Oberkante -> Versal-Oberkante (Playfair)
  const top0 = H * (mobile ? 0.12 : 0.045);
  const bottom = H * (mobile ? 0.8 : 0.955);
  const step = (bottom - top0 - cap) / (order.length - 1);
  const cx = W * (mobile ? 0.37 : 0.368);
  const pos = {};
  order.forEach((ch, i) => {
    const g = els[ch];
    const w = g.offsetWidth;
    pos[ch] = { x: cx + zig[ch] * L - w / 2, y: top0 + i * step - capTop };
  });
  // K und S bleiben gefaltet an ihrem alten Platz, X wartet auf dem Platz von K
  if (felix) {
    const oldStep = (bottom - top0 - cap) / 5;
    pos.K = { x: cx + ZIG6.K * L - els.K.offsetWidth / 2, y: top0 + 4 * oldStep - capTop };
    pos.S = { x: cx + ZIG6.S * L - els.S.offsetWidth / 2, y: top0 + 5 * oldStep - capTop };
  } else {
    pos.X = { x: cx + ZIG5.X * L - els.X.offsetWidth / 2, y: top0 + 4 * step - capTop };
  }
  for (const ch in pos) {
    els[ch].style.left = pos[ch].x.toFixed(1) + 'px';
    els[ch].style.top = pos[ch].y.toFixed(1) + 'px';
  }
}

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
let busy = false;

async function toFelix() {
  // K und S klappen weg, X gleitet herein, der Stapel rückt zusammen
  els.K.classList.add('folded');
  await wait(140);
  els.S.classList.add('folded');
  await wait(520);
  felix = true;
  stack.classList.add('restack');
  layout();
  await wait(120);
  els.X.classList.remove('out');
  await wait(1100);
  stack.classList.remove('restack');
}

async function toFeliks() {
  els.X.classList.add('out');
  await wait(380);
  felix = false;
  stack.classList.add('restack');
  layout();
  await wait(500);
  els.K.classList.remove('folded');
  await wait(140);
  els.S.classList.remove('folded');
  await wait(900);
  stack.classList.remove('restack');
}

async function intro() {
  const order = ['F', 'E', 'L', 'I', 'K', 'S'];
  order.forEach((ch) => els[ch].classList.add('pre'));
  els.X.classList.add('out');
  layout();
  await document.fonts.ready;
  layout();
  stack.classList.add('ready');
  for (const ch of order) {
    els[ch].classList.remove('pre');
    await wait(90);
  }
  await wait(1300);
  await toFelix();
}

if (reduced) {
  els.K.classList.add('folded');
  els.S.classList.add('folded');
  document.fonts.ready.then(() => { layout(); stack.classList.add('ready'); });
  layout();
} else {
  busy = true;
  intro().finally(() => { busy = false; });
}

// Klick auf den Stapel spielt die Verwandlung noch einmal
stack.addEventListener('click', async () => {
  if (busy || reduced) return;
  busy = true;
  try {
    if (felix) { await toFeliks(); await wait(700); await toFelix(); }
  } finally { busy = false; }
});

let rT;
addEventListener('resize', () => { clearTimeout(rT); rT = setTimeout(layout, 80); });

/* ---------------------------------------------------------------- Parallaxe: Scroll + Maus */

const pars = Object.entries(els).map(([ch, g]) => ({ el: $('.g-par', g), ...GLYPHS[ch] }));
const photo = $('.hero-photo img');
const inset = $('[data-par="inset"]');
const spark = $('[data-par="spark"]');
const mouse = { x: 0, y: 0 };
const cur = { x: 0, y: 0 };
let visible = true;
let raf = 0;

function frame() {
  raf = 0;
  const sy = Math.min(scrollY, H * 1.2);
  cur.x += (mouse.x - cur.x) * 0.08;
  cur.y += (mouse.y - cur.y) * 0.08;
  for (const p of pars) {
    const tx = cur.x * p.depth * 26;
    const ty = -sy * p.speed + cur.y * p.depth * 16;
    p.el.style.transform = `translate3d(${tx.toFixed(2)}px, ${ty.toFixed(2)}px, 0)`;
  }
  stack.style.setProperty('--mx', cur.x.toFixed(3));
  stack.style.setProperty('--my', cur.y.toFixed(3));
  photo.style.transform = `translate3d(${(-cur.x * 12).toFixed(2)}px, ${(sy * 0.22 - cur.y * 8).toFixed(2)}px, 0) scale(1.06)`;
  inset.style.transform = `translate3d(${(cur.x * 8).toFixed(2)}px, ${(-sy * 0.12).toFixed(2)}px, 0)`;
  surname.style.transform = `translate3d(0, ${(-sy * 0.5).toFixed(2)}px, 0)`;
  spark.style.transform = `translate3d(${(cur.x * 34).toFixed(2)}px, ${(-sy * 0.6 + cur.y * 22).toFixed(2)}px, 0) rotate(${(sy * 0.08).toFixed(2)}deg)`;
  if (visible && (Math.abs(mouse.x - cur.x) > 0.001 || Math.abs(mouse.y - cur.y) > 0.001)) kick();
}
function kick() { if (!raf && visible) raf = requestAnimationFrame(frame); }

if (!reduced) {
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) kick(); }).observe(hero);
  addEventListener('scroll', kick, { passive: true });
  hero.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    mouse.x = (e.clientX / innerWidth) * 2 - 1;
    mouse.y = (e.clientY / innerHeight) * 2 - 1;
    kick();
  });
  hero.addEventListener('pointerleave', () => { mouse.x = 0; mouse.y = 0; kick(); });
  kick();
}

/* ---------------------------------------------------------------- Start */

applyStatic();
render();

if (import.meta.env.DEV) { const { addSwitch } = await import('/shared/switch.js'); addSwitch('v-won'); }
