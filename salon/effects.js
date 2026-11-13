// Lebendige Details im Salon (Felix' Wünsche 10.11.2026, Ideen aus X-Ray, Meow und Bloom):
//  1) Spotlight: folgt dem Mauszeiger; ruht die Maus ~3,5 s (oder Handy), wandert es langsam von selbst über die Wand.
//  2) Goldstaub: feine Teilchen schweben im Raum und leuchten dort, wo das Spotlight hinfällt.
//     Licht und Staub teilen sich EIN kleines Canvas (halbe Auflösung, weich hochskaliert) – billig pro Bild.
//  3) Noten: läuft das Grammophon, steigen goldene ♪ aus dem Trichter.
//  4) Buchstaben: Name und Saal-Überschriften hüpfen federnd und glimmen golden, wenn man darüberfährt.
//  5) Goldornament: unter jeder Saal-Überschrift zeichnet sich beim Hinscrollen ein barockes Ornament aus Gold
//     (Ranken, Voluten, Akanthusblätter, Rosette) – wie die Schnitzerei an den Rahmen. Eine CSS-Variable --b
//     pro Ornament (weich nachgeführt), nur stroke-dashoffset/transform/opacity.
//  6) Bilder vorab entpacken: Fotos weiter unten werden ~1,5 Bildschirme vorher im Hintergrund dekodiert.
// Alles respektiert „Bewegung reduzieren“: dann kein Wandern, kein Staub, Ornamente sofort fertig.

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
const lite = document.documentElement.classList.contains('lite');   // Leicht-Modus (iPad/iPhone/Touch), gesetzt in index.html
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));

/* ------------------------------------------------------------ 1) Spotlight + 2) Goldstaub */
// sy/st: Versatz durch Scrollen (nur Touch): das Licht wird beim Scrollen mitgezogen und schwingt danach weich zurück
const L = { mx: innerWidth * 0.5, my: innerHeight * 0.36, tx: innerWidth * 0.5, ty: innerHeight * 0.36, last: -1e9, forced: false, painted: -1e9, sy: 0, st: 0, scrollY: 0, scrolling: 0, px: -1e4, py: -1e4 };
let cvs = null, ctx = null, motes = [], sprite = null, DS = 0.5, dirty = true;
// Lichtkreis als EINE weiche Kurve: warmes Licht innen, Abdunkeln außen, 17 Stopps aus glatten Funktionen.
// Vorher 4 Stopps = gerade Stücke mit Knicken → man sah „Mitte, Lücke, Ring“ (Felix 13.11.).
// Warm über Dunkel gelegt und pro Stopp zu einer Farbe verrechnet (wie zwei Schichten übereinander, aber ein Verlauf).
const smooth = (a, b, x) => { const s = clamp((x - a) / (b - a)); return s * s * (3 - 2 * s); };
const STOPS = Array.from({ length: 17 }, (_, i) => {
  const t = i / 16, w = 0.14 * (1 - smooth(0, 0.6, t)) ** 1.4, d = 0.54 * smooth(0.1, 1, t);
  const A = w + d * (1 - w);
  if (A < 0.001) return [t, 'rgba(0,0,0,0)'];
  const mix = (cw, cd) => Math.round((w * cw + d * (1 - w) * cd) / A);
  return [t, `rgba(${mix(255, 10)},${mix(200, 3)},${mix(135, 1)},${A.toFixed(3)})`];
});
let RADIUS = 0.34;   // Anteil der größeren Bildschirmseite; mit Maus kleiner (initLight)

