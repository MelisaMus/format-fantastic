import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

export type UiLang = "de" | "en";

const UI_LANG_KEY = "cv-studio-ui-lang";

const DE = {
  tagline: "PDF importieren, Inhalte bearbeiten, perfekt formatiert exportieren",
  saved: "Gespeichert",
  undo: "Rückgängig",
  redo: "Wiederherstellen",
  choosePdf: "PDF-Datei auswählen",
  chooseJson: "JSON-Backup auswählen",
  importPdf: "PDF importieren",
  backup: "Backup",
  loadBackup: "Backup laden",
  print: "Drucken",
  exportPdf: "PDF exportieren",
  profile: "Profil",
  profileName: "Profilname",
  new: "Neu",
  duplicate: "Duplizieren",
  delete: "Löschen",
  resetAll: "Alles zurücksetzen",
  tabEdit: "Bearbeiten",
  tabPreview: "Vorschau",
  tabLayout: "Layout",
  rawTitle: "Erkannter Rohtext",
  rawHint: "Falls die Zuordnung nicht passt, kannst du Textteile hier herauskopieren.",
  language: "Sprache",
  copySuffix: "Kopie",
  defaultProfile: "Lebenslauf",
  importProfile: "Import",
  msgBackupImported: "Backup importiert.",
  msgPdfCreated: "PDF erstellt.",
  errNoText:
    "In dieser PDF wurde kein durchsuchbarer Text gefunden (vermutlich ein Scan). Unten findest du – falls vorhanden – die erkannten Zeilen zum Kopieren.",
  errPdfRead: "Diese PDF konnte nicht gelesen werden. Du kannst die Inhalte manuell eintragen.",
  errJson: "Die JSON-Datei konnte nicht gelesen werden.",
  errExport: "PDF-Export fehlgeschlagen – nutze alternativ „Drucken“.",

  // Preview frame
  page: "Seite",
  pages: "Seiten",
  pageBreak: "Seitenumbruch",

  // Editor
  header: "Kopfbereich",
  name: "Name",
  headline: "Untertitel",
  address: "Anschrift",
  email: "E-Mail",
  phone: "Telefon",
  summary: "Kurzprofil",
  photo: "Bewerbungsfoto",
  photoCurrent: "Aktuelles Bewerbungsfoto",
  photoAdd: "Bild hinzufügen",
  photoSwap: "Bild tauschen",
  photoCrop: "Zuschneiden",
  photoRemove: "Entfernen",
  photoHintA: "JPG oder PNG, wird automatisch verkleinert",
  photoHintB: "und lokal gespeichert.",
  photoHintCurrent: (kb: number) => `aktuell ca. ${kb} kB`,
  cropTitle: "Foto zuschneiden",
  cropDesc: "Bildausschnitt im Bewerbungsformat (26 × 33 mm) wählen.",
  cropPreviewAlt: "Vorschau des gewählten Bildausschnitts",
  zoom: "Zoom",
  horizontal: "Horizontal",
  vertical: "Vertikal",
  cancel: "Abbrechen",
  apply: "Übernehmen",
  entry: "Eintrag",
  group: "Gruppe",
  noEntries: "Noch keine Einträge – füge einen hinzu.",
  period: "Zeitraum",
  periodPlaceholder: "03/2025 - aktuell",
  positionOrDegree: "Position oder Abschluss",
  positionPlaceholder: "Position / Abschluss",
  employer: "Arbeitgeber oder Institution",
  employerPlaceholder: "Arbeitgeber / Institution, Ort",
  bullets: "Stichpunkte (eine Zeile je Punkt)",
  groupTitle: "Titel der Gruppe",
  title: "Titel",
  groupItems: "Einträge der Gruppe",
  oneItemPerLine: "Ein Eintrag je Zeile",
  oneLanguagePerLine: "Eine Sprache je Zeile",
  deleteEntry: (what: string) => `Eintrag ${what} löschen`,
  deleteGroup: (what: string) => `Gruppe ${what} löschen`,

  // Settings
  template: "Vorlage",
  tplClassic: "Klassisch (einspaltig)",
  tplTwocol: "Zweispaltig mit Seitenleiste",
  tplCompact: "Kompakt",
  photoShape: "Fotoform",
  shapeRect: "Rechteckig",
  shapeCircle: "Rund",
  accent: "Akzentfarbe",
  accentCopper: "Kupfer",
  accentSteel: "Stahlblau",
  accentSage: "Salbei",
  accentBordeaux: "Bordeaux",
  accentGraphite: "Graphit",
  fontSize: (pct: number) => `Schriftgröße (${pct} %)`,
  sectionTitles: "Überschriften",
  german: "Deutsch",
  english: "English",
  showGuides: "Seitenumbrüche in der Vorschau anzeigen",
  hintExperience: "Berufserfahrung",
  hintEducation: "Ausbildung",
  hintSkills: "Kenntnisse",
  hintLanguages: "Sprachen",
  hintExtras: "Zusätzliches",
};

