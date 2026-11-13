// Plattenspieler für den Abend-Teil (übernommen aus der Vinyl-Variante, angepasst):
// Musik wird im Browser erzeugt (OfflineAudioContext) und über einen AudioWorklet mit
// vorzeichenbehaftetem Lesekopf abgespielt: Platte rückwärts drehen = rückwärts hören.
// Ton gibt es erst nach einem Klick (Start oder Platte anfassen).

const TAU = Math.PI * 2;
const REV = 1.8;                       // Sekunden Audio pro Umdrehung (33⅓ U/min)
const reduceMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

/* =========================================================
   2) Audio: Lo-Fi-Loop erzeugen
   ========================================================= */
function mulberry32(a) {
  return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const mtof = (m) => 440 * 2 ** ((m - 69) / 12);

// Erzeugt einen nahtlosen Loop (8 Takte, 84 BPM, ca. 22,9 s). Rückgabe: { L, R, sr }
async function renderLoop(sr = 44100) {
  const BPM = 84, beat = 60 / BPM, bar = beat * 4, BARS = 8, LEN = bar * BARS, TAIL = 3;
  const N = Math.round(LEN * sr), TN = Math.round(TAIL * sr);
  const ctx = new OfflineAudioContext(2, N + TN, sr);
  const rnd = mulberry32(7);
  const stopAt = LEN + TAIL;

  // Summe: leichte Sättigung, warmer Tiefpass
  const sum = ctx.createGain(); sum.gain.value = 0.8;
  const sat = ctx.createWaveShaper();
  { const n = 2048, c = new Float32Array(n), k = 1.5; for (let i = 0; i < n; i++) { const x = (i / (n - 1)) * 2 - 1; c[i] = Math.tanh(k * x) / Math.tanh(k); } sat.curve = c; }
  const tone = ctx.createBiquadFilter(); tone.type = 'lowpass'; tone.frequency.value = 5600; tone.Q.value = 0.4;
  sum.connect(sat); sat.connect(tone); tone.connect(ctx.destination);

  // Hall (künstliche Impulsantwort)
  const verb = ctx.createConvolver();
  { const len = Math.round(2.4 * sr), ir = ctx.createBuffer(2, len, sr);
    for (let ch = 0; ch < 2; ch++) { const d = ir.getChannelData(ch); let lp = 0; for (let i = 0; i < len; i++) { lp += ((rnd() * 2 - 1) - lp) * 0.35; d[i] = lp * (1 - i / len) ** 2.8; } }
    verb.buffer = ir; }
  const verbIn = ctx.createGain(); verbIn.gain.value = 0.32; verbIn.connect(verb); verb.connect(tone);

  // Rauschquelle
  const noise = ctx.createBuffer(1, sr * 2, sr);
  { const d = noise.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = rnd() * 2 - 1; }
  const noiseSrc = (t, dur) => { const s = ctx.createBufferSource(); s.buffer = noise; s.loop = true; s.start(t, rnd() * 1.5); s.stop(t + dur); return s; };

  // Busse
  const drums = ctx.createGain(); drums.gain.value = 0.9;
  const drumLP = ctx.createBiquadFilter(); drumLP.type = 'lowpass'; drumLP.frequency.value = 8000;
  drums.connect(drumLP); drumLP.connect(sum);

  const keys = ctx.createGain(); keys.gain.value = 0.15;
  const duck = ctx.createGain(); duck.gain.value = 1;          // pumpt mit der Kick
  const trem = ctx.createGain(); trem.gain.value = 0.86;       // Tremolo wie bei einem E-Piano
  const keysLP = ctx.createBiquadFilter(); keysLP.type = 'lowpass'; keysLP.frequency.value = 2100; keysLP.Q.value = 0.3;
  keys.connect(duck); duck.connect(trem); trem.connect(keysLP); keysLP.connect(sum);
  const keysSend = ctx.createGain(); keysSend.gain.value = 0.55; keysLP.connect(keysSend); keysSend.connect(verbIn);
  // LFOs mit ganzzahligen Perioden im Loop, damit der Übergang nahtlos ist
  const lfo = (cyclesPerLoop, depth) => { const o = ctx.createOscillator(); o.frequency.value = cyclesPerLoop / LEN; const g = ctx.createGain(); g.gain.value = depth; o.connect(g); o.start(0); o.stop(stopAt); return g; };
  lfo(Math.round(4.3 * LEN), 0.14).connect(trem.gain);
  const wow = lfo(Math.round(0.45 * LEN), 7);   // leichtes Leiern (±7 Cent) für die Tasten

  const bass = ctx.createGain(); bass.gain.value = 0.42;
  const bassLP = ctx.createBiquadFilter(); bassLP.type = 'lowpass'; bassLP.frequency.value = 480;
  bass.connect(bassLP); bassLP.connect(sum);

  const lead = ctx.createGain(); lead.gain.value = 0.06;
  const leadDelay = ctx.createDelay(2); leadDelay.delayTime.value = beat * 0.75;
  const fb = ctx.createGain(); fb.gain.value = 0.33;
  lead.connect(sum); lead.connect(leadDelay); leadDelay.connect(fb); fb.connect(leadDelay); fb.connect(sum);
  const leadSend = ctx.createGain(); leadSend.gain.value = 0.8; lead.connect(leadSend); leadSend.connect(verbIn);

  // Instrumente
  const kick = (t, v) => {
    t = Math.max(0, t);
    const o = ctx.createOscillator(); o.type = 'sine';
    o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(52, t + 0.09); o.frequency.exponentialRampToValueAtTime(42, t + 0.4);
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + 0.004); g.gain.exponentialRampToValueAtTime(0.001, t + 0.42);
    o.connect(g); g.connect(drums); o.start(t); o.stop(t + 0.45);
    duck.gain.setValueAtTime(0.55, t); duck.gain.linearRampToValueAtTime(1, t + 0.28);
  };
  const snare = (t, v) => {
    t = Math.max(0, t);
    const n = noiseSrc(t, 0.3);
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1800; bp.Q.value = 0.7;
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v * 0.5, t + 0.002); g.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
    n.connect(bp); bp.connect(g); g.connect(drums);
    const s = ctx.createGain(); s.gain.value = 0.45; g.connect(s); s.connect(verbIn);
    const o = ctx.createOscillator(); o.type = 'triangle'; o.frequency.setValueAtTime(190, t); o.frequency.exponentialRampToValueAtTime(150, t + 0.1);
    const g2 = ctx.createGain(); g2.gain.setValueAtTime(0.0001, t); g2.gain.exponentialRampToValueAtTime(v * 0.3, t + 0.002); g2.gain.exponentialRampToValueAtTime(0.001, t + 0.11);
    o.connect(g2); g2.connect(drums); o.start(t); o.stop(t + 0.12);
  };
  const hat = (t, v) => {
    t = Math.max(0, t);
    const n = noiseSrc(t, 0.08);
    const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 7200;
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + 0.002); g.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
    n.connect(hp); hp.connect(g); g.connect(drums);
  };
  const epNote = (m, t, dur, v) => {
    const f = mtof(m);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + 0.012);
    g.gain.setTargetAtTime(v * 0.45, t + 0.012, 0.6); g.gain.setTargetAtTime(0, t + dur, 0.22);
    const o1 = ctx.createOscillator(); o1.type = 'sine'; o1.frequency.value = f;
    const o2 = ctx.createOscillator(); o2.type = 'triangle'; o2.frequency.value = f; o2.detune.value = 5;
    const o2g = ctx.createGain(); o2g.gain.value = 0.35;
    const o3 = ctx.createOscillator(); o3.type = 'sine'; o3.frequency.value = f * 4.01;   // Glockenanteil des Anschlags
    const o3g = ctx.createGain(); o3g.gain.setValueAtTime(v * 0.18, t); o3g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
    wow.connect(o1.detune); wow.connect(o2.detune);
    o1.connect(g); o2.connect(o2g); o2g.connect(g); o3.connect(o3g); o3g.connect(keys); g.connect(keys);
    const end = t + dur + 1.6;
    for (const o of [o1, o2, o3]) { o.start(t); o.stop(end); }
  };
  const bassNote = (m, t, dur, v) => {
    const f = mtof(m);
    const g = ctx.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + 0.012); g.gain.setTargetAtTime(v * 0.7, t + 0.02, 0.4); g.gain.setTargetAtTime(0, t + dur, 0.05);
    const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = f;
    const o2 = ctx.createOscillator(); o2.type = 'triangle'; o2.frequency.value = f;
    const o2g = ctx.createGain(); o2g.gain.value = 0.25;
    o.connect(g); o2.connect(o2g); o2g.connect(g); g.connect(bass);
    o.start(t); o2.start(t); o.stop(t + dur + 0.4); o2.stop(t + dur + 0.4);
  };
  const leadNote = (m, t, dur) => {
    const f = mtof(m);
    const g = ctx.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(1, t + 0.02); g.gain.setTargetAtTime(0.5, t + 0.03, 0.3); g.gain.setTargetAtTime(0, t + dur, 0.12);
    const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = f;
    const vib = ctx.createOscillator(); vib.frequency.value = 5.2; const vg = ctx.createGain(); vg.gain.value = 6; vib.connect(vg); vg.connect(o.detune);
    o.connect(g); g.connect(lead);
    o.start(t); vib.start(t); o.stop(t + dur + 1); vib.stop(t + dur + 1);
  };

  // Akkorde: Fmaj9, Em9, Dm9, Cmaj9, je zwei Takte
  const prog = [
    { root: 41, notes: [57, 60, 64, 67] },
    { root: 40, notes: [55, 59, 62, 66] },
    { root: 38, notes: [53, 57, 60, 64] },
    { root: 36, notes: [52, 55, 59, 62] },
  ];
  const s16 = beat / 4, swing = beat * 0.09;
  const hum = () => (rnd() - 0.5) * 0.012;
  for (let b = 0; b < BARS; b++) {
    const t0 = b * bar;
    // Schlagzeug
    const kicks = [0, 10]; if (b % 2 === 1) kicks.push(7); if (b === 3 || b === 7) kicks.push(15);
    for (const s of kicks) kick(t0 + s * s16 + hum() * 0.5, s === 7 || s === 15 ? 0.6 : 0.95);
    snare(t0 + 4 * s16 + hum(), 0.9); snare(t0 + 12 * s16 + hum(), 0.95);
    if (b === 7) snare(t0 + 15 * s16 + swing, 0.3);
    for (let s = 0; s < 16; s += 2) hat(t0 + s * s16 + (s % 4 === 2 ? swing : 0) + hum(), (s % 4 === 0 ? 0.22 : 0.13) * (0.8 + rnd() * 0.4));
    if (rnd() < 0.6) hat(t0 + 15 * s16 + swing, 0.06);
    // Harmonie
    const ch = prog[Math.floor(b / 2)], second = b % 2 === 1;
    const strum = (t, v, dur) => ch.notes.forEach((m, i) => epNote(m, t + i * 0.018, dur, v));
    if (!second) strum(t0 + 0.01, 0.55, bar * 1.35);
    else strum(t0 + 1.5 * beat + swing, 0.32, beat * 2.3);
    // Bass
    const r = ch.root;
    if (!second) { bassNote(r, t0, s16 * 5, 0.9); bassNote(r, t0 + 6 * s16 + swing, s16 * 2, 0.6); bassNote(r + 7, t0 + 10 * s16, s16 * 5, 0.7); }
    else { bassNote(r, t0, s16 * 6, 0.85); bassNote(r + 12, t0 + 8 * s16, s16 * 3, 0.5); bassNote(r + 7, t0 + 12 * s16, s16 * 3.5, 0.65); }
  }
  // kleine Melodie (Takte 3-4 und 7-8)
  const mel = [[8.5, 76, 0.5], [9, 79, 0.5], [9.5, 81, 1.5], [11.5, 79, 0.5], [12, 76, 2.5],
    [24.5, 76, 0.5], [25, 79, 0.5], [25.5, 84, 1], [26.5, 83, 0.5], [27, 79, 1], [28, 81, 2.5]];
  for (const [bt, m, d] of mel) leadNote(m, bt * beat + (bt % 1 ? swing : 0), d * beat);

  // Knistern der Platte (direkt als Buffer, exakt Loop-lang)
  const cr = ctx.createBuffer(2, N, sr);
  for (let c = 0; c < 2; c++) {
    const d = cr.getChannelData(c); let lp = 0, click = 0;
    for (let i = 0; i < N; i++) {
      const w = rnd() * 2 - 1; lp += (w - lp) * 0.05;
      if (rnd() < 0.00012) click = (rnd() < 0.5 ? -1 : 1) * (0.06 + rnd() ** 3 * 0.5);
      d[i] = (w - lp) * 0.012 + click; click *= -0.62;
    }
  }
  const crSrc = ctx.createBufferSource(); crSrc.buffer = cr;
  const crHP = ctx.createBiquadFilter(); crHP.type = 'highpass'; crHP.frequency.value = 900;
  const crG = ctx.createGain(); crG.gain.value = 0.35;
  crSrc.connect(crHP); crHP.connect(crG); crG.connect(tone); crSrc.start(0);

  const out = await ctx.startRendering();
  // Nachhall vom Ende auf den Anfang falten → nahtloser Loop, dann normalisieren
  const res = [];
  let peak = 0;
  for (let c = 0; c < 2; c++) {
    const src = out.getChannelData(c), dst = new Float32Array(N);
    dst.set(src.subarray(0, N));
    for (let i = 0; i < TN; i++) dst[i] += src[N + i];
    for (let i = 0; i < N; i++) { const v = Math.abs(dst[i]); if (v > peak) peak = v; }
    res.push(dst);
  }
  const k = peak > 0 ? 0.89 / peak : 1;
  for (const d of res) for (let i = 0; i < N; i++) d[i] *= k;
  return { L: res[0], R: res[1], sr };
}

