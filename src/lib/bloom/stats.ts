import { dateKey, fromKey, startOfWeek, type BloomState, type Routine } from "./store";

export type PeriodKind = "week" | "month" | "year";
export type Period = { kind: PeriodKind; start: Date; end: Date; key: string; label: string };

const addDays = (d: Date, n: number) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };

/** offset 0 = période en cours, -1 = précédente, etc. */
export function getPeriod(kind: PeriodKind, offset: number, today = new Date()): Period {
  if (kind === "week") {
    const start = addDays(startOfWeek(today), offset * 7);
    const end = addDays(start, 6);
    const f = (d: Date) => d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
    return { kind, start, end, key: `week:${dateKey(start)}`, label: `Semaine du ${f(start)} au ${f(end)}` };
  }
  if (kind === "month") {
    const start = new Date(today.getFullYear(), today.getMonth() + offset, 1);
    const end = new Date(start.getFullYear(), start.getMonth() + 1, 0);
    return { kind, start, end, key: `month:${dateKey(start).slice(0, 7)}`, label: start.toLocaleDateString("fr-FR", { month: "long", year: "numeric" }) };
  }
  const start = new Date(today.getFullYear() + offset, 0, 1);
  const end = new Date(start.getFullYear(), 11, 31);
  return { kind, start, end, key: `year:${start.getFullYear()}`, label: `Année ${start.getFullYear()}` };
}

export function eachDay(start: Date, end: Date): Date[] {
  const out: Date[] = [];
  for (let d = fromKey(dateKey(start)); d <= end; d = addDays(d, 1)) out.push(d);
  return out;
}

/** Nombre d'actions prévues pour une routine entre deux dates (incluses). */
export function plannedCount(r: Routine, start: Date, end: Date): number {
  const days = eachDay(start, end);
  const f = r.frequency;
  switch (f.type) {
    case "daily": return days.length;
    case "weekdays": return days.filter((d) => f.days.includes(d.getDay())).length;
    case "weekly": return Math.round(days.length / 7);
    case "timesPerWeek": return Math.round((days.length / 7) * f.times);
    case "custom": {
      const s = fromKey(f.startDate).getTime();
      return days.filter((d) => { const diff = Math.round((d.getTime() - s) / 86400000); return diff >= 0 && diff % Math.max(1, f.everyNDays) === 0; }).length;
    }
  }
}

export function doneCount(state: BloomState, routineId: string, start: Date, end: Date): number {
  return eachDay(start, end).filter((d) => state.completions[dateKey(d)]?.includes(routineId)).length;
}

export function totalDone(state: BloomState, start: Date, end: Date): number {
  const ids = new Set(state.routines.map((r) => r.id));
  return eachDay(start, end).reduce((n, d) => n + (state.completions[dateKey(d)] ?? []).filter((id) => ids.has(id)).length, 0);
}

/** Jours depuis la dernière réalisation (null si jamais enregistrée). */
export function daysSinceLast(state: BloomState, routineId: string, today = new Date(), excludeToday = false): number | null {
  for (let i = excludeToday ? 1 : 0; i < 730; i++) {
    if (state.completions[dateKey(addDays(today, -i))]?.includes(routineId)) return i;
  }
  return null;
}

/** Y a-t-il au moins une donnée enregistrée avant cette date ? */
export function hasDataBefore(state: BloomState, date: Date): boolean {
  const k = dateKey(date);
  return Object.entries(state.completions).some(([d, ids]) => d < k && ids.length > 0);
}
