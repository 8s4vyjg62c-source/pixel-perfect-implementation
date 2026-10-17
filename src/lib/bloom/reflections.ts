import { bloomFeatures } from "./features";
import { dateKey, fromKey, type BloomState } from "./store";
import { doneCount, eachDay, type Period } from "./stats";

export type Reflection = { id: string; category: string; rule: string; sources: string[]; period: string; observation: string; question: string };

/** Only recorded facts; no journal analysis or inferred wellbeing. */
export function reflections(state: BloomState, period: Period, today = new Date()): Reflection[] {
  if (!bloomFeatures.advancedReflections) return [];
  const end = period.end < today ? period.end : fromKey(dateKey(today));
  if (end < period.start) return [];
  const entries = Object.entries(state.completions).filter(([d, ids]) => d >= dateKey(period.start) && d <= dateKey(end) && ids.some((id) => state.routines.some((r) => r.id === id)));
  const gratitudes = state.gratitude.filter((g) => g.date >= dateKey(period.start) && g.date <= dateKey(end));
  const steps = state.projects.flatMap((p) => p.steps.filter((s) => s.done && s.completedAt && s.completedAt >= dateKey(period.start) && s.completedAt <= dateKey(end)).map((s) => ({ p, s })));
  const recordedDays = new Set([...entries.map(([d]) => d), ...gratitudes.map((g) => g.date), ...steps.map(({ s }) => s.completedAt)]);
  if (recordedDays.size < 3 || eachDay(period.start, end).length < 3) return [];
  const out: Reflection[] = [];
  const add = (rule: string, entity: string, category: string, sources: string[], observation: string, question: string) => out.push({ id: `${period.key}:${rule}:${entity}`, category, rule, sources, period: period.key, observation, question });
  const best = state.routines.map((r) => ({ r, n: doneCount(state, r.id, period.start, end) })).sort((a, b) => b.n - a.n)[0];
  if (best && best.n > 0) add("recorded-actions", best.r.id, "Mes progrès", [`routine:${best.r.id}`, `completions:${period.key}`], `Tu as enregistré « ${best.r.name} » ${best.n} fois pendant cette période.`, "Qu'est-ce qui t'a aidé à lui faire une place ?");
  if (entries.length >= 3) add("recorded-days", "all", "Mes habitudes", [`completions:${period.key}`], `Des actions sont enregistrées sur ${entries.length} jours de cette période. Cela décrit tes enregistrements, pas tout ton quotidien.`, "Est-ce que tes fréquences correspondent à ton quotidien ?");
  if (best) add("chosen-activities", "all", "Mon équilibre", [`routine:${best.r.id}`], `« ${best.r.name} » fait partie des activités que tu as choisies et enregistrées.`, "Quelle place souhaites-tu donner à tes autres activités, ou au repos ?");
  if (steps.length) add("dated-milestones", "all", "Mes projets", steps.map(({ p, s }) => `project:${p.id}:step:${s.id}`), `${steps.length} étape${steps.length > 1 ? "s ont été terminées" : " a été terminée"} pendant cette période : ${steps.map(({ p, s }) => `${p.title} — ${s.text}`).join(" ; ")}.`, "Quelle petite action serait réaliste pour la suite ?");
  const idea = state.projects.find((p) => !p.archived && p.status !== "done" && p.createdAt <= dateKey(end) && !p.nextAction?.trim() && !p.steps.some((s) => !s.done));
  if (idea) add("no-next-step", idea.id, "Mes projets", [`project:${idea.id}`], `« ${idea.title} » n'a pas encore de prochaine action ni d'étape restante définie.`, "Veux-tu définir un tout petit prochain pas, ou laisser cette idée de côté pour le moment ?");
  const victory = state.reviews[period.key]?.victory.trim();
  if (victory) add("recorded-victory", "review", "Mes petites victoires", [`review:${period.key}:victory`], `Tu as noté cette petite victoire : « ${victory} »`, "Qu'aimerais-tu en retenir ?");
  else if (gratitudes[0]) add("recorded-gratitude", gratitudes[0].id, "Mes petites victoires", [`gratitude:${gratitudes[0].id}`], `Tu as noté : « ${gratitudes[0].text} »`, "Qu'aimerais-tu garder de ce moment ?");
  const adjust = state.reviews[period.key]?.adjust.trim();
  if (adjust) add("user-adjustment", "review", "Mes ajustements", [`review:${period.key}:adjust`], `Tu souhaites ajuster : « ${adjust} »`, "Souhaites-tu simplifier une routine ou modifier sa fréquence ?");
  return out;
}