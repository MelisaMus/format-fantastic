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

export type CvData = {
  name: string;
  headline: string;
  summary: string;
  address: string;
  email: string;
  phone: string;
  experience: Entry[];
  education: Entry[];
  skills: SkillGroup[];
  languages: string[];
  extras: SkillGroup[];
};

export const uid = () => Math.random().toString(36).slice(2, 10);

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
  experience: [],
  education: [],
  skills: [],
  languages: [],
  extras: [],
});

const KEY = "cv-editor-data-v1";

export function loadCv(): CvData | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as CvData) : null;
  } catch {
    return null;
  }
}

export function saveCv(data: CvData) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    /* ignore quota errors */
  }
}

export function clearCv() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEY);
}
