import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, ArrowUpRight, Compass, Globe2, Plus, Minus, Maximize, MapPin, X, Check, Sparkles } from "lucide-react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { AppShell, Loading } from "@/components/bloom/AppShell";
import { GeographyFields } from "@/components/bloom/GeographyFields";
import { Button } from "@/components/ui/button";
import { useBloom, type Project } from "@/lib/bloom/store";
import { countries, continents, worldProjects, geographicStatus, geographicDate, worldLabels, type WorldStatus } from "@/lib/world/model";

export const Route = createFileRoute("/mon-monde")({
  head: () => ({ meta: [
    { title: "Laëori — Mon monde" },
    { name: "description", content: "Les lieux vécus, les projets et les horizons à découvrir, à ton rythme." },
    { property: "og:title", content: "Laëori — Mon monde" },
    { property: "og:description", content: "Une nouvelle manière de contempler ton parcours et tes envies de découverte." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
  ] }), component: MonMonde,
});
const tones: Record<WorldStatus, string> = { realized: "fill-world-realized", planned: "fill-world-planned", wish: "fill-world-wish" };
const dots: Record<WorldStatus, string> = { realized: "bg-world-realized", planned: "bg-world-planned", wish: "bg-world-wish" };
const icons = { realized: Check, planned: Compass, wish: Sparkles };
const continentPoints: [string, number, number][] = [["Amérique du Nord", 210, 175], ["Amérique du Sud", 350, 360], ["Europe", 520, 160], ["Afrique", 525, 290], ["Asie", 730, 185], ["Océanie", 830, 380], ["Antarctique", 505, 525]];

function MonMonde() {
  const { state, saveProject } = useBloom();
  const [mode, setMode] = useState<"all" | "year">("all");
  const [year, setYear] = useState(new Date().getFullYear());
  const [status, setStatus] = useState<WorldStatus | "all">("all");
  const [continent, setContinent] = useState("all");
  const [selected, setSelected] = useState<string>();
  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState<Project>();
  const [assigning, setAssigning] = useState(false);
  const list = state ? worldProjects(state.projects, mode, year, status, continent) : [];
  const groups = new Map<string, Project[]>();
  list.forEach(p => { const id = p.geography?.country; if (id) groups.set(id, [...(groups.get(id) ?? []), p]); });
  const country = countries.find(c => c.id === selected);
  const found = countries.filter(c => (continent === "all" || c.continent === continent) && c.name.toLocaleLowerCase("fr").includes(search.toLocaleLowerCase("fr")));
  const associated = selected ? groups.get(selected) ?? [] : [];
  const allAssociated = state?.projects.filter(p => !p.archived && p.geography?.country === selected) ?? [];
  return <AppShell wide>
    <div className="mb-6 flex items-center justify-between border-b pb-4 text-sm"><Link to="/projets" className="flex items-center gap-2"><ArrowLeft className="h-4 w-4" />Mes projets</Link><span className="font-display text-xl">Laëori <span className="ml-2 text-xs font-sans text-muted-foreground">MON MONDE</span></span></div>
    <header className="mb-7"><p className="mb-2 flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground"><Compass className="h-4 w-4" /> Mes horizons</p><h1 className="font-display text-4xl md:text-5xl">Mon monde</h1><p className="mt-3 text-sm text-muted-foreground">Les horizons que tu as déjà découverts et ceux qui t’attendent.</p></header>
    {!state ? <Loading /> : <>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2"><div className="flex rounded-full bg-card p-1"><Button className="rounded-full" variant={mode === "all" ? "default" : "ghost"} onClick={() => setMode("all")}>Depuis le début</Button><Button className="rounded-full" variant={mode === "year" ? "default" : "ghost"} onClick={() => setMode("year")}>Cette année</Button></div>{mode === "year" && <input aria-label="Année" type="number" min={1} max={9999} value={year} onChange={e => setYear(Number(e.target.value))} className="w-24 rounded-lg border bg-card p-2 text-sm" />}</div>
        <Button variant="outline" className="rounded-full" onClick={() => setAssigning(true)}><MapPin />Associer un lieu</Button>
      </div>
      <div className="mb-4 flex flex-wrap gap-2" aria-label="Continents"><Button variant={continent === "all" ? "secondary" : "ghost"} className="rounded-full" onClick={() => { setContinent("all"); setSelected(undefined); }}><Globe2 />Le monde</Button>{continents.map(c => <Button key={c} size="sm" className="rounded-full" variant={continent === c ? "secondary" : "ghost"} aria-pressed={continent === c} onClick={() => { setContinent(c); setSelected(undefined); }}>{c}</Button>)}</div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <section className="min-w-0">
          <div className="world-map relative aspect-[1.65] min-h-64 overflow-hidden rounded-2xl border border-world-line/30 bg-world-ocean md:aspect-[1.7]">
            <TransformWrapper minScale={1} maxScale={8} wheel={{ step: 0.08 }} doubleClick={{ disabled: true }}>
              {({ zoomIn, zoomOut, resetTransform }) => <>
                <TransformComponent><svg viewBox="0 0 1000 565" className="h-full w-full" aria-label="Planisphère des pays" role="group">
                  {countries.map(c => <path key={c.id} d={c.path ?? ""} role="button" aria-label={`Sélectionner ${c.name}`} tabIndex={-1} onClick={() => setSelected(c.id)} className={`cursor-pointer stroke-world-ocean transition-colors hover:fill-cocoa ${selected === c.id ? "fill-cocoa" : continent !== "all" && c.continent !== continent ? "fill-world-land/25" : "fill-world-land"}`} strokeWidth={0.8}><title>{c.name}</title></path>)}
                  {continentPoints.map(([name,x,y]) => <text key={name} x={x} y={y} textAnchor="middle" className="pointer-events-none fill-foreground/65 font-sans text-[12px]">{name.toLocaleUpperCase("fr")}</text>)}
                  {[...groups].map(([id, ps]) => { const c = countries.find(c => c.id === id); if (!c?.point) return null; const s = geographicStatus(ps[0]); if (!s) return null; return <g key={id} role="button" aria-label={`Lieux en ${c.name}`} onClick={() => setSelected(id)} className="cursor-pointer"><circle cx={c.point[0]} cy={c.point[1]} r={13} className="fill-world-ocean/90" /><circle cx={c.point[0]} cy={c.point[1]} r={7} className={tones[s]} /><title>{c.name} — {ps.map(p => p.title).join(", ")}</title>{new Set(ps.map(p => geographicStatus(p))).size > 1 && <circle cx={c.point[0]+8} cy={c.point[1]-8} r={3} className="fill-world-wish" />}</g>; })}
                </svg></TransformComponent>
                <div className="absolute bottom-3 right-3 flex rounded-full bg-card p-1 shadow-sm"><Button variant="ghost" size="icon" title="Zoom avant" aria-label="Zoom avant" onClick={() => zoomIn()}><Plus /></Button><Button variant="ghost" size="icon" title="Zoom arrière" aria-label="Zoom arrière" onClick={() => zoomOut()}><Minus /></Button><Button variant="ghost" size="icon" title="Vue globale" aria-label="Vue globale" onClick={() => resetTransform()}><Maximize /></Button></div>
              </>}
            </TransformWrapper>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2" aria-label="Filtrer par statut"><Button size="sm" variant={status === "all" ? "secondary" : "ghost"} aria-pressed={status === "all"} onClick={() => setStatus("all")}>Tout</Button>{(Object.keys(worldLabels) as WorldStatus[]).map(s => <Button key={s} size="sm" variant={status === s ? "secondary" : "ghost"} aria-pressed={status === s} onClick={() => setStatus(s)}><span className={`h-2 w-2 rounded-full ${dots[s]}`} />{worldLabels[s]}</Button>)}</div>
          <p className="mt-5 font-display text-xl">Chaque découverte a sa place.</p>
          {list.length === 0 && <p className="mt-2 text-sm text-muted-foreground">{mode === "year" ? "Aucun élément localisé et daté pour cette année. Les lieux sans date restent visibles depuis le début." : "Ton monde attend tes premiers lieux. Associe un pays à l’un de tes projets, proche ou lointain."}</p>}
          <p className="mt-7 text-xs text-muted-foreground">Fond de carte : Natural Earth · domaine public. Les repères correspondent aux pays, pas à une adresse précise.</p>
        </section>
        <aside className="min-w-0 border-t pt-5 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
          <label className="block text-sm">Explorer un pays<input aria-label="Rechercher un pays" placeholder="Nom du pays…" value={search} onChange={e => setSearch(e.target.value)} className="mt-2 w-full rounded-xl border bg-card px-3 py-2.5" /></label>
          <select aria-label="Choisir un pays" value={selected ?? ""} onChange={e => setSelected(e.target.value || undefined)} className="mt-2 w-full rounded-xl border bg-card p-2.5 text-sm"><option value="">Tous les pays</option>{found.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
          {country ? <div className="mt-6 fade-up"><p className="text-xs uppercase tracking-widest text-muted-foreground">{country.continent}</p><h2 className="mt-1 text-3xl">{country.name}</h2><div className="mt-4 space-y-4">{associated.map(p => { const s = geographicStatus(p); if (!s) return null; const Icon = icons[s]; return <article key={p.id} className="overflow-hidden rounded-xl border bg-card">{p.photo && <img src={p.photo} alt={p.title} className="aspect-[4/3] w-full object-cover" />}<div className="p-4"><p className="flex items-center gap-2 text-xs"><span className={`h-2 w-2 rounded-full ${dots[s]}`} /><Icon className="h-3 w-3" />{worldLabels[s]}</p><h3 className="mt-2 break-words text-xl">{p.title}</h3>{p.geography?.region && <p className="mt-1 text-xs text-muted-foreground">{p.geography.region}</p>}<p className="mt-2 text-xs text-muted-foreground">{geographicDate(p) ? new Date(`${geographicDate(p)}T12:00`).toLocaleDateString("fr-FR",{ day:"numeric", month:"long", year:"numeric" }) : "Sans date renseignée"}</p>{p.description && <p className="mt-3 break-words text-sm">{p.description}</p>}{p.note && <p className="mt-3 whitespace-pre-wrap break-words border-t pt-3 text-sm">{p.note}</p>}<Button variant="link" className="mt-2 px-0" onClick={() => setDraft(structuredClone(p))}>Modifier le lieu<ArrowUpRight /></Button></div></article>; })}{!associated.length && <p className="text-sm text-muted-foreground">{allAssociated.length ? "Les éléments de ce pays ne correspondent pas aux filtres actuels." : "Aucun souvenir, projet ou envie associé à ce pays pour le moment."}</p>}<Button variant="outline" className="w-full" onClick={() => setAssigning(true)}><Plus />Associer un projet</Button></div></div> : <div className="mt-6"><h2 className="text-xl">Mes horizons</h2><div className="mt-3 space-y-1">{[...groups].map(([id]) => {const c = countries.find(c => c.id === id);return c && <Button key={id} variant="ghost" className="w-full justify-between" onClick={() => setSelected(id)}>{c.name}<ArrowUpRight /></Button>;})}</div><p className="mt-6 text-sm leading-relaxed text-muted-foreground">L’invisible aussi te fait grandir.</p></div>}
        </aside>
      </div>
    </>}
    {(assigning || draft) && <div className="fixed inset-0 z-30 flex items-center justify-center bg-plum/40 p-4" onClick={() => { setDraft(undefined); setAssigning(false); }}><div role="dialog" aria-modal="true" aria-label="Associer un lieu" className="max-h-[85vh] w-full max-w-md overflow-y-auto rounded-2xl bg-card p-5" onClick={e => e.stopPropagation()}><div className="mb-4 flex items-center justify-between"><h2 className="text-xl">Un lieu dans mon monde</h2><Button variant="ghost" size="icon" aria-label="Fermer" onClick={() => {setDraft(undefined);setAssigning(false);}}><X /></Button></div>{draft ? <form onSubmit={e => {e.preventDefault();saveProject(draft);setSelected(draft.geography?.country);setDraft(undefined);setAssigning(false);}}><h3 className="mb-4 break-words text-lg">{draft.title}</h3><GeographyFields project={draft} onChange={setDraft} /><Button className="mt-5 w-full" type="submit">Enregistrer</Button></form> : <div className="space-y-2">{state?.projects.filter(p => !p.archived).map(p => <Button key={p.id} variant="outline" className="h-auto min-h-10 w-full justify-between whitespace-normal text-left" onClick={() => setDraft({...structuredClone(p), geography:p.geography ?? (selected ? {country:selected} : undefined)})}>{p.title}<ArrowUpRight /></Button>)}{!state?.projects.some(p => !p.archived) && <p className="text-sm text-muted-foreground">Crée d’abord un projet ou une idée dans Mes projets.</p>}<Button asChild variant="link"><Link to="/projets">Ouvrir Mes projets<ArrowUpRight /></Link></Button></div>}</div></div>}
  </AppShell>;
}