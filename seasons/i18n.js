// Sprachen der Seite: Deutsch (Standard), Englisch und Russisch.
// Inhalte (Lebenslauf, Projekte …) kommen aus /shared/data.js, data.en.js bzw. data.ru.js (gleiche Struktur).
// Alle festen Texte der Oberfläche (Überschriften, Knöpfe, Meldungen, Vorlesetexte) stehen hier in STR.
// Wahl der Sprache: ?lang=… in der Adresse > gespeicherte Wahl > Browsersprache
// (Deutsch → de, Russisch oder Ukrainisch → ru, sonst Englisch).
import * as de from '/shared/data.js';
import * as en from '/shared/data.en.js';
import * as ru from '/shared/data.ru.js';

export const DATA = { de, en, ru };
export const LANGS = ['de', 'en', 'ru'];
export const LANG_KEY = 'seasons-lang';

export function initialLang() {
  try {
    const q = new URLSearchParams(location.search).get('lang');
    if (LANGS.includes(q)) return q;
    const saved = localStorage.getItem(LANG_KEY);
    if (LANGS.includes(saved)) return saved;
  } catch { /* privater Modus */ }
  const nav = (navigator.language || 'de').toLowerCase();
  return nav.startsWith('de') ? 'de' : nav.startsWith('ru') || nav.startsWith('uk') ? 'ru' : 'en';
}
export function saveLang(l) { try { localStorage.setItem(LANG_KEY, l); } catch { /* egal */ } }

const newTab = { de: '(öffnet in neuem Tab)', en: '(opens in a new tab)' };

