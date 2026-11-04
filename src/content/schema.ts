import type { Card, Module } from "../domain/types";

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
