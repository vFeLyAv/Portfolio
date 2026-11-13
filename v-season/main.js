// v-season: „Picknick-Tagebuch“ nach dem Poster „A Season Called Us“.
// Wiese (grass.js), Musik über die Kopfhörer (music.js), Inhalte aus /shared/data*.js.
import * as de from '/shared/data.js';
import * as en from '/shared/data.en.js';
import * as ru from '/shared/data.ru.js';
import { initGrass } from './grass.js';
import { toggle as toggleMusic, stop as stopMusic, onMusic } from './music.js';

const DATA = { de, en, ru };
const LANGS = ['de', 'en', 'ru'];
const reduce = matchMedia('(prefers-reduced-motion: reduce)');
// ?shot = Endzustand sofort zeigen (nur für Screenshots im Headless-Browser)
const SHOT = new URLSearchParams(location.search).has('shot');
if (SHOT) document.documentElement.classList.add('shot');

/* ---------------- Texte der Oberfläche ---------------- */
const UI = {
  de: {
    tagline: 'ein paar Seiten<br>aus meinen Tagen',
    langGroup: 'Sprache',
    musicOn: 'Musik abspielen', musicOff: 'Musik ausschalten',
    altHero: 'Felix im Sommer mit Fischerhut und Sonnenbrille auf einer Straße',
    altBalloons: 'Felix in einem Raum voller gelber Luftballons',
    nick: 'Felya', about: 'Über mich', facts: 'Fun Facts',
    projects: 'Projekte', open: 'bunprise.de öffnen',
    certs: 'Zertifikate', earned: 'erhalten', planned: 'in Arbeit', verify: 'Echtheit prüfen', pdf: 'PDF ansehen', course: 'Zum Kurs', inWork: 'In Arbeit',
    cv: 'Lebenslauf', school: 'Schule', practice: 'Praxis', skills: 'Kenntnisse', languages: 'Sprachen', documents: 'Dokumente', soon: 'folgt',
    contact: 'Kontakt', mail: 'E-Mail', copy: 'Kopieren', copied: 'Kopiert', insta: 'Instagram', bye: 'bis bald',
    months: 'November', days: ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'],
    levelOf: (n) => `Stufe ${n} von 3`,
  },
  en: {
    tagline: 'a few pages<br>from my days',
    langGroup: 'Language',
    musicOn: 'Play music', musicOff: 'Stop music',
    altHero: 'Felix in summer wearing a bucket hat and sunglasses on a street',
    altBalloons: 'Felix in a room full of yellow balloons',
    nick: 'Felya', about: 'About me', facts: 'Fun facts',
    projects: 'Projects', open: 'Visit bunprise.de',
    certs: 'Certificates', earned: 'earned', planned: 'in progress', verify: 'Verify certificate', pdf: 'View PDF', course: 'Go to course', inWork: 'In progress',
    cv: 'Résumé', school: 'School', practice: 'Practical experience', skills: 'Skills', languages: 'Languages', documents: 'Documents', soon: 'coming soon',
    contact: 'Contact', mail: 'Email', copy: 'Copy', copied: 'Copied', insta: 'Instagram', bye: 'see you soon',
    months: 'November', days: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    levelOf: (n) => `level ${n} of 3`,
  },
  ru: {
    tagline: 'несколько страниц<br>из моих дней',
    langGroup: 'Язык',
    musicOn: 'Включить музыку', musicOff: 'Выключить музыку',
    altHero: 'Феликс летом в панаме и солнечных очках на улице',
    altBalloons: 'Феликс в комнате, полной жёлтых воздушных шаров',
    nick: 'Феля', about: 'Обо мне', facts: 'Интересные факты',
    projects: 'Проекты', open: 'Открыть bunprise.de',
    certs: 'Сертификаты', earned: 'получен', planned: 'в процессе', verify: 'Проверить подлинность', pdf: 'Открыть PDF', course: 'К курсу', inWork: 'В процессе',
    cv: 'Резюме', school: 'Учёба', practice: 'Практика', skills: 'Навыки', languages: 'Языки', documents: 'Документы', soon: 'скоро',
    contact: 'Контакты', mail: 'Почта', copy: 'Копировать', copied: 'Скопировано', insta: 'Instagram', bye: 'до встречи',
    months: 'Ноябрь', days: ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'],
    levelOf: (n) => `уровень ${n} из 3`,
  },
};

