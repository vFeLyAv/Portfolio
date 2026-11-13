// =====================================================================================
// FOTOS DER SEITE – hier und nur hier austauschen.
//
// So tauschst du ein Foto:
//   1. Bild nach  site/public/img/  legen. Freigestellte Figuren als .webp mit durchsichtigem
//      Hintergrund ("-person.webp"), ganze Fotos als .jpg ("-photo.jpg").
//   2. Unten bei der passenden Stelle  src  ändern und  w / h  auf die echte Pixelgröße setzen
//      (Rechtsklick → Eigenschaften → Details). Daraus wird das Seitenverhältnis berechnet.
//   3. Die Anteile (0 = links/oben, 1 = rechts/unten, gemessen am ganzen Bild) anpassen:
//        hero:      headTop = Oberkante des Kopfes, bodyX = Mitte des Körpers,
//                   size = Größe (1 = so groß wie das alte Sitzfoto; ganze Figur eher 0.7–0.8).
//                   Unten verdecken Wolken das Bild – dort darf es abgeschnitten sein.
//        about:     ganzes Foto als Abzug an der Leine (frame: 'print' Hochformat oder 'film' Querformat).
//                   focusX / focusY = was im Rahmen bleiben soll, zoom = wie nah.
//        projects:  cloudX / cloudY = wo die Wolke unter der Figur sitzt (deckt den Rest unten ab), size = Größe,
//                   rim = warmes Gegenlicht von rechts oben (Sommersonne).
//        contact:   ganzes Foto als Bildseite der Winter-Postkarte (wird auf das Kartenformat zugeschnitten,
//                   focusX/focusY = was sichtbar bleiben soll). stamp = Foto auf der Briefmarke.
//   alt = Beschreibung auf Deutsch, altEn = auf Englisch, altRu = auf Russisch (für die jeweilige Sprache der Seite).
//   4. Seite neu laden. Fertig – alles andere rechnet die Seite selbst aus.
// =====================================================================================

