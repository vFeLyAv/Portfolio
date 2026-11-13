// v-face: Collage-Karikatur im Hero + ruhige, gut lesbare Abschnitte im gleichen Kritzel-Stil.
import { DATA, STR, LANGS, initialLang, saveLang } from './i18n.js';
import { initFace, loopPath } from './face.js';

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const $ = (s, r = document) => r.querySelector(s);
const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const host = (u) => { try { return new URL(u).host.replace(/^www\./, ''); } catch { return u; } };

let lang = initialLang();

// Handgezeichnete Schlinge hinter einem Wort (skaliert mit, Strich bleibt gleich dick)
const loopSvg = (seed, cls = '') => `<svg class="loop ${cls}" viewBox="0 0 100 40" preserveAspectRatio="none" aria-hidden="true">
  <path d="${loopPath(50, 20, 47, 16, { seed, turns: 1.12, start: -2.6, wobble: 0.05 })}" pathLength="1" vector-effect="non-scaling-stroke"/></svg>`;
const underline = (seed) => {
  const r = (n) => (Math.sin(seed * 12.9 + n * 78.2) * 0.5 + 0.5);
  return `<svg class="uline" viewBox="0 0 100 10" preserveAspectRatio="none" aria-hidden="true"><path d="M1 ${6 + r(1) * 2} C30 ${3 + r(2) * 3} 62 ${7 + r(3) * 2} 99 ${3 + r(4) * 3}" pathLength="1" vector-effect="non-scaling-stroke"/></svg>`;
};
const h2 = (id, text, seed) => `<h2 class="hand" id="${id}-h"><span class="hand-word">${esc(text)}${loopSvg(seed)}</span></h2>`;
const ext = (url, label, t, cls = 'link') => `<a class="${cls}" href="${esc(url)}" target="_blank" rel="noopener">${label}<span class="sr-only"> ${esc(t.newTab)}</span>${underline(label.length)}</a>`;
const dots = (level) => {
  const n = { Grundlagen: 1, gut: 2, fortgeschritten: 3 }[level];
  if (!n) return '';
  return `<span class="lvl" aria-hidden="true">${[1, 2, 3].map((i) => `<i class="${i <= n ? 'on' : ''}"></i>`).join('')}</span>`;
};

