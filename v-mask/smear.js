// Der „Verschmier“-Effekt im Hero (WebGL).
// Idee wie im Plakat: zwei waagerechte Bänder des Gesichts werden zur Seite gezogen
// (Stirn/Haare oben, Nase/Wange unten), die Augen dazwischen bleiben stehen.
// Technik: pro Bildpunkt wird die Leseposition im Foto verschoben (= Dehnen der Pixelzeilen),
// und hinter dem Kopf wird die letzte Kantenfarbe weitergezogen („Pixel-Stretch“).

const VERT = `
attribute vec2 a_pos;
void main(){ gl_Position = vec4(a_pos, 0.0, 1.0); }`;

const FRAG = `
precision highp float;
uniform sampler2D u_img;
uniform vec2  u_res;    // Canvas-Größe in Pixeln
uniform vec4  u_rect;   // Foto-Rechteck im Canvas: x, y, w, h
uniform vec2  u_crop;   // welcher Ausschnitt (oben/unten) des Fotos gezeigt wird
uniform vec2  u_p;      // Anker: x = ab hier wird gezogen, y = Augenhöhe (Mitte zwischen den Bändern)
uniform float u_amt;    // Stärke 0..~1.6
uniform float u_bw;     // Abstand Mitte -> Band (px)
uniform float u_time;
uniform float u_limit;  // ab hier läuft der Schmier aus (damit er nicht unter dem Kleingedruckten liegt)

vec4 src(vec2 p){
  vec2 uv = (p - u_rect.xy) / u_rect.zw;
  if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) return vec4(0.0);
  uv.y = mix(u_crop.x, u_crop.y, uv.y);
  return texture2D(u_img, uv);
}

float bandAt(float y){
  float dy = (y - u_p.y) / u_bw;
  // oberes Band etwas breiter (Stirn + Haare), unteres schmaler (Nase/Wange)
  // flache Kuppe (4. Potenz) -> Bänder mit fast parallelen Kanten, wie Stoffbahnen
  float up = exp(-pow((dy + 1.2) / 0.6, 4.0));
  float dn = exp(-pow((dy - 0.78) / 0.38, 4.0));
  return up + dn * 0.85;
}

vec2 mapP(vec2 p){
  float b = bandAt(p.y) * u_amt;
  float d = p.x - u_p.x;
  vec2 q = p;
  if (d > 0.0 && b > 0.001) {
    float s = 1.0 + b * 3.4;               // Dehnfaktor
    q.x = u_p.x + d / s;
    // leichte Welle, damit die Streifen wie im Plakat geschwungen sind
    float k = smoothstep(0.0, u_rect.z * 0.35, d);
    q.y += sin(d * 0.0085 - 0.6 + u_time * 0.55) * u_bw * 0.55 * b * k;
  }
  return q;
}

void main(){
  vec2 p = vec2(gl_FragCoord.x, u_res.y - gl_FragCoord.y);
  vec2 q = mapP(p);
  vec4 c = src(q);

  // Pixel-Stretch: rechts vom Kopf die Kantenfarbe weiterziehen
  float b = bandAt(p.y) * u_amt;
  if (c.a < 0.92 && b > 0.03 && p.x > u_p.x) {
    float L = b * u_rect.z * 0.5;          // Länge der Spur
    vec4 hit = vec4(0.0);
    float dist = 0.0;
    for (int i = 1; i <= 140; i++) {
      float t = float(i) / 140.0;
      vec2 pp = p - vec2(t * L, 0.0);
      if (pp.x < u_p.x) break;
      vec4 c2 = src(mapP(pp));
      if (c2.a > 0.85) { hit = c2; dist = t; break; }
    }
    if (hit.a > 0.0) {
      float fade = 1.0 - smoothstep(0.78, 1.0, dist);
      vec4 trail = hit * fade;
      c = trail + c * (1.0 - trail.a);       // „über“ das Original legen
    }
  }

  // weich auslaufen lassen vor der rechten Textspalte
  if (b > 0.01) c *= 1.0 - smoothstep(u_limit - 220.0, u_limit, p.x) * smoothstep(0.0, 0.08, b);

  // Schwarz-Weiß wie im Plakat: Helligkeit, etwas mehr Kontrast
  vec3 rgb = c.a > 0.0 ? c.rgb / c.a : vec3(0.0);
  float l = dot(rgb, vec3(0.30, 0.59, 0.11));
  l = clamp((l - 0.45) * 1.32 + 0.47, 0.0, 1.0);
  l = pow(l, 1.06);
  gl_FragColor = vec4(vec3(l) * c.a, c.a);
}`;

export function createSmear(canvas, img, opts = {}) {
  const gl = canvas.getContext('webgl', { premultipliedAlpha: true, alpha: true, antialias: false });
  if (!gl) return null;

  const sh = (type, code) => {
    const s = gl.createShader(type);
    gl.shaderSource(s, code); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { console.warn(gl.getShaderInfoLog(s)); return null; }
    return s;
  };
  const vs = sh(gl.VERTEX_SHADER, VERT), fs = sh(gl.FRAGMENT_SHADER, FRAG);
  if (!vs || !fs) return null;
  const prog = gl.createProgram();
  gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null;
  gl.useProgram(prog);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'a_pos');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  const U = {};
  for (const n of ['u_res', 'u_rect', 'u_crop', 'u_p', 'u_amt', 'u_bw', 'u_time', 'u_limit']) U[n] = gl.getUniformLocation(prog, n);

  const crop = opts.crop || [0, 1];
  gl.uniform2f(U.u_crop, crop[0], crop[1]);

  let dpr = 1;
  const state = { rect: [0, 0, 1, 1], p: [0, 0], amt: 0, bw: 40, time: 0 };

  function resize(cssW, cssH, rect) {
    dpr = Math.min(window.devicePixelRatio || 1, cssW > 1200 ? 1.5 : 2);
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
    gl.viewport(0, 0, canvas.width, canvas.height);
    state.rect = rect.map(v => v * dpr);
  }

  function draw({ x, y, amt, bw, time, limit = 1e5 }) {
    gl.uniform2f(U.u_res, canvas.width, canvas.height);
    gl.uniform4f(U.u_rect, ...state.rect);
    gl.uniform2f(U.u_p, x * dpr, y * dpr);
    gl.uniform1f(U.u_amt, amt);
    gl.uniform1f(U.u_bw, bw * dpr);
    gl.uniform1f(U.u_time, time);
    gl.uniform1f(U.u_limit, limit * dpr);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  return { resize, draw };
}
