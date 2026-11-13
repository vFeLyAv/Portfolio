// Sky-Variante: Wolken werden im Browser gezeichnet (Canvas), Ebenen bewegen sich mit Maus und Scroll.
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { makeCloud, tintCloud } from './clouds.js';
import { initDeck } from './deck.js';
import { initWeather } from './weather/index.js';
import { person, about, school, practice, projects, certificates, languages, interests, contact } from '/shared/data.js';

gsap.registerPlugin(ScrollTrigger);

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
const $ = (s) => document.querySelector(s);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

/* ================= Inhalte aus data.js ================= */

// Über mich: Text links, rechts ein Porträt als Foto an der Wäscheleine
$('#aboutPanel').innerHTML = `
  <div>
    <p class="about__lead">Ich bin ${esc(person.first)} und lebe in ${esc(person.city)}.</p>
    <div class="about__text">${about.map((p) => `<p>${esc(p)}</p>`).join('')}</div>
  </div>
  <figure class="pin" id="pin">
    <svg class="pin__svg" preserveAspectRatio="none" aria-hidden="true"><path/><path/></svg>
    <div class="pin__swing" id="pinSwing">
      <svg class="peg" aria-hidden="true"><use href="#peg"/></svg>
      <div class="polaroid"><div class="polaroid__photo">
        <img src="/img/day-img_8350-person.webp" alt="Porträt von Feliks im grauen Mantel" width="959" height="1280">
      </div></div>
    </div>
  </figure>`;

const ALT = {
  '/img/bunprise-og.png': 'Vorschaubild von Bunprise: ein Hase und der Satz „Pläne und Wünsche an einem Ort“',
  '/img/depth.png': 'Tiefenkarte eines Porträtfotos: hell ist nah, dunkel ist weit weg',
  '/img/render-yellow.jpg': 'In Blender gerenderte Minecraft-Figur auf einem Skateboard vor gelbem Hintergrund',
};
const [mainProj, ...moreProj] = projects;
$('#projectsPanel').innerHTML = `
  <article class="proj proj--main">
    <div class="proj__img"><img src="${mainProj.img}" alt="${esc(ALT[mainProj.img] || '')}" width="1200" height="630" loading="lazy"></div>
    <div>
      <div class="proj__head">
        ${mainProj.icon ? `<img class="proj__icon" src="${mainProj.icon}" alt="" width="52" height="52" loading="lazy">` : ''}
        <div><h3 class="proj__title">${esc(mainProj.title)}</h3><span class="proj__when">${esc(mainProj.when)}</span></div>
      </div>
      <p>${esc(mainProj.text)}</p>
    </div>
  </article>
  <div class="proj__more">
    ${moreProj.map((p) => `
      <article class="proj proj--small">
        <div class="proj__img"><img src="${p.img}" alt="${esc(ALT[p.img] || '')}" loading="lazy"></div>
        <div>
          <h3 class="proj__title">${esc(p.title)}</h3><span class="proj__when">${esc(p.when)}</span>
          <p>${esc(p.text)}</p>
        </div>
      </article>`).join('')}
  </div>`;

// Zertifikate: erhaltene groß mit Nachweis, die anderen hängen an der Leine
const earnedCerts = certificates.filter((c) => c.status === 'erhalten');
const openCerts = certificates.filter((c) => c.status !== 'erhalten');
{  const n = earnedCerts.length;  const done = n === 1 ? 'Ein Zertifikat ist fertig' : n > 1 ? `${n} Zertifikate sind fertig` : '';  $('#certsLead').textContent = done ? `${done}, die anderen Kurse mache ich gerade.` : 'Diese Kurse mache ich gerade.';}

