import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { parseLocalDate } from "../../domain/dates";
import { phraseHistory } from "../../domain/phraseOfDay";
import { activity, fragileCards, solidCards } from "../../domain/stats";
import type { Card } from "../../domain/types";
import { ActivityChart } from "../components/ActivityChart";
import { MasteryDots, Panel } from "../components/ui";
import { useAppState } from "../state/AppStateContext";
import styles from "./Progress.module.css";

function CardList({ cards, empty, boxes }: { cards: Card[]; empty: string; boxes: Record<string, number> }) {
  if (cards.length === 0) return <p className={styles.empty}>{empty}</p>;
  return (
    <ul className={styles.list}>
      {cards.map((c) => (
        <li key={c.id}>
          <span lang="lb" className={styles.lb}>
            {c.lb}
          </span>
          <span className={styles.fr}>{c.fr}</span>
          <MasteryDots level={boxes[c.id]} className={styles.box} />
        </li>
      ))}
    </ul>
  );
}

export function Progress() {
  const { state, cards, cardsById, today } = useAppState();
  const { hash } = useLocation();
  const solid = solidCards(cards, state);
  const fragile = fragileCards(cards, state);
  const boxes = Object.fromEntries(Object.entries(state.progress).map(([id, p]) => [id, p.box]));
  const history = phraseHistory(state);

  useEffect(() => {
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView();
  }, [hash]);

  return (
    <main className={styles.page}>
      <h1>Progression</h1>

      <Panel aria-labelledby="activity-title">
        <h2 id="activity-title" className={styles.h2}>
          Activité des 30 derniers jours
        </h2>
        <ActivityChart data={activity(state, today, 30)} />
      </Panel>

      <Panel aria-labelledby="solid-title">
        <h2 id="solid-title" className={styles.h2}>
          Phrases solides <span className={styles.count}>({solid.length})</span>
        </h2>
        <p className={styles.hint}>4 ou 5 points de maîtrise : bien ancrées.</p>
        <CardList cards={solid} boxes={boxes} empty="Pas encore de phrase solide : continue, ça vient vite !" />
      </Panel>

      <Panel aria-labelledby="fragile-title">
        <h2 id="fragile-title" className={styles.h2}>
          Phrases fragiles <span className={styles.count}>({fragile.length})</span>
        </h2>
        <p className={styles.hint}>1 ou 2 points de maîtrise : elles reviendront souvent.</p>
        <CardList cards={fragile} boxes={boxes} empty="Aucune phrase fragile." />
      </Panel>

      <Panel aria-labelledby="phrases-title" id="phrases">
        <h2 id="phrases-title" className={styles.h2}>
          Phrases du jour placées <span className={styles.count}>({history.length})</span>
        </h2>
        {history.length === 0 ? (
          <p className={styles.empty}>Coche « Fait » sur l'accueil quand tu as placé ta phrase du jour.</p>
        ) : (
          <ul className={styles.list}>
            {history.map(({ date, cardId }) => {
              const c = cardsById.get(cardId);
              return (
                <li key={date}>
                  <span lang="lb" className={styles.lb}>
                    {c?.lb ?? cardId}
                  </span>
                  <span className={styles.fr}>
                    {parseLocalDate(date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </Panel>
    </main>
  );
}
