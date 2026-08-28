import { describe, it, expect } from "vitest";
import { calculateSidePots } from "../sidePots";
import { Player } from "../types";

function player(
  id: string,
  totalBetThisHand: number,
  status: Player["status"] = "active"
): Player {
  return { id, name: id, stack: 0, currentBetThisStreet: 0, totalBetThisHand, status };
}

describe("calculateSidePots", () => {
  it("returns everything in the main pot when nobody is all-in", () => {
    const players = [player("a", 50), player("b", 50), player("c", 50)];
    const result = calculateSidePots(players);
    expect(result.mainPot).toEqual({ amount: 150, eligiblePlayerIds: ["a", "b", "c"] });
    expect(result.sidePots).toEqual([]);
  });

  it("splits into a side pot when one player is all-in for less", () => {
    // a all-in for 30, b and c cover to 100
    const players = [
      player("a", 30, "all-in"),
      player("b", 100),
      player("c", 100),
    ];
    const result = calculateSidePots(players);
    expect(result.mainPot).toEqual({ amount: 90, eligiblePlayerIds: ["a", "b", "c"] });
    expect(result.sidePots).toEqual([{ amount: 140, eligiblePlayerIds: ["b", "c"] }]);
  });

  it("excludes folded players from eligibility but keeps their chips in the pot", () => {
    const players = [player("a", 50, "folded"), player("b", 50), player("c", 50)];
    const result = calculateSidePots(players);
    expect(result.mainPot.amount).toBe(150);
    expect(result.mainPot.eligiblePlayerIds).toEqual(["b", "c"]);
  });

  it("handles two simultaneous all-in levels", () => {
    const players = [
      player("a", 20, "all-in"),
      player("b", 60, "all-in"),
      player("c", 100),
    ];
    const result = calculateSidePots(players);
    expect(result.mainPot).toEqual({ amount: 60, eligiblePlayerIds: ["a", "b", "c"] });
    expect(result.sidePots).toEqual([
      { amount: 80, eligiblePlayerIds: ["b", "c"] },
      { amount: 40, eligiblePlayerIds: ["c"] },
    ]);
  });

  it("returns an empty breakdown when nobody has contributed", () => {
    const result = calculateSidePots([]);
    expect(result).toEqual({ mainPot: { amount: 0, eligiblePlayerIds: [] }, sidePots: [] });
  });
});
