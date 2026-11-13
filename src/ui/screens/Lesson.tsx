import { Fragment, useEffect, useState, type ReactNode } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { LESSONS, LOD_AUDIO } from "../../content";
import { lessonStatuses, markLessonRead, type LessonStatus } from "../../domain/grammar";
import { buildStages } from "../../domain/path";
import type { CardAudio, LessonQuiz } from "../../domain/types";
import { defaultClips } from "../audio/LodAudio";
import { play, stop } from "../audio/player";
import { Button, Panel, UnverifiedBadge } from "../components/ui";
import { useAppState } from "../state/AppStateContext";
import styles from "./Lesson.module.css";

/** Met en gras les passages entre **…** (seule mise en forme des fiches). */
export function rich(text: string): ReactNode {
  return text.split(/\*\*(.+?)\*\*/g).map((part, i) => (i % 2 === 1 ? <strong key={i}>{part}</strong> : <Fragment key={i}>{part}</Fragment>));
}

/** Bouton compact : joue la phrase lod.lu si elle existe, sinon les mots à la suite. */
function ListenButton({ audio }: { audio: CardAudio }) {
  const [playing, setPlaying] = useState(false);
  useEffect(() => () => stop(), []);
  async function toggle() {
    if (playing) {
      stop();
      setPlaying(false);
      return;
    }
    setPlaying(true);
    try {
      await play(defaultClips(audio));
    } catch {
      /* lecture impossible (hors ligne…) : on ignore */
    } finally {
      setPlaying(false);
    }
  }
  return (
    <button type="button" className={styles.listen} onClick={toggle} aria-pressed={playing}>
      {playing ? "⏸ Pause" : audio.sentence?.exact ? "▶ Écouter" : "▶ Mot à mot"}
    </button>
  );
}

function Question({ quiz, index }: { quiz: LessonQuiz; index: number }) {
  const [picked, setPicked] = useState<number | null>(null);
  const answered = picked !== null;
  return (
    <fieldset className={styles.question}>
      <legend className={styles.questionText}>
        {index + 1}. {quiz.question}
      </legend>
      <div className={styles.choices}>
        {quiz.choices.map((c, i) => {
          const state = !answered ? "" : i === quiz.answer ? styles.right : i === picked ? styles.wrong : styles.dim;
          return (
            <button key={c} type="button" className={`${styles.choice} ${state}`} onClick={() => setPicked(i)} disabled={answered} lang="lb">
              {c}
            </button>
          );
        })}
      </div>
      {answered && (
        <p className={styles.feedback} role="status">
          <strong>{picked === quiz.answer ? "✅ Bravo !" : "❌ Pas tout à fait."}</strong> {quiz.explanation}
        </p>
      )}
    </fieldset>
  );
}

export function Lesson() {
  const { id } = useParams();
  const { state, update, today } = useAppState();
  const navigate = useNavigate();
  // Chaque fiche s'ouvre en haut de page (sinon on garde le défilement de l'écran précédent).
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);
  const index = LESSONS.findIndex((l) => l.id === id);
  if (index === -1) return <Navigate to="/grammaire" replace />;
  const lesson = LESSONS[index];
  const next = LESSONS[index + 1];
  const readOn = state.lessonsRead[lesson.id];

  function done() {
    update((s) => markLessonRead(s, lesson.id, today));
    navigate("/parcours");
  }

  return (
    <main className={styles.page}>
      <Link to="/grammaire" className={styles.back}>
        ← Leçons de grammaire
      </Link>
      <header className={styles.head}>
        <span className={styles.icon} aria-hidden="true">
          {lesson.icon}
        </span>
        <div>
          <p className={styles.kicker}>
            Leçon {index + 1} / {LESSONS.length}
          </p>
          <h1>{lesson.title}</h1>
        </div>
      </header>
      {!lesson.verified && (
        <p className={styles.warn}>
          <UnverifiedBadge /> Rédigée par une IA, à faire relire.
        </p>
      )}
      <p className={styles.intro}>{rich(lesson.intro)}</p>

      <Panel aria-labelledby="l-points">
        <h2 id="l-points" className={styles.h2}>
          À retenir
        </h2>
        <ul className={styles.points}>
          {lesson.points.map((p) => (
            <li key={p}>{rich(p)}</li>
          ))}
        </ul>
      </Panel>

      {lesson.table && (
        <Panel aria-labelledby="l-table">
          <h2 id="l-table" className={styles.h2}>
            {lesson.table.caption}
          </h2>
          <table className={styles.table}>
            <tbody>
              {lesson.table.rows.map(([lb, fr]) => (
                <tr key={lb}>
                  <td lang="lb">{lb}</td>
                  <td>{fr}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      )}

      <Panel aria-labelledby="l-examples">
        <h2 id="l-examples" className={styles.h2}>
          Exemples
        </h2>
        <ul className={styles.examples}>
          {lesson.examples.map((e) => {
            const audio = e.cardId ? LOD_AUDIO[e.cardId] : undefined;
            return (
              <li key={e.lb}>
                <span lang="lb" className={styles.lb}>
                  {e.lb}
                </span>
                <span className={styles.fr}>{e.fr}</span>
                {audio && <ListenButton audio={audio} />}
              </li>
            );
          })}
        </ul>
      </Panel>

      {lesson.pitfall && (
        <p className={styles.pitfall}>
          <strong>⚠️ Attention :</strong> {rich(lesson.pitfall)}
        </p>
      )}

      <Panel aria-labelledby="l-quiz">
        <h2 id="l-quiz" className={styles.h2}>
          Vérifie
        </h2>
        {lesson.quiz.map((q, i) => (
          <Question key={q.question} quiz={q} index={i} />
        ))}
      </Panel>

      {readOn ? (
        <p className={styles.readOn}>✓ Leçon lue</p>
      ) : (
        <Button variant="primary" block onClick={done}>
          J'ai compris ✓
        </Button>
      )}
      {next && (
        <Link to={`/grammaire/${next.id}`} className={styles.next}>
          Leçon suivante : {next.icon} {next.title} ›
        </Link>
      )}
    </main>
  );
}

const STATUS_LABEL: Record<LessonStatus, string> = { new: "Nouvelle", read: "Lue ✓", upcoming: "À venir" };

export function Grammar() {
  const { state, modules } = useAppState();
  const statuses = lessonStatuses(LESSONS, buildStages(modules, state.customCards), state);
  const read = LESSONS.filter((l) => statuses.get(l.id) === "read").length;
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <main className={styles.page}>
      <Link to="/parcours" className={styles.back}>
        ← Parcours
      </Link>
      <h1>Leçons de grammaire</h1>
      <p className={styles.intro}>
        Des fiches courtes qui expliquent les phrases que tu apprends. Chacune arrive dans le parcours après l'étape qui la prépare
        ({read} / {LESSONS.length} lues).
      </p>
      <ol className={styles.list}>
        {LESSONS.map((l, i) => {
          const status = statuses.get(l.id) ?? "upcoming";
          return (
            <li key={l.id}>
              <Link to={`/grammaire/${l.id}`} className={`${styles.item} ${status === "upcoming" ? styles.upcoming : ""}`}>
                <span className={styles.itemIcon} aria-hidden="true">
                  {l.icon}
                </span>
                <span className={styles.itemTitle}>
                  {i + 1}. {l.title}
                </span>
                <span className={`${styles.chip} ${styles[status]}`}>{STATUS_LABEL[status]}</span>
              </Link>
            </li>
          );
        })}
      </ol>
    </main>
  );
}
