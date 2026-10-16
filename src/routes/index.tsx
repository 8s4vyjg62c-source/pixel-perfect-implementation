import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Heart, Sparkles, ChevronRight, ChartColumn, Settings2, X } from "lucide-react";
import { AppShell, Loading, PageHeader } from "@/components/bloom/AppShell";
import { RoutineCheck } from "@/components/bloom/RoutineCheck";
import { dateKey, isScheduled, useBloom } from "@/lib/bloom/store";
import { dailyMessage, nudges } from "@/lib/bloom/motivation";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Bloom — Aujourd'hui" },
      { name: "description", content: "Tes routines du jour, à ton rythme, sans culpabilité." },
      { property: "og:title", content: "Bloom — Aujourd'hui" },
      { property: "og:description", content: "Tes routines du jour, à ton rythme, sans culpabilité." },
    ],
  }),
  component: Today,
});

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Bonjour" : h < 18 ? "Bon après-midi" : "Bonsoir";
}

function Today() {
  const { state, toggle } = useBloom();
  const [dismissed, setDismissed] = useState<string[]>([]);
  const today = new Date();
  const label = today.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });

  return (
    <AppShell>
      <PageHeader eyebrow={label} title={`${greeting()} 🌸`} />
      {!state ? (
        <Loading />
      ) : (
        (() => {
          const doneIds = state.completions[dateKey()] ?? [];
          const todays = state.routines.filter((r) => isScheduled(r, today, state) || doneIds.includes(r.id));
          const done = todays.filter((r) => doneIds.includes(r.id)).length;
          const tips = nudges(state, today).filter((n) => !dismissed.includes(n.id));
          const projectTitle = (id?: string) => state.projects.find((p) => p.id === id)?.title;
          return (
            <div className="space-y-6">
              <p className="fade-up rounded-2xl bg-sky px-5 py-4 font-display text-lg leading-snug text-foreground">
                « {dailyMessage(state, today)} »
              </p>

              <section aria-labelledby="today-routines">
                <div className="mb-3 flex items-baseline justify-between">
                  <h2 id="today-routines" className="text-xl font-medium">Prévu aujourd'hui</h2>
                  {done > 0 && <span className="text-sm text-muted-foreground">{done} action{done > 1 ? "s" : ""} faite{done > 1 ? "s" : ""}</span>}
                </div>
                <div className="space-y-3">
                  {todays.map((r) => (
                    <RoutineCheck key={r.id} routine={r} projectTitle={projectTitle(r.projectId)} done={doneIds.includes(r.id)} onToggle={() => toggle(r.id)} />
                  ))}
                  {todays.length === 0 && <p className="rounded-2xl card-soft p-5 text-center text-sm text-muted-foreground">Rien de prévu aujourd'hui.</p>}
                  <Link to="/routines" className="flex items-center justify-center gap-2 rounded-2xl border border-dashed border-cocoa p-3 text-sm text-foreground">
                    <Settings2 className="h-4 w-4" /> Gérer mes routines
                  </Link>
                </div>
              </section>

              {tips.length > 0 && (
                <section aria-label="Suggestions douces" className="space-y-2">
                  {tips.map((t) => (
                    <div key={t.id} className="fade-up flex items-start gap-3 rounded-2xl border border-cocoa/60 bg-card p-4 text-sm">
                      <span aria-hidden>{t.kind === "resume" ? "🌱" : "🪶"}</span>
                      <span className="flex-1">
                        {t.text}
                        {t.kind === "adjust" && <Link to="/routines" className="mt-1 block font-medium text-primary">Ajuster la fréquence</Link>}
                      </span>
                      <button aria-label="Masquer cette suggestion" onClick={() => setDismissed([...dismissed, t.id])} className="text-muted-foreground"><X className="h-4 w-4" /></button>
                    </div>
                  ))}
                </section>
              )}

              <div className="grid gap-3">
                <Link to="/gratitude" className="flex items-center gap-4 rounded-2xl bg-powder/60 p-4">
                  <Heart className="h-5 w-5 text-primary" />
                  <span className="flex-1">
                    <span className="block font-medium">Une petite victoire ?</span>
                    <span className="block text-sm text-foreground/80">
                      {done < todays.length ? "Qu'as-tu tout de même réussi à faire aujourd'hui ?" : "Note ce qui t'a fait du bien."}
                    </span>
                  </span>
                  <ChevronRight className="h-4 w-4" />
                </Link>
                <Link to="/bilan" className="flex items-center gap-4 rounded-2xl card-soft p-4">
                  <ChartColumn className="h-5 w-5 text-primary" />
                  <span className="flex-1 font-medium">Voir mon bilan de la semaine</span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </Link>
                <Link to="/inspiration" className="flex items-center gap-4 rounded-2xl card-soft p-4">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <span className="flex-1 font-medium">Mon inspiration</span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </Link>
              </div>
            </div>
          );
        })()
      )}
    </AppShell>
  );
}
