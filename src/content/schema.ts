import type { Card, Lesson, Module } from "../domain/types";

const CARD_TYPES: Card["type"][] = ["phrase"];

/** Valide le contenu brut (JSON) et renvoie la liste des erreurs, vide si tout va bien. */
export function validateModules(raw: unknown[]): string[] {
  const errors: string[] = [];
  const ids = new Set<string>();

  raw.forEach((m, i) => {
    if (typeof m !== "object" || m === null) return void errors.push(`module #${i} : pas un objet`);
    const mod = m as Record<string, unknown>;
    const where = `module ${String(mod.id ?? `#${i}`)}`;
    for (const key of ["id", "title", "description"]) {
      if (typeof mod[key] !== "string" || mod[key] === "") errors.push(`${where} : champ « ${key} » manquant`);
    }
    if (!Array.isArray(mod.cards)) return void errors.push(`${where} : « cards » doit être un tableau`);

    mod.cards.forEach((c, j) => {
      const card = c as Record<string, unknown>;
      const at = `${where}, carte ${String(card.id ?? `#${j}`)}`;
      for (const key of ["id", "moduleId", "fr", "lb", "phonetic"]) {
        if (typeof card[key] !== "string" || card[key] === "") errors.push(`${at} : champ « ${key} » manquant`);
      }
      for (const key of ["note", "lodQuery"]) {
        if (card[key] !== undefined && typeof card[key] !== "string") errors.push(`${at} : « ${key} » doit être un texte`);
      }
      if (!CARD_TYPES.includes(card.type as Card["type"])) errors.push(`${at} : type inconnu « ${String(card.type)} »`);
      if (typeof card.verified !== "boolean") errors.push(`${at} : « verified » doit être true ou false`);
      if (card.moduleId !== mod.id) errors.push(`${at} : moduleId ne correspond pas au module`);
      if (typeof card.id === "string") {
        if (ids.has(card.id)) errors.push(`${at} : id en double`);
        ids.add(card.id);
      }
    });
  });

  return errors;
}

export function assertModules(raw: unknown[]): Module[] {
  const errors = validateModules(raw);
  if (errors.length > 0) throw new Error(`Contenu invalide :\n${errors.join("\n")}`);
  return raw as Module[];
}

/** Valide les fiches de grammaire (forme seulement ; les liens vers étapes et cartes sont testés à part). */
export function validateLessons(raw: unknown): string[] {
  const errors: string[] = [];
  const list = (raw as { lessons?: unknown } | null)?.lessons;
  if (!Array.isArray(list)) return ["grammaire : « lessons » doit être un tableau"];
  const ids = new Set<string>();
  const isText = (v: unknown) => typeof v === "string" && v !== "";
  list.forEach((l, i) => {
    const lesson = l as Record<string, unknown>;
    const at = `leçon ${String(lesson.id ?? `#${i}`)}`;
    for (const key of ["id", "icon", "title", "afterStage", "intro"]) if (!isText(lesson[key])) errors.push(`${at} : champ « ${key} » manquant`);
    if (!Array.isArray(lesson.points) || !lesson.points.every(isText)) errors.push(`${at} : « points » invalide`);
    if (!Array.isArray(lesson.examples) || lesson.examples.length === 0) errors.push(`${at} : il faut au moins un exemple`);
    else
      for (const e of lesson.examples as Record<string, unknown>[])
        if (!isText(e.lb) || !isText(e.fr) || (e.cardId !== undefined && !isText(e.cardId))) errors.push(`${at} : exemple invalide`);
    if (lesson.table !== undefined) {
      const t = lesson.table as Record<string, unknown>;
      if (!isText(t.caption) || !Array.isArray(t.rows) || !t.rows.every((r) => Array.isArray(r) && r.length === 2 && r.every(isText)))
        errors.push(`${at} : tableau invalide`);
    }
    if (lesson.pitfall !== undefined && !isText(lesson.pitfall)) errors.push(`${at} : « pitfall » doit être un texte`);
    if (!Array.isArray(lesson.quiz) || lesson.quiz.length === 0) errors.push(`${at} : il faut au moins une question`);
    else
      for (const q of lesson.quiz as Record<string, unknown>[]) {
        const choices = q.choices;
        if (!isText(q.question) || !isText(q.explanation) || !Array.isArray(choices) || choices.length < 2 || !choices.every(isText))
          errors.push(`${at} : question invalide`);
        else if (!Number.isInteger(q.answer) || (q.answer as number) < 0 || (q.answer as number) >= choices.length)
          errors.push(`${at} : « answer » hors des choix`);
      }
    if (typeof lesson.verified !== "boolean") errors.push(`${at} : « verified » doit être true ou false`);
    if (typeof lesson.id === "string") {
      if (ids.has(lesson.id)) errors.push(`${at} : id en double`);
      ids.add(lesson.id);
    }
  });
  return errors;
}

export function assertLessons(raw: unknown): Lesson[] {
  const errors = validateLessons(raw);
  if (errors.length > 0) throw new Error(`Grammaire invalide :\n${errors.join("\n")}`);
  return (raw as { lessons: Lesson[] }).lessons;
}
