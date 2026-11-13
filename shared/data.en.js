// English version of data.js — SAME structure and export names.
// Codes used by the page logic stay German (status: 'geplant' | 'erhalten' | 'folgt', skill/language `level`),
// the English text to DISPLAY is in `label`. Facts only from data.js — keep both files in sync.

export const person = {
  name: 'Feliks Kolomoiets',
  first: 'Feliks',
  spoken: 'Felix',
  city: 'Regensburg',
  photoCaption: 'Regensburg, November 2026',
};

export const about = [
  'I’m from Zaporizhzhia and Dnipro and have lived in Bavaria since 2022. For three years I had two timetables here: German secondary school, plus the Ukrainian one online.',
  'It all started with Minecraft: building worlds, setting up servers, tinkering until things worked. I still do that, just with code and AI now.',
  'Right now I’m doing my Fachabitur in engineering, and after that I want to go into IT.',
];

export const facts = [
  { title: 'Nickname: Felya', text: 'That is what my friends call me, hence @areyoufelya on Instagram.' },
  { title: 'Two schools at once', text: 'For three years: the German secondary school by day, the Ukrainian school online alongside.' },
  { title: 'Four languages', text: 'Russian, Ukrainian, German and English.' },
  { title: 'Cooking show on TV', text: 'As a kid I hosted a cooking show on Ukrainian television.' },
  { title: 'In front of the camera', text: '3–4 years of acting classes and a supporting role in a Ukrainian TV series.' },
  { title: 'About 4 years at the gym', text: 'I started strength training at 12 and stuck with it.' },
  { title: 'Up to 100 players', text: 'That many were online at the same time on the Minecraft server I co-ran.' },
];

export const documents = [
  { title: 'Qualifying secondary school certificate (Quali)', when: '2025', status: 'folgt', label: 'coming soon', img: null },
  { title: 'Intermediate school certificate (Mittlerer Schulabschluss)', when: '2026', status: 'folgt', label: 'coming soon', img: null },
  { title: 'Internship certificate, Maschinenfabrik Reinhausen', when: '11/2024', status: 'folgt', label: 'coming soon', img: null },
];

export const school = [
  { when: 'since 09/2026', what: 'Fachoberschule Regensburg (technical upper secondary school)', detail: 'Engineering track, year 11, Fachabitur 2028' },
  { when: '2022 – 2026', what: 'Angrüner-Mittelschule Bad Abbach', detail: 'Intermediate school certificate 2026, qualifying certificate 2025' },
  { when: '2015 – 2025', what: 'School in Ukraine', detail: 'online alongside German school from 2022' },
];

export const practice = [
  { when: 'since 09/2026', what: 'Eckert Schulen, Regenstauf', detail: 'Practical training: metalwork, electrical, construction, CNC' },
  { when: '11/2024', what: 'Maschinenfabrik Reinhausen', detail: 'Internship: metal/machinery, electrical/mechatronics, IT (11–15 Nov 2024)' },
  { when: '04/2024', what: 'Krones Academy', detail: 'Internship: IT specialist for application development (22–26 Apr 2024)' },
];

export const projects = [
  {
    when: '2026', title: 'Bunprise',
    text: 'Web app for groups of friends: a shared calendar, wish lists for every occasion and secretly reserving gifts. Built with Claude and Codex.',
    img: '/img/bunprise-og.png', icon: '/img/bunprise-icon.png',
    url: 'https://bunprise.de',
    media: {
      mascot: ['/img/bunprise/peek-sniff.webm', '/img/bunprise/hop-across.webm', '/img/bunprise/corner-right.webm', '/img/bunprise/jump-out.webm', '/img/bunprise/surprise.webm', '/img/bunprise/ears-only.webm'],
      banner: ['/img/bunprise/banner-brand.mp4', '/img/bunprise/banner-dream.mp4'],
    },
  },
  {
    when: '2026', title: 'This website',
    text: 'I designed this CV and website myself and built it with AI tools: idea, design, code and images. I split the photos into layers locally with AI models (BiRefNet for the cut-outs, Depth Anything V2 for depth).',
    img: '/img/depth.png',
  },
  {
    when: '2022 – 2024', title: 'Minecraft server',
    text: 'Co-ran a server: set up plugins, turned ideas into features, built places. Rendered scenes in Blender and finished them in Photoshop.',
    img: '/img/render-yellow.jpg',
  },
  {
    when: '2026', title: 'Flipper Zero in 3D',
    text: 'Fan site about the Flipper Zero, a pocket gadget for radio, NFC and infrared. As you scroll, the device takes itself apart in 3D, and at the end you can use it yourself: it runs a rebuilt Flipper system, and a stage next to it shows what the signal would do (TV, garage door, door reader). Nothing is actually sent. The 3D model is built from my own shapes, with Three.js and AI tools.',
    img: '/img/flipper-hero.jpg',
    url: '/flipper/',
  },
];

