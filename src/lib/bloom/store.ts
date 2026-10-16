import { useEffect, useState, useCallback } from "react";

export type Frequency =
  | { type: "daily" }
  | { type: "weekdays"; days: number[] } // 0 = dimanche
  | { type: "weekly" } // une fois par semaine, n'importe quel jour
  | { type: "custom"; everyNDays: number; startDate: string };

export type Routine = { id: string; name: string; emoji: string; frequency: Frequency };
export type GratitudeEntry = { id: string; date: string; text: string };
export type BloomState = {
  routines: Routine[];
  completions: Record<string, string[]>; // dateKey -> routine ids
  gratitude: GratitudeEntry[];
  biblicalContent: boolean;
};

const KEY = "bloom.v1";

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
const uid = () => Math.random().toString(36).slice(2, 10);

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
  };
}

export function isScheduled(r: Routine, date: Date, state?: BloomState): boolean {
  const f = r.frequency;
  switch (f.type) {
    case "daily":
      return true;
    case "weekdays":
      return f.days.includes(date.getDay());
    case "weekly": {
      // Visible tous les jours jusqu'à ce qu'elle soit faite dans la semaine
      if (!state) return true;
      const start = new Date(date);
      start.setDate(date.getDate() - ((date.getDay() + 6) % 7));
      for (let d = new Date(start); d < date; d.setDate(d.getDate() + 1)) {
        if (state.completions[dateKey(d)]?.includes(r.id)) return false;
      }
      return true;
    }
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
    state = raw ? (JSON.parse(raw) as BloomState) : demoState();
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
    addGratitude: (text: string) =>
      update((p) => ({ ...p, gratitude: [{ id: uid(), date: dateKey(), text }, ...p.gratitude] })),
    deleteGratitude: (id: string) => update((p) => ({ ...p, gratitude: p.gratitude.filter((g) => g.id !== id) })),
    setBiblical: (v: boolean) => update((p) => ({ ...p, biblicalContent: v })),
    reset: () => save(demoState()),
  };
  return { state: s, ...actions };
}
