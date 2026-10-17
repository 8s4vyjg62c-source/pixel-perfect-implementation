import { useEffect, useState, useCallback } from "react";

export type Frequency =
  | { type: "daily" }
  | { type: "weekdays"; days: number[] } // 0 = dimanche
  | { type: "timesPerWeek"; times: number } // plusieurs fois par semaine, jours libres
  | { type: "weekly" } // une fois par semaine, n'importe quel jour
  | { type: "custom"; everyNDays: number; startDate: string };

export type Routine = { id: string; name: string; emoji: string; frequency: Frequency; projectId?: string | undefined };
export type GratitudeEntry = { id: string; date: string; text: string };
export type ProjectStatus = "idea" | "active" | "paused" | "done";
export type ProjectStep = { id: string; text: string; done: boolean; completedAt?: string | undefined };
export type Direction = { id: string; title: string; note?: string };
export type ProjectLink = { id: string; from: string; to: string; note: string };
export type SuggestionStatus = "useful" | "hidden" | "ignored";
export type Profile = { name: string; goal: string; prompted: boolean };
export type Project = {
  id: string;
  title: string;
  description?: string;
  createdAt: string;
  dueDate?: string | undefined;
  status: ProjectStatus;
  steps: ProjectStep[];
  nextAction?: string;
  note?: string;
  archived?: boolean;
  history?: { date: string; text: string }[];
};
export type Review = { worked: string; learned: string; adjust: string; victory: string; gratitude: string };
export type Reminders = { enabled: boolean; resumeAfterDays: number };

export type BloomState = {
  routines: Routine[];
  completions: Record<string, string[]>; // dateKey -> routine ids
  gratitude: GratitudeEntry[];
  biblicalContent: boolean;
  projects: Project[];
  reviews: Record<string, Review>; // "week:YYYY-MM-DD" | "month:YYYY-MM" | "year:YYYY"
  dayNotes: Record<string, string>;
  reminders: Reminders;
  directions: Direction[];
  projectLinks: ProjectLink[];
  mapPositions: Record<string, { x: number; y: number }>;
  verseFavorites: string[];
  verseNotes: Record<string, string>;
  suggestionFeedback: Record<string, SuggestionStatus>;
  profile: Profile;
};

const KEY = "bloom.v1";

export const STATUS_LABEL: Record<ProjectStatus, string> = { idea: "Idée", active: "En cours", paused: "En pause", done: "Terminé" };

export const dateKey = (d: Date = new Date()) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};
export const fromKey = (k: string) => {
  const [y = 1970, m = 1, d = 1] = k.split("-").map(Number);
  return new Date(y, m - 1, d);
};
export const uid = () => Math.random().toString(36).slice(2, 10);

export function startOfWeek(date: Date) {
  const d = fromKey(dateKey(date));
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d;
}

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return dateKey(d);
}

export function demoState(): BloomState {
  const routines: Routine[] = [
    { id: "r1", name: "Skincare", emoji: "🧴", frequency: { type: "daily" } },
    { id: "r2", name: "Marche", emoji: "🚶", frequency: { type: "daily" } },
    { id: "r3", name: "Lecture", emoji: "📖", frequency: { type: "weekdays", days: [1, 3, 5] } },
    { id: "r4", name: "Méditation ou prière", emoji: "🕊️", frequency: { type: "daily" } },
    { id: "r5", name: "Soins capillaires", emoji: "💆", frequency: { type: "weekly" } },
  ];
  const completions: Record<string, string[]> = {};
  const pattern = [["r1", "r2"], ["r1", "r4"], [], ["r1", "r2", "r4"], ["r2"], ["r1", "r3", "r4"], ["r4"], ["r1", "r2", "r5"], [], ["r1"]];
  pattern.forEach((ids, i) => {
    if (ids.length) completions[daysAgo(i + 1)] = ids;
  });
  return {
    routines,
    completions,
    gratitude: [
      { id: uid(), date: daysAgo(1), text: "J'ai fait une promenade, même courte." },
      { id: uid(), date: daysAgo(1), text: "J'ai appelé un proche." },
      { id: uid(), date: daysAgo(3), text: "J'ai respecté un moment de repos." },
    ],
    biblicalContent: false,
    projects: [],
    reviews: {},
    dayNotes: {},
    reminders: { enabled: true, resumeAfterDays: 7 },
    directions: [], projectLinks: [], mapPositions: {}, verseFavorites: [], verseNotes: {}, suggestionFeedback: {},
    profile: { name: "", goal: "", prompted: false },
  };
}