const LEVEL = { 'Grundlagen': 1, 'gut': 2, 'fortgeschritten': 3, 'im Alltag': 3 };
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const show = (item, fallback) => esc(item.label ?? fallback);

/* ---------------- Sprache wählen ---------------- */
function pickLang() {
  const q = new URLSearchParams(location.search).get('lang');
  if (LANGS.includes(q)) return q;
  try { const s = localStorage.getItem('lang'); if (LANGS.includes(s)) return s; } catch { /* privat */ }
  const nav = (navigator.language || 'de').slice(0, 2);
  return LANGS.includes(nav) ? nav : 'de';
}
let lang = pickLang();

/* ---------------- kleine SVG-Bausteine ---------------- */
const PETAL = '<svg viewBox="0 0 60 34" aria-hidden="true"><defs><linearGradient id="pg__ID__" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fbe3ea"/><stop offset=".55" stop-color="#f2b3c4"/><stop offset="1" stop-color="#e48aa3"/></linearGradient></defs><path d="M2 18C10 4 34-2 56 10c2 1 2 3 0 4C38 30 12 32 2 18Z" fill="url(#pg__ID__)"/><path d="M6 18c14-2 30-4 46-6" stroke="#fff" stroke-opacity=".45" stroke-width="1" fill="none"/></svg>';
let petalId = 0;
const petal = () => PETAL.replaceAll('__ID__', String(++petalId));
const DOT = (on) => `<span class="lv${on ? ' on' : ''}"></span>`;

