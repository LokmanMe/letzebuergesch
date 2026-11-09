import styles from "./GoalRing.module.css";

type Props = { done: number; goal: number; size?: number };

/** Anneau de l'objectif du jour : se remplit, puis passe au vert avec une coche une fois atteint. */
export function GoalRing({ done, goal, size = 72 }: Props) {
  const ratio = goal > 0 ? Math.min(1, done / goal) : 0;
  const reached = done >= goal;
  const stroke = 8;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;

  return (
    <div
      className={`${styles.ring} ${reached ? styles.reached : ""}`}
      style={{ width: size, height: size }}
      role="progressbar"
      aria-label="Objectif du jour"
      aria-valuemin={0}
      aria-valuemax={goal}
      aria-valuenow={Math.min(done, goal)}
      aria-valuetext={reached ? `Objectif atteint : ${done} cartes sur ${goal}` : `${done} cartes sur ${goal}`}
    >
      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} className={styles.track} strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          className={styles.fill}
          strokeWidth={stroke}
          strokeDasharray={c}
          strokeDashoffset={c * (1 - ratio)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <span className={styles.center} aria-hidden="true">
        {reached ? "✓" : done}
      </span>
    </div>
  );
}
