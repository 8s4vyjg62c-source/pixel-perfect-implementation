import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { AppShell, Loading, PageHeader } from "@/components/bloom/AppShell";
import { dateKey, fromKey, isScheduled, useBloom, type BloomState } from "@/lib/bloom/store";

export const Route = createFileRoute("/historique")({
  head: () => ({
    meta: [
      { title: "Bloom — Mon historique" },
      { name: "description", content: "Parcours tes journées passées et retrouve tes petites victoires." },
      { property: "og:title", content: "Bloom — Mon historique" },
      { property: "og:description", content: "Parcours tes journées passées et retrouve tes petites victoires." },
    ],
  }),
  component: Historique,
});

const fmt = (k: string) => fromKey(k).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });

/** Souvenir basé uniquement sur des données enregistrées. */
function memory(state: BloomState): string | null {
  const today = new Date();
  const ago = (k: string) => Math.round((fromKey(dateKey(today)).getTime() - fromKey(k).getTime()) / 86400000);
  const month = state.gratitude.find((g) => { const n = ago(g.date); return n >= 27 && n <= 34; });
  if (month) return `Il y a un mois, tu notais : « ${month.text} »`;
  const victory = Object.entries(state.reviews).find(([, r]) => r.victory.trim());
  if (victory) return `Une victoire de ton bilan : « ${victory[1].victory} »`;
  const project = state.projects.find((p) => ago(p.createdAt) >= 14);
  if (project) return `Tu as commencé « ${project.title} » il y a ${ago(project.createdAt)} jours.`;
  const old = [...state.gratitude].filter((g) => ago(g.date) >= 7).sort((a, b) => a.date.localeCompare(b.date))[0];
  if (old) return `Le ${fmt(old.date)}, tu notais : « ${old.text} »`;
  return null;
}

function Historique() {
  const { state, setDayNote } = useBloom();
  const [offset, setOffset] = useState(0);
  const [selected, setSelected] = useState(dateKey());
  const [note, setNote] = useState("");
  useEffect(() => { setNote(state?.dayNotes[selected] ?? ""); }, [selected, state?.dayNotes]);

  const base = new Date();
  const month = new Date(base.getFullYear(), base.getMonth() + offset, 1);
  const lead = (month.getDay() + 6) % 7;
  const daysIn = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cells = [...Array(lead).fill(null), ...Array.from({ length: daysIn }, (_, i) => new Date(month.getFullYear(), month.getMonth(), i + 1))];

  return (
    <AppShell>
      <PageHeader title="Mon historique">
        <p className="mt-2 text-sm text-muted-foreground">Le chemin parcouru, jour après jour.</p>
      </PageHeader>
      {!state ? <Loading /> : (() => {
        const count = (k: string) => (state.completions[k] ?? []).filter((id) => state.routines.some((r) => r.id === id)).length;
        const selIds = state.completions[selected] ?? [];
        const selDate = fromKey(selected);
        const done = state.routines.filter((r) => selIds.includes(r.id));
        const notRecorded = state.routines.filter((r) => !selIds.includes(r.id) && isScheduled(r, selDate));
        const grat = state.gratitude.filter((g) => g.date === selected);
        const souvenir = memory(state);

        return (
          <div className="space-y-6">
            {souvenir && (
              <div className="fade-up rounded-2xl bg-powder/60 p-5">
                <p className="text-xs font-medium uppercase tracking-wide text-primary">Souvenir</p>
                <p className="mt-1 font-display text-lg leading-snug">{souvenir}</p>
              </div>
            )}

            <section className="card-soft p-4">
              <div className="mb-3 flex items-center justify-between">
                <button aria-label="Mois précédent" onClick={() => setOffset(offset - 1)} className="rounded-full p-2 hover:bg-muted"><ChevronLeft className="h-4 w-4" /></button>
                <h2 className="text-lg font-medium capitalize">{month.toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}</h2>
                <button aria-label="Mois suivant" disabled={offset >= 0} onClick={() => setOffset(offset + 1)} className="rounded-full p-2 hover:bg-muted disabled:opacity-30"><ChevronRight className="h-4 w-4" /></button>
              </div>
              <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground">
                {["L", "M", "M", "J", "V", "S", "D"].map((d, i) => <span key={i} className="py-1">{d}</span>)}
                {cells.map((d, i) => {
                  if (!d) return <span key={i} />;
                  const k = dateKey(d);
                  const n = count(k);
                  const future = d > new Date();
                  const level = n === 0 ? "" : n === 1 ? "bg-cocoa/40" : n === 2 ? "bg-cocoa" : "bg-cocoa-deep text-primary-foreground";
                  const hasG = state.gratitude.some((g) => g.date === k);
                  return (
                    <button key={i} disabled={future} onClick={() => setSelected(k)} aria-label={`${fmt(k)} : ${n} action${n > 1 ? "s" : ""}`}
                      className={`relative aspect-square rounded-full text-sm ${level} ${selected === k ? "ring-2 ring-primary" : ""} ${future ? "opacity-30" : n > 2 ? "" : "text-foreground"}`}>
                      {d.getDate()}
                      {hasG && <span className="absolute bottom-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-primary" />}
                    </button>
                  );
                })}
              </div>
              <p className="mt-2 text-xs text-muted-foreground">Plus la pastille est foncée, plus tu as fait d'actions. Le point rose = une gratitude.</p>
            </section>

            <section className="fade-up space-y-3" key={selected}>
              <h2 className="text-lg font-medium capitalize">{fmt(selected)}</h2>
              {done.length > 0 && (
                <ul className="space-y-2">{done.map((r) => <li key={r.id} className="rounded-xl bg-cocoa/35 px-4 py-2 text-sm">✓ {r.emoji} {r.name}</li>)}</ul>
              )}
              {grat.length > 0 && (
                <ul className="space-y-2">{grat.map((g) => <li key={g.id} className="rounded-xl bg-powder/50 px-4 py-2 text-sm">💗 {g.text}</li>)}</ul>
              )}
              {done.length === 0 && grat.length === 0 && <p className="text-sm text-muted-foreground">Rien d'enregistré ce jour-là. C'est aussi une manière de prendre soin de soi.</p>}
              {notRecorded.length > 0 && (
                <p className="text-xs text-muted-foreground">Non enregistrées : {notRecorded.map((r) => r.name).join(", ")}</p>
              )}
              <label className="block">
                <span className="mb-1 block text-sm font-medium">Note du jour</span>
                <textarea rows={2} maxLength={400} value={note} onChange={(e) => setNote(e.target.value)} onBlur={() => note !== (state.dayNotes[selected] ?? "") && setDayNote(selected, note)}
                  placeholder="Facultatif…" className="w-full resize-none rounded-2xl border bg-card p-3 text-sm outline-none focus:ring-2 focus:ring-ring" />
              </label>
            </section>
          </div>
        );
      })()}
    </AppShell>
  );
}
