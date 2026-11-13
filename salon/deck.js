// Grammophon im Salon (Plattenspieler ursprünglich aus der Vinyl-Variante, für den Salon neu gezeichnet):
// Holzgehäuse mit Messing, Bordeaux-Samt, Trichter und Tonarm – alles auf einem Canvas (siehe Block „Grammophon“).
// Aufgeräumt 12.11.2026: die alten Varianten „Koffer“ (case) und „Sonne“ (sun) wurden nie mehr benutzt und sind entfernt;
// wer sie braucht: git-Verlauf vor dem Commit „deck.js aufgeräumt“.
// Musik wird im Browser erzeugt (OfflineAudioContext) und über einen AudioWorklet mit
// vorzeichenbehaftetem Lesekopf abgespielt: Platte rückwärts drehen = rückwärts hören.
// Ton gibt es erst nach einem Klick (Musik-Knopf, Start oder Platte anfassen) – nie automatisch.
// initDeck(root, { onChange }) gibt { toggle, playing } zurück; onChange(an) meldet jeden Wechsel.

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

// Platten im Salon: jede hat eigenes Tempo, eigene Akkorde und Melodie, eigenes Label (Farbe und Text).
// Platte 0 liegt immer zuerst auf dem Grammophon (ohne Hülle). Platten 1–3 gehören zu den Hüllen an den Wänden:
// Hülle anklicken = diese Platte auflegen; dieselbe (leere) Hülle nochmal = zurück, Platte 0 liegt wieder auf.
// prog: je zwei Takte ein Akkord (root = Bass, notes = E-Piano); mel: [Schlag, MIDI-Note, Dauer in Schlägen]
export const TRACKS = [
  { id: 'house', title: 'Feliks', sub: 'KOLOMOIETS', style: 'lofi', bpm: 84, seed: 7, label: ['#f8e6a6', '#c99a3e'],
    prog: [{ root: 41, notes: [57, 60, 64, 67] }, { root: 40, notes: [55, 59, 62, 66] }, { root: 38, notes: [53, 57, 60, 64] }, { root: 36, notes: [52, 55, 59, 62] }],
    mel: [[8.5, 76, 0.5], [9, 79, 0.5], [9.5, 81, 1.5], [11.5, 79, 0.5], [12, 76, 2.5], [24.5, 76, 0.5], [25, 79, 0.5], [25.5, 84, 1], [26.5, 83, 0.5], [27, 79, 1], [28, 81, 2.5]] },
  { id: 'side-a', title: 'Felya', sub: 'SIDE A', style: 'jazz', bpm: 118, seed: 55, label: ['#fbf5ea', '#d2bf98'],
    // Jazz-Trio mit Swing: Ride-Becken, Besen, laufender Kontrabass, Klavier, Vibraphon (Dmaj9, Bm9, Gmaj9, A13)
    prog: [{ root: 38, notes: [54, 57, 61, 64] }, { root: 35, notes: [50, 54, 57, 61] }, { root: 43, notes: [57, 59, 62, 66] }, { root: 45, notes: [55, 61, 64, 66] }],
    mel: [[0.5, 73, 0.5], [1, 74, 1], [2.5, 76, 1], [4, 78, 2], [7, 76, 1], [8, 74, 3], [16.5, 78, 0.5], [17, 81, 1], [18.5, 79, 0.5], [19, 78, 1], [20, 76, 2], [24, 74, 1], [25, 73, 1], [26, 74, 3]] },
  // Walzer im 3/4-Takt: Spieluhr, Pizzicato-Bass, weiche Streicher (Am9, D9, Gmaj9, Cmaj9, je vier Takte)
  { id: 'regensburg', title: 'Regensburg', sub: 'SESSIONS', style: 'waltz', bpm: 138, seed: 21, label: ['#f2a48a', '#c2452a'],
    prog: [{ root: 45, notes: [60, 64, 67, 71] }, { root: 38, notes: [54, 57, 60, 64] }, { root: 43, notes: [59, 62, 66, 69] }, { root: 36, notes: [55, 59, 62, 64] }],
    mel: [[0, 76, 2], [2, 74, 1], [3, 72, 2], [5, 71, 1], [6, 69, 3], [9, 72, 3], [12, 74, 2], [14, 78, 1], [15, 81, 2], [17, 78, 1], [18, 76, 3], [21, 74, 3],
      [24, 74, 2], [26, 71, 1], [27, 79, 2], [29, 78, 1], [30, 74, 3], [33, 71, 3], [36, 76, 2], [38, 79, 1], [39, 83, 2], [41, 79, 1], [42, 76, 3], [45, 74, 3]] },
  { id: 'lofi', title: '84 BPM', sub: 'LO-FI', style: 'dusty', bpm: 84, seed: 33, label: ['#7fb59c', '#17332b'], dark: true,
    prog: [{ root: 38, notes: [53, 57, 60, 64] }, { root: 43, notes: [53, 59, 62, 64] }, { root: 36, notes: [52, 55, 59, 62] }, { root: 45, notes: [55, 61, 64, 65] }],
    mel: [[1, 74, 1], [2, 77, 1], [3, 76, 2], [6.5, 72, 1], [8, 74, 2], [17, 77, 0.5], [17.5, 81, 1], [19, 79, 1], [20.5, 76, 1.5], [24, 73, 1], [25, 74, 3]] },
];
let TRACK = 0;
const TR = () => TRACKS[TRACK];