/** Complète un état sauvegardé par une ancienne version sans perdre les données. */
export function migrate(raw: Partial<BloomState>): BloomState {
  return {
    routines: raw.routines ?? [],
    completions: raw.completions ?? {},
    gratitude: raw.gratitude ?? [],
    biblicalContent: raw.biblicalContent ?? false,
    projects: raw.projects ?? [],
    reviews: raw.reviews ?? {},
    dayNotes: raw.dayNotes ?? {},
    reminders: raw.reminders ?? { enabled: true, resumeAfterDays: 7 },
    directions: raw.directions ?? [],
    projectLinks: raw.projectLinks ?? [],
    mapPositions: raw.mapPositions ?? {},
    verseFavorites: raw.verseFavorites ?? [],
    verseNotes: raw.verseNotes ?? {},
    suggestionFeedback: raw.suggestionFeedback ?? {},
    profile: { name: "", goal: "", prompted: false, ...raw.profile },
  };
}

function doneThisWeekBefore(r: Routine, date: Date, state: BloomState) {
  let n = 0;
  for (let d = startOfWeek(date); d < fromKey(dateKey(date)); d.setDate(d.getDate() + 1)) {
    if (state.completions[dateKey(d)]?.includes(r.id)) n++;
  }
  return n;
}

export function isScheduled(r: Routine, date: Date, state?: BloomState): boolean {
  const f = r.frequency;
  switch (f.type) {
    case "daily":
      return true;
    case "weekdays":
      return f.days.includes(date.getDay());
    case "weekly":
      // Visible chaque jour jusqu'à ce qu'elle soit faite dans la semaine
      return !state || doneThisWeekBefore(r, date, state) < 1;
    case "timesPerWeek":
      return !state || doneThisWeekBefore(r, date, state) < f.times;
    case "custom": {
      const diff = Math.round((fromKey(dateKey(date)).getTime() - fromKey(f.startDate).getTime()) / 86400000);
      return diff >= 0 && diff % Math.max(1, f.everyNDays) === 0;
    }
  }
}

export function describeFrequency(f: Frequency): string {
  const names = ["dim", "lun", "mar", "mer", "jeu", "ven", "sam"];
  switch (f.type) {
    case "daily": return "Chaque jour";
    case "weekdays": return [1, 2, 3, 4, 5, 6, 0].filter((d) => f.days.includes(d)).map((d) => names[d]).join(" · ") || "Aucun jour";
    case "timesPerWeek": return `${f.times} fois par semaine`;
    case "weekly": return "Une fois par semaine";
    case "custom": return f.everyNDays === 1 ? "Chaque jour" : `Tous les ${f.everyNDays} jours`;
  }
}

/* --- Persistance locale (remplaçable plus tard par une base de données) --- */
let state: BloomState | null = null;
const listeners = new Set<() => void>();

function load(): BloomState {
  if (state) return state;
  try {
    const raw = localStorage.getItem(KEY);
    state = raw ? migrate(JSON.parse(raw) as Partial<BloomState>) : demoState();
  } catch {
    state = demoState();
  }
  return state;
}
function save(next: BloomState) {
  state = next;
  try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* stockage indisponible */ }
  listeners.forEach((l) => l());
}

