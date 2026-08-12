export type Entry = {
  id: string;
  period: string;
  title: string;
  org: string;
  bullets: string[];
};

export type SkillGroup = {
  id: string;
  title: string;
  items: string[];
};

export type Template = "classic" | "twocol" | "compact";

export type CvSettings = {
  template: Template;
  accent: string;
  fontScale: number;
  photoShape: "rect" | "circle";
  showPageGuides: boolean;
};

export type CvData = {
  name: string;
  headline: string;
  summary: string;
  address: string;
  email: string;
  phone: string;
  photo: string;
  experience: Entry[];
  education: Entry[];
  skills: SkillGroup[];
  languages: string[];
  extras: SkillGroup[];
  settings: CvSettings;
};

export type Profile = {
  id: string;
  name: string;
  updatedAt: number;
  data: CvData;
};

export type CvStore = {
  activeId: string;
  profiles: Profile[];
};

export const uid = () => Math.random().toString(36).slice(2, 10);

export const defaultSettings = (): CvSettings => ({
  template: "classic",
  accent: "#c9702f",
  fontScale: 1,
  photoShape: "rect",
  showPageGuides: true,
});

export const emptyEntry = (): Entry => ({
  id: uid(),
  period: "",
  title: "",
  org: "",
  bullets: [],
});

export const emptyGroup = (): SkillGroup => ({ id: uid(), title: "", items: [] });

export const emptyCv = (): CvData => ({
  name: "",
  headline: "",
  summary: "",
  address: "",
  email: "",
  phone: "",
  photo: "",
  experience: [],
  education: [],
  skills: [],
  languages: [],
  extras: [],
  settings: defaultSettings(),
});

/** Fills in missing fields of persisted or imported data. */
export function normalizeCv(input: Partial<CvData> | null | undefined): CvData {
  const base = emptyCv();
  if (!input) return base;
  return {
    ...base,
    ...input,
    experience: (input.experience ?? []).map((e) => ({ ...emptyEntry(), ...e })),
    education: (input.education ?? []).map((e) => ({ ...emptyEntry(), ...e })),
    skills: (input.skills ?? []).map((g) => ({ ...emptyGroup(), ...g })),
    extras: (input.extras ?? []).map((g) => ({ ...emptyGroup(), ...g })),
    languages: input.languages ?? [],
    settings: { ...base.settings, ...(input.settings ?? {}) },
  };
}

export const emptyProfile = (name = "Lebenslauf"): Profile => ({
  id: uid(),
  name,
  updatedAt: Date.now(),
  data: emptyCv(),
});

const STORE_KEY = "cv-editor-store-v2";
const LEGACY_KEY = "cv-editor-data-v1";

export function emptyStore(): CvStore {
  const p = emptyProfile();
  return { activeId: p.id, profiles: [p] };
}

export function loadStore(): CvStore | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as CvStore;
      if (parsed?.profiles?.length) {
        return {
          activeId: parsed.profiles.some((p) => p.id === parsed.activeId)
            ? parsed.activeId
            : parsed.profiles[0]!.id,
          profiles: parsed.profiles.map((p) => ({ ...p, data: normalizeCv(p.data) })),
        };
      }
    }
    const legacy = window.localStorage.getItem(LEGACY_KEY);
    if (legacy) {
      const p = emptyProfile();
      p.data = normalizeCv(JSON.parse(legacy) as Partial<CvData>);
      return { activeId: p.id, profiles: [p] };
    }
  } catch {
    /* ignore corrupt storage */
  }
  return null;
}

export type SaveResult = { ok: true } | { ok: false; error: string };

export function saveStore(store: CvStore): SaveResult {
  if (typeof window === "undefined") return { ok: true };
  try {
    window.localStorage.setItem(STORE_KEY, JSON.stringify(store));
    return { ok: true };
  } catch {
    return { ok: false, error: "Speicher voll – bitte Bewerbungsfoto verkleinern oder Profile löschen." };
  }
}

export function clearStore() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORE_KEY);
  window.localStorage.removeItem(LEGACY_KEY);
}

/** Moves an item within a list from one index to another. */
export function reorder<T>(arr: T[], from: number, to: number): T[] {
  if (from === to || from < 0 || from >= arr.length) return arr;
  const copy = [...arr];
  const [item] = copy.splice(from, 1);
  copy.splice(Math.max(0, Math.min(copy.length, to)), 0, item as T);
  return copy;
}
