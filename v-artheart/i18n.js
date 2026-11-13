// Feste Texte der Seite. Die Inhalte (Fakten) kommen nur aus /shared/data*.js.
import * as de from '/shared/data.js';
import * as en from '/shared/data.en.js';
import * as ru from '/shared/data.ru.js';

export const DATA = { de, en, ru };
export const LANGS = ['de', 'en', 'ru'];

export const UI = {
  de: {
    docTitle: 'Feliks Kolomoiets — Salon',
    tagline: 'Ein Salon in Regensburg',
    ticketCode: 'FK RGB 2026',
    admission: 'Eintritt frei',
    langGroup: 'Sprache wählen',
    langName: { de: 'Deutsch', en: 'English', ru: 'Русский' },
    room: 'Saal',
    rooms: { about: 'Über mich', projects: 'Projekte', certs: 'Zertifikate', cv: 'Lebenslauf', contact: 'Kontakt' },
    facts: 'Fun Facts',
    open: 'Näher ansehen',
    close: 'Zurück zur Wand',
    photo: 'Fotografie',
    works: {
      suit: 'Im hellen Anzug',
      night: 'Bei Nacht',
      nightMeta: 'Fotografie, Regensburg',
      balloons: 'Im gelben Raum',
      market: 'Auf dem Weihnachtsmarkt',
    },
    mat: {
      bunprise: 'Web-App, Claude & Codex',
      site: 'Tiefenkarte, Depth Anything V2',
      mc: 'Blender-Render, Photoshop',
    },
    visit: 'bunprise.de besuchen',
    earned: 'erhalten am',
    inProgress: 'in Arbeit',
    verify: 'Echtheit prüfen',
    pdf: 'PDF ansehen',
    course: 'Zum Kurs',
    emptyFrame: 'Dieser Rahmen wartet noch.',
    school: 'Schule', practice: 'Praxis', skills: 'Kenntnisse', languages: 'Sprachen', interests: 'Interessen', documents: 'Dokumente',
    levelOf: 'Stufe',
    guestbook: 'Gästebuch',
    guestLine: 'Danke für den Besuch. Schreib mir gern ein paar Zeilen.',
    email: 'E-Mail', copy: 'Adresse kopieren', copied: 'Kopiert', copyFail: 'Bitte die Adresse markieren und kopieren',
    instagram: 'Instagram',
    exit: 'Ausgang',
    toTop: 'Zurück zum Eingang',
  },
  en: {
    docTitle: 'Feliks Kolomoiets — Salon',
    tagline: 'A salon in Regensburg',
    ticketCode: 'FK RGB 2026',
    admission: 'Free admission',
    langGroup: 'Choose language',
    langName: { de: 'Deutsch', en: 'English', ru: 'Русский' },
    room: 'Room',
    rooms: { about: 'About me', projects: 'Projects', certs: 'Certificates', cv: 'CV', contact: 'Contact' },
    facts: 'Fun facts',
    open: 'Take a closer look',
    close: 'Back to the wall',
    photo: 'Photograph',
    works: {
      suit: 'In the light suit',
      night: 'At night',
      nightMeta: 'Photograph, Regensburg',
      balloons: 'In the yellow room',
      market: 'At the Christmas market',
    },
    mat: {
      bunprise: 'Web app, Claude & Codex',
      site: 'Depth map, Depth Anything V2',
      mc: 'Blender render, Photoshop',
    },
    visit: 'Visit bunprise.de',
    earned: 'earned on',
    inProgress: 'in progress',
    verify: 'Verify certificate',
    pdf: 'View PDF',
    course: 'Go to course',
    emptyFrame: 'This frame is still waiting.',
    school: 'School', practice: 'Practical experience', skills: 'Skills', languages: 'Languages', interests: 'Interests', documents: 'Documents',
    levelOf: 'Level',
    guestbook: 'Guest book',
    guestLine: 'Thanks for visiting. Feel free to write me a few lines.',
    email: 'E-mail', copy: 'Copy address', copied: 'Copied', copyFail: 'Please select the address and copy it',
    instagram: 'Instagram',
    exit: 'Exit',
    toTop: 'Back to the entrance',
  },
  ru: {
    docTitle: 'Feliks Kolomoiets — салон',
    tagline: 'Салон в Регенсбурге',
    ticketCode: 'FK RGB 2026',
    admission: 'Вход свободный',
    langGroup: 'Выбрать язык',
    langName: { de: 'Deutsch', en: 'English', ru: 'Русский' },
    room: 'Зал',
    rooms: { about: 'Обо мне', projects: 'Проекты', certs: 'Сертификаты', cv: 'Резюме', contact: 'Контакты' },
    facts: 'Факты обо мне',
    open: 'Рассмотреть ближе',
    close: 'Назад к стене',
    photo: 'Фотография',
    works: {
      suit: 'В светлом костюме',
      night: 'Ночью',
      nightMeta: 'Фотография, Регенсбург',
      balloons: 'В жёлтой комнате',
      market: 'На рождественской ярмарке',
    },
    mat: {
      bunprise: 'веб-приложение, Claude и Codex',
      site: 'карта глубины, Depth Anything V2',
      mc: 'рендер в Blender, Photoshop',
    },
    visit: 'Открыть bunprise.de',
    earned: 'получен',
    inProgress: 'в процессе',
    verify: 'Проверить подлинность',
    pdf: 'Открыть PDF',
    course: 'К курсу',
    emptyFrame: 'Эта рама ещё ждёт.',
    school: 'Школа', practice: 'Практика', skills: 'Навыки', languages: 'Языки', interests: 'Интересы', documents: 'Документы',
    levelOf: 'Уровень',
    guestbook: 'Гостевая книга',
    guestLine: 'Спасибо за визит. Напиши мне пару строк.',
    email: 'E-mail', copy: 'Скопировать адрес', copied: 'Скопировано', copyFail: 'Выдели адрес и скопируй его',
    instagram: 'Instagram',
    exit: 'Выход',
    toTop: 'Назад ко входу',
  },
};

export function pickLang() {
  const q = new URLSearchParams(location.search).get('lang');
  if (q && LANGS.includes(q)) return q;
  try {
    const s = localStorage.getItem('felix-lang');
    if (s && LANGS.includes(s)) return s;
  } catch { /* privat */ }
  return 'de';
}

export function saveLang(l) {
  try { localStorage.setItem('felix-lang', l); } catch { /* privat */ }
}
