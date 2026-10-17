import { useState } from "react";
import { EyeOff, ThumbsUp, RotateCcw, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { reflections } from "@/lib/bloom/reflections";
import { useBloom } from "@/lib/bloom/store";
import type { Period } from "@/lib/bloom/stats";

export function Reflections({ period }: { period: Period }) {
  const { state, setSuggestionFeedback } = useBloom();
  const [showHidden, setShowHidden] = useState(false);
  if (!state) return null;
  const all = reflections(state, period);
  const visible = all.filter((r) => showHidden || !["hidden", "ignored"].includes(state.suggestionFeedback[r.id] ?? ""));
  return <section className="space-y-4" aria-label="Mes pistes de réflexion">
    <p className="text-sm text-muted-foreground">À partir de tes enregistrements pour cette période. Ces questions restent facultatives.</p>
    {!all.length && <p className="rounded-2xl bg-sky p-5 text-sm">Nous aurons besoin d'un peu plus de recul pour te proposer des pistes adaptées. Continue simplement à enregistrer ce qui compte pour toi.</p>}
    {visible.map((r) => <article key={r.id} className="card-soft p-5">
      <h2 className="text-lg">{r.category}</h2><p className="mt-2 text-sm whitespace-pre-wrap break-words">{r.observation}</p>
      <p className="mt-3 text-sm font-medium">{r.question}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button variant="secondary" size="sm" aria-pressed={state.suggestionFeedback[r.id] === "useful"} onClick={() => setSuggestionFeedback(r.id, "useful")}><ThumbsUp />{state.suggestionFeedback[r.id] === "useful" ? "Notée utile" : "Utile"}</Button>
        <Button variant="ghost" size="sm" onClick={() => setSuggestionFeedback(r.id, "hidden")}><EyeOff />Masquer</Button>
        <Button variant="ghost" size="sm" onClick={() => setSuggestionFeedback(r.id, "ignored")}><Minus />Ignorer</Button>
      </div>
      <details className="mt-3 text-xs text-muted-foreground"><summary>Sur quoi repose cette piste ?</summary><p className="mt-2">{r.sources.map((s) => s.startsWith("routine:") ? "Routine choisie" : s.startsWith("completions:") ? "Actions cochées dans la période" : s.startsWith("project:") ? "Projet et étapes enregistrés" : s.startsWith("gratitude:") ? "Gratitude enregistrée dans la période" : "Ton bilan personnel pour cette période").filter((s, i, a) => a.indexOf(s) === i).join(" · ")}</p></details>
    </article>)}
    {all.some((r) => ["hidden", "ignored"].includes(state.suggestionFeedback[r.id] ?? "")) && <Button variant="ghost" size="sm" onClick={() => setShowHidden(!showHidden)}><RotateCcw />{showHidden ? "Revenir aux pistes visibles" : "Voir les pistes mises de côté"}</Button>}
  </section>;
}