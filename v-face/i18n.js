// Feste Texte der Oberfläche in drei Sprachen. Inhalte kommen aus /shared/data*.js.
import * as de from '/shared/data.js';
import * as en from '/shared/data.en.js';
import * as ru from '/shared/data.ru.js';

export const DATA = { de, en, ru };
export const LANGS = ['de', 'en', 'ru'];
const KEY = 'v-face-lang';

// Reihenfolge: ?lang=… > gespeicherte Wahl > Browsersprache
export function initialLang() {
  try {
    const q = new URLSearchParams(location.search).get('lang');
    if (LANGS.includes(q)) return q;
    const saved = localStorage.getItem(KEY);
    if (LANGS.includes(saved)) return saved;
  } catch { /* privater Modus */ }
  const nav = (navigator.language || 'de').toLowerCase();
  return nav.startsWith('de') ? 'de' : (nav.startsWith('ru') || nav.startsWith('uk')) ? 'ru' : 'en';
}
export function saveLang(l) { try { localStorage.setItem(KEY, l); } catch { /* egal */ } }

export const STR = {
  de: {
    title: 'Feliks Kolomoiets – Portfolio und Lebenslauf',
    desc: 'Portfolio und Lebenslauf von Feliks Kolomoiets, Regensburg.',
    skip: 'Zum Inhalt springen',
    langGroup: 'Sprache wählen',
    langNames: { de: 'Deutsch', en: 'Englisch', ru: 'Russisch' },
    faceAlt: 'Collage-Karikatur von Felix: sein Gesicht in Stücke geschnitten, ein Auge stark vergrößert, die Lippen größer, mit neongrünen Kritzeleien. Mit Maus oder Finger lassen sich die Stücke verschieben.',
    h: { about: 'über mich', projects: 'projekte', certs: 'zertifikate', cv: 'lebenslauf', contact: 'kontakt' },
    factsTitle: 'Ein paar Dinge über mich',
    aboutAlt: 'Felix auf dem Weihnachtsmarkt in Schaffelljacke, Hände hinter dem Kopf, lächelnd',
    projAlt: {
      '/img/bunprise-og.png': 'Vorschaubild von Bunprise: ein Hase und der Satz „Pläne und Wünsche an einem Ort“',
      '/img/depth.png': 'Tiefenkarte eines Porträtfotos: hell ist nah, dunkel ist weit weg',
      '/img/render-yellow.jpg': 'In Blender gerenderte Minecraft-Figur auf einem Skateboard vor gelbem Hintergrund',
    },
    visit: (host) => `${host} öffnen`,
    newTab: '(öffnet in neuem Tab)',
    earned: 'Erhalten am', verify: 'Echtheit prüfen', pdf: 'PDF ansehen',
    inProgress: 'in Arbeit', toCourse: 'Zum Kurs',
    certAlt: (t) => `Zertifikat „${t}“`,
    school: 'Schule', practice: 'Praxis', skills: 'Kenntnisse', langs: 'Sprachen', docs: 'Dokumente',
    levelOf: (l) => ({ Grundlagen: 'Stufe 1 von 3', gut: 'Stufe 2 von 3', fortgeschritten: 'Stufe 3 von 3' }[l] || ''),
    status: { folgt: 'folgt' },
    mailLead: 'Am einfachsten per E-Mail.',
    insta: 'Instagram',
    copy: 'Kopieren', copied: 'Kopiert', copyLabel: 'E-Mail-Adresse kopieren',
    copyDone: 'E-Mail-Adresse kopiert.', copyFail: 'Kopieren ging nicht. Bitte die Adresse markieren und kopieren.',
  },
  en: {
    title: 'Feliks Kolomoiets – portfolio and CV',
    desc: 'Portfolio and CV of Feliks Kolomoiets, Regensburg.',
    skip: 'Skip to content',
    langGroup: 'Choose language',
    langNames: { de: 'German', en: 'English', ru: 'Russian' },
    faceAlt: 'Collage caricature of Felix: his face cut into pieces, one eye greatly enlarged, bigger lips, with neon green scribbles. Move the pieces with your mouse or finger.',
    h: { about: 'about me', projects: 'projects', certs: 'certificates', cv: 'cv', contact: 'contact' },
    factsTitle: 'A few things about me',
    aboutAlt: 'Felix at a Christmas market in a sheepskin jacket, hands behind his head, smiling',
    projAlt: {
      '/img/bunprise-og.png': 'Bunprise preview image: a rabbit and the line “Plans and wishes in one place”',
      '/img/depth.png': 'Depth map of a portrait photo: bright is near, dark is far away',
      '/img/render-yellow.jpg': 'Minecraft character on a skateboard, rendered in Blender, on a yellow background',
    },
    visit: (host) => `Open ${host}`,
    newTab: '(opens in a new tab)',
    earned: 'Earned on', verify: 'Verify', pdf: 'View PDF',
    inProgress: 'in progress', toCourse: 'Go to course',
    certAlt: (t) => `Certificate “${t}”`,
    school: 'School', practice: 'Practical experience', skills: 'Skills', langs: 'Languages', docs: 'Documents',
    levelOf: (l) => ({ Grundlagen: 'level 1 of 3', gut: 'level 2 of 3', fortgeschritten: 'level 3 of 3' }[l] || ''),
    status: { folgt: 'coming soon' },
    mailLead: 'Email is the easiest way to reach me.',
    insta: 'Instagram',
    copy: 'Copy', copied: 'Copied', copyLabel: 'Copy email address',
    copyDone: 'Email address copied.', copyFail: 'Copying did not work. Please select the address and copy it.',
  },
  ru: {
    title: 'Feliks Kolomoiets – портфолио и резюме',
    desc: 'Портфолио и резюме Феликса Коломойца, Регенсбург.',
    skip: 'Перейти к содержанию',
    langGroup: 'Выбрать язык',
    langNames: { de: 'Немецкий', en: 'Английский', ru: 'Русский' },
    faceAlt: 'Коллаж-карикатура Феликса: лицо разрезано на куски, один глаз сильно увеличен, губы больше, неоново-зелёные каракули. Куски можно двигать мышью или пальцем.',
    h: { about: 'обо мне', projects: 'проекты', certs: 'сертификаты', cv: 'резюме', contact: 'контакты' },
    factsTitle: 'Немного обо мне',
    aboutAlt: 'Феликс на рождественской ярмарке в дублёнке, руки за головой, улыбается',
    projAlt: {
      '/img/bunprise-og.png': 'Превью Bunprise: кролик и фраза «Планы и желания в одном месте»',
      '/img/depth.png': 'Карта глубины портретного фото: светлое — близко, тёмное — далеко',
      '/img/render-yellow.jpg': 'Персонаж Minecraft на скейтборде, отрендеренный в Blender, на жёлтом фоне',
    },
    visit: (host) => `Открыть ${host}`,
    newTab: '(откроется в новой вкладке)',
    earned: 'Получен', verify: 'Проверить подлинность', pdf: 'Открыть PDF',
    inProgress: 'в процессе', toCourse: 'К курсу',
    certAlt: (t) => `Сертификат «${t}»`,
    school: 'Школа', practice: 'Практика', skills: 'Навыки', langs: 'Языки', docs: 'Документы',
    levelOf: (l) => ({ Grundlagen: 'уровень 1 из 3', gut: 'уровень 2 из 3', fortgeschritten: 'уровень 3 из 3' }[l] || ''),
    status: { folgt: 'скоро' },
    mailLead: 'Проще всего написать мне на почту.',
    insta: 'Instagram',
    copy: 'Скопировать', copied: 'Скопировано', copyLabel: 'Скопировать адрес почты',
    copyDone: 'Адрес почты скопирован.', copyFail: 'Не получилось скопировать. Выделите адрес и скопируйте вручную.',
  },
};
