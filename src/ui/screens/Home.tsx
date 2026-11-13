import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ACHIEVEMENTS } from "../../achievements/rules";
import { LESSONS, LOD_AUDIO } from "../../content";
import { lessonStatuses } from "../../domain/grammar";
import { pickPhraseOfDay, setPhraseOfDayDone } from "../../domain/phraseOfDay";
import { LodAudio } from "../audio/LodAudio";
import { availableNewCards, buildDailyQueue, dueCards, unseenCards } from "../../domain/queue";
import { buildStages, currentStageIndex, stageProgress } from "../../domain/path";
import { a1Progress, dailyGoalProgress, solidCards, streak } from "../../domain/stats";
import { GoalRing } from "../components/GoalRing";
import { ButtonLink, Panel, ProgressBar, UnverifiedBadge } from "../components/ui";
import { stageEmoji } from "./Path";
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
      {LOD_AUDIO[card.id] && (
        <div className={styles.podAudio}>
          <LodAudio audio={LOD_AUDIO[card.id]} />
        </div>
      )}
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
  const { state, cards, modules, today } = useAppState();
  const due = dueCards(cards, state, today).length;
  const goal = dailyGoalProgress(state, today);
  const stages = buildStages(modules, state.customCards);
  const stageIdx = currentStageIndex(stages, state);
  const stageInfo = stageProgress(stages, state);
  const totalStars = stageInfo.reduce((n, s) => n + s.stars, 0);
  const currentStage = stages[stageIdx];
  const fresh = availableNewCards(cards, state, today).length;
  const solid = solidCards(cards, state).length;
  const progress = a1Progress(cards, state);
  const days = streak(state, today);
  const badges = ACHIEVEMENTS.filter((a) => a.id in state.achievements).length;
  const sessionSize = buildDailyQueue(cards, state, today).length;
  const reviewedToday = state.log[today]?.reviewed ?? 0;
  const workedToday = reviewedToday + (state.log[today]?.newIntroduced ?? 0) > 0;
  const nextBatch = Math.min(state.settings.newPerDay, unseenCards(cards, state).length);
  const hasSeen = Object.keys(state.progress).length > 0;
  const lessonStatus = lessonStatuses(LESSONS, stages, state);
  const newLesson = LESSONS.find((l) => lessonStatus.get(l.id) === "new");

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Lëtzebuergesch</h1>
        <div className={styles.chips}>
          <p className={styles.streak} aria-label={`Série : ${days} jour${days > 1 ? "s" : ""} consécutif${days > 1 ? "s" : ""}`}>
            <span aria-hidden="true">🔥</span> {days} jour{days > 1 ? "s" : ""}
          </p>
          <Link to="/progression#badges" className={styles.streak} aria-label={`Badges : ${badges} sur ${ACHIEVEMENTS.length}`}>
            <span aria-hidden="true">🏅</span> {badges}
          </Link>
        </div>
      </header>

      <Panel aria-labelledby="today-title" className={styles.today}>
        <GoalRing done={goal.done} goal={goal.goal} />
        <div>
          <h2 id="today-title" className={styles.sectionTitle}>
            Objectif du jour
          </h2>
          <p className={styles.todayCount}>
            {goal.done} / {goal.goal} cartes
          </p>
          <p className={styles.small}>
            {goal.reached
              ? "Objectif atteint, bravo ! 🎯"
              : goal.done === 0
                ? "Lance ta session pour commencer."
                : `Encore ${goal.goal - goal.done} pour l'atteindre.`}
          </p>
        </div>
      </Panel>

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
          <>
            <p className={styles.doneMsg}>
              {workedToday ? "Session du jour terminée ✅ Envie de continuer ?" : "Rien à réviser pour l'instant."}
            </p>
            {nextBatch > 0 && (
              <ButtonLink to="/revision?mode=plus" variant="primary" block className={styles.mainBtn}>
                ✨ Apprendre {nextBatch} nouvelle{nextBatch > 1 ? "s" : ""} phrase{nextBatch > 1 ? "s" : ""}
              </ButtonLink>
            )}
            {hasSeen && (
              <ButtonLink to="/revision?mode=entrainement" variant={nextBatch > 0 && goal.reached ? "default" : "primary"} block className={styles.mainBtn}>
                🎯 Entraînement libre{goal.reached ? "" : " · compléter l'objectif"}
              </ButtonLink>
            )}
            {nextBatch > 0 && workedToday && (
              <p className={styles.small}>Chaque nouvelle phrase revient demain : plus tu en ajoutes, plus la session de demain sera longue.</p>
            )}
          </>
        )}
        {due > 0 && (
          <ButtonLink to="/revision?mode=eclair" block>
            ⚡ Révision éclair · 3 min
          </ButtonLink>
        )}
      </div>

      <PhraseOfDay />

      <Link to="/parcours" className={styles.pathTeaser}>
        <span className={styles.pathEmoji} aria-hidden="true">
          {currentStage ? stageEmoji(currentStage.moduleId) : "🏆"}
        </span>
        <span>
          <strong>Parcours · étape {Math.min(stageIdx + 1, stages.length)} / {stages.length}</strong>
          <span className={styles.small}>
            {currentStage
              ? `${currentStage.title}${currentStage.parts > 1 ? ` (${currentStage.part}/${currentStage.parts})` : ""}`
              : "Toutes les étapes sont débloquées !"}{" "}
            · ★ {totalStars} / {stages.length * 3}
          </span>
        </span>
        <span aria-hidden="true">›</span>
      </Link>

      {newLesson && (
        <Link to={`/grammaire/${newLesson.id}`} className={styles.pathTeaser}>
          <span className={styles.pathEmoji} aria-hidden="true">
            {newLesson.icon}
          </span>
          <span>
            <strong>Nouvelle leçon de grammaire</strong>
            <span className={styles.small}>{newLesson.title} · 2 min</span>
          </span>
          <span aria-hidden="true">›</span>
        </Link>
      )}

      <p className={styles.footer}>
        <Link to="/progression#phrases">Historique des phrases du jour</Link>
      </p>
    </main>
  );
}
