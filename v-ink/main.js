// v-ink: Schweizer Plakat mit Tinte im Wasser.
// 1) Inhalte aus /shared/data*.js in drei Sprachen rendern
// 2) Das große Wort auf die Wasserlinie setzen: Start "felix", dann versinkt das "x" als Tinte und "ks" taucht auf → "feliks"
// 3) Tinten-Simulation (fluid.js) unter dem Wort: tropft von selbst, reagiert auf Maus und Finger
import { DATA, LANGS, STR, initialLang, saveLang } from './i18n.js';
import { createInk } from './fluid.js';

document.documentElement.classList.add('js');

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const params = new URLSearchParams(location.search);
const reduceMQ = matchMedia('(prefers-reduced-motion: reduce)');
const reduced = () => reduceMQ.matches || params.get('motion') === 'reduce';

let lang = initialLang();

/* ------------------------------------------------------------------ Inhalte */
const STATUS_DE = { erhalten: 'erhalten', geplant: 'in Arbeit', folgt: 'folgt' };
const label = (item, t) => item.label || (lang === 'de' ? (STATUS_DE[item.status] || item.level) : (t.status?.[item.status] || item.level || item.status));
const LEVEL_N = { Grundlagen: 1, gut: 2, fortgeschritten: 3 };
// echte Bildgrößen gegen Springen beim Laden
const IMG_SIZE = { '/img/bunprise-og.png': [1200, 630], '/img/depth.png': [1214, 1800], '/img/render-yellow.jpg': [1600, 1200] };
const ext = (t) => `<span class="sr-only"> ${esc(t.newTab)}</span>`;
const host = (u) => { try { return new URL(u).host.replace(/^www\./, ''); } catch { return u; } };