// Erzeugt einen nahtlosen Loop (8 Takte, je nach Platte 74–84 BPM). Rückgabe: { L, R, sr }
async function renderLoop(sr = 44100, T = TRACKS[0]) {
  const ST = T.style || 'lofi';
  const BPM = T.bpm, beat = 60 / BPM, bar = beat * (ST === 'waltz' ? 3 : 4), BARS = ST === 'waltz' ? 16 : 8, LEN = bar * BARS, TAIL = 3;
  const N = Math.round(LEN * sr), TN = Math.round(TAIL * sr);
  const ctx = new OfflineAudioContext(2, N + TN, sr);
  const rnd = mulberry32(T.seed);
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
  lfo(Math.round(4.3 * LEN), { lofi: 0.14, dusty: 0.18 }[ST] || 0).connect(trem.gain);
  const wow = lfo(Math.round(0.45 * LEN), { lofi: 7, jazz: 2, waltz: 4, dusty: 24 }[ST]);   // Leiern der Tasten (Cent); „dusty“ klingt nach altem Band

  const bass = ctx.createGain(); bass.gain.value = 0.42;
  const bassLP = ctx.createBiquadFilter(); bassLP.type = 'lowpass'; bassLP.frequency.value = 480;
  bass.connect(bassLP); bassLP.connect(sum);

  const lead = ctx.createGain(); lead.gain.value = 0.06;
  const leadDelay = ctx.createDelay(2); leadDelay.delayTime.value = beat * 0.75;
  const fb = ctx.createGain(); fb.gain.value = 0.33;
  lead.connect(sum); lead.connect(leadDelay); leadDelay.connect(fb); fb.connect(leadDelay); fb.connect(sum);
  const leadSend = ctx.createGain(); leadSend.gain.value = 0.8; lead.connect(leadSend); leadSend.connect(verbIn);
  // Klangfarbe je Platte: Höhen, Lautstärke der Melodie, Hall, Knistern
  const FX = { lofi: {}, jazz: { tone: 7800, keysLP: 5200, keys: 0.2, lead: 0.12, verb: 0.24, crackle: 0.12, drumLP: 11000 },
    waltz: { tone: 7200, keysLP: 2600, keys: 0.16, lead: 0.13, verb: 0.62, crackle: 0.2 },
    dusty: { tone: 2600, keysLP: 1400, keys: 0.17, lead: 0.03, verb: 0.18, crackle: 1.0, drumLP: 4600 } }[ST] || {};
  if (FX.tone) tone.frequency.value = FX.tone;
  if (FX.keysLP) keysLP.frequency.value = FX.keysLP;
  if (FX.keys) keys.gain.value = FX.keys;
  if (FX.lead) lead.gain.value = FX.lead;
  if (FX.verb) verbIn.gain.value = FX.verb;
  if (FX.drumLP) drumLP.frequency.value = FX.drumLP;

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

  // Akkorde der Platte (Side A: Fmaj9, Em9, Dm9, Cmaj9), je zwei Takte
  const prog = T.prog;
  // weitere Instrumente für die anderen Platten
  const ride = (t, v) => {   // Ride-Becken: Rauschen hoch, dazu ein metallischer Ton
    t = Math.max(0, t);
    const n = noiseSrc(t, 0.5);
    const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 5200;
    const pk = ctx.createBiquadFilter(); pk.type = 'peaking'; pk.frequency.value = 7400; pk.gain.value = 8;
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + 0.003); g.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
    n.connect(hp); hp.connect(pk); pk.connect(g); g.connect(drums);
    const o = ctx.createOscillator(); o.type = 'square'; o.frequency.value = 5310;
    const og = ctx.createGain(); og.gain.setValueAtTime(v * 0.05, t); og.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
    o.connect(og); og.connect(drums); o.start(t); o.stop(t + 0.32);
  };
  const brush = (t, v, dur = 0.18) => {   // Besen auf der Snare: weiches Wischen
    t = Math.max(0, t);
    const n = noiseSrc(t, dur + 0.05);
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 2600; bp.Q.value = 0.4;
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v * 0.35, t + dur * 0.4); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    n.connect(bp); bp.connect(g); g.connect(drums);
  };
  const pianoNote = (m, t, dur, v) => {   // akustisches Klavier (hell, ohne Tremolo)
    const f = mtof(m), g = ctx.createGain();
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + 0.006); g.gain.setTargetAtTime(v * 0.3, t + 0.01, 0.25); g.gain.setTargetAtTime(0, t + dur, 0.08);
    for (const [type, k, a] of [['triangle', 1, 1], ['sine', 2, 0.3], ['sine', 3, 0.12]]) {
      const o = ctx.createOscillator(); o.type = type; o.frequency.value = f * k;
      const ga = ctx.createGain(); ga.gain.value = a; o.connect(ga); ga.connect(g); o.start(t); o.stop(t + dur + 0.6);
    }
    g.connect(keys);
  };
  const vibe = (m, t, dur, v) => {   // Vibraphon: Sinus mit Tremolo
    const f = mtof(m), g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + 0.006); g.gain.exponentialRampToValueAtTime(0.001, t + dur + 1.2);
    const tr = ctx.createGain(); tr.gain.value = 0.75;
    const l = ctx.createOscillator(); l.frequency.value = 5.5; const lg = ctx.createGain(); lg.gain.value = 0.25; l.connect(lg); lg.connect(tr.gain);
    const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = f;
    const o4 = ctx.createOscillator(); o4.type = 'sine'; o4.frequency.value = f * 4; const g4 = ctx.createGain(); g4.gain.value = 0.12;
    o.connect(g); o4.connect(g4); g4.connect(g); g.connect(tr); tr.connect(lead);
    const end = t + dur + 1.3; for (const x of [o, o4, l]) { x.start(t); x.stop(end); }
  };
  const bell = (m, t, dur, v) => {   // Spieluhr / Celesta: Grundton + unharmonische Obertöne
    const f = mtof(m);
    for (const [k, a, d] of [[1, 1, dur], [2.76, 0.35, dur * 0.4], [5.4, 0.12, dur * 0.2]]) {
      const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = f * k;
      const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v * a, t + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
      o.connect(g); g.connect(lead); o.start(t); o.stop(t + d + 0.05);
    }
  };
  const pad = (notes, t, dur, v) => {   // weiche Streicher
    for (const m of notes) {
      const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = mtof(m); o.detune.value = (rnd() - 0.5) * 12;
      const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1100;
      const g = ctx.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + dur * 0.35); g.gain.linearRampToValueAtTime(0, t + dur);
      o.connect(lp); lp.connect(g); g.connect(keys); o.start(t); o.stop(t + dur + 0.05);
    }
  };
  const pluck = (m, t, v) => {   // Pizzicato
    const o = ctx.createOscillator(); o.type = 'triangle'; o.frequency.value = mtof(m);
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + 0.005); g.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
    o.connect(g); g.connect(bass); o.start(t); o.stop(t + 0.55);
  };
  const third = (ch) => { const n = ch.notes.find((x) => [3, 4].includes((((x - ch.root) % 12) + 12) % 12)); return n != null ? ch.root + ((((n - ch.root) % 12) + 12) % 12) : ch.root + 4; };
  const s16 = beat / 4;
  const hum = () => (rnd() - 0.5) * 0.012;

  if (ST === 'jazz') {
    const tri = beat * 2 / 3;   // Swing-Achtel: das „und“ kommt auf die dritte Triole
    for (let b = 0; b < BARS; b++) {
      const t0 = b * bar, ch = T.prog[Math.floor(b / 2)], nx = T.prog[Math.floor((b + 1) / 2) % 4], second = b % 2 === 1;
      // Ride: ding, ding-da, ding, ding-da; Hi-Hat mit dem Fuß auf 2 und 4; Besen
      for (let i = 0; i < 4; i++) ride(t0 + i * beat + hum(), i % 2 ? 0.2 : 0.15);
      ride(t0 + beat + tri + hum(), 0.11); ride(t0 + 3 * beat + tri + hum(), 0.11);
      hat(t0 + beat, 0.1); hat(t0 + 3 * beat, 0.1);
      brush(t0, 0.5, beat * 1.6); brush(t0 + 2 * beat, 0.4, beat * 1.4);
      if (b === 7) { brush(t0 + 3 * beat + tri, 0.6, 0.12); }
      // laufender Bass in Vierteln, zum nächsten Akkord hin
      const r = ch.root, th = third(ch);
      const walk = second ? [r + 7, th, r + 5, nx.root + (nx.root > r ? -1 : 1)] : [r, th, r + 7, r + 9];
      walk.forEach((m, i) => bassNote(m, t0 + i * beat + hum() * 0.5, beat * 0.85, i ? 0.7 : 0.9));
      // Klavier im Charleston-Rhythmus: kurz auf 1, dann auf „2 und“
      const comp = (t, v) => ch.notes.forEach((m, i) => pianoNote(m, t + i * 0.006, beat * 0.45, v));
      comp(t0 + 0.005, 0.32); comp(t0 + beat + tri, 0.26);
      if (second) comp(t0 + 3 * beat + tri, 0.2);
    }
    for (const [bt, m, d] of T.mel) vibe(m, bt * beat + (bt % 1 ? beat * (2 / 3 - 0.5) : 0), d * beat, 0.5);
  } else if (ST === 'waltz') {
    for (let b = 0; b < BARS; b++) {
      const t0 = b * bar, ch = T.prog[Math.floor(b / 4) % 4];
      // „Umm“ auf 1 (Pizzicato), „pa-pa“ auf 2 und 3 (kurze Klavierakkorde), darunter Streicher
      pluck(b % 2 ? ch.root + 7 : ch.root, t0 + hum() * 0.5, 0.95);
      for (const k of [1, 2]) ch.notes.slice(1).forEach((m, i) => pianoNote(m, t0 + k * beat + i * 0.008 + hum() * 0.4, beat * 0.4, 0.22));
      if (b % 4 === 0) pad(ch.notes.map((m) => m - 12), t0, bar * 4.1, 0.05);
      hat(t0 + beat + beat * 0.5, 0.035); hat(t0 + 2 * beat + beat * 0.5, 0.03);
      // Spieluhr: kleine Arpeggios zwei Oktaven höher
      if (b % 2 === 1) for (let i = 0; i < 3; i++) bell(ch.notes[(i + b) % 4] + 24, t0 + i * beat, beat * 2.2, 0.08);
    }
    for (const [bt, m, d] of T.mel) bell(m + 12, bt * beat, Math.max(1.2, d * beat * 1.6), 0.36);
  } else if (ST === 'dusty') {
    for (let b = 0; b < BARS; b++) {
      const t0 = b * bar, ch = T.prog[Math.floor(b / 2)], second = b % 2 === 1;
      // Boom-Bap: schwere Kick, harte Snare, gerade Hi-Hats in Sechzehnteln mit Betonung
      const kicks = [0, 7, 10]; if (second) kicks.push(13);
      for (const st of kicks) kick(t0 + st * s16 + hum() * 0.4, st ? 0.85 : 1);
      snare(t0 + 4 * s16 + hum(), 1.1); snare(t0 + 12 * s16 + hum(), 1.15);
      for (let st = 0; st < 16; st++) if (st % 2 === 0 || rnd() < 0.45) hat(t0 + st * s16 + hum(), [0.2, 0.08, 0.13, 0.07][st % 4]);
      // staubige Klavier-Stöße: kurz, gefiltert, leiernd
      const stab = (t, v) => ch.notes.forEach((m, i) => epNote(m, t + i * 0.012, beat * 0.9, v));
      stab(t0 + 0.02, 0.6); stab(t0 + 2.5 * beat, 0.4);
      // Sub-Bass: lange tiefe Töne
      bassNote(ch.root, t0, beat * 1.8, 1); bassNote(ch.root, t0 + 2.5 * beat, beat * 1.2, 0.8);
    }
    for (const [bt, m, d] of T.mel) leadNote(m - 12, bt * beat, d * beat);
  } else {
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
    const mel = T.mel;
    for (const [bt, m, d] of mel) leadNote(m, bt * beat + (bt % 1 ? swing : 0), d * beat);
  }

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
  const crG = ctx.createGain(); crG.gain.value = FX.crackle ?? 0.35;
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
  // gleich laut für alle Platten: auf mittlere Lautheit (RMS) bringen, seltene Spitzen (Knackser) weich begrenzen
  let sq = 0; for (const d of res) for (let i = 0; i < N; i++) sq += d[i] * d[i];
  const rms = Math.sqrt(sq / (2 * N)) || 1;
  const k = Math.min(0.24 / rms, 4 / (peak || 1));
  for (const d of res) for (let i = 0; i < N; i++) {
    const v = d[i] * k, a = Math.abs(v);
    d[i] = a < 0.8 ? v : Math.sign(v) * (0.8 + 0.19 * Math.tanh((a - 0.8) / 0.19));
  }
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
    const buf = A.custom || await (A.loop ||= renderLoop(44100, TR()));
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
  scratchPos: 0, tv: 0, lastMove: 0, nudge: null, visible: false, shown: true,
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
let onChange = null;
function syncUI() {
  if (startBtn) {
    startBtn.setAttribute('aria-pressed', String(S.playing));
    const lbl = startBtn.querySelector('.lbl'); if (lbl) lbl.textContent = S.playing ? 'Stopp' : 'Start';
  }
  recBtn?.setAttribute('aria-pressed', String(S.playing));
  onChange?.(S.playing);
}
// Platte im Salon: schwarzes Vinyl, goldene Rillen-Glanzlichter (das Label kommt aus TRACKS, je Platte eigene Farbe)
const PAL = { vinyl: ['rgba(52,36,30,.99)', 'rgba(24,14,10,.99)', 'rgba(8,4,3,1)'], marble: ['rgba(212,169,79,.08)', 'rgba(0,0,0,.25)'], groove: '200,160,110', gap: '255,230,190', rim: 'rgba(0,0,0,.85)',
  font: ['400 {s}px "Pinyon Script", "Great Vibes", Georgia, serif', '500 {s}px Oswald, "Arial Narrow", sans-serif'] };

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
  const P = PAL;
  const c = document.createElement('canvas'); c.width = c.height = size;
  const x = c.getContext('2d'); const R = size / 2; const rnd = mulberry32(11);
  x.translate(R, R);
  const gr = x.createRadialGradient(-R * 0.25, -R * 0.3, R * 0.05, 0, 0, R);
  gr.addColorStop(0, P.vinyl[0]); gr.addColorStop(0.55, P.vinyl[1]); gr.addColorStop(1, P.vinyl[2]);
  x.beginPath(); x.arc(0, 0, R, 0, TAU); x.fillStyle = gr; x.fill();
  x.save(); x.clip();
  // Marmorierung im farbigen Vinyl
  for (let i = 0; i < 26; i++) {
    const a = rnd() * TAU, d = Math.sqrt(rnd()) * R * 0.95, r = R * (0.1 + rnd() * 0.3), light = rnd() < 0.5;
    x.save(); x.rotate(a); x.translate(d, 0); x.scale(0.32, 1);
    const rg = x.createRadialGradient(0, 0, 0, 0, 0, r);
    rg.addColorStop(0, light ? P.marble[0] : P.marble[1]); rg.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = rg; x.fillRect(-r, -r, 2 * r, 2 * r); x.restore();
  }
  // Rillen mit Pausen zwischen den Stücken
  const lab = R * 0.34, inner = R * 0.37, outer = R * 0.955;
  const gaps = [0.2, 0.37, 0.52, 0.68, 0.83].map((f) => outer - (outer - inner) * f);
  const step = Math.max(1, size / 560);
  x.lineWidth = step * 0.55;
  for (let r = inner; r < outer; r += step) {
    if (gaps.some((gp) => Math.abs(r - gp) < step * 2.4)) continue;
    x.strokeStyle = `rgba(${P.groove},${(0.08 + rnd() * 0.16).toFixed(3)})`;
    x.beginPath(); x.arc(0, 0, r, 0, TAU); x.stroke();
  }
  x.lineWidth = step * 2.6; x.strokeStyle = `rgba(${P.gap},.12)`;
  for (const gp of gaps) { x.beginPath(); x.arc(0, 0, gp, 0, TAU); x.stroke(); }
  x.restore();
  x.beginPath(); x.arc(0, 0, R - Math.max(1, size / 500), 0, TAU); x.strokeStyle = P.rim; x.lineWidth = Math.max(1.5, size / 300); x.stroke();
  // Label: Farbe, Titel und Untertitel der aufgelegten Platte (TRACKS)
  const lg = x.createRadialGradient(-lab * 0.3, -lab * 0.3, lab * 0.1, 0, 0, lab);
  const LBL = TR().label;
  lg.addColorStop(0, LBL[0]); lg.addColorStop(1, LBL[1]);
  x.beginPath(); x.arc(0, 0, lab, 0, TAU); x.fillStyle = lg; x.fill();
  x.strokeStyle = 'rgba(58,10,20,.3)'; x.lineWidth = Math.max(1, size / 700);
  x.beginPath(); x.arc(0, 0, lab * 0.9, 0, TAU); x.stroke();
  x.fillStyle = '#3A0A14'; x.textAlign = 'center'; x.textBaseline = 'alphabetic';
  const f1 = P.font[0].replace('{s}', lab * 0.34);
  const f2 = (k) => P.font[1].replace('{s}', lab * k);
  if (TR().dark) x.fillStyle = '#f3ead2';
  x.font = f1; x.fillText(TR().title, 0, -lab * 0.3);
  x.font = f2(0.13); x.fillText(TR().sub, 0, -lab * 0.08);
  x.font = f2(0.11); x.fillText('33 U/min', 0, lab * 0.5);
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

