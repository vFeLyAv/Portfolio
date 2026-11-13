// Kleine SVG-Ornamente im Stil des Plakats: vierzackige Sterne, Rauten-Kette, Kachel mit Stern, Wachssiegel.
// Linien (.o-l) zeichnen sich beim Scrollen selbst, Sterne (.o-s) wachsen nacheinander auf (siehe style.css).

// Vierzackiger "Funkel"-Stern mit eingezogenen Seiten
export function sparkle(cx, cy, r, d = 0, cls = 'o-s') {
  const k = r * 0.16;
  return `<path class="${cls}" style="--d:${d}" d="M${cx} ${cy - r}C${cx + k} ${cy - k} ${cx + k} ${cy - k} ${cx + r} ${cy}C${cx + k} ${cy + k} ${cx + k} ${cy + k} ${cx} ${cy + r}C${cx - k} ${cy + k} ${cx - k} ${cy + k} ${cx - r} ${cy}C${cx - k} ${cy - k} ${cx - k} ${cy - k} ${cx} ${cy - r}Z"/>`;
}
const line = (x1, x2, y) => `<path class="o-l" pathLength="1" d="M${x1} ${y}H${x2}"/>`;

// Kette oben: Stern – Linie – Rauten-Gruppe – Linie – Stern  (viewBox 300×24)
export function chain() {
  return [
    sparkle(6, 12, 5, 0.05), sparkle(18, 12, 3.5, 0.1),
    line(120, 24, 12), line(180, 276, 12),
    sparkle(128, 12, 4, 0.35), sparkle(139, 12, 6.5, 0.45), sparkle(150, 12, 9, 0.5), sparkle(161, 12, 6.5, 0.45), sparkle(172, 12, 4, 0.35),
    sparkle(282, 12, 3.5, 0.1), sparkle(294, 12, 5, 0.05),
  ].join('');
}

// Reihe unten: Sterngruppe – Kreuz-Ornament – Sterngruppe  (viewBox 360×30)
export function rowOrnament() {
  const group = (x0, dir) => {
    const xs = [0, 15, 33, 51, 66];
    const rs = [3.5, 5.5, 10, 5.5, 3.5];
    return line(x0, x0 + dir * 70, 15) + xs.map((x, i) => sparkle(x0 + dir * (x + 3), 15, rs[i], 0.15 + i * 0.08)).join('');
  };
  // Kreuz aus vier kleinen Pfeilspitzen um eine Raute
  const c = 180, y = 15;
  const tip = (dx, dy, rot) => `<path class="o-s" style="--d:.55" transform="rotate(${rot} ${c + dx} ${y + dy})" d="M${c + dx} ${y + dy - 4}L${c + dx + 3.4} ${y + dy + 2}L${c + dx} ${y + dy + 0.6}L${c + dx - 3.4} ${y + dy + 2}Z"/>`;
  return group(70, 1) + group(290, -1)
    + `<path class="o-l" pathLength="1" d="M${c} ${y - 11}V${y + 11}M${c - 11} ${y}H${c + 11}"/>`
    + tip(0, -10, 0) + tip(10, 0, 90) + tip(0, 10, 180) + tip(-10, 0, 270)
    + sparkle(c, y, 4, 0.6);
}

// Schwarze Kachel mit großem hellem Stern (wie in den unteren Plakat-Ecken)
export function tile() {
  return `<svg class="tile" viewBox="0 0 100 100" aria-hidden="true"><rect width="100" height="100" rx="14" fill="var(--ink)"/>${sparkle(50, 50, 38, 0, 'tile__star')}</svg>`;
}

// Wachssiegel mit unregelmäßigem Rand. seed = feste Zufallszahl, damit jedes Siegel anders aussieht.
export function seal(seed) {
  let a = seed * 9301 + 49297;
  const rnd = () => ((a = (a * 9301 + 49297) % 233280) / 233280);
  const pts = [];
  const N = 46;
  for (let i = 0; i < N; i++) {
    const t = (i / N) * Math.PI * 2;
    const rad = 52 + (rnd() - 0.5) * 6 + Math.sin(t * 5 + seed) * 2.2;
    pts.push([60 + Math.cos(t) * rad, 60 + Math.sin(t) * rad]);
  }
  const d = 'M' + pts.map((p) => p.map((v) => v.toFixed(1)).join(' ')).join('L') + 'Z';
  const dots = Array.from({ length: 16 }, (_, i) => {
    const t = (i / 16) * Math.PI * 2;
    return `<circle cx="${(60 + Math.cos(t) * 28).toFixed(1)}" cy="${(60 + Math.sin(t) * 28).toFixed(1)}" r="1.6"/>`;
  }).join('');
  const id = `wax${seed}`;
  return `<svg viewBox="0 0 120 120" aria-hidden="true">
    <defs><radialGradient id="${id}" cx="38%" cy="32%" r="75%"><stop offset="0" stop-color="#cf4a40"/><stop offset=".5" stop-color="#9e2024"/><stop offset="1" stop-color="#5f0f12"/></radialGradient></defs>
    <path d="${d}" fill="url(#${id})"/>
    <circle cx="60" cy="60" r="38" fill="none" stroke="#5a0c10" stroke-width="3" opacity=".75"/>
    <circle cx="61" cy="61" r="38" fill="none" stroke="#e98476" stroke-width="1" opacity=".35"/>
    <g fill="#5a0c10" opacity=".8">${dots}</g>
    <g fill="#5a0c10">${sparkle(60, 60, 19, 0, 'seal__star')}</g>
    <g fill="#e98476" opacity=".35" transform="translate(-.8 -.8)">${sparkle(60, 60, 19, 0, 'seal__star')}</g>
  </svg>`;
}
