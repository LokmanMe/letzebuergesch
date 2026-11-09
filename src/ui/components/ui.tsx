import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Link, type LinkProps } from "react-router-dom";
import styles from "./ui.module.css";

type Variant = "default" | "primary" | "danger";

function classes(variant: Variant, block?: boolean, extra?: string) {
  return [styles.button, variant !== "default" && styles[variant], block && styles.block, extra].filter(Boolean).join(" ");
}

export function Button({
  variant = "default",
  block,
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; block?: boolean }) {
  return <button type="button" className={classes(variant, block, className)} {...props} />;
}

export function ButtonLink({ variant = "default", block, className, ...props }: LinkProps & { variant?: Variant; block?: boolean }) {
  return <Link className={classes(variant, block, className)} {...props} />;
}

export function Panel({ children, className, ...props }: { children: ReactNode; className?: string } & React.HTMLAttributes<HTMLElement>) {
  return (
    <section className={[styles.panel, className].filter(Boolean).join(" ")} {...props}>
      {children}
    </section>
  );
}

export function UnverifiedBadge() {
  return (
    <span className={styles.unverified} title="Contenu rédigé par une IA, pas encore relu par un locuteur natif">
      à vérifier
    </span>
  );
}

export function ProgressBar({ value, label }: { value: number; label: string }) {
  const pct = Math.round(value * 100);
  return (
    <div className={styles.progressTrack} role="progressbar" aria-label={label} aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
      <div className={styles.progressFill} style={{ width: `${pct}%` }} />
    </div>
  );
}

/** Niveau de maîtrise d'une phrase : 5 points, remplis selon sa progression (vert quand elle est solide). */
export function MasteryDots({ level, className }: { level: number; className?: string }) {
  const solid = level >= 4;
  return (
    <span
      className={[styles.dots, solid && styles.dotsSolid, className].filter(Boolean).join(" ")}
      role="img"
      aria-label={`Maîtrise : ${level} sur 5${solid ? ", solide" : ""}`}
      title={`Maîtrise : ${level} / 5`}
    >
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={i <= level ? styles.dotOn : styles.dotOff} aria-hidden="true" />
      ))}
    </span>
  );
}
