import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Plus, Trash2, ChevronUp, ChevronDown } from "lucide-react";
import { type CvData, type Entry, type SkillGroup, emptyEntry, emptyGroup } from "@/lib/cv";

type Props = {
  data: CvData;
  onChange: (next: CvData) => void;
};

const move = <T,>(arr: T[], i: number, dir: -1 | 1): T[] => {
  const j = i + dir;
  if (j < 0 || j >= arr.length) return arr;
  const copy = [...arr];
  const [item] = copy.splice(i, 1);
  copy.splice(j, 0, item as T);
  return copy;
};

function RowTools({ onUp, onDown, onDelete }: { onUp: () => void; onDown: () => void; onDelete: () => void }) {
  return (
    <div className="flex gap-1">
      <Button type="button" variant="ghost" size="icon" onClick={onUp} aria-label="Nach oben">
        <ChevronUp className="size-4" />
      </Button>
      <Button type="button" variant="ghost" size="icon" onClick={onDown} aria-label="Nach unten">
        <ChevronDown className="size-4" />
      </Button>
      <Button type="button" variant="ghost" size="icon" onClick={onDelete} aria-label="Löschen">
        <Trash2 className="size-4" />
      </Button>
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
  const update = (i: number, patch: Partial<Entry>) =>
    onChange(entries.map((e, k) => (k === i ? { ...e, ...patch } : e)));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg">{label}</h3>
        <Button type="button" variant="secondary" size="sm" onClick={() => onChange([...entries, emptyEntry()])}>
          <Plus className="size-4" /> Eintrag
        </Button>
      </div>
      {entries.map((e, i) => (
        <Card key={e.id} className="space-y-3 p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="grid flex-1 gap-2 sm:grid-cols-[10rem_1fr]">
              <Input
                value={e.period}
                placeholder="03/2025 - aktuell"
                onChange={(ev) => update(i, { period: ev.target.value })}
              />
              <Input
                value={e.title}
                placeholder="Position / Abschluss"
                onChange={(ev) => update(i, { title: ev.target.value })}
              />
            </div>
            <RowTools
              onUp={() => onChange(move(entries, i, -1))}
              onDown={() => onChange(move(entries, i, 1))}
              onDelete={() => onChange(entries.filter((_, k) => k !== i))}
            />
          </div>
          <Input
            value={e.org}
            placeholder="Arbeitgeber / Institution, Ort"
            onChange={(ev) => update(i, { org: ev.target.value })}
          />
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Stichpunkte (eine Zeile je Punkt)</Label>
            <Textarea
              rows={Math.min(10, Math.max(3, e.bullets.length + 1))}
              value={e.bullets.join("\n")}
              onChange={(ev) => update(i, { bullets: ev.target.value.split("\n") })}
            />
          </div>
        </Card>
      ))}
    </div>
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
  const update = (i: number, patch: Partial<SkillGroup>) =>
    onChange(groups.map((g, k) => (k === i ? { ...g, ...patch } : g)));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg">{label}</h3>
        <Button type="button" variant="secondary" size="sm" onClick={() => onChange([...groups, emptyGroup()])}>
          <Plus className="size-4" /> Gruppe
        </Button>
      </div>
      {groups.map((g, i) => (
        <Card key={g.id} className="space-y-2 p-4">
          <div className="flex items-center gap-2">
            <Input value={g.title} placeholder="Titel" onChange={(ev) => update(i, { title: ev.target.value })} />
            <RowTools
              onUp={() => onChange(move(groups, i, -1))}
              onDown={() => onChange(move(groups, i, 1))}
              onDelete={() => onChange(groups.filter((_, k) => k !== i))}
            />
          </div>
          <Textarea
            rows={Math.min(8, Math.max(2, g.items.length + 1))}
            value={g.items.join("\n")}
            placeholder="Ein Eintrag je Zeile"
            onChange={(ev) => update(i, { items: ev.target.value.split("\n") })}
          />
        </Card>
      ))}
    </div>
  );
}

export function CvEditor({ data, onChange }: Props) {
  const set = (patch: Partial<CvData>) => onChange({ ...data, ...patch });

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <h3 className="text-lg">Kopfbereich</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <Label>Name</Label>
            <Input value={data.name} onChange={(e) => set({ name: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label>Untertitel</Label>
            <Input value={data.headline} onChange={(e) => set({ headline: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label>Anschrift</Label>
            <Input value={data.address} onChange={(e) => set({ address: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label>E-Mail</Label>
            <Input value={data.email} onChange={(e) => set({ email: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label>Telefon</Label>
            <Input value={data.phone} onChange={(e) => set({ phone: e.target.value })} />
          </div>
        </div>
        <div className="space-y-1">
          <Label>Kurzprofil</Label>
          <Textarea rows={3} value={data.summary} onChange={(e) => set({ summary: e.target.value })} />
        </div>
      </div>

      <EntryList label="Beruflicher Werdegang" entries={data.experience} onChange={(experience) => set({ experience })} />
      <EntryList label="Ausbildung" entries={data.education} onChange={(education) => set({ education })} />
      <GroupList label="Kenntnisse" groups={data.skills} onChange={(skills) => set({ skills })} />

      <div className="space-y-2">
        <h3 className="text-lg">Sprachen</h3>
        <Textarea
          rows={4}
          placeholder="Eine Sprache je Zeile"
          value={data.languages.join("\n")}
          onChange={(e) => set({ languages: e.target.value.split("\n") })}
        />
      </div>

      <GroupList label="Zusätzliche Erfahrung" groups={data.extras} onChange={(extras) => set({ extras })} />
    </div>
  );
}
