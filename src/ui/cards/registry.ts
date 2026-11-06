import type { ComponentType } from "react";
import type { Card } from "../../domain/types";
import { PhraseCard } from "./PhraseCard";

/**
 * Contrat d'un composant de carte. Le composant affiche la question puis, une fois `revealed`,
 * la réponse. Un type interactif (V2 : "mcq", "reorder", "typed-answer") appelle `onReveal`
 * après la réponse de l'utilisateur ; l'écran de révision affiche alors les boutons de notation.
 */
export type CardRendererProps = {
  card: Card;
  /** "discover" : première rencontre, la réponse est montrée d'emblée (pas de question). */
  mode?: "recall" | "discover";
  revealed: boolean;
  onReveal: () => void;
  /** Incrémenté par le raccourci « E » : le composant joue l'audio de la carte s'il en a. */
  audioSignal?: number;
};

/** Un composant par type de carte : ajouter un type = ajouter une entrée ici. */
export const cardRenderers: Record<Card["type"], ComponentType<CardRendererProps>> = {
  phrase: PhraseCard,
};