/* =========================================================
   3) Abspiel-Kern: läuft im AudioWorklet (Fallback: ScriptProcessor).
   pos = Position im Audio in Sekunden (ohne Umbruch), vel = Abspielrate (1 = normal, negativ = rückwärts).
   Modus 0: Motor zieht vel zur Sollrate. Modus 1: Scratch, vel folgt der Fingerposition.
   ========================================================= */
class DeckCore {
  constructor(sr) {
    this.sr = sr; this.L = null; this.R = null; this.n = 0; this.bsr = sr;
    this.pos = 0; this.vel = 0; this.offset = 0;
    this.mode = 0; this.motor = 0; this.accel = 0; this.aM = 1 - Math.exp(-1 / (sr * 0.3));
    this.tgt = 0; this.tv = 0; this.age = 0;
    this.g = 0; this.nd = 0; this.ndT = 0;
    this.lpL = 0; this.lpR = 0; this.xL = 0; this.yL = 0; this.xR = 0; this.yR = 0;
  }
  message(m) {
    if (m.type === 'buffer') { this.L = m.L; this.R = m.R || m.L; this.n = m.L.length; this.bsr = m.sr; if (m.restart) this.offset = this.pos; }
    else if (m.type === 'init') { this.pos = m.pos; this.vel = m.vel; }
    else if (m.type === 'motor') { this.mode = 0; this.motor = m.rate; this.accel = m.accel || 0; this.aM = 1 - Math.exp(-1 / (this.sr * (m.tau || 0.3))); }
    else if (m.type === 'scratch') { this.mode = 1; this.tgt = m.pos; this.tv = m.tv || 0; this.age = 0; }
    else if (m.type === 'needle') { this.ndT = m.on ? 1 : 0; }
  }
  process(outL, outR, len) {
    const inv = 1 / this.sr;
    const aS = 1 - Math.exp(-inv / 0.007);   // Glättung der Scratch-Geschwindigkeit (7 ms)
    const aG = 1 - Math.exp(-inv / 0.004);
    const aN = 1 - Math.exp(-inv / 0.012);   // Nadel auf/ab (12 ms)
    const L = this.L, R = this.R, n = this.n, k = this.bsr;
    let pos = this.pos, vel = this.vel, g = this.g, nd = this.nd;
    let lpL = this.lpL, lpR = this.lpR, xL = this.xL, yL = this.yL, xR = this.xR, yR = this.yR;
    for (let i = 0; i < len; i++) {
      if (this.mode === 1) {
        // Ziel = letzte Fingerposition, für max. 60 ms mit Fingertempo fortgeschrieben
        const t = this.tgt + this.tv * (this.age < 0.06 ? this.age : 0.06);
        this.age += inv;
        let want = (t - pos) * 40;               // Abstand in 25 ms aufholen
        if (want > 16) want = 16; else if (want < -16) want = -16;
        vel += (want - vel) * aS;
      } else if (this.accel > 0) {               // lineares Auslaufen (Strom aus)
        const d = this.motor - vel, st = this.accel * inv;
        vel += d > st ? st : d < -st ? -st : d;
      } else {
        vel += (this.motor - vel) * this.aM;
      }
      pos += vel * inv;

      let sl = 0, sr = 0;
      if (n > 3) {
        const x = (pos - this.offset) * k;
        let i1 = Math.floor(x); const f = x - i1;
        i1 %= n; if (i1 < 0) i1 += n;
        const i0 = i1 === 0 ? n - 1 : i1 - 1, i2 = i1 + 1 === n ? 0 : i1 + 1, i3 = i2 + 1 === n ? 0 : i2 + 1;
        // 4-Punkt-Hermite-Interpolation
        let a = L[i0], b = L[i1], c = L[i2], d = L[i3];
        let c1 = 0.5 * (c - a), c2 = a - 2.5 * b + 2 * c - 0.5 * d, c3 = 0.5 * (d - a) + 1.5 * (b - c);
        sl = ((c3 * f + c2) * f + c1) * f + b;
        a = R[i0]; b = R[i1]; c = R[i2]; d = R[i3];
        c1 = 0.5 * (c - a); c2 = a - 2.5 * b + 2 * c - 0.5 * d; c3 = 0.5 * (d - a) + 1.5 * (b - c);
        sr = ((c3 * f + c2) * f + c1) * f + b;
      }
      const sp = vel < 0 ? -vel : vel;
      const lpa = sp > 1 ? 1 / sp : 1;          // grober Schutz gegen Aliasing bei schnellem Scratch
      lpL += (sl - lpL) * lpa; lpR += (sr - lpR) * lpa;
      const gt = sp >= 0.25 ? 1 : sp * 4;        // langsam = leiser (wie ein echter Tonabnehmer)
      g += (gt - g) * aG; nd += (this.ndT - nd) * aN;
      const oL = lpL * g * nd, oR = lpR * g * nd;
      yL = oL - xL + 0.996 * yL; xL = oL;        // Gleichanteil entfernen
      yR = oR - xR + 0.996 * yR; xR = oR;
      outL[i] = yL; if (outR !== outL) outR[i] = yR;
    }
    this.pos = pos; this.vel = vel; this.g = g; this.nd = nd;
    this.lpL = lpL; this.lpR = lpR; this.xL = xL; this.yL = yL; this.xR = xR; this.yR = yR;
  }
}

