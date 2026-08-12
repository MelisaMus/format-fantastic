import type { CvData, Entry, SkillGroup } from "./cv";

const A4 = { w: 595.28, h: 841.89 };
const MM = 2.834645;
/** Wie in der Editiermaske: der Export ist immer mindestens 3 Seiten lang. */
const MIN_PAGES = 3;

const sanitize = (s: string) =>
  (s ?? "")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/\u2026/g, "...")
    .replace(/[^\u0000-\u00ff\u2013\u2014\u20ac\u2022]/g, "");

function hexToRgb(hex: string) {
  const m = /^#?([\da-f]{6})$/i.exec(hex.trim());
  const n = m ? parseInt(m[1]!, 16) : 0xc9702f;
  return { r: ((n >> 16) & 255) / 255, g: ((n >> 8) & 255) / 255, b: (n & 255) / 255 };
}

/** Crops a data URL to the given aspect ratio (centered), like CSS object-cover. */
async function coverCrop(dataUrl: string, aspect: number): Promise<string> {
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = reject;
    el.src = dataUrl;
  });
  const srcAspect = img.width / img.height;
  let sw = img.width;
  let sh = img.height;
  if (srcAspect > aspect) sw = img.height * aspect;
  else sh = img.width / aspect;
  const sx = (img.width - sw) / 2;
  const sy = (img.height - sh) / 2;
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(sw);
  canvas.height = Math.round(sh);
  const ctx = canvas.getContext("2d");
  if (!ctx) return dataUrl;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.95);
}



/**
 * Renders the CV to a real PDF with pdf-lib so the output is identical in
 * every browser (no print dialog margins or headers).
 */
