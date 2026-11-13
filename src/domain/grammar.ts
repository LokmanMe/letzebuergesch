import { stageProgress, type Stage } from "./path";
import type { AppState, Lesson, LocalDate } from "./types";

/**
 * - "new" : l'étape de la leçon est terminée (toutes ses phrases découvertes) et la leçon n'est pas lue ;
 * - "read" : déjà lue ;
 * - "upcoming" : étape pas encore terminée (la leçon reste lisible, mais s'appuie sur des phrases pas encore vues).
 */
export type LessonStatus = "new" | "read" | "upcoming";

export function lessonStatuses(lessons: Lesson[], stages: Stage[], state: AppState): Map<string, LessonStatus> {
  const progress = stageProgress(stages, state);
  const done = new Set(stages.filter((_, i) => progress[i].status === "done").map((s) => s.id));
  return new Map(
    lessons.map((l): [string, LessonStatus] => [l.id, l.id in state.lessonsRead ? "read" : done.has(l.afterStage) ? "new" : "upcoming"]),
  );
}

export function lessonsAfterStage(lessons: Lesson[], stageId: string): Lesson[] {
  return lessons.filter((l) => l.afterStage === stageId);
}

export function markLessonRead(state: AppState, lessonId: string, today: LocalDate): AppState {
  if (lessonId in state.lessonsRead) return state;
  return { ...state, lessonsRead: { ...state.lessonsRead, [lessonId]: today } };
}
