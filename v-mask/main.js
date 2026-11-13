// Variante „Mask“: rot-weißes Plakat, Schwarz-Weiß-Foto mit verschmiertem Gesicht.
import gsap from 'gsap';
gsap.ticker.lagSmoothing(0);
import * as DE from '/shared/data.js';
import * as EN from '/shared/data.en.js';
import * as RU from '/shared/data.ru.js';
import { createSmear } from './smear.js';

const DATA = { de: DE, en: EN, ru: RU };
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const touchOnly = matchMedia('(hover: none)').matches;

// ---------- Texte der Oberfläche (alles andere kommt aus den Daten-Dateien) ----------
const UI = {
  de: {
    about: 'Über mich', projects: 'Projekte', certs: 'Zertifikate', cv: 'Lebenslauf', contact: 'Kontakt',
    facts: 'Fun Facts',
    hint: 'Fahr mit der Maus<br>über das Gesicht.',
    hintTouch: 'Wisch seitlich<br>über das Foto.',
    langGroup: 'Sprache wählen',
    photoAlt: 'Schwarz-Weiß-Porträt von Feliks in Lederjacke, das Gesicht waagerecht verzogen',
    selfieAlt: 'Feliks mit Kopfhörern und Sonnenbrille auf der Stirn',
    walkAlt: 'Feliks mit Hut und Sonnenbrille, läuft auf die Kamera zu',
    open: 'bunprise.de öffnen',
    earned: 'Erhalten am',
    verify: 'Echtheit prüfen',
    pdf: 'Zertifikat als PDF',
    inWork: 'In Arbeit',
    course: 'Zum Kurs',
    status: { geplant: 'in Arbeit', erhalten: 'erhalten', folgt: 'folgt' },
    school: 'Schule', practice: 'Praxis', skills: 'Kenntnisse', languages: 'Sprachen', documents: 'Dokumente', interests: 'Interessen',
    mailLabel: 'E-Mail',
    copy: 'Kopieren', copied: 'Kopiert', copyFail: 'Bitte von Hand kopieren',
    certImg: 'Zertifikat',
    projImg: 'Bild zum Projekt',
  },
  en: {
    about: 'About me', projects: 'Projects', certs: 'Certificates', cv: 'CV', contact: 'Contact',
    facts: 'Fun facts',
    hint: 'Move your mouse<br>across the face.',
    hintTouch: 'Swipe sideways<br>across the photo.',
    langGroup: 'Choose language',
    photoAlt: 'Black-and-white portrait of Feliks in a leather jacket, his face stretched sideways',
    selfieAlt: 'Feliks with headphones and sunglasses on his forehead',
    walkAlt: 'Feliks in a hat and sunglasses, walking towards the camera',
    open: 'Open bunprise.de',
    earned: 'Earned on',
    verify: 'Verify',
    pdf: 'Certificate as PDF',
    inWork: 'In progress',
    course: 'Course page',
    school: 'School', practice: 'Work experience', skills: 'Skills', languages: 'Languages', documents: 'Documents', interests: 'Interests',
    mailLabel: 'Email',
    copy: 'Copy', copied: 'Copied', copyFail: 'Please copy by hand',
    certImg: 'Certificate',
    projImg: 'Project image',
  },
  ru: {
    about: 'Обо мне', projects: 'Проекты', certs: 'Сертификаты', cv: 'Резюме', contact: 'Контакты',
    facts: 'Интересные факты',
    hint: 'Проведи мышкой<br>по лицу.',
    hintTouch: 'Проведи пальцем<br>вбок по фото.',
    langGroup: 'Выбор языка',
    photoAlt: 'Чёрно-белый портрет Феликса в кожаной куртке, лицо растянуто в сторону',
    selfieAlt: 'Феликс в наушниках, солнечные очки на лбу',
    walkAlt: 'Феликс в шляпе и солнечных очках идёт к камере',
    open: 'Открыть bunprise.de',
    earned: 'Получен',
    verify: 'Проверить подлинность',
    pdf: 'Сертификат в PDF',
    inWork: 'В процессе',
    course: 'Страница курса',
    school: 'Школа', practice: 'Практика', skills: 'Навыки', languages: 'Языки', documents: 'Документы', interests: 'Интересы',
    mailLabel: 'Почта',
    copy: 'Копировать', copied: 'Скопировано', copyFail: 'Скопируй вручную',
    certImg: 'Сертификат',
    projImg: 'Картинка проекта',
  },
};