export type Dict = typeof DE;

const EN: Dict = {
  tagline: "Import a PDF, edit the content, export a perfectly formatted CV",
  saved: "Saved",
  undo: "Undo",
  redo: "Redo",
  choosePdf: "Choose a PDF file",
  chooseJson: "Choose a JSON backup",
  importPdf: "Import PDF",
  backup: "Backup",
  loadBackup: "Load backup",
  print: "Print",
  exportPdf: "Export PDF",
  profile: "Profile",
  profileName: "Profile name",
  new: "New",
  duplicate: "Duplicate",
  delete: "Delete",
  resetAll: "Reset everything",
  tabEdit: "Edit",
  tabPreview: "Preview",
  tabLayout: "Layout",
  rawTitle: "Detected raw text",
  rawHint: "If the mapping is off, you can copy text fragments from here.",
  language: "Language",
  copySuffix: "copy",
  defaultProfile: "Resume",
  importProfile: "Import",
  msgBackupImported: "Backup imported.",
  msgPdfCreated: "PDF created.",
  errNoText:
    "No searchable text was found in this PDF (probably a scan). Any detected lines are shown below for copying.",
  errPdfRead: "This PDF could not be read. You can enter the content manually.",
  errJson: "The JSON file could not be read.",
  errExport: "PDF export failed – use “Print” instead.",

  page: "page",
  pages: "pages",
  pageBreak: "Page break",

  header: "Header",
  name: "Name",
  headline: "Subtitle",
  address: "Address",
  email: "Email",
  phone: "Phone",
  summary: "Profile summary",
  photo: "Photo",
  photoCurrent: "Current photo",
  photoAdd: "Add photo",
  photoSwap: "Replace photo",
  photoCrop: "Crop",
  photoRemove: "Remove",
  photoHintA: "JPG or PNG, automatically resized",
  photoHintB: "and stored locally.",
  photoHintCurrent: (kb: number) => `currently approx. ${kb} kB`,
  cropTitle: "Crop photo",
  cropDesc: "Choose the crop in CV photo format (26 × 33 mm).",
  cropPreviewAlt: "Preview of the selected crop",
  zoom: "Zoom",
  horizontal: "Horizontal",
  vertical: "Vertical",
  cancel: "Cancel",
  apply: "Apply",
  entry: "Entry",
  group: "Group",
  noEntries: "No entries yet – add one.",
  period: "Period",
  periodPlaceholder: "03/2025 - present",
  positionOrDegree: "Position or degree",
  positionPlaceholder: "Position / degree",
  employer: "Employer or institution",
  employerPlaceholder: "Employer / institution, city",
  bullets: "Bullet points (one per line)",
  groupTitle: "Group title",
  title: "Title",
  groupItems: "Group items",
  oneItemPerLine: "One item per line",
  oneLanguagePerLine: "One language per line",
  deleteEntry: (what: string) => `Delete entry ${what}`,
  deleteGroup: (what: string) => `Delete group ${what}`,

  template: "Template",
  tplClassic: "Classic (single column)",
  tplTwocol: "Two columns with sidebar",
  tplCompact: "Compact",
  photoShape: "Photo shape",
  shapeRect: "Rectangular",
  shapeCircle: "Round",
  accent: "Accent colour",
  accentCopper: "Copper",
  accentSteel: "Steel blue",
  accentSage: "Sage",
  accentBordeaux: "Bordeaux",
  accentGraphite: "Graphite",
  fontSize: (pct: number) => `Font size (${pct} %)`,
  sectionTitles: "Section titles",
  german: "Deutsch",
  english: "English",
  showGuides: "Show page breaks in the preview",
  hintExperience: "Experience",
  hintEducation: "Education",
  hintSkills: "Skills",
  hintLanguages: "Languages",
  hintExtras: "Additional",
};

const DICTS: Record<UiLang, Dict> = { de: DE, en: EN };

const Ctx = createContext<{ lang: UiLang; setLang: (l: UiLang) => void; t: Dict }>({
  lang: "de",
  setLang: () => {},
  t: DE,
});

export function readUiLang(): UiLang {
  if (typeof window === "undefined") return "de";
  const v = window.localStorage.getItem(UI_LANG_KEY);
  return v === "en" ? "en" : "de";
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<UiLang>("de");

  const value = useMemo(
    () => ({
      lang,
      setLang: (l: UiLang) => {
        setLangState(l);
        try {
          window.localStorage.setItem(UI_LANG_KEY, l);
        } catch {
          /* ignore */
        }
      },
      t: DICTS[lang],
    }),
    [lang],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useI18n = () => useContext(Ctx);
export const useT = () => useContext(Ctx).t;
