import { describe, it, expect } from "vitest";
import { migrate, type Project } from "@/lib/bloom/store";
import { worldProjects, geographicStatus, geographicDate, countries, continents } from "@/lib/world/model";
const base: Project = { id:"p", title:"Découverte locale", status:"active", createdAt:"2026-01-01", steps:[], geography:{country:"FR"} };
describe("Mon monde", () => {
  it("ne transforme pas Idée ni En pause en envie", () => {expect(geographicStatus({...base,status:"idea"})).toBeUndefined();expect(geographicStatus({...base,status:"paused",worldStatus:"wish"})).toBeUndefined();});
  it("permet un pays sans ville", () => {expect(worldProjects([base],"all",2026,"all","all")).toHaveLength(1);});
  it("affiche sans date uniquement depuis le début", () => {expect(worldProjects([base],"year",2026,"all","all")).toHaveLength(0);expect(worldProjects([base],"all",2026,"all","all")).toHaveLength(1);});
  it("ne prend pas la création pour une date de réalisation", () => {expect(geographicDate({...base,status:"done",dueDate:"2026-07-01"})).toBeUndefined();});
  it("utilise l'échéance existante pour le projet et la date réelle pour le réalisé", () => {expect(worldProjects([{...base,dueDate:"2025-07-01"}],"year",2025,"planned","all")).toHaveLength(1);expect(worldProjects([{...base,status:"done",worldDate:"2026-07-12"}],"year",2026,"realized","all")).toHaveLength(1);});
  it("filtre les statuts et continents réels", () => {expect(worldProjects([base],"all",2026,"wish","all")).toHaveLength(0);expect(worldProjects([base],"all",2026,"planned","Afrique")).toHaveLength(0);});
  it("préserve les fiches et lieux historiques à la migration", () => {const p={...base,location:"Mon ancien texte"};expect(migrate({projects:[p]}).projects).toEqual([p]);});
  it("embarque les sept continents dont l'Antarctique", () => {expect(continents).toHaveLength(7);for(const c of continents) expect(countries.some(x=>x.continent===c && x.path)).toBe(true);});
});