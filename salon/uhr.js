// Pendeluhr im Saal IV „Lebenslauf“ (Felix 13.11.2026): goldenes Gehäuse wie die Bilderrahmen, Zifferblatt mit
// römischen Zahlen, zeigt immer die Zeit in Regensburg (Europe/Berlin) – auch wenn jemand aus Japan zuschaut.
// Rein dekorativ (aria-hidden). Läuft nur, solange sie zu sehen ist. „Bewegung reduzieren“: Pendel steht, kein Sekundenzeiger.
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const NS = 'http://www.w3.org/2000/svg';
const ROMAN = ['XII', 'I', 'II', 'III', 'IIII', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'];   // IIII wie auf alten Uhren

function svg() {
  const ticks = Array.from({ length: 60 }, (_, i) => {
    const big = i % 5 === 0, a = (i / 60) * Math.PI * 2, r1 = big ? 72 : 76, r2 = 80;
    const p = (r) => `${(100 + Math.sin(a) * r).toFixed(2)} ${(100 - Math.cos(a) * r).toFixed(2)}`;
    return `<path d="M${p(r1)} L${p(r2)}" stroke="#3a1610" stroke-width="${big ? 2.2 : 0.9}" stroke-linecap="round"/>`;
  }).join('');
  const nums = ROMAN.map((n, i) => {
    const a = (i / 12) * Math.PI * 2;
    return `<text x="${(100 + Math.sin(a) * 61).toFixed(2)}" y="${(100 - Math.cos(a) * 61).toFixed(2)}" transform="rotate(${i * 30} ${(100 + Math.sin(a) * 61).toFixed(2)} ${(100 - Math.cos(a) * 61).toFixed(2)})">${n}</text>`;
  }).join('');
  return `
<svg viewBox="0 0 200 300" xmlns="${NS}">
  <defs>
    <linearGradient id="uhr-gold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff1b8"/><stop offset=".45" stop-color="#c99a3e"/><stop offset=".7" stop-color="#e9cf86"/><stop offset="1" stop-color="#7c5a1c"/></linearGradient>
    <radialGradient id="uhr-blatt" cx=".45" cy=".4" r=".7"><stop offset="0" stop-color="#fbf4e2"/><stop offset=".8" stop-color="#ecdcb8"/><stop offset="1" stop-color="#d9c294"/></radialGradient>
    <radialGradient id="uhr-glas" cx=".35" cy=".25" r=".6"><stop offset="0" stop-color="#fff" stop-opacity=".35"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
  </defs>
  <!-- Pendel (hinter dem Gehäuse, schwingt um die Aufhängung) -->
  <g class="uhr-pendel"><path d="M100 150 L100 262" stroke="#c99a3e" stroke-width="3"/><circle cx="100" cy="270" r="17" fill="url(#uhr-gold)" stroke="#6a4a14" stroke-width="1.2"/><circle cx="95" cy="265" r="5" fill="#fff6d0" opacity=".55"/></g>
  <!-- Gehäuse: Zierkranz mit Perlen wie an den Rahmen -->
  <circle cx="100" cy="100" r="97" fill="url(#uhr-gold)" stroke="#5a3d10" stroke-width="1.5"/>
  ${Array.from({ length: 36 }, (_, i) => { const a = (i / 36) * Math.PI * 2; return `<circle cx="${(100 + Math.sin(a) * 91).toFixed(2)}" cy="${(100 - Math.cos(a) * 91).toFixed(2)}" r="2.6" fill="#fff0b0" stroke="#8a6420" stroke-width=".6"/>`; }).join('')}
  <circle cx="100" cy="100" r="85" fill="#3a1610"/>
  <circle cx="100" cy="100" r="83" fill="url(#uhr-blatt)"/>
  <circle cx="100" cy="100" r="54" fill="none" stroke="#3a1610" stroke-width=".6" opacity=".5"/>
  ${ticks}
  <g class="uhr-zahlen" font-family="'EB Garamond', Georgia, serif" font-size="15" fill="#3a1610" text-anchor="middle" dominant-baseline="central">${nums}</g>
  <text x="100" y="128" font-family="Oswald, 'Arial Narrow', sans-serif" font-size="7.5" letter-spacing="2.4" fill="#6a2a1e" text-anchor="middle">REGENSBURG</text>
  <!-- Zeiger: Stunde und Minute mit Zierspitze, Sekunde dünn in Bordeaux -->
  <g class="uhr-h"><path d="M100 112 L97 100 Q96 80 100 56 Q104 80 103 100 Z" fill="#1d0a06"/><circle cx="100" cy="66" r="4.5" fill="none" stroke="#1d0a06" stroke-width="2"/></g>
  <g class="uhr-m"><path d="M100 114 L98 100 Q97.5 70 100 28 Q102.5 70 102 100 Z" fill="#1d0a06"/><circle cx="100" cy="42" r="3.6" fill="none" stroke="#1d0a06" stroke-width="1.6"/></g>
  <g class="uhr-s"><path d="M100 120 L100 26" stroke="#8a1a24" stroke-width="1.1" stroke-linecap="round"/><circle cx="100" cy="114" r="3.4" fill="#8a1a24"/></g>
  <circle cx="100" cy="100" r="5" fill="url(#uhr-gold)" stroke="#5a3d10" stroke-width=".8"/>
  <circle cx="100" cy="100" r="83" fill="url(#uhr-glas)"/>
</svg>`;
}

const fmt = new Intl.DateTimeFormat('de-DE', { timeZone: 'Europe/Berlin', hour: 'numeric', minute: 'numeric', second: 'numeric', hourCycle: 'h23' });
export function initUhr() {
  const head = document.querySelector('#lebenslauf .room-head');
  if (!head) return;
  const el = document.createElement('div');
  el.className = 'wallclock'; el.setAttribute('aria-hidden', 'true'); el.innerHTML = svg();
  head.append(el);
  const [h, m, s] = ['.uhr-h', '.uhr-m', '.uhr-s'].map((q) => el.querySelector(q));
  if (reduced) s.remove();
  let timer = 0;
  const set = () => {
    const p = Object.fromEntries(fmt.formatToParts(new Date()).map((x) => [x.type, +x.value]));
    const sec = p.second, min = p.minute + sec / 60, hr = (p.hour % 12) + min / 60;
    h.setAttribute('transform', `rotate(${(hr * 30).toFixed(2)} 100 100)`);
    m.setAttribute('transform', `rotate(${(min * 6).toFixed(2)} 100 100)`);
    if (!reduced) s.setAttribute('transform', `rotate(${sec * 6} 100 100)`);
  };
  const run = () => { set(); timer = setTimeout(run, reduced ? 60000 - (Date.now() % 60000) : 1000 - (Date.now() % 1000)); };
  new IntersectionObserver(([e]) => {
    clearTimeout(timer);
    el.classList.toggle('swing', e.isIntersecting);   // Pendel nur schwingen lassen, solange man sie sieht
    if (e.isIntersecting) run();
  }, { rootMargin: '200px 0px' }).observe(el);
  set();
}
