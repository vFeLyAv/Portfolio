// Русская версия data.js — ТА ЖЕ структура и те же имена экспортов.
// Коды для логики страницы остаются немецкими (status: 'geplant' | 'erhalten' | 'folgt', `level` у навыков/языков),
// русский текст для показа — в поле `label`. Факты только из data.js — держать файлы в синхроне.

export const person = {
  name: 'Feliks Kolomoiets',
  first: 'Feliks',
  spoken: 'Felix',
  city: 'Регенсбург',
  photoCaption: 'Регенсбург, ноябрь 2026',
};

export const about = [
  'Я из Запорожья и Днепра, с 2022 года живу в Баварии. Три года у меня тут было два расписания: немецкая средняя школа и параллельно онлайн украинская. Две школы, два языка, одна голова.',
  'Всё началось с Minecraft: строить миры, настраивать серверы, ковыряться, пока не заработает. Этим я занимаюсь до сих пор, только теперь с кодом и ИИ. Так появились веб-приложение, Flipper Zero, который можно потыкать, и этот сайт.',
  'Сейчас я получаю Fachabitur по технике, дальше хочу в IT, лучше всего в сторону машинного обучения. А когда экран выключен: зал, камера или горы.',
];

export const facts = [
  { title: 'Прозвище: Феля', text: 'Так меня называют друзья, отсюда и @areyoufelya в Instagram.' },
  { title: 'Две школы сразу', text: 'Три года: днём немецкая средняя школа, параллельно онлайн украинская.' },
  { title: 'Четыре языка', text: 'Русский, украинский, немецкий и английский.' },
  { title: 'Кулинарное шоу на ТВ', text: 'В детстве я вёл кулинарную передачу на украинском телевидении.' },
  { title: 'Перед камерой', text: '3–4 года актёрских курсов и роль второго плана в украинском сериале.' },
  { title: 'Около 4 лет в зале', text: 'Начал заниматься силовыми тренировками в 12 лет и не бросил.' },
  { title: 'До 100 игроков', text: 'Столько людей одновременно играло на Minecraft-сервере, который я вёл вместе с друзьями.' },
];

export const documents = [
  { title: 'Аттестат Quali (квалифицирующее окончание средней школы)', when: '2025', status: 'folgt', label: 'скоро', img: null },
  { title: 'Аттестат Mittlerer Schulabschluss', when: '2026', status: 'folgt', label: 'скоро', img: null },
  { title: 'Справка о практике, Maschinenfabrik Reinhausen', when: '11/2024', status: 'folgt', label: 'скоро', img: null },
];

export const school = [
  { when: 'с 09/2026', what: 'Fachoberschule Regensburg (техническая старшая школа)', detail: 'Направление «Техника», 11 класс, Fachabitur в 2028' },
  { when: '2022 – 2026', what: 'Angrüner-Mittelschule Bad Abbach', detail: 'Mittlerer Schulabschluss 2026, Quali 2025' },
  { when: '2015 – 2025', what: 'Школа в Украине', detail: 'с 2022 года параллельно онлайн' },
];

export const practice = [
  { when: 'с 09/2026', what: 'Eckert Schulen, Регенштауф', detail: 'Практическое обучение: металлообработка, электрика, строительство, ЧПУ' },
  { when: '11/2024', what: 'Maschinenfabrik Reinhausen', detail: 'Практика: металл/машины, электрика/мехатроника, IT (11–15.11.2024)' },
  { when: '04/2024', what: 'Krones Academy', detail: 'Практика: IT-специалист, разработка приложений (22–26.04.2024)' },
];

