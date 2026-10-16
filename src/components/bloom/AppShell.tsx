import { Link } from "@tanstack/react-router";
import { Sun, ChartColumn, Lightbulb, CalendarDays } from "lucide-react";
import type { ReactNode } from "react";

const items = [
  { to: "/", label: "Aujourd'hui", icon: Sun },
  { to: "/bilan", label: "Mon bilan", icon: ChartColumn },
  { to: "/projets", label: "Mes projets", icon: Lightbulb },
  { to: "/historique", label: "Historique", icon: CalendarDays },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto min-h-screen max-w-md bg-background">
      <main className="px-5 pb-28 pt-8">{children}</main>
      <nav aria-label="Navigation principale" className="fixed inset-x-0 bottom-0 z-20 border-t bg-card/95 backdrop-blur">
        <ul className="mx-auto grid max-w-md grid-cols-4">
          {items.map(({ to, label, icon: Icon }) => (
            <li key={to}>
              <Link
                to={to}
                activeOptions={{ exact: true }}
                className="flex flex-col items-center gap-1 py-3 text-[11px] font-medium text-muted-foreground transition-colors data-[status=active]:text-primary"
              >
                <Icon className="h-5 w-5" strokeWidth={1.8} />
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}

export function PageHeader({ eyebrow, title, children }: { eyebrow?: string; title: string; children?: ReactNode }) {
  return (
    <header className="mb-6 fade-up">
      {eyebrow && <p className="text-sm capitalize text-muted-foreground">{eyebrow}</p>}
      <h1 className="mt-1 text-3xl font-medium text-foreground">{title}</h1>
      {children}
    </header>
  );
}

export function Loading() {
  return <div className="h-40 animate-pulse rounded-2xl bg-muted" aria-label="Chargement" />;
}
