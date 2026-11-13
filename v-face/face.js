// Die Collage-Karikatur: Felix' Gesicht wird im Browser aus dem Foto zerschnitten und neu zusammengesetzt.
// WebGL-Shader: Stirnstück (oben), Unterteil mit vergrößerten Lippen, verschobener Augenstreifen, runde Augen-Lupe.
// Maus/Finger: in der Nähe von Auge oder Mund wird es größer, Ziehen schiebt die Stücke auseinander (Feder zurück).
// Alle Koordinaten hier sind Pixel im Originalfoto (1280×838), "Kopf-Pixel".

const CROP = { x: 96, y: 0, w: 608, h: 612 }; // Ausschnitt um Kopf + Kopfhörer
const SVGNS = 'http://www.w3.org/2000/svg';

// kleine deterministische Zufallszahlen, damit die Kritzeleien bei jedem Laden gleich aussehen
function rng(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }

// Punkte -> weicher Pfad (Catmull-Rom als Bézier)
function smoothPath(pts) {
  let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return d;
}

// Eine lockere, handgezeichnete Schlinge (mehr als eine Umdrehung, leicht wackelig)
export function loopPath(cx, cy, rx, ry, { seed = 1, turns = 1.2, start = -2.4, wobble = 0.07, tilt = 0 } = {}) {
  const r = rng(seed), pts = [], n = Math.round(turns * 18);
  const ph1 = r() * 6, ph2 = r() * 6;
  for (let i = 0; i <= n; i++) {
    const t = i / n, a = start + t * turns * Math.PI * 2;
    const k = 1 + wobble * Math.sin(a * 2 + ph1) + wobble * 0.6 * Math.sin(a * 3 + ph2) + (r() - 0.5) * wobble * 0.5;
    const drift = 1 + t * 0.06; // die Schlinge läuft etwas auseinander, wie mit der Hand
    let x = Math.cos(a) * rx * k * drift, y = Math.sin(a) * ry * k * drift;
    const c = Math.cos(tilt), s = Math.sin(tilt);
    pts.push([cx + x * c - y * s, cy + x * s + y * c]);
  }
  return smoothPath(pts);
}

function el(tag, attrs = {}, parent) {
  const n = document.createElementNS(SVGNS, tag);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
  if (parent) parent.append(n);
  return n;
}