export const projects = [
  {
    when: '2026', title: 'Bunprise',
    text: 'Веб-приложение для компаний друзей: общий календарь, списки желаний к каждому празднику и тайная бронь подарков. Сделано с Claude и Codex.',
    img: '/img/bunprise-og.png', icon: '/img/bunprise-icon.png',
    url: 'https://bunprise.de',
    media: {
      mascot: ['/img/bunprise/peek-sniff.webm', '/img/bunprise/hop-across.webm', '/img/bunprise/corner-right.webm', '/img/bunprise/jump-out.webm', '/img/bunprise/surprise.webm', '/img/bunprise/ears-only.webm'],
      banner: ['/img/bunprise/banner-brand.mp4', '/img/bunprise/banner-dream.mp4'],
    },
  },
  {
    when: '2026', title: 'Этот сайт',
    text: 'Это резюме и этот сайт я сам придумал и собрал с помощью ИИ-инструментов: идея, дизайн, код и изображения. Фото я разложил на слои прямо на своём компьютере нейросетями (BiRefNet вырезает фигуру, Depth Anything V2 считает глубину).',
    img: '/img/depth.png',
  },
  {
    when: '2022 – 2024', title: 'Minecraft-сервер',
    text: 'Вместе с друзьями вёл сервер: настраивал плагины, воплощал идеи, строил локации. Сцены рендерил в Blender и дорабатывал в Photoshop.',
    img: '/img/render-yellow.jpg',
  },
  {
    when: '2026', title: 'Flipper Zero в 3D',
    text: 'Фан-сайт про Flipper Zero, карманный гаджет для радио, NFC и инфракрасного сигнала. Пока листаешь, устройство в 3D разбирается на детали, а в конце им можно управлять самому: на нём работает воссозданная система Flipper, а рядом сцена показывает, что сделал бы сигнал (телевизор, гаражные ворота, считыватель на двери). На самом деле ничего не отправляется. 3D-модель собрана из собственных форм, с Three.js и ИИ-инструментами.',
    img: '/img/flipper-hero.jpg',
    url: '/flipper/',
  },
];

export const certificates = [
  { title: 'AI Fluency: Framework & Foundations', issuer: 'Claude Academy (Anthropic)', status: 'erhalten', label: 'получен', date: '08.11.2026',
    url: 'https://academy.claude.com/verify/07de25476907d7d09bdddd8d8e44317e', verify: true,
    img: '/certs/ai-fluency.webp', pdf: '/certs/ai-fluency.pdf' },
  { title: 'Claude Code in Action', issuer: 'Claude Academy (Anthropic)', status: 'erhalten', label: 'получен', date: '07.11.2026',
    url: 'https://academy.claude.com/verify/b3b48fdb5810b92eb4bd8e105f893ef2', verify: true,
    img: '/certs/claude-code-in-action.webp', pdf: '/certs/claude-code-in-action.pdf' },
  { title: 'Python', issuer: 'Kaggle Learn', status: 'geplant', label: 'в процессе', url: 'https://www.kaggle.com/learn' },
  { title: 'Introduction to Cybersecurity', issuer: 'Cisco Networking Academy', status: 'geplant', label: 'в процессе', url: 'https://www.netacad.com' },
  { title: 'GitHub Foundations', issuer: 'GitHub', status: 'geplant', label: 'в процессе', url: 'https://education.github.com/experiences/foundations_certificate' },
  { title: 'Elements of AI', issuer: 'University of Helsinki & MinnaLearn', status: 'geplant', label: 'в процессе', url: 'https://www.elementsofai.com' },
];

export const languages = [
  { lang: 'Русский', level: 'Muttersprache', label: 'родной' },
  { lang: 'Украинский', level: 'fließend', label: 'свободно' },
  { lang: 'Немецкий', level: 'fließend', label: 'свободно' },
  { lang: 'Английский', level: 'gut', label: 'хорошо' },
];

export const interests = [
  { what: 'Спорт и здоровый образ жизни', detail: 'силовые тренировки около 4 лет' },
  { what: 'Программирование с ИИ', detail: 'Claude, Codex, Antigravity и другие' },
  { what: 'IT и творческие проекты', detail: 'программирование, монтаж видео и обработка фото' },
  { what: 'Фотография', detail: 'настройки камеры, композиция (Sony α7 III)' },
];

export const skills = [
  { group: 'Графика и 3D', items: [ { what: 'Photoshop', level: 'gut', label: 'хорошо' }, { what: 'Blender', level: 'Grundlagen', label: 'основы' }, { what: 'DaVinci Resolve, CapCut', level: 'gut', label: 'хорошо' } ] },
  { group: 'MS Office', items: [ { what: 'Excel', level: 'gut', label: 'хорошо' }, { what: 'Word', level: 'gut', label: 'хорошо' }, { what: 'PowerPoint', level: 'fortgeschritten', label: 'продвинуто' } ] },
  { group: 'Код и ИИ', items: [ { what: 'Claude Code, Codex, Antigravity', level: 'im Alltag', label: 'каждый день' }, { what: 'Python', level: 'Grundlagen', label: 'основы' }, { what: 'Java (плагины Minecraft)', level: 'Grundlagen', label: 'основы' } ] },
];

export const contact = {
  email: 'felikskolomoiets@gmail.com', instagram: 'areyoufelya',
  phone: '+49 175 8726895',      // auch WhatsApp (gleiche Nummer)
  telegram: ['areyoufelya', 'gotprosperity'],   // beide Namen gehen
  github: 'vFeLyAv',             // github.com/vFeLyAv (Felix, 13.11.2026)
};