function makeSprite() {
  const c = document.createElement('canvas'); c.width = c.height = 32;
  const x = c.getContext('2d'), g = x.createRadialGradient(16, 16, 0, 16, 16, 16);
  g.addColorStop(0, 'rgba(255,240,200,1)'); g.addColorStop(0.35, 'rgba(255,214,150,.55)'); g.addColorStop(1, 'rgba(255,200,120,0)');
  x.fillStyle = g; x.fillRect(0, 0, 32, 32);
  return c;
}
function sizeCanvas() {
  const w = Math.max(1, Math.round(innerWidth * DS)), h = Math.max(1, Math.round(innerHeight * DS));
  if (w === cvs.width && h === cvs.height) return;
  // Neue Größe leert das Canvas. Sofort neu malen: Auf dem Handy ändert sich die Höhe genau beim Scrollen
  // (Adressleiste verschwindet) – sonst fehlten Licht und Abdunkeln, bis man aufhört zu scrollen.
  cvs.width = w; cvs.height = h;
  paint(performance.now());
}
function seedDust() {
  const n = finePointer ? 70 : 34, r = (a, b) => a + Math.random() * (b - a);
  motes = Array.from({ length: n }, () => ({ x: Math.random(), y: Math.random(), r: r(0.6, 2.4), vx: r(-0.004, 0.004), vy: r(-0.008, -0.002), ph: r(0, 6.28), tw: r(0.4, 1.2) }));
}
function paint(now) {
  const W = innerWidth, H = innerHeight, cw = cvs.width, ch = cvs.height;
  const ly = L.my + L.sy;   // sichtbare Höhe des Lichts = Bahn + Scroll-Versatz
  // Lichtkreis: Radius RADIUS × größere Seite (Touch 34 %, Maus 27 %), außen dunkel
  const g = ctx.createRadialGradient(L.mx * DS, ly * DS, 0, L.mx * DS, ly * DS, Math.max(W, H) * RADIUS * DS);
  for (const [o, c] of STOPS) g.addColorStop(o, c);
  ctx.globalAlpha = 1; ctx.clearRect(0, 0, cw, ch); ctx.fillStyle = g; ctx.fillRect(0, 0, cw, ch);
  if (reduced) return;
  // Staub: bewegt sich langsam, leuchtet nur im Lichtkegel
  const R = Math.max(W, H) * RADIUS * 0.88, t = now / 1000;
  // „Dunst-Pusten“ (13.11.): Staub in der Nähe des Mauszeigers wird weggeschoben und treibt dann weich aus
  const blowR = 130, bx = L.px, by = L.py, blow = finePointer && now - L.last < 1200;
  for (const m of motes) {
    if (blow) {
      const dx = m.x * W - bx, dy = m.y * H - by, d = Math.hypot(dx, dy);
      if (d < blowR && d > 0.1) { const f = (1 - d / blowR) ** 2 * 0.0016; m.fx = (m.fx || 0) + (dx / d) * f; m.fy = (m.fy || 0) + (dy / d) * f; }
    }
    if (m.fx || m.fy) { m.x += m.fx; m.y += m.fy; m.fx *= 0.93; m.fy *= 0.93; if (Math.abs(m.fx) + Math.abs(m.fy) < 1e-6) m.fx = m.fy = 0; }
    m.x += m.vx * 0.016 + Math.sin(t * 0.3 + m.ph) * 0.00012; m.y += m.vy * 0.016;
    if (m.y < -0.02) { m.y = 1.02; m.x = Math.random(); }
    if (m.x < -0.02) m.x = 1.02; else if (m.x > 1.02) m.x = -0.02;
    const px = m.x * W, py = m.y * H, d2 = ((px - L.mx) ** 2 + (py - ly) ** 2) / (R * R);
    const a = (0.06 + 0.9 * Math.exp(-d2 * 1.6)) * (0.55 + 0.45 * Math.sin(t * m.tw + m.ph));
    if (a < 0.03) continue;
    const s = m.r * 6 * DS;
    ctx.globalAlpha = a; ctx.drawImage(sprite, px * DS - s / 2, py * DS - s / 2, s, s);
  }
  ctx.globalAlpha = 1;
}
function lightTick(now) {
  requestAnimationFrame(lightTick);
  if (document.hidden) return;
  // Touch (iPad/Handy): höchstens ~30×/s, beim Scrollen ~24×/s – das Licht lebt weiter (vorher blieb es beim Scrollen
  // stehen, das sah komisch aus), der Browser behält trotzdem genug Zeit fürs Zeichnen der Seite.
  if (lite) { if (now - L.painted < (now < L.scrolling ? 41 : 33)) return; L.painted = now; }
  // Scroll-Versatz: Ziel klingt weich ab (~0,5 s), das Licht folgt dem Ziel mit etwas Trägheit
  L.st *= 0.9; L.sy += (L.st - L.sy) * 0.18;
  const idle = !L.forced && (!finePointer || now - L.last > 3500) && !reduced;
  if (idle) {   // langsame Bahn über die Wand (wie der Scanner in X-Ray, wenn man nichts tut)
    const t = now / 1000, W = innerWidth, H = innerHeight;
    L.tx = W * (0.5 + 0.3 * Math.sin(t * 0.21) + 0.07 * Math.sin(t * 0.67 + 1.3));
    L.ty = H * (0.4 + 0.17 * Math.sin(t * 0.29 + 0.8) + 0.05 * Math.sin(t * 0.83));
  }
  const k = reduced ? 1 : idle ? 0.025 : 0.14;
  const dx = L.tx - L.mx, dy = L.ty - L.my;
  L.mx += dx * k; L.my += dy * k;
  if (!reduced || dirty || Math.abs(dx) + Math.abs(dy) + Math.abs(L.st - L.sy) > 0.3) { paint(now); dirty = false; }
}
export function initLight() {
  const host = $('.lighting');
  host.insertAdjacentHTML('afterbegin', '<canvas class="glow"></canvas>');
  cvs = $('.glow', host); ctx = cvs.getContext('2d', { alpha: true });
  DS = finePointer && !lite ? 0.5 : 0.4;
  if (finePointer) RADIUS = 0.27;   // Computer: kleinerer Lichtkreis (Felix 13.11.: „zu große Fläche“)
  if (!reduced) { sprite = makeSprite(); seedDust(); }   // vor dem ersten Malen
  sizeCanvas(); addEventListener('resize', sizeCanvas);
  // Touch: Scrollen zieht das Licht mit (in Scrollrichtung, höchstens ~28 % der Höhe), Staub treibt leicht mit der Wand
  L.scrollY = scrollY;
  addEventListener('scroll', () => {
    const dy = scrollY - L.scrollY; L.scrollY = scrollY;
    if (Math.abs(dy) > innerHeight) return;   // Sprung (Anker-Link, Sprachwechsel): nicht mitreißen
    L.scrolling = performance.now() + 200;
    if (!finePointer && !L.forced && !reduced) { const lim = innerHeight * 0.28; L.st = clamp(L.st + dy * 0.45, -lim, lim); }
    if (!reduced) for (const m of motes) { m.y -= (dy / innerHeight) * 0.35; if (m.y < -0.02) m.y += 1.04; else if (m.y > 1.02) m.y -= 1.04; }
  }, { passive: true });
  // px/py = echter Mauszeiger (fürs Staub-Pusten), tx/ty = Ziel des Lichts (kann beim Herantreten festgehalten sein)
  if (finePointer) addEventListener('pointermove', (e) => { L.px = e.clientX; L.py = e.clientY; if (!L.forced) { L.tx = e.clientX; L.ty = e.clientY; } L.last = performance.now(); }, { passive: true });
  requestAnimationFrame(lightTick);
  return {
    // beim Herantreten: Licht fest auf das Bild richten (kein Wandern, keine Maus)
    aim(x, y) { L.forced = true; L.tx = x; L.ty = y; if (reduced) { L.mx = x; L.my = y; dirty = true; } },
    release() { L.forced = false; L.last = performance.now(); },
  };
}

