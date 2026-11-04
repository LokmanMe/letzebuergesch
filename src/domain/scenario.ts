/**
 * Scénarios du quotidien (V2, pas d'écran en V1).
 * Une suite d'étapes ; à chaque étape l'utilisateur choisit une réplique et reçoit un retour immédiat.
 */
export type ScenarioChoice = {
  lb: string;
  fr: string;
  correct: boolean;
  feedback: string;
};

export type ScenarioStep = {
  id: string;
  /** Ce que dit l'interlocuteur (optionnel pour la première étape). */
  prompt?: { lb: string; fr: string };
  /** Consigne en français, ex. « Saluez votre collègue ». */
  instruction: string;
  choices: ScenarioChoice[];
};

export type Scenario = {
  id: string;
  title: string;
  context: string;
  steps: ScenarioStep[];
  /** Cartes liées (pour réviser après le scénario). */
  relatedCardIds: string[];
};
