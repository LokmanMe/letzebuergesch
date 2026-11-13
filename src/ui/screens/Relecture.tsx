import { Link } from "react-router-dom";
import { LESSONS } from "../../content";
import { lodSearchUrl } from "../../domain/content";
import { cardsToCsv } from "../../domain/csv";
import { Button, Panel, UnverifiedBadge } from "../components/ui";
import { downloadFile } from "../download";
import { useAppState } from "../state/AppStateContext";
import styles from "./Relecture.module.css";

export function Relecture() {
  const { modules, cards, today } = useAppState();
  const unverified = cards.filter((c) => !c.verified).length;

  return (
    <main className={styles.page}>
      <Link to="/reglages" className={styles.back}>
        ← Réglages
      </Link>
      <h1>Relecture</h1>
      <Panel>
        <p className={styles.intro}>
          Tout le luxembourgeois de l'appli a été rédigé par une IA et peut contenir des erreurs ({unverified} carte
          {unverified > 1 ? "s" : ""} à vérifier). Exporte le tableau pour le faire relire par un collègue luxembourgophone, ou compare
          chaque phrase avec lod.lu.
        </p>
        <Button variant="primary" block onClick={() => downloadFile(`letzebuergesch-relecture-${today}.csv`, cardsToCsv(cards, modules, LESSONS),"text/csv;charset=utf-8")}>
          Exporter en CSV (Excel)
        </Button>
        <p className={styles.hint}>
          Une fois relue, passe la carte à <code>"verified": true</code> dans <code>src/content/</code>.
        </p>
      </Panel>

      {modules.map((m) => (
        <Panel key={m.id} aria-labelledby={`mod-${m.id}`}>
          <h2 id={`mod-${m.id}`} className={styles.h2}>
            {m.title}
          </h2>
          <ul className={styles.list}>
            {m.cards.map((c) => (
              <li key={c.id}>
                <div className={styles.row}>
                  <span lang="lb" className={styles.lb}>
                    {c.lb}
                  </span>
                  {!c.verified && <UnverifiedBadge />}
                </div>
                <span className={styles.fr}>{c.fr}</span>
                <span className={styles.phon}>[{c.phonetic}]</span>
                <a href={lodSearchUrl(c)} target="_blank" rel="noopener noreferrer" className={styles.lod}>
                  Chercher « {c.lodQuery ?? c.lb} » sur lod.lu<span className="visually-hidden"> (nouvel onglet)</span> ↗
                </a>
              </li>
            ))}
          </ul>
        </Panel>
      ))}

      <Panel aria-labelledby="mod-grammaire">
        <h2 id="mod-grammaire" className={styles.h2}>
          Leçons de grammaire
        </h2>
        <p className={styles.hint}>Les tableaux et exemples sont inclus dans l'export CSV. Les fiches sont dans src/content/grammar.json.</p>
        <ul className={styles.list}>
          {LESSONS.map((l) => (
            <li key={l.id}>
              <div className={styles.row}>
                <Link to={`/grammaire/${l.id}`} className={styles.lb}>
                  {l.icon} {l.title}
                </Link>
                {!l.verified && <UnverifiedBadge />}
              </div>
            </li>
          ))}
        </ul>
      </Panel>
    </main>
  );
}
