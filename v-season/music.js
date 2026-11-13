// Leiser Lo-Fi-Loop für die Kopfhörer auf der Picknickdecke.
// Erzeugt im Browser (OfflineAudioContext), Idee und Instrumente aus ../seasons/deck.js übernommen,
// hier ruhiger (72 BPM, D-Dur, weiche Drums) und einfach als Schleife abgespielt.
// Ton gibt es nur nach einem Klick – nie automatisch.

function mulberry32(a) {
  return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const mtof = (m) => 440 * 2 ** ((m - 69) / 12);

async function renderLoop(sr = 44100) {
  const BPM = 72, beat = 60 / BPM, bar = beat * 4, BARS = 8, LEN = bar * BARS, TAIL = 3;
  const N = Math.round(LEN * sr), TN = Math.round(TAIL * sr);
  const ctx = new OfflineAudioContext(2, N + TN, sr);
  const rnd = mulberry32(11);
  const stopAt = LEN + TAIL;

  const sum = ctx.createGain(); sum.gain.value = 0.8;
  const sat = ctx.createWaveShaper();
  { const n = 2048, c = new Float32Array(n), k = 1.3; for (let i = 0; i < n; i++) { const x = (i / (n - 1)) * 2 - 1; c[i] = Math.tanh(k * x) / Math.tanh(k); } sat.curve = c; }
  const tone = ctx.createBiquadFilter(); tone.type = 'lowpass'; tone.frequency.value = 4800; tone.Q.value = 0.4;
  sum.connect(sat); sat.connect(tone); tone.connect(ctx.destination);

  const verb = ctx.createConvolver();
  { const len = Math.round(2.8 * sr), ir = ctx.createBuffer(2, len, sr);
    for (let ch = 0; ch < 2; ch++) { const d = ir.getChannelData(ch); let lp = 0; for (let i = 0; i < len; i++) { lp += ((rnd() * 2 - 1) - lp) * 0.3; d[i] = lp * (1 - i / len) ** 2.6; } }
    verb.buffer = ir; }
  const verbIn = ctx.createGain(); verbIn.gain.value = 0.38; verbIn.connect(verb); verb.connect(tone);

  const noise = ctx.createBuffer(1, sr * 2, sr);
  { const d = noise.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = rnd() * 2 - 1; }
  const noiseSrc = (t, dur) => { const s = ctx.createBufferSource(); s.buffer = noise; s.loop = true; s.start(t, rnd() * 1.5); s.stop(t + dur); return s; };

  const drums = ctx.createGain(); drums.gain.value = 0.62;
  const drumLP = ctx.createBiquadFilter(); drumLP.type = 'lowpass'; drumLP.frequency.value = 6000;
  drums.connect(drumLP); drumLP.connect(sum);

  const keys = ctx.createGain(); keys.gain.value = 0.17;
  const duck = ctx.createGain(); duck.gain.value = 1;
  const trem = ctx.createGain(); trem.gain.value = 0.86;
  const keysLP = ctx.createBiquadFilter(); keysLP.type = 'lowpass'; keysLP.frequency.value = 1900; keysLP.Q.value = 0.3;
  keys.connect(duck); duck.connect(trem); trem.connect(keysLP); keysLP.connect(sum);
  const keysSend = ctx.createGain(); keysSend.gain.value = 0.7; keysLP.connect(keysSend); keysSend.connect(verbIn);
  const lfo = (cyclesPerLoop, depth) => { const o = ctx.createOscillator(); o.frequency.value = cyclesPerLoop / LEN; const g = ctx.createGain(); g.gain.value = depth; o.connect(g); o.start(0); o.stop(stopAt); return g; };
  lfo(Math.round(3.6 * LEN), 0.12).connect(trem.gain);
  const wow = lfo(Math.round(0.4 * LEN), 8);

  const bass = ctx.createGain(); bass.gain.value = 0.36;
  const bassLP = ctx.createBiquadFilter(); bassLP.type = 'lowpass'; bassLP.frequency.value = 420;
  bass.connect(bassLP); bassLP.connect(sum);

  const lead = ctx.createGain(); lead.gain.value = 0.05;
  const leadDelay = ctx.createDelay(2); leadDelay.delayTime.value = beat * 0.75;
  const fb = ctx.createGain(); fb.gain.value = 0.36;
  lead.connect(sum); lead.connect(leadDelay); leadDelay.connect(fb); fb.connect(leadDelay); fb.connect(sum);
  const leadSend = ctx.createGain(); leadSend.gain.value = 0.9; lead.connect(leadSend); leadSend.connect(verbIn);

  const kick = (t, v) => {
    t = Math.max(0, t);
    const o = ctx.createOscillator(); o.type = 'sine';
    o.frequency.setValueAtTime(130, t); o.frequency.exponentialRampToValueAtTime(50, t + 0.1); o.frequency.exponentialRampToValueAtTime(40, t + 0.4);
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + 0.006); g.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
    o.connect(g); g.connect(drums); o.start(t); o.stop(t + 0.45);
    duck.gain.setValueAtTime(0.65, t); duck.gain.linearRampToValueAtTime(1, t + 0.3);
  };
  const brush = (t, v) => { // weiche Snare wie ein Besen
    t = Math.max(0, t);
    const n = noiseSrc(t, 0.4);
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 2400; bp.Q.value = 0.5;
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v * 0.32, t + 0.012); g.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
    n.connect(bp); bp.connect(g); g.connect(drums);
    const s = ctx.createGain(); s.gain.value = 0.5; g.connect(s); s.connect(verbIn);
  };
  const hat = (t, v) => {
    t = Math.max(0, t);
    const n = noiseSrc(t, 0.08);
    const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 7600;
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + 0.002); g.gain.exponentialRampToValueAtTime(0.001, t + 0.045);
    n.connect(hp); hp.connect(g); g.connect(drums);
  };
  const epNote = (m, t, dur, v) => {
    const f = mtof(m);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + 0.015);
    g.gain.setTargetAtTime(v * 0.45, t + 0.015, 0.7); g.gain.setTargetAtTime(0, t + dur, 0.3);
    const o1 = ctx.createOscillator(); o1.type = 'sine'; o1.frequency.value = f;
    const o2 = ctx.createOscillator(); o2.type = 'triangle'; o2.frequency.value = f; o2.detune.value = 6;
    const o2g = ctx.createGain(); o2g.gain.value = 0.3;
    const o3 = ctx.createOscillator(); o3.type = 'sine'; o3.frequency.value = f * 4.01;
    const o3g = ctx.createGain(); o3g.gain.setValueAtTime(v * 0.14, t); o3g.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
    wow.connect(o1.detune); wow.connect(o2.detune);
    o1.connect(g); o2.connect(o2g); o2g.connect(g); o3.connect(o3g); o3g.connect(keys); g.connect(keys);
    const end = t + dur + 1.8;
    for (const o of [o1, o2, o3]) { o.start(t); o.stop(end); }
  };
  const bassNote = (m, t, dur, v) => {
    const f = mtof(m);
    const g = ctx.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + 0.02); g.gain.setTargetAtTime(v * 0.7, t + 0.03, 0.5); g.gain.setTargetAtTime(0, t + dur, 0.08);
    const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = f;
    o.connect(g); g.connect(bass); o.start(t); o.stop(t + dur + 0.5);
  };
  const leadNote = (m, t, dur) => {
    const f = mtof(m);
    const g = ctx.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(1, t + 0.03); g.gain.setTargetAtTime(0.5, t + 0.04, 0.35); g.gain.setTargetAtTime(0, t + dur, 0.15);
    const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = f;
    const vib = ctx.createOscillator(); vib.frequency.value = 4.8; const vg = ctx.createGain(); vg.gain.value = 7; vib.connect(vg); vg.connect(o.detune);
    o.connect(g); g.connect(lead); o.start(t); vib.start(t); o.stop(t + dur + 1); vib.stop(t + dur + 1);
  };

  // Dmaj9 – Bm9 – Gmaj9 – A6, je zwei Takte
  const prog = [
    { root: 38, notes: [54, 57, 61, 64] },
    { root: 35, notes: [57, 61, 62, 66] },
    { root: 43, notes: [59, 62, 66, 69] },
    { root: 45, notes: [57, 61, 64, 66] },
  ];
  const s16 = beat / 4, swing = beat * 0.1;
  const hum = () => (rnd() - 0.5) * 0.014;
  for (let b = 0; b < BARS; b++) {
    const t0 = b * bar;
    const kicks = [0, 10]; if (b % 2 === 1) kicks.push(7);
    for (const s of kicks) kick(t0 + s * s16 + hum() * 0.5, s === 7 ? 0.45 : 0.75);
    brush(t0 + 4 * s16 + hum(), 0.9); brush(t0 + 12 * s16 + hum(), 0.95);
    for (let s = 0; s < 16; s += 2) hat(t0 + s * s16 + (s % 4 === 2 ? swing : 0) + hum(), (s % 4 === 0 ? 0.13 : 0.08) * (0.8 + rnd() * 0.4));
    const ch = prog[Math.floor(b / 2)], second = b % 2 === 1;
    const strum = (t, v, dur) => ch.notes.forEach((m, i) => epNote(m, t + i * 0.024, dur, v));
    if (!second) strum(t0 + 0.01, 0.5, bar * 1.4);
    else strum(t0 + 1.5 * beat + swing, 0.28, beat * 2.4);
    const r = ch.root;
    if (!second) { bassNote(r, t0, s16 * 6, 0.85); bassNote(r + 7, t0 + 10 * s16, s16 * 5, 0.6); }
    else { bassNote(r, t0, s16 * 7, 0.8); bassNote(r + 12, t0 + 12 * s16, s16 * 3.5, 0.5); }
  }
  const mel = [[9, 78, 0.5], [9.5, 81, 1], [10.5, 78, 0.5], [11, 76, 2.5],
    [25, 74, 0.5], [25.5, 76, 0.5], [26, 78, 1], [27, 81, 1], [28, 83, 0.5], [28.5, 81, 2.5]];
  for (const [bt, m, d] of mel) leadNote(m, bt * beat + (bt % 1 ? swing : 0), d * beat);

  // ganz leises Knistern
  const cr = ctx.createBuffer(2, N, sr);
  for (let c = 0; c < 2; c++) {
    const d = cr.getChannelData(c); let lp = 0, click = 0;
    for (let i = 0; i < N; i++) {
      const w = rnd() * 2 - 1; lp += (w - lp) * 0.05;
      if (rnd() < 0.00008) click = (rnd() < 0.5 ? -1 : 1) * (0.05 + rnd() ** 3 * 0.35);
      d[i] = (w - lp) * 0.01 + click; click *= -0.62;
    }
  }
  const crSrc = ctx.createBufferSource(); crSrc.buffer = cr;
  const crHP = ctx.createBiquadFilter(); crHP.type = 'highpass'; crHP.frequency.value = 900;
  const crG = ctx.createGain(); crG.gain.value = 0.22;
  crSrc.connect(crHP); crHP.connect(crG); crG.connect(tone); crSrc.start(0);

  const out = await ctx.startRendering();
  // Nachhall vom Ende auf den Anfang falten → nahtlose Schleife, dann normalisieren
  let peak = 0; const res = [];
  for (let c = 0; c < 2; c++) {
    const src = out.getChannelData(c), dst = new Float32Array(N);
    dst.set(src.subarray(0, N));
    for (let i = 0; i < TN; i++) dst[i] += src[N + i];
    for (let i = 0; i < N; i++) { const v = Math.abs(dst[i]); if (v > peak) peak = v; }
    res.push(dst);
  }
  const k = peak > 0 ? 0.85 / peak : 1;
  for (const d of res) for (let i = 0; i < N; i++) d[i] *= k;
  return { L: res[0], R: res[1], sr };
}

