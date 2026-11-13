# Portfolio – Feliks Kolomoiets

**Live:** [felya.pages.dev](https://felya.pages.dev)

Mein Portfolio und Lebenslauf als virtueller Salon: Bilder an der Wand öffnen Projekte, ein Grammophon spielt selbst erzeugte Musik (Web Audio), Zertifikate bekommen ein Wachssiegel. Deutsch, Englisch und Russisch.

Gebaut mit KI-Werkzeugen (Claude Code, Codex) – ich habe entschieden, getestet und Schritt für Schritt nachgebessert.

## Technik
- [Vite](https://vitejs.dev), reines JavaScript, HTML und CSS – kein Framework
- Canvas (Licht und Staub), WebGL (3D-Effekt auf Fotos aus Tiefenkarten), Web Audio (Grammophon)
- Eigener „Leicht-Modus“ für iPad und Handy (weniger Filter, schnelleres Scrollen)
- Schriften lokal gehostet, keine Cookies, kein Tracking
- Hosting: Cloudflare Pages

## Ordner
| Ordner | Inhalt |
|---|---|
| `salon/` | die Hauptseite (Salon) |
| `shared/` | Texte und Daten in drei Sprachen |
| `seasons/`, `v-*/`, `night/` … | frühere Designvarianten („Design-Studien“) |
| `public/` | Bilder, Schriften, Zertifikate |

## Lokal starten
```bash
npm install
npm run dev
```

## Hinweis
Die Design-Studien hatten je ein Pinterest-Poster als Vorlage. Diese Poster sind Werke anderer Künstler und liegen hier deshalb nur als Platzhalter. Fotos und Texte © Feliks Kolomoiets.

---

*English: Personal portfolio and CV, built as a virtual salon with Vite and vanilla JavaScript (Canvas, WebGL, Web Audio). Live at [felya.pages.dev](https://felya.pages.dev).*
