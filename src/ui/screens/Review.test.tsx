// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, it } from "vitest";
import type { AppState } from "../../domain/types";
import { defaultState } from "../../storage/defaultState";
import type { Storage } from "../../storage/Storage";
import { AppStateProvider } from "../state/AppStateContext";
import { Review } from "./Review";

function memoryStorage(initial: AppState): Storage & { saved: AppState } {
  const s = {
    saved: initial,
    load: () => s.saved,
    save: (state: AppState) => void (s.saved = state),
    export: (state: AppState) => JSON.stringify(state),
    import: (json: string) => JSON.parse(json) as AppState,
  };
  return s;
}

function renderReview(state: AppState) {
  const storage = memoryStorage(state);
  render(
    <AppStateProvider storage={storage}>
      <MemoryRouter initialEntries={["/revision?mode=jour"]}>
        <Routes>
          <Route path="/revision" element={<Review />} />
        </Routes>
      </MemoryRouter>
    </AppStateProvider>,
  );
  return storage;
}

afterEach(cleanup);

describe("écran de révision", () => {
  it("carte nouvelle : mode découverte, réponse et audio visibles d'emblée, un seul bouton", () => {
    const storage = renderReview({ ...defaultState(), settings: { newPerDay: 2, dailyGoal: 15 } });
    expect(screen.getByText("1 / 2")).toBeTruthy();
    expect(screen.getByText(/Nouvelle/)).toBeTruthy();
    expect(screen.getByText("Moien!")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Voir la réponse" })).toBeNull();
    expect(screen.queryByRole("button", { name: /Raté/ })).toBeNull();
    expect(screen.getByRole("button", { name: "Écouter Moien" })).toBeTruthy();
    expect(screen.getByText("à vérifier")).toBeTruthy();
    const lod = screen.getByRole("link", { name: /dictionnaire lod.lu/ });
    expect(lod.getAttribute("href")).toBe("https://lod.lu/sich/lb/Moien");
    expect(lod.getAttribute("target")).toBe("_blank");

    fireEvent.click(screen.getByRole("button", { name: /C'est noté/ }));
    expect(storage.saved.progress["greetings-001"]).toMatchObject({ box: 1 });
    expect(screen.getByText("2 / 2")).toBeTruthy();
  });

  it("après découverte, premier essai en fin de session sans effet sur le planning", () => {
    const storage = renderReview({ ...defaultState(), settings: { newPerDay: 1, dailyGoal: 15 } });
    fireEvent.keyDown(window, { key: "Enter" });
    expect(screen.getByText(/Premier essai/)).toBeTruthy();
    expect(screen.getByRole("button", { name: "Voir la réponse" })).toBeTruthy();
    const before = storage.saved.progress["greetings-001"];
    fireEvent.keyDown(window, { key: " " });
    fireEvent.keyDown(window, { key: "1" });
    expect(storage.saved.progress["greetings-001"]).toEqual(before);
    expect(screen.getByText(/Session terminée/)).toBeTruthy();
    expect(screen.getByText(/1 nouvelle phrase découverte/)).toBeTruthy();
  });

  it("carte déjà vue : rappel, notation, et une carte ratée revient en fin de session", () => {
    const seen = {
      ...defaultState(),
      progress: { "greetings-001": { box: 2 as const, due: "2000-01-01", firstSeen: "2000-01-01", lastReviewed: "2000-01-01", reviews: 1, lapses: 0 } },
      settings: { newPerDay: 0, dailyGoal: 15 },
    };
    const storage = renderReview(seen);
    expect(screen.queryByText(/Nouvelle/)).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Voir la réponse" }));
    fireEvent.click(screen.getByRole("button", { name: /^Raté/ }));
    expect(storage.saved.progress["greetings-001"].box).toBe(1);
    expect(screen.getByText(/Deuxième essai/)).toBeTruthy();
    fireEvent.keyDown(window, { key: " " });
    fireEvent.keyDown(window, { key: "3" });
    expect(storage.saved.progress["greetings-001"].box).toBe(1);
    expect(screen.getByText("Raté : 1")).toBeTruthy();
  });
});
