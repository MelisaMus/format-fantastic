import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Plus, Trash2, ImagePlus, RefreshCw, ChevronDown, Crop } from "lucide-react";
import { type CvData, type Entry, type SkillGroup, emptyEntry, emptyGroup, reorder } from "@/lib/cv";
import { cropDataUrl, dataUrlKb, fileToCompressedDataUrl, loadImage } from "@/lib/image";
import { SortableList } from "./SortableList";
import { useT } from "@/lib/i18n";

type Props = {
  data: CvData;
  onChange: (next: CvData) => void;
};

function Section({
  title,
  count,
  children,
  onAdd,
  addLabel,
}: {
  title: string;
  count?: number;
  children: React.ReactNode;
  onAdd?: () => void;
  addLabel?: string;
}) {
  const t = useT();
  const [open, setOpen] = useState(true);
  return (
    <Collapsible open={open} onOpenChange={setOpen} className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <CollapsibleTrigger className="flex items-center gap-2 rounded-md py-1 text-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
          <ChevronDown className={`size-4 transition-transform ${open ? "" : "-rotate-90"}`} aria-hidden="true" />
          <h3 className="text-lg">{title}</h3>
          {typeof count === "number" ? <span className="text-sm text-muted-foreground">({count})</span> : null}
        </CollapsibleTrigger>
        {onAdd ? (
          <Button type="button" variant="secondary" size="sm" onClick={onAdd}>
            <Plus className="size-4" aria-hidden="true" /> {addLabel ?? t.entry}
          </Button>
        ) : null}
      </div>
      <CollapsibleContent className="space-y-3">{children}</CollapsibleContent>
    </Collapsible>
  );
}

