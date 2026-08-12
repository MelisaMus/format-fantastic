import { type CvData, type Entry, emptyCv, uid } from "./cv";

const PERIOD_START =
  /^(\d{2}\/\d{4}|\d{4})(\s*[-–—]\s*(\d{2}\/\d{4}|\d{4}|aktuell|heute|present)\b)?/i;
const PERIOD_END = /^[-–—]\s*(\d{2}\/\d{4}|\d{4}|aktuell|heute|present)\b/i;

const SECTIONS: { key: keyof CvData | "experience" | "education" | "skills" | "languages" | "extras"; re: RegExp }[] = [
  { key: "experience", re: /^(beruflicher werdegang|berufserfahrung|erfahrung|experience|work)/i },
  { key: "education", re: /^(ausbildung|bildung|education|studium)/i },
  { key: "skills", re: /^(kenntnisse|skills|f(ä|a)higkeiten|technische kenntnisse)/i },
  { key: "languages", re: /^(sprachen|languages)/i },
  { key: "extras", re: /^(zus(ä|a)tzliche erfahrung|weiterbildungen|sonstiges|interessen|publizistische)/i },
];

/** Extracts all text lines from a PDF file in the browser. */
export async function extractLines(file: File): Promise<string[]> {
  const pdfjs = await import("pdfjs-dist");
  const workerUrl = (await import("pdfjs-dist/build/pdf.worker.min.mjs?url")).default;
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

  const buf = await file.arrayBuffer();
  const doc = await pdfjs.getDocument({ data: buf }).promise;
  const lines: string[] = [];

  type Piece = { x: number; end: number; y: number; h: number; s: string };

  const buildLines = (pieces: Piece[]) => {
    const rows = new Map<number, Piece[]>();
    for (const piece of pieces) {
      const key = Math.round(piece.y / 3) * 3;
      const arr = rows.get(key) ?? [];
      arr.push(piece);
      rows.set(key, arr);
    }
    const out: string[] = [];
    for (const y of [...rows.keys()].sort((a, b) => b - a)) {
      const sorted = rows.get(y)!.sort((a, b) => a.x - b.x);
      let text = "";
      let prevEnd = -Infinity;
      for (const piece of sorted) {
        const gap = piece.x - prevEnd;
        const needsSpace =
          text && gap > Math.max(1, piece.h * 0.22) && !/\s$/.test(text) && !/^\s/.test(piece.s);
        text += (needsSpace ? " " : "") + piece.s;
        prevEnd = piece.end;
      }
      const clean = text.replace(/\s+/g, " ").trim();
      if (clean) out.push(clean);
    }
    return out;
  };

  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);
    const width = page.getViewport({ scale: 1 }).width;
    const content = await page.getTextContent();
    const pieces: Piece[] = [];

    for (const item of content.items as {
      str: string;
      width?: number;
      height?: number;
      transform: number[];
    }[]) {
      if (!item.str || !item.str.trim()) continue;
      const x = item.transform[4] ?? 0;
      pieces.push({
        x,
        end: x + (item.width ?? 0),
        y: Math.round(item.transform[5] ?? 0),
        h: item.height || Math.abs(item.transform[3] ?? 10) || 10,
        s: item.str,
      });
    }
    if (!pieces.length) continue;

    // Detect a two-column layout by scanning for an empty vertical gutter.
    let split: number | null = null;
    for (let f = 0.3; f <= 0.7; f += 0.02) {
      const at = width * f;
      const crossing = pieces.filter((i) => i.x < at - 4 && i.end > at + 4).length;
      const right = pieces.filter((i) => i.x >= at).length;
      const left = pieces.length - right;
      if (
        crossing / pieces.length < 0.02 &&
        left / pieces.length > 0.2 &&
        right / pieces.length > 0.2
      ) {
        split = at;
        break;
      }
    }

    if (split !== null) {
      const at = split;
      lines.push(...buildLines(pieces.filter((i) => i.x < at)));
      lines.push(...buildLines(pieces.filter((i) => i.x >= at)));
    } else {
      lines.push(...buildLines(pieces));
    }
  }

  // Re-join words that were hyphenated across a line break.
  const merged: string[] = [];
  for (const line of lines) {
    const prev = merged[merged.length - 1];
    if (prev && /\S-$/.test(prev) && /^[A-Za-zÄÖÜäöüß]/.test(line) && line.length < 30) {
      merged[merged.length - 1] = prev.replace(/-$/, "") + line;
    } else {
      merged.push(line);
    }
  }

  return merged;
}


