// Sprachen: Deutsch (Standard), Englisch, Russisch.
// Inhalte kommen aus /shared/data*.js (gleiche Struktur), feste Oberflächen-Texte stehen hier in STR.
// Wahl: ?lang=… > gespeicherte Wahl (localStorage) > Browsersprache.
import * as de from '/shared/data.js';
import * as en from '/shared/data.en.js';
import * as ru from '/shared/data.ru.js';

export const DATA = { de, en, ru };
export const LANGS = ['de', 'en', 'ru'];
const KEY = 'v-knight-lang';

export function initialLang() {
  try {
    const q = new URLSearchParams(location.search).get('lang');
    if (LANGS.includes(q)) return q;
    const saved = localStorage.getItem(KEY);
    if (LANGS.includes(saved)) return saved;
  } catch { /* privater Modus */ }
  const nav = (navigator.language || 'de').toLowerCase();
  return nav.startsWith('de') ? 'de' : nav.startsWith('ru') || nav.startsWith('uk') ? 'ru' : 'en';
}
export function saveLang(l) { try { localStorage.setItem(KEY, l); } catch { /* egal */ } }

export const STR = {
  de: {
    title: 'Feliks Kolomoiets – Lebenslauf',
    desc: 'Lebenslauf und Projekte von Feliks Kolomoiets, Regensburg.',
    langGroup: 'Sprache wählen',
    poster: 'Lebenslauf',
    about: 'Über mich', projects: 'Projekte', certs: 'Zertifikate', cv: 'Lebenslauf', contact: 'Kontakt',
    school: 'Schule', practice: 'Praxis', skills: 'Kenntnisse', languages: 'Sprachen', interests: 'Interessen', documents: 'Dokumente',
    openSite: 'bunprise.de öffnen',
    verify: 'Echtheit prüfen', pdf: 'Zertifikat als PDF', course: 'Zum Kurs', wip: 'in Arbeit', earned: 'Erhalten am',
    copy: 'Adresse kopieren', copied: 'Kopiert', copyFail: 'Bitte die Adresse markieren und kopieren',
    seal: 'Siegel erneut aufdrücken',
    newTab: '(öffnet in neuem Tab)',
    heroAlt: 'Feliks in Lammfelljacke, die Hände hinter dem Kopf, mitten in einer Blumenwiese',
    aboutAlt: 'Feliks im hellen Anzug mit Fliege',
    bunAlt: 'Vorschaubild der Web-App Bunprise',
    webAlt: 'Tiefenkarte eines Fotos, mit KI berechnet',
    mcAlt: 'Blender-Render einer Minecraft-Szene',
    certAlt: 'Zertifikat',
    levelDaily: 'täglich im Einsatz',
  },
  en: {
    title: 'Feliks Kolomoiets – CV',
    desc: 'CV and projects of Feliks Kolomoiets, Regensburg.',
    langGroup: 'Choose language',
    poster: 'Curriculum vitae',
    about: 'About me', projects: 'Projects', certs: 'Certificates', cv: 'CV', contact: 'Contact',
    school: 'School', practice: 'Work experience', skills: 'Skills', languages: 'Languages', interests: 'Interests', documents: 'Documents',
    openSite: 'Open bunprise.de',
    verify: 'Verify', pdf: 'Certificate as PDF', course: 'View course', wip: 'in progress', earned: 'Earned on',
    copy: 'Copy address', copied: 'Copied', copyFail: 'Please select the address and copy it',
    seal: 'Press the seal again',
    newTab: '(opens in a new tab)',
    heroAlt: 'Feliks in a sheepskin jacket, hands behind his head, in the middle of a flower meadow',
    aboutAlt: 'Feliks in a light suit and bow tie',
    bunAlt: 'Preview image of the Bunprise web app',
    webAlt: 'Depth map of a photo, computed with AI',
    mcAlt: 'Blender render of a Minecraft scene',
    certAlt: 'Certificate',
    levelDaily: 'used every day',
  },
  ru: {
    title: 'Feliks Kolomoiets – резюме',
    desc: 'Резюме и проекты Feliks Kolomoiets, Регенсбург.',
    langGroup: 'Выбрать язык',
    poster: 'Резюме',
    about: 'Обо мне', projects: 'Проекты', certs: 'Сертификаты', cv: 'Резюме', contact: 'Контакты',
    school: 'Школа', practice: 'Практика', skills: 'Навыки', languages: 'Языки', interests: 'Интересы', documents: 'Документы',
    openSite: 'Открыть bunprise.de',
    verify: 'Проверить подлинность', pdf: 'Сертификат в PDF', course: 'К курсу', wip: 'в процессе', earned: 'Получен',
    copy: 'Скопировать адрес', copied: 'Скопировано', copyFail: 'Выделите адрес и скопируйте его',
    seal: 'Поставить печать ещё раз',
    newTab: '(откроется в новой вкладке)',
    heroAlt: 'Феликс в дублёнке, руки за головой, посреди цветочного луга',
    aboutAlt: 'Феликс в светлом костюме с бабочкой',
    bunAlt: 'Превью веб-приложения Bunprise',
    webAlt: 'Карта глубины фотографии, рассчитанная ИИ',
    mcAlt: 'Рендер сцены из Minecraft в Blender',
    certAlt: 'Сертификат',
    levelDaily: 'каждый день',
  },
};