function rrect(x, X, Y, w, h, r) { x.beginPath(); x.roundRect ? x.roundRect(X, Y, w, h, r) : x.rect(X, Y, w, h); }

/* ---------- Grammophon (Variante 'gramo') als echtes 3D-Modell ----------
   Kleine 3D-Szene in Parallelprojektion (Kamera schräg von rechts oben: Deckel, Front und rechte Seite sichtbar).
   Aufbau wie bei echten Trichter-Grammophonen: Holzgehäuse auf Füßen, Teller mit Filz, hinten rechts der
   Messing-Halter mit dem drehbaren Tonarm; aus dem Fuß des Tonarms steigt das Knie, der Trichter öffnet sich
   nach vorn zum Zuhörer. Vorn am Tonarm die Schalldose mit Nadel, rechts an der Seite die Kurbel.
   Ebene Flächen (Holz, Teller, Platte) werden mit einer affinen Abbildung gezeichnet – bei Parallelprojektion
   ist das exakt. Der Trichter ist eine Drehfläche aus Ringen, gezeichnet von hinten nach vorn (Maleralgorithmus). */
let TILT = 1;   // nur für die alte Ellipsen-Logik; das Grammophon rechnet mit G.inv
const RAD = Math.PI / 180;
const CAM = { yaw: -34 * RAD, pitch: 22 * RAD };
const norm3 = (v) => { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; };
const sub3 = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const add3 = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const mul3 = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
const dot3 = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross3 = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const LIGHT = norm3([-0.45, 0.85, 0.6]);
// Welt (x rechts, y oben, z nach vorn) → Kamera (x rechts, y oben, z zum Betrachter)
function view3(p) {
  const ca = Math.cos(CAM.yaw), sa = Math.sin(CAM.yaw), cp = Math.cos(CAM.pitch), sp = Math.sin(CAM.pitch);
  const x1 = p[0] * ca + p[2] * sa, z1 = -p[0] * sa + p[2] * ca;
  return [x1, p[1] * cp - z1 * sp, p[1] * sp + z1 * cp];
}
const EYE = norm3([-Math.sin(CAM.yaw) * Math.cos(CAM.pitch), Math.sin(CAM.pitch), Math.cos(CAM.yaw) * Math.cos(CAM.pitch)]);   // Richtung zum Betrachter
const P = (p) => { const v = view3(p); return [G.ox + G.s * v[0], G.oy - G.s * v[1], v[2]]; };
const shade = (n) => 0.42 + 0.58 * Math.max(0, dot3(n, LIGHT));

