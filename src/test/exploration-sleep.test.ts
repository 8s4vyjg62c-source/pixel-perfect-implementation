import { describe, expect, it } from "vitest";
import { sleepMinutes } from "@/lib/exploration/sleep";

describe("Maquette sommeil facultatif", () => {
  it("ne requiert pas d'horaires pour le repos", () => { expect(sleepMinutes("", "")).toBeUndefined(); });
  it("calcule le temps entre coucher et réveil en passant minuit", () => { expect(sleepMinutes("23:30", "07:00")).toBe(450); });
  it("rejette les horaires invalides sans inventer de durée", () => { expect(sleepMinutes("25:00", "07:00")).toBeUndefined(); });
});