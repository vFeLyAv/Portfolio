// 3D-Bilder im Salon (Felix 13.11.2026). Aus EINEM Foto + seiner Tiefenkarte (Depth Anything V2, lokal berechnet
// mit _tools/depth-center.py) entsteht ein Bild, das sich wie durch ein Fenster betrachtet leicht mitdreht:
// nahe Teile verschieben sich stärker als ferne – Parallaxe.
// Technik: WebGL-Canvas über dem Foto. Für jeden Bildpunkt wird gefragt „welcher Punkt des Fotos landet hier?“ und
// das in 4 kleinen Schritten angenähert (sonst reißen Kanten auf).
// Steuerung: Maus = Blickrichtung. Handy: NEIGEN (Lagesensor) dreht die Bilder und verschiebt die ganze Wand ein wenig
// (iPhone fragt einmal um Erlaubnis – geht nur nach einer Berührung, darum beim ersten Tippen im Foyer).
// Ohne Maus/Neigung: langsames Wiegen. Nur solange ein Bild zu sehen ist; „Bewegung reduzieren“ = aus (Foto bleibt).
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
const lite = document.documentElement.classList.contains('lite');

// Tiefenkarte je Foto – als VOLLER Pfad ausgeschrieben: _tools/deploy.ps1 behält nur Bilder, deren Pfad wörtlich im
// Build steht. focus = Tiefe, die stehen bleibt (meist Felix), k = Stärke.
const DEPTH = {
  '/img/felix/center-9594.jpg': { src: '/img/felix/center-9594-depth.png', focus: 0.38, k: 0.028 },   // Mittelbild
  '/img/balloons-edit.jpg': { src: '/img/balloons-edit-depth.png', focus: 0.45, k: 0.034 },           // Im gelben Raum
  '/img/sony-dsc06015-photo.jpg': { src: '/img/sony-dsc06015-photo-depth.png', focus: 0.55, k: 0.03 }, // Bei Nacht
};

const VS = `attribute vec2 p; varying vec2 v; void main(){ v = vec2(p.x * .5 + .5, .5 - p.y * .5); gl_Position = vec4(p, 0., 1.); }`;
const FS = `precision mediump float;
varying vec2 v; uniform sampler2D img, dep; uniform vec2 off, sc, tr; uniform float focus;
float D(vec2 u){ return pow(texture2D(dep, u).r, .7); }   // Gamma: Vordergrund/Hintergrund stärker trennen
void main(){
  vec2 u = v * sc + tr, q = u;                            // q = Punkt im Foto (object-fit: cover nachgebaut)
  for (int i = 0; i < 4; i++) q = u - off * (D(q) - focus);
  gl_FragColor = texture2D(img, clamp(q, .001, .999));
}`;