const WORKLET_SRC = `const DeckCore = ${DeckCore.toString()};
class VinylDeck extends AudioWorkletProcessor {
  constructor() { super(); this.c = new DeckCore(sampleRate); this.k = 0; this.port.onmessage = (e) => this.c.message(e.data); }
  process(inputs, outputs) {
    const o = outputs[0]; if (!o || !o[0]) return true;
    this.c.process(o[0], o[1] || o[0], o[0].length);
    if ((++this.k & 3) === 0) this.port.postMessage([this.c.pos, this.c.vel]);
    return true;
  }
}
registerProcessor('vinyl-deck', VinylDeck);`;

/* ---------- Audio-Steuerung im Hauptthread ---------- */
const A = { ctx: null, post: null, ready: false, start: null, rep: 0, repV: 0, repT: -1e9, lat: 0, loop: null, custom: null };

function send(m, transfer) { if (A.ready) A.post(m, transfer); }

function onReport(pos, vel) { A.rep = pos; A.repV = vel; A.repT = performance.now(); }

function bufferMsg(buf, restart) {
  // Kopien, damit das Original für "Originale Platte" erhalten bleibt
  const L = new Float32Array(buf.L), R = buf.R === buf.L ? L : new Float32Array(buf.R);
  return [{ type: 'buffer', L, R, sr: buf.sr, restart }, R === L ? [L.buffer] : [L.buffer, R.buffer]];
}

