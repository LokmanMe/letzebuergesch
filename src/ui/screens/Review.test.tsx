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
  it("recto → verso → notation, avec boutons accessibles", () => {
    const storage = renderReview({ ...defaultState(), settings: { newPerDay: 2 } });
    expect(screen.getByText("1 / 2")).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Raté/ })).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Voir la réponse" }));
    expect(screen.getByText("Moien!")).toBeTruthy();
    expect(screen.getByText("à vérifier")).toBeTruthy();
    const lod = screen.getByRole("link", { name: /dictionnaire lod.lu/ });
    expect(screen.getByRole("button", { name: "Écouter Moien"})).toBeTruthy();
    expect(lod.getAttribute("href")).toBe("https://lod.lu/sich/lb/Moien");
    expect(lod.getAttribute("target")).toBe("_blank");

    fireEvent.click(screen.getByRole("button", { name: /^Facile/ }));
    expect(Object.keys(storage.saved.progress)).toEqual(["greetings-001"]);
    expect(storage.saved.progress["greetings-001"].box).toBe(2);
    expect(screen.getByText("2 / 2")).toBeTruthy();
  });

  it("une carte ratée revient en fin de session, puis écran de fin", () => {
    renderReview({ ...defaultState(), settings: { newPerDay: 1 } });
    fireEvent.keyDown(window, { key: " " });
    fireEvent.keyDown(window, { key: "1" });
    expect(screen.getByText(/Deuxième essai/)).toBeTruthy();
    fireEvent.keyDown(window, { key: " " });
    fireEvent.keyDown(window, { key: "3" });
    expect(screen.getByText(/Session terminée/)).toBeTruthy();
    expect(screen.getByText("Raté : 1")).toBeTruthy();
  });
});