export function useBloom() {
  const [s, setS] = useState<BloomState | null>(null);
  useEffect(() => {
    setS(load());
    const l = () => setS(state);
    listeners.add(l);
    return () => { listeners.delete(l); };
  }, []);

  const update = useCallback((fn: (prev: BloomState) => BloomState) => save(fn(load())), []);

  const actions = {
    toggle: (routineId: string, day = dateKey()) =>
      update((p) => {
        const cur = p.completions[day] ?? [];
        const next = cur.includes(routineId) ? cur.filter((x) => x !== routineId) : [...cur, routineId];
        return { ...p, completions: { ...p.completions, [day]: next } };
      }),
    addRoutine: (r: Omit<Routine, "id">) => update((p) => ({ ...p, routines: [...p.routines, { ...r, id: uid() }] })),
    updateRoutine: (r: Routine) => update((p) => ({ ...p, routines: p.routines.map((x) => (x.id === r.id ? r : x)) })),
    deleteRoutine: (id: string) => update((p) => ({ ...p, routines: p.routines.filter((x) => x.id !== id) })),
    addGratitude: (text: string, date = dateKey()) =>
      update((p) => ({ ...p, gratitude: [{ id: uid(), date, text }, ...p.gratitude] })),
    deleteGratitude: (id: string) => update((p) => ({ ...p, gratitude: p.gratitude.filter((g) => g.id !== id) })),
    setBiblical: (v: boolean) => update((p) => ({ ...p, biblicalContent: v })),
    saveProject: (pr: Project) => update((p) => {
      const old = p.projects.find((x) => x.id === pr.id);
      const changes: string[] = [];
      if (!old) changes.push("Projet créé");
      if (old && old.status !== pr.status) changes.push(`Statut : ${STATUS_LABEL[pr.status]}`);
      if (old && old.title !== pr.title) changes.push("Titre modifié");
      if (old && Boolean(old.archived) !== Boolean(pr.archived)) changes.push(pr.archived ? "Projet archivé" : "Projet désarchivé");
      const steps = pr.steps.map((s) => {
        const before = old?.steps.find((x) => x.id === s.id);
        if (s.done && !before?.done) changes.push(`Étape terminée : ${s.text}`);
        if (!s.done && before?.done) changes.push(`Étape remise à faire : ${s.text}`);
        return { ...s, completedAt: s.done ? before?.completedAt ?? (before?.done ? undefined : dateKey()) : undefined };
      });
      const next = { ...pr, steps, history: [...(old?.history ?? []), ...changes.map((text) => ({ date: dateKey(), text }))] };
      return { ...p, projects: old ? p.projects.map((x) => x.id === pr.id ? next : x) : [next, ...p.projects] };
    }),
    deleteProject: (id: string) =>
      update((p) => ({
        ...p,
        projects: p.projects.filter((x) => x.id !== id),
        routines: p.routines.map((r) => (r.projectId === id ? { ...r, projectId: undefined } : r)),
        projectLinks: p.projectLinks.filter((l) => l.from !== id && l.to !== id),
      })),
    saveDirection: (d: Direction) => update((p) => ({ ...p, directions: p.directions.some((x) => x.id === d.id) ? p.directions.map((x) => x.id === d.id ? d : x) : [...p.directions, d] })),
    deleteDirection: (id: string) => update((p) => ({ ...p, directions: p.directions.filter((d) => d.id !== id), projectLinks: p.projectLinks.filter((l) => l.from !== id && l.to !== id) })),
    saveProjectLink: (link: ProjectLink) => update((p) => {
      const ids = new Set([...p.projects, ...p.directions].map((x) => x.id));
      if (link.from === link.to || !ids.has(link.from) || !ids.has(link.to)) return p;
      if (p.projectLinks.some((l) => l.id !== link.id && ((l.from === link.from && l.to === link.to) || (l.from === link.to && l.to === link.from)))) return p;
      return { ...p, projectLinks: p.projectLinks.some((l) => l.id === link.id) ? p.projectLinks.map((l) => l.id === link.id ? link : l) : [...p.projectLinks, link] };
    }),
    deleteProjectLink: (id: string) => update((p) => ({ ...p, projectLinks: p.projectLinks.filter((l) => l.id !== id) })),
    setMapPosition: (id: string, position: { x: number; y: number }) => update((p) => ({ ...p, mapPositions: { ...p.mapPositions, [id]: position } })),
    setProfile: (profile: Profile) => update((p) => ({ ...p, profile })),
    toggleVerseFavorite: (id: string) => update((p) => ({ ...p, verseFavorites: p.verseFavorites.includes(id) ? p.verseFavorites.filter((x) => x !== id) : [...p.verseFavorites, id] })),
    setVerseNote: (id: string, note: string) => update((p) => ({ ...p, verseNotes: { ...p.verseNotes, [id]: note } })),
    setSuggestionFeedback: (id: string, status: SuggestionStatus) => update((p) => ({ ...p, suggestionFeedback: { ...p.suggestionFeedback, [id]: status } })),
    saveReview: (key: string, r: Review) => update((p) => ({ ...p, reviews: { ...p.reviews, [key]: r } })),
    setDayNote: (day: string, text: string) => update((p) => ({ ...p, dayNotes: { ...p.dayNotes, [day]: text } })),
    setReminders: (r: Reminders) => update((p) => ({ ...p, reminders: r })),
    reset: () => save(demoState()),
  };
  return { state: s, ...actions };
}