// Muss synchron aus einem Klick/Tastendruck aufgerufen werden (Autoplay-Regeln der Browser).
function ensureAudio() {
  if (A.ctx) { if (A.ctx.state !== 'running') A.ctx.resume().catch(() => {}); return A.start; }
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return Promise.resolve(false);
  A.ctx = new AC({ latencyHint: 'interactive' });
  A.ctx.resume().catch(() => {});
  A.start = (async () => {
    const ctx = A.ctx;
    const out = ctx.createGain(); out.gain.value = 0.9; out.connect(ctx.destination);
    let ok = false;
    if (ctx.audioWorklet && window.AudioWorkletNode) {
      try {
        const url = URL.createObjectURL(new Blob([WORKLET_SRC], { type: 'application/javascript' }));
        await ctx.audioWorklet.addModule(url);
        URL.revokeObjectURL(url);
        const node = new AudioWorkletNode(ctx, 'vinyl-deck', { numberOfInputs: 0, numberOfOutputs: 1, outputChannelCount: [2] });
        node.port.onmessage = (e) => onReport(e.data[0], e.data[1]);
        node.connect(out);
        A.post = (m, t) => node.port.postMessage(m, t || []);
        ok = true;
      } catch (err) { console.warn('AudioWorklet nicht verfügbar, nutze ScriptProcessor.', err); }
    }
    if (!ok) {
      const core = new DeckCore(ctx.sampleRate);
      const sp = ctx.createScriptProcessor(1024, 1, 2);
      sp.onaudioprocess = (e) => { const b = e.outputBuffer; core.process(b.getChannelData(0), b.getChannelData(1), b.length); onReport(core.pos, core.vel); };
      sp.connect(out);
      A.post = (m) => core.message(m);
      A.keep = sp;
    }
    A.lat = ctx.outputLatency || ctx.baseLatency || 0;
    const buf = A.custom || await (A.loop ||= renderLoop());
    A.post({ type: 'init', pos: S.pos, vel: S.vel });
    const [msg, tr] = bufferMsg(buf, false);
    A.post(msg, tr);
    A.ready = true;
    if (S.scratching) send({ type: 'scratch', pos: S.scratchPos, tv: 0 });
    else send({ type: 'motor', rate: S.motor, tau: S.tau, accel: S.accel });
    send({ type: 'needle', on: S.needle });
    return true;
  })().catch((err) => { console.error(err); return false; });
  return A.start;
}

