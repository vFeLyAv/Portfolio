// Eine Quelle für alle Varianten (und später das PDF).
// Nur bestätigte Fakten aus ../../fakten.md. Keine Adresse, kein Telefon, kein Geburtsdatum (öffentliche Seite!).

export const person = {
  name: 'Feliks Kolomoiets',
  first: 'Feliks',      // so im Pass
  spoken: 'Felix',      // so ausgesprochen
  city: 'Regensburg',
  photoCaption: 'Regensburg, November 2026',
};

export const about = [
  'Ich komme aus Saporischschja und Dnipro, seit 2022 lebe ich in Bayern. Drei Jahre lang hatte ich hier zwei Stundenpläne: die deutsche Mittelschule und nebenbei online die ukrainische.',
  'Angefangen hat alles mit Minecraft: Welten bauen, Server einrichten, so lange herumprobieren, bis es läuft. Das mache ich immer noch, nur inzwischen mit Code und KI.',
  'Gerade mache ich mein Fachabitur in Technik, danach will ich in die IT.',
];

// Fun Facts für „Über mich“ – alles von Felix selbst erzählt (Chat 07./08.11.2026). Felix bitte prüfen!
export const facts = [
  { title: 'Spitzname: Felya', text: 'So nennen mich meine Freunde, daher auch @areyoufelya auf Instagram.' },
  { title: 'Zwei Schulen gleichzeitig', text: 'Drei Jahre lang: tagsüber die deutsche Mittelschule, nebenbei online die ukrainische.' },
  { title: 'Vier Sprachen', text: 'Russisch, Ukrainisch, Deutsch und Englisch.' },
  { title: 'Kochshow im Fernsehen', text: 'Als Kind habe ich in der Ukraine eine Kochsendung im Fernsehen moderiert.' },
  { title: 'Vor der Kamera', text: '3–4 Jahre Schauspielkurse und eine Nebenrolle in einer ukrainischen Serie.' },
  { title: 'Seit ca. 4 Jahren im Gym', text: 'Mit 12 habe ich mit Krafttraining angefangen und bin dabeigeblieben.' },
  { title: 'Bis zu 100 Spieler', text: 'So viele waren gleichzeitig auf dem Minecraft-Server, den ich mitgeleitet habe.' },
];
// Später: Felix schickt evtl. Videos/Fotos zu den Fakten (z. B. Kochshow, Serie) → dann pro Fakt ein media-Feld ergänzen.

// Dokumente (Zeugnisse, Praktikumsbescheinigungen): Scans kommen von Felix.
// WICHTIG: Zeugnisse enthalten persönliche Daten → öffentlich nur Vorschau/unscharf, Original nur in der Bewerbung.
export const documents = [
  { title: 'Qualifizierender Abschluss der Mittelschule', when: '2025', status: 'folgt', img: null },
  { title: 'Mittlerer Schulabschluss', when: '2026', status: 'folgt', img: null },
  { title: 'Praktikumsbescheinigung Maschinenfabrik Reinhausen', when: '11/2024', status: 'folgt', img: null },
];

export const school = [
  { when: 'seit 09/2026', what: 'Fachoberschule Regensburg', detail: 'Technik, 11. Klasse, Fachabitur 2028' },
  { when: '2022 – 2026', what: 'Angrüner-Mittelschule Bad Abbach', detail: 'Mittlerer Schulabschluss 2026, Quali 2025' },
  { when: '2015 – 2025', what: 'Schule in der Ukraine', detail: 'ab 2022 parallel online' },
];

export const practice = [
  { when: 'seit 09/2026', what: 'Eckert Schulen, Regenstauf', detail: 'Fachpraktische Ausbildung: Metall, Elektro, Bau, CNC' },
  { when: '11/2024', what: 'Maschinenfabrik Reinhausen', detail: 'Praktikum Metall/Maschinen, Elektro/Mechatronik, IT (11.–15.11.2024)' },
  { when: '04/2024', what: 'Krones Academy', detail: 'Praktikum Fachinformatiker Anwendungsentwicklung (22.–26.04.2024)' },
];