export async function exportCvToPdf(data: CvData): Promise<Blob> {
  const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib");
  const doc = await PDFDocument.create();
  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const italic = await doc.embedFont(StandardFonts.HelveticaOblique);

  const accentRgb = hexToRgb(data.settings?.accent ?? "#c9702f");
  const accent = rgb(accentRgb.r, accentRgb.g, accentRgb.b);
  const ink = rgb(0.11, 0.14, 0.19);
  const muted = rgb(0.38, 0.42, 0.48);
  const rule = rgb(0.85, 0.82, 0.77);

  const scale = data.settings?.fontScale ?? 1;
  const base = 10 * scale;
  // Seitenränder: 2 cm auf allen Seiten.
  const marginX = 20 * MM;
  const marginY = 20 * MM;
  const contentW = A4.w - marginX * 2;

  let page = doc.addPage([A4.w, A4.h]);
  let y = A4.h - marginY;
  let pageIndex = 0;

  const newPage = () => {
    page = doc.addPage([A4.w, A4.h]);
    y = A4.h - marginY;
    pageIndex += 1;
  };
  const need = (h: number) => {
    if (y - h < marginY) newPage();
  };


  const wrap = (text: string, font: typeof regular, size: number, width: number) => {
    const words = sanitize(text).split(/\s+/).filter(Boolean);
    const lines: string[] = [];
    let line = "";
    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(candidate, size) > width && line) {
        lines.push(line);
        line = word;
      } else line = candidate;
    }
    if (line) lines.push(line);
    return lines.length ? lines : [""];
  };

  const drawText = (
    text: string,
    opts: { x: number; size?: number; font?: typeof regular; color?: typeof ink; width?: number; leading?: number },
  ) => {
    const size = opts.size ?? base;
    const font = opts.font ?? regular;
    const width = opts.width ?? contentW - (opts.x - marginX);
    const leading = opts.leading ?? size * 1.35;
    for (const line of wrap(text, font, size, width)) {
      need(leading);
      page.drawText(line, { x: opts.x, y: y - size, size, font, color: opts.color ?? ink });
      y -= leading;
    }
  };

  // Header ------------------------------------------------------------------
  const photo = data.photo;
  const circle = data.settings?.photoShape === "circle";
  // Same box as the editor preview: 28x35mm (rect) or 30x30mm (circle).
  const photoW = (circle ? 30 : 28) * MM;
  const photoH = (circle ? 30 : 35) * MM;
  const headerW = photo ? contentW - photoW - 6 * MM : contentW;

  if (photo) {
    try {
      // Cover-crop to the box aspect ratio (like object-cover in the preview).
      const cropped = await coverCrop(photo, photoW / photoH);
      const bytes = Uint8Array.from(atob(cropped.split(",")[1] ?? ""), (c) => c.charCodeAt(0));
      const img = cropped.startsWith("data:image/png")
        ? await doc.embedPng(bytes)
        : await doc.embedJpg(bytes);
      page.drawImage(img, {
        x: marginX + contentW - photoW,
        y: y - photoH,
        width: photoW,
        height: photoH,
      });
    } catch {
      /* unsupported image – skip */
    }
  }



  const headerTop = y;
  drawText(data.name || "Dein Name", { x: marginX, size: 22 * scale, font: bold, width: headerW });
  if (data.headline) drawText(data.headline.toUpperCase(), { x: marginX, size: base, color: accent, width: headerW });
  const contact = [data.address, data.email, data.phone].filter(Boolean).join("   ");
  if (contact) drawText(contact, { x: marginX, size: base - 1, color: muted, width: headerW });

  y = Math.min(y, headerTop - (photo ? photoH : 0)) - 6;
  need(12);
  page.drawLine({
    start: { x: marginX, y },
    end: { x: marginX + contentW, y },
    thickness: 1,
    color: accent,
  });
  y -= 14;

  if (data.summary) {
    drawText(data.summary, { x: marginX, size: base });
    y -= 6;
  }

  const heading = (title: string) => {
    // Reserve heading + rule + at least one line of the following block so a
    // section title never ends up alone at the bottom of a page.
    need(base * 4.5);
    const atPageTop = y > A4.h - marginY - 1;
    if (!atPageTop) y -= base * 1.5; // consistent air above every section title
    page.drawText(sanitize(title.toUpperCase()), {
      x: marginX,
      y: y - base,
      size: base + 1,
      font: bold,
      color: rgb(0.18, 0.23, 0.3),
    });
    y -= base + 5;
    page.drawLine({ start: { x: marginX, y }, end: { x: marginX + contentW, y }, thickness: 0.6, color: rule });
    y -= base * 0.9;
  };


  const entryBlock = (e: Entry) => {
    const periodW = 30 * MM;
    const bodyX = marginX + periodW + 4 * MM;
    const bodyW = contentW - periodW - 4 * MM;
    need(30);
    const top = y;
    if (e.period) {
      for (const line of wrap(e.period, regular, base - 1, periodW)) {
        page.drawText(line, { x: marginX, y: y - (base - 1), size: base - 1, font: regular, color: muted });
        y -= (base - 1) * 1.3;
      }
    }
    const afterPeriod = y;
    y = top;
    if (e.title) drawText(e.title, { x: bodyX, size: base, font: bold, width: bodyW });
    if (e.org) drawText(e.org, { x: bodyX, size: base - 1, font: italic, color: muted, width: bodyW });
    for (const bullet of e.bullets.filter((b) => b.trim())) {
      const lines = wrap(bullet, regular, base, bodyW - 10);
      lines.forEach((line, i) => {
        need(base * 1.35);
        if (i === 0) page.drawText("\u2022", { x: bodyX, y: y - base, size: base, font: regular, color: muted });
        page.drawText(line, { x: bodyX + 10, y: y - base, size: base, font: regular, color: ink });
        y -= base * 1.35;
      });
    }
    y = Math.min(y, afterPeriod) - base * 0.9;
  };

  const groupBlock = (g: SkillGroup, asList: boolean) => {
    need(base * 3);
    if (g.title) drawText(g.title, { x: marginX, size: base, font: bold });
    if (asList) {
      for (const item of g.items.filter(Boolean)) drawText(`\u2022 ${item}`, { x: marginX + 8, size: base - 0.5 });
    } else {
      drawText(g.items.filter(Boolean).join(" \u00b7 "), { x: marginX, size: base - 0.5, color: muted });
    }
    y -= base * 0.6;
  };


  if (data.experience.length) {
    heading("Beruflicher Werdegang");
    data.experience.forEach(entryBlock);
  }
  if (data.education.length) {
    heading("Ausbildung");
    data.education.forEach(entryBlock);
  }
  if (data.skills.length) {
    heading("Kenntnisse");
    data.skills.forEach((g) => groupBlock(g, false));
  }
  if (data.languages.filter(Boolean).length) {
    heading("Sprachen");
    drawText(data.languages.filter(Boolean).join(" \u00b7 "), { x: marginX, size: base });
  }
  if (data.extras.length) {
    heading("Zusätzliche Erfahrung");
    data.extras.forEach((g) => groupBlock(g, true));
  }

  // Der Export spiegelt die Länge der Editiermaske (mindestens 3 A4-Seiten).
  while (doc.getPageCount() < MIN_PAGES) doc.addPage([A4.w, A4.h]);

  const bytes = await doc.save();
  return new Blob([bytes as BlobPart], { type: "application/pdf" });
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Revoke later so the browser can finish reading the blob.
  window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

export const safeFileName = (name: string) =>
  (name.trim() || "lebenslauf").replace(/[^\w\-À-ÿ]+/g, "_").replace(/^_+|_+$/g, "");