const M = { ctx: null, buf: null, loading: null, src: null, gain: null, playing: false, listeners: new Set() };

function emit(state) { for (const fn of M.listeners) fn(state); }

async function load() {
  if (M.buf) return M.buf;
  if (!M.loading) {
    M.loading = renderLoop().then(({ L, R, sr }) => {
      const b = M.ctx.createBuffer(2, L.length, sr);
      b.copyToChannel(L, 0); b.copyToChannel(R, 1);
      M.buf = b; return b;
    });
  }
  return M.loading;
}

export async function play() {
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC || !window.OfflineAudioContext) return;
  if (!M.ctx) { M.ctx = new AC(); M.gain = M.ctx.createGain(); M.gain.gain.value = 0; M.gain.connect(M.ctx.destination); }
  if (M.ctx.state === 'suspended') await M.ctx.resume();
  M.playing = true; emit('loading');
  let buf;
  try { buf = await load(); } catch (e) { console.error(e); M.playing = false; emit('off'); return; }
  if (!M.playing) return; // in der Zwischenzeit wieder ausgeschaltet
  if (M.src) { try { M.src.stop(); } catch { /* schon aus */ } }
  const s = M.ctx.createBufferSource(); s.buffer = buf; s.loop = true; s.connect(M.gain); s.start();
  M.src = s;
  const t = M.ctx.currentTime;
  M.gain.gain.cancelScheduledValues(t); M.gain.gain.setValueAtTime(M.gain.gain.value, t); M.gain.gain.linearRampToValueAtTime(0.55, t + 1.4);
  emit('on');
}

export function stop() {
  M.playing = false; emit('off');
  if (!M.ctx || !M.src) return;
  const t = M.ctx.currentTime, s = M.src; M.src = null;
  M.gain.gain.cancelScheduledValues(t); M.gain.gain.setValueAtTime(M.gain.gain.value, t); M.gain.gain.linearRampToValueAtTime(0, t + 0.6);
  setTimeout(() => { try { s.stop(); } catch { /* schon aus */ } }, 700);
}

export function toggle() { return M.playing ? stop() : play(); }
export function isPlaying() { return M.playing; }
export function onMusic(fn) { M.listeners.add(fn); }

// Tab im Hintergrund → Ton anhalten, beim Zurückkommen weiter
document.addEventListener('visibilitychange', () => {
  if (!M.ctx) return;
  if (document.hidden) M.ctx.suspend(); else if (M.playing) M.ctx.resume();
});
