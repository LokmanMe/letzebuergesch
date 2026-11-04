import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { MODULES } from "../../content";
import { mergeCards } from "../../domain/content";
import { today as computeToday } from "../../domain/dates";
import type { AppState, Card, LocalDate, Module } from "../../domain/types";
import { createLocalStorageStorage } from "../../storage/localStorageStorage";
import type { Storage } from "../../storage/Storage";

type AppStateValue = {
  state: AppState;
  /** Applique une transformation pure à l'état et l'enregistre. */
  update: (fn: (s: AppState) => AppState) => void;
  replace: (s: AppState) => void;
  cards: Card[];
  cardsById: Map<string, Card>;
  modules: Module[];
  today: LocalDate;
  storage: Storage;
};

const AppStateContext = createContext<AppStateValue | null>(null);

/** Date du jour qui se met à jour au passage de minuit et au retour sur l'appli. */
function useToday(): LocalDate {
  const [day, setDay] = useState(() => computeToday());
  useEffect(() => {
    const refresh = () => setDay(computeToday());
    const timer = window.setInterval(refresh, 60_000);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, []);
  return day;
}

export function AppStateProvider({ children, storage: injected }: { children: ReactNode; storage?: Storage }) {
  const storage = useMemo(() => injected ?? createLocalStorageStorage(), [injected]);
  const [state, setState] = useState<AppState>(() => storage.load());
  const today = useToday();

  useEffect(() => {
    storage.save(state);
  }, [state, storage]);

  const update = useCallback((fn: (s: AppState) => AppState) => setState(fn), []);
  const replace = useCallback((s: AppState) => setState(s), []);

  const cards = useMemo(() => mergeCards(MODULES, state.customCards), [state.customCards]);
  const cardsById = useMemo(() => new Map(cards.map((c) => [c.id, c])), [cards]);

  const value = useMemo(
    () => ({ state, update, replace, cards, cardsById, modules: MODULES, today, storage }),
    [state, update, replace, cards, cardsById, today, storage],
  );
  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState(): AppStateValue {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error("useAppState doit être utilisé dans AppStateProvider");
  return ctx;
}
