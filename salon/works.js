// Was nur der Salon braucht: wie jedes Projekt an der Wand hängt, und die Design-Studien (Poster → Website).
//
// NEUES PROJEKT?
//   1. In /shared/data.js, data.en.js und data.ru.js bei `projects` eintragen → erscheint automatisch in Saal II.
//   2. Optional hier in PROJECT_LOOK an derselben Stelle: Seitenverhältnis des Bildes, Ausschnitt, Material.
//      Ohne Eintrag gilt DEFAULT_LOOK (4 : 3, Mitte, kein Material).
//
// NEUE DESIGN-STUDIE?
//   Screenshot nach /img/works/<id>-site.webp (1280×800), Poster nach /img/works/<id>-poster.webp, dann unten in STUDIES eintragen.

// Vorschau aller Stile (Cloudflare Pages, noindex). Dort laufen die Varianten live.
export const STYLES_URL = 'https://felya-styles.pages.dev';

// Bunprise: animiertes Banner (Logo + Hase und Hamster), das Standbild gilt ohne Animationen
const BUNPRISE_VIDEO = { src: '/img/bunprise/banner-brand.mp4', poster: '/img/works/bunprise-banner.jpg' };

// gleiche Reihenfolge wie `projects` in /shared/data.js
// cta: Name des Button-Texts aus UI in i18n.js (ohne Angabe: „bunprise.de besuchen“)
export const PROJECT_LOOK = [
  { // Bunprise
    ratio: '16 / 9', pos: '50% 50%', img: BUNPRISE_VIDEO.poster, video: BUNPRISE_VIDEO.src,
    mat: { de: 'Web-App, Claude & Codex', en: 'Web app, Claude & Codex', ru: 'веб-приложение, Claude и Codex' },
  },
  { // Diese Website
    ratio: '1214 / 1800', pos: '50% 40%',
    mat: { de: 'Tiefenkarte, Depth Anything V2', en: 'Depth map, Depth Anything V2', ru: 'карта глубины, Depth Anything V2' },
  },
  { // Minecraft-Server: Render „Hinar – Trails & Tales“ (Felix' Wahl, passt farblich zum Salon)
    ratio: '4 / 3', pos: '50% 50%', img: '/img/render-hinar.jpg',
    mat: { de: 'Blender-Render, Photoshop', en: 'Blender render, Photoshop', ru: 'рендер в Blender, Photoshop' },
  },
  { // Flipper Zero in 3D: Fan-Seite aus 30-experiments/flipper-zero-site, liegt als eine Datei unter /flipper/
    ratio: '16 / 10', pos: '50% 50%', cta: 'live',
    mat: { de: 'Three.js, GSAP', en: 'Three.js, GSAP', ru: 'Three.js, GSAP' },
  },
];
export const DEFAULT_LOOK = { ratio: '4 / 3', pos: '50% 50%', mat: { de: '', en: '', ru: '' } };

