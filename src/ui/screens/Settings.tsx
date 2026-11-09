import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { defaultState } from "../../storage/defaultState";
import { InvalidStateError } from "../../storage/migrations";
import { Button, Panel } from "../components/ui";
import { downloadFile } from "../download";
import { useAppState } from "../state/AppStateContext";
import styles from "./Settings.module.css";

type Message = { kind: "ok" | "error"; text: string } | null;

export function Settings() {
  const { state, update, replace, storage, today } = useAppState();
  const fileInput = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<Message>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  function setDailyGoal(n: number) {
    const value = Math.max(5, Math.min(100, Math.round(n) || 5));
    update((s) => ({ ...s, settings: { ...s.settings, dailyGoal: value } }));
  }

  function setNewPerDay(n: number) {
    const value = Math.max(1, Math.min(30, Math.round(n) || 1));
    update((s) => ({ ...s, settings: { ...s.settings, newPerDay: value } }));
  }

  function onExport() {
    downloadFile(`letzebuergesch-progression-${today}.json`, storage.export(state), "application/json");
    setMessage({ kind: "ok", text: "Progression exportée." });
  }

  async function onImport(file: File) {
    try {
      const imported = storage.import(await file.text());
      replace(imported);
      setMessage({ kind: "ok", text: `Progression importée (${Object.keys(imported.progress).length} cartes).` });
    } catch (e) {
      const reason = e instanceof InvalidStateError ? e.message : "erreur inconnue";
      setMessage({ kind: "error", text: `Import impossible : ${reason}. Ta progression actuelle n'a pas été modifiée.` });
    } finally {
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  function onReset() {
    replace(defaultState());
    setConfirmReset(false);
    setMessage({ kind: "ok", text: "Progression réinitialisée." });
  }

  return (
    <main className={styles.page}>
      <h1>Réglages</h1>

      <Panel aria-labelledby="daily-title">
        <h2 id="daily-title" className={styles.h2}>
          Rythme
        </h2>
        <label htmlFor="newPerDay" className={styles.label}>
          Nouvelles cartes par jour
        </label>
        <div className={styles.stepper}>
          <Button onClick={() => setNewPerDay(state.settings.newPerDay - 1)} aria-label="Une carte de moins">
            −
          </Button>
          <input
            id="newPerDay"
            type="number"
            inputMode="numeric"
            min={1}
            max={30}
            value={state.settings.newPerDay}
            onChange={(e) => setNewPerDay(Number(e.target.value))}
            className={styles.number}
          />
          <Button onClick={() => setNewPerDay(state.settings.newPerDay + 1)} aria-label="Une carte de plus">
            +
          </Button>
        </div>
        <p className={styles.hint}>8 par défaut. Plus de nouvelles cartes = plus de révisions les jours suivants.</p>

        <label htmlFor="dailyGoal" className={styles.label}>
          Objectif du jour (cartes travaillées)
        </label>
        <div className={styles.stepper}>
          <Button onClick={() => setDailyGoal(state.settings.dailyGoal - 5)} aria-label="Objectif : 5 cartes de moins">
            −
          </Button>
          <input
            id="dailyGoal"
            type="number"
            inputMode="numeric"
            min={5}
            max={100}
            step={5}
            value={state.settings.dailyGoal}
            onChange={(e) => setDailyGoal(Number(e.target.value))}
            className={styles.number}
          />
          <Button onClick={() => setDailyGoal(state.settings.dailyGoal + 5)} aria-label="Objectif : 5 cartes de plus">
            +
          </Button>
        </div>
        <p className={styles.hint}>
          15 par défaut. Chaque carte découverte, révisée ou rejouée en fin de session compte.
        </p>
      </Panel>

      <Panel aria-labelledby="backup-title">
        <h2 id="backup-title" className={styles.h2}>
          Sauvegarde
        </h2>
        <p className={styles.hint}>
          La progression est enregistrée uniquement sur cet appareil. Exporte-la pour la sauvegarder ou la transférer sur un autre appareil.
        </p>
        <div className={styles.buttons}>
          <Button onClick={onExport} block>
            Exporter (JSON)
          </Button>
          <Button onClick={() => fileInput.current?.click()} block>
            Importer…
          </Button>
          <input
            ref={fileInput}
            type="file"
            accept="application/json,.json"
            className="visually-hidden"
            tabIndex={-1}
            aria-hidden="true"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void onImport(f);
            }}
          />
        </div>
        {message && (
          <p role={message.kind === "error" ? "alert" : "status"} className={message.kind === "error" ? styles.error : styles.ok}>
            {message.text}
          </p>
        )}
      </Panel>

      <Panel aria-labelledby="review-title">
        <h2 id="review-title" className={styles.h2}>
          Relecture du contenu
        </h2>
        <p className={styles.hint}>Le luxembourgeois de l'appli a été rédigé par une IA : fais-le relire par un collègue ou compare avec lod.lu.</p>
        <Link to="/relecture" className={styles.link}>
          Ouvrir la relecture →
        </Link>
      </Panel>

      <Panel aria-labelledby="reset-title">
        <h2 id="reset-title" className={styles.h2}>
          Réinitialiser
        </h2>
        {!confirmReset ? (
          <Button variant="danger" block onClick={() => setConfirmReset(true)}>
            Réinitialiser la progression
          </Button>
        ) : (
          <div className={styles.confirm} role="alertdialog" aria-labelledby="reset-confirm">
            <p id="reset-confirm">Tout effacer (cartes, série, historique) ? Pense à exporter avant.</p>
            <div className={styles.buttons}>
              <Button onClick={() => setConfirmReset(false)} block>
                Annuler
              </Button>
              <Button variant="danger" onClick={onReset} block>
                Oui, tout effacer
              </Button>
            </div>
          </div>
        )}
      </Panel>
    </main>
  );
}
