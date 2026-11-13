import { createContext, useContext, useState, type ReactNode } from "react";
import type { SleepEntry } from "@/lib/exploration/sleep";

type PrototypeState = {
  theme: number; setTheme: (n: number) => void;
  name: string; setName: (n: string) => void;
  refuge: boolean; setRefuge: (b: boolean) => void;
  entries: SleepEntry[]; addEntry: (e: SleepEntry) => void;
  removeEntry: (id: string) => void;
};
const Context = createContext<PrototypeState | undefined>(undefined);
export function PrototypeProvider({ children }: { children: ReactNode }) {
  const [theme,setTheme] = useState(0);
  const [name,setName] = useState("Mon monde intérieur");
  const [refuge,setRefuge] = useState(true);
  const [entries,setEntries] = useState<SleepEntry[]>([]);
  return <Context.Provider value={{theme,setTheme,name,setName,refuge,setRefuge,entries,addEntry:e=>setEntries(previous=>[e,...previous]),removeEntry:id=>setEntries(previous=>previous.filter(e=>e.id!==id))}}>{children}</Context.Provider>;
}
export function usePrototype() {
  const state = useContext(Context);
  if (!state) throw new Error("PrototypeProvider is required");
  return state;
}