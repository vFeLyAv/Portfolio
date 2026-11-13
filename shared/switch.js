// Fügt die kleine Varianten-Leiste unten ein. Aufruf: addSwitch('vinyl')
const VARIANTS = [
  ['salon', 'Portfolio'],
  ['night', 'Night'],
  ['vinyl', 'Vinyl'],
  ['sky', 'Sky'],
  ['seasons', 'Jahreszeiten'],
  ['v-mask', 'Mask'],
  ['v-knight', 'Knight'],
  ['v-ink', 'Ink'],
  ['v-meow', 'Meow'],
  ['v-bloom', 'Bloom'],
  ['v-goats', 'Goats'],
  ['v-quietblooms', 'Quiet'],
  ['v-won', 'Won'],
  ['v-season', 'Season'],
  ['v-artheart', 'Art'],
  ['v-face', 'Face'],
  ['xray', 'X-Ray'],
];

export function addSwitch(current) {
  if (new URLSearchParams(location.search).has('noswitch')) return;   // saubere Screenshots (salon/_shots)
  const nav = document.createElement('nav');
  nav.className = 'variant-switch';
  nav.setAttribute('aria-label', 'Stil-Varianten');
  const home = document.createElement('a');
  home.href = '/'; home.textContent = 'Alle';
  nav.append(home);
  for (const [id, label] of VARIANTS) {
    const a = document.createElement('a');
    a.href = `/${id}/`; a.textContent = label;
    if (id === current) a.setAttribute('aria-current', 'page');
    nav.append(a);
  }
  document.body.append(nav);
}
