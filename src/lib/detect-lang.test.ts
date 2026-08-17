import { describe, expect, it } from "vitest";
import { detectLanguage } from "./detect-lang";

describe("detectLanguage", () => {
  it("detects German CVs", () => {
    expect(
      detectLanguage([
        "Beruflicher Werdegang",
        "03/2025 - aktuell Referentin für Datenanalyse bei der Universität Freiburg",
        "Ausbildung und Kenntnisse mit Schwerpunkt auf Statistik und Datenqualität",
      ]),
    ).toBe("de");
  });

  it("detects English CVs", () => {
    expect(
      detectLanguage([
        "Professional Experience",
        "03/2025 - present Data Analyst at the University of Freiburg",
        "Education and skills with a focus on statistics, reporting and data quality",
        "Responsibilities included management of the reporting work and the summary of results",
      ]),
    ).toBe("en");
  });

  it("falls back to German for very short input", () => {
    expect(detectLanguage(["Experience"])).toBe("de");
  });
});
