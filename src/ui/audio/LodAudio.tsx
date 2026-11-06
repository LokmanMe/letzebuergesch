import { useEffect, useState } from "react";
import type { CardAudio, LodClip } from "../../domain/types";
import { play, stop } from "./player";
import styles from "./LodAudio.module.css";

type Props = {
  audio: CardAudio;
  /** Incrémenté par le raccourci clavier « E » : joue la piste par défaut. */
  playSignal?: number;
};

/** Ce qu'on joue par défaut : la phrase si lod.lu l'a, sinon les mots à la suite. */
export function defaultClips(audio: CardAudio): LodClip[] {
  return audio.sentence?.exact ? [audio.sentence] : audio.words;
}

export function LodAudio({ audio, playSignal }: Props) {
  const [playing, setPlaying] = useState<string | null>(null);
  const [error, setError] = useState(false);

  async function run(key: string, clips: LodClip[]) {
    // Le bouton ⏸ arrête la lecture en cours.
    if (playing === key) {
      stop();
      setPlaying(null);
      return;
    }
    setError(false);
    setPlaying(key);
    try {
      await play(clips);
    } catch {
      setError(true);
    } finally {
      setPlaying((p) => (p === key ? null : p));
    }
  }

  useEffect(() => () => stop(), []);

  useEffect(() => {
    if (!playSignal) return;
    const clips = defaultClips(audio);
    const key = audio.sentence?.exact ? "sentence" : audio.words.length === 1 ? "w0" : "words";
    void run(key, clips);
    // Ne réagit qu'au raccourci, pas aux changements de carte.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playSignal]);

  const { words, sentence } = audio;
  const label = (key: string, text: string) => (playing === key ? `⏸ ${text}` : `🔊 ${text}`);

  return (
    <section className={styles.box} aria-label="Écouter (enregistrements lod.lu)">
      {sentence?.exact && (
        <button type="button" className={styles.main} onClick={() => run("sentence", [sentence])} aria-pressed={playing === "sentence"}>
          {label("sentence", "Écouter la phrase")}
        </button>
      )}

      {words.length > 1 && (
        <button type="button" className={sentence?.exact ? styles.secondary : styles.main} onClick={() => run("words", words)} aria-pressed={playing === "words"}>
          {label("words", "Mot à mot")}
        </button>
      )}

      <div className={styles.chips}>
        {words.map((w, i) => {
          const key = `w${i}`;
          const inflected = w.form.toLowerCase() !== w.lemma.toLowerCase();
          return (
            <button
              key={key}
              type="button"
              className={styles.chip}
              onClick={() => run(key, [w])}
              aria-pressed={playing === key}
              aria-label={inflected ? `Écouter ${w.lemma}, forme de base de ${w.form}` : `Écouter ${w.form}`}
              title={inflected ? `« ${w.form} » : forme de base « ${w.lemma} »` : undefined}
              lang="lb"
            >
              {playing === key ? "⏸" : "🔊"} {inflected ? (
                <>
                  {w.form} <span className={styles.lemma}>→ {w.lemma}</span>
                </>
              ) : (
                w.form
              )}
            </button>
          );
        })}
      </div>

      {sentence && !sentence.exact && (
        <button type="button" className={styles.example} onClick={() => run("example", [sentence])} aria-pressed={playing === "example"}>
          <span>{playing === "example" ? "⏸" : "🔊"} Exemple du dictionnaire :</span>{" "}
          <span lang="lb" className={styles.exampleText}>
            « {sentence.text} »
          </span>
        </button>
      )}

      {error && <p className={styles.error} role="alert">Audio indisponible : il faut une connexion Internet.</p>}
      <p className={styles.credit}>
        Voix : {words.length > 1 && !sentence?.exact ? "mots enregistrés séparément, " : ""}
        <a href="https://lod.lu" target="_blank" rel="noopener noreferrer">
          lod.lu
        </a>
      </p>
    </section>
  );
}