/* =========================================================
   4) Plattenspieler: Zustand, Zeichnen, Bedienung
   ========================================================= */
const S = {
  playing: false, armDown: false, scratching: false,
  motor: 0, tau: 0.3, accel: 0,           // Sollwerte des Motors (identisch zum Worklet)
  pos: 0, vel: 0, blend: 0,               // sichtbare Position der Platte
  platAng: 0, platVel: 0,                 // Teller dreht unter der festgehaltenen Platte weiter
  arm: null, needle: false, still: 0,
  scratchPos: 0, tv: 0, lastMove: 0, nudge: null, visible: false,
};
const G = {};
let deck, cvs, g2d, recBtn, startBtn;

function setMotor(rate, opt = {}) {
  S.motor = rate; S.tau = opt.tau ?? 0.3; S.accel = opt.accel ?? 0;
  if (!S.scratching) send({ type: 'motor', rate, tau: S.tau, accel: S.accel });
}
function play() {
  if (S.playing) return;
  ensureAudio();
  S.playing = true; S.armDown = true;
  setMotor(1, { tau: 0.35 });
  syncUI();
}
function stop() {
  if (!S.playing) return;
  S.playing = false;
  setMotor(0, { accel: 1 / 1.7 });        // Strom aus: Platte und Tonhöhe sinken in 1,7 s auf null
  syncUI();
}
const togglePlay = () => (S.playing ? stop() : play());
function syncUI() {
  startBtn.setAttribute('aria-pressed', String(S.playing));
  startBtn.querySelector('.lbl').textContent = S.playing ? 'Stopp' : 'Start';
}

/* ---------- Scratch ---------- */
function estimatePos(now) {
  if (A.ready && now - A.repT < 200) return A.rep + A.repV * ((now - A.repT) / 1000 - A.lat);
  return S.pos;
}
function beginScratch() {
  S.scratching = true;
  S.scratchPos = S.pos + S.blend; S.blend = 0; S.tv = 0; S.lastMove = performance.now();
  S.armDown = true;
  send({ type: 'scratch', pos: S.scratchPos, tv: 0 });
  recBtn.classList.add('grabbing');
}
function moveScratch(dPos, dtSec) {
  S.scratchPos += dPos;
  const inst = dPos / Math.max(dtSec, 0.004);
  S.tv = S.tv * 0.5 + inst * 0.5;
  S.lastMove = performance.now();
  send({ type: 'scratch', pos: S.scratchPos, tv: S.tv });
}
function endScratch() {
  if (!S.scratching) return;
  S.scratching = false;
  const now = performance.now();
  const est = A.ready && now - A.repT < 200 ? estimatePos(now) : S.scratchPos;
  S.blend = S.scratchPos - est;          // sichtbarer Versatz läuft weich aus
  S.pos = est; S.vel = S.tv;
  setMotor(S.motor, S.playing ? { tau: 0.18 } : { tau: 0.3 });
  recBtn.classList.remove('grabbing');
}

