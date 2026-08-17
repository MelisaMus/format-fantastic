import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LABEL_PRESETS, type CvSettings, type SectionKey, type Template } from "@/lib/cv";

const LABEL_FIELDS: { key: SectionKey; hint: string }[] = [
  { key: "experience", hint: "Berufserfahrung" },
  { key: "education", hint: "Ausbildung" },
  { key: "skills", hint: "Kenntnisse" },
  { key: "languages", hint: "Sprachen" },
  { key: "extras", hint: "Zusätzliches" },
];

const ACCENTS = [
  { value: "#c9702f", label: "Kupfer" },
  { value: "#2d5d7c", label: "Stahlblau" },
  { value: "#3f6b4a", label: "Salbei" },
  { value: "#7a3b52", label: "Bordeaux" },
  { value: "#39424e", label: "Graphit" },
];

export function SettingsPanel({
  settings,
  onChange,
}: {
  settings: CvSettings;
  onChange: (next: CvSettings) => void;
}) {
  const set = (patch: Partial<CvSettings>) => onChange({ ...settings, ...patch });

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-1">
        <Label htmlFor="tpl">Vorlage</Label>
        <Select value={settings.template} onValueChange={(v) => set({ template: v as Template })}>
          <SelectTrigger id="tpl">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="classic">Klassisch (einspaltig)</SelectItem>
            <SelectItem value="twocol">Zweispaltig mit Seitenleiste</SelectItem>
            <SelectItem value="compact">Kompakt</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1">
        <Label htmlFor="shape">Fotoform</Label>
        <Select value={settings.photoShape} onValueChange={(v) => set({ photoShape: v as "rect" | "circle" })}>
          <SelectTrigger id="shape">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="rect">Rechteckig</SelectItem>
            <SelectItem value="circle">Rund</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Akzentfarbe</Label>
        <div className="flex gap-2">
          {ACCENTS.map((a) => (
            <button
              key={a.value}
              type="button"
              onClick={() => set({ accent: a.value })}
              aria-label={`Akzentfarbe ${a.label}`}
              aria-pressed={settings.accent === a.value}
              className={`size-11 rounded-full border-2 ${
                settings.accent === a.value ? "border-foreground" : "border-transparent"
              }`}
            >
              <span className="block size-full rounded-full" style={{ backgroundColor: a.value }} />
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="scale">Schriftgröße ({Math.round(settings.fontScale * 100)} %)</Label>
        <Slider
          id="scale"
          min={0.85}
          max={1.2}
          step={0.05}
          value={[settings.fontScale]}
          onValueChange={([v]) => set({ fontScale: v ?? 1 })}
        />
      </div>

      <div className="space-y-3 sm:col-span-2">
        <div className="flex flex-wrap items-center gap-2">
          <Label className="mr-2">Überschriften / Section titles</Label>
          <Button type="button" variant="secondary" size="sm" onClick={() => set({ labels: { ...LABEL_PRESETS.de } })}>
            Deutsch
          </Button>
          <Button type="button" variant="secondary" size="sm" onClick={() => set({ labels: { ...LABEL_PRESETS.en } })}>
            English
          </Button>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {LABEL_FIELDS.map((f) => (
            <div key={f.key} className="space-y-1">
              <Label htmlFor={`label-${f.key}`} className="text-xs text-muted-foreground">
                {f.hint}
              </Label>
              <Input
                id={`label-${f.key}`}
                value={settings.labels[f.key]}
                onChange={(e) => set({ labels: { ...settings.labels, [f.key]: e.target.value } })}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3 sm:col-span-2">
        <Switch
          id="guides"
          checked={settings.showPageGuides}
          onCheckedChange={(v) => set({ showPageGuides: v })}
        />
        <Label htmlFor="guides">Seitenumbrüche in der Vorschau anzeigen</Label>
      </div>
    </div>
  );
}
