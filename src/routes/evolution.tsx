import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { AppShell, Loading, PageHeader } from "@/components/bloom/AppShell";
import { dateKey, useBloom } from "@/lib/bloom/store";

export const Route = createFileRoute("/evolution")({
  head: () => ({
    meta: [
      { title: "Bloom — Mon évolution" },
      { name: "description", content: "Retrouve tes moments accomplis, sans pression." },
      { property: "og:title", content: "Bloom — Mon évolution" },
      { property: "og:description", content: "Retrouve tes moments accomplis, sans pression." },
    ],
  }),
  component: Evolution,
});

function Evolution() {
  const { state } = useBloom();
  const [offset, setOffset] = useState(0);
  const [selected, setSelected] = useState(dateKey());

  const base = new Date();
  const month = new Date(base.getFullYear(), base.getMonth() + offset, 1);
  const lead = (month.getDay() + 6) % 7;
  const daysIn = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cells = [...Array(lead).fill(null), ...Array.from({ length: daysIn }, (_, i) => new Date(month.getFullYear(), month.getMonth(), i + 1))];

  return (
    <AppShell>
      <PageHeader title="Mon évolution">
        <p className="mt-2 text-sm text-muted-foreground">Chaque pastille est un moment que tu t'es offert.</p>
      </PageHeader>
      {!state ? <Loading /> : (() => {
        const count = (k: string) => (state.completions[k] ?? []).filter((id) => state.routines.some((r) => r.id === id)).length;
        const last30 = Array.from({ length: 30 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - i); return count(dateKey(d)); });
        const total30 = last30.reduce((a, b) => a + b, 0);
        const activeDays = last30.filter(Boolean).length;
        const perRoutine = state.routines.map((r) => ({
          r,
          n: Array.from({ length: 30 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - i); return (state.completions[dateKey(d)] ?? []).includes(r.id); }).filter(Boolean).length,
        })).filter((x) => x.n > 0).sort((a, b) => b.n - a.n);
        const selIds = (state.completions[selected] ?? []);
        const selRoutines = state.routines.filter((r) => selIds.includes(r.id));
        const selGratitude = state.gratitude.filter((g) => g.date === selected);

        return (
          <div className="space-y-6">
            <div className="fade-up rounded-2xl bg-sky p-5">
              <p className="font-display text-lg leading-snug">
                {total30 > 0
                  ? `Ces 30 derniers jours, tu as pris soin de toi ${total30} fois, sur ${activeDays} journée${activeDays > 1 ? "s" : ""}.`
                  : "Ton histoire commence quand tu le souhaites."}
              </p>
            </div>

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
                  const level = n === 0 ? "" : n === 1 ? "bg-sage/50" : n === 2 ? "bg-sage" : "bg-sage-deep text-primary-foreground";
                  return (
                    <button key={i} disabled={future} onClick={() => setSelected(k)}
                      className={`aspect-square rounded-full text-sm ${level} ${selected === k ? "ring-2 ring-primary" : ""} ${future ? "opacity-30" : "text-foreground"}`}>
                      {d.getDate()}
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="fade-up">
              <h2 className="mb-2 text-lg font-medium capitalize">{new Date(selected + "T12:00").toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}</h2>
              {selRoutines.length === 0 && selGratitude.length === 0 ? (
                <p className="text-sm text-muted-foreground">Une journée de pause. C'est aussi une manière de prendre soin de soi.</p>
              ) : (
                <ul className="space-y-2">
                  {selRoutines.map((r) => <li key={r.id} className="rounded-xl bg-sage/40 px-4 py-2 text-sm">{r.emoji} {r.name}</li>)}
                  {selGratitude.map((g) => <li key={g.id} className="rounded-xl bg-powder/40 px-4 py-2 text-sm">💗 {g.text}</li>)}
                </ul>
              )}
            </section>

            {perRoutine.length > 0 && (
              <section>
                <h2 className="mb-2 text-lg font-medium">Ce qui t'accompagne le plus</h2>
                <ul className="space-y-2">
                  {perRoutine.map(({ r, n }) => (
                    <li key={r.id} className="flex items-center justify-between rounded-xl card-soft px-4 py-3 text-sm">
                      <span>{r.emoji} {r.name}</span><span className="text-muted-foreground">{n} fois</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        );
      })()}
    </AppShell>
  );
}
