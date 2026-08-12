import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FileUp,
  Printer,
  RotateCcw,
  Loader2,
  Undo2,
  Redo2,
  Download,
  Upload,
  Copy,
  Plus,
  Trash2,
  Check,
  FileDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { CvEditor } from "@/components/cv/CvEditor";
import { CvPreview } from "@/components/cv/CvPreview";
import { PreviewFrame } from "@/components/cv/PreviewFrame";
import { SettingsPanel } from "@/components/cv/SettingsPanel";
import { useHistory } from "@/hooks/use-history";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  type CvData,
  type CvStore,
  type Profile,
  clearStore,
  emptyProfile,
  emptyStore,
  loadStore,
  normalizeCv,
  saveStore,
  uid,
} from "@/lib/cv";

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
  const isMobile = useIsMobile();
  const history = useHistory<CvStore>(emptyStore());
  const store = history.state;
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rawLines, setRawLines] = useState<string[] | null>(null);
  const [saved, setSaved] = useState(false);
  const pdfRef = useRef<HTMLInputElement>(null);
  const jsonRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const stored = loadStore();
    if (stored) history.reset(stored);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const active: Profile = useMemo(
    () => store.profiles.find((p) => p.id === store.activeId) ?? store.profiles[0]!,
    [store],
  );

  const commit = useCallback(
    (next: CvStore, opts?: { merge?: boolean }) => {
      history.set(next, opts);
      const res = saveStore(next);
      if (res.ok) {
        setSaved(true);
        setError(null);
        window.setTimeout(() => setSaved(false), 1500);
      } else {
        setError(res.error);
      }
    },
    [history],
  );

  const updateActive = useCallback(
    (data: CvData, opts?: { merge?: boolean }) => {
      commit(
        {
          ...store,
          profiles: store.profiles.map((p) => (p.id === active.id ? { ...p, data, updatedAt: Date.now() } : p)),
        },
        opts,
      );
    },
    [commit, store, active],
  );

  const onPdf = async (file: File) => {
    setBusy(true);
    setError(null);
    setRawLines(null);
    try {
      const { parsePdfToCv } = await import("@/lib/pdf-import");
      const { cv, lines } = await parsePdfToCv(file);
      const next = normalizeCv(cv);
      const empty =
        next.experience.length === 0 && next.education.length === 0 && next.skills.length === 0 && !next.name;
      if (empty) {
        setError(
          "In dieser PDF wurde kein durchsuchbarer Text gefunden (vermutlich ein Scan). Unten findest du – falls vorhanden – die erkannten Zeilen zum Kopieren.",
        );
      }
      setRawLines(lines);
      updateActive(
        { ...next, photo: next.photo || active.data.photo, settings: active.data.settings },
        { merge: false },
      );
    } catch (e) {
      console.error(e);
      setError("Diese PDF konnte nicht gelesen werden. Du kannst die Inhalte manuell eintragen.");
    } finally {
      setBusy(false);
    }
  };

  const onJson = async (file: File) => {
    try {
      const parsed = JSON.parse(await file.text()) as Partial<CvStore> & Partial<Profile>;
      if (Array.isArray((parsed as CvStore).profiles)) {
        const s = parsed as CvStore;
        commit(
          {
            activeId: s.profiles[0]!.id,
            profiles: s.profiles.map((p) => ({ ...p, id: p.id || uid(), data: normalizeCv(p.data) })),
          },
          { merge: false },
        );
      } else {
        const p = emptyProfile("Import");
        p.data = normalizeCv((parsed as Profile).data ?? (parsed as unknown as CvData));
        commit({ activeId: p.id, profiles: [...store.profiles, p] }, { merge: false });
      }
      setStatus("Backup importiert.");
    } catch {
      setError("Die JSON-Datei konnte nicht gelesen werden.");
    }
  };

  const downloadJson = () => {
    const blob = new Blob([JSON.stringify(store, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "cv-studio-backup.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPdf = async () => {
    setBusy(true);
    setError(null);
    try {
      const { exportCvToPdf, downloadBlob, safeFileName } = await import("@/lib/pdf-export");
      const blob = await exportCvToPdf(active.data);
      downloadBlob(blob, `${safeFileName(active.data.name || active.name)}.pdf`);
      setStatus("PDF erstellt.");
    } catch (e) {
      console.error(e);
      setError("PDF-Export fehlgeschlagen – nutze alternativ „Drucken“.");
    } finally {
      setBusy(false);
    }
  };

  const addProfile = (from?: Profile) => {
    const p = emptyProfile(from ? `${from.name} (Kopie)` : `Lebenslauf ${store.profiles.length + 1}`);
    if (from) p.data = normalizeCv(structuredClone(from.data));
    commit({ activeId: p.id, profiles: [...store.profiles, p] }, { merge: false });
  };

  const removeProfile = () => {
    if (store.profiles.length <= 1) {
      commit({ ...emptyStore() }, { merge: false });
      return;
    }
    const rest = store.profiles.filter((p) => p.id !== active.id);
    commit({ activeId: rest[0]!.id, profiles: rest }, { merge: false });
  };

  const editor = <CvEditor data={active.data} onChange={(d) => updateActive(d)} />;
  const settingsPanel = (
    <SettingsPanel
      settings={active.data.settings}
      onChange={(settings) => updateActive({ ...active.data, settings }, { merge: false })}
    />
  );
  const rawPanel = rawLines?.length ? (
    <Card className="space-y-2 p-4">
      <h3 className="text-lg">Erkannter Rohtext</h3>
      <p className="text-sm text-muted-foreground">
        Falls die Zuordnung nicht passt, kannst du Textteile hier herauskopieren.
      </p>
      <Label htmlFor="raw" className="sr-only">
        Erkannter Rohtext
      </Label>
      <textarea
        id="raw"
        readOnly
        rows={12}
        className="w-full rounded-md border bg-muted/40 p-2 font-mono text-xs"
        value={rawLines.join("\n")}
      />
    </Card>
  ) : null;
  const preview = (
    <PreviewFrame showGuides={active.data.settings.showPageGuides}>
      <CvPreview data={active.data} />
    </PreviewFrame>
  );

  return (
    <main className="min-h-dvh bg-background">
      <header className="no-print border-b border-border bg-card/60 backdrop-blur">
        <div className="mx-auto flex max-w-[1500px] flex-wrap items-center gap-3 px-6 py-4">
          <div className="mr-auto">
            <h1 className="text-2xl leading-none">CV Studio</h1>
            <p className="text-sm text-muted-foreground">
              PDF importieren, Inhalte bearbeiten, perfekt formatiert exportieren
            </p>
          </div>

          <span className="flex items-center gap-1 text-sm text-muted-foreground" aria-live="polite">
            {saved ? (
              <>
                <Check className="size-4" aria-hidden="true" /> Gespeichert
              </>
            ) : null}
          </span>

          <Button variant="ghost" size="icon" aria-label="Rückgängig" disabled={!history.canUndo} onClick={history.undo}>
            <Undo2 className="size-4" aria-hidden="true" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Wiederherstellen"
            disabled={!history.canRedo}
            onClick={history.redo}
          >
            <Redo2 className="size-4" aria-hidden="true" />
          </Button>

          <input
            ref={pdfRef}
            type="file"
            accept="application/pdf"
            className="sr-only"
            aria-label="PDF-Datei auswählen"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void onPdf(f);
              e.target.value = "";
            }}
          />
          <input
            ref={jsonRef}
            type="file"
            accept="application/json"
            className="sr-only"
            aria-label="JSON-Backup auswählen"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void onJson(f);
              e.target.value = "";
            }}
          />
          <Button variant="secondary" onClick={() => pdfRef.current?.click()} disabled={busy}>
            {busy ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <FileUp className="size-4" aria-hidden="true" />}
            PDF importieren
          </Button>
          <Button variant="ghost" onClick={downloadJson}>
            <Download className="size-4" aria-hidden="true" /> Backup
          </Button>
          <Button variant="ghost" onClick={() => jsonRef.current?.click()}>
            <Upload className="size-4" aria-hidden="true" /> Backup laden
          </Button>
          <Button variant="ghost" onClick={() => window.print()}>
            <Printer className="size-4" aria-hidden="true" /> Drucken
          </Button>
          <Button onClick={() => void exportPdf()} disabled={busy}>
            <FileDown className="size-4" aria-hidden="true" /> PDF exportieren
          </Button>
        </div>

        <div className="mx-auto flex max-w-[1500px] flex-wrap items-end gap-3 px-6 pb-4">
          <div className="space-y-1">
            <Label htmlFor="profile-select">Profil</Label>
            <Select
              value={active.id}
              onValueChange={(id) => commit({ ...store, activeId: id }, { merge: false })}
            >
              <SelectTrigger id="profile-select" className="min-w-56">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {store.profiles.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="profile-name">Profilname</Label>
            <Input
              id="profile-name"
              value={active.name}
              onChange={(e) =>
                commit({
                  ...store,
                  profiles: store.profiles.map((p) => (p.id === active.id ? { ...p, name: e.target.value } : p)),
                })
              }
            />
          </div>
          <Button variant="secondary" onClick={() => addProfile()}>
            <Plus className="size-4" aria-hidden="true" /> Neu
          </Button>
          <Button variant="secondary" onClick={() => addProfile(active)}>
            <Copy className="size-4" aria-hidden="true" /> Duplizieren
          </Button>
          <Button variant="ghost" onClick={removeProfile}>
            <Trash2 className="size-4" aria-hidden="true" /> Löschen
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              clearStore();
              history.reset(emptyStore());
            }}
          >
            <RotateCcw className="size-4" aria-hidden="true" /> Alles zurücksetzen
          </Button>
        </div>
      </header>

      <div className="mx-auto max-w-[1500px] px-6 py-8">
        {error ? (
          <p role="alert" className="mb-4 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm">
            {error}
          </p>
        ) : null}
        {status ? (
          <p className="mb-4 rounded-md border border-border bg-muted p-3 text-sm" aria-live="polite">
            {status}
          </p>
        ) : null}

        {/* Mobil: Umschalter, ab lg: nebeneinander – immer nur eine Editor-Instanz */}
        {isMobile ? (
          <Tabs defaultValue="editor">
            <TabsList className="no-print mb-4 w-full">
              <TabsTrigger value="editor" className="flex-1">
                Bearbeiten
              </TabsTrigger>
              <TabsTrigger value="preview" className="flex-1">
                Vorschau
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex-1">
                Layout
              </TabsTrigger>
            </TabsList>
            <TabsContent value="editor" className="no-print">
              {editor}
              {rawPanel}
            </TabsContent>
            <TabsContent value="preview">
              <div className="origin-top scale-[0.42] sm:scale-[0.62] print:scale-100">{preview}</div>
            </TabsContent>
            <TabsContent value="settings" className="no-print">
              {settingsPanel}
            </TabsContent>
          </Tabs>
        ) : (
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto]">
            <div className="no-print space-y-8">
              <Card className="p-4">{settingsPanel}</Card>
              {editor}
              {rawPanel}
            </div>
            <div className="lg:sticky lg:top-6 lg:h-fit">
              <div className="origin-top scale-[0.62] xl:scale-[0.78] print:scale-100">{preview}</div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
