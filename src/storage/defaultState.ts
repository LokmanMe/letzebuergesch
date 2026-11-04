import { CURRENT_SCHEMA_VERSION, type AppState } from "../domain/types";

export const DEFAULT_NEW_PER_DAY = 8;

export function defaultState(): AppState {
  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    settings: { newPerDay: DEFAULT_NEW_PER_DAY },
    progress: {},
    log: {},
    phraseOfDay: {},
    customCards: [],
  };
}
