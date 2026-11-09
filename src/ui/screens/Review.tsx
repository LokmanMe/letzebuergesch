import { useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { buildDailyQueue, buildFlashQueue, buildPracticeQueue } from "../../domain/queue";
import { buildStages, currentStageIndex } from "../../domain/path";
import {
  advanceSession,
  applyDiscovery,
  applyPractice,
  applyRating,
  startPractice,
  startSession,
  type SessionItem,
} from "../../domain/session";
import { dailyGoalProgress } from "../../domain/stats";
import type { Rating } from "../../domain/types";
import { stop as stopAudio } from "../audio/player";
import { cardRenderers } from "../cards/registry";
import { GoalRing } from "../components/GoalRing";
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
  const modeParam = params.get("mode");
  const mode = modeParam === "eclair" || modeParam === "entrainement" ? modeParam : "jour";
  const { state, update, cards, modules, today } = useAppState();

  // La file est figée au démarrage de la session.
  const [queue, setQueue] = useState<SessionItem[]>(() => {
    if (mode === "entrainement") {
      const g = dailyGoalProgress(state, today);
      return startPractice(buildPracticeQueue(cards, state, g.goal - g.done));
    }
    return startSession(mode === "eclair" ? buildFlashQueue(cards, state, today) : buildDailyQueue(cards, state, today), state);
  });
  const [practiced, setPracticed] = useState(0);
  const [total] = useState(queue.length);
  const [revealed, setRevealed] = useState(false);
  const [counts, setCounts] = useState<Record<Rating, number>>({ again: 0, hard: 0, easy: 0 });
  const [discovered, setDiscovered] = useState(0);
  const [audioSignal, setAudioSignal] = useState(0);

  // Pour fêter l'objectif du jour et les étapes du parcours débloquées pendant la session.
  const goal = dailyGoalProgress(state, today);
  const [goalReachedAtStart] = useState(goal.reached);
  const [goalToast, setGoalToast] = useState(false);
  const stages = buildStages(modules, state.customCards);
  const [stageAtStart] = useState(() => currentStageIndex(stages, state));
  const stageNow = currentStageIndex(stages, state);

  useEffect(() => {
    if (goal.reached && !goalReachedAtStart) setGoalToast(true);
  }, [goal.reached, goalReachedAtStart]);

  useEffect(() => {
    if (!goalToast) return;
    const t = window.setTimeout(() => setGoalToast(false), 3500);
    return () => window.clearTimeout(t);
  }, [goalToast]);

  const current = queue[0];
  const discovering = current?.phase === "discover";
  // En découverte, la réponse est visible d'emblée.
  const answerShown = revealed || discovering;

  useEffect(() => () => stopAudio(), []);

  const next = useCallback(
    (outcome: Rating | "noted") => {
      if (!current) return;
      stopAudio();
      setAudioSignal(0); // sinon la carte suivante jouerait toute seule à l'affichage
      if (current.phase === "discover") {
        update((s) => applyDiscovery(s, current.card.id, today));
        setDiscovered((n) => n + 1);
      } else if (current.phase === "review" && outcome !== "noted") {
        update((s) => applyRating(s, current.card.id, outcome, today));
        setCounts((c) => ({ ...c, [outcome]: c[outcome] + 1 }));
      } else if (current.phase === "practice") {
        update((s) => applyPractice(s, today));
        if (current.practiceReason === "free") setPracticed((n) => n + 1);
      }
      setQueue((q) => advanceSession(q, outcome));
      setRevealed(false);
    },
    [current, today, update],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey || e.metaKey || !current) return;
      const target = e.target instanceof Element ? e.target : null;
      if (target?.closest("input, textarea, select")) return;
      const onControl = Boolean(target?.closest("button, a"));
      if (answerShown && e.key.toLowerCase() === "e") {
        e.preventDefault();
        setAudioSignal((n) => n + 1);
      } else if (discovering && (e.key === " " || e.key === "Enter") && !onControl) {
        e.preventDefault();
        next("noted");
      } else if (!answerShown && (e.key === " " || e.key === "Enter") && !onControl) {
        e.preventDefault();
        setRevealed(true);
      } else if (answerShown && !discovering) {
        const r = RATINGS.find((x) => x.key === e.key);
        if (r) {
          e.preventDefault();
          next(r.rating);
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [current, answerShown, discovering, next]);

  const title = mode === "eclair" ? "Révision éclair" : mode === "entrainement" ? "Entraînement libre" : "Session du jour";

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
          {discovered > 0 && (
            <p className={styles.big}>
              ✨ {discovered} nouvelle{discovered > 1 ? "s" : ""} phrase{discovered > 1 ? "s" : ""} découverte{discovered > 1 ? "s" : ""}
            </p>
          )}
          {reviewed > 0 && (
            <p className={styles.big}>
              {reviewed} carte{reviewed > 1 ? "s" : ""} révisée{reviewed > 1 ? "s" : ""}
            </p>
          )}
          {reviewed > 0 && (
          <ul className={styles.counts}>
            <li className={styles.again}>Raté : {counts.again}</li>
            <li className={styles.hard}>Difficile : {counts.hard}</li>
            <li className={styles.easy}>Facile : {counts.easy}</li>
          </ul>
          )}
          {practiced > 0 && (
            <p className={styles.big}>
              🎯 {practiced} carte{practiced > 1 ? "s" : ""} rejouée{practiced > 1 ? "s" : ""}
            </p>
          )}
          {discovered > 0 && <p>Les nouvelles phrases reviendront demain pour un premier vrai rappel.</p>}
          <div className={styles.goalLine}>
            <GoalRing done={goal.done} goal={goal.goal} size={56} />
            <p>
              {goal.reached
                ? `Objectif du jour atteint : ${goal.done} cartes 🎯`
                : `Objectif du jour : ${goal.done} / ${goal.goal} cartes. Encore ${goal.goal - goal.done} !`}
            </p>
          </div>
          {!goal.reached && (
            <Link to="/revision?mode=entrainement" className={styles.unlocked}>
              🎯 Compléter l'objectif : entraînement libre ›
            </Link>
          )}
          {stageNow > stageAtStart && (
            <Link to="/parcours" className={styles.unlocked}>
              🗺️{" "}
              {stageNow >= stages.length
                ? "Toutes les étapes du parcours sont débloquées !"
                : `Nouvelle étape débloquée : ${stages[stageNow].title}${stages[stageNow].parts > 1 ? ` ${stages[stageNow].part}/${stages[stageNow].parts}` : ""} ›`}
            </Link>
          )}
          <p>Äddi, bis muer ! N'oublie pas de placer ta phrase du jour.</p>
          <ButtonLink to="/" variant="primary" block>
            Retour à l'accueil
          </ButtonLink>
        </Panel>
      </main>
    );
  }

  const Renderer = cardRenderers[current.card.type];
  // Les essais de fin de session (après découverte ou Raté) ne comptent pas dans « x / total ».
  const done = total - queue.filter((i) => i.phase !== "practice" || i.practiceReason === "free").length;

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

      {goalToast && (
        <p className={styles.toast} role="status">
          🎯 Objectif du jour atteint !
        </p>
      )}

      {current.phase === "practice" && (
        <p className={styles.retry}>
          {current.practiceReason === "discovered"
            ? "Premier essai : retrouve la phrase découverte tout à l'heure. Sans effet sur le planning."
            : current.practiceReason === "free"
              ? "Entraînement libre : sans effet sur le planning."
              : "Deuxième essai, pour s'entraîner. Sans effet sur le planning."}
        </p>
      )}

      <Renderer
        key={`${current.card.id}-${current.phase}`}
        card={current.card}
        mode={discovering ? "discover" : "recall"}
        revealed={answerShown}
        onReveal={() => setRevealed(true)}
        audioSignal={audioSignal}
      />

      {discovering && (
        <Button variant="primary" block className={styles.noted} onClick={() => next("noted")} aria-keyshortcuts="Enter">
          C'est noté →
        </Button>
      )}
      {discovering && <p className={styles.discoverHint}>Elle reviendra en fin de session pour un premier essai, puis demain.</p>}

      {answerShown && !discovering && (
        <div className={styles.ratings} role="group" aria-label="Noter ma réponse">
          {RATINGS.map((r) => (
            <Button
              key={r.rating}
              className={styles[r.rating]}
              onClick={() => next(r.rating)}
              aria-label={r.aria}
              aria-keyshortcuts={r.key}
            >
              {r.label}
            </Button>
          ))}
        </div>
      )}
      <p className={styles.hint}>
        {discovering
          ? "Clavier : E pour écouter, Entrée pour continuer."
          : "Clavier : Espace pour voir la réponse, E pour écouter, puis 1 / 2 / 3."}
      </p>
    </main>
  );
}
