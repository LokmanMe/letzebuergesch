import type { CardProgress, Direction, DirectionSetting } from "./types";

/** Points de maîtrise (boîte) jusqu'auxquels le mode progressif montre la carte à l'envers. */
export const REVERSE_UNTIL_BOX = 2;

/** Sens dans lequel présenter une carte : "lb-fr" = on lit le luxembourgeois et on cherche le français. */
export function cardDirection(setting: DirectionSetting, progress: CardProgress | undefined): Direction {
  if (setting !== "progressive") return setting;
  return !progress || progress.box <= REVERSE_UNTIL_BOX ? "lb-fr" : "fr-lb";
}