/* ---------------- Inhalte rendern ---------------- */
function render() {
  const d = DATA[lang], t = UI[lang];
  document.documentElement.lang = lang;
  document.querySelectorAll('[data-i]').forEach((el) => { el.innerHTML = t[el.dataset.i]; });
  document.querySelectorAll('[data-i-alt]').forEach((el) => { el.alt = t[el.dataset.iAlt]; });
  document.querySelector('.lang').setAttribute('aria-label', t.langGroup);
  document.querySelectorAll('.lang button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lang === lang)));
  syncMusicLabels();

  // Kalenderblatt: November 2026 beginnt an einem Sonntag
  document.getElementById('calMonth').textContent = t.months;
  let g = t.days.map((x) => `<span class="dn">${x}</span>`).join('');
  for (let i = 1; i <= 30; i++) g += `<span class="dd${i === 8 ? ' mark' : ''}">${i}</span>`;
  document.getElementById('calGrid').innerHTML = g;

  const cert = (c, i) => {
    const earned = c.status === 'erhalten';
    const st = c.label ?? (earned ? t.earned : t.planned);
    return earned ? `
      <article class="cert">
        <a class="print tilt-${i % 2 ? 'r' : 'l'}" href="${esc(c.img)}" target="_blank" rel="noopener"><img src="${esc(c.img)}" alt="${esc(c.title)}" loading="lazy" width="1100" height="850"></a>
        <h4>${esc(c.title)}</h4>
        <p class="meta">${esc(c.issuer)}</p>
        <p class="meta"><span class="badge">${esc(st)}</span> <time>${esc(c.date)}</time></p>
        <p class="links"><a href="${esc(c.url)}" target="_blank" rel="noopener">${t.verify}</a><a href="${esc(c.pdf)}" target="_blank" rel="noopener">${t.pdf}</a></p>
      </article>` : `
      <li class="plan">
        <div><h4>${esc(c.title)}</h4><p class="meta">${esc(c.issuer)}</p></div>
        <span class="badge soft">${esc(st)}</span>
        <a href="${esc(c.url)}" target="_blank" rel="noopener">${t.course}</a>
      </li>`;
  };

  const tl = (arr) => `<ol class="tl">${arr.map((x) => `<li><span class="when">${esc(x.when)}</span><div><h4>${esc(x.what)}</h4><p>${esc(x.detail)}</p></div></li>`).join('')}</ol>`;

  const [bun, site, mc] = d.projects;
  const earned = d.certificates.filter((c) => c.status === 'erhalten');
  const planned = d.certificates.filter((c) => c.status !== 'erhalten');

  document.getElementById('diary').innerHTML = `
  <section class="page" id="ueber-mich" aria-labelledby="h-about">
    <h2 class="script" id="h-about">${t.about}</h2>
    <div class="paper">
      <span class="tape" aria-hidden="true"></span>
      <div class="about">
        <div class="about-text">${d.about.map((p) => `<p>${esc(p)}</p>`).join('')}</div>
        <figure class="polaroid small drag" data-r="4">
          <img src="/img/balloons-edit.jpg" alt="${esc(t.altBalloons)}" loading="lazy" width="714" height="1280">
          <figcaption>${t.nick}</figcaption>
        </figure>
      </div>
      <h3 class="sub">${t.facts}</h3>
      <ul class="facts">${d.facts.map((f) => `<li><span class="pt">${petal()}</span><div><h4>${esc(f.title)}</h4><p>${esc(f.text)}</p></div></li>`).join('')}</ul>
    </div>
  </section>

  <section class="page" id="projekte" aria-labelledby="h-proj">
    <h2 class="script" id="h-proj">${t.projects}</h2>
    <div class="paper">
      <span class="tape" aria-hidden="true"></span>
      <article class="proj big">
        <a class="print tilt-l" href="${esc(bun.url)}" target="_blank" rel="noopener"><img src="${esc(bun.img)}" alt="Bunprise" loading="lazy" width="1200" height="630"></a>
        <div>
          <p class="when">${esc(bun.when)}</p>
          <h3><img class="icon" src="${esc(bun.icon)}" alt="" width="40" height="40">${esc(bun.title)}</h3>
          <p>${esc(bun.text)}</p>
          <p><a class="btn" href="${esc(bun.url)}" target="_blank" rel="noopener">${t.open}</a></p>
        </div>
      </article>
      <article class="proj big rev">
        <figure class="print tilt-r"><img src="${esc(site.img)}" alt="" loading="lazy" width="800" height="1000"></figure>
        <div>
          <p class="when">${esc(site.when)}</p>
          <h3>${esc(site.title)}</h3>
          <p>${esc(site.text)}</p>
        </div>
      </article>
      <article class="proj mini">
        <figure class="print"><img src="${esc(mc.img)}" alt="" loading="lazy" width="800" height="450"></figure>
        <div>
          <p class="when">${esc(mc.when)}</p>
          <h3>${esc(mc.title)}</h3>
          <p>${esc(mc.text)}</p>
        </div>
      </article>
    </div>
  </section>

  <section class="page" id="zertifikate" aria-labelledby="h-cert">
    <h2 class="script" id="h-cert">${t.certs}</h2>
    <div class="paper">
      <span class="tape" aria-hidden="true"></span>
      <div class="certs">${earned.map(cert).join('')}</div>
      <h3 class="sub">${t.inWork}</h3>
      <ul class="plans">${planned.map(cert).join('')}</ul>
    </div>
  </section>

  <section class="page calendar" id="lebenslauf" aria-labelledby="h-cv">
    <h2 class="script" id="h-cv">${t.cv}</h2>
    <div class="paper">
      <span class="rings" aria-hidden="true">${'<i></i>'.repeat(12)}</span>
      <div class="cv-cols">
        <div><h3 class="sub">${t.school}</h3>${tl(d.school)}</div>
        <div><h3 class="sub">${t.practice}</h3>${tl(d.practice)}</div>
      </div>
      <h3 class="sub">${t.skills}</h3>
      <div class="skills">${d.skills.map((g) => `
        <div class="sk"><h4>${esc(g.group)}</h4><ul>${g.items.map((it) => {
          const n = LEVEL[it.level] || 1;
          return `<li><span class="what">${esc(it.what)}</span><span class="lvl" role="img" aria-label="${esc(t.levelOf(n))}">${DOT(n >= 1)}${DOT(n >= 2)}${DOT(n >= 3)}</span><span class="lt">${show(it, it.level)}</span></li>`;
        }).join('')}</ul></div>`).join('')}
      </div>
      <div class="cv-cols">
        <div><h3 class="sub">${t.languages}</h3><ul class="langs">${d.languages.map((l) => `<li><span>${esc(l.lang)}</span><span class="lt">${show(l, l.level)}</span></li>`).join('')}</ul></div>
        <div><h3 class="sub">${t.documents}</h3><ul class="docs">${d.documents.map((x) => `<li><div><h4>${esc(x.title)}</h4><p class="meta">${esc(x.when)}</p></div><span class="badge soft">${x.label ? esc(x.label) : t.soon}</span></li>`).join('')}</ul></div>
      </div>
    </div>
  </section>

  <section class="page letter" id="kontakt" aria-labelledby="h-contact">
    <h2 class="script" id="h-contact">${t.contact}</h2>
    <div class="paper">
      <span class="tape" aria-hidden="true"></span>
      <dl class="contact">
        <div><dt>${t.mail}</dt><dd><a href="mailto:${esc(d.contact.email)}">${esc(d.contact.email)}</a> <button class="copy" type="button" data-copy="${esc(d.contact.email)}">${t.copy}</button></dd></div>
        <div><dt>${t.insta}</dt><dd><a href="https://www.instagram.com/${esc(d.contact.instagram)}/" target="_blank" rel="noopener">@${esc(d.contact.instagram)}</a></dd></div>
      </dl>
      <p class="bye">${t.bye}</p>
    </div>
  </section>`;

  document.querySelectorAll('#diary .drag').forEach(makeDraggable);
  document.querySelectorAll('.copy').forEach((b) => b.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(b.dataset.copy); } catch {
      const r = document.createRange(); r.selectNodeContents(b.previousElementSibling); const s = getSelection(); s.removeAllRanges(); s.addRange(r); document.execCommand('copy');
    }
    b.textContent = UI[lang].copied; b.classList.add('ok');
    setTimeout(() => { b.textContent = UI[lang].copy; b.classList.remove('ok'); }, 1800);
  }));
  pages = [...document.querySelectorAll('.page')];
  turnPages();
}