// ---------- Shader ----------
const VERT = `attribute vec2 aPos; void main(){ gl_Position = vec4(aPos, 0.0, 1.0); }`;
const FRAG = `
precision highp float;
uniform sampler2D uTex, uShadow;
uniform vec2 uRes; uniform float uDpr;
uniform vec2 uOrigin; uniform float uScale; uniform vec4 uCrop;
uniform vec2 uOffU, uOffD, uOffB, uOffL;
uniform vec2 uEye, uLensC; uniform float uLensR, uLensM, uLensBulge;
uniform vec2 uEye2, uBandC, uBandHalf; uniform float uBandM;
uniform vec2 uLips, uLipsR; uniform float uLipsM;
uniform float uTilt, uCutY0, uCutSlope;
uniform vec3 uBg;

vec2 rot(vec2 v, float a){ float c = cos(a), s = sin(a); return vec2(c*v.x - s*v.y, s*v.x + c*v.y); }
vec2 toUv(vec2 p){ return (p - uCrop.xy) / uCrop.zw; }
float inBox(vec2 uv){ return step(0.0, uv.x) * step(0.0, uv.y) * step(uv.x, 1.0) * step(uv.y, 1.0); }
vec4 tex(vec2 p){
  vec2 uv = toUv(p); vec4 c = texture2D(uTex, clamp(uv, 0.0, 1.0)) * inBox(uv);
  // leicht wärmer und kräftiger, näher am gemalten Poster
  c.rgb = clamp((c.rgb - 0.5 * c.a) * 1.08 + 0.5 * c.a, 0.0, 1.0) * vec3(1.04, 0.985, 0.93);
  return c;
}
float shA(vec2 p){ vec2 uv = toUv(p); return texture2D(uShadow, clamp(uv, 0.0, 1.0)).a * inBox(uv); }
float cutY(float x){ return uCutY0 + uCutSlope * (x - 400.0) + 2.4 * sin(x * 0.071) + 1.4 * sin(x * 0.23 + 1.7); }
vec2 lipsWarp(vec2 p){
  vec2 d = rot(p - uLips, -uTilt);
  float t = length(d / uLipsR);
  if (t < 1.0) { float k = 1.0 - t * t; d /= 1.0 + (uLipsM - 1.0) * k * k; }
  return uLips + rot(d, uTilt);
}
float sdBand(vec2 p){
  vec2 b = rot(p - uBandC, -uTilt);
  // rechtes Ende rund, linkes Ende eher eckig (wie mit der Schere)
  float r = b.x > 0.0 ? uBandHalf.y * 0.98 : uBandHalf.y * 0.35;
  vec2 q = abs(b) - uBandHalf + r;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r + 1.6 * sin(b.x * 0.09);
}
float lensR(vec2 d){ float a = atan(d.y, d.x); return uLensR * (1.0 + 0.035 * sin(3.0 * a + 1.0) + 0.02 * sin(5.0 * a + 0.4)); }
vec3 overWhite(vec4 c){ return vec3(1.0 - c.a) + c.rgb; } // vormultipliziert

void main(){
  vec2 css = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y) / uDpr;
  vec2 q = (css - uOrigin) / uScale + uCrop.xy;
  float px = 1.0 / uScale;            // ein CSS-Pixel in Kopf-Pixeln
  float rim = 3.4 * px;               // weißer Schnittrand
  vec2 sOff = vec2(2.0, 8.0) * px;    // Schatten fällt nach unten
  vec3 col = uBg;

  vec2 pD = q - uOffD, pU = q - uOffU;
  // weicher Schatten des ganzen Kopfes auf dem Papier
  vec2 sD = pD - sOff, sU = pU - sOff;
  float shD = shA(sD) * smoothstep(-6.0, 6.0, sD.y - cutY(sD.x));
  float shU = shA(sU) * (1.0 - smoothstep(-6.0, 6.0, sU.y - cutY(sU.x)));
  col *= 1.0 - 0.26 * max(shD, shU);

  // Unterteil (mit großen Lippen)
  float dD = pD.y - cutY(pD.x);
  vec4 cD = tex(lipsWarp(pD)) * smoothstep(-px, px, dD);
  col = col * (1.0 - cD.a) + cD.rgb;

  // Stirnstück wirft einen kleinen Schatten auf das Unterteil
  vec2 pU2 = pU - vec2(1.0, 5.0) * px;
  float shCut = tex(pU2).a * smoothstep(-7.0 * px, 7.0 * px, cutY(pU2.x) - pU2.y);
  col *= 1.0 - 0.30 * shCut;

  // Stirnstück, mit weißem Rand an der Schnittkante
  float dU = cutY(pU.x) - pU.y;
  vec4 cU = tex(pU);
  float mU = smoothstep(-px, px, dU);
  float rimU = 1.0 - smoothstep(rim - px, rim, dU);
  cU.rgb = mix(cU.rgb, vec3(cU.a), rimU);
  cU *= mU;
  col = col * (1.0 - cU.a) + cU.rgb;

  // Augenstreifen: Schatten, dann Papier + Foto
  vec2 pB = q - uOffB;
  float sdS = sdBand(pB - sOff * 0.8);
  col *= 1.0 - 0.30 * (1.0 - smoothstep(-5.0 * px, 9.0 * px, sdS));
  float sdB = sdBand(pB);
  vec3 cB = overWhite(tex(uEye2 + (pB - uEye2) / uBandM));
  cB = mix(cB, vec3(1.0), smoothstep(-rim - px, -rim, sdB));
  col = mix(col, cB, 1.0 - smoothstep(-px, px, sdB));

  // Augen-Lupe: Schatten, dann vergrößertes Auge mit Wölbung zur Mitte
  vec2 pL = q - uOffL;
  vec2 dS = pL - sOff * 1.3 - uLensC;
  float sdLS = length(dS) - lensR(dS);
  col *= 1.0 - 0.32 * (1.0 - smoothstep(-6.0 * px, 12.0 * px, sdLS));
  vec2 d = pL - uLensC;
  float R = lensR(d);
  float sdL = length(d) - R;
  float t = clamp(length(d) / R, 0.0, 1.0);
  float m = uLensM * (1.0 + uLensBulge * (1.0 - t * t));
  vec3 cL = overWhite(tex(uEye + d / m));
  cL = mix(cL, vec3(1.0), smoothstep(-rim - px, -rim, sdL));
  col = mix(col, cL, 1.0 - smoothstep(-px, px, sdL));

  gl_FragColor = vec4(col, 1.0);
}`;

