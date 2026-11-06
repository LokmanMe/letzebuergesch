// Récupère les vrais enregistrements audio de lod.lu pour chaque carte et écrit src/content/lodAudio.json.
// Aucune URL n'est devinée : toutes viennent des réponses de l'API publique de lod.lu.
//
// Usage : node scripts/fetch-lod-audio.mjs
// À relancer après avoir ajouté ou modifié des cartes.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const contentDir = path.join(root, "src", "content");
const outFile = path.join(contentDir, "lodAudio.json");
const API = "https://lod.lu/api/lb";
const DELAY_MS = 150; // rester poli avec le serveur de lod.lu

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const cache = new Map();

async function getJson(url) {
  if (cache.has(url)) return cache.get(url);
  await sleep(DELAY_MS);
  const res = await fetch(url, { headers: { "User-Agent": "letzebuergesch-learning-app" } });
  if (!res.ok) throw new Error(`${res.status} sur ${url}`);
  const json = await res.json();
  cache.set(url, json);
  return json;
}

const search = (q) => getJson(`${API}/search?lang=lb&query=${encodeURIComponent(q)}`);
const entry = (id) => getJson(`${API}/entry/${encodeURIComponent(id)}`);

/** Minuscules, sans ponctuation ni espaces multiples : pour comparer des phrases. */
const normalize = (s) =>
  s
    .toLowerCase()
    .replace(/[’']/g, "'")
    .replace(/[.,!?;:«»"“”…()]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

/** Mots d'une phrase luxembourgeoise de carte. */
function wordsOf(lb) {
  return lb
    .split(/\s*\/\s*/) // variantes « A / B »
    .flatMap((part) => part.split(/\s+/))
    .map((w) => w.replace(/^[«"“(]+|[»"”).,!?;:…]+$/g, ""))
    .flatMap((w) => (/^[dD]'/.test(w) ? [w.slice(2)] : [w])) // D'Rechnung → Rechnung
    .filter((w) => w && !w.includes(".") && w !== "…" && /\p{L}/u.test(w));
}

/** Texte d'un exemple lod.lu reconstitué à partir de ses morceaux. */
function exampleText(example) {
  const words = [];
  const walk = (parts) => {
    for (const p of parts ?? []) {
      if (p.parts) walk(p.parts);
      else if (typeof p.content === "string") {
        if (p.joinWithPreviousWord && words.length) words[words.length - 1] += p.content;
        else words.push(p.content);
      }
    }
  };
  walk(example.parts);
  return words.join(" ");
}

/** Tous les exemples avec audio d'un article. */
function examplesOf(json) {
  const out = [];
  const walk = (o) => {
    if (Array.isArray(o)) return o.forEach(walk);
    if (!o || typeof o !== "object") return;
    if (o.audioFiles?.aac && Array.isArray(o.parts)) out.push({ text: exampleText(o), audio: o.audioFiles });
    for (const k of Object.keys(o)) if (k !== "audioFiles") walk(o[k]);
  };
  walk(json.entry?.microStructures);
  return out;
}

const isLodUpload = (u) => typeof u === "string" && u.startsWith("https://lod.lu/uploads/");

/**
 * Formes fléchies que la recherche lod.lu rattache au mauvais article
 * (ex. « Gudden » trouvé dans l'article « besser ») : on force la forme de base.
 */
const LEMMA_OVERRIDES = { gudden: "gutt", komm: "kommen" };

/** Trouve l'article lod.lu d'un mot : vedette exacte d'abord, sinon forme fléchie (ex. « geet » → goen). */
async function resolveWord(form) {
  const override = LEMMA_OVERRIDES[form.toLowerCase()];
  if (override) {
    const w = await resolveWord(override);
    return w && { ...w, form };
  }
  const { results = [] } = await search(form);
  const lower = form.toLowerCase();
  const exact = [
    ...results.filter((r) => r.word_lb === form),
    ...results.filter((r) => r.word_lb !== form && r.word_lb.toLowerCase() === lower),
  ];
  const inflected = results.filter((r) => (r.matches ?? []).some((m) => m.toLowerCase() === `<strong>${lower}</strong>`));

  for (const [candidates, isInflected] of [[exact, false], [inflected, true]]) {
    for (const r of candidates) {
      const json = await entry(r.article_id);
      const audio = json.entry?.audioFiles;
      if (isLodUpload(audio?.aac)) {
        return {
          form,
          lemma: json.entry.lemma ?? r.word_lb,
          articleId: r.article_id,
          aac: audio.aac,
          ...(isLodUpload(audio.ogg) ? { ogg: audio.ogg } : {}),
          examples: examplesOf(json),
        };
      }
    }
  }
  return null;
}

const modules = fs
  .readdirSync(contentDir)
  .filter((f) => f.endsWith(".json") && f !== "lodAudio.json")
  .map((f) => JSON.parse(fs.readFileSync(path.join(contentDir, f), "utf8")));

const cards = {};
let wordCount = 0;
let sentenceCount = 0;

for (const mod of modules) {
  for (const card of mod.cards) {
    const words = [];
    const seen = new Set();
    for (const form of wordsOf(card.lb)) {
      if (seen.has(form.toLowerCase())) continue;
      seen.add(form.toLowerCase());
      try {
        const w = await resolveWord(form);
        if (w) words.push(w);
      } catch (e) {
        console.warn(`  ! ${form} : ${e.message}`);
      }
    }

    // Phrase entière : un exemple lod.lu identique, sinon le plus court qui contient la phrase
    // et ne la noie pas dans une longue phrase (au plus 4 mots de plus).
    const target = normalize(card.lb.split(/\s*\/\s*/)[0]);
    const countWords = (s) => normalize(s).split(" ").length;
    const candidates = words
      .flatMap((w) => w.examples.map((ex) => ({ ...ex, articleId: w.articleId })))
      .filter((ex) => isLodUpload(ex.audio.aac));
    const exact = candidates.find((ex) => normalize(ex.text) === target);
    const containing =
      target.split(" ").length >= 2
        ? candidates
            .filter((ex) => ` ${normalize(ex.text)} `.includes(` ${target} `))
            .filter((ex) => countWords(ex.text) <= countWords(target) + 4)
            .sort((a, b) => a.text.length - b.text.length)[0]
        : undefined;
    const sentence = exact ?? containing;

    const result = {
      words: words.map(({ examples: _examples, ...w }) => w),
      ...(sentence
        ? {
            sentence: {
              text: sentence.text,
              exact: Boolean(exact),
              articleId: sentence.articleId,
              aac: sentence.audio.aac,
              ...(isLodUpload(sentence.audio.ogg) ? { ogg: sentence.audio.ogg } : {}),
            },
          }
        : {}),
    };
    if (result.words.length || result.sentence) cards[card.id] = result;
    wordCount += result.words.length;
    if (sentence) sentenceCount++;
    console.log(
      `${card.id.padEnd(18)} ${String(result.words.length).padStart(2)} mot(s)${sentence ? ` + phrase${exact ? "" : " (exemple)"}` : ""}  ${card.lb}`,
    );
  }
}

const out = {
  source: "Lëtzebuerger Online Dictionnaire (LOD), Zenter fir d'Lëtzebuerger Sprooch — https://lod.lu",
  generatedAt: new Date().toISOString().slice(0, 10),
  cards,
};
fs.writeFileSync(outFile, JSON.stringify(out, null, 2) + "\n");
console.log(`\n${Object.keys(cards).length} cartes avec audio, ${wordCount} mots, ${sentenceCount} phrases → ${path.relative(root, outFile)}`);
