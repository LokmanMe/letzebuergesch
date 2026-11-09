import type { AppState, Card, Module } from "./types";

/** Taille maximale d'une étape du parcours. */
export const STAGE_SIZE = 8;

export type Stage = {
  id: string; // ex. "greetings-1"
  index: number; // position dans le parcours (0, 1, 2…)
  moduleId: string;
  title: string; // titre du module
  part: number; // 1, 2…
  parts: number; // nombre d'étapes du module
  cardIds: string[];
};

export type StageStatus = "locked" | "current" | "done";

export type StageProgress = {
  total: number;
  seen: number;
  solid: number;
  /** 0 : en cours ; 1 : toutes découvertes ; 2 : toutes en boîte 3+ ; 3 : toutes solides (boîte 4+). */
  stars: 0 | 1 | 2 | 3;
  status: StageStatus;
};

/** Découpe un tableau en `parts` morceaux de tailles équilibrées (16 → 8 + 8, 17 → 9 + 8). */
function split<T>(items: T[], parts: number): T[][] {
  const out: T[][] = [];
  let start = 0;
  for (let i = 0; i < parts; i++) {
    const size = Math.ceil((items.length - start) / (parts - i));
    out.push(items.slice(start, start + size));
    start += size;
  }
  return out;
}

/**
 * Le parcours suit l'ordre d'apprentissage : modules dans l'ordre du contenu, chacun découpé
 * en étapes d'au plus 8 cartes. Les nouvelles cartes arrivant dans cet ordre, les étapes
 * se débloquent naturellement au fil des sessions. Les cartes perso forment une dernière étape.
 */
export function buildStages(modules: Module[], customCards: Card[] = []): Stage[] {
  const groups: { moduleId: string; title: string; cards: Card[] }[] = modules.map((m) => ({
    moduleId: m.id,
    title: m.title,
    cards: m.cards,
  }));
  const officialIds = new Set(modules.flatMap((m) => m.cards.map((c) => c.id)));
  const custom = customCards.filter((c) => !officialIds.has(c.id));
  if (custom.length > 0) groups.push({ moduleId: "perso", title: "Mes cartes", cards: custom });

  const stages: Stage[] = [];
  for (const g of groups) {
    const chunks = split(g.cards, Math.max(1, Math.ceil(g.cards.length / STAGE_SIZE)));
    chunks.forEach((chunk, i) =>
      stages.push({
        id: `${g.moduleId}-${i + 1}`,
        index: stages.length,
        moduleId: g.moduleId,
        title: g.title,
        part: i + 1,
        parts: chunks.length,
        cardIds: chunk.map((c) => c.id),
      }),
    );
  }
  return stages;
}

function starsOf(stage: Stage, state: AppState): 0 | 1 | 2 | 3 {
  const boxes: number[] = stage.cardIds.map((id) => state.progress[id]?.box ?? 0);
  if (boxes.some((b) => b === 0)) return 0;
  if (boxes.every((b) => b >= 4)) return 3;
  if (boxes.every((b) => b >= 3)) return 2;
  return 1;
}

/** Index de l'étape en cours : la première qui contient encore des cartes jamais vues. */
export function currentStageIndex(stages: Stage[], state: AppState): number {
  const i = stages.findIndex((s) => s.cardIds.some((id) => state.progress[id] === undefined));
  return i === -1 ? stages.length : i;
}

export function stageProgress(stages: Stage[], state: AppState): StageProgress[] {
  const current = currentStageIndex(stages, state);
  return stages.map((stage, i) => {
    const seen = stage.cardIds.filter((id) => state.progress[id] !== undefined).length;
    const solid = stage.cardIds.filter((id) => (state.progress[id]?.box ?? 0) >= 4).length;
    const status: StageStatus = seen === stage.cardIds.length ? "done" : i === current || seen > 0 ? "current" : "locked";
    return { total: stage.cardIds.length, seen, solid, stars: starsOf(stage, state), status };
  });
}