export const projects = [
  {
    when: '2026', title: 'Bunprise',
    text: 'Web-App für Freundeskreise: gemeinsamer Kalender, Wunschlisten zu jedem Anlass und geheimes Reservieren von Geschenken. Mit Claude und Codex gebaut.',
    img: '/img/bunprise-og.png', icon: '/img/bunprise-icon.png',
    url: 'https://bunprise.de',
    // Maskottchen-Animationen aus dem Bunprise-Projekt (webm, evtl. mit Transparenz) + Banner-Videos
    media: {
      mascot: ['/img/bunprise/peek-sniff.webm', '/img/bunprise/hop-across.webm', '/img/bunprise/corner-right.webm', '/img/bunprise/jump-out.webm', '/img/bunprise/surprise.webm', '/img/bunprise/ears-only.webm'],
      banner: ['/img/bunprise/banner-brand.mp4', '/img/bunprise/banner-dream.mp4'],
    },
  },
  {
    when: '2026', title: 'Diese Website',
    text: 'Diesen Lebenslauf und diese Website habe ich selbst gestaltet und mit KI-Werkzeugen gebaut: Idee, Design, Code und Bilder. Die Fotos habe ich lokal mit KI-Modellen in Ebenen zerlegt (BiRefNet für die Freistellung, Depth Anything V2 für die Tiefe).',
    img: '/img/depth.png',
  },
  {
    when: '2022 – 2024', title: 'Minecraft-Server',
    text: 'Mit-Leitung eines Servers: Plugins eingerichtet, Ideen umgesetzt, Orte gebaut. Szenen in Blender gerendert und in Photoshop fertig gemacht.',
    img: '/img/render-yellow.jpg',
  },
  {
    when: '2026', title: 'Flipper Zero in 3D',
    text: 'Fan-Seite zum Flipper Zero, einem Taschengerät für Funk, NFC und Infrarot. Beim Scrollen zerlegt sich das Gerät in 3D in seine Einzelteile, und am Ende kann man es selbst bedienen: Darauf läuft ein nachgebautes Flipper-System, daneben zeigt eine Bühne, was das Signal bewirken würde (Fernseher, Garagentor, Türleser). Gesendet wird nichts. Das 3D-Modell ist aus eigenen Formen gebaut, mit Three.js und KI-Werkzeugen.',
    img: '/img/flipper-hero.jpg',
    url: '/flipper/',
  },
];

// Zertifikate: werden ergänzt, sobald Felix sie hat. status: 'geplant' | 'erhalten'
export const certificates = [
  { title: 'AI Fluency: Framework & Foundations', issuer: 'Claude Academy (Anthropic)', status: 'erhalten', date: '08.11.2026',
    url: 'https://academy.claude.com/verify/07de25476907d7d09bdddd8d8e44317e', verify: true,
    img: '/certs/ai-fluency.webp', pdf: '/certs/ai-fluency.pdf' },
  { title: 'Claude Code in Action', issuer: 'Claude Academy (Anthropic)', status: 'erhalten', date: '07.11.2026',
    url: 'https://academy.claude.com/verify/b3b48fdb5810b92eb4bd8e105f893ef2', verify: true,
    img: '/certs/claude-code-in-action.webp', pdf: '/certs/claude-code-in-action.pdf' },
  { title: 'Python', issuer: 'Kaggle Learn', status: 'geplant', url: 'https://www.kaggle.com/learn' },
  { title: 'Introduction to Cybersecurity', issuer: 'Cisco Networking Academy', status: 'geplant', url: 'https://www.netacad.com' },
  { title: 'GitHub Foundations', issuer: 'GitHub', status: 'geplant', url: 'https://education.github.com/experiences/foundations_certificate' },
  { title: 'Elements of AI', issuer: 'University of Helsinki & MinnaLearn', status: 'geplant', url: 'https://www.elementsofai.com' },
];

export const languages = [
  { lang: 'Russisch', level: 'Muttersprache' },
  { lang: 'Ukrainisch', level: 'fließend' },
  { lang: 'Deutsch', level: 'fließend' },
  { lang: 'Englisch', level: 'gut' },
];

export const interests = [
  { what: 'Sport & gesunder Lebensstil', detail: 'Krafttraining seit ca. 4 Jahren' },
  { what: 'Programmieren mit KI', detail: 'Claude, Codex, Antigravity u. a.' },
  { what: 'IT & Kreativprojekte', detail: 'Programmieren, Video- und Fotobearbeitung' },
  { what: 'Fotografie', detail: 'Kameraeinstellungen, Bildgestaltung (Sony α7 III)' },
];

// Kenntnisse laut alten Lebensläufen (Downloads/Lebenslauf2.pdf, Lebenslauf tab.pdf)
export const skills = [
  // Stufen von Felix selbst festgelegt (08.11.2026): Grundlagen = 1, gut = 2, fortgeschritten = 3
  { group: 'Grafik & 3D', items: [ { what: 'Photoshop', level: 'gut' }, { what: 'Blender', level: 'Grundlagen' }, { what: 'DaVinci Resolve, CapCut', level: 'gut' } ] },
  { group: 'MS Office', items: [ { what: 'Excel', level: 'gut' }, { what: 'Word', level: 'gut' }, { what: 'PowerPoint', level: 'fortgeschritten' } ] },
  { group: 'Code & KI', items: [ { what: 'Claude Code, Codex, Antigravity', level: 'im Alltag' }, { what: 'Python', level: 'Grundlagen' }, { what: 'Java (Minecraft-Plugins)', level: 'Grundlagen' } ] },
];

// Felix hat seine E-Mail für die Website freigegeben (08.11.2026). Instagram war schon früher ok.
// 10.11.2026: Telefon (auch WhatsApp) und Telegram hat Felix für die Website freigegeben. Adresse und Geburtsdatum bleiben NUR im PDF.
export const contact = {
  email: 'felikskolomoiets@gmail.com', instagram: 'areyoufelya',
  phone: '+49 175 8726895',      // auch WhatsApp (gleiche Nummer)
  telegram: ['areyoufelya', 'gotprosperity'],   // beide Namen gehen
  github: 'vFeLyAv',             // github.com/vFeLyAv (Felix, 13.11.2026)
};