// Maße in „Zentimetern“
const BOX = { x0: -17, x1: 17, z0: -15, z1: 15, y0: 1.4, y1: 12.5 };
// Sockel aus dunklem Holz, auf dem das Grammophon steht (in derselben 3D-Ansicht, damit Füße und Schatten passen)
const PLINTH = { x0: -20, x1: 23, z0: -17, z1: 19, y0: -2.6, y1: 0 };
const PLAT = { c: [-3, 13.1, 1], R: 12.4, Rr: 11.6 };
const PIV = [11.5, 12.5, -9.5];            // Tonarm-Drehpunkt im Halter hinten rechts
const PIV_TOP = 15.2;                       // Oberkante des Halters
const ARM_Y = PLAT.c[1] + 3.4;              // Höhe des Tonarms über der Platte
const HORN = { p: [[11.5, 14.8, -9.5], [11.5, 25, -12], [3, 32, -9], [-1, 34.5, 4]], r0: 1.05, r1: 12.8, n: 30, m: 36 };   // Mündung schaut schräg nach vorn zum Betrachter

function bez3(p, t) {
  const u = 1 - t, a = u * u * u, b = 3 * u * u * t, c = 3 * u * t * t, d = t * t * t;
  return [0, 1, 2].map((k) => a * p[0][k] + b * p[1][k] + c * p[2][k] + d * p[3][k]);
}
function bez3d(p, t) {
  const u = 1 - t;
  return [0, 1, 2].map((k) => 3 * u * u * (p[1][k] - p[0][k]) + 6 * u * t * (p[2][k] - p[1][k]) + 3 * t * t * (p[3][k] - p[2][k]));
}
// Ringe des Trichters: Mittellinie (Bézier), Radius wächst exponentiell (wie ein echter Exponentialtrichter)
function hornRings() {
  const R = [];
  for (let i = 0; i <= HORN.n; i++) {
    const t = i / HORN.n, c = bez3(HORN.p, t), T = norm3(bez3d(HORN.p, t));
    const ref = Math.abs(T[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
    const u = norm3(cross3(T, ref)), v = cross3(u, T);
    const r = HORN.r0 + (HORN.r1 - HORN.r0) * Math.pow(t, 3.2);
    const pts = [];
    for (let j = 0; j < HORN.m; j++) { const a = (j / HORN.m) * Math.PI * 2; pts.push(add3(c, add3(mul3(u, r * Math.cos(a)), mul3(v, r * Math.sin(a))))); }
    R.push({ t, c, pts });
  }
  return R;
}

function layoutGramo() {
  const w = deck.clientWidth, h = deck.clientHeight;
  if (!w || !h) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  cvs.width = Math.round(w * dpr); cvs.height = Math.round(h * dpr);
  const W = cvs.width, H = cvs.height;
  Object.assign(G, { dpr, W, H, s: 1, ox: 0, oy: 0 });
  G.rings = hornRings();
  // Bildausschnitt so wählen, dass alles hineinpasst
  const pts = [];
  for (const x of [BOX.x0, BOX.x1]) for (const y of [0, BOX.y1]) for (const z of [BOX.z0, BOX.z1]) pts.push([x, y, z]);
  for (const x of [PLINTH.x0, PLINTH.x1]) for (const y of [PLINTH.y0, PLINTH.y1]) for (const z of [PLINTH.z0, PLINTH.z1]) pts.push([x, y, z]);
  for (const r of G.rings.slice(-4)) pts.push(...r.pts);
  pts.push([BOX.x1 + 4.5, 2, 4]);
  let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
  for (const p of pts) { const v = view3(p); x0 = Math.min(x0, v[0]); x1 = Math.max(x1, v[0]); y0 = Math.min(y0, v[1]); y1 = Math.max(y1, v[1]); }
  const m = 0.03 * W;
  G.s = Math.min((W - 2 * m) / (x1 - x0), (H - 2 * m) / (y1 - y0));
  G.ox = (W - (x1 - x0) * G.s) / 2 - x0 * G.s;
  G.oy = (H - (y1 - y0) * G.s) / 2 + y1 * G.s;
  // Plattenebene: Ursprung O und Bildschirm-Vektoren für 1 cm in x und z
  const O = P(PLAT.c), Ux = P(add3(PLAT.c, [1, 0, 0])), Vz = P(add3(PLAT.c, [0, 0, 1]));
  G.pl = { O, U: [Ux[0] - O[0], Ux[1] - O[1]], V: [Vz[0] - O[0], Vz[1] - O[1]] };
  const det = G.pl.U[0] * G.pl.V[1] - G.pl.U[1] * G.pl.V[0];
  G.inv = [G.pl.V[1] / det, -G.pl.V[0] / det, -G.pl.U[1] / det, G.pl.U[0] / det];   // Bildschirm → Ebene
  G.Rr = PLAT.Rr;
  // Tonarm in der Ebene (relativ zur Tellermitte)
  G.pfx = PIV[0] - PLAT.c[0]; G.pfz = PIV[2] - PLAT.c[2];
  const phi = -0.5, rr = PLAT.Rr * 0.86;
  const nx = rr * Math.cos(phi), nz = rr * Math.sin(phi);
  G.L = Math.hypot(nx - G.pfx, nz - G.pfz);
  G.play = Math.atan2(nz - G.pfz, nx - G.pfx);
  G.rest = Math.PI / 2 - 0.15;
  if (S.arm === null) S.arm = G.rest;
  G.recSize = Math.round(2 * PLAT.Rr * G.s * 1.05);
  G.rec = bakeRecord(G.recSize);
  G.sheen = bakeSheen(G.recSize);
  G.base = bakeGramoBase();
  G.bell = bakeGramoHorn();
  const nk = P(HORN.p[0]); G.T = [nk[0], nk[1]];
  if (startBtn) {   // Start-Knopf rechts auf der Front
    const k = P([11.5, 6.6, BOX.z1]), kr = 1.3 * G.s;
    Object.assign(startBtn.style, { left: `${(k[0] - kr) / dpr}px`, top: `${(k[1] - kr) / dpr}px`, width: `${(2 * kr) / dpr}px`, height: `${(2 * kr) / dpr}px` });
  }
  // Klickfläche der Platte = umschließendes Rechteck der Ellipse
  const ex = PLAT.Rr * Math.hypot(G.pl.U[0], G.pl.V[0]), ey = PLAT.Rr * Math.hypot(G.pl.U[1], G.pl.V[1]);
  Object.assign(recBtn.style, { left: `${(O[0] - ex) / dpr}px`, top: `${(O[1] - ey) / dpr}px`, width: `${(2 * ex) / dpr}px`, height: `${(2 * ey) / dpr}px` });
  draw();
}

// Holz-Textur (einmal), wird auf jede Fläche affin gelegt
let WOOD = null;
function woodTex() {
  if (WOOD) return WOOD;
  const c = document.createElement('canvas'); c.width = c.height = 512;
  const x = c.getContext('2d');
  const g = x.createLinearGradient(0, 0, 0, 512); g.addColorStop(0, '#7a4a22'); g.addColorStop(0.5, '#6a3d1b'); g.addColorStop(1, '#5a3416');
  x.fillStyle = g; x.fillRect(0, 0, 512, 512);
  const rg = mulberry32(4);
  for (let k = 0; k < 70; k++) {
    const y0 = rg() * 512, amp = 2 + rg() * 7, ph = rg() * TAU, fr = 60 + rg() * 90;
    x.beginPath(); for (let xx = 0; xx <= 512; xx += 8) { const yy = y0 + Math.sin(xx / fr + ph) * amp; if (xx === 0) x.moveTo(xx, yy); else x.lineTo(xx, yy); }
    x.strokeStyle = `rgba(25,10,2,${(0.06 + rg() * 0.16).toFixed(3)})`; x.lineWidth = 0.8 + rg() * 2.2; x.stroke();
  }
  WOOD = c; return c;
}
// Fläche: Ecke F0, Kanten E1 (u) und E2 (v) in Weltkoordinaten
function face(x, F0, E1, E2, n, fill) {
  const a = P(F0), b = P(add3(F0, E1)), c = P(add3(F0, E2)), d = P(add3(add3(F0, E1), E2));
  x.save();
  x.beginPath(); x.moveTo(a[0], a[1]); x.lineTo(b[0], b[1]); x.lineTo(d[0], d[1]); x.lineTo(c[0], c[1]); x.closePath(); x.clip();
  if (fill) { x.fillStyle = fill; x.fill(); }
  else { x.setTransform(...[(b[0] - a[0]) / 512, (b[1] - a[1]) / 512, (c[0] - a[0]) / 512, (c[1] - a[1]) / 512, a[0], a[1]]); x.drawImage(woodTex(), 0, 0); x.setTransform(1, 0, 0, 1, 0, 0); }
  x.fillStyle = `rgba(0,0,0,${((1 - shade(n)) * 0.85).toFixed(3)})`; x.fill();
  x.restore();
}
const brassAt = (k) => { const b = Math.min(1, k); return `rgb(${Math.round(70 + 170 * b)},${Math.round(48 + 135 * b)},${Math.round(12 + 70 * b)})`; };
function line3(x, pts, width, color) {
  x.beginPath(); pts.forEach((p, i) => { const q = P(p); if (i) x.lineTo(q[0], q[1]); else x.moveTo(q[0], q[1]); });
  x.lineWidth = width * G.s; x.strokeStyle = color; x.lineCap = 'round'; x.lineJoin = 'round'; x.stroke();
}
function ring3(x, c, u, v, r, n = 28) {   // Kreis im Raum als Pfad
  x.beginPath();
  for (let j = 0; j <= n; j++) { const a = (j / n) * TAU, q = P(add3(c, add3(mul3(u, r * Math.cos(a)), mul3(v, r * Math.sin(a))))); if (j) x.lineTo(q[0], q[1]); else x.moveTo(q[0], q[1]); }
  x.closePath();
}
function inPlane(x, cb) {   // in der Plattenebene zeichnen (Einheit: cm, Ursprung Tellermitte)
  const { O, U, V } = G.pl;
  x.save(); x.setTransform(U[0], U[1], V[0], V[1], O[0], O[1]); cb(); x.restore();
}
function bakeGramoBase() {
  const c = document.createElement('canvas'); c.width = G.W; c.height = G.H;
  const x = c.getContext('2d'), { x0, x1, z0, z1, y0, y1 } = BOX, hgt = y1 - y0;
  // Sockel: Schatten auf der Wand/dem Boden darunter, dann Front, rechte Seite und Oberseite aus dunklem Holz, Messingkante
  {
    const S = PLINTH, sh = S.y1 - S.y0;
    x.save(); x.filter = `blur(${Math.round(G.s * 2.2)}px)`; x.beginPath();
    [[S.x0, S.y0 - 0.6, S.z1 + 1.5], [S.x1 + 1.5, S.y0 - 0.6, S.z1 + 1.5], [S.x1 + 1.5, S.y0 - 0.6, S.z0], [S.x0, S.y0 - 0.6, S.z0]].forEach((p, i) => { const q = P(p); if (i) x.lineTo(q[0], q[1]); else x.moveTo(q[0], q[1]); });
    x.closePath(); x.fillStyle = 'rgba(0,0,0,.55)'; x.fill(); x.restore();
    const dark = 'rgba(18,7,2,.5)';
    face(x, [S.x0, S.y1, S.z1], [S.x1 - S.x0, 0, 0], [0, -sh, 0], [0, 0, 1]); face(x, [S.x0, S.y1, S.z1], [S.x1 - S.x0, 0, 0], [0, -sh, 0], [0, 0, 1], dark);
    face(x, [S.x1, S.y1, S.z1], [0, 0, S.z0 - S.z1], [0, -sh, 0], [1, 0, 0]); face(x, [S.x1, S.y1, S.z1], [0, 0, S.z0 - S.z1], [0, -sh, 0], [1, 0, 0], dark);
    face(x, [S.x0, S.y1, S.z0], [S.x1 - S.x0, 0, 0], [0, 0, S.z1 - S.z0], [0, 1, 0]); face(x, [S.x0, S.y1, S.z0], [S.x1 - S.x0, 0, 0], [0, 0, S.z1 - S.z0], [0, 1, 0], 'rgba(18,7,2,.35)');
    line3(x, [[S.x0, S.y1, S.z1], [S.x1, S.y1, S.z1], [S.x1, S.y1, S.z0]], 0.3, '#c79a4a');                 // Messingkante oben
    line3(x, [[S.x0, S.y1 - 0.45, S.z1], [S.x1, S.y1 - 0.45, S.z1], [S.x1, S.y1 - 0.45, S.z0]], 0.12, 'rgba(0,0,0,.45)');
  }
  // Schatten des Grammophons auf dem Sockel
  x.save(); x.filter = `blur(${Math.round(G.s * 1.6)}px)`; x.beginPath();
  [[x0 - 1, 0, z0 + 1], [x1 + 2, 0, z0 + 1], [x1 + 2, 0, z1 + 2], [x0 - 1, 0, z1 + 2]].forEach((p, i) => { const q = P(p); if (i) x.lineTo(q[0], q[1]); else x.moveTo(q[0], q[1]); });
  x.closePath(); x.fillStyle = 'rgba(0,0,0,.45)'; x.fill(); x.restore();
  // Füße (Messingkugeln), hinten links ist verdeckt
  for (const [fx, fz] of [[x1 - 2, z0 + 2], [x0 + 2, z1 - 2], [x1 - 2, z1 - 2]]) {
    const q = P([fx, 0.7, fz]), r = 1.1 * G.s;
    const g = x.createRadialGradient(q[0] - r * 0.35, q[1] - r * 0.35, r * 0.1, q[0], q[1], r);
    g.addColorStop(0, '#fff1b8'); g.addColorStop(0.5, '#c99a3e'); g.addColorStop(1, '#5a3c10');
    x.beginPath(); x.arc(q[0], q[1], r, 0, TAU); x.fillStyle = g; x.fill();
  }
  // drei sichtbare Flächen
  face(x, [x0, y1, z1], [x1 - x0, 0, 0], [0, -hgt, 0], [0, 0, 1]);          // Front
  face(x, [x1, y1, z1], [0, 0, z0 - z1], [0, -hgt, 0], [1, 0, 0]);          // rechte Seite
  face(x, [x0, y1, z0], [x1 - x0, 0, 0], [0, 0, z1 - z0], [0, 1, 0]);       // Deckel
  // Kanten: Lichtkante vorn oben und an der rechten vorderen Ecke, Sockelleiste unten
  line3(x, [[x0, y1, z1], [x1, y1, z1], [x1, y1, z0]], 0.22, 'rgba(255,220,170,.45)');
  line3(x, [[x1, y1, z1], [x1, y0, z1]], 0.18, 'rgba(255,220,170,.25)');
  line3(x, [[x0, y0 + 0.6, z1], [x1, y0 + 0.6, z1], [x1, y0 + 0.6, z0]], 0.9, 'rgba(0,0,0,.28)');
  // Messing-Einlage im Deckel und Füllung an der Front
  line3(x, [[x0 + 1.2, y1, z0 + 1.2], [x1 - 1.2, y1, z0 + 1.2], [x1 - 1.2, y1, z1 - 1.2], [x0 + 1.2, y1, z1 - 1.2], [x0 + 1.2, y1, z0 + 1.2]], 0.28, '#c79a3e');
  line3(x, [[x0 + 1.6, y1 - 1.6, z1], [x1 - 1.6, y1 - 1.6, z1], [x1 - 1.6, y0 + 1.8, z1], [x0 + 1.6, y0 + 1.8, z1], [x0 + 1.6, y1 - 1.6, z1]], 0.32, 'rgba(0,0,0,.4)');
  line3(x, [[x0 + 1.9, y1 - 1.9, z1], [x1 - 1.9, y1 - 1.9, z1]], 0.14, 'rgba(255,214,160,.2)');
  // Messing-Schild „F · K“ auf der Front (Text liegt in der Fläche)
  {
    const sw = 7, sh = 2.4, sx = -5.5, sy = 7.6, a = P([sx, sy, z1]), b = P([sx + 1, sy, z1]), cc = P([sx, sy - 1, z1]);
    x.save(); x.setTransform(b[0] - a[0], b[1] - a[1], cc[0] - a[0], cc[1] - a[1], a[0], a[1]);
    rrect(x, 0, 0, sw, sh, 0.35);
    const g = x.createLinearGradient(0, 0, sw, sh); g.addColorStop(0, '#7c5a1c'); g.addColorStop(0.45, '#fff1b8'); g.addColorStop(1, '#8a6420');
    x.fillStyle = g; x.fill();
    x.fillStyle = '#3a2208'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.font = '500 1.2px Oswald, "Arial Narrow", sans-serif';
    x.fillText('F · K', sw / 2, sh / 2 + 0.08);
    x.restore();
  }
  // Kurbel an der rechten Seite: Welle, Arm, Holzgriff
  const kc = [x1, 6.6, 4];
  line3(x, [kc, add3(kc, [3.2, 0, 0])], 0.75, brassAt(0.75));
  line3(x, [add3(kc, [3.2, 0, 0]), add3(kc, [3.2, -4, 0])], 0.7, brassAt(0.6));
  line3(x, [add3(kc, [3.2, -4, 0]), add3(kc, [5, -4, 0])], 1.1, '#3a1d0b');
  ring3(x, kc, [0, 1, 0], [0, 0, 1], 0.9, 14); x.fillStyle = brassAt(0.9); x.fill();
  // Teller: Messingrand mit Dicke, Bordeaux-Filz
  inPlane(x, () => {
    x.save(); x.translate(0, 0); x.beginPath(); x.arc(0.2, 0.5, PLAT.R, 0, TAU); x.fillStyle = 'rgba(0,0,0,.35)'; x.fill(); x.restore();
  });
  { const lowO = P(add3(PLAT.c, [0, -0.7, 0])); const { U, V } = G.pl; x.save(); x.setTransform(U[0], U[1], V[0], V[1], lowO[0], lowO[1]); x.beginPath(); x.arc(0, 0, PLAT.R, 0, TAU); x.fillStyle = '#6a4a14'; x.fill(); x.restore(); }
  inPlane(x, () => {
    const g = x.createLinearGradient(-PLAT.R, -PLAT.R, PLAT.R, PLAT.R); g.addColorStop(0, '#fff1b8'); g.addColorStop(0.5, '#c99a3e'); g.addColorStop(1, '#6a4a14');
    x.beginPath(); x.arc(0, 0, PLAT.R, 0, TAU); x.fillStyle = g; x.fill();
    x.beginPath(); x.arc(0, 0, PLAT.R * 0.955, 0, TAU); x.fillStyle = '#4a0c16'; x.fill();
  });
  // Halter hinten rechts: Messingsäule, in der der Tonarm sitzt
  const col = (yb, yt, r, k) => {
    const up = [0, 1, 0], u = [1, 0, 0], v = [0, 0, 1];
    const lb = P([PIV[0] - r, yb, PIV[2]]), rb = P([PIV[0] + r, yb, PIV[2]]);
    const vx = view3([1, 0, 0]), lw = r * G.s * Math.hypot(vx[0], vx[1]);
    const cb = P([PIV[0], yb, PIV[2]]), ct = P([PIV[0], yt, PIV[2]]);
    const g = x.createLinearGradient(cb[0] - lw, 0, cb[0] + lw, 0); g.addColorStop(0, '#5a3c10'); g.addColorStop(0.35, '#fff1b8'); g.addColorStop(0.7, '#c99a3e'); g.addColorStop(1, '#4f3410');
    ring3(x, [PIV[0], yb, PIV[2]], u, v, r); x.fillStyle = g; x.fill();
    x.fillStyle = g; x.fillRect(cb[0] - lw, ct[1], 2 * lw, cb[1] - ct[1]);
    ring3(x, [PIV[0], yt, PIV[2]], u, v, r); x.fillStyle = brassAt(k); x.fill();
    void lb; void rb; void up;
  };
  col(y1, y1 + 0.6, 2.6, 0.7);
  col(y1 + 0.6, PIV_TOP, 1.5, 0.95);
  return c;
}
function bakeGramoHorn() {
  const c = document.createElement('canvas'); c.width = G.W; c.height = G.H;
  const x = c.getContext('2d'), R = G.rings, m = HORN.m;
  const quads = [];
  for (let i = 0; i < R.length - 1; i++) {
    for (let j = 0; j < m; j++) {
      const a = R[i].pts[j], b = R[i].pts[(j + 1) % m], cc = R[i + 1].pts[(j + 1) % m], d = R[i + 1].pts[j];
      let n = norm3(cross3(sub3(b, a), sub3(d, a)));
      if (dot3(n, sub3(a, R[i].c)) < 0) n = mul3(n, -1);                    // Normale nach außen
      const pa = P(a), pb = P(b), pc = P(cc), pd = P(d);
      quads.push({ pts: [pa, pb, pc, pd], z: (pa[2] + pb[2] + pc[2] + pd[2]) / 4, n, t: (R[i].t + R[i + 1].t) / 2, seam: j % 3 === 0 });
    }
  }
  quads.sort((q1, q2) => q1.z - q2.z);
  const H = norm3(add3(LIGHT, EYE));
  for (const q of quads) {
    const outer = dot3(q.n, EYE) > 0;
    const n = outer ? q.n : mul3(q.n, -1);
    const k = Math.max(0, dot3(n, LIGHT)), sp = Math.pow(Math.max(0, dot3(n, H)), 28);
    let r, g, b;
    if (outer) { const f = 0.58 + 0.6 * k; r = 222 * f + 255 * sp * 0.6; g = 176 * f + 245 * sp * 0.6; b = 84 * f + 200 * sp * 0.6; }
    else { const deep = 0.22 + 0.78 * Math.pow(q.t, 0.7), f = (0.6 + 0.5 * k) * deep; r = 225 * f + 255 * sp * 0.35; g = 175 * f + 240 * sp * 0.35; b = 85 * f + 190 * sp * 0.35; }
    const col = `rgb(${Math.min(255, r) | 0},${Math.min(255, g) | 0},${Math.min(255, b) | 0})`;
    x.beginPath(); q.pts.forEach((p, i) => (i ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1]))); x.closePath();
    x.fillStyle = col; x.fill(); x.strokeStyle = col; x.lineWidth = 0.8; x.stroke();
    if (q.seam) { x.beginPath(); x.moveTo(q.pts[0][0], q.pts[0][1]); x.lineTo(q.pts[3][0], q.pts[3][1]); x.strokeStyle = 'rgba(70,45,8,.35)'; x.lineWidth = Math.max(1, G.s * 0.08); x.stroke(); }
  }
  // gerollter Rand der Mündung
  const last = R[R.length - 1].pts;
  x.beginPath(); last.forEach((p, i) => { const q = P(p); if (i) x.lineTo(q[0], q[1]); else x.moveTo(q[0], q[1]); }); x.closePath();
  x.strokeStyle = '#5a3c10'; x.lineWidth = G.s * 0.55; x.stroke();
  x.strokeStyle = '#fff1b8'; x.lineWidth = G.s * 0.22; x.stroke();
  // Manschette am Fuß, wo der Trichter in den Halter geht
  const T = norm3(bez3d(HORN.p, 0)), u = norm3(cross3(T, [1, 0, 0])), v = cross3(u, T);
  ring3(x, HORN.p[0], u, v, 1.6); x.fillStyle = brassAt(0.8); x.fill();
  return c;
}
function drawGramoArm(x, ang, lift) {
  const cx = PLAT.c[0], cz = PLAT.c[2];
  const ex = cx + G.pfx + Math.cos(ang) * G.L, ez = cz + G.pfz + Math.sin(ang) * G.L;
  const dir = norm3([Math.cos(ang), 0, Math.sin(ang)]);
  const ly = lift * 1.6;
  const E = [ex, ARM_Y + ly, ez];                          // Ende des Rohrs über der Nadel
  const base = [PIV[0], ARM_Y + 0.3, PIV[2]];
  // Schatten des Arms auf der Platte
  line3(x, [[PIV[0] + 0.6, PLAT.c[1] + 0.05, PIV[2] + 0.8], [ex + 0.8, PLAT.c[1] + 0.05, ez + 1]], 1.1, 'rgba(0,0,0,.28)');
  // senkrechtes Stück aus dem Halter, dann das waagrechte, leicht verjüngte Rohr
  line3(x, [[PIV[0], PIV_TOP, PIV[2]], base], 1.5, brassAt(0.7));
  const a = P(base), b = P(sub3(E, mul3(dir, 1.2)));
  const dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy) || 1, nx = -dy / len, ny = dx / len, r0 = 0.75 * G.s, r1 = 0.45 * G.s;
  const g = x.createLinearGradient(a[0] + nx * r0, a[1] + ny * r0, a[0] - nx * r0, a[1] - ny * r0);
  g.addColorStop(0, '#5a3c10'); g.addColorStop(0.45, '#fff1b8'); g.addColorStop(0.7, '#c99a3e'); g.addColorStop(1, '#4f3410');
  x.beginPath(); x.moveTo(a[0] + nx * r0, a[1] + ny * r0); x.lineTo(b[0] + nx * r1, b[1] + ny * r1); x.lineTo(b[0] - nx * r1, b[1] - ny * r1); x.lineTo(a[0] - nx * r0, a[1] - ny * r0); x.closePath();
  x.fillStyle = g; x.fill();
  ring3(x, base, [1, 0, 0], [0, 0, 1], 1.2, 18); x.fillStyle = brassAt(0.85); x.fill();
  // Schalldose: runde Dose, Membran zeigt in Armrichtung, Nadel nach unten auf die Platte
  const up = [0, 1, 0], side = norm3(cross3(dir, up));
  const sc = add3(E, [0, -0.2, 0]);
  line3(x, [add3(sc, [0, -1.6, 0]), [ex, PLAT.c[1] + 0.1 + ly * 0.3, ez]], 0.18, '#1a1006');
  ring3(x, sc, side, up, 2, 26); x.fillStyle = brassAt(0.55); x.fill();
  ring3(x, add3(sc, mul3(dir, 0.35)), side, up, 1.55, 26);
  const q = P(sc), mg = x.createRadialGradient(q[0] - G.s * 0.5, q[1] - G.s * 0.6, 0, q[0], q[1], G.s * 1.8);
  mg.addColorStop(0, '#f6eed8'); mg.addColorStop(1, '#a89878'); x.fillStyle = mg; x.fill();
}
function drawGramo() {
  const x = g2d;
  x.clearRect(0, 0, G.W, G.H);
  x.drawImage(G.base, 0, 0);
  // Platte: liegt in der Tellerebene und dreht sich darin
  const { O, U, V } = G.pl;
  x.save(); x.setTransform(U[0], U[1], V[0], V[1], O[0], O[1]);
  x.save(); x.rotate(recAngle()); x.drawImage(G.rec, -PLAT.Rr, -PLAT.Rr, 2 * PLAT.Rr, 2 * PLAT.Rr); x.restore();
  x.globalCompositeOperation = 'screen'; x.drawImage(G.sheen, -PLAT.Rr, -PLAT.Rr, 2 * PLAT.Rr, 2 * PLAT.Rr); x.globalCompositeOperation = 'source-over';
  x.beginPath(); x.arc(0, 0, 0.45, 0, TAU); x.fillStyle = '#d4a94f'; x.fill();
  x.restore();
  // Trichter „atmet“ im Takt (84 BPM), solange Musik läuft
  if (S.playing && !reduceMotion()) {
    const beat = (performance.now() / 1000 * TR().bpm / 60) % 1, k = 1 + 0.015 * Math.sin(Math.PI * beat) ** 2, [tx, ty] = G.T;
    x.save(); x.translate(tx, ty); x.scale(k, k); x.translate(-tx, -ty); x.drawImage(G.bell, 0, 0); x.restore();
  } else x.drawImage(G.bell, 0, 0);
  const target = S.armDown ? G.play : G.rest;
  drawGramoArm(x, S.arm, Math.min(1, Math.abs(target - S.arm) * 5) * (S.needle ? 0 : 1));
}

