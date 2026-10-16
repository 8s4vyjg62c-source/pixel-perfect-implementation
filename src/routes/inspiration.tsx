import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, Loading, PageHeader } from "@/components/bloom/AppShell";
import { useBloom } from "@/lib/bloom/store";

export const Route = createFileRoute("/inspiration")({
  head: () => ({
    meta: [
      { title: "Bloom — Mon inspiration" },
      { name: "description", content: "Un espace facultatif de pensées encourageantes." },
      { property: "og:title", content: "Bloom — Mon inspiration" },
      { property: "og:description", content: "Un espace facultatif de pensées encourageantes." },
    ],
  }),
  component: Inspiration,
});

// Données de démonstration : pensées originales, aucun verset réel cité.
const THEMES = {
  "Espérance": "Ce qui semble immobile aujourd'hui est peut-être en train de germer.",
  "Patience": "Les racines poussent avant les fleurs. Laisse-toi le temps.",
  "Paix": "Respire. Ce moment n'a rien à te prouver.",
  "Persévérance": "Recommencer n'est pas échouer, c'est continuer autrement.",
  "Gratitude": "Remarquer une petite chose belle, c'est déjà la faire grandir.",
} as const;
type Theme = keyof typeof THEMES;

function Inspiration() {
  const { state, setBiblical } = useBloom();
  const [theme, setTheme] = useState<Theme>("Espérance");

  return (
    <AppShell>
      <PageHeader title="Mon inspiration">
        <p className="mt-2 text-sm text-muted-foreground">Un espace facultatif, à visiter quand tu le souhaites.</p>
      </PageHeader>
      {!state ? <Loading /> : (
        <div className="space-y-6">
          <div className="flex flex-wrap gap-2">
            {(Object.keys(THEMES) as Theme[]).map((t) => (
              <button key={t} onClick={() => setTheme(t)} aria-pressed={theme === t}
                className={`rounded-full px-4 py-2 text-sm ${theme === t ? "bg-primary text-primary-foreground" : "bg-sky"}`}>{t}</button>
            ))}
          </div>
          <figure key={theme} className="fade-up rounded-3xl bg-sky p-7">
            <blockquote className="font-display text-2xl leading-snug">« {THEMES[theme]} »</blockquote>
            <figcaption className="mt-4 text-xs text-muted-foreground">Pensée de démonstration</figcaption>
          </figure>

          <label className="flex items-center justify-between rounded-2xl card-soft p-4">
            <span>
              <span className="block font-medium">Contenus bibliques</span>
              <span className="block text-sm text-muted-foreground">Afficher un verset lié au thème</span>
            </span>
            <input type="checkbox" role="switch" checked={state.biblicalContent} onChange={(e) => setBiblical(e.target.checked)} className="h-5 w-9 accent-primary" />
          </label>

          {state.biblicalContent && (
            <div className="fade-up rounded-2xl border border-dashed border-powder bg-powder/20 p-5">
              <p className="text-xs font-medium uppercase tracking-wide text-primary">Exemple de démonstration</p>
              <p className="mt-2 font-display text-lg">Verset sur le thème « {theme} »</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Emplacement réservé : les versets seront ajoutés à partir d'une traduction autorisée, avec leur référence exacte.
              </p>
            </div>
          )}
        </div>
      )}
    </AppShell>
  );
}