function render() {
  const d = DATA[lang], t = STR[lang];
  document.documentElement.lang = lang;
  document.title = t.title;
  $('meta[name="description"]').setAttribute('content', t.desc);
  $('.skip').textContent = t.skip;
  $('.langs').setAttribute('aria-label', t.langGroup);
  document.querySelectorAll('.langs button').forEach((b) => {
    b.setAttribute('aria-pressed', String(b.dataset.lang === lang));
    b.setAttribute('aria-label', t.langNames[b.dataset.lang]);
  });
  $('.face').setAttribute('aria-label', t.faceAlt);

  const [bun, site, mc] = d.projects;
  const earned = d.certificates.filter((c) => c.status === 'erhalten');
  const planned = d.certificates.filter((c) => c.status !== 'erhalten');

  $('#main').innerHTML = `
  <section class="sec about" aria-labelledby="about-h">
    ${h2('about', t.h.about, 4)}
    <div class="about-grid">
      <div class="about-text">${d.about.map((p) => `<p>${esc(p)}</p>`).join('')}</div>
      <figure class="lens-photo">
        <div class="lens-cut"><img src="/img/sony-dsc01805-photo.jpg" alt="${esc(t.aboutAlt)}" loading="lazy" width="1800" height="1200"></div>
        ${loopSvg(17, 'big')}
      </figure>
    </div>
    <h3 class="sub">${esc(t.factsTitle)}</h3>
    <ul class="facts">
      ${d.facts.map((f) => `<li><span class="dot" aria-hidden="true"></span><strong>${esc(f.title)}</strong><span>${esc(f.text)}</span></li>`).join('')}
    </ul>
  </section>

  <section class="sec projects" aria-labelledby="projects-h">
    ${h2('projects', t.h.projects, 7)}
    <article class="proj proj-main">
      <a class="cut tilt-l" href="${esc(bun.url)}" target="_blank" rel="noopener" tabindex="-1" aria-hidden="true"><img src="${esc(bun.img)}" alt="" loading="lazy"></a>
      <div class="proj-body">
        <p class="when">${esc(bun.when)}</p>
        <h3 class="proj-title">${esc(bun.title)}</h3>
        <p>${esc(bun.text)}</p>
        <p class="cta">${ext(bun.url, esc(t.visit(host(bun.url))), t)}</p>
        <span class="sr-only">${esc(t.projAlt[bun.img] || '')}</span>
      </div>
    </article>
    <article class="proj proj-site">
      <div class="cut tilt-r"><img src="${esc(site.img)}" alt="${esc(t.projAlt[site.img] || '')}" loading="lazy"></div>
      <div class="proj-body">
        <p class="when">${esc(site.when)}</p>
        <h3 class="proj-title">${esc(site.title)}</h3>
        <p>${esc(site.text)}</p>
      </div>
    </article>
    <article class="proj proj-small">
      <div class="cut tilt-l small"><img src="${esc(mc.img)}" alt="${esc(t.projAlt[mc.img] || '')}" loading="lazy"></div>
      <div class="proj-body">
        <p class="when">${esc(mc.when)}</p>
        <h3 class="proj-title">${esc(mc.title)}</h3>
        <p>${esc(mc.text)}</p>
      </div>
    </article>
  </section>

  <section class="sec certs" aria-labelledby="certs-h">
    ${h2('certs', t.h.certs, 11)}
    <ul class="cert-list">
      ${earned.map((c, i) => `<li class="cert">
        <div class="cut ${i % 2 ? 'tilt-r' : 'tilt-l'}"><img src="${esc(c.img)}" alt="${esc(t.certAlt(c.title))}" loading="lazy"></div>
        <h3>${esc(c.title)}</h3>
        <p class="meta">${esc(c.issuer)}</p>
        <p class="meta">${esc(t.earned)} <strong>${esc(c.date)}</strong></p>
        <p class="links">${ext(c.url, esc(t.verify), t)} ${ext(c.pdf, esc(t.pdf), t)}</p>
      </li>`).join('')}
    </ul>
    <ul class="cert-plan">
      ${planned.map((c, i) => `<li>
        <span class="tag-wip"><span>${esc(c.label || t.inProgress)}</span>${loopSvg(30 + i, 'dash')}</span>
        <div><h3>${esc(c.title)}</h3><p class="meta">${esc(c.issuer)}</p></div>
        <p class="links">${ext(c.url, esc(t.toCourse), t)}</p>
      </li>`).join('')}
    </ul>
  </section>

  <section class="sec cv" aria-labelledby="cv-h">
    ${h2('cv', t.h.cv, 13)}
    <div class="cv-grid">
      <div>
        <h3 class="sub">${esc(t.school)}</h3>
        <ol class="time">${d.school.map((x) => `<li><span class="when">${esc(x.when)}</span><strong>${esc(x.what)}</strong><span>${esc(x.detail)}</span></li>`).join('')}</ol>
      </div>
      <div>
        <h3 class="sub">${esc(t.practice)}</h3>
        <ol class="time">${d.practice.map((x) => `<li><span class="when">${esc(x.when)}</span><strong>${esc(x.what)}</strong><span>${esc(x.detail)}</span></li>`).join('')}</ol>
      </div>
    </div>
    <h3 class="sub">${esc(t.skills)}</h3>
    <div class="skills">
      ${d.skills.map((g) => `<div class="skill-group"><h4>${esc(g.group)}</h4><ul>
        ${g.items.map((it) => `<li><span class="what">${esc(it.what)}</span><span class="lv">${dots(it.level)}<span>${esc(it.label || it.level)}</span>${t.levelOf(it.level) ? `<span class="sr-only"> (${esc(t.levelOf(it.level))})</span>` : ''}</span></li>`).join('')}
      </ul></div>`).join('')}
    </div>
    <div class="cv-grid">
      <div>
        <h3 class="sub">${esc(t.langs)}</h3>
        <ul class="langs-list">${d.languages.map((l) => `<li><span class="what">${esc(l.lang)}</span><span class="lv">${esc(l.label || l.level)}</span></li>`).join('')}</ul>
      </div>
      <div>
        <h3 class="sub">${esc(t.docs)}</h3>
        <ul class="docs">${d.documents.map((x, i) => `<li><span class="what">${esc(x.title)} <span class="when-inline">${esc(x.when)}</span></span>
          <span class="tag-wip"><span>${esc(x.label || t.status[x.status] || x.status)}</span>${loopSvg(40 + i, 'dash')}</span></li>`).join('')}</ul>
      </div>
    </div>
  </section>

  <section class="sec contact" aria-labelledby="contact-h">
    ${h2('contact', t.h.contact, 19)}
    <p class="lead">${esc(t.mailLead)}</p>
    <div class="mail-row">
      <a class="mail" href="mailto:${esc(d.contact.email)}">${esc(d.contact.email)}${underline(3)}</a>
      <button type="button" class="copy" aria-label="${esc(t.copyLabel)}">${esc(t.copy)}</button>
    </div>
    <p class="insta"><span>${esc(t.insta)}</span> ${ext(`https://www.instagram.com/${d.contact.instagram}/`, `@${esc(d.contact.instagram)}`, t)}</p>
  </section>`;

  $('.foot').innerHTML = `<p>${esc(d.person.name)}, ${esc(d.person.city)}</p>`;

  $('.copy').addEventListener('click', async (e) => {
    const btn = e.currentTarget;
    try {
      await navigator.clipboard.writeText(d.contact.email);
      btn.textContent = t.copied; $('#status').textContent = t.copyDone;
      setTimeout(() => { btn.textContent = t.copy; }, 1800);
    } catch { $('#status').textContent = t.copyFail; }
  });

  observeReveal();
  drawLang();
}

// Kritzel-Schlingen und Unterstriche zeichnen sich, sobald man hinscrollt.
// Länge wird in Bildschirm-Pixeln gemessen (die Striche skalieren nicht mit), damit der Strich genau einmal läuft.
function screenLength(p) {
  const m = p.getScreenCTM(); if (!m) return 0;
  const L = p.getTotalLength(); let sum = 0, prev = null;
  for (let i = 0; i <= 48; i++) {
    const q = p.getPointAtLength((L * i) / 48), s = new DOMPoint(q.x, q.y).matrixTransform(m);
    if (prev) sum += Math.hypot(s.x - prev.x, s.y - prev.y);
    prev = s;
  }
  return Math.ceil(sum) + 4;
}
function arm(root) {
  if (reduced) return;
  root.querySelectorAll('.loop path, .uline path').forEach((p) => {
    const L = screenLength(p); if (!L) return;
    p.style.transition = 'none'; p.style.strokeDasharray = `${L} ${L}`; p.style.strokeDashoffset = String(L);
  });
}
function fire(root, delay = 0.1) {
  if (reduced) return;
  root.querySelectorAll('.loop path, .uline path').forEach((p) => {
    if (!p.style.strokeDasharray) return;
    p.getBoundingClientRect();
    p.style.transition = `stroke-dashoffset .8s cubic-bezier(.5, .1, .3, 1) ${delay}s`;
    p.style.strokeDashoffset = '0';
    p.addEventListener('transitionend', () => { p.style.strokeDasharray = ''; p.style.strokeDashoffset = ''; p.style.transition = ''; }, { once: true });
  });
}
let io;
function observeReveal() {
  io?.disconnect();
  const items = document.querySelectorAll('.hand, .lens-photo, .tag-wip, .link, .mail');
  if (reduced || !('IntersectionObserver' in window)) return;
  items.forEach((n) => arm(n));
  io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { fire(e.target); io.unobserve(e.target); } }), { rootMargin: '0px 0px -12% 0px' });
  items.forEach((n) => io.observe(n));
}
function drawLang() {
  const b = document.querySelector('.langs button[aria-pressed="true"]');
  if (b) { arm(b); fire(b, 0); }
}

document.querySelectorAll('.langs button').forEach((b, i) => b.insertAdjacentHTML('beforeend', loopSvg(50 + i)));
document.querySelector('.langs').addEventListener('click', (e) => {
  const b = e.target.closest('button[data-lang]');
  if (!b || !LANGS.includes(b.dataset.lang) || b.dataset.lang === lang) return;
  lang = b.dataset.lang; saveLang(lang);
  const u = new URL(location.href); u.searchParams.set('lang', lang); history.replaceState(null, '', u);
  render();
});

render();

initFace({ hero: $('.hero'), canvas: $('.face'), svg: $('.scribbles'), reduced })
  .catch((err) => console.warn('Collage konnte nicht geladen werden.', err));

if (import.meta.env.DEV) { const { addSwitch } = await import('/shared/switch.js'); addSwitch('v-face'); }
