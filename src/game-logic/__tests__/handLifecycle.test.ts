import { describe, it, expect } from "vitest";
import { nextHand } from "../handLifecycle";
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
    currentStreet: "river",
    mainPot: 0,
    mainPotEligiblePlayerIds: [],
    sidePots: [],
    players: [player("a"), player("b"), player("c")],
    activePlayerIndex: 0,
    lastRaiseSize: 2,
    betsThisStreetCount: 0,
    playersToAct: [],
    ...overrides,
  };
}

describe("nextHand", () => {
  it("moves the button, posts blinds, and sets first-to-act (3-handed)", () => {
    const result = nextHand(game());
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.buttonPosition).toBe(0); // next active after seat 2
    expect(result.value.players[1].currentBetThisStreet).toBe(1); // sb = seat after button
    expect(result.value.players[2].currentBetThisStreet).toBe(2); // bb
    expect(result.value.mainPot).toBe(3);
    expect(result.value.activePlayerIndex).toBe(0); // first to act after bb, wraps to button seat
    expect(result.value.currentStreet).toBe("preflop");
  });

  it("heads-up: button posts the small blind", () => {
    const g = game({ players: [player("a"), player("b")], buttonPosition: 1 });
    const result = nextHand(g);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.buttonPosition).toBe(0);
    expect(result.value.players[0].currentBetThisStreet).toBe(1); // button/SB
    expect(result.value.players[1].currentBetThisStreet).toBe(2); // BB
  });

  it("moves busted players (stack 0) to sitting-out and skips them for the button", () => {
    const g = game({ players: [player("a", { stack: 0 }), player("b"), player("c")] });
    const result = nextHand(g);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.players[0].status).toBe("sitting-out");
    expect(result.value.buttonPosition).not.toBe(0);
  });

  it("posts a short blind and marks the player all-in if their stack can't cover it", () => {
    const g = game({ players: [player("a"), player("b", { stack: 0.5 }), player("c")] });
    const result = nextHand(g);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const sb = result.value.players.find((p) => p.currentBetThisStreet > 0 && p.currentBetThisStreet < 1);
    expect(sb?.status).toBe("all-in");
  });

  it("refuses to start a hand with fewer than two players with chips", () => {
    const g = game({ players: [player("a"), player("b", { stack: 0 }), player("c", { stack: 0 })] });
    const result = nextHand(g);
    expect(result.ok).toBe(false);
  });
});