const LEVEL = { Grundlagen: 1, gut: 2, fortgeschritten: 3 };

const esc = (s = '') => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const bind = n => $(`[data-bind="${n}"]`);

// Anzeige-Text für Status-Codes: EN/RU haben `label`, DE nimmt die Übersetzungstabelle
const statusText = (item, lang) => item.label || UI[lang].status?.[item.status] || item.status;
const levelText = (item, lang) => item.label || item.level;
// Datumsbereiche wie „11.–15.11.2024“ nicht am Strich umbrechen (Wortverbinder um den Strich)
const nb = s => esc(s).replace(/(\S)([–-])(?=\S)/g, '$1⁠$2⁠');

// ---------- Inhalte bauen ----------
function render(lang) {
  const d = DATA[lang], t = UI[lang];
  document.documentElement.lang = lang;
  document.title = `${d.person.name}`;

  $$('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    el.innerHTML = `<span class="fit__in">${esc(t[key])}</span>`;
  });
  $$('[data-i18n-aria]').forEach(el => el.setAttribute('aria-label', t[el.dataset.i18nAria]));
  $$('[data-i18n-alt]').forEach(el => el.setAttribute('alt', t[el.dataset.i18nAlt]));

  bind('dateline').innerHTML = esc(d.person.photoCaption).replace(', ', ',<br>');
  bind('hint').innerHTML = touchOnly ? t.hintTouch : t.hint;

  // Über mich
  bind('aboutText').innerHTML = d.about.map(p => `<p>${esc(p)}</p>`).join('');
  bind('facts').innerHTML = d.facts.map(f => `<li><h4>${esc(f.title)}</h4><p>${esc(f.text)}</p></li>`).join('');

  // Projekte: Bunprise groß, dann „Diese Website“, Minecraft klein und zuletzt
  const [bun, site, mc] = d.projects;
  bind('projects').innerHTML = `
    <article class="proj proj--lead">
      <a class="proj__media" href="${esc(bun.url)}" target="_blank" rel="noopener" aria-label="${esc(t.open)}">
        <img src="${esc(bun.img)}" alt="" width="1200" height="630" loading="lazy" decoding="async">
      </a>
      <div class="proj__body">
        <p class="proj__when">${esc(bun.when)}</p>
        <h3 class="proj__title">${esc(bun.title)}</h3>
        <p class="proj__text">${esc(bun.text)}</p>
        <a class="pill" href="${esc(bun.url)}" target="_blank" rel="noopener">${esc(t.open)}</a>
      </div>
    </article>
    <div class="proj__row">
      <article class="proj proj--mid">
        <div class="proj__media"><img src="${esc(site.img)}" alt="${esc(t.projImg)}: ${esc(site.title)}" width="1214" height="1800" loading="lazy" decoding="async"></div>
        <div class="proj__body">
          <p class="proj__when">${esc(site.when)}</p>
          <h3 class="proj__title">${esc(site.title)}</h3>
          <p class="proj__text">${esc(site.text)}</p>
        </div>
      </article>
      <article class="proj proj--small">
        <div class="proj__media"><img src="${esc(mc.img)}" alt="${esc(t.projImg)}: ${esc(mc.title)}" width="1600" height="1200" loading="lazy" decoding="async"></div>
        <div class="proj__body">
          <p class="proj__when">${esc(mc.when)}</p>
          <h3 class="proj__title">${esc(mc.title)}</h3>
          <p class="proj__text">${esc(mc.text)}</p>
        </div>
      </article>
    </div>`;

  // Zertifikate
  const done = d.certificates.filter(c => c.status === 'erhalten');
  const todo = d.certificates.filter(c => c.status !== 'erhalten');
  bind('certs').innerHTML = done.map(c => `
    <article class="cert">
      <a class="cert__img" href="${esc(c.pdf)}" target="_blank" rel="noopener">
        <img src="${esc(c.img)}" alt="${esc(t.certImg)}: ${esc(c.title)}" width="1584" height="1080" loading="lazy" decoding="async">
      </a>
      <p class="cert__date">${esc(t.earned)} ${esc(c.date)}</p>
      <h3 class="cert__title">${esc(c.title)}</h3>
      <p class="cert__issuer">${esc(c.issuer)}</p>
      <p class="cert__links">
        <a class="pill" href="${esc(c.url)}" target="_blank" rel="noopener">${esc(t.verify)}</a>
        <a class="pill pill--ghost" href="${esc(c.pdf)}" target="_blank" rel="noopener">${esc(t.pdf)}</a>
      </p>
    </article>`).join('') + `
    <div class="cert-todo">
      <h3 class="sub">${esc(t.inWork)}</h3>
      <ul>${todo.map(c => `
        <li>
          <h4 class="cert__title">${esc(c.title)}</h4>
          <p class="cert__issuer">${esc(c.issuer)}</p>
          <a class="link" href="${esc(c.url)}" target="_blank" rel="noopener">${esc(t.course)}</a>
        </li>`).join('')}
      </ul>
    </div>`;

  // Lebenslauf (Daten sind schon „neueste zuerst“)
  const entries = list => `<ol class="entries">${list.map(e => `
      <li class="entry">
        <p class="entry__when">${esc(e.when)}</p>
        <p class="entry__what">${esc(e.what)}</p>
        <p class="entry__detail">${nb(e.detail)}</p>
      </li>`).join('')}</ol>`;
  const bars = lvl => lvl ? `<span class="bars" aria-hidden="true">${[1, 2, 3].map(i => `<i class="${i <= lvl ? 'on' : ''}"></i>`).join('')}</span>` : '';
  bind('cv').innerHTML = `
    <div class="cv__col"><h3 class="sub">${esc(t.school)}</h3>${entries(d.school)}</div>
    <div class="cv__col"><h3 class="sub">${esc(t.practice)}</h3>${entries(d.practice)}</div>
    <div class="cv__col"><h3 class="sub">${esc(t.skills)}</h3>
      ${d.skills.map(g => `
        <div class="skills">
          <h4>${esc(g.group)}</h4>
          <ul>${g.items.map(i => `<li><span class="skills__what">${esc(i.what)}</span><span class="skills__lvl">${bars(LEVEL[i.level])}<span>${esc(levelText(i, lang))}</span></span></li>`).join('')}</ul>
        </div>`).join('')}
    </div>
    <div class="cv__col"><h3 class="sub">${esc(t.languages)}</h3>
      <ul class="plain">${d.languages.map(l => `<li><span>${esc(l.lang)}</span><span>${esc(levelText(l, lang))}</span></li>`).join('')}</ul>
    </div>
    <div class="cv__col"><h3 class="sub">${esc(t.interests)}</h3>
      <ul class="plain plain--stack">${d.interests.map(i => `<li><span>${esc(i.what)}</span><span>${esc(i.detail)}</span></li>`).join('')}</ul>
    </div>
    <div class="cv__col"><h3 class="sub">${esc(t.documents)}</h3>
      <ul class="plain plain--stack">${d.documents.map(x => `<li><span>${esc(x.title)}, ${esc(x.when)}</span><span class="tag">${esc(statusText(x, lang))}</span></li>`).join('')}</ul>
    </div>`;

  // Kontakt
  const mail = bind('mail');
  mail.href = `mailto:${d.contact.email}`;
  mail.textContent = d.contact.email;
  bind('copy').textContent = t.copy;
  bind('foot').textContent = `© 2026 ${d.person.name}, ${d.person.city}`;

  $$('.lang button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.lang === lang)));
  requestAnimationFrame(fitAll);
}

