import { Game, Result } from "./types";

export interface BetLimits {
  min: number;
  max: number;
  canRaise: boolean;
}

export function calculateBetLimits(game: Game, playerId: string): Result<BetLimits> {
  const player = game.players.find((p) => p.id === playerId);
  if (!player) return { ok: false, reason: "Player not found" };
  if (player.status !== "active") return { ok: false, reason: "Player cannot act" };

  const currentBet = Math.max(...game.players.map((p) => p.currentBetThisStreet));
  const callAmount = Math.min(currentBet - player.currentBetThisStreet, player.stack);
  const maxTotalBet = player.currentBetThisStreet + player.stack;

  if (maxTotalBet <= currentBet) {
    return { ok: true, value: { min: maxTotalBet, max: maxTotalBet, canRaise: false } };
  }

  if (game.bettingStructure === "no-limit") {
    const minRaiseTo = Math.min(currentBet + game.lastRaiseSize, maxTotalBet);
    return { ok: true, value: { min: minRaiseTo, max: maxTotalBet, canRaise: true } };
  }

  if (game.bettingStructure === "pot-limit") {
    const potAfterCall = game.mainPot + callAmount;
    const maxRaiseTo = Math.min(currentBet + potAfterCall, maxTotalBet);
    const minRaiseTo = Math.min(currentBet + game.lastRaiseSize, maxRaiseTo);
    return { ok: true, value: { min: minRaiseTo, max: maxRaiseTo, canRaise: maxRaiseTo > currentBet } };
  }

  // limit
  if (game.betsThisStreetCount >= 4) {
    return { ok: true, value: { min: maxTotalBet, max: maxTotalBet, canRaise: false } };
  }
  const increment =
    game.currentStreet === "preflop" || game.currentStreet === "flop" ? game.smallBet : game.bigBet;
  const fixedTo = Math.min(currentBet + increment, maxTotalBet);
  return { ok: true, value: { min: fixedTo, max: fixedTo, canRaise: fixedTo > currentBet } };
}
