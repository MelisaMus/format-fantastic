import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LABEL_PRESETS, type CvSettings, type SectionKey, type Template } from "@/lib/cv";
import { useI18n } from "@/lib/i18n";

const LABEL_KEYS: SectionKey[] = ["experience", "education", "skills", "languages", "extras"];

const ACCENTS = [
  { value: "#c9702f", key: "accentCopper" },
  { value: "#2d5d7c", key: "accentSteel" },
  { value: "#3f6b4a", key: "accentSage" },
  { value: "#7a3b52", key: "accentBordeaux" },
  { value: "#39424e", key: "accentGraphite" },
] as const;

export function SettingsPanel({
  settings,
  onChange,
}: {
  settings: CvSettings;
  onChange: (next: CvSettings) => void;
}) {
  const { t, lang, setLang } = useI18n();
  const hints: Record<SectionKey, string> = {
    experience: t.hintExperience,
    education: t.hintEducation,
    skills: t.hintSkills,
    languages: t.hintLanguages,
    extras: t.hintExtras,
  };
  const _lang = lang;
  const set = (patch: Partial<CvSettings>) => onChange({ ...settings, ...patch });

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-1">
        <Label htmlFor="tpl">{t.template}</Label>
        <Select value={settings.template} onValueChange={(v) => set({ template: v as Template })}>
          <SelectTrigger id="tpl">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="classic">{t.tplClassic}</SelectItem>
            <SelectItem value="twocol">{t.tplTwocol}</SelectItem>
            <SelectItem value="compact">{t.tplCompact}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1">
        <Label htmlFor="shape">{t.photoShape}</Label>
        <Select value={settings.photoShape} onValueChange={(v) => set({ photoShape: v as "rect" | "circle" })}>
          <SelectTrigger id="shape">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="rect">{t.shapeRect}</SelectItem>
            <SelectItem value="circle">{t.shapeCircle}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>{t.accent}</Label>
        <div className="flex gap-2">
          {ACCENTS.map((a) => (
            <button
              key={a.value}
              type="button"
              onClick={() => set({ accent: a.value })}
              aria-label={`${t.accent}: ${t[a.key]}`}
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
        <Label htmlFor="scale">{t.fontSize(Math.round(settings.fontScale * 100))}</Label>
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
          <Label className="mr-2">{t.sectionTitles}</Label>
          <Button type="button" variant="secondary" size="sm" onClick={() => {
              setLang("de");
              set({ labels: { ...LABEL_PRESETS.de } });
            }}
          >
            {t.german}
          </Button>
          <Button type="button" variant="secondary" size="sm" onClick={() => {
              setLang("en");
              set({ labels: { ...LABEL_PRESETS.en } });
            }}
          >
            {t.english}
          </Button>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {LABEL_KEYS.map((key) => (
            <div key={key} className="space-y-1">
              <Label htmlFor={`label-${key}`} className="text-xs text-muted-foreground">
                {hints[key]}
              </Label>
              <Input
                id={`label-${key}`}
                value={settings.labels[key]}
                onChange={(e) => set({ labels: { ...settings.labels, [key]: e.target.value } })}
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
        <Label htmlFor="guides">{t.showGuides}</Label>
      </div>
    </div>
  );
}