// ---------- Sprache ----------
const LANGS = ['de', 'en', 'ru'];
function pickLang() {
  const q = new URLSearchParams(location.search).get('lang');
  if (LANGS.includes(q)) return q;
  try { const s = localStorage.getItem('lang'); if (LANGS.includes(s)) return s; } catch {}
  return 'de';
}
let lang = pickLang();

function setLang(next) {
  if (!LANGS.includes(next) || next === lang) return;
  lang = next;
  try { localStorage.setItem('lang', lang); } catch {}
  const url = new URL(location.href);
  url.searchParams.set('lang', lang);
  history.replaceState(null, '', url);
  render(lang);
}
document.addEventListener('click', e => {
  const b = e.target.closest('.lang button');
  if (b) setLang(b.dataset.lang);
});

// ---------- Überschriften auf volle Breite setzen (wie im Plakat) ----------
function fitHeading(el) {
  const inner = el.querySelector('.fit__in');
  if (!inner) return;
  const W = el.clientWidth;
  inner.style.letterSpacing = '0';
  inner.style.marginRight = '0';
  el.style.fontSize = '100px';
  const w100 = inner.getBoundingClientRect().width;
  if (!w100) return;
  const vh = window.innerHeight;
  const max = Math.min(vh * (W < 700 ? 0.17 : 0.27), 320);
  let size = W / w100 * 100;
  if (size > max) {
    size = max;
    // etwas Rest-Breite über den Buchstabenabstand verteilen (das Plakat ist leicht gesperrt), Rest bleibt rechts frei
    const n = [...inner.textContent].length;
    const rest = W - w100 * size / 100;
    const ls = Math.min(rest / Math.max(n - 1, 1), size * 0.06);
    inner.style.letterSpacing = `${ls}px`;
    inner.style.marginRight = `${-ls}px`;
  }
  el.style.fontSize = `${size}px`;
}

