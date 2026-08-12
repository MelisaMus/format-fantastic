import { useEffect, useRef, useState, type ReactNode } from "react";

const PAGE_MM = 297;

/** Wraps the A4 sheet and draws page break guides plus a page counter. */
export function PreviewFrame({ children, showGuides }: { children: ReactNode; showGuides: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const [pages, setPages] = useState(1);
  const [pageHeightPx, setPageHeightPx] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const probe = document.createElement("div");
    probe.style.height = `${PAGE_MM}mm`;
    probe.style.position = "absolute";
    probe.style.visibility = "hidden";
    el.appendChild(probe);
    const measure = () => {
      const pageH = probe.offsetHeight || 1; // offsetHeight ignores CSS scale of the wrapper
      setPageHeightPx(pageH);
      setPages(Math.max(1, Math.ceil((el.scrollHeight - 12) / pageH)));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => {
      ro.disconnect();
      probe.remove();
    };
  }, [children]);

  return (
    <div className="space-y-2">
      <p className="no-print text-sm text-muted-foreground" aria-live="polite">
        {pages === 1 ? "1 Seite" : `${pages} Seiten`}
      </p>
      <div ref={ref} className="relative">
        {children}
        {showGuides && pageHeightPx > 0
          ? Array.from({ length: Math.max(0, pages - 1) }, (_, i) => (
              <div
                key={i}
                aria-hidden="true"
                className="no-print pointer-events-none absolute left-0 right-0 border-t-2 border-dashed border-destructive/60"
                style={{ top: pageHeightPx * (i + 1) }}
              >
                <span className="absolute right-1 top-1 rounded bg-destructive/10 px-1 text-[10px] text-destructive">
                  Seitenumbruch {i + 1}
                </span>
              </div>
            ))
          : null}
      </div>
    </div>
  );
}