function layout() { layoutGramo(); }

function recAngle() { return ((S.pos + S.blend) / REV) * TAU; }

function draw() {
  if (!G.base) return;
  drawGramo();
}

function approach(v, target, dt) {
  if (S.accel > 0) { const st = S.accel * dt, d = target - v; return v + (d > st ? st : d < -st ? -st : d); }
  return v + (target - v) * (1 - Math.exp(-dt / S.tau));
}

let last = performance.now(), lastKey = '';
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
  if (S.arm === null) {
    // Plattenspieler wurde noch nie aufgeklappt (kein Tonarm gezeichnet): Nadel direkt setzen
    if (S.armDown !== S.needle) { S.needle = S.armDown; send({ type: 'needle', on: S.needle }); }
    if (!S.playing && !S.scratching && S.armDown) {
      S.still = Math.abs(S.vel) < 0.01 ? S.still + dt : 0;
      if (S.still > 0.7) { S.armDown = false; S.still = 0; }
    }
  } else {
    const target = S.armDown ? G.play + Math.sin(recAngle()) * 0.003 : G.rest;
    S.arm += (target - S.arm) * (1 - Math.exp(-dt / (reduceMotion() ? 0.04 : 0.16)));
    if (S.armDown && !S.needle && Math.abs(G.play - S.arm) < 0.03) { S.needle = true; send({ type: 'needle', on: true }); }
    if (!S.armDown && S.needle) { S.needle = false; send({ type: 'needle', on: false }); }
    if (!S.playing && !S.scratching && S.armDown) {
      S.still = Math.abs(S.vel) < 0.01 ? S.still + dt : 0;
      if (S.still > 0.7) { S.armDown = false; S.still = 0; }
    }
  }
  // nur neu zeichnen, wenn sich wirklich etwas bewegt (Platte, Tonarm, Nadel) – sonst kostet das Grammophon nichts
  if (S.visible && S.shown) {
    const key = `${recAngle().toFixed(4)}|${(S.arm ?? 0).toFixed(4)}|${S.needle}|${S.platAng.toFixed(3)}`;
    if (key !== lastKey || S.playing) { lastKey = key; draw(); }
  }
  requestAnimationFrame(frame);
}