export const certificates = [
  { title: 'AI Fluency: Framework & Foundations', issuer: 'Claude Academy (Anthropic)', status: 'erhalten', label: 'earned', date: '8 Nov 2026',
    url: 'https://academy.claude.com/verify/07de25476907d7d09bdddd8d8e44317e', verify: true,
    img: '/certs/ai-fluency.webp', pdf: '/certs/ai-fluency.pdf' },
  { title: 'Claude Code in Action', issuer: 'Claude Academy (Anthropic)', status: 'erhalten', label: 'earned', date: '7 Nov 2026',
    url: 'https://academy.claude.com/verify/b3b48fdb5810b92eb4bd8e105f893ef2', verify: true,
    img: '/certs/claude-code-in-action.webp', pdf: '/certs/claude-code-in-action.pdf' },
  { title: 'Python', issuer: 'Kaggle Learn', status: 'geplant', label: 'in progress', url: 'https://www.kaggle.com/learn' },
  { title: 'Introduction to Cybersecurity', issuer: 'Cisco Networking Academy', status: 'geplant', label: 'in progress', url: 'https://www.netacad.com' },
  { title: 'GitHub Foundations', issuer: 'GitHub', status: 'geplant', label: 'in progress', url: 'https://education.github.com/experiences/foundations_certificate' },
  { title: 'Elements of AI', issuer: 'University of Helsinki & MinnaLearn', status: 'geplant', label: 'in progress', url: 'https://www.elementsofai.com' },
];

export const languages = [
  { lang: 'Russian', level: 'Muttersprache', label: 'native' },
  { lang: 'Ukrainian', level: 'fließend', label: 'fluent' },
  { lang: 'German', level: 'fließend', label: 'fluent' },
  { lang: 'English', level: 'gut', label: 'good' },
];

export const interests = [
  { what: 'Sport & healthy lifestyle', detail: 'strength training for about 4 years' },
  { what: 'Coding with AI', detail: 'Claude, Codex, Antigravity and more' },
  { what: 'IT & creative projects', detail: 'coding, video and photo editing' },
  { what: 'Photography', detail: 'camera settings, composition (Sony α7 III)' },
];

export const skills = [
  { group: 'Graphics & 3D', items: [ { what: 'Photoshop', level: 'gut', label: 'good' }, { what: 'Blender', level: 'Grundlagen', label: 'basics' }, { what: 'DaVinci Resolve, CapCut', level: 'gut', label: 'good' } ] },
  { group: 'MS Office', items: [ { what: 'Excel', level: 'gut', label: 'good' }, { what: 'Word', level: 'gut', label: 'good' }, { what: 'PowerPoint', level: 'fortgeschritten', label: 'advanced' } ] },
  { group: 'Code & AI', items: [ { what: 'Claude Code, Codex, Antigravity', level: 'im Alltag', label: 'daily use' }, { what: 'Python', level: 'Grundlagen', label: 'basics' }, { what: 'Java (Minecraft plugins)', level: 'Grundlagen', label: 'basics' } ] },
];

export const contact = {
  email: 'felikskolomoiets@gmail.com', instagram: 'areyoufelya',
  phone: '+49 175 8726895',      // auch WhatsApp (gleiche Nummer)
  telegram: ['areyoufelya', 'gotprosperity'],   // beide Namen gehen
  github: 'vFeLyAv',             // github.com/vFeLyAv (Felix, 13.11.2026)
};
