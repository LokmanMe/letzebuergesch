import { addDays } from "./dates";
import type { AppState, Card, LocalDate } from "./types";

export const SOLID_BOXES = [4, 5];
export const FRAGILE_BOXES = [1, 2];

/** Jours consécutifs avec au moins une carte révisée. Aujourd'hui sans activité ne casse pas la série. */
export function streak(state: AppState, today: LocalDate): number {
  const active = (d: LocalDate) => (state.log[d]?.reviewed ?? 0) > 0;
  let day = active(today) ? today : addDays(today, -1);
  let count = 0;
  while (active(day)) {
    count++;
    day = addDays(day, -1);
  }
  return count;
}

export function solidCards(cards: Card[], state: AppState): Card[] {
  return cards.filter((c) => SOLID_BOXES.includes(state.progress[c.id]?.box ?? 0));
}

export function fragileCards(cards: Card[], state: AppState): Card[] {
  return cards.filter((c) => FRAGILE_BOXES.includes(state.progress[c.id]?.box ?? 0));
}

/** Progression vers l'objectif A1 : part des cartes en boîte 4 ou 5 (0 à 1). */
export function a1Progress(cards: Card[], state: AppState): number {
  if (cards.length === 0) return 0;
  return solidCards(cards, state).length / cards.length;
}

/** Cartes révisées par jour sur les `days` derniers jours (du plus ancien au plus récent). */
export function activity(state: AppState, today: LocalDate, days = 30): { date: LocalDate; reviewed: number }[] {
  return Array.from({ length: days }, (_, i) => {
    const date = addDays(today, i - days + 1);
    return { date, reviewed: state.log[date]?.reviewed ?? 0 };
  });
}

/** Objectif du jour : cartes travaillées aujourd'hui (découvertes, révisées et essais d'entraînement). */
export function dailyGoalProgress(state: AppState, today: LocalDate): { done: number; goal: number; reached: boolean } {
  const day = state.log[today];
  const done = (day?.reviewed ?? 0) + (day?.practiced ?? 0);
  const goal = state.settings.dailyGoal;
  return { done, goal, reached: done >= goal };
}