const cvRow = (r) => `<li class="cv__row"><span class="cv__when">${esc(r.when)}</span><span><span class="cv__what">${esc(r.what)}</span><span class="cv__detail">${esc(r.detail)}</span></span></li>`;
const cvPair = (a, b) => `<li class="cv__pair"><span>${esc(a)}</span><span>${esc(b)}</span></li>`;
$('#cvPanel').innerHTML = `
  <div class="cv__head">
    <p class="cv__who">${esc(person.name)}<span>${esc(person.city)}</span></p>
    <button class="pdf" type="button" data-pdf>Lebenslauf (PDF)</button>
  </div>
  <div>
    <div class="cv__block"><h3>Schulbildung</h3><ol>${school.map(cvRow).join('')}</ol></div>
    <div class="cv__block"><h3>Praktische Erfahrung</h3><ol>${practice.map(cvRow).join('')}</ol></div>
  </div>
  <div>
    <div class="cv__block"><h3>Zertifikate</h3><ul>${earnedCerts.map((c) => cvPair(c.title, c.date ? `${c.issuer}, ${c.date}` : c.issuer)).join('')}</ul></div>
    <div class="cv__block"><h3>Sprachen</h3><ul>${languages.map((l) => cvPair(l.lang, l.level)).join('')}</ul></div>
    <div class="cv__block"><h3>Interessen</h3><ul>${interests.map((i) => cvPair(i.what, i.detail)).join('')}</ul></div>
  </div>`;

$('#contactPanel').innerHTML = contact.email
  ? `<p>Am einfachsten per E-Mail: <a href="mailto:${esc(contact.email)}">${esc(contact.email)}</a></p>
     <button class="pdf" type="button" data-pdf>Lebenslauf (PDF)</button>`
  : `<p>Meine E-Mail-Adresse kommt hier bald dazu. Die Kontaktdaten stehen dann auch im Lebenslauf.</p>
     <button class="pdf" type="button" data-pdf>Lebenslauf (PDF)</button>`;

/* ================= Toast für das PDF ================= */
const toast = $('#toast');
let toastTimer;
document.addEventListener('click', (e) => {
  if (!e.target.closest('[data-pdf]')) return;
  toast.textContent = 'Das PDF folgt.';
  toast.classList.add('is-on');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('is-on'), 2600);
});

/* ================= Szene ================= */
const stage = $('#stage');
const hero = $('#top');
const personEl = $('#person');
const nameEl = $('#bigName');
const fogEl = $('#fog');
const fogVeil = $('#fogVeil');
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
// Abendrot und Nacht: dieselbe Wolke in drei Farben übereinander, je nach Tageszeit eingeblendet
const DUSK = [[0, '#ffe0e6'], [0.5, '#f493a8'], [1, '#b3143c']];
const NIGHT = [[0, '#c27a8e'], [1, '#4a1022']];
function spawnSets(list, host, widthBase) {
  return list.map((s, i) => {
    const day = cloudCanvas(s, widthBase);
    const dusk = tintCloud(day, DUSK), night = tintCloud(day, NIGHT, 0.8);
    day.className = dusk.className = night.className = '';
    const set = document.createElement('div');
    set.className = 'cloudset';
    set.append(day, dusk, night);
    host.append(set);
    return { ...s, el: set, dusk, night, ph: (s.seed * 1.7) % 6.28, sp2: 0.12 + (i % 4) * 0.03 };
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
  const hangCloud = makeCloud(91, { px: 300 * res * 1.6, ar: 1.75 });
  hangCloud.classList.remove('cloud');
  $('#hang').append(hangCloud);
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
    staticCloud($('#standCloud'), { seed: 33, ar: 2, w: 0.3 });
    staticCloud($('#playerCloud'), { seed: 31, ar: 2, w: 0.35 }, NIGHT);
    measureY();
    if (reduce) frame(0, 16);
  }, 60);
}
// Lage der Abschnitte für die Tageszeit
const Y = { cv: 1e9, k: 1e9 };
function measureY() {
  Y.cv = $('#lebenslauf').getBoundingClientRect().top + scrollY;
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
  drawStars();
  measureY();
}

