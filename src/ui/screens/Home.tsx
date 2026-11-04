import { useEffect } from "react";
import { Link } from "react-router-dom";
import { pickPhraseOfDay, setPhraseOfDayDone } from "../../domain/phraseOfDay";
import { availableNewCards, buildDailyQueue, dueCards } from "../../domain/queue";
import { a1Progress, solidCards, streak } from "../../domain/stats";
import { ButtonLink, Panel, ProgressBar, UnverifiedBadge } from "../components/ui";
import { useAppState } from "../state/AppStateContext";
import styles from "./Home.module.css";

function PhraseOfDay() {
  const { state, update, cards, today } = useAppState();
  const card = pickPhraseOfDay(cards, state, today);
  const entry = state.phraseOfDay[today];

  // On fige la phrase du jour dès son affichage, pour qu'elle ne change pas dans la journée.
  useEffect(() => {
    if (card && !entry) update((s) => setPhraseOfDayDone(s, today, card.id, false));
  }, [card, entry, today, update]);

  if (!card) return null;
  const done = entry?.done ?? false;

  return (
    <Panel aria-labelledby="pod-title" className={styles.pod}>
      <h2 id="pod-title" className={styles.sectionTitle}>
        Phrase du jour
      </h2>
      <p className={styles.podHint}>À placer aujourd'hui auprès d'un collègue ou d'un commerçant :</p>
      <p className={styles.podLb} lang="lb">
        {card.lb}
      </p>
      <p className={styles.podFr}>
        {card.fr} · <span className={styles.podPhon}>[{card.phonetic}]</span>
      </p>
      {!card.verified && <UnverifiedBadge />}
      <label className={styles.check}>
        <input
          type="checkbox"
          checked={done}
          onChange={(e) => update((s) => setPhraseOfDayDone(s, today, card.id, e.target.checked))}
        />
        <span>{done ? "Fait, bravo !" : "Fait"}</span>
      </label>
    </Panel>
  );
}

export function Home() {
  const { state, cards, today } = useAppState();
  const due = dueCards(cards, state, today).length;
  const fresh = availableNewCards(cards, state, today).length;
  const solid = solidCards(cards, state).length;
  const progress = a1Progress(cards, state);
  const days = streak(state, today);
  const sessionSize = buildDailyQueue(cards, state, today).length;
  const reviewedToday = state.log[today]?.reviewed ?? 0;

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Lëtzebuergesch</h1>
        <p className={styles.streak} aria-label={`Série : ${days} jour${days > 1 ? "s" : ""} consécutif${days > 1 ? "s" : ""}`}>
          <span aria-hidden="true">🔥</span> {days} jour{days > 1 ? "s" : ""}
        </p>
      </header>

      <Panel aria-labelledby="goal-title">
        <div className={styles.goalRow}>
          <h2 id="goal-title" className={styles.sectionTitle}>
            Objectif A1
          </h2>
          <span className={styles.pct}>{Math.round(progress * 100)} %</span>
        </div>
        <ProgressBar value={progress} label="Progression vers l'objectif A1" />
        <p className={styles.small}>
          {solid} carte{solid > 1 ? "s" : ""} solide{solid > 1 ? "s" : ""} sur {cards.length}
        </p>
      </Panel>

      <ul className={styles.stats} aria-label="Compteurs du jour">
        <li>
          <strong>{due}</strong>
          <span>à réviser</span>
        </li>
        <li>
          <strong>{fresh}</strong>
          <span>nouvelles</span>
        </li>
        <li>
          <strong>{solid}</strong>
          <span>solides</span>
        </li>
      </ul>

      <div className={styles.actions}>
        {sessionSize > 0 ? (
          <ButtonLink to="/revision?mode=jour" variant="primary" block className={styles.mainBtn}>
            Session du jour · {sessionSize} carte{sessionSize > 1 ? "s" : ""}
          </ButtonLink>
        ) : (
          <p className={styles.doneMsg}>
            {reviewedToday > 0 ? "Session du jour terminée. Bis muer !" : "Rien à réviser aujourd'hui."}
          </p>
        )}
        {due > 0 && (
          <ButtonLink to="/revision?mode=eclair" block>
            ⚡ Révision éclair · 3 min
          </ButtonLink>
        )}
      </div>

      <PhraseOfDay />

      <p className={styles.footer}>
        <Link to="/progression#phrases">Historique des phrases du jour</Link>
      </p>
    </main>
  );
}