/* ------------------------------------------------------------ 3) Noten aus dem Trichter */
export function initNotes(spinEl) {
  if (reduced) return { set() {} };
  let timer = 0, seen = false;
  new IntersectionObserver(([e]) => { seen = e.isIntersecting; }).observe(spinEl);
  const spawn = () => {
    if (!seen || document.hidden) return;
    const deck = $('.deck', spinEl), r = deck.getBoundingClientRect(), s = spinEl.getBoundingClientRect();
    const n = document.createElement('span');
    n.className = 'note'; n.textContent = Math.random() < 0.6 ? '♪' : '♫'; n.setAttribute('aria-hidden', 'true');
    n.style.left = `${r.left - s.left + r.width * (0.3 + Math.random() * 0.25)}px`;
    n.style.top = `${r.top - s.top + r.height * 0.12}px`;
    n.style.fontSize = `${16 + Math.random() * 14}px`;
    spinEl.append(n);
    const dx = (Math.random() - 0.6) * 90, rot = (Math.random() - 0.5) * 50;
    n.animate([
      { transform: 'translate(0,0) scale(.6)', opacity: 0 },
      { transform: `translate(${dx * 0.3}px,-40px) scale(1) rotate(${rot * 0.4}deg)`, opacity: 0.95, offset: 0.25 },
      { transform: `translate(${dx}px,-150px) scale(.9) rotate(${rot}deg)`, opacity: 0 },
    ], { duration: 2600 + Math.random() * 900, easing: 'cubic-bezier(.2,.6,.3,1)' }).onfinish = () => n.remove();
  };
  return { set(on) { clearInterval(timer); if (on) { spawn(); timer = setInterval(spawn, 850); } } };
}

