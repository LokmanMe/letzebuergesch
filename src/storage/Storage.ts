import type { AppState } from "../domain/types";

/**
 * Abstraction de persistance. V1 : localStorage. Une V2 (IndexedDB, synchronisation…)
 * n'a qu'à fournir une autre implémentation.
 */
export interface Storage {
  /** Charge l'état (migré vers la version courante). Renvoie l'état par défaut si rien n'est enregistré. */
  load(): AppState;
  save(state: AppState): void;
  /** Sérialise l'état en JSON lisible pour un fichier de sauvegarde. */
  export(state: AppState): string;
  /** Valide et migre un JSON importé. Lève InvalidStateError si invalide (rien n'est écrasé). */
  import(json: string): AppState;
}
