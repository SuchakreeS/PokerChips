import { describe, it, expect } from "vitest";
import { applyPlayerAction, awardPot } from "../playerAction";
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
    buttonPosition: 2,
    currentStreet: "preflop",
    mainPot: 3,
    mainPotEligiblePlayerIds: ["a", "b", "c"],
    sidePots: [],
    players: [
      player("a"),
      player("b", { currentBetThisStreet: 1, totalBetThisHand: 1 }),
      player("c", { currentBetThisStreet: 2, totalBetThisHand: 2 }),
    ],
    activePlayerIndex: 0,
    lastRaiseSize: 2,
    betsThisStreetCount: 1,
    playersToAct: ["a", "b"],
    ...overrides,
  };
}

describe("applyPlayerAction", () => {
  it("rejects an action out of turn", () => {
    const result = applyPlayerAction(game(), "b", "fold");
    expect(result.ok).toBe(false);
  });

  it("call: moves chips to the pot and advances the turn", () => {
    const result = applyPlayerAction(game(), "a", "call");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.players[0].stack).toBe(98);
    expect(result.value.mainPot).toBe(5);
    expect(result.value.activePlayerIndex).toBe(1);
    expect(result.value.playersToAct).toEqual(["b"]);
  });

  it("fold: marks the player folded and advances the turn", () => {
    const result = applyPlayerAction(game(), "a", "fold");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.players[0].status).toBe("folded");
    expect(result.value.activePlayerIndex).toBe(1);
  });

  it("bet-raise: rejects an amount below the minimum", () => {
    const result = applyPlayerAction(game(), "a", "bet-raise", 3);
    expect(result.ok).toBe(false);
  });

  it("bet-raise: reopens action for other active players", () => {
    const result = applyPlayerAction(game(), "a", "bet-raise", 6);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.players[0].currentBetThisStreet).toBe(6);
    expect(result.value.playersToAct.sort()).toEqual(["b", "c"]);
  });

  it("closes the betting round and advances the street once playersToAct is empty", () => {
    const g = game({ activePlayerIndex: 1, playersToAct: ["b"] });
    const result = applyPlayerAction(g, "b", "call");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.currentStreet).toBe("flop");
    expect(result.value.players.every((p) => p.currentBetThisStreet === 0)).toBe(true);
    expect(result.value.playersToAct.sort()).toEqual(["a", "b", "c"]);
  });

  it("rejects any action once the hand is over (playersToAct is empty)", () => {
    const g = game({ playersToAct: [], mainPot: 0, sidePots: [], activePlayerIndex: 0 });
    const result = applyPlayerAction(g, "a", "check");
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toMatch(/hand is over/i);
  });

  it("finalizes pots when only one contesting player remains after a fold", () => {
    const g = game({
      players: [
        player("a", { status: "folded", totalBetThisHand: 5 }),
        player("b", { currentBetThisStreet: 5, totalBetThisHand: 5 }),
      ],
      activePlayerIndex: 1,
      playersToAct: ["b"],
    });
    const result = applyPlayerAction(g, "b", "check");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.mainPot).toBe(10);
    expect(result.value.playersToAct).toEqual([]);
  });
});

describe("awardPot", () => {
  it("pays the main pot to the winner and zeroes it out", () => {
    const g = game({ mainPot: 50, mainPotEligiblePlayerIds: ["a", "b"] });
    const result = awardPot(g, -1, "a");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.players[0].stack).toBe(150);
    expect(result.value.mainPot).toBe(0);
  });

  it("rejects a winner who isn't eligible for that pot", () => {
    const g = game({ sidePots: [{ amount: 20, eligiblePlayerIds: ["b"] }] });
    const result = awardPot(g, 0, "a");
    expect(result.ok).toBe(false);
  });
});
