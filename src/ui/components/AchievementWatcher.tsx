import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { newAchievements, recordAchievements, type Achievement } from "../../achievements/rules";
import { useAppState } from "../state/AppStateContext";
import styles from "./AchievementWatcher.module.css";

const TOAST_MS = 4500;

/**
 * Surveille l'état : dès qu'un badge est mérité (révision, phrase du jour cochée, série…),
 * il est enregistré avec la date du jour et une notification « Badge débloqué » s'affiche.
 */
export function AchievementWatcher() {
  const { state, update, cards, today } = useAppState();
  const [toast, setToast] = useState<Achievement[]>([]);

  useEffect(() => {
    const fresh = newAchievements({ state, cards, today });
    if (fresh.length === 0) return;
    update((s) => recordAchievements(s, fresh.map((a) => a.id), today));
    // Dédoublonné : l'effet peut repasser avant que l'enregistrement soit pris en compte.
    setToast((t) => [...t, ...fresh.filter((a) => !t.some((x) => x.id === a.id))]);
  }, [state, cards, today, update]);

  useEffect(() => {
    if (toast.length === 0) return;
    const timer = window.setTimeout(() => setToast([]), TOAST_MS);
    return () => window.clearTimeout(timer);
  }, [toast]);

  if (toast.length === 0) return null;
  const first = toast[0];
  return (
    <div className={styles.wrap} role="status">
      <Link to="/progression#badges" className={styles.toast} onClick={() => setToast([])}>
        <span className={styles.icon} aria-hidden="true">
          {first.icon}
        </span>
        <span>
          <span className={styles.kicker}>{toast.length > 1 ? `${toast.length} badges débloqués !` : "Badge débloqué !"}</span>
          <strong className={styles.title}>
            {toast.length > 1 ? toast.map((a) => a.title).join(", ") : `${first.title} · ${first.description}`}
          </strong>
        </span>
      </Link>
    </div>
  );
}
