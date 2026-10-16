import { Check } from "lucide-react";
import type { Routine } from "@/lib/bloom/store";
import { describeFrequency } from "@/lib/bloom/store";

export function RoutineCheck({ routine, done, onToggle }: { routine: Routine; done: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={done}
      className={`flex w-full items-center gap-4 rounded-2xl p-4 text-left transition-colors ${done ? "bg-sage/45" : "card-soft"}`}
    >
      <span className="text-2xl" aria-hidden>{routine.emoji}</span>
      <span className="flex-1">
        <span className={`block font-medium ${done ? "text-foreground/70" : "text-foreground"}`}>{routine.name}</span>
        <span className="block text-xs text-muted-foreground">{describeFrequency(routine.frequency)}</span>
      </span>
      <span
        className={`flex h-7 w-7 items-center justify-center rounded-full border-2 transition-all ${done ? "pop border-sage-deep bg-sage-deep text-primary-foreground" : "border-border"}`}
      >
        {done && <Check className="h-4 w-4" strokeWidth={3} />}
      </span>
      <span className="sr-only">{done ? "Fait" : "À faire"}</span>
    </button>
  );
}
