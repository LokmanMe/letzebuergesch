import { useEffect, useRef, useState } from "react";
import { buildStages, currentStageIndex, stageProgress, type StageProgress } from "../../domain/path";
import { buildDailyQueue } from "../../domain/queue";
import { ButtonLink, Panel } from "../components/ui";
import { useAppState } from "../state/AppStateContext";
import styles from "./Path.module.css";

const EMOJI: Record<string, string> = {
  greetings: "👋",
  intro: "🙋",
  joker: "🃏",
  office: "💼",
  cafeteria: "☕",
  "numbers-days": "📅",
  perso: "✍️",
};

export function stageEmoji(moduleId: string): string {
  return EMOJI[moduleId] ?? "📘";
}

/** Décalage horizontal des étapes pour dessiner un chemin sinueux. */
const OFFSETS = [0, 52, 76, 52, 0, -52, -76, -52];

function Stars({ value }: { value: number }) {
  return (
    <span className={styles.stars} aria-label={`${value} étoile${value > 1 ? "s" : ""} sur 3`}>
      {[1, 2, 3].map((i) => (
        <span key={i} className={i <= value ? styles.starOn : styles.starOff} aria-hidden="true">
          ★
        </span>
      ))}
    </span>
  );
}

function statusLabel(p: StageProgress): string {
  if (p.status === "locked") return "verrouillée";
  if (p.status === "current") return `en cours, ${p.seen} phrase${p.seen > 1 ? "s" : ""} découverte${p.seen > 1 ? "s" : ""} sur ${p.total}`;
  return p.stars === 3 ? "maîtrisée" : "terminée";
}

export function Path() {
  const { state, modules, cards, cardsById, today } = useAppState();
  const sessionSize = buildDailyQueue(cards, state, today).length;
  const stages = buildStages(modules, state.customCards);
  const progress = stageProgress(stages, state);
  const current = currentStageIndex(stages, state);
  const [selected, setSelected] = useState<number | null>(current < stages.length ? current : null);
  const currentRef = useRef<HTMLLIElement>(null);

  const done = progress.filter((p) => p.status === "done").length;
  const stars = progress.reduce((n, p) => n + p.stars, 0);

  useEffect(() => {
    currentRef.current?.scrollIntoView({ block: "center" });
  }, []);

  return (
    <main className={styles.page}>
      <header>
        <h1>Parcours</h1>
        <p className={styles.summary}>
          {done} étape{done > 1 ? "s" : ""} terminée{done > 1 ? "s" : ""} sur {stages.length} · <span className={styles.starOn}>★</span> {stars} / {stages.length * 3}
        </p>
        <p className={styles.legend}>
          ★ toutes découvertes · ★★ toutes en boîte 3 · ★★★ toutes solides
        </p>
      </header>

      <ol className={styles.path}>
        {stages.map((stage, i) => {
          const p = progress[i];
          const isCurrent = i === current;
          const open = selected === i;
          const name = `${stage.title}${stage.parts > 1 ? ` ${stage.part}/${stage.parts}` : ""}`;
          return (
            <li key={stage.id} ref={isCurrent ? currentRef : undefined} className={styles.step}>
              <div className={styles.node} style={{ transform: `translateX(${OFFSETS[i % OFFSETS.length]}px)` }}>
                <button
                  type="button"
                  className={`${styles.circle} ${styles[p.status]} ${isCurrent ? styles.here : ""} ${p.stars === 3 ? styles.mastered : ""}`}
                  onClick={() => setSelected(open ? null : i)}
                  aria-expanded={open}
                  aria-controls={`stage-${stage.id}`}
                  aria-label={`Étape ${i + 1} : ${name}, ${statusLabel(p)}`}
                >
                  <span aria-hidden="true">{p.status === "locked" ? "🔒" : stageEmoji(stage.moduleId)}</span>
                </button>
                {isCurrent && <span className={styles.youAreHere}>Tu es ici</span>}
                <span className={styles.name}>
                  {i + 1}. {name}
                </span>
                {p.status === "current" ? (
                  <span className={styles.count}>
                    {p.seen} / {p.total}
                  </span>
                ) : (
                  p.status === "done" && <Stars value={p.stars} />
                )}
              </div>

              {open && (
                <Panel className={styles.detail} id={`stage-${stage.id}`}>
                  <p className={styles.detailHead}>
                    {p.status === "locked"
                      ? "Ces phrases arriveront après les étapes précédentes."
                      : `${p.seen} / ${p.total} découvertes · ${p.solid} solide${p.solid > 1 ? "s" : ""}`}
                  </p>
                  <ul className={styles.cards}>
                    {stage.cardIds.map((id) => {
                      const card = cardsById.get(id);
                      if (!card) return null;
                      const box = state.progress[id]?.box;
                      return (
                        <li key={id}>
                          {box ? (
                            <>
                              <span lang="lb" className={styles.lb}>
                                {card.lb}
                              </span>
                              <span className={styles.fr}>{card.fr}</span>
                              <span className={`${styles.box} ${box >= 4 ? styles.boxSolid : ""}`}>B{box}</span>
                            </>
                          ) : (
                            <>
                              <span className={styles.fr}>{card.fr}</span>
                              <span className={styles.box}>à découvrir</span>
                            </>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                  {isCurrent &&
                    (sessionSize > 0 ? (
                      <ButtonLink to="/revision?mode=jour" variant="primary" block>
                        Continuer cette étape
                      </ButtonLink>
                    ) : (
                      <p className={styles.detailHead}>
                        Les prochaines phrases arrivent demain ({state.settings.newPerDay} nouvelles par jour).
                      </p>
                    ))}
                </Panel>
              )}
            </li>
          );
        })}
        <li className={styles.step}>
          <div className={styles.node}>
            <span className={`${styles.circle} ${styles.finish} ${current >= stages.length ? styles.done : styles.locked}`} aria-hidden="true">
              🏆
            </span>
            <span className={styles.name}>Niveau A1 : toutes les phrases solides</span>
          </div>
        </li>
      </ol>
    </main>
  );
}
