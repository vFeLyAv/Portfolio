// Kleine Wow-Momente im Salon (Felix 13.11.2026). Jeder Teil steht für sich und ist bei „Bewegung reduzieren“ aus.
//  1) Eintrittskarte: Sprache wählen = der Abriss-Abschnitt „EINTRITT“ reißt ab und fällt, die Karte trägt danach
//     einen gezackten Rand (Datumsstempel entfernt, Felix 13.11.2026).
//  2) Siegel: auf erhaltenen Zertifikaten drückt beim Hinscrollen ein Messingstempel ein rotes Lacksiegel „FK“ auf die Karte.
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

/* ------------------------------------------------------------ 1) Eintrittskarte reißt ab */
let tornLang = null;
// Capture-Phase: läuft VOR main.js, das beim Klick die ganze Seite in der neuen Sprache neu zeichnet (die alte Karte
// ist danach weg). Darum fliegt eine Kopie des Abschnitts, die echte neue Karte bekommt danach den Zackenrand.
addEventListener('click', (e) => {
  const t = e.target.closest?.('.ticket');
  if (!t || t.getAttribute('aria-pressed') === 'true' || reduced) return;
  const r = t.getBoundingClientRect(), stubH = t.offsetHeight * 0.28;
  const rot = parseFloat(getComputedStyle(t).rotate) || 0;
  const stub = document.createElement('div');
  stub.className = 'ticket-stub'; stub.setAttribute('aria-hidden', 'true');
  stub.innerHTML = `<span>${t.querySelector('.t-code')?.textContent || ''}</span>`;
  Object.assign(stub.style, { left: `${r.left + r.width / 2 - t.offsetWidth / 2}px`, top: `${r.top + (r.height - t.offsetHeight) / 2}px`, width: `${t.offsetWidth}px`, height: `${stubH}px`, rotate: `${rot}deg` });
  document.body.append(stub);
  const dir = Math.random() < 0.5 ? -1 : 1;
  stub.animate([
    { translate: '0 0', rotate: `${rot}deg`, opacity: 1 },
    { translate: `${dir * 14}px -18px`, rotate: `${rot + dir * 12}deg`, opacity: 1, offset: 0.18 },
    { translate: `${dir * 60}px ${innerHeight * 0.5}px`, rotate: `${rot + dir * 160}deg`, opacity: 0 },
  ], { duration: 1300, easing: 'cubic-bezier(.3,.1,.6,1)' }).finished.then(() => stub.remove(), () => stub.remove());
  tornLang = t.dataset.lang;
  requestAnimationFrame(markTorn);   // main.js hat bis dahin neu gezeichnet
}, true);

export function markTorn() {
  if (!tornLang) return;
  for (const t of $$(`.ticket[data-lang="${tornLang}"]`)) t.classList.add('torn');
}

/* ------------------------------------------------------------ 3) Wandleuchten */
// In jedem Saal (nicht im Foyer) hängen links und rechts neben der Überschrift zwei Messing-Wandleuchten.
// Sie sind aus, bis man den Saal betritt – dann flackern sie an (alte Leitung) und werfen einen warmen Schein an die Wand.
const SCONCE = `<svg viewBox="0 0 80 140" aria-hidden="true">
  <defs>
    <linearGradient id="messing" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff1b8"/><stop offset=".45" stop-color="#c99a3e"/><stop offset="1" stop-color="#6a4a14"/></linearGradient>
    <radialGradient id="birne" cx=".45" cy=".4" r=".6"><stop offset="0" stop-color="#fffbe8"/><stop offset=".55" stop-color="#ffd27a"/><stop offset="1" stop-color="#e08a2a"/></radialGradient>
  </defs>
  <ellipse cx="40" cy="104" rx="13" ry="24" fill="url(#messing)" stroke="#5a3d10" stroke-width="1.2"/>
  <ellipse cx="40" cy="104" rx="6" ry="14" fill="none" stroke="#fff3c4" stroke-width="1" opacity=".5"/>
  <path d="M40 96 C40 78 26 78 26 66 C26 60 32 58 40 58" fill="none" stroke="url(#messing)" stroke-width="4" stroke-linecap="round"/>
  <path d="M28 58 L52 58 L48 66 L32 66 Z" fill="url(#messing)" stroke="#5a3d10" stroke-width="1"/>
  <rect x="35" y="40" width="10" height="18" rx="2" fill="#f6ecd3" stroke="#c9b890" stroke-width=".8"/>
  <path class="birne" d="M40 14 C47 22 49 30 45 37 C43 40 37 40 35 37 C31 30 33 22 40 14 Z" fill="url(#birne)"/>
</svg>`;
let sconceIO = null;
export function hangSconces() {
  if (sconceIO || !('IntersectionObserver' in window)) return;
  const rooms = $$('.room:not(.foyer)');
  sconceIO = new IntersectionObserver((es) => es.forEach((e) => {
    const sc = $$(':scope > .sconce', e.target);
    // an, sobald der Saal das mittlere Drittel des Bildschirms erreicht (ein Anteil-Schwellenwert ginge bei sehr hohen
    // Sälen nie auf). Zurück nach oben (Saal wieder unter dem Bildschirm): aus, damit er beim nächsten Mal wieder anspringt.
    if (e.isIntersecting) sc.forEach((s, i) => setTimeout(() => s.classList.add('on'), reduced ? 0 : i * 260));
    else if (e.boundingClientRect.top > 0) sc.forEach((s) => s.classList.remove('on'));
  }), { rootMargin: '-35% 0px -35% 0px' });
  for (const r of rooms) {
    r.insertAdjacentHTML('beforeend', `<span class="sconce sconce-l" aria-hidden="true"><i class="glow"></i>${SCONCE}</span><span class="sconce sconce-r" aria-hidden="true"><i class="glow"></i>${SCONCE}</span>`);
    sconceIO.observe(r);
  }
}

