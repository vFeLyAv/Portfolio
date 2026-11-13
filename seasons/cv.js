// Lebenslauf als Grafik (den ausführlichen Lebenslauf schickt Felix selbst, er enthält persönliche Daten).
//  1) Werdegang: eine Wäscheleine als Weg. Zwei Leinen, an einem Knoten verbunden: links die Ukraine
//     (aufgewachsen in Saporischschja und Dnipro), rechts Bayern (seit 2022). Jede Station hängt als
//     Schild an einer Klammer: Schule (cremig) oder Praxis (rosa). Antippen / Zeigen öffnet die Details.
//     Am Ende läuft die Leine gestrichelt weiter bis zum Ziel (Fachabitur).
//     Schmal (Handy): dieselben Stationen untereinander an einer senkrechten Schnur.
//  2) Kenntnisse und Sprachen als Perlen auf einer Schnur (Stufen statt Prozentbalken, das Wort steht immer daneben).
//  3) Zertifikate als echte Abzüge (öffnen das große Zertifikat) und Interessen kurz darunter.
//  4) Dokumente (Zeugnisse, Bescheinigungen) als Papierbögen; Scans später über data.js → documents[].img
//     (nur unscharfe Vorschau, weil Zeugnisse persönliche Daten enthalten).
// Alles echter Text im DOM, per Tastatur bedienbar (Tab, Enter, Esc). Fakten nur aus /shared/data.js bzw. data.en.js
// (main.js übergibt data = Inhalte der aktuellen Sprache, t = feste Texte aus i18n.js; bei Sprachwechsel neu aufgerufen).

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
// Beginn einer Station als Jahreszahl mit Monat: "seit 09/2026" → 2026.67, "2022 – 2026" → 2022
function startOf(when) {
  const m = when.match(/(\d{1,2})\/(\d{4})/);
  if (m) return +m[2] + (+m[1] - 1) / 12;
  const y = when.match(/\d{4}/);
  return y ? +y[0] : 0;
}
// Stufen: Wörter aus data.js → Anzahl gefüllter Perlen
const SKILL_STEPS = { Grundlagen: 1, gut: 2, fortgeschritten: 3, 'im Alltag': 3 };
const LANG_STEPS = { Grundlagen: 1, gut: 2, 'fließend': 3, Muttersprache: 4 };
// sehr lange Wörter (ab 14 Buchstaben) dürfen notfalls an einer Wortfuge umbrechen (weicher Trennstrich,
// greift nur, wenn das Wort nicht in die Zeile passt); kurze Namen werden nie getrennt
const soft = (html) => html.replace(/[A-Za-zÄÖÜäöüß]{14,}/g, (w) => w.replace(/(?<=\w{6})(bescheinigung|schule|fabrik|akademie|academy|ausbildung|informatiker|entwicklung|mechatronik)/i, '­$1'));
const beads = (n, of) => `<span class="beads" aria-hidden="true">${Array.from({ length: of }, (_, i) => `<span class="bead${i < n ? ' bead--on' : ''}"></span>`).join('')}</span>`;

