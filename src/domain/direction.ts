import type { CardProgress, Direction, DirectionSetting } from "./types";

/** En mode mixé, environ une révision sur REVERSE_EVERY est à l'envers (luxembourgeois → français). */
export const REVERSE_EVERY = 4;

/** Petit décalage stable par carte, pour que les cartes ne passent pas toutes à l'envers le même jour. */
function offset(cardId: string): number {
  let h = 0;
  for (let i = 0; i < cardId.length; i++) h = (h * 31 + cardId.charCodeAt(i)) >>> 0;
  return h % REVERSE_EVERY;
}

/**
 * Sens dans lequel présenter une carte : "lb-fr" = on lit le luxembourgeois et on cherche le français.
 * Mode mixé : le premier rappel après la découverte est toujours français → luxembourgeois,
 * puis une révision sur 4 environ est à l'envers (déterministe, selon le nombre de révisions de la carte).
 */
export function cardDirection(setting: DirectionSetting, cardId: string, progress: CardProgress | undefined): Direction {
  if (setting !== "mixed") return setting;
  // Carte neuve ou premier rappel (la découverte compte pour une révision) : français → luxembourgeois.
  if (!progress || progress.reviews <= 1) return "fr-lb";
  return (progress.reviews + offset(cardId)) % REVERSE_EVERY === 0 ? "lb-fr" : "fr-lb";
}
