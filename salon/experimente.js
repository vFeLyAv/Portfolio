// Experimente im Salon (Felix 13.11.2026: „als Experiment, wenn's komisch aussieht, nehmen wir's wieder raus“).
// Ausschalten: hier auf false setzen – oder zum Ausprobieren an die Adresse hängen: ?ohne=tueren
//   tueren = Türdurchgang zwischen den Sälen: dunkle Laibung + Goldschwelle oben, der neue Saal tritt aus der Tiefe hervor
//   tippen = beim Öffnen eines Bildes tippt sich die Überschrift des großen Etiketts Buchstabe für Buchstabe
//            wie auf einer Schreibmaschine (Vorleseprogramme bekommen den ganzen Text sofort)
// Aus bei „Bewegung reduzieren“.
// Wieder raus (beides im git-Verlauf): „Kerze“ (Schein am Mauszeiger, zu groß/hell; Commit e8974be) und
// „Klang“ (Schalter-Klick + Röhren-Summen; der Klick kam fälschlich auch beim Neuladen und wirkte unheimlich; Commit d4259be).
const EXP = { tueren: true, tippen: true };

const off = new URLSearchParams(location.search).get('ohne');
if (off) for (const k of off.split(',')) EXP[k.trim()] = false;
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const root = document.documentElement;

/* ------------------------------------------------------------ Türen */
if (EXP.tueren && !reduced && 'IntersectionObserver' in window) {
  root.classList.add('exp-tueren');
  const io = new IntersectionObserver((es) => es.forEach((e) => {
    if (e.isIntersecting) { e.target.classList.add('door-in'); io.unobserve(e.target); }
  }), { rootMargin: '0px 0px -18% 0px' });
  document.querySelectorAll('.room:not(.foyer) > .room-inner').forEach((el) => {
    // schon sichtbar oder darüber (Neuladen mitten auf der Seite): sofort fertig, kein Nachholen
    if (el.getBoundingClientRect().top < innerHeight * 0.82) el.classList.add('door-in', 'door-now'); else io.observe(el);
  });
}

/* ------------------------------------------------------------ Schreibmaschine */
const viewer = document.querySelector('dialog.viewer');
if (EXP.tippen && !reduced && viewer) {
  // jeden Buchstaben in ein <span> mit Verzögerung packen (nur Textknoten – ein Icon im Titel bleibt, wie es ist)
  const type = (el, start, perChar) => {
    let i = 0;
    const walk = document.createTreeWalker(el, NodeFilter.SHOW_TEXT), nodes = [];
    while (walk.nextNode()) nodes.push(walk.currentNode);
    for (const n of nodes) {
      if (!n.data.trim()) continue;
      // EINE Hülle je Textstück: die Überschrift im Etikett ist ein Flex-Container mit gap (für das Icon) –
      // einzelne Buchstaben-Spans wären sonst je ein Flex-Element mit 14 px Abstand („Ü B E R“)
      const f = document.createElement('span'); f.className = 'tw-w';
      for (const ch of n.data) {
        const s = document.createElement('span'); s.className = 'tw-c'; s.textContent = ch;
        s.style.animationDelay = `${start + i * perChar}ms`; if (ch.trim()) i++;
        f.append(s);
      }
      n.replaceWith(f);
    }
    return start + i * perChar;
  };
  new MutationObserver(() => {
    if (!viewer.open) return;
    const body = viewer.querySelector('[data-slot="viewer"]');
    const kicker = body?.querySelector('.v-kicker'), title = body?.querySelector('#viewer-title');
    if (!title || title.dataset.tw) return;
    title.dataset.tw = '1';
    title.setAttribute('aria-label', title.textContent.trim());   // Vorlesen: der ganze Titel auf einmal
    const n = (kicker?.textContent.length || 0) + title.textContent.length;
    const per = Math.max(18, Math.min(42, 1300 / Math.max(1, n)));   // höchstens ~1,3 s für alles
    const after = kicker ? type(kicker, 120, per * 0.7) : 120;
    const end = type(title, after + 120, per);
    title.classList.add('tw-caret');
    setTimeout(() => title.classList.remove('tw-caret'), end + 1400);
  }).observe(viewer, { attributes: true, attributeFilter: ['open'] });
}
