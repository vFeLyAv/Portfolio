// Wetter im Lauf des Tages. Jede Wetterart ist ein eigenes Modul (rain, wind, drips, snow),
// hier wird nur entschieden, wie stark sie gerade ist: abhängig davon, welcher Abschnitt im Bild ist.
//   Über mich → Wind · Projekte → Regen · Zertifikate → Tropfen nach dem Regen · Lebenslauf → ruhig · Kontakt → Schnee
// Ohne Animationen (prefers-reduced-motion) gibt es kein Wetter. Schalter oben: „Wetter“, gemerkt im localStorage.
import { gsap } from 'gsap';
import { createRain } from './rain.js';
import { createWind } from './wind.js';
import { createDrips } from './drips.js';
import { createSnow } from './snow.js';

const KEY = 'sky-weather';
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

export function initWeather({ reduce }) {
  const state = { on: !reduce, wind: 0, rain: 0, drips: 0, snow: 0, small: innerWidth < 700, time: 0 };
  const api = { state };
  if (reduce) return api;
  try { if (localStorage.getItem(KEY) === 'off') state.on = false; } catch { /* privater Modus: einfach an lassen */ }

  // zwei Leinwände: hinten (hinter dem Glas) und vorne (über dem Inhalt, klickt nichts weg)
  const ctx = { dpr: Math.min(window.devicePixelRatio || 1, 1.5), W: 0, H: 0 };
  ctx.bg = document.createElement('canvas'); ctx.bg.className = 'wx-bg'; ctx.bg.setAttribute('aria-hidden', 'true');
  document.querySelector('.sky').append(ctx.bg);
  ctx.fg = document.createElement('canvas'); ctx.fg.className = 'wx-fg'; ctx.fg.setAttribute('aria-hidden', 'true');
  document.body.append(ctx.fg);
  ctx.bgx = ctx.bg.getContext('2d'); ctx.fgx = ctx.fg.getContext('2d');
  const overcast = document.getElementById('skyRain');

  const modules = [createRain(ctx, state), createWind(ctx, state), createDrips(ctx, state), createSnow(ctx, state)];

  function size() {
    ctx.W = innerWidth; ctx.H = innerHeight;
    for (const c of [ctx.bg, ctx.fg]) { c.width = Math.round(ctx.W * ctx.dpr); c.height = Math.round(ctx.H * ctx.dpr); }
    state.small = ctx.W < 700;
    modules.forEach((m) => m.resize && m.resize());
  }
  size();
  addEventListener('resize', size);

  // Anteil des Bildschirms, den ein Abschnitt gerade einnimmt (0…1)
  const sec = (id) => document.getElementById(id);
  const S = { ueber: sec('ueber'), proj: sec('projekte'), zert: sec('zertifikate'), k: sec('kontakt') };
  const cover = (el) => {
    const r = el.getBoundingClientRect();
    return clamp((Math.min(r.bottom, ctx.H) - Math.max(r.top, 0)) / (ctx.H * 0.55), 0, 1);
  };

  // Schalter in der oberen Leiste
  const btn = document.createElement('button');
  btn.type = 'button'; btn.className = 'wx-toggle glass';
  btn.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 15.5a4 4 0 0 1 .4-8 5 5 0 0 1 9.4 1.6A3.2 3.2 0 0 1 17 15.5Z"/><path class="wx-toggle__drops" d="M9 18.5l-.8 2M13 18.5l-.8 2M17 18.5l-.8 2"/></svg><span class="wx-toggle__lbl">Wetter</span>`;
  const sync = () => btn.setAttribute('aria-pressed', String(state.on));
  sync();
  btn.addEventListener('click', () => {
    state.on = !state.on; sync();
    try { localStorage.setItem(KEY, state.on ? 'on' : 'off'); } catch { /* egal */ }
    if (state.on) start();
  });
  const pdf = document.querySelector('.bar .pdf');
  pdf.parentNode.insertBefore(btn, pdf);

  // läuft im selben Takt wie die übrigen Animationen (GSAP-Ticker, pausiert bei verstecktem Tab)
  let running = false;
  function loop(t, deltaMs) {
    const raw = Math.max(0, (deltaMs || 16) / 1000);
    const dt = Math.min(0.05, raw);               // für Teilchen: große Sprünge vermeiden
    state.time += dt;
    const k = 1 - Math.exp(-raw / 0.6);           // weiche Übergänge, nach Pausen sofort richtig
    const on = state.on ? 1 : 0;
    state.wind += (on * cover(S.ueber) - state.wind) * k;
    state.rain += (on * cover(S.proj) - state.rain) * k;
    state.drips += (on * cover(S.zert) - state.drips) * k;
    state.snow += (on * cover(S.k) - state.snow) * k;
    if (overcast) overcast.style.opacity = (state.rain * 0.55).toFixed(3);

    ctx.bgx.setTransform(1, 0, 0, 1, 0, 0); ctx.bgx.clearRect(0, 0, ctx.bg.width, ctx.bg.height);
    ctx.fgx.setTransform(1, 0, 0, 1, 0, 0); ctx.fgx.clearRect(0, 0, ctx.fg.width, ctx.fg.height);
    ctx.bgx.setTransform(ctx.dpr, 0, 0, ctx.dpr, 0, 0);
    ctx.fgx.setTransform(ctx.dpr, 0, 0, ctx.dpr, 0, 0);
    for (const m of modules) m.update(dt);

    // alles still und ausgeschaltet → Schleife anhalten
    const any = state.wind + state.rain + state.drips + state.snow;
    if (!state.on && any < 0.002) { stop(); modules.forEach((m) => m.update(0)); }
  }
  function start() {
    if (running || document.hidden) return;
    running = true; gsap.ticker.add(loop);
  }
  function stop() { running = false; gsap.ticker.remove(loop); }
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
  start();
  return api;
}