/* ------------------------------------------------------------ 4) Buchstaben */
// Text eines Elements in einzelne Buchstaben zerlegen. withSr: Text für Vorleseprogramme behalten.
export function lettersify(el, withSr = true) {
  const text = el.textContent;
  const spans = [...text].map((c) => (c === ' ' ? ' ' : `<span class="lt">${c}</span>`)).join('');
  el.innerHTML = withSr ? `<span class="sr-only">${text}</span><span aria-hidden="true">${spans}</span>` : spans;
}
function jelly(el) {
  if (reduced || el.getAnimations().some((a) => a.id === 'jelly')) return;
  const a = el.animate([
    { transform: 'none' },
    { transform: 'translateY(-.14em) rotate(-7deg) scale(1.1)', offset: 0.3 },
    { transform: 'translateY(.03em) rotate(4deg) scale(.97)', offset: 0.6 },
    { transform: 'none' },
  ], { duration: 700, easing: 'cubic-bezier(.2,.8,.2,1)' });
  a.id = 'jelly';
  el.classList.add('is-lit'); setTimeout(() => el.classList.remove('is-lit'), 520);
}
export function initLetters() {
  document.addEventListener('pointerover', (e) => { const l = e.target.closest?.('.lt'); if (l) jelly(l); }, { passive: true });
}

/* ------------------------------------------------------------ 5) Goldornament unter den Saal-Überschriften */
// Rechte Hälfte (Mitte bei x = 0), die linke ist gespiegelt. d = ab welchem --b die Linie startet, w = wie lange sie braucht.
const LINES = [
  { d: 0, w: 0.45, p: 'M8 0 C 40 0 62 -14 92 -10 C 120 -6 126 14 106 18 C 92 21 86 8 96 4' },              // Hauptranke mit Volute
  { d: 0.25, w: 0.45, p: 'M60 -6 C 80 -26 118 -30 140 -18 C 154 -10 150 4 140 2 C 133 1 134 -6 139 -7' },  // obere Ranke
  { d: 0.3, w: 0.5, p: 'M70 6 C 96 26 140 30 172 16 C 192 7 194 -6 182 -8 C 173 -9 171 0 178 2' },       // untere Ranke
  { d: 0.5, w: 0.4, p: 'M172 16 C 196 24 214 18 232 8' },                                                   // Ausläufer
];
// Akanthusblätter (gefüllt), erscheinen nach den Ranken: [x, y, Drehung, Größe, d]
const LEAVES = [[44, -6, -30, 1, 0.35], [120, -24, 20, 0.85, 0.55], [128, 24, 160, 0.9, 0.6], [206, 18, -60, 0.7, 0.75], [92, -12, -70, 0.7, 0.5]];
const LEAF = 'M0 0 C -6 -6 -6 -16 0 -22 C 2 -16 6 -14 4 -8 C 8 -12 12 -12 12 -8 C 8 -6 5 -3 0 0Z';
let ornId = 0;
function ornamentHTML() {
  const id = `orn${ornId++}`;
  const half = LINES.map((l) => `<path class="o-line" pathLength="1" d="${l.p}" style="--d:${l.d};--w:${l.w}"/>`).join('')
    + LEAVES.map(([x, y, r, s, d]) => `<path class="o-leaf" d="${LEAF}" transform="translate(${x} ${y}) rotate(${r}) scale(${s})" style="--d:${d}"/>`).join('');
  return `<svg class="ornament" viewBox="-250 -40 500 80" aria-hidden="true" focusable="false">
    <defs><linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="-250" y1="0" x2="250" y2="0">
      <stop offset="0" stop-color="#b98d3c"/><stop offset=".3" stop-color="#f3dc93"/><stop offset=".5" stop-color="#d4a94f"/><stop offset=".7" stop-color="#f3dc93"/><stop offset="1" stop-color="#b98d3c"/></linearGradient></defs>
    <g style="--gold:url(#${id})"><g>${half}</g><g transform="scale(-1 1)">${half}</g>
      <g class="o-rose">${Array.from({ length: 8 }, (_, k) => `<ellipse rx="3.2" ry="7.5" cy="-6" transform="rotate(${k * 45})"/>`).join('')}<circle r="3.4"/></g></g>
  </svg>`;
}
export function initOrnaments() {
  const heads = $$('.room:not(.foyer) .room-head');
  heads.forEach((h) => h.insertAdjacentHTML('beforeend', ornamentHTML()));
  const items = heads.map((h) => ({ el: $('.ornament', h), head: h, b: 0, seen: false }));
  if (reduced) { items.forEach((it) => it.el.style.setProperty('--b', '1')); return; }
  let raf = 0;
  const tick = () => {
    raf = 0;
    let busy = false;
    const H = innerHeight;
    for (const it of items) {
      if (!it.seen) continue;
      const top = it.head.getBoundingClientRect().top;
      const target = clamp((H * 0.95 - top) / (H * 0.55));
      const nb = it.b + (target - it.b) * 0.08;   // weich nachführen, auch bei schnellem Scrollen
      if (Math.abs(nb - it.b) > 0.0008) { it.b = nb; it.el.style.setProperty('--b', nb.toFixed(4)); busy = true; }
    }
    if (busy) raf = requestAnimationFrame(tick);
  };
  const kick = () => { if (!raf) raf = requestAnimationFrame(tick); };
  const io = new IntersectionObserver((es) => {
    es.forEach((e) => { const it = items.find((x) => x.head === e.target); if (it) it.seen = e.isIntersecting; });
    kick();   // auch ohne weiteres Scrollen nachführen (z. B. nach einem Sprung über einen Link)
  }, { rootMargin: '200px 0px' });
  items.forEach((it) => io.observe(it.head));
  addEventListener('scroll', kick, { passive: true });
  addEventListener('resize', kick);
}