function CropDialog({
  src,
  open,
  onOpenChange,
  onDone,
}: {
  src: string;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onDone: (next: string) => void;
}) {
  const t = useT();
  const [zoom, setZoom] = useState(1);
  const [offsetX, setOffsetX] = useState(50);
  const [offsetY, setOffsetY] = useState(50);
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  const ratio = 26 / 33; // Bewerbungsfoto-Format

  useEffect(() => {
    if (!open || !src) return;
    void loadImage(src).then((img) => setSize({ w: img.naturalWidth, h: img.naturalHeight }));
  }, [open, src]);

  const rect = (() => {
    if (!size) return null;
    const maxW = Math.min(size.w, size.h * ratio);
    const w = maxW / zoom;
    const h = w / ratio;
    return {
      x: (size.w - w) * (offsetX / 100),
      y: (size.h - h) * (offsetY / 100),
      w,
      h,
    };
  })();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t.cropTitle}</DialogTitle>
          <DialogDescription>{t.cropDesc}</DialogDescription>
        </DialogHeader>
        <div className="flex gap-4">
          <div className="relative h-52 w-[10.4rem] shrink-0 overflow-hidden rounded-md border bg-muted">
            {size && rect ? (
              <img
                src={src}
                alt={t.cropPreviewAlt}
                className="absolute max-w-none"
                style={{
                  width: `${(size.w / rect.w) * 100}%`,
                  left: `${(-rect.x / rect.w) * 100}%`,
                  top: `${(-rect.y / rect.h) * 100}%`,
                  height: `${(size.h / rect.h) * 100}%`,
                }}
              />
            ) : null}
          </div>
          <div className="flex-1 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="crop-zoom">{t.zoom}</Label>
              <Slider id="crop-zoom" min={1} max={3} step={0.05} value={[zoom]} onValueChange={([v]) => setZoom(v ?? 1)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="crop-x">{t.horizontal}</Label>
              <Slider id="crop-x" min={0} max={100} value={[offsetX]} onValueChange={([v]) => setOffsetX(v ?? 50)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="crop-y">{t.vertical}</Label>
              <Slider id="crop-y" min={0} max={100} value={[offsetY]} onValueChange={([v]) => setOffsetY(v ?? 50)} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            {t.cancel}
          </Button>
          <Button
            onClick={async () => {
              if (rect) onDone(await cropDataUrl(src, rect));
              onOpenChange(false);
            }}
          >
            {t.apply}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PhotoField({ photo, onChange }: { photo: string; onChange: (next: string) => void }) {
  const t = useT();
  const inputRef = useRef<HTMLInputElement>(null);
  const [cropOpen, setCropOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const pick = async (file?: File | null) => {
    if (!file) return;
    setBusy(true);
    try {
      onChange(await fileToCompressedDataUrl(file));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex items-center gap-4">
      <div className="flex h-28 w-[5.5rem] shrink-0 items-center justify-center overflow-hidden rounded-md border bg-muted">
        {photo ? (
          <img src={photo} alt={t.photoCurrent} className="h-full w-full object-cover" />
        ) : (
          <ImagePlus className="size-6 text-muted-foreground" aria-hidden="true" />
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="photo-input">{t.photo}</Label>
        <input
          id="photo-input"
          ref={inputRef}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(e) => {
            void pick(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" size="sm" disabled={busy} onClick={() => inputRef.current?.click()}>
            {photo ? <RefreshCw className="size-4" aria-hidden="true" /> : <ImagePlus className="size-4" aria-hidden="true" />}
            {photo ? t.photoSwap : t.photoAdd}
          </Button>
          {photo ? (
            <>
              <Button type="button" variant="secondary" size="sm" onClick={() => setCropOpen(true)}>
                <Crop className="size-4" aria-hidden="true" /> {t.photoCrop}
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => onChange("")}>
                <Trash2 className="size-4" aria-hidden="true" /> {t.photoRemove}
              </Button>
            </>
          ) : null}
        </div>
        <p className="text-xs text-muted-foreground">
          {t.photoHintA}
          {photo ? ` (${t.photoHintCurrent(dataUrlKb(photo))})` : ""} {t.photoHintB}
        </p>
      </div>
      <CropDialog src={photo} open={cropOpen} onOpenChange={setCropOpen} onDone={onChange} />
    </div>
  );
}

function EntryList({
  label,
  entries,
  onChange,
}: {
  label: string;
  entries: Entry[];
  onChange: (next: Entry[]) => void;
}) {
  const t = useT();
  const update = (i: number, patch: Partial<Entry>) =>
    onChange(entries.map((e, k) => (k === i ? { ...e, ...patch } : e)));

  return (
    <Section title={label} count={entries.length} onAdd={() => onChange([...entries, emptyEntry()])}>
      {entries.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t.noEntries}</p>
      ) : null}
      <SortableList
        label={label}
        items={entries}
        getId={(e) => e.id}
        onReorder={(from, to) => onChange(reorder(entries, from, to))}
        renderItem={(e, i) => (
          <Card className="space-y-3 p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="grid flex-1 gap-2 sm:grid-cols-[10rem_1fr]">
                <Input
                  value={e.period}
                  aria-label={t.period}
                  placeholder={t.periodPlaceholder}
                  onChange={(ev) => update(i, { period: ev.target.value })}
                />
                <Input
                  value={e.title}
                  aria-label={t.positionOrDegree}
                  placeholder={t.positionPlaceholder}
                  onChange={(ev) => update(i, { title: ev.target.value })}
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={t.deleteEntry(String(e.title || i + 1))}
                onClick={() => onChange(entries.filter((_, k) => k !== i))}
              >
                <Trash2 className="size-4" aria-hidden="true" />
              </Button>
            </div>
            <Input
              value={e.org}
              aria-label={t.employer}
              placeholder={t.employerPlaceholder}
              onChange={(ev) => update(i, { org: ev.target.value })}
            />
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground" htmlFor={`bullets-${e.id}`}>
                {t.bullets}
              </Label>
              <Textarea
                id={`bullets-${e.id}`}
                rows={Math.min(10, Math.max(3, e.bullets.length + 1))}
                value={e.bullets.join("\n")}
                onChange={(ev) => update(i, { bullets: ev.target.value.split("\n") })}
              />
            </div>
          </Card>
        )}
      />
    </Section>
  );
}

function GroupList({
  label,
  groups,
  onChange,
}: {
  label: string;
  groups: SkillGroup[];
  onChange: (next: SkillGroup[]) => void;
}) {
  const t = useT();
  const update = (i: number, patch: Partial<SkillGroup>) =>
    onChange(groups.map((g, k) => (k === i ? { ...g, ...patch } : g)));

  return (
    <Section title={label} count={groups.length} addLabel={t.group} onAdd={() => onChange([...groups, emptyGroup()])}>
      <SortableList
        label={label}
        items={groups}
        getId={(g) => g.id}
        onReorder={(from, to) => onChange(reorder(groups, from, to))}
        renderItem={(g, i) => (
          <Card className="space-y-2 p-4">
            <div className="flex items-center gap-2">
              <Input
                value={g.title}
                aria-label={t.groupTitle}
                placeholder={t.title}
                onChange={(ev) => update(i, { title: ev.target.value })}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={t.deleteGroup(String(g.title || i + 1))}
                onClick={() => onChange(groups.filter((_, k) => k !== i))}
              >
                <Trash2 className="size-4" aria-hidden="true" />
              </Button>
            </div>
            <Textarea
              rows={Math.min(8, Math.max(2, g.items.length + 1))}
              aria-label={t.groupItems}
              value={g.items.join("\n")}
              placeholder={t.oneItemPerLine}
              onChange={(ev) => update(i, { items: ev.target.value.split("\n") })}
            />
          </Card>
        )}
      />
    </Section>
  );
}

export function CvEditor({ data, onChange }: Props) {
  const t = useT();
  const set = (patch: Partial<CvData>) => onChange({ ...data, ...patch });

  return (
    <div className="space-y-8">
      <Section title={t.header}>
        <PhotoField photo={data.photo ?? ""} onChange={(photo) => set({ photo })} />
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor="f-name">{t.name}</Label>
            <Input id="f-name" value={data.name} onChange={(e) => set({ name: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="f-headline">{t.headline}</Label>
            <Input id="f-headline" value={data.headline} onChange={(e) => set({ headline: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="f-address">{t.address}</Label>
            <Input id="f-address" value={data.address} onChange={(e) => set({ address: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="f-email">{t.email}</Label>
            <Input id="f-email" type="email" value={data.email} onChange={(e) => set({ email: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="f-phone">{t.phone}</Label>
            <Input id="f-phone" type="tel" value={data.phone} onChange={(e) => set({ phone: e.target.value })} />
          </div>
        </div>
        <div className="space-y-1">
          <Label htmlFor="f-summary">{t.summary}</Label>
          <Textarea id="f-summary" rows={3} value={data.summary} onChange={(e) => set({ summary: e.target.value })} />
        </div>
      </Section>

      <EntryList label={data.settings.labels.experience} entries={data.experience} onChange={(experience) => set({ experience })} />
      <EntryList label={data.settings.labels.education} entries={data.education} onChange={(education) => set({ education })} />
      <GroupList label={data.settings.labels.skills} groups={data.skills} onChange={(skills) => set({ skills })} />

      <Section title={data.settings.labels.languages}>
        <Label htmlFor="f-languages" className="sr-only">
          Sprachen
        </Label>
        <Textarea
          id="f-languages"
          rows={4}
          placeholder={t.oneLanguagePerLine}
          value={data.languages.join("\n")}
          onChange={(e) => set({ languages: e.target.value.split("\n") })}
        />
      </Section>

      <GroupList label={data.settings.labels.extras} groups={data.extras} onChange={(extras) => set({ extras })} />
    </div>
  );
}