// Hero zum Vergleichen: Standard ist E. Andere Variante über die Adresse, z. B. …/seasons/?hero=b (a, b, c, d, e, f)
// Zusätzliche Felder nur für den Hero: screenX = wo die Körpermitte auf dem Bildschirm steht (0.5 = Mitte),
// headAt = Kopfhöhe als Anteil der Bildschirmhöhe (sonst Standard aus dem CSS).
// Fürs Handy (schmaler als 700 px) eigene Werte: sizeSmall, screenXSmall, headAtSmall.
// fade = wie viel der Unterkante weich ausgeblendet wird (0.06 = 6 %, Standard).
// Bilder werden nie mehr als 1,25-fach vergrößert (sonst werden Handyfotos unscharf).
const HEROES = {
  // E (Standard): Sony DSC05325, läuft direkt auf uns zu – Fischerhut, Sonnenbrille, Zunge raus, Häkelhemd,
  //    Leoparden-Shorts, Badelatschen. Kommt aus den Wolken, die Füße versinken leicht in der vorderen Wolke.
  //    walk = ganz leichtes Auf und Ab wie beim Gehen (aus bei reduzierter Bewegung)
  e: {
    src: '/img/hero-dsc05325-person.webp', w: 542, h: 1606,
    alt: 'Feliks läuft auf uns zu, mit weißem Fischerhut, Sonnenbrille und herausgestreckter Zunge, im Häkelhemd und mit Leoparden-Shorts',
    altEn: 'Feliks walking towards us in a white bucket hat and sunglasses, sticking his tongue out, wearing a crochet shirt and leopard-print shorts',
    altRu: 'Феликс идёт нам навстречу в белой панаме и солнечных очках, показывает язык, в вязаной рубашке и леопардовых шортах',
    headTop: 0.0, bodyX: 0.5, size: 0.88, headAt: 0.16, sizeSmall: 0.85, headAtSmall: 0.39,
    fade: 0.08, walk: true,
  },
};
// Vergleichs-Fotos (?hero=a…f) gibt es nur beim Entwickeln – im öffentlichen Build sind sie gar nicht enthalten
if (import.meta.env.DEV) {
  Object.assign(HEROES, {
    // F: Selfie von unten ins Bild – Kopfhörer, Sonnenbrille auf der Stirn, ernster Blick, hellgraue Lederjacke.
    //    Die abgeschnittenen Kanten (unten, Arm rechts und links) liegen unter dem Bildschirmrand und werden ausgeblendet.
    //    nod = wo der Hals ist (Anteile im Bild): dort nickt der Kopf im Takt, solange die Musik läuft.
    //    front = vor allen Wolken (sonst zieht eine Wolke durchs Gesicht); unten blendet das Bild weich aus
    f: {
      src: '/img/hero-img_2183-person.webp', w: 1280, h: 838,
      alt: 'Feliks macht ein Selfie mit großen Kopfhörern und Sonnenbrille auf der Stirn und schaut ernst in die Kamera',
      altEn: 'Feliks taking a selfie with big headphones and sunglasses pushed up on his forehead, looking seriously into the camera',
      altRu: 'Феликс делает селфи в больших наушниках, солнечные очки подняты на лоб, серьёзно смотрит в камеру',
      headTop: 0.0, bodyX: 0.3, screenX: 0.42, size: 0.64, headAt: 0.47, front: true,
      sizeSmall: 0.7, screenXSmall: 0.45, headAtSmall: 0.45,
      fade: 0.3, fadeX: 0.05, nod: { x: 0.34, y: 0.66 },
    },
    // A: ganz stehend, weißes T-Shirt mit gelbem Print, Kopfhörer, Peace-Zeichen, Spiegel-Selfie – steht auf einer Wolke
    a: {
      src: '/img/hero-img_2164-person.webp', w: 467, h: 870,
      alt: 'Feliks im weißen T-Shirt mit Kopfhörern, macht ein Peace-Zeichen und ein Spiegel-Selfie',
      altEn: 'Feliks in a white T-shirt with headphones, making a peace sign and taking a mirror selfie',
      altRu: 'Феликс в белой футболке и наушниках показывает знак мира и делает селфи в зеркале',
      headTop: 0.03, bodyX: 0.5, size: 0.66, headAtSmall: 0.36,
    },
    // B: Oberkörper im hellgrauen Anzug, Sonnenbrille, Arm weit ausgestreckt – „präsentiert“ den großen Namen
    b: {
      src: '/img/hero-img_0389-person.webp', w: 709, h: 579,
      alt: 'Feliks im hellgrauen Anzug mit Sonnenbrille, streckt den Arm aus, als würde er den Namen präsentieren',
      altEn: 'Feliks in a light grey suit and sunglasses, stretching out his arm as if presenting the name',
      altRu: 'Феликс в светло-сером костюме и солнечных очках вытягивает руку, будто представляет имя',
      headTop: 0.04, bodyX: 0.6, size: 0.6, screenX: 0.66, headAt: 0.355,
      sizeSmall: 0.5, screenXSmall: 0.58, headAtSmall: 0.5, fade: 0.2,
    },
    // C: Sony DSC05763, Strickpullover und Kappe, lässig angelehnt (der Fuß verschwindet hinter den Wolken)
    c: {
      src: '/img/sony-dsc05763-person.webp', w: 658, h: 1391,
      alt: 'Feliks im cremefarbenen Strickpullover mit Kappe, lässig angelehnt',
      altEn: 'Feliks in a cream knit sweater and cap, leaning back casually',
      altRu: 'Феликс в кремовом вязаном свитере и кепке, непринуждённо откинулся назад',
      headTop: 0.03, bodyX: 0.5, size: 0.72,
    },
    // D: Felix zwischen einem großen Bund gelber Luftballons (zusammen freigestellt), schwebt im Himmel und wippt leicht.
    //    fadeX / fadeL = rechte / linke Kante weich ausblenden (dort sind Ballons angeschnitten), balloons = lose Ballons, die aufsteigen.
    //    Er steht tiefer, damit die Ballons unter dem Namen liegen und der Name lesbar bleibt; unten decken Wolken ab.
    d: {
      src: '/img/hero-balloons-group.webp', w: 714, h: 769,
      alt: 'Feliks in gestreiftem Hemd und Krawatte zwischen vielen gelben Luftballons',
      altEn: 'Feliks in a striped shirt and tie among lots of yellow balloons',
      altRu: 'Феликс в полосатой рубашке и галстуке среди множества жёлтых воздушных шаров',
      headTop: 0.005, bodyX: 0.47, size: 0.52, headAt: 0.4, sizeSmall: 0.48, headAtSmall: 0.42,
      fade: 0.18, fadeX: 0.17, fadeL: 0.17, bob: true, balloons: 3,
    },
    // weitere freigestellte Fotos: '/img/hero-img_0388-person.webp' (519×863, Oberkörper, lustiges Gesicht, Blazer),
    // '/img/sony-dsc05325-person.webp' (Sommer, weißes T-Shirt, Hut)
  });
}
let heroKey = 'e';
// ?hero=… nur beim Entwickeln; die öffentliche Version zeigt immer E (andere Fotos sind dort gar nicht enthalten)
if (import.meta.env.DEV) {
  try { heroKey = new URLSearchParams(location.search).get('hero') || 'e'; } catch { /* egal */ }
}