function renderContent() {
  const d = DATA[lang], t = STR[lang];
  document.documentElement.lang = lang;
  document.title = t.title;
  $('meta[name="description"]')?.setAttribute('content', t.desc);

  $$('[data-t]').forEach((el) => {
    const k = el.dataset.t;
    if (k.startsWith('spread')) el.textContent = t.spread[+k.slice(6)];
    else if (t[k]) el.textContent = t[k];
  });
  $$('[data-h]').forEach((el) => { el.textContent = t.h[el.dataset.h]; });
  $$('[data-city]').forEach((el) => { el.textContent = d.person.city; });
  $('[data-photo-alt]').alt = t.photoAlt;
  $('[data-ink-label]')?.setAttribute('aria-label', t.inkLabel);

  // Über mich
  $('[data-about]').innerHTML = d.about.map((p) => `<p>${esc(p)}</p>`).join('');
  $('[data-facts]').innerHTML = d.facts.map((f) => `<li><h4>${esc(f.title)}</h4><p>${esc(f.text)}</p></li>`).join('');

  // Projekte: Bunprise groß, "Diese Website" hoch, Minecraft klein und zuletzt
  $('[data-projects]').innerHTML = d.projects.map((p, i, all) => {
    const kind = i === 0 ? 'feature' : i === all.length - 1 ? 'small' : 'tall';
    const alt = t.projAlt[p.img] || '';
    const icon = p.icon ? `<img src="${esc(p.icon)}" alt="" width="64" height="64">` : '';
    const link = p.url ? `<a class="btn" href="${esc(p.url)}" target="_blank" rel="noopener">${esc(t.visit(host(p.url)))}${ext(t)}</a>` : '';
    return `<article class="grid proj proj--${kind}">
      <figure class="proj-media"><img src="${esc(p.img)}" alt="${esc(alt)}" ${IMG_SIZE[p.img] ? `width="${IMG_SIZE[p.img][0]}" height="${IMG_SIZE[p.img][1]}"` : ''} loading="lazy" decoding="async"></figure>
      <div class="proj-body">
        <p class="meta">${esc(p.when)}</p>
        <h3>${icon}<span>${esc(p.title)}</span></h3>
        <p class="txt">${esc(p.text)}</p>
        ${link}
      </div>
    </article>`;
  }).join('');

  // Zertifikate
  const earned = d.certificates.filter((c) => c.status === 'erhalten');
  const next = d.certificates.filter((c) => c.status !== 'erhalten');
  $('[data-certs]').innerHTML = `
    <div class="grid certs-earned">${earned.map((c) => `
      <article class="cert">
        <div class="cert-img"><img src="${esc(c.img)}" alt="${esc(t.certAlt(c.title))}" loading="lazy" decoding="async" width="1584" height="1091"></div>
        <h3>${esc(c.title)}</h3>
        <p class="issuer">${esc(c.issuer)}</p>
        <p class="date">${esc(t.earned)} <time>${esc(c.date)}</time></p>
        <div class="actions">
          ${c.verify ? `<a class="btn" href="${esc(c.url)}" target="_blank" rel="noopener">${esc(t.verify)}${ext(t)}</a>` : ''}
          ${c.pdf ? `<a class="lnk" href="${esc(c.pdf)}" target="_blank" rel="noopener">${esc(t.pdf)}${ext(t)}</a>` : ''}
        </div>
      </article>`).join('')}
    </div>
    ${next.length ? `<div class="grid certs-next">
      <h3 class="minor">${esc(t.inProgress)}</h3>
      <ul class="next-list">${next.map((c) => `
        <li><strong>${esc(c.title)}</strong><span>${esc(c.issuer)}</span><span class="tag">${esc(label(c, t))}</span>
          <a class="lnk" href="${esc(c.url)}" target="_blank" rel="noopener">${esc(t.toCourse)}<span class="sr-only">: ${esc(c.title)}</span>${ext(t)}</a></li>`).join('')}
      </ul></div>` : ''}`;

  // Lebenslauf (neueste Einträge zuerst, so sind sie schon in data.js sortiert)
  const rows = (list) => `<ul class="rows">${list.map((r) => `
    <li><span class="when">${esc(r.when)}</span><div><p class="what">${esc(r.what)}</p>${r.detail ? `<p class="detail">${esc(r.detail)}</p>` : ''}</div></li>`).join('')}</ul>`;
  const block = (title, body) => `<div class="grid cv-block"><h3 class="minor">${esc(title)}</h3><div class="cv-body">${body}</div></div>`;
  const skills = `<div class="skills">${d.skills.map((g) => `
    <div><h4>${esc(g.group)}</h4><ul>${g.items.map((s) => {
      const n = LEVEL_N[s.level];
      const meter = n ? `<span class="meter" aria-hidden="true">${[1, 2, 3].map((k) => `<i class="${k <= n ? 'on' : ''}"></i>`).join('')}</span><span class="sr-only">(${esc(t.levelOf(s.level))})</span>` : '';
      return `<li><span>${esc(s.what)}</span><span class="lvl">${esc(label(s, t))}${meter}</span></li>`;
    }).join('')}</ul></div>`).join('')}</div>`;
  const langs = `<ul class="pairs">${d.languages.map((l) => `<li><strong>${esc(l.lang)}</strong><span>${esc(label(l, t))}</span></li>`).join('')}</ul>`;
  const interests = `<ul class="pairs pairs--wide">${d.interests.map((x) => `<li><strong>${esc(x.what)}</strong><span>${esc(x.detail)}</span></li>`).join('')}</ul>`;
  const docs = `<ul class="rows">${d.documents.map((x) => `
    <li><span class="when">${esc(x.when)}</span><div><p class="what">${esc(x.title)}</p><p class="detail"><span class="tag">${esc(label(x, t))}</span></p></div></li>`).join('')}</ul>`;
  $('[data-cv]').innerHTML = [
    block(t.school, rows(d.school)),
    block(t.practice, rows(d.practice)),
    block(t.skills, skills),
    block(t.langs, langs),
    block(t.interests, interests),
    block(t.docs, docs),
  ].join('');

  // Kontakt
  const c = d.contact;
  $('[data-contact]').innerHTML = `<div class="contact-body">
    <p class="lead">${esc(t.mailLead)}</p>
    <a class="mail" href="mailto:${esc(c.email)}">${esc(c.email)}</a>
    <div class="actions">
      <button class="btn btn-line" type="button" data-copy="${esc(c.email)}" aria-label="${esc(t.copyLabel)}">${esc(t.copy)}</button>
      <a class="lnk insta" href="https://www.instagram.com/${esc(c.instagram)}/" target="_blank" rel="noopener">${esc(t.insta)} @${esc(c.instagram)}${ext(t)}</a>
    </div></div>`;

  // Sprachknöpfe
  $$('[data-lang-group]').forEach((g) => {
    g.setAttribute('aria-label', t.langGroup);
    if (!g.children.length) {
      g.innerHTML = LANGS.map((l) => `<button type="button" data-lang="${l}" lang="${l}">${l}<span class="sr-only"> ${esc({ de: 'Deutsch', en: 'English', ru: 'Русский' }[l])}</span></button>`).join('');
    }
    $$('button', g).forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lang === lang)));
  });
}

