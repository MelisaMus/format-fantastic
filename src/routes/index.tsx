import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { FileUp, Printer, RotateCcw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CvEditor } from "@/components/cv/CvEditor";
import { CvPreview } from "@/components/cv/CvPreview";
import { type CvData, clearCv, emptyCv, loadCv, saveCv } from "@/lib/cv";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CV Studio – PDF-Lebenslauf editieren & formatieren" },
      {
        name: "description",
        content:
          "Lade einen Lebenslauf als PDF hoch, bearbeite Inhalte in strukturierten Feldern und exportiere ein sauber formatiertes PDF.",
      },
      { property: "og:title", content: "CV Studio – PDF-Lebenslauf editieren" },
      {
        property: "og:description",
        content: "PDF hochladen, Text strukturiert bearbeiten, perfekt formatiertes PDF exportieren.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const [data, setData] = useState<CvData>(emptyCv());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const stored = loadCv();
    if (stored) setData(stored);
  }, []);

  const update = useCallback((next: CvData) => {
    setData(next);
    saveCv(next);
  }, []);

  const onFile = async (file: File) => {
    setBusy(true);
    setError(null);
    try {
      const { parsePdfToCv } = await import("@/lib/pdf-import");
      const { cv } = await parsePdfToCv(file);
      update(cv);
    } catch (e) {
      console.error(e);
      setError("Diese PDF konnte nicht gelesen werden. Du kannst die Inhalte manuell eintragen.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="min-h-screen bg-background">
      <header className="no-print border-b border-border bg-card/60 backdrop-blur">
        <div className="mx-auto flex max-w-[1500px] flex-wrap items-center gap-3 px-6 py-4">
          <div className="mr-auto">
            <h1 className="text-2xl leading-none">CV Studio</h1>
            <p className="text-sm text-muted-foreground">
              PDF importieren, Inhalte bearbeiten, perfekt formatiert exportieren
            </p>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void onFile(f);
              e.target.value = "";
            }}
          />
          <Button variant="secondary" onClick={() => fileRef.current?.click()} disabled={busy}>
            {busy ? <Loader2 className="size-4 animate-spin" /> : <FileUp className="size-4" />}
            PDF importieren
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              clearCv();
              setData(emptyCv());
            }}
          >
            <RotateCcw className="size-4" />
            Zurücksetzen
          </Button>
          <Button onClick={() => window.print()}>
            <Printer className="size-4" />
            Als PDF exportieren
          </Button>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1500px] gap-8 px-6 py-8 lg:grid-cols-[minmax(0,1fr)_auto]">
        <div className="no-print">
          {error ? (
            <p className="mb-4 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm">{error}</p>
          ) : null}
          <CvEditor data={data} onChange={update} />
        </div>

        <div className="lg:sticky lg:top-6 lg:h-fit">
          <div className="origin-top scale-[0.62] xl:scale-[0.78] print:scale-100">
            <CvPreview data={data} />
          </div>
        </div>
      </div>
    </main>
  );
}
