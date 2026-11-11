import { countries, worldLabels } from "@/lib/world/model";
import type { Project } from "@/lib/bloom/store";

export function GeographyFields({ project, onChange }: { project: Project; onChange: (p: Project) => void }) {
  const country = countries.find(c => c.id === project.geography?.country);
  return <fieldset className="space-y-3 border-t pt-4">
    <legend className="text-sm font-medium">Un lieu dans mon monde · facultatif</legend>
    <label className="block text-sm">Lieu libre<input value={project.location ?? ""} onChange={e => onChange({ ...project, location: e.target.value })} className="mt-1 w-full rounded-xl border bg-background p-3" /></label>
    <label className="block text-sm">Pays<select aria-label="Pays" value={project.geography?.country ?? ""} onChange={e => onChange({ ...project, geography: e.target.value ? { ...project.geography, country: e.target.value } : undefined })} className="mt-1 w-full rounded-xl border bg-background p-3"><option value="">Sans pays</option>{countries.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
    {country && <>
      <p className="text-xs text-muted-foreground">{country.continent}</p>
      <label className="block text-sm">Ville ou région<input aria-label="Ville ou région" value={project.geography?.region ?? ""} onChange={e => onChange({ ...project, geography: { country: country.id, region: e.target.value } })} className="mt-1 w-full rounded-xl border bg-background p-3" /></label>
      {project.status === "idea" && <label className="block text-sm">Intention géographique<select aria-label="Intention géographique" value={project.worldStatus ?? ""} onChange={e => onChange({ ...project, worldStatus: e.target.value === "wish" ? "wish" : e.target.value === "planned" ? "planned" : undefined })} className="mt-1 w-full rounded-xl border bg-background p-3"><option value="">Une idée, sans statut géographique</option><option value="wish">Envie</option><option value="planned">En projet</option></select></label>}
      {project.status === "paused" ? <p className="text-xs text-muted-foreground">Ce projet en pause reste dans Mes projets, sans être assimilé à une envie.</p> : <p className="text-xs text-muted-foreground">Dans Mon monde : {project.status === "done" ? worldLabels.realized : project.status === "active" ? worldLabels.planned : project.worldStatus ? worldLabels[project.worldStatus] : "aucun statut choisi"}.</p>}
      <label className="block text-sm">Date de l’expérience ou de l’intention<input aria-label="Date géographique" type="date" value={project.worldDate ?? ""} onChange={e => onChange({ ...project, worldDate: e.target.value })} className="mt-1 w-full rounded-xl border bg-background p-3" /></label>
      <p className="text-xs text-muted-foreground">Sans date, cet élément apparaît dans « Depuis le début ». Pour les envies et projets, l’échéance sert de période si aucune autre date n’est renseignée.</p>
    </>}
  </fieldset>;
}