/* ------------------------------------------------------------ 2) Wachssiegel */
// Neu 13.11.2026 (Felix: alte Version wirkte seltsam – kleiner roter Klecks, Schreibschrift unlesbar, Fall mit Drehung
// wie ein Cartoon). Jetzt: Siegellack auf der Papierkarte – unregelmäßiger Rand mit zwei Tropfen, eingedrückte
// Scheibe mit Perlenkranz, „FK“ als geprägte Antiqua. Ein Messingstempel mit Holzgriff senkt sich, drückt (Karte gibt
// nach), der Lack quillt heraus, der Stempel hebt ab – erst dann sieht man den Abdruck.
const SEAL = `<svg class="wax" viewBox="0 0 120 120" aria-hidden="true">
  <defs>
    <radialGradient id="lack" cx=".4" cy=".35" r=".7"><stop offset="0" stop-color="#c3323a"/><stop offset=".6" stop-color="#8e1520"/><stop offset="1" stop-color="#5a0911"/></radialGradient>
    <linearGradient id="mulde" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#5e0b13"/><stop offset=".55" stop-color="#851521"/><stop offset="1" stop-color="#b02a33"/></linearGradient>
  </defs>
  <path d="M60 9 C70 8 76 13 84 15 C94 18 99 27 104 35 C109 44 106 52 109 60 C112 70 104 77 101 85 C99 91 103 99 99 104 C95 109 90 104 86 101 C80 104 73 110 63 110 C54 111 47 106 39 106 C29 105 22 98 16 90 C10 82 11 73 9 64 C7 55 11 47 14 39 C17 30 22 23 30 18 C40 12 49 10 60 9 Z" fill="url(#lack)"/>
  <path d="M30 18 C40 12 49 10 60 9 C70 8 76 13 84 15 C94 18 99 27 104 35" fill="none" stroke="#e0606a" stroke-width="1.2" opacity=".4" stroke-linecap="round"/>
  <g class="abdruck">
    <circle cx="60" cy="60" r="37" fill="url(#mulde)"/>
    <circle cx="60" cy="60" r="34.5" fill="none" stroke="#d9505a" stroke-width="1.6" opacity=".6" stroke-dasharray="0 3.6" stroke-linecap="round"/>
    <circle cx="60" cy="60" r="30" fill="none" stroke="#4d0810" stroke-width="1" opacity=".6"/>
    <g font-family="'EB Garamond', Georgia, serif" font-weight="600" font-size="31" text-anchor="middle" letter-spacing="1">
      <text x="61.2" y="71.2" fill="#3a050b">FK</text>
      <text x="59.1" y="69.1" fill="#ff9aa0" opacity=".75">FK</text>
      <text x="60" y="70" fill="#a8202c">FK</text>
    </g>
  </g>
  <ellipse cx="40" cy="30" rx="13" ry="5" fill="#fff" opacity=".2" transform="rotate(-28 40 30)"/>
</svg>`;
// Messingstempel mit gedrechseltem Holzgriff; seine Unterkante sitzt auf der Mitte des Siegels
const STAMP = `<svg class="stamp" viewBox="0 0 80 150" aria-hidden="true">
  <defs>
    <linearGradient id="holz" x1="0" x2="1"><stop offset="0" stop-color="#2a140a"/><stop offset=".4" stop-color="#6b3a1e"/><stop offset=".6" stop-color="#7d4626"/><stop offset="1" stop-color="#2a140a"/></linearGradient>
    <linearGradient id="messing2" x1="0" x2="1"><stop offset="0" stop-color="#6a4a14"/><stop offset=".45" stop-color="#f3d98c"/><stop offset=".7" stop-color="#c99a3e"/><stop offset="1" stop-color="#5a3d10"/></linearGradient>
  </defs>
  <ellipse cx="40" cy="20" rx="17" ry="18" fill="url(#holz)"/>
  <path d="M30 34 C33 44 34 56 33 70 L47 70 C46 56 47 44 50 34 Z" fill="url(#holz)"/>
  <rect x="27" y="70" width="26" height="9" rx="2" fill="url(#messing2)"/>
  <path d="M33 79 L47 79 L49 120 L31 120 Z" fill="url(#messing2)"/>
  <rect x="16" y="120" width="48" height="22" rx="3" fill="url(#messing2)"/>
  <rect x="16" y="140" width="48" height="6" rx="1.5" fill="#4a3410"/>
  <ellipse cx="34" cy="14" rx="5" ry="8" fill="#fff" opacity=".14"/>
</svg>`;
const sealed = new Set();   // schon gestempelt (nach Sprachwechsel nicht nochmal schlagen)
let sealIO = null;
export function sealCerts() {
  const cards = $$('.certs-earned .cert');
  sealIO?.disconnect();
  if (!reduced && 'IntersectionObserver' in window) {
    sealIO = new IntersectionObserver((es) => es.forEach((e) => {
      if (!e.isIntersecting) return;
      sealIO.unobserve(e.target); sealed.add(cards.indexOf(e.target));
      e.target.classList.add('stamped');
    }), { rootMargin: '0px 0px -22% 0px', threshold: 0.4 });
  }
  cards.forEach((c, i) => {
    if (!$('.seal', c)) ($('.card', c) || c).insertAdjacentHTML('beforeend', `<span class="seal" aria-hidden="true">${SEAL}${reduced ? '' : STAMP}</span>`);
    if (reduced || sealed.has(i) || !sealIO) c.classList.add('stamped', 'stamped-now'); else sealIO.observe(c);
  });
}