/* ---------------- Musik ---------------- */
const buds = document.getElementById('buds');
const mini = document.getElementById('musicMini');
let musicState = 'off';
function syncMusicLabels() {
  const t = UI[lang];
  buds.querySelector('.sr-only').textContent = musicState === 'off' ? t.musicOn : t.musicOff;
  mini.querySelector('.sr-only').textContent = t.musicOff;
}
buds.addEventListener('click', () => toggleMusic());
mini.addEventListener('click', () => stopMusic());
onMusic((s) => {
  musicState = s;
  buds.setAttribute('aria-pressed', String(s !== 'off'));
  buds.classList.toggle('loading', s === 'loading');
  buds.classList.toggle('playing', s === 'on');
  mini.hidden = s === 'off';
  syncMusicLabels();
});

/* ---------------- Dinge auf der Decke anheben und verschieben ---------------- */
function makeDraggable(el) {
  if (el.dataset.dragReady) return; el.dataset.dragReady = '1';
  const rot = Number(el.dataset.r || 0);
  el.style.setProperty('--r', rot + 'deg');
  let ox = 0, oy = 0, sx = 0, sy = 0, dx = 0, dy = 0, lifted = false, hold = 0, tStart = null;
  const R = () => (innerWidth < 700 ? 110 : 220);
  const apply = () => {
    let x = ox + dx, y = oy + dy; const r = Math.hypot(x, y), lim = R();
    if (r > lim) { const s = (lim * Math.tanh(r / lim)) / r; x *= s; y *= s; }
    el.style.setProperty('--dx', x.toFixed(1) + 'px'); el.style.setProperty('--dy', y.toFixed(1) + 'px');
    return [x, y];
  };
  const lift = () => { lifted = true; el.classList.add('lifted'); };
  const drop = () => {
    if (!lifted) return; lifted = false; el.classList.remove('lifted');
    [ox, oy] = apply(); dx = dy = 0;
    el.style.setProperty('--tilt', ((Math.random() - 0.5) * 6).toFixed(1) + 'deg');
  };
  // Maus / Stift
  el.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'touch' || e.button !== 0) return;
    if (e.target.closest('a')) return;
    e.preventDefault(); el.setPointerCapture(e.pointerId);
    sx = e.clientX; sy = e.clientY; dx = dy = 0; lift();
  });
  el.addEventListener('pointermove', (e) => { if (!lifted || e.pointerType === 'touch') return; dx = e.clientX - sx; dy = e.clientY - sy; apply(); });
  const up = (e) => { if (e.pointerType === 'touch') return; drop(); };
  el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
  // Finger: kurz gedrückt halten → anheben (sonst normal scrollen)
  el.addEventListener('touchstart', (e) => {
    const p = e.touches[0]; tStart = { x: p.clientX, y: p.clientY };
    clearTimeout(hold);
    hold = setTimeout(() => { sx = tStart.x; sy = tStart.y; dx = dy = 0; lift(); navigator.vibrate?.(8); }, 260);
  }, { passive: true });
  el.addEventListener('touchmove', (e) => {
    const p = e.touches[0];
    if (!lifted) { if (tStart && Math.hypot(p.clientX - tStart.x, p.clientY - tStart.y) > 8) clearTimeout(hold); return; }
    e.preventDefault(); dx = p.clientX - sx; dy = p.clientY - sy; apply();
  }, { passive: false });
  const tend = () => { clearTimeout(hold); drop(); };
  el.addEventListener('touchend', tend); el.addEventListener('touchcancel', tend);
  el.addEventListener('contextmenu', (e) => { if (lifted) e.preventDefault(); });
}

