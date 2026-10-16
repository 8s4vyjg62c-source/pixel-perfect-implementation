import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { X } from "lucide-react";
import { AppShell, Loading, PageHeader } from "@/components/bloom/AppShell";
import { dateKey, isScheduled, useBloom } from "@/lib/bloom/store";

export const Route = createFileRoute("/gratitude")({
  head: () => ({
    meta: [
      { title: "Bloom — Ma gratitude" },
      { name: "description", content: "Note une à trois petites victoires du jour." },
      { property: "og:title", content: "Bloom — Ma gratitude" },
      { property: "og:description", content: "Note une à trois petites victoires du jour." },
    ],
  }),
  component: Gratitude,
});

const IDEAS = ["J'ai pris du temps pour moi.", "J'ai avancé sur un projet.", "J'ai appelé un proche.", "J'ai respecté un moment de repos.", "J'ai fait une promenade, même courte."];

function Gratitude() {
  const { state, addGratitude, deleteGratitude } = useBloom();
  const [text, setText] = useState("");

  return (
    <AppShell>
      <PageHeader title="Ma gratitude"><Link to="/inspiration" className="mt-2 inline-block text-sm font-medium text-primary">Mon inspiration →</Link></PageHeader>
      {!state ? <Loading /> : (() => {
        const today = dateKey();
        const todays = state.gratitude.filter((g) => g.date === today);
        const scheduled = state.routines.filter((r) => isScheduled(r, new Date(), state));
        const doneIds = state.completions[today] ?? [];
        const allDone = scheduled.every((r) => doneIds.includes(r.id));
        const full = todays.length >= 3;
        const submit = (t: string) => { if (t.trim() && !full) { addGratitude(t.trim()); setText(""); } };
        const past = state.gratitude.filter((g) => g.date !== today);
        const byDate = past.reduce<Record<string, typeof past>>((acc, g) => { (acc[g.date] ??= []).push(g); return acc; }, {});

        return (
          <div className="space-y-6">
            <p className="font-display text-lg leading-snug text-foreground">
              {allDone ? "Qu'est-ce qui t'a fait du bien aujourd'hui ?" : "Qu'as-tu tout de même réussi à faire aujourd'hui ?"}
            </p>
            <p className="-mt-4 text-sm text-muted-foreground">Une à trois choses, si tu en as envie. Rien n'est obligatoire.</p>

            {todays.length > 0 && (
              <ul className="space-y-2">
                {todays.map((g) => (
                  <li key={g.id} className="fade-up flex items-start gap-3 rounded-2xl bg-powder/50 p-4">
                    <span aria-hidden>💗</span><span className="flex-1">{g.text}</span>
                    <button aria-label="Retirer" onClick={() => deleteGratitude(g.id)} className="text-muted-foreground"><X className="h-4 w-4" /></button>
                  </li>
                ))}
              </ul>
            )}

            {full ? (
              <p className="rounded-2xl bg-sky p-4 text-sm">Trois belles choses aujourd'hui. Merci de les avoir remarquées.</p>
            ) : (
              <form onSubmit={(e) => { e.preventDefault(); submit(text); }} className="space-y-3">
                <textarea aria-label="Petite victoire" rows={2} maxLength={200} value={text} onChange={(e) => setText(e.target.value)}
                  placeholder="Une petite victoire, même minuscule…" className="w-full resize-none rounded-2xl border bg-card p-4 outline-none focus:ring-2 focus:ring-ring" />
                <div className="flex flex-wrap gap-2">
                  {IDEAS.map((i) => <button type="button" key={i} onClick={() => setText(i)} className="rounded-full bg-sky px-3 py-1.5 text-xs">{i}</button>)}
                </div>
                <button disabled={!text.trim()} className="w-full rounded-2xl bg-primary py-3.5 font-medium text-primary-foreground disabled:opacity-40">Enregistrer ({todays.length + 1}/3)</button>
              </form>
            )}

            {Object.keys(byDate).length > 0 && (
              <section>
                <h2 className="mb-3 text-lg font-medium">Entrées précédentes</h2>
                <div className="space-y-4">
                  {Object.entries(byDate).sort(([a], [b]) => b.localeCompare(a)).map(([d, items]) => (
                    <div key={d}>
                      <p className="mb-1 text-xs capitalize text-muted-foreground">{new Date(d + "T12:00").toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}</p>
                      <ul className="space-y-1">{items.map((g) => <li key={g.id} className="rounded-xl card-soft px-4 py-2.5 text-sm">{g.text}</li>)}</ul>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        );
      })()}
    </AppShell>
  );
}
