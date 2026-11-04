import type { AppState } from "../domain/types";
import { defaultState } from "./defaultState";
import { InvalidStateError, migrate } from "./migrations";
import type { Storage } from "./Storage";

export const STORAGE_KEY = "letzebuergesch:state";

type KeyValueBackend = Pick<globalThis.Storage, "getItem" | "setItem">;

export function createLocalStorageStorage(backend: KeyValueBackend = window.localStorage): Storage {
  return {
    load() {
      const raw = backend.getItem(STORAGE_KEY);
      if (raw === null) return defaultState();
      try {
        return migrate(JSON.parse(raw));
      } catch (e) {
        // Données corrompues : on garde une copie de secours plutôt que de les perdre.
        console.error("État illisible, réinitialisation", e);
        backend.setItem(`${STORAGE_KEY}:backup-${Date.now()}`, raw);
        return defaultState();
      }
    },
    save(state) {
      backend.setItem(STORAGE_KEY, JSON.stringify(state));
    },
    export(state) {
      return JSON.stringify({ app: "letzebuergesch", exportedAt: new Date().toISOString(), ...state }, null, 2);
    },
    import(json): AppState {
      let parsed: unknown;
      try {
        parsed = JSON.parse(json);
      } catch {
        throw new InvalidStateError("le fichier n'est pas un JSON valide");
      }
      return migrate(parsed);
    },
  };
}