/* ---------------- Seiten blättern beim Scrollen ---------------- */
let pages = [];
let ticking = false;
function turnPages() {
  ticking = false;
  const vh = innerHeight;
  for (const p of pages) {
    const paper = p.querySelector('.paper');
    const top = p.getBoundingClientRect().top + (paper ? paper.offsetTop : 0);
    let k = (vh - top) / (vh * 0.6);
    k = Math.max(0, Math.min(1, k));
    if (reduce.matches) k = 1;
    const e = 1 - (1 - k) ** 2;
    p.style.setProperty('--turn', (1 - e).toFixed(4));
  }
}
addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(turnPages); } }, { passive: true });
addEventListener('resize', () => requestAnimationFrame(turnPages));

/* ---------------- Lilie (SVG, prozedural) ---------------- */
function lilySVG() {
  let s = 1;
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  const flower = (cx, cy, scale, rot, id) => {
    let out = `<g transform="translate(${cx} ${cy}) rotate(${rot}) scale(${scale})">`;
    out += `<defs><radialGradient id="lg${id}" cx="0" cy="0" r="150" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#c24a6b"/><stop offset=".35" stop-color="#e6869f"/><stop offset=".75" stop-color="#f6c2cf"/><stop offset="1" stop-color="#fde9ee"/></radialGradient></defs>`;
    for (let i = 0; i < 6; i++) {
      const a = i * 60 + (i % 2 ? 30 : 0) * 0 + (rnd() - 0.5) * 12;
      const L = i % 2 ? 132 : 150, w = i % 2 ? 40 : 30, bend = (rnd() - 0.5) * 30;
      out += `<g transform="rotate(${a.toFixed(1)})">
        <path d="M0 0C${w} -${L * 0.2} ${w * 1.05} -${L * 0.7} ${bend * 0.4} -${L}C${-w * 0.9} -${L * 0.72} ${-w} -${L * 0.22} 0 0Z" fill="url(#lg${id})" stroke="#e7a2b4" stroke-width=".8"/>
        <path d="M0 -6C2 -${L * 0.4} ${bend * 0.2} -${L * 0.7} ${bend * 0.4} -${L * 0.95}" stroke="#fff" stroke-opacity=".55" stroke-width="2" fill="none"/>`;
      for (let k = 0; k < 14; k++) {
        const yy = -(10 + rnd() * L * 0.45), xx = (rnd() - 0.5) * w * 0.9 * (Math.abs(yy) / (L * 0.5));
        out += `<ellipse cx="${xx.toFixed(1)}" cy="${yy.toFixed(1)}" rx="${(1.4 + rnd() * 1.8).toFixed(1)}" ry="${(1 + rnd()).toFixed(1)}" fill="#8e2a47" opacity="${(0.55 + rnd() * 0.4).toFixed(2)}"/>`;
      }
      out += '</g>';
    }
    for (let i = 0; i < 6; i++) {
      const a = i * 60 + 20 + (rnd() - 0.5) * 20, L = 70 + rnd() * 20;
      out += `<g transform="rotate(${a.toFixed(1)})"><path d="M0 0C4 -${L * 0.4} -4 -${L * 0.7} 2 -${L}" stroke="#d9e2b4" stroke-width="2.2" fill="none"/><ellipse cx="2" cy="-${L + 4}" rx="4" ry="9" fill="#9c4a24" transform="rotate(${(rnd() * 60 - 30).toFixed(0)} 2 -${L + 4})"/></g>`;
    }
    out += '<path d="M0 0C6 -40 -6 -70 4 -96" stroke="#c9d89a" stroke-width="3.4" fill="none"/><circle cx="4" cy="-98" r="6" fill="#a8bb6a"/>';
    return out + '</g>';
  };
  const leaf = (x, y, L, rot) => `<path transform="translate(${x} ${y}) rotate(${rot})" d="M0 0C14 -${L * 0.3} 12 -${L * 0.7} 0 -${L}C-12 -${L * 0.7} -14 -${L * 0.3} 0 0Z" fill="#3f6a25" stroke="#2c4d19" stroke-width="1"/>`;
  let svg = '<svg viewBox="0 0 520 520" xmlns="http://www.w3.org/2000/svg">';
  svg += '<defs><filter id="lsh" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="6" dy="10" stdDeviation="9" flood-color="#0d2008" flood-opacity=".45"/></filter></defs><g filter="url(#lsh)">';
  svg += leaf(150, 470, 260, 38) + leaf(120, 500, 240, 68) + leaf(220, 520, 200, 12) + leaf(80, 460, 210, -10);
  // Schleierkraut
  for (let i = 0; i < 40; i++) {
    const x = 20 + rnd() * 260, y = 240 + rnd() * 270;
    svg += `<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${(3 + rnd() * 3.5).toFixed(1)}" fill="#fbf8f0" stroke="#e1dccd" stroke-width=".6"/>`;
  }
  svg += flower(250, 290, 1.12, 18, 1) + flower(70, 430, 0.9, -40, 2);
  svg += '</g></svg>';
  return svg;
}

