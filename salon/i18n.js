// Feste Texte der Seite. Die Inhalte (Fakten) kommen nur aus /shared/data*.js, Projekt-Extras aus ./works.js.
import * as de from '/shared/data.js';
import * as en from '/shared/data.en.js';
import * as ru from '/shared/data.ru.js';

export const DATA = { de, en, ru };
export const LANGS = ['de', 'en', 'ru'];

export const UI = {
  de: {
    docTitle: 'Feliks Kolomoiets — Portfolio',
    metaDesc: 'Feliks Kolomoiets, Regensburg: Über mich, Projekte, Zertifikate, Lebenslauf und Kontakt.',
    skip: 'Zum Inhalt springen',
    nameBtn: 'Name so zeigen, wie er gesprochen wird: Felix',
    newTab: '(öffnet in neuem Tab)',
    ticketWord: 'Eintritt',
    langGroup: 'Sprache wählen',
    langName: { de: 'Deutsch', en: 'English', ru: 'Русский' },
    room: 'Saal',
    rooms: { about: 'Über mich', projects: 'Projekte', certs: 'Zertifikate', cv: 'Lebenslauf', contact: 'Kontakt' },
    facts: 'Fun Facts',
    open: 'Näher ansehen',
    close: 'Zurück zur Wand',
    photo: 'Fotografie',
    works: {
      suit: 'Im roten Salon',
      night: 'Bei Nacht',
      nightMeta: 'Fotografie, München',
      balloons: 'Im gelben Raum',
    },
    visit: 'bunprise.de besuchen',
    earned: 'erhalten am',
    inProgress: 'in Arbeit',
    verify: 'Echtheit prüfen',
    pdf: 'PDF ansehen',
    course: 'Zum Kurs',
    emptyFrame: 'Dieser Rahmen wartet noch.',
    school: 'Schule', practice: 'Praxis', skills: 'Kenntnisse', languages: 'Sprachen', interests: 'Interessen', documents: 'Dokumente',
    guestbook: 'Gästebuch',
    guestLine: 'Danke für den Besuch. Schreib mir gern ein paar Zeilen.',
    email: 'E-Mail', copy: 'Adresse kopieren', copied: 'Kopiert', copyFail: 'Bitte die Adresse markieren und kopieren',
    instagram: 'Instagram', phone: 'Telefon',
    exit: 'Ausgang',
    toTop: 'Zurück zum Eingang',
    foot: 'Feliks Kolomoiets, Regensburg 2026',
    // Plattenspieler
    putOn: (t) => `Platte „${t}“ auflegen`,  putBack: (t) => `Platte „${t}“ zurück in die Hülle legen`,
    deck: 'Schallplatte: Musik an oder aus. Ziehen: scratchen. Pfeiltasten: vor- und zurückdrehen.',
    music: 'Musik',
    // Design-Studien
    studies: 'Vom Poster zur Website',
    studiesLead: 'Für diese Seite habe ich viele Stile ausprobiert. Vorlage war jeweils ein Poster, das mir gefällt: Schrift, Farben und Stimmung habe ich übernommen, Inhalt und Fotos sind von mir. Gebaut mit Claude und Codex.',
    poster: 'Vorlage',
    posterFrom: (t) => `Poster „${t}“, gefunden auf Pinterest`,
    noPoster: 'Ohne Vorlage',
    website: 'Website',
    live: 'Live ansehen', pin: 'Original auf Pinterest',
    here: 'Du bist gerade hier',
  },
  en: {
    docTitle: 'Feliks Kolomoiets — Portfolio',
    metaDesc: 'Feliks Kolomoiets, Regensburg: about me, projects, certificates, CV and contact.',
    skip: 'Skip to content',
    nameBtn: 'Show the name the way it is pronounced: Felix',
    newTab: '(opens in a new tab)',
    ticketWord: 'Admit one',
    langGroup: 'Choose language',
    langName: { de: 'Deutsch', en: 'English', ru: 'Русский' },
    room: 'Room',
    rooms: { about: 'About me', projects: 'Projects', certs: 'Certificates', cv: 'CV', contact: 'Contact' },
    facts: 'Fun facts',
    open: 'Take a closer look',
    close: 'Back to the wall',
    photo: 'Photograph',
    works: {
      suit: 'In the red salon',
      night: 'At night',
      nightMeta: 'Photograph, Munich',
      balloons: 'In the yellow room',
    },
    visit: 'Visit bunprise.de',
    earned: 'earned on',
    inProgress: 'in progress',
    verify: 'Verify certificate',
    pdf: 'View PDF',
    course: 'Go to course',
    emptyFrame: 'This frame is still waiting.',
    school: 'School', practice: 'Practical experience', skills: 'Skills', languages: 'Languages', interests: 'Interests', documents: 'Documents',
    guestbook: 'Guest book',
    guestLine: 'Thanks for visiting. Feel free to write me a few lines.',
    email: 'E-mail', copy: 'Copy address', copied: 'Copied', copyFail: 'Please select the address and copy it',
    instagram: 'Instagram', phone: 'Phone',
    exit: 'Exit',
    toTop: 'Back to the entrance',
    foot: 'Feliks Kolomoiets, Regensburg 2026',
    putOn: (t) => `Put on the record “${t}”`, putBack: (t) => `Put the record “${t}” back in its sleeve`,
    deck: 'Record: music on or off. Drag to scratch. Arrow keys: spin back and forth.',
    music: 'Music',
    studies: 'From poster to website',
    studiesLead: 'I tried out many styles for this site. Each one started from a poster I like: I took the type, colours and mood, while the content and photos are mine. Built with Claude and Codex.',
    poster: 'Model',
    posterFrom: (t) => `Poster “${t}”, found on Pinterest`,
    noPoster: 'No model',
    website: 'Website',
    live: 'View live', pin: 'Original on Pinterest',
    here: 'You are here',
  },
  ru: {
    docTitle: 'Feliks Kolomoiets — портфолио',
    metaDesc: 'Феликс Коломоец, Регенсбург: обо мне, проекты, сертификаты, резюме и контакты.',
    skip: 'Перейти к содержанию',
    nameBtn: 'Показать имя так, как оно произносится: Felix',
    newTab: '(откроется в новой вкладке)',
    ticketWord: 'Вход',
    langGroup: 'Выбрать язык',
    langName: { de: 'Deutsch', en: 'English', ru: 'Русский' },
    room: 'Зал',
    rooms: { about: 'Обо мне', projects: 'Проекты', certs: 'Сертификаты', cv: 'Резюме', contact: 'Контакты' },
    facts: 'Факты обо мне',
    open: 'Рассмотреть ближе',
    close: 'Назад к стене',
    photo: 'Фотография',
    works: {
      suit: 'В красном салоне',
      night: 'Ночью',
      nightMeta: 'Фотография, Мюнхен',
      balloons: 'В жёлтой комнате',
    },
    visit: 'Открыть bunprise.de',
    earned: 'получен',
    inProgress: 'в процессе',
    verify: 'Проверить подлинность',
    pdf: 'Открыть PDF',
    course: 'К курсу',
    emptyFrame: 'Эта рама ещё ждёт.',
    school: 'Школа', practice: 'Практика', skills: 'Навыки', languages: 'Языки', interests: 'Интересы', documents: 'Документы',
    guestbook: 'Гостевая книга',
    guestLine: 'Спасибо за визит. Напиши мне пару строк.',
    email: 'E-mail', copy: 'Скопировать адрес', copied: 'Скопировано', copyFail: 'Выдели адрес и скопируй его',
    instagram: 'Instagram', phone: 'Телефон',
    exit: 'Выход',
    toTop: 'Назад ко входу',
    foot: 'Feliks Kolomoiets, Регенсбург 2026',
    putOn: (t) => `Поставить пластинку «${t}»`, putBack: (t) => `Убрать пластинку «${t}» обратно в конверт`,
    deck: 'Пластинка: включить или выключить музыку. Тянуть: скретч. Стрелки: крутить вперёд и назад.',
    music: 'Музыка',
    studies: 'От постера к сайту',
    studiesLead: 'Для этого сайта я попробовал много стилей. Каждый начинался с постера, который мне нравится: шрифт, цвета и настроение взяты оттуда, а содержание и фото мои. Сделано с Claude и Codex.',
    poster: 'Образец',
    posterFrom: (t) => `Постер «${t}», найден на Pinterest`,
    noPoster: 'Без образца',
    website: 'Сайт',
    live: 'Открыть вживую', pin: 'Оригинал на Pinterest',
    here: 'Ты сейчас здесь',
  },
};

// Wahl der Sprache: ?lang=… > gespeicherte Wahl > Browsersprache (Deutsch → de, Russisch/Ukrainisch → ru, sonst Englisch)
export function pickLang() {
  const q = new URLSearchParams(location.search).get('lang');
  if (q && LANGS.includes(q)) return q;
  try {
    const s = localStorage.getItem('felix-lang');
    if (s && LANGS.includes(s)) return s;
  } catch { /* privat */ }
  const nav = (navigator.language || 'de').toLowerCase();
  return nav.startsWith('de') ? 'de' : nav.startsWith('ru') || nav.startsWith('uk') ? 'ru' : 'en';
}

export function saveLang(l) {
  try { localStorage.setItem('felix-lang', l); } catch { /* privat */ }
}