/* ---------- Wäscheleine im Hero ---------- */
const heroLine = $('#heroLine');
const hang = $('#hang');
// Quadratische Kurve von links nach rechts, leicht durchhängend
const LINE = { y0: 30, c: 130, y1: 15 };
const lineY = (t) => (1 - t) ** 2 * LINE.y0 + 2 * t * (1 - t) * LINE.c + t ** 2 * LINE.y1;
function drawHeroLine() {
  const path = $('#heroLinePath');
  path.setAttribute('d', `M0 ${LINE.y0} Q500 ${LINE.c} 1000 ${LINE.y1}`);
  let ghost = path.nextElementSibling;
  if (!ghost) { ghost = document.createElementNS('http://www.w3.org/2000/svg', 'path'); path.after(ghost); ghost.style.opacity = '.35'; }
  ghost.setAttribute('d', `M0 ${LINE.y0 + 2} Q520 ${LINE.c + 3} 1000 ${LINE.y1 + 1.5}`);
  const t = 0.8; // Stelle der Klammer auf der Leine (0 = links, 1 = rechts)
  const lh = heroLine.clientHeight;
  const hw = hang.offsetWidth;
  hang.style.left = `${t * W - hw / 2}px`;
  hang.style.top = `${(lineY(t) / 100) * lh + 10}px`;
}