/* ---------------- Blütenblätter ---------------- */
function scatterPetals() {
  const spots = [
    [24, 22, 18, 1.1], [55, 9, -30, 0.8], [80, 33, 40, 1], [92, 52, -10, 1.2], [8, 58, 70, 0.9],
    [43, 70, 12, 0.85], [61, 47, -48, 0.7], [33, 40, 100, 0.75], [70, 88, 30, 1], [16, 86, -20, 1.1],
  ];
  document.getElementById('petals').innerHTML = spots.map(([x, y, r, s]) =>
    `<span class="pe" style="left:${x}%;top:${y}%;--rot:${r}deg;--s:${s}">${petal()}</span>`).join('');
  const fall = document.getElementById('fall');
  fall.innerHTML = Array.from({ length: 7 }, (_, i) =>
    `<span class="fp" style="left:${(i * 14.3 + 5) % 100}%;--d:${16 + (i % 3) * 5}s;--delay:${-i * 3.7}s;--sway:${(i % 2 ? 1 : -1) * (30 + i * 6)}px">${petal()}</span>`).join('');
}

/* ---------------- Name schreibt sich: Felix → Feliks ---------------- */
// Erst wird „Felix“ geschrieben (so sagen viele), dann wischt die Feder das x weg
// und schreibt die richtige Schreibweise „ks“ weiter: „Feliks“.
function tween(dur, fn, ease = (x) => x) {
  return new Promise((res) => {
    const t0 = performance.now();
    const step = (now) => { const k = Math.min(1, (now - t0) / dur); fn(ease(k)); if (k < 1) requestAnimationFrame(step); else res(); };
    requestAnimationFrame(step);
  });
}
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const inOut = (x) => x * x * (3 - 2 * x);

