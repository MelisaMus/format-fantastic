import { describe, expect, it } from "vitest";
import { linesToCv } from "@/lib/pdf-import";
import { normalizeCv, reorder } from "@/lib/cv";

const SAMPLE = [
  "Melisa Mustafovic-Brüstle",
  "Data & Analytics",
  "Musterstraße 1, 79098 Freiburg",
  "melisa@example.com",
  "+49 761 1234567",
  "Berufserfahrung",
  "03/2025 - aktuell",
  "Referentin Datenmanagement",
  "Universität Freiburg",
  "Aufbau von Reportings",
  "Betreuung der Datenbank",
  "Ausbildung",
  "10/2016 - 09/2019",
  "B.Sc. Wirtschaftsinformatik",
  "Universität Freiburg",
  "Kenntnisse",
  "Analytics",
  "Power BI",
  "SQL",
  "Sprachen",
  "Deutsch (Muttersprache)",
  "Englisch (C1)",
];

describe("linesToCv", () => {
  const cv = linesToCv(SAMPLE);

  it("erkennt Name und Kontaktdaten", () => {
    expect(cv.name).toBe("Melisa Mustafovic-Brüstle");
    expect(cv.email).toBe("melisa@example.com");
    expect(cv.phone).toContain("761");
  });

  it("erkennt Berufserfahrung mit Zeitraum und Stichpunkten", () => {
    expect(cv.experience.length).toBeGreaterThan(0);
    expect(cv.experience[0]!.period).toContain("03/2025");
    expect(cv.experience[0]!.bullets.join(" ")).toContain("Reportings");
  });

  it("erkennt Ausbildung und Sprachen", () => {
    expect(cv.education.length).toBeGreaterThan(0);
    expect(cv.languages.join(" ")).toContain("Englisch");
  });

  it("liefert keine leeren Kenntnisgruppen", () => {
    expect(cv.skills.every((g) => g.items.length > 0)).toBe(true);
  });

  it("erkennt Einträge mit Zeitraum am Zeilenende", () => {
    const parsed = linesToCv([
      "Experience",
      "Data Analyst, Acme GmbH (01/2020 – 12/2022)",
      "• Built dashboards",
      "Skills",
      "Analytics: Power BI, SQL, Excel",
    ]);
    expect(parsed.experience[0]!.period).toBe("01/2020 – 12/2022");
    expect(parsed.experience[0]!.title).toBe("Data Analyst");
    expect(parsed.experience[0]!.org).toBe("Acme GmbH");
    expect(parsed.skills[0]!.items).toEqual(["Power BI", "SQL", "Excel"]);
  });

  it("bleibt bei leerer Eingabe stabil", () => {
    const empty = linesToCv([]);
    expect(empty.experience).toEqual([]);
    expect(empty.name).toBe("");
  });

});

describe("normalizeCv", () => {
  it("ergänzt fehlende Felder aus Altdaten", () => {
    const cv = normalizeCv({ name: "Test" } as never);
    expect(cv.settings.template).toBe("classic");
    expect(cv.languages).toEqual([]);
  });
});

describe("reorder", () => {
  it("verschiebt Einträge an beliebige Position", () => {
    expect(reorder(["a", "b", "c"], 0, 2)).toEqual(["b", "c", "a"]);
    expect(reorder(["a", "b", "c"], 2, 0)).toEqual(["c", "a", "b"]);
    expect(reorder(["a", "b"], 1, 1)).toEqual(["a", "b"]);
  });
});
