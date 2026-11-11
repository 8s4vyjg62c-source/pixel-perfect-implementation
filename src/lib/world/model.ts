import countriesData from "./countries.json";
import type { Project } from "@/lib/bloom/store";

export const countries = countriesData;
export const continents = ["Afrique", "Europe", "Asie", "Amérique du Nord", "Amérique du Sud", "Océanie", "Antarctique"];
export type WorldStatus = "realized" | "planned" | "wish";
export const worldLabels: Record<WorldStatus, string> = { realized: "Réalisé", planned: "En projet", wish: "Envie" };
export function geographicStatus(p: Project): WorldStatus | undefined {
  if (p.status === "paused") return undefined;
  if (p.status === "done") return "realized";
  if (p.status === "active") return "planned";
  return p.worldStatus;
}
/** Occurrence/intention date first. Existing due date for plans/wishes; never creation date as experience date. */
export function geographicDate(p: Project): string | undefined {
  return p.worldDate || (geographicStatus(p) !== "realized" ? p.dueDate : undefined);
}
export function worldProjects(projects: Project[], mode: "all" | "year", year: number, status: WorldStatus | "all", continent: string) {
  return projects.filter(p => {
    const country = countries.find(c => c.id === p.geography?.country);
    const s = geographicStatus(p);
    const d = geographicDate(p);
    return !p.archived && country && s && (status === "all" || status === s) && (continent === "all" || country.continent === continent) && (mode === "all" || (d && Number(d.slice(0, 4)) === year));
  });
}