function fitHero() {
  const h1 = $('.hero__name');
  const first = $('.hero__word--first'), last = $('.hero__word--last');
  const W = h1.clientWidth;
  h1.style.fontSize = '100px';
  const stacked = W < 760;
  h1.classList.toggle('is-stacked', stacked);
  const w1 = first.getBoundingClientRect().width;
  const w2 = last.getBoundingClientRect().width;
  const size = stacked ? W / w2 * 100 : W / (w1 + w2 + 22) * 100;
  h1.style.fontSize = `${size}px`;
  // das X füllt die Breite von „KS“: es bleibt waagerecht gedehnt, wie verschmiert
  if (isX) gsap.set('.morph__x', { scaleX: xRatio() });
  const r = h1.getBoundingClientRect();
  hero.style.setProperty('--name-b', `${r.bottom - hero.getBoundingClientRect().top}px`);
}

function fitAll() {
  fitHero();
  $$('.fit').forEach(fitHeading);
  layoutHero();
}

// ---------- FELIX → FELIKS: die Buchstaben verschmieren ----------
// Start auf „FELIX“, dann verschmiert das X zu „KS“. morph(true) = zum X, morph(false) = zu KS.
const blur = document.getElementById('smear-x-blur');
let morphTl = null;
let isX = false;
const xRatio = () => $('.morph__ks').offsetWidth / Math.max($('.morph__x').offsetWidth, 1);
function morph(toX, instant = false) {
  const m = $('.morph'), ks = $('.morph__ks'), x = $('.morph__x');
  const from = toX ? ks : x, to = toX ? x : ks;
  const r = xRatio();
  const endScale = toX ? r : 1;            // Endbreite: X so breit wie „KS“
  isX = toX;
  if (reduced || instant) {
    morphTl?.kill();
    gsap.set(from, { opacity: 0 }); gsap.set(to, { opacity: 1, scaleX: endScale });
    return;
  }
  morphTl?.kill();
  const b = { v: 0 };
  m.classList.add('is-smearing');
  morphTl = gsap.timeline({
    onUpdate: () => blur.setAttribute('stdDeviation', `${b.v} 0`),
    onComplete: () => { m.classList.remove('is-smearing'); blur.setAttribute('stdDeviation', '0 0'); },
  })
    .to(b, { v: 22, duration: 0.45, ease: 'power2.in' }, 0)
    .to(from, { scaleX: (toX ? 1 : r) * 2.2, opacity: 0, duration: 0.5, ease: 'power2.in' }, 0)
    .fromTo(to, { scaleX: endScale * 2.2, opacity: 0 }, { scaleX: endScale, opacity: 1, duration: 0.6, ease: 'power3.out' }, 0.42)
    .to(b, { v: 0, duration: 0.6, ease: 'power2.out' }, 0.42);
}

