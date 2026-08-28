import { Player, SidePot } from "./types";

export interface PotBreakdown {
  mainPot: { amount: number; eligiblePlayerIds: string[] };
  sidePots: SidePot[];
}

export function calculateSidePots(players: Player[]): PotBreakdown {
  const contributors = players.filter((p) => p.totalBetThisHand > 0);
  if (contributors.length === 0) {
    return { mainPot: { amount: 0, eligiblePlayerIds: [] }, sidePots: [] };
  }

  const allInLevels = Array.from(
    new Set(contributors.filter((p) => p.status === "all-in").map((p) => p.totalBetThisHand))
  ).sort((a, b) => a - b);
  const levels = [...allInLevels, Infinity];

  const layers: { amount: number; eligiblePlayerIds: string[] }[] = [];
  let previousLevel = 0;

  for (const level of levels) {
    const amount = contributors.reduce((sum, p) => {
      const contribution = Math.min(p.totalBetThisHand, level) - previousLevel;
      return sum + Math.max(contribution, 0);
    }, 0);
    const eligiblePlayerIds = contributors
      .filter((p) => p.status !== "folded" && p.totalBetThisHand > previousLevel)
      .map((p) => p.id);

    if (amount > 0 && eligiblePlayerIds.length > 0) {
      layers.push({ amount, eligiblePlayerIds });
    } else if (amount > 0 && layers.length > 0) {
      layers[layers.length - 1].amount += amount;
    }
    previousLevel = level;
  }

  if (layers.length === 0) {
    return { mainPot: { amount: 0, eligiblePlayerIds: [] }, sidePots: [] };
  }
  const [mainPot, ...sidePots] = layers;
  return { mainPot, sidePots };
}
