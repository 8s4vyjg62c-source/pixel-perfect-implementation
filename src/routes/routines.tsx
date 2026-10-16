import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import { AppShell, Loading, PageHeader } from "@/components/bloom/AppShell";
import { RoutineCheck } from "@/components/bloom/RoutineCheck";
import { dateKey, isScheduled, useBloom, type Frequency, type Routine } from "@/lib/bloom/store";

export const Route = createFileRoute("/routines")({
  head: () => ({
    meta: [
      { title: "Bloom — Mes routines" },
      { name: "description", content: "Crée et ajuste des routines facultatives, à ta mesure." },
      { property: "og:title", content: "Bloom — Mes routines" },
      { property: "og:description", content: "Crée et ajuste des routines facultatives, à ta mesure." },
    ],
  }),
  component: Routines,
});

const SUGGESTIONS = [
  ["🧴", "Skincare"], ["💆", "Soins capillaires"], ["🚶", "Marche"], ["🏃", "Sport"], ["🤸", "Étirements"],
  ["📖", "Lecture"], ["🧘", "Méditation"], ["🙏", "Prière"], ["🎥", "Création de contenu"],
] as const;
const DAYS = [[1, "L"], [2, "M"], [3, "M"], [4, "J"], [5, "V"], [6, "S"], [0, "D"]] as const;

type Draft = { id?: string; name: string; emoji: string; frequency: Frequency };
const empty = (): Draft => ({ name: "", emoji: "🌱", frequency: { type: "daily" } });

function Routines() {
  const { state, toggle, addRoutine, updateRoutine, deleteRoutine } = useBloom();
  const [draft, setDraft] = useState<Draft | null>(null);
  const today = new Date();

  const save = () => {
    if (!draft || !draft.name.trim()) return;
    const r = { ...draft, name: draft.name.trim() };
    if (r.id) updateRoutine(r as Routine);
    else addRoutine(r);
    setDraft(null);
  };

  return (
    <AppShell>
      <PageHeader title="Mes routines">
        <p className="mt-2 text-sm text-muted-foreground">Toutes facultatives. Garde seulement ce qui te fait du bien.</p>
      </PageHeader>
      {!state ? <Loading /> : (
        <div className="space-y-3">
          {state.routines.map((r) => {
            const scheduled = isScheduled(r, today, state);
            const done = (state.completions[dateKey()] ?? []).includes(r.id);
            return (
              <div key={r.id} className="flex items-center gap-2">
                <div className="flex-1">
                  <RoutineCheck routine={r} done={done} onToggle={() => toggle(r.id)} />
                  {!scheduled && !done && <p className="mt-1 pl-4 text-xs text-muted-foreground">Pas prévue aujourd'hui</p>}
                </div>
                <button aria-label={`Modifier ${r.name}`} onClick={() => setDraft({ ...r })} className="rounded-full p-2 text-muted-foreground hover:bg-muted">
                  <Pencil className="h-4 w-4" />
                </button>
              </div>
            );
          })}
          {state.routines.length === 0 && <p className="py-6 text-center text-muted-foreground">Aucune routine pour l'instant.</p>}
          <button onClick={() => setDraft(empty())} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-4 font-medium text-primary-foreground transition-opacity hover:opacity-90">
            <Plus className="h-5 w-5" /> Ajouter une routine
          </button>
        </div>
      )}

      {draft && (
        <div className="fixed inset-0 z-30 flex items-end justify-center bg-plum/40" onClick={() => setDraft(null)}>
          <div role="dialog" aria-label="Routine" className="fade-up w-full max-w-md rounded-t-3xl bg-card p-6 pb-10" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-medium">{draft.id ? "Modifier" : "Nouvelle routine"}</h2>
              <button aria-label="Fermer" onClick={() => setDraft(null)} className="rounded-full p-2 hover:bg-muted"><X className="h-5 w-5" /></button>
            </div>
            {!draft.id && (
              <div className="mb-4 flex flex-wrap gap-2">
                {SUGGESTIONS.map(([e, n]) => (
                  <button key={n} onClick={() => setDraft({ ...draft, emoji: e, name: n })} className="rounded-full bg-sky px-3 py-1.5 text-sm">
                    {e} {n}
                  </button>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <input aria-label="Emoji" value={draft.emoji} onChange={(e) => setDraft({ ...draft, emoji: e.target.value })} className="w-14 rounded-xl border bg-background p-3 text-center text-xl" />
              <input aria-label="Nom" placeholder="Nom de la routine" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} className="flex-1 rounded-xl border bg-background p-3 outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <p className="mb-2 mt-5 text-sm font-medium">Fréquence</p>
            <div className="grid grid-cols-2 gap-2">
              {([["daily", "Chaque jour"], ["weekdays", "Certains jours"], ["weekly", "Hebdomadaire"], ["custom", "Personnalisée"]] as const).map(([t, l]) => (
                <button
                  key={t}
                  onClick={() => setDraft({ ...draft, frequency: t === "weekdays" ? { type: t, days: [1, 3, 5] } : t === "custom" ? { type: t, everyNDays: 2, startDate: dateKey() } : { type: t } })}
                  className={`rounded-xl border p-3 text-sm ${draft.frequency.type === t ? "border-primary bg-primary/10 text-primary" : ""}`}
                >{l}</button>
              ))}
            </div>
            {draft.frequency.type === "weekdays" && (
              <div className="mt-3 flex justify-between">
                {DAYS.map(([d, l]) => {
                  const f = draft.frequency as Extract<Frequency, { type: "weekdays" }>;
                  const on = f.days.includes(d);
                  return (
                    <button key={d} aria-pressed={on} onClick={() => setDraft({ ...draft, frequency: { ...f, days: on ? f.days.filter((x) => x !== d) : [...f.days, d] } })}
                      className={`h-10 w-10 rounded-full text-sm font-medium ${on ? "bg-sage-deep text-primary-foreground" : "bg-muted"}`}>{l}</button>
                  );
                })}
              </div>
            )}
            {draft.frequency.type === "custom" && (
              <label className="mt-3 flex items-center gap-2 text-sm">
                Tous les
                <input type="number" min={1} max={30} value={draft.frequency.everyNDays}
                  onChange={(e) => setDraft({ ...draft, frequency: { ...(draft.frequency as Extract<Frequency, { type: "custom" }>), everyNDays: Math.max(1, Number(e.target.value) || 1) } })}
                  className="w-16 rounded-xl border bg-background p-2 text-center" />
                jours
              </label>
            )}
            <div className="mt-6 flex gap-2">
              {draft.id && (
                <button onClick={() => { if (confirm("Supprimer cette routine ?")) { deleteRoutine(draft.id!); setDraft(null); } }} className="flex items-center gap-1 rounded-xl border px-4 text-sm text-muted-foreground">
                  <Trash2 className="h-4 w-4" /> Supprimer
                </button>
              )}
              <button onClick={save} disabled={!draft.name.trim()} className="flex-1 rounded-xl bg-primary py-3 font-medium text-primary-foreground disabled:opacity-40">Enregistrer</button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