/* ------------------------------------------------------------ 6) Bilder vorab entpacken */
// Fotos mit loading="lazy" werden ~1,5 Bildschirme vor dem Sichtbarwerden geladen und im Hintergrund dekodiert,
// damit beim Hinscrollen kein Bild „auf einmal“ entpackt werden muss (das gab kurze Ruckler).
const pre = 'IntersectionObserver' in window ? new IntersectionObserver((es) => es.forEach((e) => {
  if (!e.isIntersecting) return;
  const im = e.target; pre.unobserve(im);
  im.loading = 'eager';
  (im.complete ? Promise.resolve() : new Promise((r) => im.addEventListener('load', r, { once: true }))).then(() => im.decode?.()).catch(() => {});
}), { rootMargin: '150% 0px' }) : null;
export function preloadImages() { if (pre) $$('img[loading="lazy"]').forEach((im) => pre.observe(im)); }

/* ------------------------------------------------------------ 7) Lebenslauf baut sich beim Scrollen auf */
// Überschriften, Stationen, Fähigkeiten und Interessen erscheinen nacheinander, sobald sie ins Bild kommen:
// die goldene Zeitleiste zeichnet sich Station für Station nach unten, der Punkt leuchtet auf, der Text gleitet herein,
// die Punkte der Fähigkeiten füllen sich einzeln. Alles nur opacity/transform (CSS in style.css, „.build“).
// Sprachwechsel baut den Lebenslauf neu: schon Gesehenes steht dann sofort da (Index in Dokument-Reihenfolge).
// Allgemein: Stücke bekommen beim Sichtbarwerden nacheinander .in (Abstand `gap` ms, höchstens 0,7 s Wartezeit).
// key = eigene Merkliste je Bereich; Sprachwechsel baut neu → schon Gesehenes bekommt sofort .in .now (ohne Animation).
const REVEAL = new Map();
function reveal(key, host, items, gap = 110, hostClass = 'build') {
  if (reduced || !('IntersectionObserver' in window) || !host) return;
  const R = REVEAL.get(key) || { seen: new Set(), io: null, next: 0 }; REVEAL.set(key, R);
  host.classList.add(hostClass);   // CSS versteckt erst, wenn JS wirklich läuft
  R.io?.disconnect();
  R.io = new IntersectionObserver((es) => {
    const now = performance.now();
    es.filter((e) => e.isIntersecting).map((e) => e.target)
      .sort((a, b) => items.indexOf(a) - items.indexOf(b))
      .forEach((el) => {
        R.io.unobserve(el); R.seen.add(items.indexOf(el));
        const wait = Math.min(700, Math.max(0, R.next - now)); R.next = now + wait + gap;
        el.style.setProperty('--d', `${wait}ms`);
        el.classList.add('in');
      });
  }, { rootMargin: '0px 0px -10% 0px', threshold: 0.2 });
  items.forEach((el, i) => { if (R.seen.has(i)) el.classList.add('in', 'now'); else R.io.observe(el); });
}
export function buildCV(slot) { reveal('cv', slot, $$('h3, h4, .timeline li, .skills li, .plain li, .docs li', slot)); }