async function writeName() {
  const h = document.getElementById('name');
  const feliksW = h.querySelector('.w-feliks'), felixW = h.querySelector('.w-felix'), last = h.querySelector('.w-last');
  try { await document.fonts.load('100px "Great Vibes"'); } catch { /* egal */ }
  const setP = (el, px) => el.style.setProperty('--p', px + 'px');
  if (reduce.matches || SHOT) { h.classList.remove('felix'); h.classList.add('done'); return; }
  h.classList.add('felix', 'writing');
  // Breite von „Feli“ messen, um nur das „x“ wegzuwischen
  const probe = document.createElement('span'); probe.className = 'w probe'; probe.textContent = 'Feli';
  felixW.parentNode.append(probe);
  const pad = parseFloat(getComputedStyle(felixW).paddingLeft) || 0;
  const feli = probe.getBoundingClientRect().width - pad; probe.remove();
  const wFelix = felixW.getBoundingClientRect().width, wFeliks = feliksW.getBoundingClientRect().width, wLast = last.getBoundingClientRect().width;
  setP(felixW, 0); setP(feliksW, 0); setP(last, 0);
  await wait(500);
  await tween(1700, (k) => setP(felixW, k * (wFelix + 40)), inOut);
  await wait(900);
  await tween(520, (k) => setP(felixW, (wFelix + 40) - k * (wFelix + 40 - pad - feli + 4)), inOut);
  setP(feliksW, pad + feli - 4); h.classList.remove('felix');
  await tween(560, (k) => setP(feliksW, pad + feli - 4 + k * (wFeliks - pad - feli + 44)), inOut);
  await tween(1500, (k) => setP(last, k * (wLast + 40)), inOut);
  h.classList.add('done');
}

/* ---------------- Start ---------------- */
document.querySelectorAll('.lang button').forEach((b) => b.addEventListener('click', () => {
  if (b.dataset.lang === lang) return;
  lang = b.dataset.lang;
  try { localStorage.setItem('lang', lang); } catch { /* privat */ }
  const u = new URL(location.href); u.searchParams.delete('lang'); history.replaceState(null, '', u);
  render();
}));

document.getElementById('lily').innerHTML = lilySVG();
scatterPetals();
render();
document.querySelectorAll('.hero .drag').forEach(makeDraggable);
initGrass(document.getElementById('grass'), document.getElementById('grassBlur'));
requestAnimationFrame(() => document.body.classList.add('ready'));
writeName();

if (import.meta.env.DEV) { const { addSwitch } = await import('/shared/switch.js'); addSwitch('v-season'); }