document.addEventListener('click', async (e) => {
  const lb = e.target.closest('[data-lang]');
  if (lb) {
    const l = lb.dataset.lang;
    if (l === lang) return;
    lang = l; saveLang(l);
    try { const u = new URL(location.href); if (u.searchParams.has('lang')) { u.searchParams.set('lang', l); history.replaceState(null, '', u); } } catch { /* egal */ }
    renderContent();
    return;
  }
  const cb = e.target.closest('[data-copy]');
  if (cb) {
    const t = STR[lang], live = $('[data-live]');
    try {
      await navigator.clipboard.writeText(cb.dataset.copy);
      cb.textContent = t.copied; live.textContent = t.copyDone;
      setTimeout(() => { cb.textContent = STR[lang].copy; }, 2200);
    } catch {
      live.textContent = t.copyFail;
      const a = $('.mail'); const r = document.createRange(); r.selectNodeContents(a);
      const s = getSelection(); s.removeAllRanges(); s.addRange(r);
    }
  }
});

renderContent();

/* ------------------------------------------------------------------ Hero: Wort auf der Wasserlinie */
const hero = $('.hero');
const water = $('.water');
const canvas = $('.ink');
const wordIn = $('.word-in');
const chars = $$('.ch', wordIn);
const chK = $('.ch-k'), chS = $('.ch-s'), chX = $('.ch-x');
const FONT = '"Inter Tight"';
const geo = { W: 0, H: 0, fs: 0, waterY: 0, segs: [] };

const glyphCanvas = document.createElement('canvas');
const gctx = glyphCanvas.getContext('2d', { willReadFrequently: true });

function layoutHero() {
  const W = hero.clientWidth, H = hero.clientHeight;
  const m = Math.min(84, Math.max(16, W * 0.042));
  // Wortbreite bei 100px messen, dann auf die Breite skalieren (ohne das absolut gesetzte "x")
  hero.style.setProperty('--fs', '100px');
  const w100 = chars.filter((c) => c !== chX).reduce((s, c) => s + c.getBoundingClientRect().width, 0);
  gctx.font = `800 100px ${FONT}`;
  const fm = gctx.measureText('feliks');
  const asc = (fm.fontBoundingBoxAscent || 96.9) / 100, desc = (fm.fontBoundingBoxDescent || 24.2) / 100;
  const fAsc = (gctx.measureText('f').actualBoundingBoxAscent || 74) / 100;
  const baseFromTop = (1 - (asc + desc)) / 2 + asc;          // Grundlinie in der Zeile (line-height 1)
  const bshift = 1 - baseFromTop + 0.012;                      // Grundlinie knapp unter die Wasserlinie
  const portrait = H > W * 1.05;
  const topPad = portrait ? Math.max(70, H * 0.1) : Math.max(56, H * 0.075);
  const fsFit = 100 * (W - 2 * m) / w100;
  const fsMaxH = ((portrait ? 0.42 : 0.53) * H - topPad) / fAsc;
  const fs = Math.max(48, Math.min(fsFit, fsMaxH));
  const waterY = Math.round(topPad + fAsc * fs);
  hero.style.setProperty('--fs', `${fs}px`);
  hero.style.setProperty('--bshift', `${bshift}em`);
  hero.style.setProperty('--water-y', `${waterY}px`);
  chX.style.left = `${chK.offsetLeft}px`;
  Object.assign(geo, { W, H, fs, waterY });
  geo.segs = emitterSegments();
  hero.classList.add('ready');
}

