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
  /** Cartes découvertes ou révisées (comptées pour la série et la courbe d'activité). */
  reviewed: number;
  newIntroduced: number;
  /** Essais d'entraînement en fin de session (sans effet sur le planning). */
  practiced: number;
};

export type PhraseOfDayEntry = {
  cardId: string;
  done: boolean;
};

/**
 * Sens des cartes en révision.
 * - "mixed" : surtout français → luxembourgeois (toujours pour le premier rappel), environ une révision sur 4 à l'envers.
 * - "fr-lb" : toujours trouver le luxembourgeois ; "lb-fr" : toujours trouver le français.
 */
export type DirectionSetting = "mixed" | "fr-lb" | "lb-fr";
export type Direction = "fr-lb" | "lb-fr";

export type Settings = {
  newPerDay: number;
  /** Objectif du jour : nombre de cartes travaillées (découvertes, révisées ou entraînées). */
  dailyGoal: number;
  direction: DirectionSetting;
};

export const CURRENT_SCHEMA_VERSION = 3;

export type AppState = {
  schemaVersion: typeof CURRENT_SCHEMA_VERSION;
  settings: Settings;
  progress: Record<string, CardProgress>;
  log: Record<LocalDate, DayLog>;
  phraseOfDay: Record<LocalDate, PhraseOfDayEntry>;
  /** Cartes ajoutées par l'utilisateur (V2). Fusionnées avec le contenu officiel au chargement. */
  customCards: Card[];
  /** Badges débloqués : id → date du déblocage. */
  achievements: Record<string, LocalDate>;
};