/* ------------------------------------------------------------ Neigen (Handy) */
// tilt.x/y = −1…1, weich; „Nullstellung“ passt sich langsam an, wie man das Handy gerade hält
const tilt = { on: false, x: 0, y: 0, b0: null, g0: null };
const root = document.documentElement;
function onOrient(e) {
  if (e.beta == null || e.gamma == null) return;
  if (tilt.b0 == null) { tilt.b0 = e.beta; tilt.g0 = e.gamma; }
  tilt.b0 += (e.beta - tilt.b0) * 0.004; tilt.g0 += (e.gamma - tilt.g0) * 0.004;   // langsam nachführen
  const cl = (v) => Math.max(-1, Math.min(1, v));
  tilt.x = cl((e.gamma - tilt.g0) / 18); tilt.y = cl((e.beta - tilt.b0) / 18);
  if (!tilt.on) { tilt.on = true; root.classList.add('tilting'); wallTick(); }
}
// die Wand selbst verschiebt sich ein wenig (CSS --tilt-x/--tilt-y), weich nachgeführt
const wall = { x: 0, y: 0, raf: 0 };
function wallTick() {
  wall.raf = 0;
  wall.x += (tilt.x - wall.x) * 0.12; wall.y += (tilt.y - wall.y) * 0.12;
  root.style.setProperty('--tilt-x', wall.x.toFixed(3)); root.style.setProperty('--tilt-y', wall.y.toFixed(3));
  if (!document.hidden) wall.raf = requestAnimationFrame(wallTick);
}
if (!reduced && !finePointer && 'DeviceOrientationEvent' in window) {
  // sofort zuhören (Android liefert die Werte ohne Nachfrage) …
  addEventListener('deviceorientation', onOrient, { passive: true });
  // … und wo es eine Erlaubnis braucht (iPhone/iPad; auch Chromium hat die Funktion, antwortet dort einfach „granted“):
  // fragen geht nur innerhalb einer Berührung – beim ersten Tippen im Foyer
  if (typeof DeviceOrientationEvent.requestPermission === 'function') {
    const ask = (e) => {
      if (!e.target.closest?.('.foyer')) return;
      removeEventListener('touchend', ask, true);
      DeviceOrientationEvent.requestPermission().catch(() => {});
    };
    addEventListener('touchend', ask, true);
  }
  document.addEventListener('visibilitychange', () => { if (!document.hidden && tilt.on && !wall.raf) wallTick(); });
}

