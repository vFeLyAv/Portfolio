// Kleiner QR-Encoder ohne Pakete (Byte-Modus, Fehlerkorrektur M, Version 1–4).
// Aufbau nach der QR-Norm (ISO 18004), Platzierung wie bei Nayukis Referenz-Implementierung.
// Rückgabe: 2D-Array modules[y][x] (true = schwarz).

// --- Rechnen im Galois-Feld GF(256), Polynom 0x11D (für Reed-Solomon) ---
const EXP = new Array(512);
const LOG = new Array(256);
(() => {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    EXP[i] = x; LOG[x] = i;
    x <<= 1; if (x & 0x100) x ^= 0x11d;
  }
  for (let i = 255; i < 512; i++) EXP[i] = EXP[i - 255];
})();
const mul = (a, b) => (a === 0 || b === 0 ? 0 : EXP[LOG[a] + LOG[b]]);

function rsGenerator(n) {
  let g = [1];
  for (let i = 0; i < n; i++) {
    const ng = new Array(g.length + 1).fill(0);
    for (let j = 0; j < g.length; j++) { ng[j] ^= g[j]; ng[j + 1] ^= mul(g[j], EXP[i]); }
    g = ng;
  }
  return g;
}

export function rsEncode(data, n) {
  const g = rsGenerator(n);
  const res = data.concat(new Array(n).fill(0));
  for (let i = 0; i < data.length; i++) {
    const c = res[i];
    if (c !== 0) for (let j = 0; j < g.length; j++) res[i + j] ^= mul(g[j], c);
  }
  return res.slice(data.length);
}

// Version → [ECC-Codewörter pro Block, Anzahl Blöcke, Daten-Codewörter pro Block] für Stufe M
const TABLE_M = { 1: [10, 1, 16], 2: [16, 1, 28], 3: [26, 1, 44], 4: [18, 2, 32] };
const ALIGN = { 1: [], 2: [6, 18], 3: [6, 22], 4: [6, 26] };

export function formatBits(mask) {
  const data = (0b00 << 3) | mask; // 00 = Stufe M
  let rem = data;
  for (let i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
  return ((data << 10) | rem) ^ 0x5412;
}

export function encodeQR(text) {
  const bytes = Array.from(new TextEncoder().encode(text));
  let version = 1;
  while (version <= 4) {
    const [, blocks, dpb] = TABLE_M[version];
    if (4 + 8 + bytes.length * 8 <= blocks * dpb * 8) break;
    version++;
  }
  if (version > 4) throw new Error('Text zu lang für diesen kleinen QR-Encoder');
  const [eccLen, blocks, dpb] = TABLE_M[version];
  const capacity = blocks * dpb;

  // 1) Bitstrom: Modus 0100 (Byte), Länge (8 Bit), Daten, Terminator, Auffüllen
  const bits = [];
  const push = (val, len) => { for (let i = len - 1; i >= 0; i--) bits.push((val >>> i) & 1); };
  push(0b0100, 4); push(bytes.length, 8);
  bytes.forEach(b => push(b, 8));
  push(0, Math.min(4, capacity * 8 - bits.length));
  while (bits.length % 8) bits.push(0);
  const data = [];
  for (let i = 0; i < bits.length; i += 8) data.push(parseInt(bits.slice(i, i + 8).join(''), 2));
  for (let pad = 0xec; data.length < capacity; pad ^= 0xec ^ 0x11) data.push(pad);

  // 2) Blöcke + Reed-Solomon, dann verschachteln
  const dBlocks = [], eBlocks = [];
  for (let b = 0; b < blocks; b++) {
    const d = data.slice(b * dpb, (b + 1) * dpb);
    dBlocks.push(d); eBlocks.push(rsEncode(d, eccLen));
  }
  const codewords = [];
  for (let i = 0; i < dpb; i++) dBlocks.forEach(d => codewords.push(d[i]));
  for (let i = 0; i < eccLen; i++) eBlocks.forEach(e => codewords.push(e[i]));

  // 3) Matrix mit Funktionsmustern
  const size = version * 4 + 17;
  const mod = Array.from({ length: size }, () => new Array(size).fill(false));
  const fn = Array.from({ length: size }, () => new Array(size).fill(false));
  const set = (x, y, dark) => { mod[y][x] = dark; fn[y][x] = true; };

  for (let i = 0; i < size; i++) { set(6, i, i % 2 === 0); set(i, 6, i % 2 === 0); }
  const finder = (cx, cy) => {
    for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) {
      const x = cx + dx, y = cy + dy;
      if (x < 0 || y < 0 || x >= size || y >= size) continue;
      const d = Math.max(Math.abs(dx), Math.abs(dy));
      set(x, y, d !== 2 && d !== 4);
    }
  };
  finder(3, 3); finder(size - 4, 3); finder(3, size - 4);
  const al = ALIGN[version];
  for (let i = 0; i < al.length; i++) for (let j = 0; j < al.length; j++) {
    const last = al.length - 1;
    if ((i === 0 && j === 0) || (i === 0 && j === last) || (i === last && j === 0)) continue;
    for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++)
      set(al[i] + dx, al[j] + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
  }
  const drawFormat = (mask) => {
    const f = formatBits(mask);
    const bit = i => ((f >>> i) & 1) === 1;
    for (let i = 0; i <= 5; i++) set(8, i, bit(i));
    set(8, 7, bit(6)); set(8, 8, bit(7)); set(7, 8, bit(8));
    for (let i = 9; i < 15; i++) set(14 - i, 8, bit(i));
    for (let i = 0; i < 8; i++) set(size - 1 - i, 8, bit(i));
    for (let i = 8; i < 15; i++) set(8, size - 15 + i, bit(i));
    set(8, size - 8, true); // dunkles Modul
  };
  drawFormat(0); // reserviert die Format-Bereiche

  // 4) Daten im Zickzack platzieren
  let bi = 0;
  const total = codewords.length * 8;
  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5;
    for (let vert = 0; vert < size; vert++) {
      for (let j = 0; j < 2; j++) {
        const x = right - j;
        const upward = ((right + 1) & 2) === 0;
        const y = upward ? size - 1 - vert : vert;
        if (!fn[y][x]) {
          mod[y][x] = bi < total ? ((codewords[bi >>> 3] >>> (7 - (bi & 7))) & 1) === 1 : false;
          bi++;
        }
      }
    }
  }

  // 5) beste Maske wählen
  const maskFn = [
    (x, y) => (x + y) % 2 === 0,
    (x, y) => y % 2 === 0,
    (x, y) => x % 3 === 0,
    (x, y) => (x + y) % 3 === 0,
    (x, y) => (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0,
    (x, y) => ((x * y) % 2) + ((x * y) % 3) === 0,
    (x, y) => (((x * y) % 2) + ((x * y) % 3)) % 2 === 0,
    (x, y) => (((x + y) % 2) + ((x * y) % 3)) % 2 === 0,
  ];
  const applyMask = (m) => {
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++)
      if (!fn[y][x] && maskFn[m](x, y)) mod[y][x] = !mod[y][x];
  };
  let best = 0, bestScore = Infinity;
  for (let m = 0; m < 8; m++) {
    applyMask(m); drawFormat(m);
    const s = penalty(mod, size);
    if (s < bestScore) { bestScore = s; best = m; }
    applyMask(m); // rückgängig (XOR)
  }
  applyMask(best); drawFormat(best);
  return mod;
}