// Design-Studien: je ein Pinterest-Poster als Vorlage und die Website, die daraus wurde.
// here: true = die Seite, auf der man gerade ist (kein Live-Link). poster: false = ohne Vorlage.
// pin: Link zum Original-Pin auf Pinterest (wird im großen Etikett verlinkt) — Felix trägt die Links nach.
export const STUDIES = [
  {
    id: 'v-artheart', here: true, name: { de: 'Salon', en: 'Salon', ru: 'Салон' }, from: 'Art & Heart',
    text: {
      de: 'Diese Seite. Ein Museumssalon mit Goldrahmen und einem Spotlight, das dem Mauszeiger folgt. Ein Klick auf ein Bild, und man tritt näher heran.',
      en: 'This page. A museum salon with gilded frames and a spotlight that follows the cursor. Click a picture to step closer.',
      ru: 'Эта страница. Музейный салон с золотыми рамами и прожектором, который следует за курсором. Клик по картине, и ты подходишь ближе.',
    },
  },
  {
    id: 'seasons', name: { de: 'Jahreszeiten', en: 'Seasons', ru: 'Времена года' }, from: 'Drying Moment of Cloud',
    text: {
      de: 'Aus der Wolke an der Wäscheleine wurde ein ganzer Himmel: Beim Scrollen vergeht ein Jahr, von Frühlingsblüten bis zum Schnee in der Winternacht. Dazu ein Plattenspieler zum Scratchen.',
      en: 'The cloud on the washing line became a whole sky: a year passes as you scroll, from spring blossoms to snow on a winter night. Plus a record player you can scratch.',
      ru: 'Облако на бельевой верёвке превратилось в целое небо: пока листаешь, проходит год, от весенних цветов до снега зимней ночью. И проигрыватель, на котором можно скретчить.',
    },
  },
  {
    id: 'v-meow', name: { de: 'Meow', en: 'Meow', ru: 'Meow' }, from: 'Meow',
    text: {
      de: 'Verspieltes Orange, Sticker und Formen, die unter dem Mauszeiger lebendig werden.',
      en: 'Playful orange, stickers and shapes that come alive under the cursor.',
      ru: 'Игривый оранжевый, стикеры и фигуры, которые оживают под курсором.',
    },
  },
  {
    id: 'v-bloom', name: { de: 'Bloom', en: 'Bloom', ru: 'Bloom' }, from: 'Bloom',
    text: {
      de: 'Hohe Serifenschrift, und vor den Buchstaben wachsen halbtransparente Blumen.',
      en: 'Tall serif lettering with translucent flowers growing in front of it.',
      ru: 'Высокий шрифт с засечками, а перед буквами растут полупрозрачные цветы.',
    },
  },
  {
    id: 'v-quietblooms', name: { de: 'Quiet Blooms', en: 'Quiet Blooms', ru: 'Quiet Blooms' }, from: 'Quiet Blooms Are Soft',
    text: {
      de: 'Das Foto als Pixel-Mosaik, unter dem Mauszeiger liegt eine Lupe, die es scharf zeigt.',
      en: 'The photo as a pixel mosaic, with a magnifier under the cursor that shows it sharp.',
      ru: 'Фото как пиксельная мозаика, а под курсором лупа, через которую оно видно чётко.',
    },
  },
  {
    id: 'v-face', name: { de: 'Face', en: 'Face', ru: 'Face' }, from: 'Face',
    text: {
      de: 'Eine zerschnittene Collage aus meinem Gesicht, ein Auge wird zur Lupe.',
      en: 'A cut-up collage of my face, one eye turns into a magnifier.',
      ru: 'Разрезанный коллаж из моего лица, один глаз становится лупой.',
    },
  },
  {
    id: 'v-knight', name: { de: 'Knight', en: 'Knight', ru: 'Knight' }, from: 'Knight',
    text: {
      de: 'Buchstaben voller Blumen wie auf dem Ritterposter, und ein Wachssiegel stempelt beim Scrollen die Zertifikate.',
      en: 'Letters full of flowers like the knight poster, and a wax seal stamps the certificates as you scroll.',
      ru: 'Буквы, полные цветов, как на постере с рыцарем, а при прокрутке сургучная печать штампует сертификаты.',
    },
  },
  {
    id: 'v-ink', name: { de: 'Ink', en: 'Ink', ru: 'Ink' }, from: 'Idea',
    text: {
      de: 'Schweizer Minimalismus: Unter dem Namen breitet sich blaue Tinte im Wasser aus.',
      en: 'Swiss minimalism: blue ink spreads through water beneath the name.',
      ru: 'Швейцарский минимализм: под именем в воде расходятся синие чернила.',
    },
  },
];

// Fotos zu einzelnen Fun Facts (Index wie in `facts` in /shared/data.js), erscheinen als kleine Polaroids
export const FACT_PHOTOS = {
  3: '/img/felix/fact-kochshow-4075.jpg',   // Kochshow im Fernsehen
  4: '/img/felix/fact-kamera-9593.jpg',     // Vor der Kamera
  5: '/img/felix/fact-gym-0430.jpg',        // Seit ca. 4 Jahren im Gym (IMG_0430, Rücken im runden Spiegel; Felix' Freigabe 10.11.)
};

export const studyImg = (s) => `/img/works/${s.id}-site.webp`;
export const posterImg = (s) => `/img/works/${s.id}-poster.webp`;
export const studyUrl = (s) => (s.here ? null : `${STYLES_URL}/${s.id}/`);
