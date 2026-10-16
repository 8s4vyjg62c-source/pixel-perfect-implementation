import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Heart, Sparkles } from "lucide-react";
import { AppShell, Loading, PageHeader } from "@/components/bloom/AppShell";
import { useBloom, type BloomState, type Review } from "@/lib/bloom/store";
import { doneCount, getPeriod, hasDataBefore, plannedCount, totalDone, type Period, type PeriodKind } from "@/lib/bloom/stats";

export const Route = createFileRoute("/bilan")({
  head: () => ({
    meta: [
      { title: "Bloom — Mon bilan" },
      { name: "description", content: "Ce que j'avais prévu, ce que j'ai réalisé, et ce que je retiens." },
      { property: "og:title", content: "Bloom — Mon bilan" },
      { property: "og:description", content: "Ce que j'avais prévu, ce que j'ai réalisé, et ce que je retiens." },
    ],
  }),
  component: Bilan,
});

const KINDS: [PeriodKind, string][] = [["week", "Semaine"], ["month", "Mois"], ["year", "Année"]];
const UNIT: Record<PeriodKind, string> = { week: "la semaine précédente", month: "le mois précédent", year: "l'année précédente" };
const CLOSING = [
  "Tu n'as pas tout fait, mais cette période a quand même compté.",
  "Regarde le chemin parcouru avant de regarder celui qu'il reste à faire.",
  "La prochaine étape peut être petite. Elle peut quand même te faire avancer.",
];
const SUGGEST: Record<keyof Pick<Review, "worked" | "learned" | "adjust">, string[]> = {
  worked: ["Mes routines du matin ont tenu.", "Je me suis accordé du repos."],
  learned: ["Je lis plus facilement le matin.", "Je dois mieux répartir mes séances de sport."],
  adjust: ["Cette période était chargée : je peux réduire mes objectifs.", "Garder une seule priorité."],
};
const emptyReview: Review = { worked: "", learned: "", adjust: "", victory: "", gratitude: "" };

function Bilan() {
  const { state, saveReview } = useBloom();
  const [kind, setKind] = useState<PeriodKind>("week");
  const [offset, setOffset] = useState(0);
  const period = getPeriod(kind, offset);
  const prev = getPeriod(kind, offset - 1);

  return (
    <AppShell>
      <PageHeader title="Mon bilan">
        <p className="mt-2 text-sm text-muted-foreground">Ce que j'ai accompli, ce que j'ai appris, mon prochain petit pas.</p>
      </PageHeader>
      <div role="tablist" className="mb-4 grid grid-cols-3 gap-1 rounded-full bg-card p-1">
        {KINDS.map(([k, l]) => (
          <button key={k} role="tab" aria-selected={kind === k} onClick={() => { setKind(k); setOffset(0); }}
            className={`rounded-full py-2 text-sm font-medium ${kind === k ? "bg-primary text-primary-foreground" : "text-foreground"}`}>{l}</button>
        ))}
      </div>
      <div className="mb-6 flex items-center justify-between">
        <button aria-label="Période précédente" onClick={() => setOffset(offset - 1)} className="rounded-full p-2 hover:bg-card"><ChevronLeft className="h-5 w-5" /></button>
        <p className="text-center font-medium capitalize">{period.label}{offset === 0 && <span className="block text-xs font-normal normal-case text-muted-foreground">période en cours</span>}</p>
        <button aria-label="Période suivante" disabled={offset >= 0} onClick={() => setOffset(offset + 1)} className="rounded-full p-2 hover:bg-card disabled:opacity-30"><ChevronRight className="h-5 w-5" /></button>
      </div>
      {!state ? <Loading /> : <BilanBody key={period.key} state={state} period={period} prev={prev} saveReview={saveReview} />}
    </AppShell>
  );
}

function Bar({ value, max, className }: { value: number; max: number; className: string }) {
  return (
    <div className="h-2.5 w-full overflow-hidden rounded-full bg-background">
      <div className={`h-full rounded-full ${className}`} style={{ width: `${max ? Math.min(100, (value / max) * 100) : 0}%` }} />
    </div>
  );
}