/* ---------- Zeichnen ---------- */
function bakeRecord(size) {
  const c = document.createElement('canvas'); c.width = c.height = size;
  const x = c.getContext('2d'); const R = size / 2; const rnd = mulberry32(11);
  x.translate(R, R);
  const gr = x.createRadialGradient(-R * 0.25, -R * 0.3, R * 0.05, 0, 0, R);
  gr.addColorStop(0, 'rgba(242,62,92,.95)'); gr.addColorStop(0.55, 'rgba(208,25,58,.93)'); gr.addColorStop(1, 'rgba(126,8,30,.97)');
  x.beginPath(); x.arc(0, 0, R, 0, TAU); x.fillStyle = gr; x.fill();
  x.save(); x.clip();
  // Marmorierung im farbigen Vinyl
  for (let i = 0; i < 26; i++) {
    const a = rnd() * TAU, d = Math.sqrt(rnd()) * R * 0.95, r = R * (0.1 + rnd() * 0.3), light = rnd() < 0.5;
    x.save(); x.rotate(a); x.translate(d, 0); x.scale(0.32, 1);
    const rg = x.createRadialGradient(0, 0, 0, 0, 0, r);
    rg.addColorStop(0, light ? 'rgba(255,150,170,.2)' : 'rgba(70,0,14,.26)'); rg.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = rg; x.fillRect(-r, -r, 2 * r, 2 * r); x.restore();
  }
  // Rillen mit Pausen zwischen den Stücken
  const lab = R * 0.34, inner = R * 0.37, outer = R * 0.955;
  const gaps = [0.2, 0.37, 0.52, 0.68, 0.83].map((f) => outer - (outer - inner) * f);
  const step = Math.max(1, size / 560);
  x.lineWidth = step * 0.55;
  for (let r = inner; r < outer; r += step) {
    if (gaps.some((gp) => Math.abs(r - gp) < step * 2.4)) continue;
    x.strokeStyle = `rgba(46,0,10,${(0.08 + rnd() * 0.16).toFixed(3)})`;
    x.beginPath(); x.arc(0, 0, r, 0, TAU); x.stroke();
  }
  x.lineWidth = step * 2.6; x.strokeStyle = 'rgba(255,196,210,.1)';
  for (const gp of gaps) { x.beginPath(); x.arc(0, 0, gp, 0, TAU); x.stroke(); }
  x.restore();
  x.beginPath(); x.arc(0, 0, R - Math.max(1, size / 500), 0, TAU); x.strokeStyle = 'rgba(70,0,16,.75)'; x.lineWidth = Math.max(1.5, size / 300); x.stroke();
  // Label: zitronengelb wie die Schrift am Morgen
  const lg = x.createRadialGradient(-lab * 0.3, -lab * 0.3, lab * 0.1, 0, 0, lab);
  lg.addColorStop(0, '#fbf6a6'); lg.addColorStop(1, '#efe25a');
  x.beginPath(); x.arc(0, 0, lab, 0, TAU); x.fillStyle = lg; x.fill();
  x.strokeStyle = 'rgba(58,10,20,.3)'; x.lineWidth = Math.max(1, size / 700);
  x.beginPath(); x.arc(0, 0, lab * 0.9, 0, TAU); x.stroke();
  x.fillStyle = '#3A0A14'; x.textAlign = 'center'; x.textBaseline = 'alphabetic';
  x.font = `400 ${lab * 0.3}px Caprasimo, Georgia, serif`; x.fillText('Feliks', 0, -lab * 0.3);
  x.font = `600 ${lab * 0.13}px "Schibsted Grotesk", sans-serif`; x.fillText('Kolomoiets', 0, -lab * 0.1);
  x.font = `500 ${lab * 0.11}px "Schibsted Grotesk", sans-serif`; x.fillText('33 U/min', 0, lab * 0.5);
  x.beginPath(); x.arc(0, 0, lab * 0.065, 0, TAU); x.fillStyle = '#1a0408'; x.fill();
  return c;
}

function bakeSheen(size) {
  const c = document.createElement('canvas'); c.width = c.height = size;
  const x = c.getContext('2d'); const R = size / 2;
  x.translate(R, R); x.beginPath(); x.arc(0, 0, R, 0, TAU); x.clip();
  if (x.createConicGradient) {
    const cg = x.createConicGradient(-0.95, 0, 0);
    const w = 'rgba(255,236,240,';
    [[0, 0], [0.05, 0.26], [0.11, 0], [0.5, 0], [0.555, 0.17], [0.61, 0], [1, 0]].forEach(([p, a]) => cg.addColorStop(p, w + a + ')'));
    x.fillStyle = cg; x.fillRect(-R, -R, 2 * R, 2 * R);
    x.globalCompositeOperation = 'destination-in';
    const rg = x.createRadialGradient(0, 0, R * 0.3, 0, 0, R);
    rg.addColorStop(0, 'rgba(0,0,0,.25)'); rg.addColorStop(0.5, 'rgba(0,0,0,1)'); rg.addColorStop(1, 'rgba(0,0,0,.8)');
    x.fillStyle = rg; x.fillRect(-R, -R, 2 * R, 2 * R);
    x.globalCompositeOperation = 'source-over';
  }
  x.strokeStyle = 'rgba(255,220,228,.35)'; x.lineWidth = Math.max(1, size / 260);
  x.beginPath(); x.arc(0, 0, R - x.lineWidth, Math.PI * 1.02, Math.PI * 1.48); x.stroke();
  return c;
}

function metal(x, x0, y0, x1, y1) {
  const m = x.createLinearGradient(x0, y0, x1, y1);
  m.addColorStop(0, '#f1e6e8'); m.addColorStop(0.35, '#8c7a7f'); m.addColorStop(0.62, '#d8c9cc'); m.addColorStop(1, '#5a474c');
  return m;
}

function bakeBase() {
  const c = document.createElement('canvas'); c.width = G.W; c.height = G.H;
  const x = c.getContext('2d'); const u = G.H;
  x.save(); x.shadowColor = 'rgba(10,0,4,.55)'; x.shadowBlur = u * 0.05; x.shadowOffsetY = u * 0.022;
  x.beginPath(); x.arc(G.cx, G.cy, G.Rp, 0, TAU); x.fillStyle = '#2a1a1e'; x.fill(); x.restore();
  x.beginPath(); x.arc(G.cx, G.cy, G.Rp, 0, TAU); x.fillStyle = metal(x, G.cx - G.Rp, G.cy - G.Rp, G.cx + G.Rp, G.cy + G.Rp); x.fill();
  x.beginPath(); x.arc(G.cx, G.cy, G.Rr * 1.002, 0, TAU); x.fillStyle = '#14050a'; x.fill();
  x.strokeStyle = 'rgba(255,255,255,.035)'; x.lineWidth = 1;
  for (let r = G.Rr * 0.2; r < G.Rr; r += u * 0.012) { x.beginPath(); x.arc(G.cx, G.cy, r, 0, TAU); x.stroke(); }
  // Tonarm-Sockel
  x.save(); x.shadowColor = 'rgba(10,0,4,.5)'; x.shadowBlur = u * 0.03; x.shadowOffsetY = u * 0.012;
  x.beginPath(); x.arc(G.px, G.py, u * 0.078, 0, TAU); x.fillStyle = metal(x, G.px - u * 0.08, G.py - u * 0.08, G.px + u * 0.08, G.py + u * 0.08); x.fill(); x.restore();
  x.beginPath(); x.arc(G.px, G.py, u * 0.058, 0, TAU); x.fillStyle = '#24161a'; x.fill();
  // Armstütze
  const rx = G.px + Math.cos(G.rest) * G.L * 0.74, ry = G.py + Math.sin(G.rest) * G.L * 0.74;
  x.beginPath(); x.arc(rx, ry, u * 0.02, 0, TAU); x.fillStyle = metal(x, rx - u * 0.02, ry - u * 0.02, rx + u * 0.02, ry + u * 0.02); x.fill();
  x.beginPath(); x.arc(rx, ry, u * 0.009, 0, TAU); x.fillStyle = '#1b0c10'; x.fill();
  return c;
}