/* ---------- Zertifikate an der Wäscheleine ---------- */
// Das erhaltene Zertifikat hängt als Karte an einer Klammer (etwas außermittig, daher leicht schräg),
// die Kurse in Arbeit hängen daneben als schlichte Zettel.
const certHost = $('#certLines');
const PEG_AT = 0.36;   // Klammer bei 36 % der Kartenbreite
let certLayout = '';
const pegSVG = (cls = '') => `<svg class="peg peg--jaws ${cls}" viewBox="0 0 22 58" aria-hidden="true">
  <g class="jaw jaw--l"><rect x="2" y="0" width="8.5" height="58" rx="3.5" fill="url(#wood)"/><path d="M4 6v44" stroke="#8d5a2e" stroke-opacity=".22" stroke-width=".8"/></g>
  <g class="jaw jaw--r"><rect x="11.5" y="0" width="8.5" height="58" rx="3.5" fill="url(#wood)"/><path d="M14 6v44" stroke="#8d5a2e" stroke-opacity=".22" stroke-width=".8"/></g>
  <rect x="1" y="25" width="20" height="6" rx="2.5" fill="#b9c0d1"/><rect x="1" y="25" width="20" height="2" rx="1" fill="#eef1f8"/>
</svg>`;
function earnedHTML(c) {
  return `<li class="cert cert--earned" data-peg="${PEG_AT}">
    <div class="cert__swing badge-swing" style="transform-origin:${PEG_AT * 100}% 10px">
      ${pegSVG()}
      <button class="badge" type="button" id="badgeBtn" style="transform-origin:${PEG_AT * 100}% 0"
        aria-label="Zertifikat „${esc(c.title)}“ öffnen" aria-haspopup="dialog">
        <span class="badge__print"><img src="${esc(c.img)}" alt="" width="1584" height="1028" draggable="false"></span>
        <span class="badge__meta"><span class="cert__state cert__state--done">erhalten</span> ${esc(c.date || '')}</span>
      </button>
    </div>
  </li>`;
}
function noteHTML(c, i) {
  const tilt = [-1.4, 0.9, -0.6, 1.3][i % 4];
  return `<li class="cert" style="--tilt:${tilt}deg" data-peg="0.5">
    <div class="cert__swing">
      <svg class="peg" aria-hidden="true"><use href="#peg"/></svg>
      <article class="cert__paper">
        <span class="cert__state">in Arbeit</span>
        <h3 class="cert__title">${esc(c.title)}</h3>
        <p class="cert__issuer">${esc(c.issuer)}</p>
        <a class="cert__link" href="${esc(c.url)}" target="_blank" rel="noopener">Zum Kurs<span class="sr-only">: ${esc(c.title)}, öffnet in neuem Tab</span></a>
      </article>
    </div>
  </li>`;
}
function buildCerts() {
  // breit: alles an einer Leine; mittel: Karte allein, Zettel paarweise; schmal: alles untereinander
  const L = W >= 1000 ? 'wide' : W >= 560 ? 'mid' : 'narrow';
  if (L !== certLayout) {
    certLayout = L;
    const items = [...earnedCerts.map((c) => ({ c, earned: true })), ...openCerts.map((c) => ({ c }))];
    const rows = [];
    if (L === 'wide') rows.push(items);
    else {
      const per = L === 'mid' ? 2 : 1;
      let cur = [];
      for (const it of items) {
        if (it.earned) { if (cur.length) rows.push(cur); rows.push([it]); cur = []; continue; }
        cur.push(it);
        if (cur.length === per) { rows.push(cur); cur = []; }
      }
      if (cur.length) rows.push(cur);
    }
    let k = 0;
    certHost.innerHTML = rows.map((row) => {
      const cols = row.map((it) => (it.earned ? (row.length > 1 ? '1.75fr' : 'minmax(0, 520px)') : '1fr')).join(' ');
      return `<div class="row${row.length === 1 && row[0].earned ? ' row--solo' : ''}" style="--cols:${cols}">
        <svg class="row__svg" preserveAspectRatio="none" aria-hidden="true"><path/><path/></svg>
        <ul>${row.map((it) => (it.earned ? earnedHTML(it.c) : noteHTML(it.c, k++))).join('')}</ul>
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
  const w = panel.clientWidth, off = pin.offsetLeft, y0 = 22, sag = 22;
  const svg = pin.querySelector('svg');
  Object.assign(svg.style, { left: `${-off}px`, width: `${w}px` });
  svg.setAttribute('viewBox', `0 0 ${w} 90`);
  const [a, b] = svg.querySelectorAll('path');
  a.setAttribute('d', `M0 ${y0} Q${w / 2} ${y0 + 2 * sag} ${w} ${y0}`);
  b.setAttribute('d', `M0 ${y0 + 1.5} Q${w * 0.53} ${y0 + 2 * sag + 2.5} ${w} ${y0 + 0.8}`);
  const t = (off + swing.offsetLeft + swing.offsetWidth / 2) / w;
  const y = y0 + 4 * sag * t * (1 - t);
  swing.style.paddingTop = `${y + 14}px`;
  swing.style.transformOrigin = `50% ${y}px`;
  swing.querySelector('.peg').style.top = `${y - 10}px`;
}

/* ---------- Schwingen (Feder-Physik) ---------- */
const swings = [];
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
const hangSwing = addSwing(hang, 0, 1.3, 'hero');
addSwing($('#pinSwing'), 7, 0.8, 'about');

/* ================= Zustand & Eingaben ================= */
const S = { drift: 0, mx: 0, my: 0, tx: 0, ty: 0, p: 0, fog: 0, intro: reduce ? 0 : 1, nameIn: reduce ? 1 : 0, vel: 0, scrollY: 0 };

if (fine && !reduce) {
  addEventListener('pointermove', (e) => {
    S.tx = (e.clientX / W - 0.5) * 2;
    S.ty = (e.clientY / innerHeight - 0.5) * 2;
    // Wolke an der Leine: Zeiger in der Nähe schubst sie an
    const r = hang.getBoundingClientRect();
    const dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
    if (dx * dx + dy * dy < 200 * 200) hangSwing.v += clamp(e.movementX, -30, 30) * 0.9;
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

// Anker-Links weich ansteuern und Fokus mitnehmen
const sheet = $('#sheet');
const menuBtn = $('#menuBtn');
function closeSheet() { sheet.hidden = true; menuBtn.setAttribute('aria-expanded', 'false'); }
menuBtn.addEventListener('click', () => {
  const open = sheet.hidden;
  sheet.hidden = !open;
  menuBtn.setAttribute('aria-expanded', String(open));
  if (open) sheet.querySelector('a').focus();
});
addEventListener('keydown', (e) => { if (e.key === 'Escape' && !sheet.hidden) { closeSheet(); menuBtn.focus(); } });
document.addEventListener('click', (e) => {
  const a = e.target.closest('a[href^="#"]');
  if (!a) return;
  const id = a.getAttribute('href').slice(1);
  const target = document.getElementById(id);
  if (!target) return;
  e.preventDefault();
  closeSheet();
  const head = target.querySelector('h2') || target;
  const y = id === 'top' ? 0 : head.getBoundingClientRect().top + scrollY - 110;
  if (lenis) lenis.scrollTo(y, { duration: 1.6 });
  else scrollTo({ top: y });
  if (id !== 'top') { target.setAttribute('tabindex', '-1'); target.focus({ preventScroll: true }); }
});

ScrollTrigger.create({ trigger: hero, start: 'top top', end: 'bottom bottom', onUpdate: (s) => (S.p = s.progress) });
ScrollTrigger.create({
  trigger: hero,
  start: () => `top+=${(hero.offsetHeight - innerHeight) * 0.45} top`,
  end: () => `bottom top+=${innerHeight * 0.3}`,
  onUpdate: (s) => (S.fog = s.progress),
});
// aktiver Menüpunkt
const navLinks = [...document.querySelectorAll('#nav a')];
document.querySelectorAll('.sec').forEach((sec) => {
  ScrollTrigger.create({
    trigger: sec, start: 'top 30%', end: 'bottom 30%',
    onToggle: (s) => navLinks.forEach((a) => {
      if (a.getAttribute('href') === `#${sec.id}`) s.isActive ? a.setAttribute('aria-current', 'true') : a.removeAttribute('aria-current');
    }),
  });
});
// Physik nur rechnen, wenn die Leine sichtbar ist
let heroVisible = true;
const VIS = { hero: true, about: false, certs: false };
new IntersectionObserver(([e]) => (VIS.certs = e.isIntersecting)).observe($('#zertifikate'));
new IntersectionObserver(([e]) => (VIS.about = e.isIntersecting)).observe($('#ueber'));
new IntersectionObserver(([e]) => (heroVisible = VIS.hero = e.isIntersecting)).observe(hero);