const isBullet = (l: string) => /^[•·▪◦*\-–—]\s?/.test(l);
const stripBullet = (l: string) => l.replace(/^[•·▪◦*\-–—]\s?/, "").trim();

/** Best-effort mapping of raw PDF lines into a structured CV. */
export function linesToCv(lines: string[]): CvData {
  const cv = emptyCv();
  let section: string | null = null;
  let current: Entry | null = null;

  const push = () => {
    if (!current) return;
    if (section === "education") cv.education.push(current);
    else cv.experience.push(current);
    current = null;
  };

  const preamble: string[] = [];

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;

    const email = line.match(/[\w.+-]+@[\w-]+\.[\w.]+/);
    if (email && !cv.email) cv.email = email[0];
    const phone = line.match(/(\+\d[\d\s/()-]{7,})/);
    if (phone && !cv.phone) cv.phone = phone[0].trim();
    if (/^anschrift:/i.test(line)) {
      cv.address = line.replace(/^anschrift:\s*/i, "");
      continue;
    }
    if (/^(e-?mail|telefon):/i.test(line)) continue;

    const hit = SECTIONS.find((s) => s.re.test(line.replace(/^#+\s*/, "")));
    if (hit && line.length < 60) {
      push();
      section = hit.key as string;
      if (section === "skills" || section === "extras") {
        const list = section === "skills" ? cv.skills : cv.extras;
        list.push({ id: uid(), title: line.replace(/^#+\s*/, ""), items: [] });
      }
      continue;
    }

    if (section === "experience" || section === "education") {
      const addContent = (text: string) => {
        const t = text.trim();
        if (!t || !current) return;
        if (isBullet(t)) {
          current.bullets.push(stripBullet(t));
          return;
        }
        if (!current.title) current.title = t;
        else if (current.bullets.length === 0 && !current.org) current.org = t;
        else if (current.bullets.length > 0) {
          const last = current.bullets.length - 1;
          current.bullets[last] = `${current.bullets[last]} ${t}`.replace(/\s+/g, " ");
        } else current.bullets.push(t);
      };

      const start = line.match(PERIOD_START);
      if (start) {
        push();
        current = { id: uid(), period: start[0].trim(), title: "", org: "", bullets: [] };
        addContent(line.slice(start[0].length));
        continue;
      }

      const cont = current && line.match(PERIOD_END);
      if (current && cont) {
        current.period = `${current.period} ${cont[0].trim()}`.replace(/\s+/g, " ");
        addContent(line.slice(cont[0].length));
        continue;
      }

      if (current) {
        addContent(line);
        continue;
      }
    }


    if (section === "languages") {
      cv.languages.push(stripBullet(line));
      continue;
    }

    if (section === "skills" || section === "extras") {
      const list = section === "skills" ? cv.skills : cv.extras;
      const group = list[list.length - 1];
      if (!group) continue;
      if (line.length < 40 && !isBullet(line) && group.items.length > 2) {
        list.push({ id: uid(), title: line, items: [] });
      } else {
        group.items.push(stripBullet(line));
      }
      continue;
    }

    preamble.push(line);
  }
  push();

  const clean = preamble.map((l) => l.replace(/^#+\s*/, "").trim()).filter(Boolean);

  // Name: a short, capitalised line without digits or contact markers.
  const nameCandidate = clean.find(
    (l) =>
      l.length <= 45 &&
      l.split(/\s+/).length <= 4 &&
      !/\d|@|\/|:/.test(l) &&
      /^[A-ZÄÖÜ]/.test(l) &&
      !/^(persönliche|kontakt|profil|lebenslauf|curriculum)/i.test(l),
  );
  cv.name = nameCandidate ?? clean[0] ?? "";

  // Headline: short descriptive line, often with separators.
  const headline = clean.find(
    (l) => l !== cv.name && l.length <= 90 && l.length > 10 && (/[|·•]/.test(l) || l.split(/\s+/).length <= 10),
  );
  if (headline) cv.headline = headline;

  // Summary: the longest paragraph-like line.
  const summary = clean
    .filter((l) => l !== cv.name && l !== cv.headline && l.length > 80)
    .sort((a, b) => b.length - a.length)[0];
  if (summary) cv.summary = summary;

  const contactRest = clean.filter(
    (l) => l !== cv.name && l !== cv.headline && l !== cv.summary && /straße|str\.|weg|platz|\d{5}/i.test(l),
  );
  if (!cv.address && contactRest[0]) cv.address = contactRest[0];


  return cv;
}

export async function parsePdfToCv(file: File): Promise<{ cv: CvData; lines: string[] }> {
  const lines = await extractLines(file);
  return { cv: linesToCv(lines), lines };
}
