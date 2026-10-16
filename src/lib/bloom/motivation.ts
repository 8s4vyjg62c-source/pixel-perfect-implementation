import { dateKey, isScheduled, startOfWeek, type BloomState, type Routine } from "./store";
import { daysSinceLast, doneCount, plannedCount } from "./stats";

export type Nudge = { id: string; text: string; routine?: Routine; kind: "resume" | "adjust" };

/** Message du jour, basé uniquement sur les actions enregistrées. */
export function dailyMessage(state: BloomState, today = new Date()): string {
  const k = dateKey(today);
  const doneIds = state.completions[k] ?? [];
  const todays = state.routines.filter((r) => isScheduled(r, today, state) || doneIds.includes(r.id));
  const done = todays.filter((r) => doneIds.includes(r.id));

  // Reprise après une pause
  const resumed = done.find((r) => { const n = daysSinceLast(state, r.id, today, true); return n !== null && n >= state.reminders.resumeAfterDays; });
  if (resumed) return `Tu as repris « ${resumed.name} » après une pause. Pas besoin de rattraper les jours passés.`;

  // Progression par rapport à la même période de la semaine précédente
  const ws = startOfWeek(today);
  const prevStart = new Date(ws); prevStart.setDate(ws.getDate() - 7);
  const prevSame = new Date(today); prevSame.setDate(today.getDate() - 7);
  const sum = (a: Date, b: Date) => state.routines.reduce((n, r) => n + doneCount(state, r.id, a, b), 0);
  const thisWeek = sum(ws, today), lastWeek = sum(prevStart, prevSame);
  if (done.length > 0 && lastWeek > 0 && thisWeek > lastWeek)
    return `Cette semaine, ${thisWeek} actions déjà, contre ${lastWeek} à ce stade la semaine dernière. Continue à ton rythme.`;

  if (todays.length === 0) return "Aucune routine prévue aujourd'hui. Profite de cet espace pour toi.";
  if (done.length === 0) return "Tu n'as pas besoin de tout accomplir aujourd'hui. Fais le prochain petit pas.";
  if (done.some((r) => r.projectId)) return "Tu as avancé sur ce que tu voulais construire. Continue à ton rythme.";
  if (done.length < todays.length) return "Bravo, tu as pris du temps pour toi aujourd'hui.";
  return "Belle journée. Prends un instant pour le reconnaître.";
}

/** Suggestions douces : reprise d'une activité, ou objectif peut-être trop ambitieux. */
export function nudges(state: BloomState, today = new Date()): Nudge[] {
  if (!state.reminders.enabled) return [];
  const out: Nudge[] = [];
  for (const r of state.routines) {
    const n = daysSinceLast(state, r.id, today);
    if (n !== null && n >= state.reminders.resumeAfterDays)
      out.push({ id: `resume-${r.id}`, kind: "resume", routine: r, text: `Cela fait ${n} jours que « ${r.name} » n'a pas été enregistrée. Envie de lui redonner une petite place ? Tu peux reprendre sans rattraper.` });
  }
  // Deux semaines complètes précédentes : moins d'un tiers réalisé alors que la routine a été pratiquée
  const ws = startOfWeek(today);
  const s = new Date(ws); s.setDate(ws.getDate() - 14);
  const e = new Date(ws); e.setDate(ws.getDate() - 1);
  for (const r of state.routines) {
    const planned = plannedCount(r, s, e), done = doneCount(state, r.id, s, e);
    if (planned >= 4 && done > 0 && done / planned < 1 / 3)
      out.push({ id: `adjust-${r.id}`, kind: "adjust", routine: r, text: `« ${r.name} » : ${done} sur ${planned} prévues ces deux dernières semaines. Ce n'est peut-être pas le bon rythme en ce moment — tu peux alléger la fréquence.` });
  }
  return out.slice(0, 2);
}