// Wo berühren die Buchstaben die Wasserlinie? -> dort tropft Tinte heraus
function emitterSegments() {
  const live = hero.classList.contains('felix') ? [0, 1, 2, 3, 6] : [0, 1, 2, 3, 4, 5];   // .felix = Startzustand mit x
  const { W, fs, waterY } = geo;
  glyphCanvas.width = Math.max(1, Math.ceil(W)); glyphCanvas.height = 24;
  gctx.clearRect(0, 0, glyphCanvas.width, 24);
  gctx.font = `800 ${fs}px ${FONT}`; gctx.textBaseline = 'alphabetic'; gctx.fillStyle = '#000';
  const base = 20, probe = base - Math.max(2, fs * 0.035);
  const hr = hero.getBoundingClientRect();
  for (const i of live) {
    const r = chars[i].getBoundingClientRect();
    gctx.fillText(chars[i].textContent, r.left - hr.left, base);
  }
  const row = gctx.getImageData(0, Math.round(probe), glyphCanvas.width, 1).data;
  const segs = []; let start = -1;
  for (let x = 0; x <= glyphCanvas.width; x++) {
    const on = x < glyphCanvas.width && row[x * 4 + 3] > 128;
    if (on && start < 0) start = x;
    if (!on && start >= 0) { if (x - start > 3) segs.push([start, x]); start = -1; }
  }
  void waterY;
  return segs;
}

/* ------------------------------------------------------------------ Tinte */
let ink = null;
if (params.get('ink') !== 'still') {
  try { ink = createInk(canvas, { dprCap: 1.5 }); } catch (e) { console.warn('Tinte nicht verfügbar', e); ink = null; }
}

const maskCanvas = document.createElement('canvas');
const mctx = maskCanvas.getContext('2d');
const rand = (a, b) => a + Math.random() * (b - a);

const emit = { blooms: [], nextBloom: 0.6, t: 0 };
function emitStep(dt) {
  const segs = geo.segs; if (!segs.length) return;
  emit.t += dt;
  const k = Math.min(1.2, Math.max(0.25, geo.fs / 575));   // kleiner Bildschirm = kleineres Wort = weniger Tinte
  // stetiges Sickern an allen Kontaktstellen (pulsiert langsam, jede Stelle eigener Takt)
  segs.forEach(([a, b], i) => {
    const w = b - a, pulse = 0.55 + 0.45 * Math.sin(emit.t * (0.7 + i * 0.13) + i * 1.7);
    ink.splat(rand(a, b), rand(1, 3), rand(-6, 6), rand(25, 55), dt * 1.5 * pulse * Math.min(2, Math.max(0.6, w / (50 * k))), Math.max(3 * k, Math.min(w * 0.3, 14 * k)));
  });
  // ab und zu ein großer Schwall, der zu einer Wolke aufblüht
  emit.nextBloom -= dt;
  if (emit.nextBloom <= 0) {
    const s = segs[Math.floor(Math.random() * segs.length)];
    emit.blooms.push({ a: s[0], b: s[1], life: rand(0.7, 1.3), age: 0, drift: rand(-25, 25) });
    emit.nextBloom = rand(2.6, 5.2);
  }
  emit.blooms = emit.blooms.filter((bl) => {
    bl.age += dt;
    const w = bl.b - bl.a, p = Math.sin(Math.PI * Math.min(1, bl.age / bl.life));
    ink.splat(rand(bl.a, bl.b), rand(2, 8), (bl.drift + rand(-20, 20)) * k, (90 + 80 * p) * Math.sqrt(k), 1.0 * p + 0.05, Math.max(5 * k, Math.min(w * 0.45, 26 * k)));
    return bl.age < bl.life;
  });
}