function rrect(x, X, Y, w, h, r) { x.beginPath(); x.roundRect ? x.roundRect(X, Y, w, h, r) : x.rect(X, Y, w, h); }

function drawArm(x, ang, lift) {
  const u = G.H, L = G.L;
  const seg = (ctx) => {
    rrect(ctx, -u * 0.13, -u * 0.033, u * 0.075, u * 0.066, u * 0.012); ctx.fill();          // Gegengewicht
    rrect(ctx, -u * 0.06, -u * 0.0095, L - u * 0.03, u * 0.019, u * 0.009); ctx.fill();      // Rohr
  };
  x.save(); x.translate(G.px + u * (0.014 + lift * 0.03), G.py + u * (0.022 + lift * 0.04)); x.rotate(ang);
  x.fillStyle = 'rgba(12,0,4,.32)'; seg(x);
  x.save(); x.translate(L - u * 0.035, 0); x.rotate(-0.38); rrect(x, -u * 0.04, -u * 0.02, u * 0.08, u * 0.04, u * 0.007); x.fill(); x.restore();
  x.restore();
  x.save(); x.translate(G.px, G.py); x.rotate(ang);
  const tube = x.createLinearGradient(0, -u * 0.02, 0, u * 0.02);
  tube.addColorStop(0, '#4a3a3e'); tube.addColorStop(0.45, '#f4e7ea'); tube.addColorStop(1, '#4d3c40');
  x.fillStyle = tube; seg(x);
  x.save(); x.translate(L - u * 0.035, 0); x.rotate(-0.38);
  x.fillStyle = '#1d0a0f'; rrect(x, -u * 0.04, -u * 0.02, u * 0.08, u * 0.04, u * 0.007); x.fill();
  x.fillStyle = 'rgba(244,179,192,.9)'; rrect(x, -u * 0.005, -u * 0.034, u * 0.012, u * 0.016, u * 0.004); x.fill();
  x.restore();
  x.beginPath(); x.arc(0, 0, u * 0.03, 0, TAU); x.fillStyle = metal(x, -u * 0.03, -u * 0.03, u * 0.03, u * 0.03); x.fill();
  x.restore();
}

function layout() {
  const w = deck.clientWidth, h = deck.clientHeight;
  if (!w || !h) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  cvs.width = Math.round(w * dpr); cvs.height = Math.round(h * dpr);
  const W = cvs.width, H = cvs.height;
  Object.assign(G, { dpr, W, H, cx: H * 0.52, cy: H * 0.5, Rr: H * 0.405, Rp: H * 0.43, px: W - H * 0.15, py: H * 0.15 });
  const phi = -0.32, rr = G.Rr * 0.92;
  const tx = G.cx + rr * Math.cos(phi), ty = G.cy + rr * Math.sin(phi);
  G.L = Math.hypot(tx - G.px, ty - G.py);
  G.play = Math.atan2(ty - G.py, tx - G.px);
  G.rest = Math.PI / 2 + 0.05;
  if (S.arm === null) S.arm = G.rest;
  G.recSize = Math.round(G.Rr * 2);
  G.rec = bakeRecord(G.recSize);
  G.sheen = bakeSheen(G.recSize);
  G.base = bakeBase();
  Object.assign(recBtn.style, { left: `${(G.cx - G.Rr) / dpr}px`, top: `${(G.cy - G.Rr) / dpr}px`, width: `${(2 * G.Rr) / dpr}px`, height: `${(2 * G.Rr) / dpr}px` });
  draw();
}

function recAngle() { return ((S.pos + S.blend) / REV) * TAU; }

function draw() {
  if (!G.base) return;
  const x = g2d;
  x.clearRect(0, 0, G.W, G.H);
  x.drawImage(G.base, 0, 0);
  const rr = (G.Rr + G.Rp) / 2, dr = G.H * 0.0032, n = 96;   // Stroboskop-Punkte am Tellerrand
  x.save(); x.translate(G.cx, G.cy); x.rotate(S.platAng); x.fillStyle = 'rgba(255,228,234,.55)'; x.beginPath();
  for (let i = 0; i < n; i++) { const a = (i / n) * TAU, px = Math.cos(a) * rr, py = Math.sin(a) * rr; x.moveTo(px + dr, py); x.arc(px, py, dr, 0, TAU); }
  x.fill(); x.restore();
  x.save(); x.translate(G.cx, G.cy); x.rotate(recAngle()); x.drawImage(G.rec, -G.Rr, -G.Rr, 2 * G.Rr, 2 * G.Rr); x.restore();
  x.globalCompositeOperation = 'screen'; x.drawImage(G.sheen, G.cx - G.Rr, G.cy - G.Rr, 2 * G.Rr, 2 * G.Rr); x.globalCompositeOperation = 'source-over';
  x.beginPath(); x.arc(G.cx, G.cy, G.H * 0.011, 0, TAU); x.fillStyle = metal(x, G.cx - 6, G.cy - 6, G.cx + 6, G.cy + 6); x.fill();
  const target = S.armDown ? G.play : G.rest;
  drawArm(x, S.arm, Math.min(1, Math.abs(target - S.arm) * 5) * (S.needle ? 0 : 1));
}