function compile(gl, type, src) {
  const s = gl.createShader(type);
  gl.shaderSource(s, src); gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
  return s;
}

function loadImage(src) {
  return new Promise((res, rej) => { const i = new Image(); i.decoding = 'async'; i.onload = () => res(i); i.onerror = rej; i.src = src; });
}

// ---------- Hauptfunktion ----------
export async function initFace({ hero, canvas, svg, reduced }) {
  const [img, lm] = await Promise.all([
    loadImage('/img/hero-img_2183-person.webp'),
    fetch('/img/face-landmarks.json').then((r) => r.json()),
  ]);
  const W = lm.w, H = lm.h;
  const P = (k) => [lm[k].cx * W, lm[k].cy * H];
  const L = (i) => [lm.landmarks[i][0] * W, lm.landmarks[i][1] * H];

  const eye = P('leftEye');   // Auge rechts im Bild, offen -> Lupe
  const eye2 = P('rightEye'); // Auge links im Bild -> verschobener Streifen
  const lips = P('lips');
  const tilt = Math.atan2(eye[1] - eye2[1], eye[0] - eye2[0]); // Kopf ist geneigt
  const ca = Math.cos(tilt), sa = Math.sin(tilt);
  const rotv = (x, y) => [x * ca - y * sa, x * sa + y * ca];

  const G = {
    eye, eye2, lips, tilt,
    lensC: [eye[0] + 6, eye[1] - 6], lensR0: 72,
    bandC: [eye2[0] + 2, eye2[1] + 1], bandHalf: [72, 30],
    lipsR: [lm.lips.rx * W * 1.95, lm.lips.ry * H * 2.7],
    cutY0: 262, cutSlope: Math.tan(tilt),
  };
  const cutY = (x) => G.cutY0 + G.cutSlope * (x - 400) + 2.4 * Math.sin(x * 0.071) + 1.4 * Math.sin(x * 0.23 + 1.7);

  // ---- Kopf ausschneiden: Foto-Alpha ∩ Schnittlinie unter dem Kiefer (Jacke weg, Kopf schwebt wie im Poster)
  const jaw = [361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132]
    .map((i) => { const [x, y] = L(i); const dx = x - 392, dy = y - 380, k = (x < 400 ? 2 : 6) / Math.hypot(dx, dy); return [x + dx * k, y + dy * k]; });
  const poly = [[CROP.x - 5, -5], [CROP.x + CROP.w + 5, -5], [CROP.x + CROP.w + 5, 120], [634, 158], [630, 336], [600, 366], [560, 366],
    ...jaw, [262, 447], [205, 452], [118, 432], [CROP.x - 5, 300]];
  const head = document.createElement('canvas');
  head.width = CROP.w; head.height = CROP.h;
  const hc = head.getContext('2d');
  hc.save();
  hc.translate(-CROP.x, -CROP.y);
  hc.beginPath(); poly.forEach(([x, y], i) => (i ? hc.lineTo(x, y) : hc.moveTo(x, y))); hc.closePath(); hc.clip();
  hc.drawImage(img, 0, 0);
  hc.restore();
  const shadow = document.createElement('canvas');
  shadow.width = CROP.w; shadow.height = CROP.h;
  const sc = shadow.getContext('2d');
  sc.filter = 'blur(7px)';
  sc.drawImage(head, 0, 0);

  // ---- Zustand: Versatz der Stücke (Federn) und Aufblasen (Hover)
  const REST = { U: [12, -5], D: [0, 0], B: [-24, -7], L: [4, -4] };
  const off = {}, vel = {}, tgt = {};
  for (const k in REST) { off[k] = [...REST[k]]; vel[k] = [0, 0]; tgt[k] = [...REST[k]]; }
  if (!reduced) { // Auftritt: Stücke fliegen von außen an ihren Platz
    off.U = [40, -120]; off.B = [-170, 20]; off.L = [150, -70]; off.D = [0, 60];
  }
  const hov = { eye: 0, lips: 0, eyeT: 0, lipsT: 0, pulseEye: 0, pulseLips: 0 };
  let drag = null, par = [0, 0], parT = [0, 0];

  // ---- Layout
  let s = 1, O = [0, 0], dpr = 1, cw = 0, chh = 0;
  function layout() {
    const r = hero.getBoundingClientRect();
    cw = r.width; chh = r.height;
    const narrow = cw < 700;
    s = Math.min((chh * (narrow ? 0.78 : 0.86)) / CROP.h, (cw * (narrow ? 1.2 : 0.9)) / CROP.w);
    O = [(cw - CROP.w * s) / 2, (chh - CROP.h * s) / 2 + chh * 0.01];
    dpr = Math.min(window.devicePixelRatio || 1, 1.6);
    canvas.width = Math.round(cw * dpr); canvas.height = Math.round(chh * dpr);
    svg.style.left = `${O[0]}px`; svg.style.top = `${O[1]}px`;
    svg.style.width = `${CROP.w * s}px`; svg.style.height = `${CROP.h * s}px`;
  }

  // ---- Kritzeleien (SVG in Kopf-Pixeln)
  svg.setAttribute('viewBox', `${CROP.x} ${CROP.y} ${CROP.w} ${CROP.h}`);
  // Kreide: raue Kanten + ganz leichter dunkler Rand, damit Weiß auch auf heller Haut lesbar bleibt
  const defs = el('defs', {}, svg);
  const f = el('filter', { id: 'chalky', filterUnits: 'userSpaceOnUse', x: CROP.x - 300, y: CROP.y - 300, width: CROP.w + 600, height: CROP.h + 600 }, defs);
  el('feTurbulence', { type: 'fractalNoise', baseFrequency: '0.9', numOctaves: 2, seed: 4, result: 'n' }, f);
  el('feDisplacementMap', { in: 'SourceGraphic', in2: 'n', scale: 2.6, xChannelSelector: 'R', yChannelSelector: 'G', result: 'd' }, f);
  el('feDropShadow', { in: 'd', dx: 0, dy: 1.2, stdDeviation: 1.4, 'flood-color': '#2a1a10', 'flood-opacity': 0.5 }, f);
  const groups = {};
  for (const k of ['D', 'U', 'B', 'L']) groups[k] = el('g', { class: `g-${k}` }, svg);
  const draw = (g, d, cls, delay, extra = {}) => el('path', { d, class: `draw ${cls}`, pathLength: 1, style: `--d:${delay}s`, ...extra }, g);

  // grüne Schlingen um die Lupe (größer, nach unten-links verrutscht, wie schnell hingekritzelt)
  const lc = G.lensC;
  draw(groups.L, loopPath(lc[0] - 8, lc[1] + 10, 92, 86, { seed: 3, turns: 1.15, start: -2.0, tilt: 0.3 }), 'lime thick', 0.55);
  draw(groups.L, loopPath(lc[0] - 14, lc[1] + 18, 99, 90, { seed: 9, turns: 1.05, start: 0.6, tilt: -0.2, wobble: 0.09 }), 'lime', 0.85);
  draw(groups.L, loopPath(lc[0] - 2, lc[1] + 4, 86, 82, { seed: 21, turns: 0.9, start: 2.2, wobble: 0.05 }), 'lime thin', 1.1);
  // Striche oben rechts (wie zwei Augenbrauen-Ticks)
  draw(groups.U, 'M574 70 C578 84 580 96 586 108', 'lime thick', 1.5);
  draw(groups.U, 'M604 62 C606 76 607 88 612 100', 'lime thick', 1.62);
  draw(groups.U, 'M560 120 C566 128 578 132 590 130', 'lime', 1.74);
  // grüne Punkte auf der Wange unter der Lupe
  [[492, 412, 4.2], [512, 404, 3.4], [528, 418, 3.8]].forEach(([x, y, r], i) =>
    el('circle', { cx: x, cy: y, r, class: 'dot lime-fill', style: `--d:${1.9 + i * 0.08}s` }, groups.D));
  // weiße Kreide-Striche auf der anderen Wange (unter dem Streifen)
  const chalkBase = [272, 404];
  for (let i = 0; i < 3; i++) {
    const [x, y] = [chalkBase[0] + i * 21 + i * 2, chalkBase[1] - i * 5];
    draw(groups.D, `M${x} ${y} C${x + 1} ${y + 5} ${x - 1} ${y + 10} ${x + 1} ${y + 15}`, 'chalk', 2.0 + i * 0.1);
  }

  // Name auf der Sonnenbrille: erst „Felix“ (so sagen viele), dann wird das x durchgestrichen
  // und die richtige Schreibweise „ks“ darüber gekritzelt -> Feliks. Bei reduzierter Bewegung steht gleich „Feliks“.
  const nameG = el('g', { transform: `rotate(${(tilt * 180 / Math.PI).toFixed(1)} 300 110)` }, groups.U);
  const clip = el('clipPath', { id: 'nameWipe' }, svg);
  const wipe = el('rect', { x: 150, y: 20, width: 330, height: 140, class: 'wipe', style: '--d:1.25s' }, clip);
  const name = el('text', { x: 176, y: 130, class: 'name', 'clip-path': 'url(#nameWipe)' }, nameG);
  name.textContent = reduced ? 'Feliks' : 'Felix';
  const dots = el('g', { class: 'dots', style: '--d:2.0s' }, nameG);
  const t0 = performance.now();
  // Korrektur-Teil wird nach dem Laden der Schrift ausgemessen
  const fixG = el('g', {}, nameG);
  async function placeFix() {
    try { await document.fonts.load('64px "Permanent Marker"'); } catch { /* egal */ }
    fixG.replaceChildren(); dots.replaceChildren();
    const n = name.textContent.length;
    let x0 = 300, x1 = 340, endX = 350;
    try { x0 = 176 + name.getSubStringLength(0, 4); x1 = 176 + name.getSubStringLength(0, n); endX = x1; } catch { /* noch nicht gerendert */ }
    const y = 110;
    // Verzögerungen zählen ab Erzeugen des Namens, nicht ab dem Laden der Schrift
    const late = (performance.now() - t0) / 1000;
    const at = (s) => Math.max(0, s - late);
    if (!reduced) {
      // „Felix“ steht ca. 1,5 s, dann wird das x durchgestrichen (zweimal, leicht schräg)
      draw(fixG, `M${x0 - 8} ${y + 6} C${x0 + 10} ${y - 2} ${x1 - 10} ${y - 10} ${x1 + 10} ${y - 16}`, 'lime thick', at(3.4));
      draw(fixG, `M${x0 - 4} ${y - 6} C${x0 + 14} ${y - 12} ${x1 - 6} ${y - 4} ${x1 + 8} ${y - 2}`, 'lime', at(3.6));
      // „ks“ darüber gekritzelt (wird wie der Name von links nach rechts freigelegt)
      const cx = (x0 + x1) / 2 + 12;
      const kClip = el('clipPath', { id: 'ksWipe' }, fixG);
      el('rect', { x: cx - 60, y: y - 110, width: 120, height: 80, class: 'wipe', style: `--d:${at(4.0)}s` }, kClip);
      const ks = el('text', { x: cx, y: y - 48, class: 'name ks-fix', 'text-anchor': 'middle', 'clip-path': 'url(#ksWipe)' }, fixG);
      ks.textContent = 'ks';
    }
    // weiße Pünktchen hinter dem Namen
    [0, 1, 2].forEach((i) => el('circle', { cx: endX + 14 + i * 11, cy: y + 14 - i, r: 2.6 }, dots));
    tick(true);
  }
  placeFix();
  // Tag auf der Ohrmuschel
  const tag = el('text', { x: 0, y: 0, class: 'tag', 'clip-path': 'url(#tagWipe)', transform: 'translate(172 312) rotate(-78)' }, groups.U);
  tag.textContent = 'felya';
  const clip2 = el('clipPath', { id: 'tagWipe' }, svg);
  el('rect', { x: -10, y: -50, width: 140, height: 70, class: 'wipe', style: '--d:2.25s' }, clip2);

  // ---- WebGL
  let gl = null, U = {};
  try {
    gl = canvas.getContext('webgl', { antialias: false, premultipliedAlpha: true, alpha: false, preserveDrawingBuffer: false });
  } catch { gl = null; }
  if (gl) {
    try {
      const prog = gl.createProgram();
      gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VERT));
      gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, FRAG));
      gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
      gl.useProgram(prog);
      const buf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
      const loc = gl.getAttribLocation(prog, 'aPos');
      gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
      const mkTex = (unit, source) => {
        const t = gl.createTexture();
        gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, t);
        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      };
      mkTex(0, head); mkTex(1, shadow);
      const names = ['uTex', 'uShadow', 'uRes', 'uDpr', 'uOrigin', 'uScale', 'uCrop', 'uOffU', 'uOffD', 'uOffB', 'uOffL', 'uEye', 'uLensC', 'uLensR', 'uLensM', 'uLensBulge',
        'uEye2', 'uBandC', 'uBandHalf', 'uBandM', 'uLips', 'uLipsR', 'uLipsM', 'uTilt', 'uCutY0', 'uCutSlope', 'uBg'];
      for (const n of names) U[n] = gl.getUniformLocation(prog, n);
      gl.uniform1i(U.uTex, 0); gl.uniform1i(U.uShadow, 1);
      gl.uniform4f(U.uCrop, CROP.x, CROP.y, CROP.w, CROP.h);
      gl.uniform2f(U.uEye, ...G.eye); gl.uniform2f(U.uEye2, ...G.eye2); gl.uniform2f(U.uLips, ...G.lips);
      gl.uniform2f(U.uLipsR, ...G.lipsR); gl.uniform2f(U.uLensC, ...G.lensC);
      gl.uniform2f(U.uBandC, ...G.bandC); gl.uniform2f(U.uBandHalf, ...G.bandHalf);
      gl.uniform1f(U.uBandM, 1.07); gl.uniform1f(U.uTilt, G.tilt);
      gl.uniform1f(U.uCutY0, G.cutY0); gl.uniform1f(U.uCutSlope, G.cutSlope);
      gl.uniform3f(U.uBg, 1, 1, 1);
    } catch (e) { console.warn('WebGL-Collage nicht verfügbar, zeige einfache Version.', e); gl = null; }
  }
  const ctx2d = gl ? null : canvas.getContext('2d');

  // aktuelle Formwerte aus dem Hover-Zustand
  const shape = () => {
    const e = Math.max(hov.eye, hov.pulseEye), l = Math.max(hov.lips, hov.pulseLips);
    return { lensR: G.lensR0 * (1 + 0.13 * e), lensM: 1.75 + 0.22 * e, bulge: 0.06 + 0.38 * e, lipsM: 1.62 + 0.5 * l, lipsGrow: 1 + 0.12 * l };
  };

  function render() {
    const sh = shape();
    const o = (k) => [off[k][0] + par[0] * PAR[k], off[k][1] + par[1] * PAR[k]];
    if (gl) {
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(U.uRes, canvas.width, canvas.height); gl.uniform1f(U.uDpr, dpr);
      gl.uniform2f(U.uOrigin, O[0], O[1]); gl.uniform1f(U.uScale, s);
      gl.uniform2f(U.uOffU, ...o('U')); gl.uniform2f(U.uOffD, ...o('D')); gl.uniform2f(U.uOffB, ...o('B')); gl.uniform2f(U.uOffL, ...o('L'));
      gl.uniform1f(U.uLensR, sh.lensR); gl.uniform1f(U.uLensM, sh.lensM); gl.uniform1f(U.uLensBulge, sh.bulge);
      gl.uniform1f(U.uLipsM, sh.lipsM);
      gl.uniform2f(U.uLipsR, G.lipsR[0] * sh.lipsGrow, G.lipsR[1] * sh.lipsGrow);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    } else if (ctx2d) {
      render2d(sh, o);
    }
    // Kritzeleien wandern mit ihren Stücken
    for (const k of ['U', 'D', 'B']) groups[k].setAttribute('transform', `translate(${o(k)[0].toFixed(2)} ${o(k)[1].toFixed(2)})`);
    const k = sh.lensR / G.lensR0, oL = o('L');
    groups.L.setAttribute('transform', `translate(${(oL[0] + lc[0] * (1 - k)).toFixed(2)} ${(oL[1] + lc[1] * (1 - k)).toFixed(2)}) scale(${k.toFixed(4)})`);
  }

  // einfache Fallback-Version ohne WebGL (statisch, ohne Wölbung)
  function render2d(sh, o) {
    const c = ctx2d;
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    c.fillStyle = '#fff'; c.fillRect(0, 0, cw, chh);
    c.translate(O[0], O[1]); c.scale(s, s); c.translate(-CROP.x, -CROP.y);
    c.drawImage(head, CROP.x, CROP.y);
    const oL = o('L');
    c.save();
    c.beginPath(); c.arc(G.lensC[0] + oL[0], G.lensC[1] + oL[1], sh.lensR, 0, Math.PI * 2);
    c.shadowColor = 'rgba(40,25,15,.35)'; c.shadowBlur = 12; c.shadowOffsetY = 6; c.fillStyle = '#fff'; c.fill();
    c.shadowColor = 'transparent'; c.clip();
    const m = sh.lensM, ex = G.eye[0], ey = G.eye[1], tx = G.lensC[0] + oL[0], ty = G.lensC[1] + oL[1];
    c.drawImage(head, tx - (ex - CROP.x) * m, ty - (ey - CROP.y) * m, CROP.w * m, CROP.h * m);
    c.restore();
    c.lineWidth = 3.4 / s; c.strokeStyle = '#fff';
    c.beginPath(); c.arc(G.lensC[0] + oL[0], G.lensC[1] + oL[1], sh.lensR - 1.7 / s, 0, Math.PI * 2); c.stroke();
  }

  const PAR = { U: 0.6, D: -0.25, B: -0.9, L: 1.2 };

  // ---- Animationsschleife (läuft nur, solange sich etwas bewegt und der Hero sichtbar ist)
  let raf = 0, last = 0, visible = true;
  function step(now) {
    raf = 0;
    const dt = Math.min(0.033, (now - (last || now)) / 1000 || 0.016); last = now;
    let busy = false;
    for (const k in off) {
      for (let i = 0; i < 2; i++) {
        const a = 170 * (tgt[k][i] - off[k][i]) - (drag ? 26 : 11) * vel[k][i];
        vel[k][i] += a * dt; off[k][i] += vel[k][i] * dt;
        if (Math.abs(vel[k][i]) > 0.05 || Math.abs(tgt[k][i] - off[k][i]) > 0.05) busy = true;
      }
    }
    const ease = 1 - Math.exp(-dt * 7);
    hov.eye += (hov.eyeT - hov.eye) * ease; hov.lips += (hov.lipsT - hov.lips) * ease;
    hov.pulseEye = Math.max(0, hov.pulseEye - dt * 0.9); hov.pulseLips = Math.max(0, hov.pulseLips - dt * 0.9);
    par[0] += (parT[0] - par[0]) * ease; par[1] += (parT[1] - par[1]) * ease;
    if (Math.abs(hov.eyeT - hov.eye) > 0.002 || Math.abs(hov.lipsT - hov.lips) > 0.002 || hov.pulseEye > 0 || hov.pulseLips > 0
      || Math.abs(parT[0] - par[0]) > 0.02 || Math.abs(parT[1] - par[1]) > 0.02) busy = true;
    render();
    if (busy && visible) raf = requestAnimationFrame(step);
    else last = 0;
  }
  function tick(force) {
    if (reduced) { render(); return; }
    if (force && !raf) { last = 0; }
    if (!raf && visible) raf = requestAnimationFrame(step);
  }

  layout();
  render();
  canvas.classList.add('ready');
  hero.classList.add('face-ready');
  window.addEventListener('resize', () => { layout(); render(); tick(); });
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) tick(); }).observe(hero);
  if (reduced) return;
  setTimeout(() => tick(), 180);

  // ---- Zeiger
  const toHead = (e) => {
    const r = hero.getBoundingClientRect();
    return [(e.clientX - r.left - O[0]) / s + CROP.x, (e.clientY - r.top - O[1]) / s + CROP.y];
  };
  const near = (p, c, r0, r1) => { const d = Math.hypot(p[0] - c[0], p[1] - c[1]); return 1 - Math.min(1, Math.max(0, (d - r0) / (r1 - r0))); };
  function hover(p) {
    const lcNow = [G.lensC[0] + off.L[0], G.lensC[1] + off.L[1]];
    const lipNow = [G.lips[0] + off.D[0], G.lips[1] + off.D[1]];
    const e = near(p, lcNow, 30, 190), l = near(p, lipNow, 30, 160);
    hov.eyeT = e * e * (3 - 2 * e); hov.lipsT = l * l * (3 - 2 * l);
    // ganz leichte Parallaxe der Stücke zum Zeiger
    const cx = CROP.x + CROP.w / 2, cy = CROP.y + CROP.h / 2;
    parT = [Math.max(-1, Math.min(1, (p[0] - cx) / 400)) * 6, Math.max(-1, Math.min(1, (p[1] - cy) / 400)) * 4];
  }
  function setDragTargets(D) {
    const len = Math.hypot(D[0], D[1]);
    const k = 150 / (150 + len); // weich begrenzt
    const dx = D[0] * k, dy = D[1] * k, sp = len * k;
    tgt.L = [REST.L[0] + dx * 0.95, REST.L[1] + dy * 0.95];
    tgt.U = [REST.U[0] + dx * 0.4, REST.U[1] + dy * 0.3 - sp * 0.32];
    tgt.B = [REST.B[0] - dx * 0.6, REST.B[1] - dy * 0.15];
    tgt.D = [REST.D[0] - dx * 0.15, REST.D[1] + sp * 0.12];
  }
  function kick(p) {
    // Antippen: Stücke springen kurz auseinander, Auge/Mund in der Nähe pumpen auf
    const a = Math.atan2(p[1] - 300, p[0] - 400);
    const ux = Math.cos(a), uy = Math.sin(a);
    vel.L[0] += ux * 380 + 120; vel.L[1] += uy * 380 - 160;
    vel.U[0] += 90; vel.U[1] -= 320;
    vel.B[0] -= 420; vel.B[1] += 40;
    vel.D[1] += 160;
    const lcNow = [G.lensC[0] + off.L[0], G.lensC[1] + off.L[1]];
    if (near(p, lcNow, 40, 220) > 0.2) hov.pulseEye = 1;
    if (near(p, G.lips, 40, 180) > 0.2) hov.pulseLips = 1;
    tick();
  }

  hero.addEventListener('pointermove', (e) => {
    const p = toHead(e);
    if (e.pointerType === 'mouse' && !drag) hover(p);
    if (drag && e.pointerId === drag.id) {
      const D = [p[0] - drag.p[0], p[1] - drag.p[1]];
      if (Math.hypot(D[0], D[1]) > 6) drag.moved = true;
      setDragTargets(D);
      hover(p);
    }
    tick();
  });
  hero.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse' && !drag) { hov.eyeT = 0; hov.lipsT = 0; parT = [0, 0]; tick(); } });
  hero.addEventListener('pointerdown', (e) => {
    if (e.target.closest('button, a')) return;
    if (e.button !== undefined && e.button > 0) return;
    drag = { id: e.pointerId, p: toHead(e), moved: false };
    try { hero.setPointerCapture(e.pointerId); } catch { /* egal */ }
    hero.classList.add('dragging');
  });
  const end = (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const wasTap = !drag.moved && e.type === 'pointerup';
    drag = null;
    hero.classList.remove('dragging');
    for (const k in REST) tgt[k] = [...REST[k]];
    if (wasTap) kick(toHead(e));
    if (e.pointerType !== 'mouse') { hov.eyeT = 0; hov.lipsT = 0; parT = [0, 0]; }
    tick();
  };
  hero.addEventListener('pointerup', end);
  hero.addEventListener('pointercancel', end);
  // Tastatur: Enter/Leertaste auf der Collage = Antippen
  canvas.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); kick([G.lensC[0], G.lensC[1]]); hov.pulseLips = 1; }
  });
}