// Versinkende Buchstaben als Maske in die Tinte zeichnen
function sinkMask(letters, dyPx) {
  const [dw, dh] = ink.dyeSize;
  if (maskCanvas.width !== dw || maskCanvas.height !== dh) { maskCanvas.width = dw; maskCanvas.height = dh; }
  const s = dw / geo.W;
  mctx.clearRect(0, 0, dw, dh);
  mctx.font = `800 ${geo.fs * s}px ${FONT}`; mctx.textBaseline = 'alphabetic'; mctx.fillStyle = '#000';
  const hr = hero.getBoundingClientRect();
  for (const el of letters) {
    const r = el.getBoundingClientRect();
    // Grundlinie liegt (bshift) knapp unter der Wasserlinie; dy ist die Absenkung
    mctx.fillText(el.textContent, (r.left - hr.left) * s, (dyPx + geo.fs * 0.012) * s);
  }
  ink.injectMask(maskCanvas, 0.011, 45);
}

const ease = { in: (p) => p * p * p, out: (p) => 1 - (1 - p) ** 3 };
const seq = { t: 0, T1: 1.7, sink: 1.9, gap: 0.25, rise: 1.4, done: false };

// Start „felix“ (so sagen viele), dann die alte Bewegung mit getauschten Rollen:
// das x versinkt als Tinte, danach tauchen k und s auf → „feliks“
function sequenceStep(dt) {
  if (seq.done) return;
  seq.t += dt;
  const { T1, sink, gap, rise } = seq;
  const ps = Math.min(1, Math.max(0, (seq.t - T1) / sink));
  const pr = Math.min(1, Math.max(0, (seq.t - T1 - sink - gap) / rise));
  if (ps > 0) {
    const dy = ease.in(ps) * 1.1 * geo.fs;
    chX.style.transform = `translateY(${dy}px) rotate(${ps * -4}deg)`;
    if (ink && ps < 1) sinkMask([chX], dy);
    if (ps > 0 && geo.segs.length && !seq.cut) { seq.cut = true; geo.segs = segsWithout([6]); }
  }
  if (pr > 0) {
    const up = 1 - ease.out(pr);
    chK.style.transform = `translateY(${up * 1.1}em)`;
    chS.style.transform = `translateY(${up * 1.14}em)`;
  }
  if (pr >= 1) {
    seq.done = true;
    hero.classList.remove('felix');
    [chK, chS, chX].forEach((c) => { c.style.transform = ''; });
    geo.segs = emitterSegments();
  }
}
function segsWithout(skip) {
  // Kontaktstellen ohne die versinkenden Buchstaben
  const hr = hero.getBoundingClientRect();
  const bad = skip.map((i) => { const r = chars[i].getBoundingClientRect(); return [r.left - hr.left - 2, r.right - hr.left + 2]; });
  return geo.segs.filter(([a, b]) => !bad.some(([x0, x1]) => a >= x0 && b <= x1));
}

/* Standbild ohne WebGL: Fahnen unter den Buchstaben */
function drawStill() {
  const g = $('[data-still]'); const svg = $('.ink-still');
  const w = geo.W, h = Math.max(1, geo.H - geo.waterY);
  svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
  g.innerHTML = geo.segs.map(([a, b], i) => {
    const cx = (a + b) / 2, sw = Math.max(18, (b - a) * 1.4), len = h * (0.45 + ((i * 37) % 40) / 100);
    return `<path d="M${cx - sw / 2} 0 C ${cx - sw} ${len * .3}, ${cx + sw * 1.5} ${len * .55}, ${cx - sw * .2} ${len} L ${cx + sw * .9} ${len} C ${cx + sw * 2} ${len * .55}, ${cx} ${len * .3}, ${cx + sw / 2} 0 Z"/>`;
  }).join('');
}

/* ------------------------------------------------------------------ Schleife */
let running = false, visible = true, last = 0, raf = 0, booted = false;
const FIXED = 1 / 60;
// ?tick=timeout nur zum Testen: Headless-Browser liefern kaum Animation-Frames
const useTimer = params.get('tick') === 'timeout';
const nextFrame = useTimer ? (fn) => setTimeout(() => fn(performance.now()), 16) : (fn) => requestAnimationFrame(fn);
const cancelFrame = useTimer ? clearTimeout : cancelAnimationFrame;

