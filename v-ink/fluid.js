// Tinte im Wasser: kleine "Stable Fluids"-Simulation (nach Jos Stam / Pavel Dobryakov), WebGL2.
// Die Simulation rechnet in einem niedrig aufgelösten Gitter (Geschwindigkeit) und einem etwas feineren (Tinte).
// Koordinaten nach außen: CSS-Pixel relativ zur Leinwand, x nach rechts, y nach unten.

const VS = `#version 300 es
precision highp float;
in vec2 aPos;
uniform vec2 uTexel;
out vec2 vUv; out vec2 vL; out vec2 vR; out vec2 vT; out vec2 vB;
void main(){
  vUv = aPos * .5 + .5;
  vL = vUv - vec2(uTexel.x, 0.); vR = vUv + vec2(uTexel.x, 0.);
  vT = vUv + vec2(0., uTexel.y); vB = vUv - vec2(0., uTexel.y);
  gl_Position = vec4(aPos, 0., 1.);
}`;

const HEAD = `#version 300 es
precision highp float; precision highp sampler2D;
in vec2 vUv; in vec2 vL; in vec2 vR; in vec2 vT; in vec2 vB;
out vec4 o;
`;

const FS = {
  splat: HEAD + `
uniform sampler2D uTarget; uniform float uAspect; uniform vec2 uPoint; uniform vec3 uColor; uniform float uRadius;
void main(){
  vec2 p = vUv - uPoint; p.x *= uAspect;
  vec3 s = exp(-dot(p, p) / uRadius) * uColor;
  o = vec4(texture(uTarget, vUv).xyz + s, 1.);
}`,
  mask: HEAD + `
uniform sampler2D uTarget; uniform sampler2D uMask; uniform vec3 uAdd;
void main(){
  float m = texture(uMask, vUv).a;
  o = vec4(texture(uTarget, vUv).xyz + m * uAdd, 1.);
}`,
  advect: HEAD + `
uniform sampler2D uVelocity; uniform sampler2D uSource; uniform vec2 uSimTexel; uniform float uDt; uniform float uDiss; uniform float uFloor;
void main(){
  vec2 c = vUv - uDt * texture(uVelocity, vUv).xy * uSimTexel;
  vec4 r = texture(uSource, c) * uDiss;
  // unten läuft die Tinte langsam aus dem Bild
  r *= mix(uFloor, 1., smoothstep(0., .22, vUv.y));
  o = r;
}`,
  curl: HEAD + `
uniform sampler2D uVelocity;
void main(){
  float L = texture(uVelocity, vL).y, R = texture(uVelocity, vR).y;
  float T = texture(uVelocity, vT).x, B = texture(uVelocity, vB).x;
  o = vec4(.5 * (R - L - T + B), 0., 0., 1.);
}`,
  // Wirbelverstärkung + Schwerkraft der Tinte + sanfte Strömung im Wasser
  forces: HEAD + `
uniform sampler2D uVelocity; uniform sampler2D uCurl; uniform sampler2D uDye;
uniform float uCurlAmt; uniform float uDt; uniform float uGravity; uniform float uTime; uniform float uAmbient;
void main(){
  float L = texture(uCurl, vL).x, R = texture(uCurl, vR).x, T = texture(uCurl, vT).x, B = texture(uCurl, vB).x, C = texture(uCurl, vUv).x;
  vec2 f = .5 * vec2(abs(T) - abs(B), abs(R) - abs(L));
  f /= length(f) + .0001;
  f *= uCurlAmt * C; f.y *= -1.;
  vec2 v = texture(uVelocity, vUv).xy + f * uDt;
  float d = texture(uDye, vUv).r;
  v.y -= uGravity * min(d, 3.) * uDt;
  float t = uTime;
  vec2 amb = vec2(sin(vUv.y * 7.0 + t * .23) + .6 * sin(vUv.y * 13. - t * .31 + vUv.x * 3.),
                  cos(vUv.x * 5.0 - t * .19) + .5 * cos(vUv.x * 11. + t * .27));
  v += amb * uAmbient * uDt;
  o = vec4(clamp(v, -1500., 1500.), 0., 1.);
}`,
  divergence: HEAD + `
uniform sampler2D uVelocity;
void main(){
  float L = texture(uVelocity, vL).x, R = texture(uVelocity, vR).x, T = texture(uVelocity, vT).y, B = texture(uVelocity, vB).y;
  vec2 C = texture(uVelocity, vUv).xy;
  if (vL.x < 0.) L = -C.x; if (vR.x > 1.) R = -C.x; if (vT.y > 1.) T = -C.y; if (vB.y < 0.) B = C.y; // unten offen: Tinte darf hinaus
  o = vec4(.5 * (R - L + T - B), 0., 0., 1.);
}`,
  scale: HEAD + `
uniform sampler2D uTex; uniform float uValue;
void main(){ o = uValue * texture(uTex, vUv); }`,
  pressure: HEAD + `
uniform sampler2D uPressure; uniform sampler2D uDivergence;
void main(){
  float L = texture(uPressure, vL).x, R = texture(uPressure, vR).x, T = texture(uPressure, vT).x, B = texture(uPressure, vB).x;
  float div = texture(uDivergence, vUv).x;
  o = vec4((L + R + B + T - div) * .25, 0., 0., 1.);
}`,
  gradient: HEAD + `
uniform sampler2D uPressure; uniform sampler2D uVelocity;
void main(){
  float L = texture(uPressure, vL).x, R = texture(uPressure, vR).x, T = texture(uPressure, vT).x, B = texture(uPressure, vB).x;
  vec2 v = texture(uVelocity, vUv).xy - vec2(R - L, T - B);
  o = vec4(v, 0., 1.);
}`,
  // Darstellung: Dichte -> Farbverlauf der Tinte aus dem Plakat, mit etwas Licht für die "Wolken"
  display: HEAD + `
uniform sampler2D uDye; uniform vec2 uDyeTexel; uniform float uH; uniform float uSeed;
float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233)) + uSeed) * 43758.5453); }
void main(){
  float d = max(texture(uDye, vUv).r, 0.);
  float dx = texture(uDye, vUv + vec2(uDyeTexel.x * 1.5, 0.)).r - texture(uDye, vUv - vec2(uDyeTexel.x * 1.5, 0.)).r;
  float dy = texture(uDye, vUv + vec2(0., uDyeTexel.y * 1.5)).r - texture(uDye, vUv - vec2(0., uDyeTexel.y * 1.5)).r;
  vec3 n = normalize(vec3(-dx, -dy, .28));
  float light = dot(n, normalize(vec3(-.35, .65, .68)));

  float y = (1. - vUv.y) * uH;                    // Pixel unter der Wasserlinie
  vec3 bg = mix(vec3(.886, .89, .898), vec3(.955, .957, .962), smoothstep(0., 26., y));
  bg = mix(bg, vec3(1.), smoothstep(20., uH * .55, y));

  vec3 c2 = vec3(.549, .616, .937);  // #8C9DEF  dünne Schleier
  vec3 c3 = vec3(.137, .345, .988);  // #2358FC  Tinte
  vec3 c4 = vec3(.082, .278, .988);  // #1547FC  satt
  vec3 c5 = vec3(.020, .137, .522);  // #052385  dichter Kern
  vec3 c6 = vec3(.000, .078, .318);  // #001451
  vec3 ink = c2;
  ink = mix(ink, c3, smoothstep(.04, .32, d));
  ink = mix(ink, c4, smoothstep(.45, 1.0, d));
  ink = mix(ink, c5, smoothstep(1.3, 2.6, d));
  ink = mix(ink, c6, smoothstep(2.8, 4.8, d));
  float a = 1. - exp(-d * 7.);
  float l = clamp(light, 0., 1.);
  ink *= .78 + .3 * l;                                           // Schatten in den Falten
  ink = mix(ink, c2 * 1.05, pow(clamp(light - .6, 0., 1.), 2.) * 1.2 * smoothstep(.15, .9, d));  // helle Kanten
  vec3 col = mix(bg, ink, a);
  col += (hash(gl_FragCoord.xy) - .5) / 255.;
  o = vec4(col, 1.);
}`,
};

