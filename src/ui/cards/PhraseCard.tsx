import { LOD_AUDIO } from "../../content";
import { lodSearchUrl } from "../../domain/content";
import { LodAudio } from "../audio/LodAudio";
import { Button, UnverifiedBadge } from "../components/ui";
import type { CardRendererProps } from "./registry";
import styles from "./PhraseCard.module.css";

export function PhraseCard({ card, revealed, onReveal, audioSignal }: CardRendererProps) {
  const audio = LOD_AUDIO[card.id];
  return (
    <article className={styles.card} aria-live="polite">
      <p className={styles.label}>Comment dit-on en luxembourgeois ?</p>
      <p className={styles.fr} lang="fr">
        {card.fr}
      </p>

      {!revealed ? (
        <Button variant="primary" block onClick={onReveal} aria-keyshortcuts="Space">
          Voir la réponse
        </Button>
      ) : (
        <div className={styles.answer}>
          <p className={styles.lb} lang="lb">
            {card.lb}
          </p>
          <p className={styles.phonetic}>
            <span className="visually-hidden">Prononciation : </span>[{card.phonetic}]
          </p>
          {audio && <LodAudio audio={audio} playSignal={audioSignal} />}
          {card.note && <p className={styles.note}>{card.note}</p>}
          <div className={styles.meta}>
            <a href={lodSearchUrl(card)} target="_blank" rel="noopener noreferrer" className={styles.lod}>
              Voir dans le dictionnaire lod.lu<span className="visually-hidden"> (nouvel onglet)</span> ↗
            </a>
            {!card.verified && <UnverifiedBadge />}
          </div>
        </div>
      )}
    </article>
  );
}