/* ================= Bild für Bild ================= */
const tf = (el, x, y, s = 1, extra = '') => (el.style.transform = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0) scale(${s.toFixed(4)})${extra}`);

function frame(time, dtMs) {
  const dt = Math.min((dtMs || 16) / 1000, 1 / 30);
  if (fine) { S.mx += (S.tx - S.mx) * 0.05; S.my += (S.ty - S.my) * 0.05; }
  else if (!reduce) { S.mx = Math.sin(time * 0.23) * 0.35; S.my = Math.cos(time * 0.19) * 0.2 - S.p * 0.5; }
  const p = S.p;
  const sy = scrollY;
  if (!reduce) S.drift += dt * (1 + WX.wind * 4);   // Wolken ziehen bei Wind schneller

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
    tf(personEl, PT.x, PT.y, PT.s);
    personEl.style.opacity = fade.toFixed(3);
    placeAnno(1 - smooth(0.15, 0.4, p));
    tf(nameEl, S.mx * 12, S.my * 8 - p * H * 0.3 + (1 - S.nameIn) * H * 0.08, 1 + p * 0.3);
    nameEl.style.opacity = (S.nameIn * (1 - smooth(0.55, 0.85, p))).toFixed(3);
    heroLine.style.transform = `translate3d(0,${(-p * H * 0.3).toFixed(1)}px,0)`;
    heroLine.style.opacity = (1 - smooth(0.2, 0.6, p)).toFixed(3);
  }

  // Durchflug
  const f = S.fog;
  const bump = smooth(0, 0.35, f) * (1 - smooth(0.62, 1, f)); // ganz weiß in der Mitte des Durchflugs
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
  // Tageszeit: Abendrot kommt mit dem Lebenslauf, die Nacht mit dem Kontakt
  const mid = sy + innerHeight * 0.5;
  const dusk = smooth(Y.cv - innerHeight * 0.9, Y.cv + innerHeight * 0.15, mid);
  const night = smooth(Y.k - innerHeight * 0.55, Y.k + innerHeight * 0.25, mid);
  skyDusk.style.opacity = dusk.toFixed(3);
  skyNight.style.opacity = night.toFixed(3);
  for (const c of skyClouds) { c.dusk.style.opacity = dusk.toFixed(3); c.night.style.opacity = night.toFixed(3); }
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
      const gust = WX.wind;  // Wind (Wetter) bei „Über mich“: Leinen schwingen stärker
      const breeze = (Math.sin(time * 0.9 + s.i * 1.7) * 5 + Math.sin(time * 0.37 + s.i) * 3) * (1 + gust * 2.5)
        + gust * (16 + 12 * Math.sin(time * 1.3 + s.i));
      const acc = -38 * s.a - 3.2 * s.v + (wind + breeze) * s.gain;
      s.v += acc * dt;
      s.a = clamp(s.a + s.v * dt, -28, 28);
      s.el.style.transform = `rotate(${s.a.toFixed(2)}deg)`;
    }
  }
}

/* ================= Name: Feliks ↔ Felix ================= */
// K und S ziehen sich zusammen und verschwimmen, ein X quillt an der Stelle des K auf wie eine Wolke,
// die übrigen Buchstaben rücken nach. M.t = Lücke schließen (0…1), M.x = X da (0…1, federt über 1).
const nameBtn = $('#nameBtn');
const slotK = nameBtn.querySelector('.lt--k'), slotS = nameBtn.querySelector('.lt--s');
const gK = nameBtn.querySelector('.g--k'), gS = nameBtn.querySelector('.g--s'), gX = nameBtn.querySelector('.g--x');
const M = { t: 0, x: 0 };
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
let felix = false, nameTouched = false, nameTl = null;
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

/* ================= Notizen am Foto (Hero) ================= */
// Punkte auf Brille, Mund, Hand und Knie; ein Faden führt zu einer Glas-Notiz mit einer Angabe aus data.js.
// Positionen werden aus der gerenderten Bildbox berechnet (inkl. Parallax), also bei jeder Größe richtig.
const PT = { x: 0, y: 0, s: 1 };
const PB = { L: 0, T: 0, w: 1, h: 1 };
const annoEl = $('#anno'), annoSvg = $('#annoLines');
const NS = 'http://www.w3.org/2000/svg';
const ANNO = [
  { u: 0.548, v: 0.316, title: interests[2].what, detail: interests[2].detail, side: 'r', lu: 0.8, lv: 0.24 },
  { u: 0.445, v: 0.395, title: 'Sprachen', detail: languages.map((l) => `${l.lang} (${l.level})`).join(', '), side: 'r', lu: 0.8, lv: 0.42 },
  { u: 0.405, v: 0.567, title: interests[1].what, detail: interests[1].detail, side: 'l', lu: 0.16, lv: 0.47 },
  { u: 0.31, v: 0.632, title: interests[0].what, detail: interests[0].detail, side: 'l', lu: 0.12, lv: 0.7 },
];
const AN = { hover: -1, focus: -1, pin: -1, alpha: 1 };
const notes = ANNO.map((A, i) => {
  const dot = document.createElement('button');
  dot.type = 'button'; dot.className = 'dot'; dot.style.setProperty('--i', i);
  dot.setAttribute('aria-label', A.title);
  dot.setAttribute('aria-expanded', 'false');
  dot.setAttribute('aria-controls', `note${i}`);
  const note = document.createElement('div');
  note.className = 'glass note'; note.id = `note${i}`;
  note.innerHTML = `<b>${esc(A.title)}</b><span>${esc(A.detail)}</span>`;
  const path = document.createElementNS(NS, 'path');
  const end = document.createElementNS(NS, 'circle'); end.setAttribute('r', '2.6');
  annoSvg.append(path, end);
  annoEl.append(dot, note);
  dot.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') { AN.hover = i; placeAnno(); } });
  dot.addEventListener('pointerleave', () => { if (AN.hover === i) { AN.hover = -1; placeAnno(); } });
  dot.addEventListener('focus', () => { AN.focus = i; placeAnno(); });
  dot.addEventListener('blur', () => { if (AN.focus === i) { AN.focus = -1; placeAnno(); } });
  dot.addEventListener('click', (e) => { e.stopPropagation(); AN.pin = AN.pin === i ? -1 : i; placeAnno(); });
  return { A, dot, note, path, end, w: 0, h: 0 };
});
document.addEventListener('click', (e) => { if (AN.pin >= 0 && !e.target.closest('.dot')) { AN.pin = -1; placeAnno(); } });
addEventListener('keydown', (e) => { if (e.key === 'Escape' && AN.pin >= 0) { AN.pin = -1; placeAnno(); } });
function measurePerson() {
  PB.L = personEl.offsetLeft; PB.T = personEl.offsetTop; PB.w = personEl.offsetWidth; PB.h = personEl.offsetHeight;
  notes.forEach((n) => { n.w = 0; });
}
// Bildbox so, wie sie gerade auf dem Bildschirm liegt (mit Parallax und Zoom)
let PR = null, SR = null;
function toStage(u, v) {
  return [PR.left - SR.left + PR.width * u, PR.top - SR.top + PR.height * v];
}
function placeAnno(alpha = AN.alpha) {
  AN.alpha = alpha;
  annoEl.style.opacity = alpha.toFixed(3);
  annoEl.style.visibility = alpha < 0.02 ? 'hidden' : '';
  if (alpha < 0.02) return;
  const active = AN.hover >= 0 ? AN.hover : AN.focus >= 0 ? AN.focus : AN.pin;
  PR = personEl.getBoundingClientRect(); SR = stage.getBoundingClientRect();
  notes.forEach((n, i) => {
    const [ax, ay] = toStage(n.A.u, n.A.v);
    n.dot.style.transform = `translate(${ax.toFixed(1)}px,${ay.toFixed(1)}px)`;
    const on = i === active;
    if (n.note.classList.contains('is-on') !== on) {
      n.note.classList.toggle('is-on', on);
      n.dot.setAttribute('aria-expanded', String(on));
    }
    if (!on) { n.path.setAttribute('d', ''); n.end.setAttribute('r', '0'); return; }
    if (!n.w) { n.w = n.note.offsetWidth; n.h = n.note.offsetHeight; }
    const [px, py] = toStage(n.A.lu, n.A.lv);
    let lx = n.A.side === 'r' ? px : px - n.w, ly = py - n.h / 2;
    lx = clamp(lx, 12, W - n.w - 12);
    ly = clamp(ly, 80, H - n.h - 70);
    n.note.style.transform = `translate(${lx.toFixed(1)}px,${ly.toFixed(1)}px)`;
    const ex = lx + n.w / 2 > ax ? lx : lx + n.w, ey = ly + n.h / 2;
    n.path.setAttribute('d', `M${ax.toFixed(1)} ${ay.toFixed(1)} Q${((ax + ex) / 2).toFixed(1)} ${(Math.max(ay, ey) + 22).toFixed(1)} ${ex.toFixed(1)} ${ey.toFixed(1)}`);
    n.end.setAttribute('cx', ex.toFixed(1)); n.end.setAttribute('cy', ey.toFixed(1)); n.end.setAttribute('r', '2.6');
  });
}

/* ================= Zertifikat: greifen, öffnen, umdrehen ================= */
const lb = $('#lb'), lbFly = $('#lbFly'), lbTilt = $('#lbTilt'), lbCard = $('#lbCard');
const lbFlip = $('#lbFlip'), lbClose = $('#lbClose'), lbBackdrop = $('#lbBackdrop'), lbBack = $('#lbBack'), lbDialog = $('#lbDialog');
const star = earnedCerts[0];
if (star) {
  $('#lbImg').src = star.img;
  $('#lbImg').alt = `Abzeichen „${star.title}“ von ${star.issuer}, ausgestellt für ${person.name}`;
  lbBack.innerHTML = `<div class="lb__backin">
    <span class="cert__state cert__state--done">erhalten</span>
    <h2 class="lb__title" id="lbTitle">${esc(star.title)}</h2>
    <dl class="lb__facts">
      <div><dt>Aussteller</dt><dd>${esc(star.issuer)}</dd></div>
      ${star.date ? `<div><dt>Ausgestellt am</dt><dd>${esc(star.date)}</dd></div>` : ''}
      <div><dt>Für</dt><dd>${esc(person.name)}</dd></div>
    </dl>
    <div class="lb__actions">
      ${star.url ? `<a class="btn btn--ink" href="${esc(star.url)}" target="_blank" rel="noopener">${star.verify ? 'Echtheit prüfen' : 'Zum Kurs'}<span class="sr-only"> (öffnet in neuem Tab)</span></a>` : ''}
      ${star.pdf ? `<a class="btn btn--line" href="${esc(star.pdf)}" target="_blank" rel="noopener">PDF ansehen<span class="sr-only"> (öffnet in neuem Tab)</span></a>` : ''}
    </div>
  </div>`;
}
const LBX = { open: false, back: false, btn: null, swingEl: null, swing: null, busy: false };
if (reduce) lb.classList.add('lb--flat');

function initBadge(el, s) {
  const btn = el.querySelector('.badge');
  let drag = null, suppress = false;
  const angleAt = (e) => (Math.atan2(e.clientX - drag.px, e.clientY - drag.py) * 180) / Math.PI;
  btn.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'mouse' || e.button !== 0 || reduce) return; // Finger: nur antippen
    const li = el.parentElement, r = li.getBoundingClientRect();
    drag = { px: r.left + r.width * PEG_AT, py: r.top + parseFloat(getComputedStyle(li).paddingTop) + 10, x0: e.clientX, y0: e.clientY, moved: false, t: performance.now() };
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
  btn.addEventListener('click', () => { if (suppress) { suppress = false; return; } openBadge(btn, el, s); });
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
function openBadge(btn, el, s) {
  if (LBX.open || LBX.busy || !star) return;
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
  s.held = true;
  gsap.to(jaws(el), { rotation: (i) => (i ? 16 : -16), svgOrigin: '11 28', duration: 0.18, ease: 'power2.out' });
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
      s.held = false; s.v += 70;                                     // kleiner Schubs beim Wiederanklammern
      gsap.to(jaws(el), { rotation: 0, svgOrigin: '11 28', duration: 0.6, ease: 'elastic.out(1.2, 0.35)' });
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

/* ================= Start ================= */
const WX = initWeather({ reduce }).state;   // Wetter je Abschnitt (weather/*.js)
buildAll();
resizeAll();
measurePerson();
new ResizeObserver(measurePerson).observe(personEl);
addEventListener('load', () => { measurePerson(); measureY(); });
frame(0, 16);
measureName();
initDeck($('#player'));
// ohne Animationen trotzdem die Tageszeit beim Scrollen anpassen
if (reduce) { let q = 0; addEventListener('scroll', () => { cancelAnimationFrame(q); q = requestAnimationFrame(() => frame(0, 16)); }, { passive: true }); }
// einmal von selbst: kurz nach dem Lade-Moment wird aus Feliks Felix
setTimeout(() => { if (!nameTouched && !felix) setName(true); }, reduce ? 1500 : 3400);
if (!reduce) {
  gsap.ticker.add((t, d) => frame(t, d));
  gsap.to(S, { intro: 0, duration: 2.8, ease: 'power3.out', delay: 0.05 });
  gsap.to(S, { nameIn: 1, duration: 1.6, ease: 'power2.out', delay: 0.35 });
  hangSwing.v = 50;
}

let rT;
addEventListener('resize', () => {
  clearTimeout(rT);
  rT = setTimeout(() => { resizeAll(); measurePerson(); measureName(); ScrollTrigger.refresh(); if (reduce) frame(0, 16); }, 120);
});
document.fonts && document.fonts.ready.then(() => { buildCerts(); measureName(); measureY(); measurePerson(); ScrollTrigger.refresh(); if (reduce) frame(0, 16); });

import { addSwitch } from '/shared/switch.js';
addSwitch('sky');
