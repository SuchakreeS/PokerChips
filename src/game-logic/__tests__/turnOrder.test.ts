import { describe, it, expect } from "vitest";
import { advanceTurn } from "../turnOrder";
import { Player } from "../types";

function player(id: string, status: Player["status"] = "active"): Player {
  return { id, name: id, stack: 100, currentBetThisStreet: 0, totalBetThisHand: 0, status };
}

describe("advanceTurn", () => {
  it("moves to the next active player", () => {
    const players = [player("a"), player("b"), player("c")];
    expect(advanceTurn(players, 0)).toBe(1);
  });

  it("skips folded and all-in players", () => {
    const players = [player("a"), player("b", "folded"), player("c", "all-in"), player("d")];
    expect(advanceTurn(players, 0)).toBe(3);
  });

  it("wraps around to the start", () => {
    const players = [player("a"), player("b"), player("c")];
    expect(advanceTurn(players, 2)).toBe(0);
  });

  it("returns null when no active player remains", () => {
    const players = [player("a", "folded"), player("b", "folded")];
    expect(advanceTurn(players, 0)).toBeNull();
  });
});