export const STR = {
  de: {
    htmlLang: 'de',
    metaDesc: 'Portfolio und Lebenslauf von Feliks Kolomoiets, Regensburg.',
    skip: 'Zum Inhalt springen',
    langGroup: 'Sprache',
    ueber: 'Über mich', projekte: 'Projekte', zert: 'Zertifikate', cv: 'Lebenslauf', kontakt: 'Kontakt',
    music: 'Musik',
    nameBtn: 'Name so zeigen, wie er gesprochen wird: Felix',
    aboutLead: (first, city) => `Ich bin ${first} und lebe in ${city}.`,
    factsTitle: 'Wusstest du?', factPrev: 'Vorheriger Fakt', factNext: 'Noch einer',
    open: (t) => `${t} öffnen`, newTab: newTab.de,
    projAlt: {
      '/img/bunprise-og.png': 'Vorschaubild von Bunprise: ein Hase und der Satz „Pläne und Wünsche an einem Ort“',
      '/img/depth.png': 'Tiefenkarte eines Porträtfotos: hell ist nah, dunkel ist weit weg',
      '/img/render-yellow.jpg': 'In Blender gerenderte Minecraft-Figur auf einem Skateboard vor gelbem Hintergrund',
    },
    certsLead: (n) => (n === 1 ? 'Ein Zertifikat ist fertig, die anderen Kurse mache ich gerade.'
      : n > 1 ? `${n} Zertifikate sind fertig, die anderen Kurse mache ich gerade.` : 'Diese Kurse mache ich gerade.'),
    status: { erhalten: 'erhalten', geplant: 'in Arbeit', folgt: 'folgt' },
    toCourse: 'Zum Kurs', verify: 'Echtheit prüfen', pdfView: 'PDF ansehen',
    certOpen: (t) => `Zertifikat „${t}“ öffnen`, certBig: (t) => `Zertifikat „${t}“ groß ansehen`,
    lbFlip: 'Umdrehen', lbClose: 'Schließen', lbIssuer: 'Aussteller', lbIssued: 'Ausgestellt am', lbFor: 'Für',
    lbAlt: (t, by, name) => `Abzeichen „${t}“ von ${by}, ausgestellt für ${name}`,
    // Lebenslauf
    weg: 'Werdegang', skills: 'Kenntnisse', langs: 'Sprachen', certs: 'Zertifikate', interests: 'Interessen', docs: 'Dokumente',
    kindSchool: 'Schule', kindPractice: 'Praxis', goal: 'Ziel', goalWhat: (y) => `Fachabitur ${y}`,
    regionA: 'Ukraine', since: (y) => `seit ${y}`, docPreview: 'Vorschau',
    grewUp: (text) => (text.match(/Aufgewachsen bin ich in ([^,.]+)/) || [])[1] || '',
    moved: (text) => { const m = text.match(/seit (\d{4}) lebe ich in ([A-ZÄÖÜ][\wäöüß-]+)/); return m ? { year: +m[1], place: m[2] } : null; },
    // Kontakt
    mailLead: 'Am einfachsten per E-Mail.', noMail: 'Meine Kontaktdaten stehen im Lebenslauf.',
    copy: 'Kopieren', copied: 'Kopiert', copySr: ': E-Mail-Adresse', copyToast: 'E-Mail-Adresse kopiert.',
    copyFail: 'Kopieren ging nicht. Bitte die Adresse markieren und kopieren.',
    flip: 'Postkarte umdrehen',
    deck: 'Schallplatte: Musik an oder aus. Ziehen: scratchen. Pfeiltasten: vor- und zurückdrehen.',
  },
  en: {
    htmlLang: 'en',
    metaDesc: 'Portfolio and CV of Feliks Kolomoiets, Regensburg.',
    skip: 'Skip to content',
    langGroup: 'Language',
    ueber: 'About me', projekte: 'Projects', zert: 'Certificates', cv: 'CV', kontakt: 'Contact',
    music: 'Music',
    nameBtn: 'Show the name the way it is pronounced: Felix',
    aboutLead: (first, city) => `I'm ${first} and I live in ${city}.`,
    factsTitle: 'Did you know?', factPrev: 'Previous fact', factNext: 'Another one',
    open: (t) => `Open ${t}`, newTab: newTab.en,
    projAlt: {
      '/img/bunprise-og.png': 'Bunprise preview image: a rabbit and the line “Plans and wishes in one place”',
      '/img/depth.png': 'Depth map of a portrait photo: bright is near, dark is far away',
      '/img/render-yellow.jpg': 'Minecraft character on a skateboard, rendered in Blender, on a yellow background',
    },
    certsLead: (n) => (n === 1 ? 'One certificate is done, I’m working on the other courses right now.'
      : n > 1 ? `${n} certificates are done, I’m working on the other courses right now.` : 'I’m taking these courses right now.'),
    status: { erhalten: 'earned', geplant: 'in progress', folgt: 'coming soon' },
    toCourse: 'Go to course', verify: 'Verify', pdfView: 'View PDF',
    certOpen: (t) => `Open certificate “${t}”`, certBig: (t) => `View certificate “${t}” large`,
    lbFlip: 'Flip', lbClose: 'Close', lbIssuer: 'Issued by', lbIssued: 'Issued on', lbFor: 'For',
    lbAlt: (t, by, name) => `Badge “${t}” from ${by}, issued to ${name}`,
    weg: 'Journey', skills: 'Skills', langs: 'Languages', certs: 'Certificates', interests: 'Interests', docs: 'Documents',
    kindSchool: 'School', kindPractice: 'Practice', goal: 'Goal', goalWhat: (y) => `Fachabitur ${y}`,
    regionA: 'Ukraine', since: (y) => `since ${y}`, docPreview: 'Preview',
    grewUp: (text) => (text.match(/grew up in ([^,.]+?)(?:,|\.)/) || [])[1] || '',
    moved: (text) => { const m = text.match(/living in ([A-Z][\w-]+) since (\d{4})/); return m ? { year: +m[2], place: m[1] } : null; },
    mailLead: 'Email is the easiest way.', noMail: 'My contact details are in my CV.',
    copy: 'Copy', copied: 'Copied', copySr: ': email address', copyToast: 'Email address copied.',
    copyFail: 'Copying didn’t work. Please select the address and copy it.',
    flip: 'Flip the postcard',
    deck: 'Record: music on or off. Drag to scratch. Arrow keys: spin back and forth.',
  },
  ru: {
    htmlLang: 'ru',
    metaDesc: 'Портфолио и резюме Феликса Коломойца, Регенсбург.',
    skip: 'Перейти к содержанию',
    langGroup: 'Язык',
    ueber: 'Обо мне', projekte: 'Проекты', zert: 'Сертификаты', cv: 'Резюме', kontakt: 'Контакты',
    music: 'Музыка',
    nameBtn: 'Показать имя так, как оно произносится: Felix',
    aboutLead: (first, city) => `Я ${first === 'Feliks' ? 'Феликс' : first}, живу в ${city}е.`,
    factsTitle: 'А ты знал?', factPrev: 'Предыдущий факт', factNext: 'Ещё один',
    open: (t) => `Открыть ${t}`, newTab: '(откроется в новой вкладке)',
    projAlt: {
      '/img/bunprise-og.png': 'Превью Bunprise: кролик и фраза «Планы и желания в одном месте»',
      '/img/depth.png': 'Карта глубины портретного фото: светлое — близко, тёмное — далеко',
      '/img/render-yellow.jpg': 'Персонаж Minecraft на скейтборде, отрендеренный в Blender, на жёлтом фоне',
    },
    certsLead: (n) => (n === 1 ? 'Один сертификат уже получен, остальные курсы я прохожу сейчас.'
      : n > 1 ? `Получено сертификатов: ${n}. Остальные курсы я прохожу сейчас.` : 'Эти курсы я прохожу сейчас.'),
    status: { erhalten: 'получен', geplant: 'в процессе', folgt: 'скоро' },
    toCourse: 'К курсу', verify: 'Проверить подлинность', pdfView: 'Открыть PDF',
    certOpen: (t) => `Открыть сертификат «${t}»`, certBig: (t) => `Посмотреть сертификат «${t}» крупно`,
    lbFlip: 'Перевернуть', lbClose: 'Закрыть', lbIssuer: 'Выдан', lbIssued: 'Дата выдачи', lbFor: 'Кому',
    lbAlt: (t, by, name) => `Значок «${t}» от ${by}, выдан ${name}`,
    weg: 'Путь', skills: 'Навыки', langs: 'Языки', certs: 'Сертификаты', interests: 'Интересы', docs: 'Документы',
    kindSchool: 'Школа', kindPractice: 'Практика', goal: 'Цель', goalWhat: (y) => `Fachabitur ${y}`,
    regionA: 'Украина', since: (y) => `с ${y}`, docPreview: 'Превью',
    // из «вырос в Запорожье и Днепре» / «живу в Баварии» – для подписи над линией в именительном падеже
    grewUp: (text) => ((text.match(/вырос в ([^,.]+)/) || [])[1] || '').replace(/Днепре\b/, 'Днепр'),
    moved: (text) => { const m = text.match(/с (\d{4}) года живу в ([А-ЯЁ][а-яё-]+)/); return m ? { year: +m[1], place: m[2].replace(/ии$/, 'ия') } : null; },
    mailLead: 'Проще всего написать на почту.', noMail: 'Мои контакты есть в резюме.',
    copy: 'Копировать', copied: 'Скопировано', copySr: ': адрес почты', copyToast: 'Адрес почты скопирован.',
    copyFail: 'Не получилось скопировать. Выдели адрес и скопируй его вручную.',
    flip: 'Перевернуть открытку',
    deck: 'Пластинка: включить или выключить музыку. Потянуть — скретч. Стрелки — крутить вперёд и назад.',
  },
};
