// Feste Texte der Seite (die Inhalte selbst kommen aus /shared/data*.js)
import * as de from '/shared/data.js';
import * as en from '/shared/data.en.js';
import * as ru from '/shared/data.ru.js';

export const DATA = { de, en, ru };
export const LANGS = ['de', 'en', 'ru'];

export const UI = {
  de: {
    nav: { about: 'Über mich', projects: 'Projekte', certs: 'Zertifikate', cv: 'Lebenslauf', contact: 'Kontakt' },
    langLabel: 'Sprache',
    script: 'Freunde sagen Felya',
    city1: 'Dnipro', city2: 'Regensburg',
    heroAlt: 'Felix in brauner Schaffelljacke auf dem Weihnachtsmarkt, die Hände hinter dem Kopf',
    insetAlt: 'Felix in hellem Anzug mit Fliege, Nahaufnahme',
    aboutAlt: 'Felix in hellem Strickpullover und Cap',
    facts: 'Fun Facts',
    visit: 'bunprise.de öffnen',
    inProgress: 'In Arbeit',
    issued: 'ausgestellt am',
    verify: 'Echtheit prüfen',
    pdf: 'PDF ansehen',
    course: 'Zum Kurs',
    school: 'Schule', practice: 'Praxis', skills: 'Kenntnisse', languages: 'Sprachen', documents: 'Dokumente',
    email: 'E-Mail', copy: 'Kopieren', copied: 'Kopiert', copyFail: 'Bitte die Adresse markieren und kopieren',
    top: 'Nach oben',
  },
  en: {
    nav: { about: 'About me', projects: 'Projects', certs: 'Certificates', cv: 'CV', contact: 'Contact' },
    langLabel: 'Language',
    script: 'my friends call me Felya',
    city1: 'Dnipro', city2: 'Regensburg',
    heroAlt: 'Felix in a brown sheepskin jacket at a Christmas market, hands behind his head',
    insetAlt: 'Felix in a light suit and bow tie, close-up',
    aboutAlt: 'Felix in a light knit sweater and cap',
    facts: 'Fun facts',
    visit: 'Open bunprise.de',
    inProgress: 'In progress',
    issued: 'issued on',
    verify: 'Verify certificate',
    pdf: 'View PDF',
    course: 'Go to course',
    school: 'School', practice: 'Practical experience', skills: 'Skills', languages: 'Languages', documents: 'Documents',
    email: 'Email', copy: 'Copy', copied: 'Copied', copyFail: 'Please select the address and copy it',
    top: 'Back to top',
  },
  ru: {
    nav: { about: 'Обо мне', projects: 'Проекты', certs: 'Сертификаты', cv: 'Резюме', contact: 'Контакты' },
    langLabel: 'Язык',
    script: 'друзья зовут меня Феля',
    city1: 'Днепр', city2: 'Регенсбург',
    heroAlt: 'Феликс в коричневой дублёнке на рождественской ярмарке, руки за головой',
    insetAlt: 'Феликс в светлом костюме с бабочкой, крупный план',
    aboutAlt: 'Феликс в светлом вязаном свитере и кепке',
    facts: 'Интересные факты',
    visit: 'Открыть bunprise.de',
    inProgress: 'В процессе',
    issued: 'выдан',
    verify: 'Проверить подлинность',
    pdf: 'Открыть PDF',
    course: 'К курсу',
    school: 'Школа', practice: 'Практика', skills: 'Навыки', languages: 'Языки', documents: 'Документы',
    email: 'E-mail', copy: 'Копировать', copied: 'Скопировано', copyFail: 'Выделите адрес и скопируйте его',
    top: 'Наверх',
  },
};

export function pickLang() {
  try {
    const q = new URL(location.href).searchParams.get('lang');
    if (LANGS.includes(q)) return q;
  } catch { /* egal */ }
  try {
    const s = localStorage.getItem('lang');
    if (LANGS.includes(s)) return s;
  } catch { /* egal */ }
  return 'de';
}

export function saveLang(l) {
  try { localStorage.setItem('lang', l); } catch { /* egal */ }
  try {
    const u = new URL(location.href);
    if (u.searchParams.has('lang')) { u.searchParams.set('lang', l); history.replaceState(null, '', u); }
  } catch { /* egal */ }
}

// "nav.about" -> UI[l].nav.about
export function t(l, key) {
  return key.split('.').reduce((o, k) => (o ? o[k] : undefined), UI[l]) ?? key;
}