// ---------- Hero: Foto + Verschmieren ----------
const hero = $('.hero');
const canvas = $('.hero__canvas');
const photo = $('.hero__fallback');
const CROP = [0.235, 1];                    // oberen leeren Bereich des Freistellers abschneiden
const ASPECT = 1214 / (1800 * (CROP[1] - CROP[0]));
let smear = null;
const geo = { rect: [0, 0, 1, 1], limit: 1e5 };
const S = { x: 0, y: 0, tx: 0, ty: 0, amt: 0, base: 0.5, boost: 0, scroll: 0, time: 0 };

function layoutHero() {
  const W = hero.clientWidth, H = hero.clientHeight;
  const h1 = $('.hero__name').getBoundingClientRect();
  const heroTop = hero.getBoundingClientRect().top;
  const stacked = W < 760;
  // Kopf knapp unter die Schrift, Oberkörper darf unten aus dem Bild laufen (wie im Plakat)
  // Handy: Foto beginnt unter dem Kleingedruckten; Desktop: Kopf knapp unter die Schrift
  const printBottom = Math.max(...['.print--tl', '.print--tr', '.print--ml'].map(s => $(s).getBoundingClientRect().bottom)) - heroTop;
  const top = stacked ? printBottom + 8 : (h1.bottom - heroTop) - h1.height * 0.22;
  let h = (H - top) * 1.42, w = h * ASPECT;
  const maxW = stacked ? W * 1.3 : W * 0.75;
  if (w > maxW) { w = maxW; h = w / ASPECT; }
  const x = W * (stacked ? 0.5 : 0.47) - w * 0.47;
  const y = top;
  geo.rect = [x, y, w, h];
  // rechts vor dem Kleingedruckten auslaufen lassen (nur am Desktop, am Handy darf es bis zum Rand)
  geo.limit = stacked ? W + 400 : $('.print--tr').getBoundingClientRect().left - hero.getBoundingClientRect().left - 24;
  // Fallback-Bild (ohne WebGL) an dieselbe Stelle legen
  Object.assign(photo.style, { left: `${x}px`, top: `${y - h * CROP[0] / (CROP[1] - CROP[0])}px`, width: `${w}px`, height: 'auto' });
  photo.classList.add('is-placed');
  if (smear) {
    smear.resize(W, H, geo.rect);
    home();
    S.x = S.tx; S.y = S.ty;
    draw();
  }
}

// Ruhelage: Anker an der linken Wange, Bänder um die Augen
function home() {
  const [x, y, w, h] = geo.rect;
  S.tx = x + w * 0.335;
  S.ty = y + h * 0.213;
}

function draw() {
  const [, , , h] = geo.rect;
  smear.draw({ x: S.x, y: S.y, amt: S.amt, bw: h * 0.072, time: S.time, limit: geo.limit });
}

let pointerIn = false, lastX = 0, lastT = 0, running = false, visible = true;
function tick(now) {
  running = false;
  if (!visible) return;
  S.time = now / 1000;
  S.x += (S.tx - S.x) * 0.1;
  S.y += (S.ty - S.y) * 0.1;
  S.boost *= 0.94;
  const target = S.base + S.boost + S.scroll * 1.1;
  S.amt += (target - S.amt) * 0.08;
  draw();
  loop();
}
function loop() { if (!running && !reduced) { running = true; requestAnimationFrame(tick); } }

