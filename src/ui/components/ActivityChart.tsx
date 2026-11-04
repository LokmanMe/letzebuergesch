import { useState } from "react";
import { parseLocalDate } from "../../domain/dates";
import type { LocalDate } from "../../domain/types";
import styles from "./ActivityChart.module.css";

type Point = { date: LocalDate; reviewed: number };

const W = 340;
const H = 160;
const PAD = { top: 12, right: 8, bottom: 24, left: 28 };

const shortDate = (d: LocalDate) =>
  parseLocalDate(d).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
const longDate = (d: LocalDate) =>
  parseLocalDate(d).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });

/** Courbe des cartes révisées par jour (une seule série), avec info-bulle au survol / toucher. */
export function ActivityChart({ data }: { data: Point[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(5, ...data.map((p) => p.reviewed));
  const niceMax = Math.ceil(max / 5) * 5;
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const x = (i: number) => PAD.left + (data.length <= 1 ? 0 : (i / (data.length - 1)) * innerW);
  const y = (v: number) => PAD.top + innerH - (v / niceMax) * innerH;

  const line = data.map((p, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(p.reviewed).toFixed(1)}`).join(" ");
  const area = `${line} L${x(data.length - 1)},${y(0)} L${x(0)},${y(0)} Z`;
  const total = data.reduce((n, p) => n + p.reviewed, 0);
  const activeDays = data.filter((p) => p.reviewed > 0).length;

  function onPointer(e: React.PointerEvent<SVGSVGElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * W;
    const i = Math.round(((px - PAD.left) / innerW) * (data.length - 1));
    setHover(Math.max(0, Math.min(data.length - 1, i)));
  }

  const h = hover !== null ? data[hover] : null;

  return (
    <figure className={styles.figure}>
      <div className={styles.wrap}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className={styles.svg}
          role="img"
          aria-label={`Cartes révisées par jour sur 30 jours : ${total} au total, ${activeDays} jours actifs.`}
          onPointerMove={onPointer}
          onPointerDown={onPointer}
          onPointerLeave={() => setHover(null)}
        >
          {[0, niceMax / 2, niceMax].map((v) => (
            <g key={v}>
              <line x1={PAD.left} x2={W - PAD.right} y1={y(v)} y2={y(v)} className={styles.grid} />
              <text x={PAD.left - 6} y={y(v) + 4} className={styles.axis} textAnchor="end">
                {v}
              </text>
            </g>
          ))}
          <path d={area} className={styles.area} />
          <path d={line} className={styles.line} />
          {[0, Math.floor((data.length - 1) / 2), data.length - 1].map((i) => (
            <text key={i} x={x(i)} y={H - 6} className={styles.axis} textAnchor={i === 0 ? "start" : i === data.length - 1 ? "end" : "middle"}>
              {data[i] && shortDate(data[i].date)}
            </text>
          ))}
          {h && hover !== null && (
            <g>
              <line x1={x(hover)} x2={x(hover)} y1={PAD.top} y2={y(0)} className={styles.crosshair} />
              <circle cx={x(hover)} cy={y(h.reviewed)} r={4.5} className={styles.dot} />
            </g>
          )}
        </svg>
        {h && hover !== null && (
          <div
            className={styles.tooltip}
            style={{ left: `${(x(hover) / W) * 100}%`, transform: `translateX(${hover > data.length / 2 ? "-100%" : "0"})` }}
            aria-hidden="true"
          >
            <span className={styles.tipDate}>{longDate(h.date)}</span>
            <strong>
              {h.reviewed} carte{h.reviewed > 1 ? "s" : ""}
            </strong>
          </div>
        )}
      </div>
      <figcaption className={styles.caption}>
        {total} cartes révisées · {activeDays} jour{activeDays > 1 ? "s" : ""} actif{activeDays > 1 ? "s" : ""} sur 30
      </figcaption>
      <details className={styles.details}>
        <summary>Voir les données en tableau</summary>
        <table className={styles.table}>
          <thead>
            <tr>
              <th scope="col">Jour</th>
              <th scope="col">Cartes</th>
            </tr>
          </thead>
          <tbody>
            {[...data].reverse().map((p) => (
              <tr key={p.date}>
                <td>{longDate(p.date)}</td>
                <td>{p.reviewed}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
}
