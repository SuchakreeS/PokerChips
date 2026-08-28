// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest";
import { saveGame, loadGame, clearSavedGame } from "../persistence";
import { Game } from "../../game-logic/types";

function fakeGame(): Game {
  return {
    id: "g1",
    bettingStructure: "no-limit",
    smallBlind: 1,
    bigBlind: 2,
    smallBet: 2,
    bigBet: 4,
    buttonPosition: 0,
    currentStreet: "preflop",
    mainPot: 3,
    mainPotEligiblePlayerIds: [],
    sidePots: [],
    players: [],
    activePlayerIndex: 0,
    lastRaiseSize: 2,
    betsThisStreetCount: 1,
    playersToAct: [],
  };
}

beforeEach(() => {
  clearSavedGame();
});

describe("persistence", () => {
  it("round-trips a saved game", () => {
    saveGame(fakeGame());
    expect(loadGame()).toEqual(fakeGame());
  });

  it("returns null when nothing is saved", () => {
    expect(loadGame()).toBeNull();
  });

  it("returns null for corrupted stored JSON", () => {
    window.localStorage.setItem("poker-chip-distributor:game", "not json");
    expect(loadGame()).toBeNull();
  });

  it("returns null for a mismatched version", () => {
    window.localStorage.setItem(
      "poker-chip-distributor:game",
      JSON.stringify({ version: 999, game: fakeGame() })
    );
    expect(loadGame()).toBeNull();
  });

  it("clearSavedGame removes the stored game", () => {
    saveGame(fakeGame());
    clearSavedGame();
    expect(loadGame()).toBeNull();
  });
});