let ro = null, outsideBound = false, closeAll = null;
export function initCv(panel, { addSwing, dropSwings, fine, data, t }) {
  const { person, about, school, practice, certificates, languages, interests, skills, documents } = data;
  const st = (o) => o.label || t.status[o.status] || o.status;   // Anzeige-Wort (Codes bleiben deutsch)
  /* ---------- Daten vorbereiten ---------- */
  const text = about.join(' ');
  const grewUp = t.grewUp(text);
  const moved = t.moved(text);
  const moveYear = moved ? moved.year : null, moveTo = moved ? moved.place : '';
  const goalM = school.map((s) => s.detail.match(/Fachabitur\D{0,4}(\d{4})/)).find(Boolean);
  const stops = [
    ...school.map((e) => ({ ...e, kind: t.kindSchool, k: 'schule' })),
    ...practice.map((e) => ({ ...e, kind: t.kindPractice, k: 'praxis' })),
  ].map((e) => ({ ...e, t: startOf(e.when) }))
    .sort((a, b) => a.t - b.t || (a.k === 'schule' ? -1 : 1));
  const before = moveYear ? stops.filter((s) => s.t < moveYear).length : 0;   // Stationen vor dem Umzug
  const regionA = grewUp && before ? { small: t.regionA, big: grewUp } : null;
  const regionB = moveTo ? { small: t.since(moveYear), big: moveTo } : null;

  /* ---------- HTML ---------- */
  // Die Stationen hängen an mehreren Leinen untereinander (breit: 4 pro Leine, mittel: 3), damit jedes Schild
  // breit genug für den ganzen Namen ist (keine Silbentrennung). Schmal: eine senkrechte Schnur.
  const regionHTML = (r) => `<span class="region__small">${esc(r.small)}</span><span class="region__big">${esc(r.big)}</span>`;
  const stopHTML = (s, i, c) => {
    const regionHere = i === 0 && regionA ? regionA : i === before && regionB ? regionB : null;
    return `<li class="stop stop--${s.k}" style="grid-column:${c + 1}">
      ${regionHere ? `<p class="stop__region">${regionHTML(regionHere)}</p>` : ''}
      <div class="stop__swing">
        <svg class="peg" aria-hidden="true"><use href="#peg"/></svg>
        <button class="stop__tag" type="button" aria-expanded="false" aria-controls="stopD${i}">
          <span class="stop__kind">${s.kind}</span>
          <span class="stop__what">${esc(s.what)}</span>
          <span class="stop__when">${esc(s.when)}</span>
          <span class="stop__plus" aria-hidden="true"></span>
        </button>
        <div class="stop__detail" id="stopD${i}"><p>${esc(s.detail)}</p></div>
      </div>
    </li>`;
  };
  const goalHTML = (c) => `<li class="stop stop--goal" style="grid-column:${c + 1}"><span class="goal__star" aria-hidden="true"></span><span class="goal__lbl">${esc(t.goal)}</span><span class="goal__what">${esc(t.goalWhat(goalM[1]))}</span></li>`;
  const list = [...stops.map((s, i) => ({ s, i })), ...(goalM ? [{ goal: true, i: stops.length }] : [])];
  function routeHTML(per) {
    const rows = [];
    for (let k = 0; k < list.length; k += per) rows.push(list.slice(k, k + per));
    // eine allein übrig gebliebene Ziel-Station kommt mit auf die Leine davor
    if (rows.length > 1 && rows[rows.length - 1].length === 1 && rows[rows.length - 1][0].goal) rows[rows.length - 2].push(rows.pop()[0]);
    return rows.map((row) => {
      const first = row[0].i, n = row.length;
      const cols = row.map((it) => (it.goal ? 'minmax(0, .62fr)' : 'minmax(0, 1fr)')).join(' ');
      const regs = [];
      if (regionA && first === 0) regs.push(`<p class="region" style="grid-column:1 / span ${Math.min(before, n)}">${regionHTML(regionA)}</p>`);
      if (regionB && before >= first && before < first + n) regs.push(`<p class="region region--b" style="grid-column:${before - first + 1} / -1">${regionHTML(regionB)}</p>`);
      return `<div class="route__row" data-first="${first}" style="--cols:${cols}">
        <div class="route__regions">${regs.join('')}</div>
        <svg class="route__svg" aria-hidden="true"><path class="route__line route__line--ghost"/><path class="route__line"/><path class="route__line route__line--future"/><g class="route__knots"></g></svg>
        <ol class="route__stops" start="${first + 1}">${row.map((it, c) => (it.goal ? goalHTML(c) : stopHTML(it.s, it.i, c))).join('')}</ol>
      </div>`;
    }).join('');
  }

  const earned = certificates.filter((c) => c.status === 'erhalten');
  panel.innerHTML = `
    <div class="cv__head">
      <p class="cv__who">${esc(person.name)}<span>${esc(person.city)}</span></p>
    </div>

    <section class="cvb cvb--route" aria-labelledby="cvWeg">
      <h3 class="cvb__title" id="cvWeg">${esc(t.weg)}</h3>
      <div class="route">${routeHTML(4)}</div>
    </section>

    <div class="cv__grid">
      <section class="cvb cvb--skills" aria-labelledby="cvSkills">
        <h3 class="cvb__title" id="cvSkills">${esc(t.skills)}</h3>
        ${skills.map((g) => `<div class="sgroup">
          <h4 class="sgroup__name">${esc(g.group)}</h4>
          <ul class="slist">${g.items.map((it) => `<li class="srow">
            <span class="srow__what">${esc(it.what)}</span>${beads(SKILL_STEPS[it.level] || 0, 3)}<span class="srow__lvl">${esc(it.label || it.level)}</span>
          </li>`).join('')}</ul>
        </div>`).join('')}
      </section>

      <section class="cvb cvb--lang" aria-labelledby="cvLang">
        <h3 class="cvb__title" id="cvLang">${esc(t.langs)}</h3>
        <ul class="langs">${languages.map((l) => `<li class="lang lang--${LANG_STEPS[l.level] || 0}">
          <span class="lang__name">${esc(l.lang)}</span>
          ${beads(LANG_STEPS[l.level] || 0, 4)}
          <span class="lang__lvl">${esc(l.label || l.level)}</span>
        </li>`).join('')}</ul>
      </section>

      <section class="cvb cvb--more" aria-labelledby="cvCert">
        <h3 class="cvb__title" id="cvCert">${esc(t.certs)}</h3>
        <ul class="certmini">${earned.map((c, i) => `<li class="cvcert">
          ${c.img ? `<button class="cvcert__btn" type="button" data-cert="${i}" aria-haspopup="dialog" aria-label="${esc(t.certBig(c.title))}">
            <span class="badge__print"><img src="${esc(c.img)}" alt="" draggable="false"></span>
          </button>` : ''}
          <span class="certmini__what">${esc(c.title)}</span>
          <span class="certmini__by">${esc(c.issuer)}${c.date ? `, ${esc(c.date)}` : ''}</span>
          ${c.url ? `<a class="cvcert__link" href="${esc(c.url)}" target="_blank" rel="noopener">${esc(c.verify ? t.verify : t.toCourse)}<span class="sr-only"> ${esc(t.newTab)}</span></a>` : ''}
        </li>`).join('')}</ul>
      </section>

      ${documents.length ? `<section class="cvb cvb--docs" aria-labelledby="cvDocs">
      <h3 class="cvb__title" id="cvDocs">${esc(t.docs)}</h3>
      <ul class="docs">${documents.map((d, i) => `<li class="doc" style="--tilt:${[-1.2, 0.8, -0.5][i % 3]}deg">
        <div class="doc__sheet">
          ${d.img
            // Zeugnisse enthalten persönliche Daten: öffentlich nur als unscharfe Vorschau, das Original gibt es in der Bewerbung
            ? `<img class="doc__scan" src="${esc(d.img)}" alt="" loading="lazy" decoding="async"><span class="doc__hint">${esc(t.docPreview)}</span>`
            : `<span class="doc__lines" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></span>`}
          ${d.status ? `<span class="doc__stamp">${esc(st(d))}</span>` : ''}
        </div>
        <span class="doc__what">${soft(esc(d.title))}</span>
        <span class="doc__when">${esc(d.when)}</span>
      </li>`).join('')}</ul>
      </section>` : ''}

      <section class="cvb cvb--int" aria-labelledby="cvInt">
        <h3 class="cvb__title" id="cvInt">${esc(t.interests)}</h3>
        <ul class="chips" aria-labelledby="cvInt">${interests.map((it) => `<li class="chip"><b>${esc(it.what)}</b><span>${esc(it.detail)}</span></li>`).join('')}</ul>
      </section>
    </div>`;

  /* ---------- Öffnen / Schließen der Stationen ---------- */
  const route = panel.querySelector('.route');
  const O = { hover: -1, focus: -1, pin: -1, col: false, per: 4 };
  let items = [];
  function sync() {
    const active = O.col ? O.pin : O.hover >= 0 ? O.hover : O.focus >= 0 ? O.focus : O.pin;
    items.forEach((it, i) => {
      const on = i === active;
      if (it.li.classList.contains('is-open') !== on) {
        it.li.classList.toggle('is-open', on);
        it.btn.setAttribute('aria-expanded', String(on));
      }
    });
  }
  function bind() {
    dropSwings?.('cv');
    items = [...route.querySelectorAll('.stop:not(.stop--goal)')].map((li) => ({ li, btn: li.querySelector('.stop__tag'), swing: li.querySelector('.stop__swing') }));
    items.forEach((it, i) => {
      it.li.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse' && fine) { O.hover = i; sync(); } });
      it.li.addEventListener('pointerleave', () => { if (O.hover === i) { O.hover = -1; sync(); } });
      it.btn.addEventListener('focus', () => { if (it.btn.matches(':focus-visible')) { O.focus = i; sync(); } });
      it.btn.addEventListener('blur', () => { if (O.focus === i) { O.focus = -1; sync(); } });
      it.btn.addEventListener('click', () => { O.pin = O.pin === i ? -1 : i; if (O.focus === i && O.pin === -1) O.focus = -1; sync(); });
      it.btn.addEventListener('keydown', (e) => { if (e.key === 'Escape') { O.pin = O.focus = O.hover = -1; sync(); } });
      it.s = addSwing(it.swing, 20 + i, 0.5, 'cv');
    });
  }
  bind();
  // Klick daneben schließt die offene Station (ein Zuhörer für alle Aufrufe; zeigt immer auf den neuesten Stand)
  closeAll = (e) => { if (O.pin >= 0 && !e.target.closest('.stop')) { O.pin = -1; sync(); } };
  if (!outsideBound) { outsideBound = true; document.addEventListener('pointerdown', (e) => closeAll?.(e)); }

  /* ---------- Leinen zeichnen ---------- */
  const NS = 'http://www.w3.org/2000/svg';
  function layout() {
    const w = route.clientWidth;
    if (!w) return;
    const col = w < 860;
    const per = col ? list.length : w >= 1000 ? 4 : 3;
    if (per !== O.per) {   // andere Breite: Leinen neu aufteilen
      O.per = per; O.pin = O.hover = O.focus = -1;
      route.innerHTML = routeHTML(per);
      bind();
    }
    O.col = col;
    route.classList.toggle('route--col', col);
    items.forEach((it) => { it.s.held = col; if (col) it.swing.style.transform = ''; });
    route.querySelectorAll('.route__row').forEach((row) => drawRow(row, col));
    sync();
  }
  function drawRow(row, col) {
    const w = row.clientWidth;
    const ol = row.querySelector('.route__stops'), svg = row.querySelector('.route__svg');
    const [ghost, line, future] = svg.querySelectorAll('path');
    const knots = svg.querySelector('.route__knots');
    knots.textContent = '';
    const knot = (x, y, cls = '') => { const c = document.createElementNS(NS, 'circle'); c.setAttribute('cx', x.toFixed(1)); c.setAttribute('cy', y.toFixed(1)); c.setAttribute('r', cls ? '5.5' : '3.6'); if (cls) c.setAttribute('class', cls); knots.append(c); };
    const lis = [...ol.children];
    const goalLi = ol.querySelector('.stop--goal');
    const first = +row.dataset.first;
    svg.style.top = `${ol.offsetTop}px`;

    if (col) {
      // senkrechte Schnur links, Knoten auf Höhe jedes Schilds
      lis.forEach((li) => (li.style.paddingTop = ''));
      const h = ol.offsetHeight, X = 14;
      svg.setAttribute('viewBox', `0 0 ${w} ${h}`); svg.style.height = `${h}px`;
      const top0 = ol.getBoundingClientRect().top;
      const ys = lis.map((li) => li === goalLi
        ? li.querySelector('.goal__star').getBoundingClientRect().top - top0 + 12
        : li.querySelector('.stop__tag').getBoundingClientRect().top - top0 + 22);
      const lastReal = goalLi ? ys[ys.length - 2] : ys[ys.length - 1];
      const seg = (y0, y1) => { let d = `M${X} ${y0.toFixed(1)}`; for (let y = y0; y <= y1; y += 12) d += ` L${(X + Math.sin(y * 0.035) * 1.6).toFixed(1)} ${y.toFixed(1)}`; return `${d} L${X} ${y1.toFixed(1)}`; };
      line.setAttribute('d', seg(Math.max(0, ys[0] - 26), lastReal));
      ghost.setAttribute('d', '');
      future.setAttribute('d', goalLi ? seg(lastReal, ys[ys.length - 1] - 12) : '');
      ys.forEach((y, i) => { if (lis[i] !== goalLi) knot(X, y); });
      return;
    }
    // breit: durchhängende Leine; liegt der Umzug in dieser Reihe, zwei Leinen am Knoten verbunden
    lis.forEach((li) => (li.style.paddingTop = ''));
    const H = 150, y0 = 14;
    svg.setAttribute('viewBox', `0 0 ${w} ${H}`); svg.style.height = `${H}px`;
    const mids = lis.map((li) => li.offsetLeft + li.offsetWidth / 2);
    const k = before - first;   // Umzug zwischen Station k-1 und k dieser Reihe
    const xMove = k > 0 && k < lis.length ? (lis[k - 1].offsetLeft + lis[k - 1].offsetWidth + lis[k].offsetLeft) / 2 : null;
    const spans = xMove ? [[0, xMove], [xMove, w]] : [[0, w]];
    const yAt = (x) => {
      const [a, b] = spans.find(([, b2]) => x <= b2) || spans[spans.length - 1];
      const u = (x - a) / (b - a), sag = Math.min(34, 10 + (b - a) * 0.03);
      return y0 + 4 * sag * u * (1 - u);
    };
    const poly = (x0, x1, dy = 0) => { let d = ''; for (let x = x0; x <= x1 + 0.1; x += Math.max(4, (x1 - x0) / 60)) d += `${d ? 'L' : 'M'}${x.toFixed(1)} ${(yAt(Math.min(x, x1)) + dy).toFixed(1)}`; return d; };
    const xLast = goalLi ? mids[mids.length - 2] : w;
    line.setAttribute('d', poly(0, xLast));
    ghost.setAttribute('d', poly(0, xLast, 1.6));
    future.setAttribute('d', goalLi ? poly(xLast, mids[mids.length - 1]) : '');
    if (xMove) knot(xMove, y0, 'knot--move');
    lis.forEach((li, i) => { if (li !== goalLi) li.style.paddingTop = `${Math.max(0, yAt(mids[i]) - 10)}px`; });
    if (goalLi) { const gy = yAt(mids[mids.length - 1]); goalLi.style.paddingTop = `${Math.max(0, gy - 12)}px`; }
  }
  ro?.disconnect();
  ro = new ResizeObserver(() => layout());
  ro.observe(route);
  layout();
  return { layout, certBtns: [...panel.querySelectorAll('.cvcert__btn')] };
}
