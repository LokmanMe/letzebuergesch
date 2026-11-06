import type { LodClip } from "../../domain/types";

/** Un seul lecteur pour toute l'appli : lancer un son arrête le précédent. */
let audio: HTMLAudioElement | null = null;
let token = 0;
let settleCurrent: (() => void) | null = null;

function element(): HTMLAudioElement {
  audio ??= new Audio();
  return audio;
}

/** AAC (.m4a) partout où c'est lu (iPhone compris), sinon OGG. */
export function clipUrl(clip: LodClip): string {
  const canAac = element().canPlayType("audio/mp4") !== "";
  return canAac || !clip.ogg ? clip.aac : clip.ogg;
}

/** Arrête la lecture en cours ; la lecture interrompue se termine sans erreur. */
export function stop() {
  token++;
  if (audio) {
    audio.onended = null;
    audio.onerror = null;
    audio.pause();
  }
  settleCurrent?.();
  settleCurrent = null;
}

function playOne(clip: LodClip): Promise<void> {
  return new Promise((resolve, reject) => {
    const el = element();
    settleCurrent = resolve;
    el.onended = () => resolve();
    el.onerror = () => reject(new Error("audio"));
    el.src = clipUrl(clip);
    el.play().catch((e: unknown) => {
      // AbortError : la lecture a été remplacée par une autre, ce n'est pas une panne.
      if (e instanceof DOMException && e.name === "AbortError") resolve();
      else reject(e);
    });
  });
}

/** Joue un ou plusieurs enregistrements à la suite. Rejette si l'audio est indisponible (hors ligne…). */
export async function play(clips: LodClip[], gapMs = 250): Promise<void> {
  stop();
  const myToken = token;
  for (const [i, clip] of clips.entries()) {
    if (myToken !== token) return;
    await playOne(clip);
    if (i < clips.length - 1) await new Promise((r) => setTimeout(r, gapMs));
  }
}
