import { useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { buildDailyQueue, buildFlashQueue } from "../../domain/queue";
import { advanceSession, applyRating, startSession, type SessionItem } from "../../domain/session";
import type { Rating } from "../../domain/types";
import { cardRenderers } from "../cards/registry";
import { Button, ButtonLink, Panel } from "../components/ui";
import { useAppState } from "../state/AppStateContext";
import styles from "./Review.module.css";

const RATINGS: { rating: Rating; label: string; aria: string; key: string }[] = [
  { rating: "again", label: "Raté", aria: "Raté : je ne savais pas, revoir bientôt", key: "1" },
  { rating: "hard", label: "Difficile", aria: "Difficile : trouvé avec peine, garder le même rythme", key: "2" },
  { rating: "easy", label: "Facile", aria: "Facile : trouvé sans effort, espacer davantage", key: "3" },
];

export function Review() {
  const [params] = useSearchParams();
  const mode = params.get("mode") === "eclair" ? "eclair" : "jour";
  const { state, update, cards, today } = useAppState();

  // La file est figée au démarrage de la session.
  const [queue, setQueue] = useState<SessionItem[]>(() =>
    startSession(mode === "eclair" ? buildFlashQueue(cards, state, today) : buildDailyQueue(cards, state, today)),
  );
  const [total] = useState(queue.length);
  const [revealed, setRevealed] = useState(false);
  const [counts, setCounts] = useState<Record<Rating, number>>({ again: 0, hard: 0, easy: 0 });

  const current = queue[0];

  const rate = useCallback(
    (rating: Rating) => {
      if (!current) return;
      update((s) => applyRating(s, current.card.id, rating, today, current.isRetry));
      if (!current.isRetry) setCounts((c) => ({ ...c, [rating]: c[rating] + 1 }));
      setQueue((q) => advanceSession(q, rating));
      setRevealed(false);
    },
    [current, today, update],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey || e.metaKey || !current) return;
      const target = e.target instanceof Element ? e.target : null;
      if (target?.closest("input, textarea, select")) return;
      if (!revealed && (e.key === " " || e.key === "Enter") && !target?.closest("button, a")) {
        e.preventDefault();
        setRevealed(true);
      } else if (revealed) {
        const r = RATINGS.find((x) => x.key === e.key);
        if (r) {
          e.preventDefault();
          rate(r.rating);
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [current, revealed, rate]);

  const title = mode === "eclair" ? "Révision éclair" : "Session du jour";

  if (total === 0) {
    return (
      <main className={styles.page}>
        <h1 className={styles.title}>{title}</h1>
        <Panel>
          <p>{mode === "eclair" ? "Aucune carte à réviser pour l'instant." : "Rien à faire aujourd'hui : tout est à jour !"}</p>
          <ButtonLink to="/" variant="primary" block>
            Retour à l'accueil
          </ButtonLink>
        </Panel>
      </main>
    );
  }

  if (!current) {
    const reviewed = counts.again + counts.hard + counts.easy;
    return (
      <main className={styles.page}>
        <h1 className={styles.title}>Session terminée 🎉</h1>
        <Panel className={styles.summary}>
          <p className={styles.big}>
            {reviewed} carte{reviewed > 1 ? "s" : ""} révisée{reviewed > 1 ? "s" : ""}
          </p>
          <ul className={styles.counts}>
            <li className={styles.again}>Raté : {counts.again}</li>
            <li className={styles.hard}>Difficile : {counts.hard}</li>
            <li className={styles.easy}>Facile : {counts.easy}</li>
          </ul>
          <p>Äddi, bis muer ! Et pense à placer ta phrase du jour.</p>
          <ButtonLink to="/" variant="primary" block>
            Retour à l'accueil
          </ButtonLink>
        </Panel>
      </main>
    );
  }

  const Renderer = cardRenderers[current.card.type];
  const done = total - queue.filter((i) => !i.isRetry).length;

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Link to="/" className={styles.quit}>
          ← Quitter
        </Link>
        <h1 className={styles.title}>{title}</h1>
        <span className={styles.counter} aria-label={`Carte ${Math.min(done + 1, total)} sur ${total}`}>
          {Math.min(done + 1, total)} / {total}
        </span>
      </header>

      {current.isRetry && <p className={styles.retry}>Deuxième essai — pour s'entraîner, sans effet sur le planning.</p>}

      <Renderer key={`${current.card.id}-${current.isRetry}`} card={current.card} revealed={revealed} onReveal={() => setRevealed(true)} />

      {revealed && (
        <div className={styles.ratings} role="group" aria-label="Noter ma réponse">
          {RATINGS.map((r) => (
            <Button
              key={r.rating}
              className={styles[r.rating]}
              onClick={() => rate(r.rating)}
              aria-label={r.aria}
              aria-keyshortcuts={r.key}
            >
              {r.label}
            </Button>
          ))}
        </div>
      )}
      <p className={styles.hint}>Clavier : Espace pour voir la réponse, puis 1 / 2 / 3.</p>
    </main>
  );
}
