import { solidCards, streak, SOLID_BOXES } from "../domain/stats";
import type { AppState, Card, LocalDate } from "../domain/types";

/** Badges : règles pures, fonction de l'état → badges débloqués. */
export type AchievementContext = { state: AppState; cards: Card[]; today: LocalDate };

export type Achievement = {
  id: string;
  icon: string;
  title: string;
  description: string;
  unlocked: (ctx: AchievementContext) => boolean;
};

const seenCount = (s: AppState) => Object.keys(s.progress).length;
const phrasesDone = (s: AppState) => Object.values(s.phraseOfDay).filter((e) => e.done).length;
const dayTotals = (s: AppState) => Object.values(s.log).map((d) => d.reviewed + d.practiced);
const goalDays = (s: AppState) => dayTotals(s).filter((n) => n >= s.settings.dailyGoal).length;

/** Vrai si toutes les phrases d'au moins un thème sont solides. */
function hasMasteredTheme({ state, cards }: AchievementContext): boolean {
  const byModule = new Map<string, Card[]>();
  for (const c of cards) byModule.set(c.moduleId, [...(byModule.get(c.moduleId) ?? []), c]);
  return [...byModule.values()].some((group) =>
    group.every((c) => SOLID_BOXES.includes(state.progress[c.id]?.box ?? 0)),
  );
}

export const ACHIEVEMENTS: Achievement[] = [
  // Découverte
  { id: "first-step", icon: "👣", title: "Premier pas", description: "Découvrir une première phrase", unlocked: ({ state }) => seenCount(state) >= 1 },
  { id: "discover-25", icon: "🧭", title: "Curieux", description: "Découvrir 25 phrases", unlocked: ({ state }) => seenCount(state) >= 25 },
  {
    id: "discover-all",
    icon: "🗺️",
    title: "Explorateur",
    description: "Découvrir toutes les phrases",
    unlocked: ({ state, cards }) => cards.length > 0 && cards.every((c) => state.progress[c.id] !== undefined),
  },
  // Régularité
  { id: "streak-3", icon: "🔥", title: "Bien lancé", description: "Série de 3 jours", unlocked: ({ state, today }) => streak(state, today) >= 3 },
  { id: "streak-7", icon: "📅", title: "Une semaine", description: "Série de 7 jours", unlocked: ({ state, today }) => streak(state, today) >= 7 },
  { id: "streak-30", icon: "🏅", title: "Un mois", description: "Série de 30 jours", unlocked: ({ state, today }) => streak(state, today) >= 30 },
  { id: "goal-1", icon: "🎯", title: "Dans le mille", description: "Atteindre l'objectif du jour", unlocked: ({ state }) => goalDays(state) >= 1 },
  { id: "goal-10", icon: "🏹", title: "Régulier", description: "Atteindre l'objectif 10 jours", unlocked: ({ state }) => goalDays(state) >= 10 },
  {
    id: "marathon",
    icon: "🏃",
    title: "Marathon",
    description: "Travailler 50 cartes en une journée",
    unlocked: ({ state }) => dayTotals(state).some((n) => n >= 50),
  },
  // Maîtrise
  { id: "solid-10", icon: "💪", title: "Ça rentre", description: "10 phrases solides", unlocked: ({ state, cards }) => solidCards(cards, state).length >= 10 },
  { id: "solid-25", icon: "🧱", title: "Du solide", description: "25 phrases solides", unlocked: ({ state, cards }) => solidCards(cards, state).length >= 25 },
  { id: "theme", icon: "🎓", title: "Thème maîtrisé", description: "Toutes les phrases d'un thème solides", unlocked: hasMasteredTheme },
  {
    id: "a1",
    icon: "🇱🇺",
    title: "Niveau A1",
    description: "Toutes les phrases solides",
    unlocked: ({ state, cards }) => cards.length > 0 && solidCards(cards, state).length === cards.length,
  },
  // Sur le terrain
  { id: "phrase-1", icon: "💬", title: "Sur le terrain", description: "Placer une phrase du jour", unlocked: ({ state }) => phrasesDone(state) >= 1 },
  { id: "phrase-5", icon: "🗣️", title: "Bavard", description: "Placer 5 phrases du jour", unlocked: ({ state }) => phrasesDone(state) >= 5 },
  { id: "phrase-20", icon: "🤝", title: "Presque local", description: "Placer 20 phrases du jour", unlocked: ({ state }) => phrasesDone(state) >= 20 },
];

export function unlockedAchievements(ctx: AchievementContext): Achievement[] {
  return ACHIEVEMENTS.filter((a) => a.unlocked(ctx));
}

/**
 * Badges nouvellement mérités (pas encore enregistrés dans `state.achievements`).
 * Un badge enregistré le reste, même si la condition n'est plus vraie (série cassée, carte ratée…).
 */
export function newAchievements(ctx: AchievementContext): Achievement[] {
  return ACHIEVEMENTS.filter((a) => !(a.id in ctx.state.achievements) && a.unlocked(ctx));
}

/** Enregistre les badges donnés comme débloqués aujourd'hui. */
export function recordAchievements(state: AppState, ids: string[], today: LocalDate): AppState {
  const fresh = ids.filter((id) => !(id in state.achievements));
  if (fresh.length === 0) return state;
  return { ...state, achievements: { ...state.achievements, ...Object.fromEntries(fresh.map((id) => [id, today])) } };
}
