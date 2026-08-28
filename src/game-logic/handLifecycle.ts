import { Game, Player, Result } from "./types";
import { advanceTurn } from "./turnOrder";

export function nextHand(game: Game): Result<Game> {
  const players: Player[] = game.players.map((p) => ({
    ...p,
    currentBetThisStreet: 0,
    totalBetThisHand: 0,
    status: p.stack === 0 ? "sitting-out" : p.status === "sitting-out" ? "sitting-out" : "active",
  }));

  const activeCount = players.filter((p) => p.status === "active").length;
  if (activeCount < 2) {
    return { ok: false, reason: "Need at least two players with chips to start a hand" };
  }

  const buttonPosition = advanceTurn(players, game.buttonPosition);
  if (buttonPosition === null) return { ok: false, reason: "No active player found for button" };

  let sbIndex: number | null;
  let bbIndex: number | null;
  if (activeCount === 2) {
    sbIndex = buttonPosition;
    bbIndex = advanceTurn(players, buttonPosition);
  } else {
    sbIndex = advanceTurn(players, buttonPosition);
    bbIndex = sbIndex !== null ? advanceTurn(players, sbIndex) : null;
  }
  if (sbIndex === null || bbIndex === null) {
    return { ok: false, reason: "Unable to determine blinds" };
  }

  const postBlind = (idx: number, amount: number): number => {
    const p = players[idx];
    const actual = Math.min(amount, p.stack);
    players[idx] = {
      ...p,
      stack: p.stack - actual,
      currentBetThisStreet: actual,
      totalBetThisHand: actual,
      status: p.stack - actual === 0 ? "all-in" : "active",
    };
    return actual;
  };

  const sbPosted = postBlind(sbIndex, game.smallBlind);
  const bbPosted = postBlind(bbIndex, game.bigBlind);

  const activePlayerIndex = advanceTurn(players, bbIndex);
  if (activePlayerIndex === null) {
    return { ok: false, reason: "Unable to determine first player to act" };
  }

  return {
    ok: true,
    value: {
      ...game,
      players,
      buttonPosition,
      currentStreet: "preflop",
      mainPot: sbPosted + bbPosted,
      mainPotEligiblePlayerIds: players.filter((p) => p.status !== "sitting-out").map((p) => p.id),
      sidePots: [],
      activePlayerIndex,
      lastRaiseSize: game.bigBlind,
      betsThisStreetCount: 1,
      playersToAct: players.filter((p) => p.status === "active").map((p) => p.id),
    },
  };
}