export function createInk(canvas, { dprCap = 1.5 } = {}) {
  const gl = canvas.getContext('webgl2', { alpha: false, antialias: false, depth: false, stencil: false, preserveDrawingBuffer: false, powerPreference: 'low-power' });
  if (!gl) return null;
  if (!gl.getExtension('EXT_color_buffer_float') && !gl.getExtension('EXT_color_buffer_half_float')) return null;

  // --- Grundgerüst ---
  const quad = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, quad);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(0);

  function shader(type, src) {
    const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
    return s;
  }
  const vs = shader(gl.VERTEX_SHADER, VS);
  function program(fsSrc) {
    const p = gl.createProgram();
    gl.attachShader(p, vs); gl.attachShader(p, shader(gl.FRAGMENT_SHADER, fsSrc));
    gl.bindAttribLocation(p, 0, 'aPos'); gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    const u = {};
    const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < n; i++) { const name = gl.getActiveUniform(p, i).name; u[name] = gl.getUniformLocation(p, name); }
    return { p, u };
  }
  let P;
  try { P = Object.fromEntries(Object.entries(FS).map(([k, src]) => [k, program(src)])); }
  catch (e) { console.warn('Tinte: Shader-Fehler, zeige Standbild.', e); return null; }

  function fbo(w, h, internal, format) {
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, internal, w, h, 0, format, gl.HALF_FLOAT, null);
    const fb = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    gl.viewport(0, 0, w, h); gl.clearColor(0, 0, 0, 1); gl.clear(gl.COLOR_BUFFER_BIT);
    return { tex, fb, w, h, tx: 1 / w, ty: 1 / h,
      bind(unit) { gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, tex); return unit; },
      free() { gl.deleteTexture(tex); gl.deleteFramebuffer(fb); } };
  }
  function dbl(w, h, internal, format) {
    let a = fbo(w, h, internal, format), b = fbo(w, h, internal, format);
    return { get read() { return a; }, get write() { return b; }, swap() { [a, b] = [b, a]; }, w, h, tx: 1 / w, ty: 1 / h,
      free() { a.free(); b.free(); } };
  }
  function blit(target) {
    if (target) { gl.viewport(0, 0, target.w, target.h); gl.bindFramebuffer(gl.FRAMEBUFFER, target.fb); }
    else { gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight); gl.bindFramebuffer(gl.FRAMEBUFFER, null); }
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  // Maske (z. B. versinkende Buchstaben) als Textur
  const maskTex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, maskTex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  let W = 0, H = 0, vel, dye, prs, div, crl, simW, simH, dyeW, dyeH;
  function resize() {
    const r = canvas.getBoundingClientRect();
    const w = Math.max(1, Math.round(r.width)), h = Math.max(1, Math.round(r.height));
    if (w === W && Math.abs(h - H) < 2) return false;
    W = w; H = h;
    const dpr = Math.min(window.devicePixelRatio || 1, dprCap);
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    const aspect = W / H;
    const SIM = 128, DYE = Math.min(560, Math.round(Math.min(W, H) * dpr));
    if (aspect >= 1) { simH = SIM; simW = Math.round(SIM * aspect); dyeH = DYE; dyeW = Math.round(DYE * aspect); }
    else { simW = SIM; simH = Math.round(SIM / aspect); dyeW = DYE; dyeH = Math.round(DYE / aspect); }
    [vel, dye, prs, div, crl].forEach((f) => f && f.free());
    vel = dbl(simW, simH, gl.RG16F, gl.RG);
    dye = dbl(dyeW, dyeH, gl.R16F, gl.RED);
    prs = dbl(simW, simH, gl.R16F, gl.RED);
    div = fbo(simW, simH, gl.R16F, gl.RED);
    crl = fbo(simW, simH, gl.R16F, gl.RED);
    return true;
  }
  resize();

  const use = (prog) => { gl.useProgram(prog.p); return prog.u; };

  function splatRaw(target, x, y, c, radius) {
    const u = use(P.splat);
    gl.uniform2f(u.uTexel, target.tx, target.ty);
    gl.uniform1i(u.uTarget, target.read.bind(0));
    gl.uniform1f(u.uAspect, W / H);
    gl.uniform2f(u.uPoint, x / W, 1 - y / H);
    gl.uniform3f(u.uColor, c[0], c[1], c[2] || 0);
    gl.uniform1f(u.uRadius, radius);
    blit(target.write); target.swap();
  }
  // Tropfen/Bewegung an Stelle (x, y) in CSS-Pixeln, Radius sigma in Pixeln.
  // vx/vy in Gitterzellen pro Sekunde (y nach unten).
  function splat(x, y, vx, vy, amount, sigma = 8) {
    const rad = (sigma / H) ** 2;
    if (vx || vy) splatRaw(vel, x, y, [vx, -vy, 0], rad * 2.2);
    if (amount) splatRaw(dye, x, y, [amount, 0, 0], rad);
  }

  function injectMask(source, dyeAmt, velDown) {
    gl.activeTexture(gl.TEXTURE0 + 3);
    gl.bindTexture(gl.TEXTURE_2D, maskTex);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    let u = use(P.mask);
    gl.uniform2f(u.uTexel, dye.tx, dye.ty);
    gl.uniform1i(u.uTarget, dye.read.bind(0)); gl.uniform1i(u.uMask, 3);
    gl.uniform3f(u.uAdd, dyeAmt, 0, 0);
    blit(dye.write); dye.swap();
    u = use(P.mask);
    gl.uniform2f(u.uTexel, vel.tx, vel.ty);
    gl.uniform1i(u.uTarget, vel.read.bind(0)); gl.uniform1i(u.uMask, 3);
    gl.uniform3f(u.uAdd, 0, -velDown, 0);
    blit(vel.write); vel.swap();
  }

  const params = { curl: 14, gravity: 22, ambient: 2.5, velDiss: 0.5, dyeDiss: 0.11, iterations: 20 };
  let time = 0;
  function step(dt) {
    time += dt;
    let u = use(P.curl);
    gl.uniform2f(u.uTexel, vel.tx, vel.ty);
    gl.uniform1i(u.uVelocity, vel.read.bind(0));
    blit(crl);

    u = use(P.forces);
    gl.uniform2f(u.uTexel, vel.tx, vel.ty);
    gl.uniform1i(u.uVelocity, vel.read.bind(0)); gl.uniform1i(u.uCurl, crl.bind(1)); gl.uniform1i(u.uDye, dye.read.bind(2));
    gl.uniform1f(u.uCurlAmt, params.curl); gl.uniform1f(u.uDt, dt); gl.uniform1f(u.uGravity, params.gravity);
    gl.uniform1f(u.uTime, time); gl.uniform1f(u.uAmbient, params.ambient);
    blit(vel.write); vel.swap();

    u = use(P.divergence);
    gl.uniform2f(u.uTexel, vel.tx, vel.ty);
    gl.uniform1i(u.uVelocity, vel.read.bind(0));
    blit(div);

    u = use(P.scale);
    gl.uniform2f(u.uTexel, prs.tx, prs.ty);
    gl.uniform1i(u.uTex, prs.read.bind(0)); gl.uniform1f(u.uValue, 0.8);
    blit(prs.write); prs.swap();

    u = use(P.pressure);
    gl.uniform2f(u.uTexel, prs.tx, prs.ty);
    gl.uniform1i(u.uDivergence, div.bind(1));
    for (let i = 0; i < params.iterations; i++) {
      gl.uniform1i(u.uPressure, prs.read.bind(0));
      blit(prs.write); prs.swap();
    }

    u = use(P.gradient);
    gl.uniform2f(u.uTexel, vel.tx, vel.ty);
    gl.uniform1i(u.uPressure, prs.read.bind(0)); gl.uniform1i(u.uVelocity, vel.read.bind(1));
    blit(vel.write); vel.swap();

    u = use(P.advect);
    gl.uniform2f(u.uTexel, vel.tx, vel.ty); gl.uniform2f(u.uSimTexel, vel.tx, vel.ty);
    gl.uniform1i(u.uVelocity, vel.read.bind(0)); gl.uniform1i(u.uSource, vel.read.bind(0));
    gl.uniform1f(u.uDt, dt); gl.uniform1f(u.uDiss, Math.exp(-params.velDiss * dt)); gl.uniform1f(u.uFloor, 1);
    blit(vel.write); vel.swap();

    u = use(P.advect);
    gl.uniform2f(u.uTexel, dye.tx, dye.ty); gl.uniform2f(u.uSimTexel, vel.tx, vel.ty);
    gl.uniform1i(u.uVelocity, vel.read.bind(0)); gl.uniform1i(u.uSource, dye.read.bind(1));
    gl.uniform1f(u.uDt, dt); gl.uniform1f(u.uDiss, Math.exp(-params.dyeDiss * dt)); gl.uniform1f(u.uFloor, 0.9);
    blit(dye.write); dye.swap();
  }

  const seed = Math.random() * 10;
  function render() {
    const u = use(P.display);
    gl.uniform2f(u.uTexel, dye.tx, dye.ty);
    gl.uniform2f(u.uDyeTexel, dye.tx, dye.ty);
    gl.uniform1i(u.uDye, dye.read.bind(0));
    gl.uniform1f(u.uH, H);
    gl.uniform1f(u.uSeed, seed);
    blit(null);
  }

  return {
    gl, params, step, render, splat, injectMask, resize,
    get width() { return W; }, get height() { return H; },
    get dyeSize() { return [dyeW, dyeH]; },
  };
}
