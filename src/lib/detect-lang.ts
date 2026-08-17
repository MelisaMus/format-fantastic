import type { UiLang } from "./i18n";

const DE_WORDS = [
  "und",
  "der",
  "die",
  "das",
  "von",
  "für",
  "mit",
  "bei",
  "seit",
  "aktuell",
  "heute",
  "beruflicher",
  "werdegang",
  "berufserfahrung",
  "ausbildung",
  "kenntnisse",
  "sprachen",
  "fähigkeiten",
  "praktikum",
  "studium",
  "abschluss",
  "hochschule",
  "universität",
  "mitarbeiter",
  "erfahrung",
  "zusätzliche",
  "geboren",
  "lebenslauf",
];

const EN_WORDS = [
  "and",
  "the",
  "with",
  "for",
  "from",
  "since",
  "present",
  "current",
  "experience",
  "education",
  "skills",
  "languages",
  "summary",
  "profile",
  "work",
  "university",
  "bachelor",
  "master",
  "degree",
  "internship",
  "responsibilities",
  "achievements",
  "management",
  "resume",
  "curriculum",
];

const count = (tokens: string[], words: string[]) => tokens.filter((w) => words.includes(w)).length;

/**
 * Guesses the language of an imported CV from its text lines.
 * Falls back to German when the signal is inconclusive.
 */
export function detectLanguage(lines: string[]): UiLang {
  const text = lines.join(" ").toLowerCase();
  const tokens = text.split(/[^\p{L}]+/u).filter(Boolean);
  if (tokens.length < 15) return "de";

  const de = count(tokens, DE_WORDS);
  const en = count(tokens, EN_WORDS);
  const umlauts = (text.match(/[äöüß]/g) ?? []).length;

  return en > de + umlauts ? "en" : "de";
}
