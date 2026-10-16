import { describe, expect, it } from "vitest";
import { doneCount, getPeriod, plannedCount } from "@/lib/bloom/stats";
import { isScheduled, migrate, type BloomState, type Routine } from "@/lib/bloom/store";

const mon = new Date(2026, 9, 12); // lundi 12 octobre 2026
const sun = new Date(2026, 9, 18);
const r = (frequency: Routine["frequency"]): Routine => ({ id: "x", name: "x", emoji: "x", frequency });

describe("bilan : actions prévues", () => {
  it("quotidienne = 7 sur une semaine", () => expect(plannedCount(r({ type: "daily" }), mon, sun)).toBe(7));
  it("lun/mer/ven = 3 sur une semaine", () => expect(plannedCount(r({ type: "weekdays", days: [1, 3, 5] }), mon, sun)).toBe(3));
  it("3 fois par semaine = 3", () => expect(plannedCount(r({ type: "timesPerWeek", times: 3 }), mon, sun)).toBe(3));
  it("hebdomadaire = 1", () => expect(plannedCount(r({ type: "weekly" }), mon, sun)).toBe(1));
});

describe("bilan : actions réalisées", () => {
  it("compte uniquement les jours cochés dans la période", () => {
    const s = migrate({ routines: [r({ type: "daily" })], completions: { "2026-10-12": ["x"], "2026-10-14": ["x"], "2026-10-20": ["x"] } });
    expect(doneCount(s, "x", mon, sun)).toBe(2);
  });
});

describe("semaine", () => {
  it("commence le lundi", () => expect(getPeriod("week", 0, new Date(2026, 9, 16)).key).toBe("week:2026-10-12"));
});

describe("plusieurs fois par semaine", () => {
  it("n'est plus proposée une fois l'objectif atteint dans la semaine", () => {
    const routine = r({ type: "timesPerWeek", times: 2 });
    const s: BloomState = migrate({ routines: [routine], completions: { "2026-10-12": ["x"], "2026-10-13": ["x"] } });
    expect(isScheduled(routine, new Date(2026, 9, 14), s)).toBe(false);
    expect(isScheduled(routine, new Date(2026, 9, 19), s)).toBe(true);
  });
});