function frame(now) {
  raf = 0;
  if (!running) return;
  const dt = Math.min(1 / 30, (now - (last || now)) / 1000) || FIXED;
  last = now;
  sequenceStep(dt);
  emitStep(dt);
  ink.step(dt);
  ink.render();
  raf = nextFrame(frame);
}
function start() {
  if (!booted || !ink || reduced() || running || !visible || document.hidden) return;
  running = true; last = 0; raf = nextFrame(frame);
}
function stop() { running = false; if (raf) cancelFrame(raf); raf = 0; }

function prewarm(steps) {
  for (let i = 0; i < steps; i++) { emitStep(FIXED); ink.step(FIXED); }
  ink.render();
}

/* Maus und Finger: umrühren, klicken = Tropfen */
let lastP = null;
function local(e) { const r = canvas.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; }
canvas.addEventListener('pointermove', (e) => {
  if (!running) return;
  const [x, y] = local(e);
  if (lastP) {
    const dx = x - lastP[0], dy = y - lastP[1];
    const sp = Math.hypot(dx, dy);
    if (sp > 0.5) ink.splat(x, y, dx * 7, dy * 7, Math.min(0.06, sp * 0.002), 16);
  }
  lastP = [x, y];
});
canvas.addEventListener('pointerleave', () => { lastP = null; });
canvas.addEventListener('pointerdown', (e) => {
  if (!running) return;
  const [x, y] = local(e);
  ink.splat(x, y, rand(-20, 20), 160, 1.6, 11);
  lastP = [x, y];
});

/* ------------------------------------------------------------------ Start */
async function boot() {
  try {
    await Promise.race([document.fonts.load(`800 100px ${FONT}`), new Promise((r) => setTimeout(r, 2500))]);
  } catch { /* Schrift fehlt: Ersatzschrift */ }
  // Start auf „felix“ – nur mit Tinte und ohne „weniger Bewegung“; sonst steht gleich „feliks“ da
  if (!reduced() && ink) hero.classList.add('felix');
  layoutHero();

  if (!ink) { hero.classList.add('no-gl'); drawStill(); return; }
  ink.resize();
  if (reduced()) { seq.done = true; booted = true; prewarm(320); return; }   // Standbild, keine Bewegung
  prewarm(140);
  // Nur zum Testen (Screenshots): ?freeze=3.2 spult Wort-Animation und Tinte bis Sekunde 3.2 vor und hält an
  if (params.has('freeze')) {
    const T = +params.get('freeze') || 0;
    for (let t = 0; t < T; t += FIXED) { sequenceStep(FIXED); emitStep(FIXED); ink.step(FIXED); }
    ink.render();
    return;
  }
  booted = true;
  start();
}
boot();

new IntersectionObserver(([en]) => { visible = en.isIntersecting; visible ? start() : stop(); }, { threshold: 0 }).observe(hero);
document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
reduceMQ.addEventListener?.('change', () => { if (reduced()) { stop(); hero.classList.remove('felix'); seq.done = true; [chK, chS, chX].forEach((c) => { c.style.transform = ''; }); if (geo.W) geo.segs = emitterSegments(); } else start(); });

let rzT = 0, lastW = innerWidth;
addEventListener('resize', () => {
  clearTimeout(rzT);
  rzT = setTimeout(() => {
    // auf dem Handy ändert die Adressleiste nur die Höhe: dann nichts neu aufbauen
    if (innerWidth === lastW && Math.abs(hero.clientHeight - geo.H) < 80) return;
    lastW = innerWidth;
    layoutHero();
    if (!ink) { drawStill(); return; }
    if (ink.resize()) prewarm(reduced() ? 320 : 90);
  }, 160);
});

if (import.meta.env.DEV) { const { addSwitch } = await import('/shared/switch.js'); addSwitch('v-ink'); }
