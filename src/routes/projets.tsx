import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, X, Trash2, Archive, Check } from "lucide-react";
import { AppShell, Loading, PageHeader } from "@/components/bloom/AppShell";
import { dateKey, STATUS_LABEL, uid, useBloom, type Project, type ProjectStatus } from "@/lib/bloom/store";

export const Route = createFileRoute("/projets")({
  head: () => ({
    meta: [
      { title: "Bloom — Mes projets" },
      { name: "description", content: "Tes projets et idées, leurs étapes et ton prochain petit pas." },
      { property: "og:title", content: "Bloom — Mes projets" },
      { property: "og:description", content: "Tes projets et idées, leurs étapes et ton prochain petit pas." },
    ],
  }),
  component: Projets,
});

const STATUSES = Object.keys(STATUS_LABEL) as ProjectStatus[];
const STATUS_STYLE: Record<ProjectStatus, string> = { idea: "bg-sky", active: "bg-primary text-primary-foreground", paused: "bg-muted", done: "bg-cocoa" };
const EXAMPLES = ["YouTube", "Livre", "Podcast", "Formation", "Projet professionnel"];
const STEP_TEMPLATE = ["Premières recherches", "Préparation", "Première réalisation", "Projet terminé"];
const blank = (): Project => ({ id: uid(), title: "", createdAt: dateKey(), status: "idea", steps: [] });

function Timeline({ p }: { p: Project }) {
  if (!p.steps.length) return null;
  return (
    <ol className="mt-3 flex items-start" aria-label="Frise de progression">
      {p.steps.map((s, i) => (
        <li key={s.id} className="relative flex flex-1 flex-col items-center text-center">
          {i > 0 && <span className={`absolute right-1/2 top-2 h-0.5 w-full ${s.done ? "bg-cocoa-deep" : "bg-cocoa/40"}`} />}
          <span className={`relative z-10 flex h-4 w-4 items-center justify-center rounded-full border-2 ${s.done ? "border-cocoa-deep bg-cocoa-deep" : "border-cocoa bg-card"}`} />
          <span className="mt-1 line-clamp-2 px-0.5 text-[10px] leading-tight text-muted-foreground">{s.text}</span>
        </li>
      ))}
    </ol>
  );
}