/* ---------- Start ---------- */
// Musik vorbereiten, sobald die Platte in die Nähe kommt (spielt noch nichts ab)
// Das Vorbereiten blockiert die Seite kurz (~0,2 s). Darum nie mitten im Scrollen:
// erst wenn ~0,8 s nicht gescrollt wurde und der Browser gerade nichts zu tun hat.
let lastScroll = 0, prerenderWait = false;
addEventListener('scroll', () => { lastScroll = performance.now(); }, { passive: true });
addEventListener('wheel', () => { lastScroll = performance.now(); }, { passive: true });
addEventListener('touchmove', () => { lastScroll = performance.now(); }, { passive: true });
function prerenderNow() {
  if (window.OfflineAudioContext && !A.loop) { A.loop = renderLoop(44100, TR()); A.loop.catch((err) => { console.error(err); A.loop = null; }); }
}
function prerender() {
  if (A.loop || prerenderWait || !window.OfflineAudioContext) return;
  prerenderWait = true;
  const idle = window.requestIdleCallback || ((f) => setTimeout(f, 50));
  const tryIt = () => {
    if (A.loop) { prerenderWait = false; return; }
    if (performance.now() - lastScroll < 800) { setTimeout(tryIt, 300); return; }
    idle(() => {
      if (performance.now() - lastScroll < 800) { setTimeout(tryIt, 300); return; }
      prerenderWait = false; prerenderNow();
    }, { timeout: 1500 });
  };
  tryIt();
}
export function initDeck(root, opt = {}) {
  onChange = opt.onChange || null;
  deck = root.querySelector('.deck');
  cvs = root.querySelector('.deck__canvas'); g2d = cvs.getContext('2d');
  recBtn = root.querySelector('.deck__record'); startBtn = root.querySelector('.deck__start');

  let drag = null, suppressClick = false;
  const pointerAngle = (e) => {
    const r = recBtn.getBoundingClientRect();
    let x = e.clientX - (r.left + r.width / 2), y = e.clientY - (r.top + r.height / 2);
    if (G.inv) {   // Grammophon: Bildschirmpunkt zurück in die schräge Plattenebene rechnen
      const dx = x * G.dpr, dy = y * G.dpr, k = (r.width / 2) / PLAT.Rr;
      x = (G.inv[0] * dx + G.inv[1] * dy) * k; y = (G.inv[2] * dx + G.inv[3] * dy) * k;
    }
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
    // Touch: nur seitliches Ziehen scratcht. Ein senkrechter Wisch ist Scrollen der Seite (CSS: touch-action: pan-y),
    // vorher drehte sich die Platte dabei wild, wenn man auf Handy/iPad über das Grammophon hinwegscrollte.
    const mx = Math.abs(e.clientX - drag.x0), my = Math.abs(e.clientY - drag.y0);
    if (!drag.active && Math.hypot(mx, my) > 5) {
      if (e.pointerType === 'touch' && my > mx) { clearTimeout(drag.hold); drag = null; return; }
      drag.active = true; clearTimeout(drag.hold); beginScratch(); return;
    }
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
  startBtn?.addEventListener('click', togglePlay);

  new ResizeObserver(() => layout()).observe(deck);
  new IntersectionObserver(([en]) => { S.visible = en.isIntersecting; }, { rootMargin: '400px 0px' }).observe(deck);
  document.fonts?.ready.then(() => { if (G.recSize) { G.rec = bakeRecord(G.recSize); draw(); } });
  // Musik erst vorbereiten, wenn man das Grammophon anfasst oder mit dem Zeiger darüberfährt
  // (das Vorbereiten blockiert kurz, nie mitten im Lesen)
  for (const t of ['pointerenter', 'touchstart', 'focusin']) root.addEventListener(t, () => prerender(), { passive: true });
  requestAnimationFrame(frame);
  // setShown: von außen ein-/ausblenden – unsichtbar wird nicht gezeichnet
  // Platte wechseln (Klick auf eine Hülle an der Wand): neues Label auf dem Teller, neuer Loop.
  // Läuft gerade Musik, spielt sofort die neue Platte; sonst liegt sie einfach bereit, bis man zurückkommt.
  const cache = new Map();
  const setTrack = (i) => {
    if (!TRACKS[i] || i === TRACK) return;
    if (A.loop && !cache.has(TRACK)) cache.set(TRACK, A.loop);   // alte Platte merken (schneller zurück)
    TRACK = i;
    if (G.recSize) { G.rec = bakeRecord(G.recSize); draw(); }
    opt.onTrack?.(i);
    A.loop = cache.get(i) || null;
    if (!A.ctx) { prerender(); return; }                          // noch kein Ton: Loop wird beim ersten Abspielen erzeugt
    const loop = A.loop || renderLoop(44100, TRACKS[i]);
    cache.set(i, loop); A.loop = loop;
    loop.then((buf) => {
      A.start?.then(() => { if (TRACK === i && A.ready) { const [m, tr] = bufferMsg(buf, true); send(m, tr); } });
    }).catch((err) => console.error(err));
  };
  return { toggle: togglePlay, playing: () => S.playing, setShown: (v) => { if (v && !S.shown) prerender(); S.shown = v; }, setTrack, track: () => TRACK };
}

// nur beim Entwickeln: Loops direkt erzeugen (Test-Hörproben in salon/_shots/audio)
if (import.meta.env?.DEV) { window.__salonRender = (i) => renderLoop(44100, TRACKS[i]); window.__deck = { S, A, recAngle: () => recAngle() }; }