function penalty(m, size) {
  let score = 0;
  // Regel 1: Läufe von 5+ gleichen Modulen
  for (let a = 0; a < size; a++) {
    for (const horiz of [true, false]) {
      let run = 1;
      for (let b = 1; b < size; b++) {
        const cur = horiz ? m[a][b] : m[b][a];
        const prev = horiz ? m[a][b - 1] : m[b - 1][a];
        if (cur === prev) { run++; if (run === 5) score += 3; else if (run > 5) score++; }
        else run = 1;
      }
    }
  }
  // Regel 2: 2×2-Blöcke
  for (let y = 0; y < size - 1; y++) for (let x = 0; x < size - 1; x++) {
    const c = m[y][x];
    if (c === m[y][x + 1] && c === m[y + 1][x] && c === m[y + 1][x + 1]) score += 3;
  }
  // Regel 3: finder-ähnliche Muster
  const pats = ['10111010000', '00001011101'];
  for (let a = 0; a < size; a++) {
    let row = '', col = '';
    for (let b = 0; b < size; b++) { row += m[a][b] ? 1 : 0; col += m[b][a] ? 1 : 0; }
    for (const p of pats) for (const s of [row, col]) {
      let i = s.indexOf(p);
      while (i !== -1) { score += 40; i = s.indexOf(p, i + 1); }
    }
  }
  // Regel 4: Hell/Dunkel-Balance
  let dark = 0;
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) if (m[y][x]) dark++;
  const k = Math.ceil(Math.abs(dark * 20 - size * size * 10) / (size * size)) - 1;
  return score + Math.max(0, k) * 10;
}

// Zeichnet die Matrix als SVG (mit 4 Modulen Ruhezone)
export function qrSVG(text, { dark = '#000', light = '#fff' } = {}) {
  const m = encodeQR(text);
  const n = m.length, q = 4, s = n + q * 2;
  let d = '';
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (m[y][x]) d += `M${x + q} ${y + q}h1v1h-1z`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${s} ${s}" shape-rendering="crispEdges" aria-hidden="true"><rect width="${s}" height="${s}" fill="${light}"/><path d="${d}" fill="${dark}"/></svg>`;
}
