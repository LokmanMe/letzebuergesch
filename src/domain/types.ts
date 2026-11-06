/** Types de carte. V1 : "phrase" uniquement ; V2 : "mcq", "reorder", "typed-answer", "dialogue-step"… */
export type CardType = "phrase";

export type Card = {
  id: string; // stable, ex. "greetings-001"
  moduleId: string;
  type: CardType;
  fr: string;
  lb: string;
  phonetic: string; // phonétique pour francophone
  note?: string;
  lodQuery?: string; // terme à chercher sur lod.lu
  verified: boolean; // false tant que non relu par un locuteur natif
};

/** Un enregistrement de lod.lu (URL réelles obtenues par scripts/fetch-lod-audio.mjs, jamais devinées). */
export type LodClip = {
  articleId: string;
  aac: string;
  ogg?: string;
};

/** Prononciation d'un mot de la phrase. `lemma` diffère de `form` pour une forme fléchie (« geet » → goen). */
export type LodWord = LodClip & { form: string; lemma: string };

/** Phrase lue par un locuteur : identique à la carte (`exact`) ou exemple lod.lu qui la contient. */
export type LodSentence = LodClip & { text: string; exact: boolean };

export type CardAudio = {
  words: LodWord[];
  sentence?: LodSentence;
};

export type Module = {
  id: string;
  title: string;
  description: string;
  cards: Card[];
};

/** Date locale au format "YYYY-MM-DD". */
export type LocalDate = string;

export type Box = 1 | 2 | 3 | 4 | 5;

export type Rating = "again" | "hard" | "easy";

export type CardProgress = {
  box: Box;
  due: LocalDate;
  firstSeen: LocalDate;
  lastReviewed: LocalDate;
  reviews: number;
  lapses: number;
};

export type DayLog = {
  reviewed: number;
  newIntroduced: number;
};

export type PhraseOfDayEntry = {
  cardId: string;
  done: boolean;
};

export type Settings = {
  newPerDay: number;
};

export const CURRENT_SCHEMA_VERSION = 1;

export type AppState = {
  schemaVersion: typeof CURRENT_SCHEMA_VERSION;
  settings: Settings;
  progress: Record<string, CardProgress>;
  log: Record<LocalDate, DayLog>;
  phraseOfDay: Record<LocalDate, PhraseOfDayEntry>;
  /** Cartes ajoutées par l'utilisateur (V2). Fusionnées avec le contenu officiel au chargement. */
  customCards: Card[];
};
