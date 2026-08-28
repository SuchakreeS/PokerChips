import { describe, it, expect } from "vitest";
import { calculateBetLimits } from "../betting";
import { Game, Player } from "../types";

function player(id: string, overrides: Partial<Player> = {}): Player {
  return {
    id,
    name: id,
    stack: 100,
    currentBetThisStreet: 0,
    totalBetThisHand: 0,
    status: "active",
    ...overrides,
  };
}

function game(overrides: Partial<Game> = {}): Game {
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
    players: [player("a"), player("b", { currentBetThisStreet: 2, totalBetThisHand: 2 })],
    activePlayerIndex: 0,
    lastRaiseSize: 2,
    betsThisStreetCount: 1,
    playersToAct: ["a"],
    ...overrides,
  };
}

describe("calculateBetLimits", () => {
  it("no-limit: min raise-to is currentBet + lastRaiseSize, max is player's full stack", () => {
    const result = calculateBetLimits(game(), "a");
    expect(result).toEqual({ ok: true, value: { min: 4, max: 100, canRaise: true } });
  });

  it("pot-limit: max raise-to is currentBet + (pot + callAmount)", () => {
    const result = calculateBetLimits(game({ bettingStructure: "pot-limit" }), "a");
    // currentBet=2, callAmount=2, potAfterCall = 3 + 2 = 5, max = 2 + 5 = 7
    expect(result).toEqual({ ok: true, value: { min: 4, max: 7, canRaise: true } });
  });

  it("limit: fixed bet size, capped by street", () => {
    const result = calculateBetLimits(game({ bettingStructure: "limit" }), "a");
    // preflop uses smallBet=2, currentBet=2, fixedTo = 2 + 2 = 4
    expect(result).toEqual({ ok: true, value: { min: 4, max: 4, canRaise: true } });
  });

  it("limit: no raise once the street's bet cap is reached", () => {
    const result = calculateBetLimits(
      game({ bettingStructure: "limit", betsThisStreetCount: 4 }),
      "a"
    );
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.canRaise).toBe(false);
  });

  it("caps max at the player's remaining stack when it is less than a full raise", () => {
    const g = game({
      players: [player("a", { stack: 3 }), player("b", { currentBetThisStreet: 2, totalBetThisHand: 2 })],
    });
    const result = calculateBetLimits(g, "a");
    expect(result).toEqual({ ok: true, value: { min: 3, max: 3, canRaise: true } });
  });

  it("rejects an unknown player", () => {
    const result = calculateBetLimits(game(), "ghost");
    expect(result.ok).toBe(false);
  });
});