function onPointer(e) {
  const r = hero.getBoundingClientRect();
  const [x, y, w, h] = geo.rect;
  const px = e.clientX - r.left, py = e.clientY - r.top;
  S.tx = Math.min(Math.max(px, x + w * 0.12), x + w * 0.85);
  S.ty = Math.min(Math.max(py, y + h * 0.06), y + h * 0.92);
  const now = performance.now();
  if (lastT) {
    const v = Math.abs(px - lastX) / Math.max(now - lastT, 8);
    S.boost = Math.min(S.boost + v * 0.12, 0.9);
  }
  lastX = px; lastT = now;
  pointerIn = true;
  loop();
}
function onLeave() { pointerIn = false; lastT = 0; home(); loop(); }

function onScroll() {
  const H = hero.clientHeight;
  S.scroll = Math.min(Math.max(window.scrollY / H, 0), 1);
  loop();
}

async function initHero() {
  if (!photo.complete) await new Promise(r => { photo.onload = r; photo.onerror = r; });
  try { await photo.decode(); } catch {}
  smear = createSmear(canvas, photo, { crop: CROP });
  if (!smear) { hero.classList.add('no-gl'); return; }
  hero.classList.add('has-gl');
  layoutHero();

  if (reduced) {
    // keine Animation: ein ruhiges Bild, das nur direkt auf die Maus reagiert (ohne Nachschwingen)
    S.amt = S.base; draw();
    hero.addEventListener('pointermove', e => { onPointer(e); S.x = S.tx; S.y = S.ty; draw(); }, { passive: true });
    hero.addEventListener('pointerleave', () => { home(); S.x = S.tx; S.y = S.ty; draw(); });
    return;
  }

  // Auftakt: erst das ganze Gesicht, dann zieht die Maske zur Seite
  S.amt = 0; draw();
  gsap.to(S, { amt: S.base, duration: 1.6, delay: 0.5, ease: 'power2.inOut', onUpdate: draw });
  setTimeout(loop, 2200);

  hero.addEventListener('pointermove', onPointer, { passive: true });
  hero.addEventListener('pointerdown', onPointer, { passive: true });
  hero.addEventListener('pointerleave', onLeave);
  hero.addEventListener('pointercancel', onLeave);
  window.addEventListener('scroll', onScroll, { passive: true });
  new IntersectionObserver(([en]) => { visible = en.isIntersecting; if (visible) loop(); }).observe(hero);
}

// ---------- E-Mail kopieren ----------
bind('copy').addEventListener('click', async () => {
  const t = UI[lang], btn = bind('copy'), st = $('.copy__status');
  try {
    await navigator.clipboard.writeText(DATA[lang].contact.email);
    btn.textContent = t.copied; st.textContent = t.copied;
  } catch {
    btn.textContent = t.copyFail; st.textContent = t.copyFail;
  }
  setTimeout(() => { btn.textContent = UI[lang].copy; st.textContent = ''; }, 2200);
});

// ---------- Start ----------
render(lang);
await document.fonts.ready;
fitAll();
initHero();

// Start auf FELIX (so sagen viele), dann verschmiert es zur richtigen Schreibweise FELIKS.
// Ohne Bewegung (reduced) steht gleich FELIKS da.
// (Damit schon das erste Bild FELIX zeigt, setzt ein kleines Skript im <head> die Klasse „felix-first“.)
if (!reduced) {
  morph(true, true);                       // FELIX sofort, ohne Übergang (X auf die Breite von „KS“ gedehnt)
  let busy = true;                         // bis der Start-Übergang durch ist, kein Hover-Replay
  setTimeout(() => { morph(false); setTimeout(() => { busy = false; }, 1100); }, 1900);
  // Name antippen oder überfahren: FELIKS → FELIX → FELIKS
  const replay = () => {
    if (busy) return; busy = true;
    morph(true);
    setTimeout(() => { morph(false); }, 1300);
    setTimeout(() => { busy = false; }, 2600);
  };
  $('.hero__name').addEventListener('pointerenter', replay);
} else document.documentElement.classList.remove('felix-first');

let rz;
window.addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(fitAll, 120); });

if (import.meta.env.DEV) { const { addSwitch } = await import('/shared/switch.js'); addSwitch('v-mask'); }