function Projets() {
  const { state, saveProject, deleteProject } = useBloom();
  const [filter, setFilter] = useState<ProjectStatus | "all" | "archived">("all");
  const [draft, setDraft] = useState<Project | null>(null);
  const [newStep, setNewStep] = useState("");

  const close = () => { setDraft(null); setNewStep(""); };
  const submit = () => { if (draft?.title.trim()) { saveProject({ ...draft, title: draft.title.trim() }); close(); } };

  return (
    <AppShell>
      <PageHeader title="Mes projets">
        <p className="mt-2 text-sm text-muted-foreground">Ce que je souhaite construire, un petit pas après l'autre.</p>
      </PageHeader>
      {!state ? <Loading /> : (() => {
        const list = state.projects.filter((p) => filter === "archived" ? p.archived : !p.archived && (filter === "all" || p.status === filter));
        return (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {(["all", ...STATUSES, "archived"] as const).map((f) => (
                <button key={f} aria-pressed={filter === f} onClick={() => setFilter(f)}
                  className={`rounded-full px-3 py-1.5 text-sm ${filter === f ? "bg-foreground text-background" : "bg-card"}`}>
                  {f === "all" ? "Tous" : f === "archived" ? "Archivés" : STATUS_LABEL[f]}
                </button>
              ))}
            </div>
            {list.length === 0 && (
              <p className="rounded-2xl card-soft p-5 text-center text-sm text-muted-foreground">
                {state.projects.length === 0 ? "Aucun projet pour l'instant. Une simple idée suffit pour commencer." : "Rien dans ce filtre."}
              </p>
            )}
            {list.map((p) => {
              const linked = state.routines.filter((r) => r.projectId === p.id);
              return (
                <button key={p.id} onClick={() => setDraft(structuredClone(p))} className="block w-full rounded-2xl card-soft p-4 text-left">
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-display text-lg leading-tight">{p.title}</span>
                    <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs ${STATUS_STYLE[p.status]}`}>{STATUS_LABEL[p.status]}</span>
                  </div>
                  {p.description && <p className="mt-1 text-sm text-muted-foreground">{p.description}</p>}
                  <Timeline p={p} />
                  {p.nextAction && <p className="mt-3 rounded-xl bg-sky px-3 py-2 text-sm">👉 Prochain pas : {p.nextAction}</p>}
                  {linked.length > 0 && <p className="mt-2 text-xs text-muted-foreground">Nourri par : {linked.map((r) => `${r.emoji} ${r.name}`).join(", ")}</p>}
                  {p.dueDate && <p className="mt-1 text-xs text-muted-foreground">Échéance souhaitée : {new Date(p.dueDate + "T12:00").toLocaleDateString("fr-FR")}</p>}
                </button>
              );
            })}
            <button onClick={() => setDraft(blank())} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-4 font-medium text-primary-foreground">
              <Plus className="h-5 w-5" /> Ajouter un projet ou une idée
            </button>
          </div>
        );
      })()}

      {draft && (
        <div className="fixed inset-0 z-30 flex items-end justify-center bg-plum/40" onClick={close}>
          <div role="dialog" aria-label="Projet" className="fade-up max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-card p-6 pb-10" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-medium">{state?.projects.some((p) => p.id === draft.id) ? "Mon projet" : "Nouveau projet"}</h2>
              <button aria-label="Fermer" onClick={close} className="rounded-full p-2 hover:bg-muted"><X className="h-5 w-5" /></button>
            </div>
            {!draft.title && (
              <div className="mb-3 flex flex-wrap gap-2">
                {EXAMPLES.map((e) => <button key={e} onClick={() => setDraft({ ...draft, title: e })} className="rounded-full bg-sky px-3 py-1 text-xs">{e}</button>)}
              </div>
            )}
            <div className="space-y-3">
              <input aria-label="Titre" placeholder="Titre" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} className="w-full rounded-xl border bg-background p-3 outline-none focus:ring-2 focus:ring-ring" />
              <input aria-label="Description" placeholder="Description courte (facultatif)" value={draft.description ?? ""} onChange={(e) => setDraft({ ...draft, description: e.target.value })} className="w-full rounded-xl border bg-background p-3 text-sm" />
              <div className="grid grid-cols-4 gap-1">
                {STATUSES.map((s) => (
                  <button key={s} aria-pressed={draft.status === s} onClick={() => setDraft({ ...draft, status: s })}
                    className={`rounded-xl border p-2 text-xs ${draft.status === s ? "border-primary bg-primary/10 text-primary" : ""}`}>{STATUS_LABEL[s]}</button>
                ))}
              </div>

              <div>
                <p className="mb-2 text-sm font-medium">Étapes</p>
                {draft.steps.length === 0 && (
                  <button onClick={() => setDraft({ ...draft, steps: STEP_TEMPLATE.map((t) => ({ id: uid(), text: t, done: false })) })} className="mb-2 rounded-full bg-sky px-3 py-1 text-xs">
                    Utiliser : {STEP_TEMPLATE.join(" → ")}
                  </button>
                )}
                <ul className="space-y-1.5">
                  {draft.steps.map((s, i) => (
                    <li key={s.id} className="flex items-center gap-2">
                      <button aria-label={s.done ? "Marquer non faite" : "Marquer faite"} aria-pressed={s.done}
                        onClick={() => setDraft({ ...draft, steps: draft.steps.map((x) => x.id === s.id ? { ...x, done: !x.done } : x) })}
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${s.done ? "border-cocoa-deep bg-cocoa-deep text-primary-foreground" : "border-cocoa"}`}>
                        {s.done && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
                      </button>
                      <input aria-label={`Étape ${i + 1}`} value={s.text} onChange={(e) => setDraft({ ...draft, steps: draft.steps.map((x) => x.id === s.id ? { ...x, text: e.target.value } : x) })} className="flex-1 rounded-lg border bg-background px-2 py-1.5 text-sm" />
                      <button aria-label="Retirer l'étape" onClick={() => setDraft({ ...draft, steps: draft.steps.filter((x) => x.id !== s.id) })} className="text-muted-foreground"><X className="h-4 w-4" /></button>
                    </li>
                  ))}
                </ul>
                <form className="mt-2 flex gap-2" onSubmit={(e) => { e.preventDefault(); if (newStep.trim()) { setDraft({ ...draft, steps: [...draft.steps, { id: uid(), text: newStep.trim(), done: false }] }); setNewStep(""); } }}>
                  <input aria-label="Nouvelle étape" placeholder="Ajouter une étape" value={newStep} onChange={(e) => setNewStep(e.target.value)} className="flex-1 rounded-lg border bg-background px-2 py-1.5 text-sm" />
                  <button className="rounded-lg bg-sky px-3 text-sm">Ajouter</button>
                </form>
              </div>

              <input aria-label="Prochaine action" placeholder="Prochaine petite action (facultatif)" value={draft.nextAction ?? ""} onChange={(e) => setDraft({ ...draft, nextAction: e.target.value })} className="w-full rounded-xl border bg-background p-3 text-sm" />
              <label className="block text-sm">
                <span className="mb-1 block text-muted-foreground">Échéance (facultatif)</span>
                <input type="date" value={draft.dueDate ?? ""} onChange={(e) => setDraft({ ...draft, dueDate: e.target.value || undefined })} className="w-full rounded-xl border bg-background p-3" />
              </label>
              <textarea aria-label="Note" rows={2} placeholder="Note personnelle (facultatif)" value={draft.note ?? ""} onChange={(e) => setDraft({ ...draft, note: e.target.value })} className="w-full resize-none rounded-xl border bg-background p-3 text-sm" />
              <p className="text-xs text-muted-foreground">Créé le {new Date(draft.createdAt + "T12:00").toLocaleDateString("fr-FR")}. Pour relier une routine, ouvre-la depuis « Gérer mes routines ».</p>
            </div>
            <div className="mt-6 flex gap-2">
              {state?.projects.some((p) => p.id === draft.id) && (
                <>
                  <button aria-label={draft.archived ? "Désarchiver" : "Archiver"} onClick={() => { saveProject({ ...draft, archived: !draft.archived }); close(); }} className="rounded-xl border px-3 text-muted-foreground"><Archive className="h-4 w-4" /></button>
                  <button aria-label="Supprimer" onClick={() => { if (confirm("Supprimer ce projet ?")) { deleteProject(draft.id); close(); } }} className="rounded-xl border px-3 text-muted-foreground"><Trash2 className="h-4 w-4" /></button>
                </>
              )}
              <button onClick={submit} disabled={!draft.title.trim()} className="flex-1 rounded-xl bg-primary py-3 font-medium text-primary-foreground disabled:opacity-40">Enregistrer</button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
