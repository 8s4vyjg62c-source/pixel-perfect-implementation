import { Link } from "@tanstack/react-router";
import { ArrowLeft, Compass, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ReactNode } from "react";

export function ConceptShell({ children, sleep = false }: { children: ReactNode; sleep?: boolean }) {
  return <div className="concept min-h-screen bg-background text-foreground">
    <header className="border-b bg-card">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-4 md:px-10">
        <div className="flex items-center gap-4"><Button asChild variant="ghost" size="icon" title="Revenir à Laëori"><Link to="/"><ArrowLeft /></Link></Button><span className="font-display text-2xl">Laëori<span className="ml-3 hidden font-sans text-xs text-muted-foreground sm:inline">PROTOTYPE</span></span></div>
        <nav aria-label="Espaces de la maquette" className="flex gap-2"><Button asChild variant={sleep ? "ghost" : "secondary"}><Link to="/exploration"><Compass />Mon monde intérieur</Link></Button><Button asChild variant={sleep ? "secondary" : "ghost"}><Link to="/sommeil"><Moon />Mon sommeil</Link></Button></nav>
      </div>
    </header>
    {children}
    <footer className="mx-auto flex max-w-7xl flex-wrap justify-between gap-3 border-t px-5 py-6 text-xs text-muted-foreground md:px-10"><span>Prototype · Essais conservés jusqu’à l’actualisation, séparés de tes données</span><span>L’invisible aussi te fait grandir.</span></footer>
  </div>;
}