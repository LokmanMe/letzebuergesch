import cafeteria from "./cafeteria.json";
import greetings from "./greetings.json";
import intro from "./intro.json";
import joker from "./joker.json";
import lodAudio from "./lodAudio.json";
import numbersDays from "./numbers-days.json";
import office from "./office.json";
import { assertModules } from "./schema";
import type { CardAudio } from "../domain/types";

/** Ordre d'apprentissage des modules : les nouvelles cartes sont présentées dans cet ordre. */
export const RAW_MODULES: unknown[] = [greetings, intro, joker, office, cafeteria, numbersDays];

export const MODULES = assertModules(RAW_MODULES);

/** Enregistrements lod.lu par carte, générés par scripts/fetch-lod-audio.mjs. */
export const LOD_AUDIO: Record<string, CardAudio> = lodAudio.cards;
export const LOD_AUDIO_SOURCE = lodAudio.source;