function BilanBody({ state, period, prev, saveReview }: { state: BloomState; period: Period; prev: Period; saveReview: (k: string, r: Review) => void }) {
  const [review, setReview] = useState<Review>(state.reviews[period.key] ?? emptyReview);
  const [saved, setSaved] = useState(false);
  useEffect(() => { setSaved(false); }, [review]);

  const today = new Date();
  const hasPrev = hasDataBefore(state, period.start);
  const rows = state.routines.map((r) => ({
    r,
    planned: plannedCount(r, period.start, period.end),
    done: doneCount(state, r.id, period.start, period.end),
    before: doneCount(state, r.id, prev.start, prev.end),
  }));
  const total = totalDone(state, period.start, period.end);
  const totalPrev = totalDone(state, prev.start, prev.end);
  const gratitudeCount = state.gratitude.filter((g) => { const d = new Date(g.date + "T12:00"); return d >= period.start && d <= new Date(period.end.getTime() + 86399999); }).length;

  // Graphique d'évolution : sous-périodes
  const series = (() => {
    if (period.kind === "week") return [-3, -2, -1, 0].map((o) => { const p = getPeriod("week", 0, new Date(period.start.getTime() + o * 7 * 86400000)); return { label: p.start.toLocaleDateString("fr-FR", { day: "numeric", month: "short" }), v: totalDone(state, p.start, p.end) }; });
    if (period.kind === "month") {
      const out = [];
      for (let d = new Date(period.start); d <= period.end; d.setDate(d.getDate() + 7)) {
        const e = new Date(d); e.setDate(d.getDate() + 6);
        out.push({ label: `${d.getDate()}`, v: totalDone(state, d, e > period.end ? period.end : e) });
      }
      return out;
    }
    return Array.from({ length: 12 }, (_, m) => { const s = new Date(period.start.getFullYear(), m, 1); const e = new Date(s.getFullYear(), m + 1, 0); return { label: s.toLocaleDateString("fr-FR", { month: "narrow" }), v: totalDone(state, s, e) }; });
  })();
  const seriesMax = Math.max(1, ...series.map((s) => s.v));
  const projectsMoved = state.projects.filter((p) => !p.archived && p.steps.some((s) => s.done));
  const closing = CLOSING[(period.start.getDate() + period.start.getMonth()) % CLOSING.length];
  const future = period.start > today;

  const field = (k: keyof Review, label: string, ph: string) => (
    <label className="block">
      <span className="mb-1 block text-sm font-medium">{label}</span>
      <textarea rows={2} maxLength={300} value={review[k]} placeholder={ph} onChange={(e) => setReview({ ...review, [k]: e.target.value })}
        className="w-full resize-none rounded-2xl border bg-card p-3 text-sm outline-none focus:ring-2 focus:ring-ring" />
      {k in SUGGEST && !review[k] && (
        <span className="mt-1 flex flex-wrap gap-1.5">
          {SUGGEST[k as keyof typeof SUGGEST].map((s) => <button type="button" key={s} onClick={() => setReview({ ...review, [k]: s })} className="rounded-full bg-sky px-3 py-1 text-xs">{s}</button>)}
        </span>
      )}
    </label>
  );

  return (
    <div className="space-y-6">
      <div className="fade-up rounded-2xl bg-sky p-5">
        <p className="text-sm text-muted-foreground">Actions réalisées</p>
        <p className="font-display text-4xl">{total}</p>
        <p className="mt-1 text-sm">
          {!hasPrev ? "Pas encore assez de données pour comparer avec la période précédente."
            : totalPrev === 0 ? `Aucune action enregistrée pendant ${UNIT[period.kind]}.`
            : total > totalPrev ? `Contre ${totalPrev} ${UNIT[period.kind]}. Ça progresse.`
            : `Contre ${totalPrev} ${UNIT[period.kind]}.`}
          {gratitudeCount > 0 && ` · ${gratitudeCount} gratitude${gratitudeCount > 1 ? "s" : ""} notée${gratitudeCount > 1 ? "s" : ""}.`}
        </p>
      </div>

      <section className="card-soft p-4">
        <h2 className="text-lg font-medium">Prévu et réalisé</h2>
        <p className="mb-4 flex gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><span className="h-2 w-4 rounded-full bg-primary" /> réalisé</span>
          <span className="flex items-center gap-1"><span className="h-2 w-4 rounded-full bg-cocoa" /> période précédente</span>
        </p>
        {rows.length === 0 && <p className="text-sm text-muted-foreground">Aucune routine pour l'instant.</p>}
        <ul className="space-y-4">
          {rows.map(({ r, planned, done, before }) => (
            <li key={r.id}>
              <div className="mb-1 flex justify-between text-sm">
                <span>{r.emoji} {r.name}</span>
                <span className="text-muted-foreground">{done} sur {planned} prévue{planned > 1 ? "s" : ""}</span>
              </div>
              <Bar value={done} max={Math.max(planned, done)} className="bg-primary" />
              {hasPrev && <div className="mt-1"><Bar value={before} max={Math.max(planned, before, done)} className="bg-cocoa" /></div>}
              {hasPrev && done > before && before >= 0 && <p className="mt-1 text-xs text-foreground/80">↗ {done} contre {before} {UNIT[period.kind]}</p>}
            </li>
          ))}
        </ul>
      </section>

      <section className="card-soft p-4">
        <h2 className="mb-4 text-lg font-medium">Ma régularité</h2>
        <div className="flex h-28 items-end gap-1.5">
          {series.map((s, i) => (
            <div key={i} className="flex flex-1 flex-col items-center gap-1">
              <span className="text-[10px] text-muted-foreground">{s.v || ""}</span>
              <div className={`w-full rounded-t-md ${i === series.length - 1 && period.kind === "week" ? "bg-primary" : "bg-cocoa"}`} style={{ height: `${(s.v / seriesMax) * 80 + 2}px` }} />
              <span className="text-[10px] text-muted-foreground">{s.label}</span>
            </div>
          ))}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          {period.kind === "week" ? "Actions par semaine (4 dernières)." : period.kind === "month" ? "Actions par semaine du mois." : "Actions par mois."}
        </p>
      </section>

      {period.kind !== "week" && projectsMoved.length > 0 && (
        <section className="card-soft p-4">
          <h2 className="mb-2 text-lg font-medium">Projets qui ont avancé</h2>
          <ul className="space-y-1 text-sm">
            {projectsMoved.map((p) => <li key={p.id}>💡 {p.title} — {p.steps.filter((s) => s.done).length}/{p.steps.length} étapes</li>)}
          </ul>
        </section>
      )}

      {!future && (
        <form onSubmit={(e) => { e.preventDefault(); saveReview(period.key, review); setSaved(true); }} className="space-y-4">
          <h2 className="text-lg font-medium">Ce que je retiens</h2>
          {field("worked", "Ce qui a bien fonctionné", "Facultatif…")}
          {field("learned", "Ce que j'ai appris sur mon organisation ou mes besoins", "Facultatif…")}
          {field("adjust", "Ce que je souhaite ajuster pour la suite", "Facultatif…")}
          <div className="rounded-2xl bg-powder/50 p-4">{field("victory", "🏅 Ma petite victoire", "J'ai repris le sport après une pause…")}</div>
          <div className="rounded-2xl bg-powder/30 p-4">{field("gratitude", "💗 Ma gratitude", "Je suis reconnaissant·e pour…")}</div>
          <button className="w-full rounded-2xl bg-primary py-3.5 font-medium text-primary-foreground">{saved ? "Enregistré ✓" : "Enregistrer mon bilan"}</button>
        </form>
      )}

      <p className="rounded-2xl bg-sky p-5 text-center font-display text-lg leading-snug">« {closing} »</p>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <Link to="/gratitude" className="flex items-center gap-2 rounded-2xl card-soft p-3"><Heart className="h-4 w-4 text-primary" /> Gratitude</Link>
        <Link to="/inspiration" className="flex items-center gap-2 rounded-2xl card-soft p-3"><Sparkles className="h-4 w-4 text-primary" /> Inspiration</Link>
      </div>
    </div>
  );
}