/* ------------------------------------------------------------ ein 3D-Bild */
function make(img, cfg) {
  const art = img.parentElement, cv = document.createElement('canvas');
  cv.className = 'd3'; cv.setAttribute('aria-hidden', 'true');
  const gl = cv.getContext('webgl', { antialias: false, alpha: false, premultipliedAlpha: false });
  if (!gl) return null;   // kein WebGL: einfach das Foto
  // Grafik-Kontext verloren (iPhone bei Speicherdruck, Tab im Hintergrund): Canvas weg, das normale Foto bleibt sichtbar
  cv.addEventListener('webglcontextlost', () => cv.remove(), { once: true });
  const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s; };
  const pr = gl.createProgram(); gl.attachShader(pr, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FS));
  gl.linkProgram(pr);
  if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) return null;
  gl.useProgram(pr);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const ap = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(ap); gl.vertexAttribPointer(ap, 2, gl.FLOAT, false, 0, 0);
  const U = (n) => gl.getUniformLocation(pr, n);
  gl.uniform1f(U('focus'), cfg.focus);
  const tex = (unit, im) => {
    const t = gl.createTexture(); gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, t);
    for (const [k, val] of [[gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE], [gl.TEXTURE_MIN_FILTER, gl.LINEAR], [gl.TEXTURE_MAG_FILTER, gl.LINEAR]]) gl.texParameteri(gl.TEXTURE_2D, k, val);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, im);
  };
  const load = (src) => new Promise((res, rej) => { const im = new Image(); im.decoding = 'async'; im.onload = () => res(im); im.onerror = rej; im.src = src; });
  const photoSrc = img.currentSrc || img.src;
  let iw = 1, ih = 1, stopped = false, raf = 0, visible = false, last = 0, painted = -1e9, lastMove = -1e9;
  const o = { x: 0, y: 0 }, t = { x: 0, y: 0 };   // Blickrichtung: aktuell / Ziel (−1…1)
  const phase = Math.random() * 6;                  // jedes Bild wiegt etwas anders

  const size = () => {
    const w = art.clientWidth, h = art.clientHeight, dpr = Math.min(devicePixelRatio || 1, lite ? 1.5 : 2);
    if (!w || !h) return;
    cv.width = Math.max(1, Math.round(w * dpr)); cv.height = Math.max(1, Math.round(h * dpr));
    gl.viewport(0, 0, cv.width, cv.height);
    const [px, py] = getComputedStyle(img).objectPosition.split(' ').map((s) => parseFloat(s) / 100);
    const ea = w / h, ia = iw / ih, sx = ia > ea ? ea / ia : 1, sy = ia > ea ? 1 : ia / ea;
    gl.uniform2f(U('sc'), sx, sy); gl.uniform2f(U('tr'), (1 - sx) * (isNaN(px) ? 0.5 : px), (1 - sy) * (isNaN(py) ? 0.5 : py));
    draw();
  };
  // Vorzeichen wie beim Blick durch ein Fenster: geht der Kopf (Zeiger) nach rechts, rücken nahe Dinge nach links
  const draw = () => { gl.uniform2f(U('off'), -o.x * cfg.k, -o.y * cfg.k); gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4); };
  const tick = (now) => {
    raf = 0;
    if (stopped || !visible || document.hidden) return;
    if (tilt.on) { t.x = tilt.x; t.y = tilt.y; }
    else if (!finePointer || now - lastMove > 3500) {   // Touch ohne Sensor oder Maus ruht: langsam wiegen
      const s = now / 1000 + phase; t.x = 0.55 * Math.sin(s * 0.45) + 0.15 * Math.sin(s * 1.1 + 1); t.y = 0.35 * Math.sin(s * 0.33 + 0.7);
    }
    const dt = Math.min(0.05, (now - last) / 1000 || 0.016); last = now;
    const f = 1 - Math.exp(-dt / (tilt.on ? 0.12 : !finePointer || now - lastMove > 3500 ? 0.9 : 0.18));
    o.x += (t.x - o.x) * f; o.y += (t.y - o.y) * f;
    if (!lite || now - painted > 33) { draw(); painted = now; }   // Touch: höchstens ~30×/s
    raf = requestAnimationFrame(tick);
  };
  const kick = () => { if (!raf && !stopped) { last = performance.now(); raf = requestAnimationFrame(tick); } };
  const onMove = (e) => {
    const r = art.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    t.x = Math.max(-1, Math.min(1, (e.clientX - cx) / (innerWidth * 0.45)));
    t.y = Math.max(-1, Math.min(1, (e.clientY - cy) / (innerHeight * 0.45)));
    lastMove = performance.now(); kick();
  };
  const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) kick(); });
  const ro = new ResizeObserver(() => size());
  Promise.all([load(photoSrc), load(cfg.src)]).then(([ph, dp]) => {
    if (stopped) return;
    iw = ph.naturalWidth; ih = ph.naturalHeight;
    gl.uniform1i(U('img'), 0); gl.uniform1i(U('dep'), 1);
    tex(0, ph); tex(1, dp);
    art.append(cv); size();
    requestAnimationFrame(() => cv.classList.add('ready'));   // weich einblenden, Foto darunter bleibt bis dahin
    ro.observe(art); io.observe(art);
    if (finePointer) addEventListener('pointermove', onMove, { passive: true });
  }).catch(() => {});   // Tiefenkarte fehlt: einfach das normale Foto
  return { stop() { stopped = true; ro.disconnect(); io.disconnect(); removeEventListener('pointermove', onMove); cv.remove(); gl.getExtension('WEBGL_lose_context')?.loseContext(); } };
}

let live = [];   // laufende Bilder (Sprachwechsel zeichnet die Wände neu → alte aufräumen)
export function initPortrait(scope = document) {
  live.forEach((x) => x.stop()); live = [];
  if (reduced) return;
  for (const img of scope.querySelectorAll('.frame .art img')) {
    const cfg = DEPTH[new URL(img.currentSrc || img.src, location.href).pathname];
    // Handy/iPad (lite): 3D nur im Foyer. In den Sälen blendet „Türen“ den ganzen Inhalt per Deckkraft + Zoom ein –
    // auf Felix' Handy blieb das WebGL-Bild dort leer und verdeckte das Foto („Bei Nacht“ in Über mich, 13.11.2026).
    if (lite && !img.closest('.foyer')) continue;
    if (cfg && !img.closest('.viewer')) { const x = make(img, cfg); if (x) live.push(x); }
  }
}
