import { LOD_AUDIO } from "../../content";
import { lodSearchUrl } from "../../domain/content";
import type { Card } from "../../domain/types";
import { LodAudio } from "../audio/LodAudio";
import { Button, UnverifiedBadge } from "../components/ui";
import type { CardRendererProps } from "./registry";
import styles from "./PhraseCard.module.css";

function Details({ card }: { card: Card }) {
  return (
    <>
      {card.note && <p className={styles.note}>{card.note}</p>}
      <div className={styles.meta}>
        <a href={lodSearchUrl(card)} target="_blank" rel="noopener noreferrer" className={styles.lod}>
          Voir dans le dictionnaire lod.lu<span className="visually-hidden"> (nouvel onglet)</span> ↗
        </a>
        {!card.verified && <UnverifiedBadge />}
      </div>
    </>
  );
}

function Phonetic({ card }: { card: Card }) {
  return (
    <p className={styles.phonetic}>
      <span className="visually-hidden">Prononciation : </span>[{card.phonetic}]
    </p>
  );
}

function RevealButton({ onReveal }: { onReveal: () => void }) {
  return (
    <Button variant="primary" block onClick={onReveal} aria-keyshortcuts="Space">
      Voir la réponse
    </Button>
  );
}

export function PhraseCard({ card, mode = "recall", direction = "fr-lb", revealed, onReveal, audioSignal }: CardRendererProps) {
  const audio = LOD_AUDIO[card.id];
  const discover = mode === "discover";
  if (discover) revealed = true;

  // À l'envers : on lit (et on peut écouter) le luxembourgeois, on cherche le français.
  if (!discover && direction === "lb-fr") {
    return (
      <article className={styles.card} aria-live="polite">
        <p className={styles.label}>
          <span className={styles.reverseBadge}>⇄ À l'envers</span> Que veut dire… ?
        </p>
        <p className={`${styles.lb} ${styles.question}`} lang="lb">
          {card.lb}
        </p>
        {audio && <LodAudio audio={audio} playSignal={audioSignal} />}

        {!revealed ? (
          <RevealButton onReveal={onReveal} />
        ) : (
          <div className={styles.answer}>
            <p className={styles.frAnswer} lang="fr">
              {card.fr}
            </p>
            <Phonetic card={card} />
            <Details card={card} />
          </div>
        )}
      </article>
    );
  }

  return (
    <article className={styles.card} aria-live="polite">
      {discover ? (
        <p className={styles.label}>
          <span className={styles.newBadge}>✨ Nouvelle</span> Découvre cette phrase :
        </p>
      ) : (
        <p className={styles.label}>Comment dit-on en luxembourgeois ?</p>
      )}
      <p className={styles.fr} lang="fr">
        {card.fr}
      </p>

      {!revealed ? (
        <RevealButton onReveal={onReveal} />
      ) : (
        <div className={styles.answer}>
          <p className={styles.lb} lang="lb">
            {card.lb}
          </p>
          <Phonetic card={card} />
          {audio && <LodAudio audio={audio} playSignal={audioSignal} />}
          <Details card={card} />
        </div>
      )}
    </article>
  );
}
