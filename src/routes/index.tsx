import { createFileRoute, Link } from "@tanstack/react-router";
import { Heart, Sparkles, ChevronRight } from "lucide-react";
import { AppShell, Loading, PageHeader } from "@/components/bloom/AppShell";
import { RoutineCheck } from "@/components/bloom/RoutineCheck";
import { dateKey, isScheduled, useBloom } from "@/lib/bloom/store";

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

function encouragement(done: number, total: number) {
  if (total === 0) return "Aucune routine prévue aujourd'hui. Profite de cet espace pour toi.";
  if (done === 0) return "Tu n'as pas besoin de tout accomplir aujourd'hui. Fais le prochain petit pas.";
  if (done < total) return "Chaque petit pas compte. Tu avances à ton rythme.";
  return "Belle journée. Prends un instant pour le reconnaître.";
}

function Today() {
  const { state, toggle } = useBloom();
  const today = new Date();
  const label = today.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });

  return (
    <AppShell>
      <PageHeader eyebrow={label} title={`${greeting()} 🌿`} />
      {!state ? (
        <Loading />
      ) : (
        (() => {
          const todays = state.routines.filter((r) => isScheduled(r, today, state));
          const doneIds = state.completions[dateKey()] ?? [];
          const done = todays.filter((r) => doneIds.includes(r.id)).length;
          return (
            <div className="space-y-6">
              <p className="fade-up rounded-2xl bg-sky px-5 py-4 font-display text-lg leading-snug text-foreground">
                « {encouragement(done, todays.length)} »
              </p>

              <section aria-labelledby="today-routines">
                <div className="mb-3 flex items-baseline justify-between">
                  <h2 id="today-routines" className="text-xl font-medium">Prévu aujourd'hui</h2>
                  {todays.length > 0 && (
                    <span className="text-sm text-muted-foreground">{done > 0 ? `${done} fait${done > 1 ? "s" : ""}` : "à ton rythme"}</span>
                  )}
                </div>
                <div className="space-y-3">
                  {todays.map((r) => (
                    <RoutineCheck key={r.id} routine={r} done={doneIds.includes(r.id)} onToggle={() => toggle(r.id)} />
                  ))}
                  {todays.length === 0 && (
                    <Link to="/routines" className="block rounded-2xl border border-dashed p-5 text-center text-sm text-muted-foreground">
                      Ajouter une routine
                    </Link>
                  )}
                </div>
              </section>

              <div className="grid gap-3">
                <Link to="/gratitude" className="flex items-center gap-4 rounded-2xl bg-powder/45 p-4">
                  <Heart className="h-5 w-5 text-primary" />
                  <span className="flex-1">
                    <span className="block font-medium">Une petite victoire ?</span>
                    <span className="block text-sm text-muted-foreground">
                      {done < todays.length ? "Qu'as-tu tout de même réussi à faire aujourd'hui ?" : "Note ce qui t'a fait du bien."}
                    </span>
                  </span>
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