export const photos = {
  hero: HEROES[heroKey] || HEROES.e,
  // Über mich: Abzug an der Leine. frame: 'print' = Foto mit weißem Rand (Hochformat), 'film' = 35-mm-Filmbild (Querformat)
  about: {
    src: '/img/balloons-edit.jpg', w: 714, h: 1280, frame: 'print',
    alt: 'Feliks in einem Raum voller gelber Luftballons (eigene Bearbeitung)',
    altEn: 'Feliks in a room full of yellow balloons (his own edit)',
    altRu: 'Феликс в комнате, полной жёлтых воздушных шаров (собственная обработка)',
    focusX: 0.5, focusY: 0.5, zoom: 1,
  },
  // Alternative für Über mich: Filmbild im hellen Anzug mit Fliege (Sony DSC02437)
  // about: { src: '/img/sony-dsc02437-photo.jpg', w: 1800, h: 1200, frame: 'film',
  //   alt: 'Feliks im hellen Anzug mit Fliege, Nahaufnahme mit grünlichem Filmlicht', focusX: 0.62, focusY: 0.4, zoom: 1 },

  // Projekte: Felix mit verschränkten Armen und Sonnenbrille (Sony DSC05257), steht auf einer Wolke (Deko).
  // rim = warmes Gegenlicht von der Sommersonne oben rechts (0 = aus)
  projects: {
    src: '/img/sony-dsc05257-person.webp', w: 783, h: 1699,
    alt: '',
    cloudX: 0.5, cloudY: 0.77, size: 0.92, rim: 0.3,   // Foto bleibt unverändert, nur eine ganz feine Lichtkante rechts
  },
  // Kontakt: Bildseite der Winter-Postkarte – Sony DSC06015, nachts in Regensburg, rotes Straßenlicht (passt zum Stempel)
  contact: {
    src: '/img/sony-dsc06015-photo.jpg', w: 1256, h: 1800,
    alt: 'Feliks nachts auf einer Straße in Regensburg, in schwarzer Lederjacke, im warmen roten Licht einer Laterne',
    altEn: 'Feliks at night on a street in Regensburg, in a black leather jacket, lit by a warm red street light',
    altRu: 'Феликс ночью на улице в Регенсбурге, в чёрной кожаной куртке, в тёплом красном свете фонаря',
    focusX: 0.46, focusY: 0.4, zoom: 1,
  },
  // Briefmarke auf der Schreibseite: Weihnachtsmarkt (DSC01805), nur ein kleiner Ausschnitt
  stamp: {
    src: '/img/sony-dsc01805-photo.jpg', w: 1800, h: 1200,
    focusX: 0.47, focusY: 0.3,
  },
  // früher Bildseite: contact: { src: '/img/sony-dsc01805-photo.jpg', w: 1800, h: 1200, alt: 'Feliks lacht auf dem Weihnachtsmarkt, in Lammfelljacke', focusX: 0.47, focusY: 0.35 },
  // Alternativen für Kontakt:
  // contact: { src: '/img/person.webp', w: 1214, h: 1800, alt: 'Feliks bei Nacht in Lederjacke, im roten Licht', focusX: 0.33, focusY: 0.27, zoom: 1 },
  // Reiseschnappschuss mit Koffer (früher im Lebenslauf): '/img/sony-dsc05990-person.webp' (1000×1800)
  // Reserve (noch nicht benutzt): Sommer auf der Straße, weißes T-Shirt, Hut
  // spare: { src: '/img/sony-dsc05325-person.webp', alt: 'Feliks im Sommer mit Hut' },
};
