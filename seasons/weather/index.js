// Ein Jahr beim Scrollen. Jede Jahreszeit ist ein eigenes Modul (spring, summer, autumn, winter);
// hier wird nur entschieden, wie stark sie gerade ist: abhängig davon, welcher Abschnitt im Bild ist.
//   Hero + Über mich → Frühling · Projekte → Sommer · Zertifikate → Herbst (Lebenslauf bleibt frei) · Kontakt → Winter
// Die Himmelsfarben selbst wechselt main.js (gehören zum Bild, nicht zu den Effekten).
// Die Effekte laufen immer; nur mit prefers-reduced-motion gibt es keine Teilchen.
import { gsap } from 'gsap';
import { createSpring } from './spring.js';
import { createSummer } from './summer.js';
import { createAutumn } from './autumn.js';
import { createWinter } from './winter.js';

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

export function initWeather({ reduce, veil = () => 0 }) {
  const state = { on: !reduce, spring: 0, summer: 0, autumn: 0, winter: 0, gust: 0, breeze: 0, veil: 0, clear: 1, small: innerWidth < 700, time: 0 };
  const api = { state };
  if (location.search.includes('debug')) window.__fx = state;   // nur für die Test-Seite in _shots
  if (reduce) return api;

  // zwei Leinwände: hinten (hinter dem Glas) und vorne (über dem Inhalt, klickt nichts weg)
  const ctx = { dpr: Math.min(window.devicePixelRatio || 1, 1.5), W: 0, H: 0 };
  ctx.bg = document.createElement('canvas'); ctx.bg.className = 'wx-bg'; ctx.bg.setAttribute('aria-hidden', 'true');
  document.querySelector('.sky').append(ctx.bg);
  ctx.fg = document.createElement('canvas'); ctx.fg.className = 'wx-fg'; ctx.fg.setAttribute('aria-hidden', 'true');
  document.body.append(ctx.fg);
  ctx.bgx = ctx.bg.getContext('2d'); ctx.fgx = ctx.fg.getContext('2d');

  const modules = [createSpring(ctx, state), createSummer(ctx, state), createAutumn(ctx, state), createWinter(ctx, state)];

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
  const S = { hero: sec('top'), ueber: sec('ueber'), proj: sec('projekte'), zert: sec('zertifikate'), cv: sec('lebenslauf'), k: sec('kontakt') };
  const cover = (el) => {
    const r = el.getBoundingClientRect();
    return clamp((Math.min(r.bottom, ctx.H) - Math.max(r.top, 0)) / (ctx.H * 0.55), 0, 1);
  };
  const covers = () => {
    const c = {};
    for (const k in S) c[k] = cover(S[k]);
    return c;
  };

  // Böen im Herbst: meist ruhig, ab und zu ein Stoß von etwa zwei Sekunden
  const gustAt = (t) => Math.min(1, Math.pow(Math.max(0, Math.sin(t * 0.42)), 8) + 0.7 * Math.pow(Math.max(0, Math.sin(t * 0.23 + 2)), 10));

  // läuft im selben Takt wie die übrigen Animationen (GSAP-Ticker, pausiert bei verstecktem Tab)
  let running = false, dirty = true;
  function clear() {
    ctx.bgx.setTransform(1, 0, 0, 1, 0, 0); ctx.bgx.clearRect(0, 0, ctx.bg.width, ctx.bg.height);
    ctx.fgx.setTransform(1, 0, 0, 1, 0, 0); ctx.fgx.clearRect(0, 0, ctx.fg.width, ctx.fg.height);
  }
  function loop(t, deltaMs) {
    const raw = Math.max(0, (deltaMs || 16) / 1000);
    const dt = Math.min(0.05, raw);               // für Teilchen: große Sprünge vermeiden
    state.time += dt;
    const k = 1 - Math.exp(-raw / 0.6);           // weiche Übergänge, nach Pausen sofort richtig
    const on = state.on ? 1 : 0;
    const c = covers();
    // ein Abschnitt muss ein gutes Stück im Bild sein, bevor seine Teilchen kommen (kein Herbstlaub im Sommer)
    const near = (v) => { const t = clamp((v - 0.2) / 0.6, 0, 1); return t * t * (3 - 2 * t); };
    // Blüten erst ab „Über mich“ – der erste Bildschirm bleibt ruhig
    state.spring += (on * near(c.ueber) - state.spring) * k;
    state.summer += (on * near(c.proj) - state.summer) * k;
    // Spätherbst: wenn der Kontakt (Winter) ins Bild kommt, fallen noch ein paar letzte Blätter,
    // während schon die ersten Flocken kommen – beide überlappen sich kurz.
    const lastLeaves = 0.45 * Math.sin(Math.PI * clamp(c.k * 1.2, 0, 1));
    state.autumn += (on * Math.max(near(c.zert), lastLeaves) - state.autumn) * k;
    const early = (v) => { const t = clamp((v - 0.05) / 0.55, 0, 1); return t * t * (3 - 2 * t); };
    state.winter += (on * early(c.k) - state.winter) * k;
    // in der weißen Wolkenwand (Durchflug unter dem Hero, Dichte kommt von main.js) sofort ausblenden
    state.veil = veil();
    const v = clamp((state.veil - 0.08) / 0.4, 0, 1);
    state.clear = 1 - v * v * (3 - 2 * v);
    state.gust = gustAt(state.time) * state.autumn;
    // für main.js: wie stark Leinen und Wolken gerade im Wind gehen
    state.breeze = Math.max(state.spring * 0.3, state.gust * 1.1) * state.clear;

    const any = state.spring + state.summer + state.autumn + state.winter;
    if (any > 0.004) {
      clear(); dirty = true;
      ctx.bgx.setTransform(ctx.dpr, 0, 0, ctx.dpr, 0, 0);
      ctx.fgx.setTransform(ctx.dpr, 0, 0, ctx.dpr, 0, 0);
      for (const m of modules) m.update(dt);
    } else if (dirty) { clear(); dirty = false; }   // nichts zu zeichnen: einmal leeren, dann nur noch messen

    // alles still und ausgeschaltet → Schleife anhalten
    if (!state.on && any < 0.004) { stop(); clear(); state.breeze = state.gust = 0; }
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