/* ------------------------------------------------------------ 9) Ausgang: der Salon schließt */
// Je weiter man in den Kontakt-Saal kommt, desto dunkler werden die Ränder (Abenddämmerung, --dusk 0…1 am <html>).
// Das grüne Ausgang-Schild ist erst aus und springt dann flackernd an wie alte Leuchtröhren. Auf Touch richtet sich
// das Spotlight auf das Schild (mit Maus folgt es weiter dem Zeiger). Zurückscrollen = alles wieder wie vorher.
export function initExit(light) {
  const room = $('#kontakt'), sign = $('.exit-sign', room || document), host = $('.lighting');
  if (!room || !host) return;
  host.insertAdjacentHTML('beforeend', '<div class="dusk"></div>');
  const root = document.documentElement;
  let raf = 0, aimed = false, lastDusk = -1;
  const update = () => {
    raf = 0;
    const r = room.getBoundingClientRect(), H = innerHeight;
    const p = clamp((H - r.top) / Math.min(r.height, H * 1.1));
    const dusk = Math.round(p * p * 100) / 100;   // erst sanft, am Ende schneller dunkel
    if (dusk !== lastDusk) { root.style.setProperty('--dusk', dusk); lastDusk = dusk; }
    if (sign && !reduced) {   // Schild an, sobald es gut zu sehen ist oder man schon darüber hinweg ist (auch nach Sprung)
      const t = sign.getBoundingClientRect().top;
      if (t < H * 0.85) sign.classList.add('lit'); else if (t > H) sign.classList.remove('lit');
    }
    if (sign && !finePointer && !reduced) {
      const s = sign.getBoundingClientRect();
      const want = p > 0.55 && sign.classList.contains('lit') && s.bottom > 0 && s.top < H;   // nur solange das Schild zu sehen ist
      if (want) { light.aim(s.left + s.width / 2, s.top + s.height / 2); aimed = true; }
      else if (aimed) { light.release(); aimed = false; }
    }
  };
  const kick = () => { if (!raf) raf = requestAnimationFrame(update); };
  if (sign && !reduced) sign.classList.add('exit-off');   // erst mit JS „ausgeschaltet“ zeigen
  addEventListener('scroll', kick, { passive: true }); addEventListener('resize', kick); kick();
}

/* ------------------------------------------------------------ 8) Fun Facts: Exponat-Karten */
// Beim Hinscrollen werden die Karten nacheinander an ihren Messingnagel gehängt und pendeln aus.
// Zum Anfassen (Felix 13.11.: „damit will man was machen“): Karte packen und zur Seite ziehen = sie dreht sich am Nagel
// mit; loslassen = sie pendelt aus wie echt (Feder + Reibung). Antippen = kleiner Schubs. Ein kräftiger Schwung
// stößt die Nachbarkarten an. Mit Maus zusätzlich 3D-Neigung + Goldschimmer.
// Winkel --sw kommt zur eigenen Schräglage --r dazu (CSS: rotate: calc(var(--r) + var(--sw))).
const SW = new Map();   // Karte → { a: Winkel °, v: °/s, drag }
let swRaf = 0, swLast = 0;
const swState = (c) => { let s = SW.get(c); if (!s) { s = { a: 0, v: 0, drag: null }; SW.set(c, s); } return s; };
function swTick(now) {
  const dt = Math.min(0.033, (now - swLast) / 1000 || 0.016); swLast = now;
  let busy = false;
  for (const [c, s] of SW) {
    if (!c.isConnected) { SW.delete(c); continue; }
    if (s.drag) {   // folgt dem Finger/Zeiger, leicht gefedert
      const prev = s.a; s.a += (s.drag.target - s.a) * Math.min(1, dt * 22); s.v = (s.a - prev) / dt; busy = true;
    } else {        // freies Pendel: Rückstellkraft + Reibung
      s.v += (-70 * s.a - 3.2 * s.v) * dt; s.a += s.v * dt;
      if (Math.abs(s.a) < 0.04 && Math.abs(s.v) < 0.5) { s.a = 0; s.v = 0; } else busy = true;
    }
    c.style.setProperty('--sw', `${s.a.toFixed(2)}deg`);
  }
  swRaf = busy ? requestAnimationFrame(swTick) : 0;
}
const swKick = () => { if (!swRaf) { swLast = performance.now(); swRaf = requestAnimationFrame(swTick); } };
const push = (c, v) => { if (c?.classList.contains('fact')) { swState(c).v += v; swKick(); } };

