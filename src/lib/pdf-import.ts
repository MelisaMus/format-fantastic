import { type CvData, type Entry, emptyCv, uid } from "./cv";

const PERIOD_START =
  /^(\d{2}\/\d{4}|\d{4})(\s*[-–—]\s*(\d{2}\/\d{4}|\d{4}|aktuell|heute|present)\b)?/i;
export const COLUMN_BREAK = "\u000c";

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
  const pages: string[][] = [];

  type Piece = { x: number; end: number; y: number; h: number; s: string };

  const buildLines = (pieces: Piece[]) => {
    const rows = new Map<number, Piece[]>();
    for (const piece of pieces) {
      const key = Math.round(piece.y / 3) * 3;
      const arr = rows.get(key) ?? [];
      arr.push(piece);
      rows.set(key, arr);
    }

    const raw: { text: string; start: number; end: number; y: number; h: number }[] = [];
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
      if (clean)
        raw.push({
          text: clean,
          start: sorted[0]!.x,
          end: prevEnd,
          y,
          h: Math.max(...sorted.map((i) => i.h)),
        });
    }

    // Join visually wrapped lines: a line that reaches the column's right edge
    // continues on the next line.
    const rightEdge = Math.max(...raw.map((r) => r.end), 0);
    const gaps = raw.slice(1).map((r, i) => raw[i]!.y - r.y).filter((g) => g > 0).sort((a, b) => a - b);
    const medianGap = gaps.length ? gaps[Math.floor(gaps.length / 2)]! : 12;
    const out: string[] = [];
    let prev: (typeof raw)[number] | null = null;
    for (const row of raw) {
      const startsNewBlock =
        /^[•·▪◦*]/.test(row.text) || PERIOD_START.test(row.text) || PERIOD_END.test(row.text);
      const wrapped =
        prev &&
        !startsNewBlock &&
        prev.end > rightEdge - 14 &&
        Math.abs(row.start - prev.start) < 3 &&
        Math.abs(row.h - prev.h) < 1.5 &&
        prev.y - row.y < Math.min(prev.h * 2.2, medianGap * 1.3);
      if (wrapped && prev) {
        const keepHyphen = /-$/.test(prev.text) && /^[A-ZÄÖÜ]/.test(row.text);
        const merged: string = /-$/.test(prev.text)
          ? (keepHyphen ? prev.text : prev.text.replace(/-$/, "")) + row.text
          : `${prev.text} ${row.text}`;
        out[out.length - 1] = merged;
        prev = { ...row, text: merged, start: prev.start };
      } else {
        out.push(row.text);
        prev = row;
      }
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

    const pageLines: string[] = [];
    if (split !== null) {
      const at = split;
      pageLines.push(...buildLines(pieces.filter((i) => i.x < at)), COLUMN_BREAK);
      pageLines.push(...buildLines(pieces.filter((i) => i.x >= at)), COLUMN_BREAK);
    } else {
      pageLines.push(...buildLines(pieces), COLUMN_BREAK);
    }
    pages.push(pageLines);
  }

  // Drop page numbers and headers/footers that repeat on several pages.
  const isPageNumber = (l: string) => /^(seite\s*)?\d+(\s*(\/|von|of)\s*\d+)?$/i.test(l.trim());
  const edgeCount = new Map<string, number>();
  for (const pl of pages) {
    const body = pl.filter((l) => l !== COLUMN_BREAK);
    for (const l of [body[0], body[body.length - 1]]) {
      if (l && l.length < 90) edgeCount.set(l, (edgeCount.get(l) ?? 0) + 1);
    }
  }
  for (let i = 0; i < pages.length; i++) {
    const pl = pages[i]!;
    lines.push(
      ...pl.filter((l, k) => {
        if (l === COLUMN_BREAK) return true;
        if (isPageNumber(l)) return false;
        const atEdge = k === 0 || k === pl.length - 1 || k === pl.length - 2;
        // Keep the first line of page 1 – that is usually the name.
        if (i === 0 && k === 0) return true;
        return !(atEdge && (edgeCount.get(l) ?? 0) > 1);
      }),
    );
  }

  // Re-join words that were hyphenated across a line break.
  const merged: string[] = [];
  for (const line of lines) {
    const prev = merged[merged.length - 1];
    if (line !== COLUMN_BREAK && prev && prev !== COLUMN_BREAK && /\S-$/.test(prev) && /^[A-Za-zÄÖÜäöüß]/.test(line) && line.length < 30) {
      merged[merged.length - 1] = (/^[A-ZÄÖÜ]/.test(line) ? prev : prev.replace(/-$/, "")) + line;
    } else {
      merged.push(line);
    }
  }

  return merged;
}


const isBullet = (l: string) => /^[•·▪◦*\-–—]\s?/.test(l);
const stripBullet = (l: string) => l.replace(/^[•·▪◦*\-–—]\s?/, "").trim();

/** Matches a period written at the end of a line, e.g. "... (03/2025 – heute)". */
const PERIOD_TAIL =
  /[(\s|·–—-]\s*((?:\d{2}\/\d{4}|\d{4})\s*[-–—]\s*(?:\d{2}\/\d{4}|\d{4}|aktuell|heute|present|today|now)|(?:\d{2}\/\d{4}|\d{4}))\s*\)?\s*$/i;

/** Splits "Titel | Organisation" or "Titel, Organisation" into title and org. */
function splitTitleOrg(text: string): { title: string; org: string } {
  const sep = text.match(/^(.{3,}?)\s*(?:\||·|•|–|—|\s-\s|,\s|\bbei\s|\bat\s)\s*(.{2,})$/);
  if (!sep) return { title: text, org: "" };
  return { title: sep[1]!.trim(), org: sep[2]!.trim() };
}


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
  const intro: string[] = [];

  let sectionSeen = false;

  for (const raw of lines) {
    if (raw === COLUMN_BREAK) {
      push();
      section = null;
      continue;
    }
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
      sectionSeen = true;
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

    if (section === null && !sectionSeen) intro.push(line);
    else preamble.push(line);
  }
  push();

  const clean = [...preamble, ...intro].map((l) => l.replace(/^#+\s*/, "").trim()).filter(Boolean);

  const isNameLike = (l: string) => {
    const words = l.split(/\s+/);
    return (
      l.length <= 45 &&
      words.length >= 2 &&
      words.length <= 3 &&
      !/[\d@/:•|]/.test(l) &&
      words.every((w) => /^[A-ZÄÖÜ]/.test(w)) &&
      !/^(persönliche|kontakt|profil|lebenslauf|curriculum)/i.test(l)
    );
  };

  cv.name = clean.find(isNameLike) ?? clean[0] ?? "";

  const headline = clean.find(
    (l) => l !== cv.name && l.length > 10 && l.length <= 90 && (/[|·•]/.test(l) || l.split(/\s+/).length <= 8),
  );
  if (headline) cv.headline = headline;

  // Summary: the intro paragraph above the first section, joined back together.
  const summary = intro
    .filter((l) => l !== cv.name && l !== cv.headline)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
  if (summary.length > 40) cv.summary = summary;

  if (!cv.address) {
    const addr = clean.find((l) => /(straße|strasse|str\.|weg|platz).*\d|\d{5}\s+\w/i.test(l));
    if (addr) cv.address = addr;
  }

  cv.skills = cv.skills.filter((g) => g.items.length > 0);
  cv.extras = cv.extras.filter((g) => g.items.length > 0);

  return cv;
}

export async function parsePdfToCv(file: File): Promise<{ cv: CvData; lines: string[] }> {
  const lines = await extractLines(file);
  return { cv: linesToCv(lines), lines };
}
