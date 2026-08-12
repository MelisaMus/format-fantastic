export type CropRect = { x: number; y: number; w: number; h: number };

/**
 * Reads an image file, optionally crops it, and re-encodes it as a small JPEG
 * data URL so that localStorage (~5 MB) never overflows.
 */
export async function fileToCompressedDataUrl(
  file: File,
  opts: { maxWidth?: number; maxHeight?: number; quality?: number } = {},
): Promise<string> {
  // Print needs ~300 dpi: 26 x 33 mm => roughly 310 x 390 px minimum.
  // We keep a generous reserve so cropping/zooming stays sharp.
  const { maxWidth = 1200, maxHeight = 1600, quality = 0.94 } = opts;
  const dataUrl = await readAsDataUrl(file);
  const img = await loadImage(dataUrl);
  const scale = Math.min(1, maxWidth / img.width, maxHeight / img.height);
  const w = Math.max(1, Math.round(img.width * scale));
  const h = Math.max(1, Math.round(img.height * scale));
  if (scale === 1 && /^data:image\/(jpeg|png)/.test(dataUrl)) return dataUrl;
  return drawToDataUrl(img, { sx: 0, sy: 0, sw: img.width, sh: img.height }, w, h, quality);
}

/** Crops a data URL to the given rectangle (in source pixels) and re-encodes it. */
export async function cropDataUrl(src: string, rect: CropRect, quality = 0.94): Promise<string> {
  const img = await loadImage(src);
  const w = Math.max(1, Math.round(rect.w));
  const h = Math.max(1, Math.round(rect.h));
  return drawToDataUrl(img, { sx: rect.x, sy: rect.y, sw: rect.w, sh: rect.h }, w, h, quality);
}

/** High quality resize: step down in halves to avoid aliasing, then encode. */
function drawToDataUrl(
  img: HTMLImageElement,
  src: { sx: number; sy: number; sw: number; sh: number },
  targetW: number,
  targetH: number,
  quality: number,
): string {
  let curW = Math.max(1, Math.round(src.sw));
  let curH = Math.max(1, Math.round(src.sh));
  let canvas = document.createElement("canvas");
  canvas.width = curW;
  canvas.height = curH;
  let ctx = canvas.getContext("2d");
  if (!ctx) return "";
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, src.sx, src.sy, src.sw, src.sh, 0, 0, curW, curH);

  while (curW / 2 > targetW && curH / 2 > targetH) {
    const nextW = Math.max(targetW, Math.round(curW / 2));
    const nextH = Math.max(targetH, Math.round(curH / 2));
    const next = document.createElement("canvas");
    next.width = nextW;
    next.height = nextH;
    const nctx = next.getContext("2d");
    if (!nctx) break;
    nctx.imageSmoothingEnabled = true;
    nctx.imageSmoothingQuality = "high";
    nctx.drawImage(canvas, 0, 0, curW, curH, 0, 0, nextW, nextH);
    canvas = next;
    ctx = nctx;
    curW = nextW;
    curH = nextH;
  }

  if (curW !== targetW || curH !== targetH) {
    const final = document.createElement("canvas");
    final.width = targetW;
    final.height = targetH;
    const fctx = final.getContext("2d");
    if (fctx) {
      fctx.imageSmoothingEnabled = true;
      fctx.imageSmoothingQuality = "high";
      fctx.drawImage(canvas, 0, 0, curW, curH, 0, 0, targetW, targetH);
      canvas = final;
    }
  }
  return canvas.toDataURL("image/jpeg", quality);
}


export function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("Datei konnte nicht gelesen werden."));
    reader.readAsDataURL(file);
  });
}

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Bild konnte nicht geladen werden."));
    img.src = src;
  });
}

/** Rough size of a data URL in kilobytes. */
export const dataUrlKb = (src: string) => Math.round((src.length * 0.75) / 1024);