let factsWired = false;
export function hangFacts(list) {
  if (!list) return;
  reveal('facts', list, $$('.fact', list), 160, 'hang');
  if (factsWired || reduced) return;
  factsWired = true;   // Ereignisse hängen am Dokument → überleben das Neuzeichnen beim Sprachwechsel
  // nach dem Aufhängen gibt die Animation den Winkel frei (sonst hält sie rotate fest und --sw wirkt nicht)
  document.addEventListener('animationend', (e) => { if (e.animationName === 'fact-hang') e.target.classList.add('hung'); });
  const pinAngle = (d, e) => -Math.atan2(e.clientX - d.px, Math.max(8, e.clientY - d.py)) * 180 / Math.PI;
  document.addEventListener('pointerdown', (e) => {
    const c = e.target.closest?.('.room-about .fact.in'); if (!c || (e.pointerType === 'mouse' && e.button !== 0)) return;
    if (e.pointerType === 'mouse') e.preventDefault();   // sonst markiert das Ziehen den Text
    const r = c.getBoundingClientRect(), s = swState(c);
    s.drag = { id: e.pointerId, px: r.left + r.width / 2, py: r.top + 12, x0: e.clientX, y0: e.clientY, t0: e.timeStamp, a0: s.a, target: s.a, moved: false };
    s.drag.phi0 = pinAngle(s.drag, e);
    c.setPointerCapture?.(e.pointerId); c.classList.add('grabbed'); swKick();
  });
  document.addEventListener('pointermove', (e) => {
    for (const [c, s] of SW) {
      const d = s.drag; if (!d || d.id !== e.pointerId) continue;
      if (Math.hypot(e.clientX - d.x0, e.clientY - d.y0) > 6) d.moved = true;
      d.target = Math.max(-32, Math.min(32, d.a0 + pinAngle(d, e) - d.phi0));   // ±32°: weiter sah es zu wild aus
    }
  }, { passive: true });
  const release = (e) => {
    for (const [c, s] of SW) {
      const d = s.drag; if (!d || d.id !== e.pointerId) continue;
      s.drag = null; c.classList.remove('grabbed');
      if (!d.moved && e.type === 'pointerup' && e.timeStamp - d.t0 < 350) {
        s.v += (e.clientX < d.px ? 1 : -1) * 150;   // Antippen: Schubs weg von der getippten Seite
      }
      // kräftiger Schwung stößt die Nachbarn an
      if (Math.abs(s.v) > 160) { push(c.previousElementSibling, s.v * 0.22); push(c.nextElementSibling, s.v * 0.22); }
      swKick();
    }
  };
  document.addEventListener('pointerup', release);
  document.addEventListener('pointercancel', release);   // Touch: senkrechtes Wischen = Seite scrollt, Karte lässt los
  if (finePointer) {
    document.addEventListener('pointermove', (e) => {
      const c = e.target.closest?.('.room-about .fact'); if (!c) return;
      const r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      c.style.setProperty('--tx', `${((y - 0.5) * -9).toFixed(2)}deg`); c.style.setProperty('--ty', `${((x - 0.5) * 11).toFixed(2)}deg`);
      c.style.setProperty('--mx', `${(x * 100).toFixed(1)}%`); c.style.setProperty('--my', `${(y * 100).toFixed(1)}%`);
    }, { passive: true });
    document.addEventListener('pointerout', (e) => {
      const c = e.target.closest?.('.room-about .fact'); if (!c || c.contains(e.relatedTarget)) return;
      c.style.removeProperty('--tx'); c.style.removeProperty('--ty');
    }, { passive: true });
  }
}
