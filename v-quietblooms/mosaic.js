// Mosaik-Renderer: zeichnet ein Foto als grobes Pixel-Mosaik (große Quadrate).
// Ein "Fokus" (z. B. das Gesicht) bleibt scharf, rundherum werden die Blöcke stufenweise feiner.
// Dazu kommt eine "Lupe": um den Cursor herum werden die Blöcke ebenfalls feiner bis scharf.
// Stufen: B (grob) -> B/2 -> B/4 -> scharfes Foto. Gezeichnet wird nur, wenn sich etwas bewegt.

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const hash = (i, j) => { const s = Math.sin(i * 127.1 + j * 311.7) * 43758.5453; return s - Math.floor(s); };
const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export class Mosaic {
  /**
   * @param {HTMLCanvasElement} canvas
   * @param {HTMLImageElement} img  (muss geladen sein)
   * @param {object} o
   *   focus:  {x, y, rx, ry} – scharfer Bereich in Bildanteilen (rx/ry relativ zur Bildhöhe), oder null
   *   anchor: {x, y} – wohin der Fokus im Ausschnitt rutschen soll (0..1)
   *   cols, minBlock, maxBlock – Blockgröße in CSS-px (Breite / cols, begrenzt)
   *   lens – Radius der Lupe in CSS-px
   *   filter – Canvas-Filter für das Foto (Farbe kräftiger)
   *   shade – [[stop, rgba], ...] vertikaler Verlauf, per "multiply" über das Foto (dunklerer Fuß wie im Poster)
   */
  constructor(canvas, img, o = {}) {
    this.c = canvas;
    this.ctx = canvas.getContext('2d');
    this.img = img;
    this.o = Object.assign({
      focus: null, anchor: { x: 0.5, y: 0.5 }, cols: 30, minBlock: 28, maxBlock: 72,
      lens: 200, filter: 'saturate(1.22) contrast(1.05)', shade: null, jitter: 0.16, maxDpr: 1.5,
    }, o);
    this.lens = { x: 0, y: 0, tx: 0, ty: 0, k: 0, tk: 0, placed: false };
    this.raf = 0;
    this.visible = true;
    this.thr = [0.2, 0.44, 0.7];
    this.tick = this.tick.bind(this);
  }

  resize() {
    const r = this.c.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) return false;
    const o = this.o;
    const dpr = Math.min(o.maxDpr, window.devicePixelRatio || 1);
    const W = Math.round(r.width * dpr), H = Math.round(r.height * dpr);
    this.dpr = dpr; this.W = W; this.H = H; this.cssW = r.width;
    this.c.width = W; this.c.height = H;

    const bCss = clamp(r.width / o.cols, o.minBlock, o.maxBlock);
    const s = Math.max(2, Math.round((bCss * dpr) / 4));
    const B = s * 4;
    this.s = s; this.B = B;
    this.n = [[Math.ceil(W / B), Math.ceil(H / B)]];
    this.n[1] = [this.n[0][0] * 2, this.n[0][1] * 2];
    this.n[2] = [this.n[0][0] * 4, this.n[0][1] * 4];
    const CW = this.n[0][0] * B, CH = this.n[0][1] * B;

    // 1) Foto "cover" in eine Leinwand, die das Blockraster genau füllt
    const iw = this.img.naturalWidth, ih = this.img.naturalHeight;
    const sc = Math.max(CW / iw, CH / ih);
    const dw = iw * sc, dh = ih * sc;
    const f = o.focus || { x: 0.5, y: 0.5, rx: 0.2, ry: 0.2 };
    const ox = clamp(o.anchor.x * W - f.x * dw, CW - dw, 0);
    const oy = clamp(o.anchor.y * H - f.y * dh, CH - dh, 0);
    const cover = this.cover || document.createElement('canvas');
    cover.width = CW; cover.height = CH;
    const cc = cover.getContext('2d');
    cc.filter = o.filter || 'none';
    cc.drawImage(this.img, ox, oy, dw, dh);
    cc.filter = 'none';
    if (o.shade) {
      const g = cc.createLinearGradient(0, 0, 0, H);
      for (const [stop, col] of o.shade) g.addColorStop(stop, col);
      cc.globalCompositeOperation = 'multiply';
      cc.fillStyle = g; cc.fillRect(0, 0, CW, CH);
      cc.globalCompositeOperation = 'source-over';
    }
    if (o.vignette) {
      const cx = W / 2, cy = H * 0.42;
      const g = cc.createRadialGradient(cx, cy, Math.min(W, H) * 0.32, cx, cy, Math.hypot(W, H) * 0.6);
      g.addColorStop(0, '#fff'); g.addColorStop(1, o.vignette);
      cc.globalCompositeOperation = 'multiply';
      cc.fillStyle = g; cc.fillRect(0, 0, CW, CH);
      cc.globalCompositeOperation = 'source-over';
    }
    this.cover = cover;

    // Fokus in Geräte-Pixeln
    this.fx = ox + f.x * dw; this.fy = oy + f.y * dh;
    this.frx = f.rx * dh; this.fry = f.ry * dh;
    this.hasFocus = !!o.focus;

    // 2) Mittelwerte pro Block: auf feinstes Raster verkleinern, dann 2x2 zusammenfassen
    const [n2x, n2y] = this.n[2];
    const small = document.createElement('canvas');
    small.width = n2x; small.height = n2y;
    const sx = small.getContext('2d', { willReadFrequently: true });
    sx.imageSmoothingEnabled = true; sx.imageSmoothingQuality = 'high';
    sx.drawImage(cover, 0, 0, CW, CH, 0, 0, n2x, n2y);
    const d = sx.getImageData(0, 0, n2x, n2y).data;
    const rgb = [new Float32Array(n2x * n2y * 3)];
    for (let i = 0; i < n2x * n2y; i++) { rgb[0][i * 3] = d[i * 4]; rgb[0][i * 3 + 1] = d[i * 4 + 1]; rgb[0][i * 3 + 2] = d[i * 4 + 2]; }
    // rgb[0] = feinste Stufe (Level 2), daraus Level 1 und 0
    const down = (src, w, h) => {
      const w2 = w / 2, h2 = h / 2, out = new Float32Array(w2 * h2 * 3);
      for (let y = 0; y < h2; y++) for (let x = 0; x < w2; x++) for (let c = 0; c < 3; c++) {
        const a = ((y * 2) * w + x * 2) * 3 + c, b = ((y * 2 + 1) * w + x * 2) * 3 + c;
        out[(y * w2 + x) * 3 + c] = (src[a] + src[a + 3] + src[b] + src[b + 3]) / 4;
      }
      return out;
    };
    const l1 = down(rgb[0], n2x, n2y);
    const l0 = down(l1, n2x / 2, n2y / 2);
    const toStr = (arr) => { const out = new Array(arr.length / 3); for (let i = 0; i < out.length; i++) out[i] = `rgb(${arr[i * 3] | 0},${arr[i * 3 + 1] | 0},${arr[i * 3 + 2] | 0})`; return out; };
    this.col = [toStr(l0), toStr(l1), toStr(rgb[0])];
    this.raw0 = l0;
    this.draw();
    return true;
  }

  /** Farben der untersten sichtbaren groben Blockreihe (für das Pixel-Band unter dem Hero) */
  bottomRow(frac = 1) {
    const [nx] = this.n[0];
    const row = Math.floor((this.H * frac - 1) / this.B);
    const out = [];
    for (let i = 0; i < nx; i++) { const k = (row * nx + i) * 3; out.push([this.raw0[k], this.raw0[k + 1], this.raw0[k + 2]]); }
    return { colors: out, block: this.B / this.dpr };
  }

  fine(x, y, i, j, lv) {
    let face = 0;
    if (this.hasFocus) {
      const dx = (x - this.fx) / this.frx, dy = (y - this.fy) / this.fry;
      face = 1 - smooth(0.62, 1.6, Math.sqrt(dx * dx + dy * dy));
    }
    let lens = 0;
    const L = this.lens;
    if (L.k > 0.003) {
      const R = this.o.lens * this.dpr;
      const dx = x - L.x, dy = y - L.y;
      lens = L.k * (1 - smooth(R * 0.28, R, Math.sqrt(dx * dx + dy * dy)));
    }
    const f = Math.max(face, lens);
    if (f < 0.02) return f;
    return f + (hash(i + lv * 97.3, j + lv * 13.1) - 0.5) * this.o.jitter;
  }

  cell(lv, i, j) {
    const size = this.B >> lv;
    const x = i * size, y = j * size;
    if (x >= this.W || y >= this.H) return;
    const f = this.fine(x + size / 2, y + size / 2, i, j, lv);
    const ctx = this.ctx;
    if (f < this.thr[lv]) {
      ctx.fillStyle = this.col[lv][j * this.n[lv][0] + i];
      ctx.fillRect(x, y, size, size);
      return;
    }
    if (lv === 2) { ctx.drawImage(this.cover, x, y, size, size, x, y, size, size); return; }
    // ganz im scharfen Bereich? dann den ganzen Block auf einmal scharf zeichnen
    if (f > 0.98) { ctx.drawImage(this.cover, x, y, size, size, x, y, size, size); return; }
    const i2 = i * 2, j2 = j * 2;
    this.cell(lv + 1, i2, j2); this.cell(lv + 1, i2 + 1, j2);
    this.cell(lv + 1, i2, j2 + 1); this.cell(lv + 1, i2 + 1, j2 + 1);
  }

  draw() {
    if (!this.col) return;
    const [nx, ny] = this.n[0];
    for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) this.cell(0, i, j);
  }

  // Lupe: Position in CSS-px relativ zur Leinwand
  point(x, y) {
    const L = this.lens;
    L.tx = x * this.dpr; L.ty = y * this.dpr; L.tk = 1;
    if (!L.placed || L.k < 0.02) { L.x = L.tx; L.y = L.ty; L.placed = true; }
    this.kick();
  }
  release() { this.lens.tk = 0; this.kick(); }

  setVisible(v) { this.visible = v; if (v) this.kick(); }

  kick() { if (!this.raf && this.visible && this.col) this.raf = requestAnimationFrame(this.tick); }

  tick() {
    this.raf = 0;
    const L = this.lens;
    const instant = reduced();
    const e = instant ? 1 : 0.2, ek = instant ? 1 : 0.1;
    L.x += (L.tx - L.x) * e; L.y += (L.ty - L.y) * e; L.k += (L.tk - L.k) * ek;
    const moving = Math.abs(L.tx - L.x) > 0.5 || Math.abs(L.ty - L.y) > 0.5 || Math.abs(L.tk - L.k) > 0.004;
    if (!moving) { L.x = L.tx; L.y = L.ty; L.k = L.tk; }
    this.draw();
    if (moving) this.kick();
  }
}
