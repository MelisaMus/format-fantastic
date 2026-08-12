# Lebenslauf-Editor

Eine Web-App zum Importieren, Bearbeiten und Formatieren von Lebensläufen (PDF) und zum sauberen Export als druckfertiges PDF. Importiert beliebige PDF-Lebensläufe, erkennt Struktur (Werdegang, Ausbildung, Kenntnisse, Sprachen) automatisch und hält die Daten im Editor frei editierbar.

## Funktionen

- **PDF-Import** – Beliebige Lebenslauf-PDFs hochladen. Text wird mit `pdfjs-dist` extrahiert, zweispaltige Layouts erkannt, Abschnitte (Werdegang, Ausbildung, Kenntnisse, Sprachen, Profil) automatisch zugeordnet und Datumsangaben wie `03/2025 – aktuell` geparsed. Bindestrich-Trennungen am Zeilenumbruch werden wieder zusammengeführt.
- **Strukturierter Editor** – Alle Felder frei editierbar; Abschnitte sind ein-/ausklappbar. Einträge lassen sich per Drag & Drop oder Tastatur (Pfeiltasten auf dem Griff) an beliebige Position verschieben.
- **Undo / Redo** – Vollständiger History-Stack; ein Fehlimport oder eine Löschung lässt sich zurücknehmen.
- **Mehrere Profile** – Beliebig viele Lebenslauf-Varianten anlegen, benennen, duplizieren, umschalten und löschen.
- **Layout-Optionen** – Drei Vorlagen (klassisch, zweispaltig, kompakt), Akzentfarbe, Schriftgröße und Fotoform (eckig/rund).
- **Bewerbungsfoto** – Hochladen, tauschen, entfernen sowie zuschneiden (26 × 33 mm). Bilder werden automatisch komprimiert, damit `localStorage` nicht überläuft.
- **Live-Vorschau** – A4-Seitenvorschau mit Seitenzähler und optionalen Seitenumbruch-Markierungen; Einträge werden nicht über Seitengrenzen getrennt.
- **PDF-Export** – Echter PDF-Export via `pdf-lib` (browserunabhängige Ränder) plus klassischer Druck über `window.print()`.
- **Backup** – Export/Import aller Profile als JSON-Datei für Gerätewechsel oder Sicherung.
- **Mobil nutzbar** – Auf kleinen Bildschirmen Umschalter zwischen Bearbeiten, Vorschau und Layout statt Nebeneinander-Ansicht.
- **Import-Robustheit** – Mehrseitige PDFs, Kopf-/Fußzeilen-Filter und eine klare Meldung samt Rohtext-Ansicht, wenn eine PDF keinen Textlayer hat (Scan).
- **Lokale Speicherung** – Alle Daten bleiben im Browser (`localStorage`), kein Login, keine Cloud, keine Daten verlassen das Gerät.

## Technologie

- **TanStack Start** (React 19, SSR) – Fullstack-Framework & Routing
- **Vite 7** – Build-Tool
- **TypeScript** – Typsicherheit
- **Tailwind CSS v4** – Styling (native CSS-`@import` & Theme-Variablen in `src/styles.css`)
- **pdfjs-dist** – PDF-Textextraktion & Layout-Erkennung
- **pdf-lib** – PDF-Erzeugung für den Export
- **Vitest** – Unit-Tests für die Import-Heuristiken
- **Instrument Serif / Work Sans** – Typografie ("Paper and Ink"-Designsystem)

## Projektstruktur

```
src/
├── lib/
│   ├── cv.ts          # CvData/Profile-Schema, localStorage-Persistenz, Helpers
│   ├── image.ts       # Foto-Komprimierung & Zuschnitt
│   ├── pdf-export.ts  # PDF-Erzeugung mit pdf-lib
│   └── pdf-import.ts  # PDF-Extraktion, Spaltenerkennung, Abschnitts-Parsing
├── hooks/
│   └── use-history.ts # Undo/Redo-Stack
├── components/cv/
│   ├── CvEditor.tsx      # Strukturierter Formular-Editor
│   ├── CvPreview.tsx     # A4-Vorschau-Komponente
│   ├── PreviewFrame.tsx  # Seitenzähler & Umbruch-Markierungen
│   ├── SettingsPanel.tsx # Vorlagen, Farbe, Schriftgröße
│   └── SortableList.tsx  # Drag & Drop mit Tastaturbedienung
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
| `settings`   | `CvSettings`   | Vorlage, Akzentfarbe, Schriftgröße, Fotoform |

Mehrere `Profile` (je mit `CvData`) werden im `CvStore` verwaltet.

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
npx vitest run   # Unit-Tests
```

## Hinweise

- Alle Daten werden ausschließlich im Browser gespeichert (`localStorage`, Key `cv-editor-store-v2`, Altdaten aus `cv-editor-data-v1` werden migriert). Es gibt kein Backend, keinen Login und keine Cloud-Anbindung.
- „PDF exportieren" erzeugt die Datei direkt mit `pdf-lib`; „Drucken" nutzt alternativ die Druckfunktion des Browsers.
- Die Abschnittserkennung beim Import arbeitet heuristisch; bei ungewöhnlichen Layouten kann das Ergebnis nachträglich im Editor korrigiert werden.

## Built with

- TanStack Start
- TypeScript
- React
- Tailwind CSS