function approach(v, target, dt) {
  if (S.accel > 0) { const st = S.accel * dt, d = target - v; return v + (d > st ? st : d < -st ? -st : d); }
  return v + (target - v) * (1 - Math.exp(-dt / S.tau));
}

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  if (S.nudge) {
    const p = Math.min(1, (now - S.nudge.t0) / S.nudge.dur), e = 0.5 - Math.cos(p * Math.PI) / 2;
    moveScratch(S.nudge.from + S.nudge.by * e - S.scratchPos, dt);
    if (p >= 1) { S.nudge = null; endScratch(); }
  }
  if (S.scratching && !S.nudge && now - S.lastMove > 45 && S.tv !== 0) { S.tv = 0; send({ type: 'scratch', pos: S.scratchPos, tv: 0 }); }
  S.platVel = approach(S.platVel, S.motor, dt);
  S.platAng += (S.platVel * dt / REV) * TAU;
  if (S.scratching) { S.pos = S.scratchPos; S.vel = S.tv; }
  else if (A.ready && now - A.repT < 200) { S.pos = estimatePos(now); S.vel = A.repV; }
  else { S.vel = approach(S.vel, S.motor, dt); S.pos += S.vel * dt; }
  S.blend *= Math.exp(-dt / 0.12);
  if (S.arm !== null) {
    const target = S.armDown ? G.play + Math.sin(recAngle()) * 0.003 : G.rest;
    S.arm += (target - S.arm) * (1 - Math.exp(-dt / (reduceMotion() ? 0.04 : 0.16)));
    if (S.armDown && !S.needle && Math.abs(G.play - S.arm) < 0.03) { S.needle = true; send({ type: 'needle', on: true }); }
    if (!S.armDown && S.needle) { S.needle = false; send({ type: 'needle', on: false }); }
    if (!S.playing && !S.scratching && S.armDown) {
      S.still = Math.abs(S.vel) < 0.01 ? S.still + dt : 0;
      if (S.still > 0.7) { S.armDown = false; S.still = 0; }
    }
  }
  if (S.visible) draw();
  requestAnimationFrame(frame);
}

/* ---------- Start ---------- */
export function initDeck(root) {
  deck = root.querySelector('.deck');
  cvs = root.querySelector('.deck__canvas'); g2d = cvs.getContext('2d');
  recBtn = root.querySelector('.deck__record'); startBtn = root.querySelector('.deck__start');

  let drag = null, suppressClick = false;
  const pointerAngle = (e) => {
    const r = recBtn.getBoundingClientRect();
    const x = e.clientX - (r.left + r.width / 2), y = e.clientY - (r.top + r.height / 2);
    return { a: Math.atan2(y, x), d: Math.hypot(x, y) / (r.width / 2) };
  };
  recBtn.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    recBtn.setPointerCapture(e.pointerId);
    ensureAudio();
    drag = { id: e.pointerId, x0: e.clientX, y0: e.clientY, th: pointerAngle(e).a, t: e.timeStamp, active: false };
    drag.hold = setTimeout(() => { if (drag && !drag.active) { drag.active = true; beginScratch(); } }, 200);
  });
  recBtn.addEventListener('pointermove', (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const { a, d } = pointerAngle(e);
    let dth = a - drag.th; if (dth > Math.PI) dth -= TAU; else if (dth < -Math.PI) dth += TAU;
    drag.th = a;
    const dt = (e.timeStamp - drag.t) / 1000; drag.t = e.timeStamp;
    if (!drag.active && Math.hypot(e.clientX - drag.x0, e.clientY - drag.y0) > 5) { drag.active = true; clearTimeout(drag.hold); beginScratch(); return; }
    if (drag.active && d > 0.12) moveScratch((dth / TAU) * REV, dt);
  });
  const pointerEnd = (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    clearTimeout(drag.hold);
    if (drag.active) { endScratch(); suppressClick = true; }
    drag = null;
    if (A.ctx && A.ctx.state !== 'running') A.ctx.resume().catch(() => {});
  };
  recBtn.addEventListener('pointerup', pointerEnd);
  recBtn.addEventListener('pointercancel', pointerEnd);
  recBtn.addEventListener('lostpointercapture', pointerEnd);
  recBtn.addEventListener('click', () => { if (suppressClick) { suppressClick = false; return; } togglePlay(); });
  recBtn.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    e.preventDefault();
    ensureAudio();
    if (S.nudge) return;
    beginScratch();
    S.nudge = { from: S.scratchPos, by: (e.key === 'ArrowRight' ? 1 : -1) * 0.45, t0: performance.now(), dur: 260 };
  });
  startBtn.addEventListener('click', togglePlay);

  new ResizeObserver(() => layout()).observe(deck);
  new IntersectionObserver(([en]) => {
    S.visible = en.isIntersecting;
    // Musik vorbereiten, sobald der Plattenspieler in die Nähe kommt (spielt noch nichts ab)
    if (en.isIntersecting && window.OfflineAudioContext && !A.loop) { A.loop = renderLoop(); A.loop.catch((err) => { console.error(err); A.loop = null; }); }
  }, { rootMargin: '400px 0px' }).observe(deck);
  document.fonts?.ready.then(() => { if (G.recSize) { G.rec = bakeRecord(G.recSize); draw(); } });
  requestAnimationFrame(frame);
}
