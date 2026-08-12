# Lebenslauf-Editor

Eine Web-App zum Importieren, Bearbeiten und Formatieren von Lebensläufen (PDF) und zum sauberen Export als druckfertiges PDF. Importiert beliebige PDF-Lebensläufe, erkennt Struktur (Werdegang, Ausbildung, Kenntnisse, Sprachen) automatisch und hält die Daten im Editor frei editierbar.

## Funktionen

- **PDF-Import** – Beliebige Lebenslauf-PDFs hochladen. Text wird mit `pdfjs-dist` extrahiert, zweispaltige Layouts erkannt, Abschnitte (Werdegang, Ausbildung, Kenntnisse, Sprachen, Profil) automatisch zugeordnet und Datumsangaben wie `03/2025 – aktuell` geparsed. Bindestrich-Trennungen am Zeilenumbruch werden wieder zusammengeführt.
- **Strukturierter Editor** – Alle Felder frei editierbar: Name, Headline, Kurzprofil, Kontakt, Werdegang, Ausbildung, Kenntnisse, Sprachen, sonstige Abschnitte. Einträge lassen sich verschieben, hinzufügen und löschen.
- **Bewerbungsfoto** – Foto hochladen, jederzeit austauschen oder entfernen. Erscheint im Kopfbereich der Vorschau und bleibt lokal gespeichert.
- **Live-Vorschau** – A4-formatierte Seitenvorschau neben dem Editor, aktualisiert in Echtzeit.
- **PDF-Export** – Sauberer Druck über `window.print()` mit dediziertem Print-CSS (A4, korrekte Ränder, Schriftbild).
- **Lokale Speicherung** – Alle Daten bleiben im Browser (`localStorage`), kein Login, keine Cloud, keine Daten verlassen das Gerät.

## Technologie

- **TanStack Start** (React 19, SSR) – Fullstack-Framework & Routing
- **Vite 7** – Build-Tool
- **TypeScript** – Typsicherheit
- **Tailwind CSS v4** – Styling (native CSS-`@import` & Theme-Variablen in `src/styles.css`)
- **pdfjs-dist** – PDF-Textextraktion & Layout-Erkennung
- **Instrument Serif / Work Sans** – Typografie ("Paper and Ink"-Designsystem)

## Projektstruktur

```
src/
├── lib/
│   ├── cv.ts          # CvData-Schema, localStorage-Persistenz, Helpers
│   └── pdf-import.ts  # PDF-Extraktion, Spaltenerkennung, Abschnitts-Parsing
├── components/cv/
│   ├── CvEditor.tsx   # Strukturierter Formular-Editor
│   └── CvPreview.tsx  # A4-Vorschau-Komponente
├── routes/
│   ├── __root.tsx     # App-Shell, Fonts, Layout
│   └── index.tsx      # Hauptseite: Upload, Editor, Vorschau, Export
└── styles.css         # "Paper and Ink"-Designsystem, A4- & Print-Styles
```

## Datenmodell

`CvData` (`src/lib/cv.ts`) umfasst:

| Feld         | Typ            | Beschreibung                              |
| ------------ | -------------- | ---------------------------------------- |
| `name`       | `string`       | Vollständiger Name                        |
| `headline`   | `string`       | Berufsbezeichnung / Headline              |
| `summary`    | `string`       | Kurzprofil                               |
| `address`    | `string`       | Anschrift                                |
| `email`      | `string`       | E-Mail                                   |
| `phone`      | `string`       | Telefon                                  |
| `photo`      | `string`       | Bewerbungsfoto (Base64-Data-URL)          |
| `experience` | `Entry[]`      | Werdegang (Zeitraum, Titel, Org, Bullets) |
| `education`  | `Entry[]`      | Ausbildung                               |
| `skills`     | `SkillGroup[]` | Kenntnisse (Gruppe + Items)              |
| `languages`  | `string[]`     | Sprachen                                 |
| `extras`     | `SkillGroup[]` | Sonstige Abschnitte                      |

## Entwicklung

Node.js und npm benötigt ([nvm-Empfehlung](https://github.com/nvm-sh/nvm#installing-and-updating)).

```sh
git clone <repository-url>
cd <repository-name>
npm i
npm run dev      # Dev-Server (http://localhost:8080)
npm run build    # Produktions-Build
npm run preview  # Build lokal prüfen
npm run lint     # ESLint
npm run format   # Prettier
```

## Hinweise

- Alle Daten werden ausschließlich im Browser gespeichert (`localStorage`, Key `cv-editor-data-v1`). Es gibt kein Backend, keinen Login und keine Cloud-Anbindung.
- Der PDF-Export nutzt die Druckfunktion des Browsers (`window.print()`). Für ein sauberes Ergebnis "Als PDF speichern" wählen.
- Die Abschnittserkennung beim Import arbeitet heuristisch; bei ungewöhnlichen Layouten kann das Ergebnis nachträglich im Editor korrigiert werden.

## Built with

- TanStack Start
- TypeScript
- React
- Tailwind CSS
