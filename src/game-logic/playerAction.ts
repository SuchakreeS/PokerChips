import { Game, Player, Result } from "./types";
import { calculateBetLimits } from "./betting";
import { calculateSidePots } from "./sidePots";
import { advanceTurn } from "./turnOrder";

const STREET_ORDER = ["preflop", "flop", "turn", "river"] as const;

function nextStreet(street: Game["currentStreet"]): Game["currentStreet"] | null {
  const idx = STREET_ORDER.indexOf(street);
  return idx < STREET_ORDER.length - 1 ? STREET_ORDER[idx + 1] : null;
}

export function applyPlayerAction(
  game: Game,
  playerId: string,
  action: "fold" | "check" | "call" | "bet-raise",
  amount?: number
): Result<Game> {
  const playerIndex = game.players.findIndex((p) => p.id === playerId);
  if (playerIndex === -1) return { ok: false, reason: "Player not found" };
  if (game.activePlayerIndex !== playerIndex) {
    return { ok: false, reason: "Not this player's turn" };
  }
  const player = game.players[playerIndex];
  if (player.status !== "active") return { ok: false, reason: "Player cannot act" };

  const currentBet = Math.max(...game.players.map((p) => p.currentBetThisStreet));
  const players = [...game.players];
  let mainPot = game.mainPot;
  let lastRaiseSize = game.lastRaiseSize;
  let betsThisStreetCount = game.betsThisStreetCount;
  let playersToAct = game.playersToAct.filter((id) => id !== playerId);

  if (action === "fold") {
    players[playerIndex] = { ...player, status: "folded" };
  } else if (action === "check") {
    if (player.currentBetThisStreet !== currentBet) {
      return { ok: false, reason: "Cannot check, there is a bet to call" };
    }
  } else if (action === "call") {
    const callAmount = Math.min(currentBet - player.currentBetThisStreet, player.stack);
    players[playerIndex] = {
      ...player,
      stack: player.stack - callAmount,
      currentBetThisStreet: player.currentBetThisStreet + callAmount,
      totalBetThisHand: player.totalBetThisHand + callAmount,
      status: player.stack - callAmount === 0 ? "all-in" : "active",
    };
    mainPot += callAmount;
  } else {
    if (amount === undefined) return { ok: false, reason: "Bet/raise requires an amount" };
    const limitsResult = calculateBetLimits(game, playerId);
    if (!limitsResult.ok) return limitsResult;
    const { min, max, canRaise } = limitsResult.value;
    if (!canRaise) return { ok: false, reason: "No raise is possible" };
    if (amount < min || amount > max) {
      return { ok: false, reason: `Bet must be between ${min} and ${max}` };
    }
    const putIn = amount - player.currentBetThisStreet;
    players[playerIndex] = {
      ...player,
      stack: player.stack - putIn,
      currentBetThisStreet: amount,
      totalBetThisHand: player.totalBetThisHand + putIn,
      status: player.stack - putIn === 0 ? "all-in" : "active",
    };
    mainPot += putIn;
    lastRaiseSize = amount - currentBet;
    betsThisStreetCount += 1;
    playersToAct = players
      .filter((p) => p.status === "active" && p.id !== playerId)
      .map((p) => p.id);
  }

  const afterAction: Game = { ...game, players, mainPot, lastRaiseSize, betsThisStreetCount, playersToAct };

  const stillContesting = players.filter((p) => p.status === "active" || p.status === "all-in");
  if (stillContesting.length <= 1) {
    return { ok: true, value: finalizePots(afterAction, players) };
  }

  if (playersToAct.length === 0) {
    return { ok: true, value: advanceStreet(afterAction) };
  }

  const nextIndex = advanceTurn(players, playerIndex);
  if (nextIndex === null) {
    return { ok: true, value: finalizePots(afterAction, players) };
  }
  return { ok: true, value: { ...afterAction, activePlayerIndex: nextIndex } };
}

function finalizePots(game: Game, players: Player[]): Game {
  const { mainPot, sidePots } = calculateSidePots(players);
  return {
    ...game,
    mainPot: mainPot.amount,
    mainPotEligiblePlayerIds: mainPot.eligiblePlayerIds,
    sidePots,
    playersToAct: [],
  };
}

function advanceStreet(game: Game): Game {
  const players = game.players.map((p) => ({ ...p, currentBetThisStreet: 0 }));
  const { mainPot, sidePots } = calculateSidePots(players);
  const street = nextStreet(game.currentStreet);
  const activeCount = players.filter((p) => p.status === "active").length;

  if (street === null || activeCount <= 1) {
    return {
      ...game,
      players,
      mainPot: mainPot.amount,
      mainPotEligiblePlayerIds: mainPot.eligiblePlayerIds,
      sidePots,
      playersToAct: [],
    };
  }

  const activePlayerIndex = advanceTurn(players, game.buttonPosition) ?? game.activePlayerIndex;
  return {
    ...game,
    players,
    currentStreet: street,
    mainPot: mainPot.amount,
    mainPotEligiblePlayerIds: mainPot.eligiblePlayerIds,
    sidePots,
    lastRaiseSize: game.bigBlind,
    betsThisStreetCount: 0,
    playersToAct: players.filter((p) => p.status === "active").map((p) => p.id),
    activePlayerIndex,
  };
}

export function awardPot(game: Game, potIndex: number, winnerId: string): Result<Game> {
  const isMain = potIndex === -1;
  const pot = isMain
    ? { amount: game.mainPot, eligiblePlayerIds: game.mainPotEligiblePlayerIds }
    : game.sidePots[potIndex];
  if (!pot) return { ok: false, reason: "Pot not found" };
  if (!pot.eligiblePlayerIds.includes(winnerId)) {
    return { ok: false, reason: "Player is not eligible to win this pot" };
  }
  const players = game.players.map((p) =>
    p.id === winnerId ? { ...p, stack: p.stack + pot.amount } : p
  );
  return {
    ok: true,
    value: {
      ...game,
      players,
      mainPot: isMain ? 0 : game.mainPot,
      mainPotEligiblePlayerIds: isMain ? [] : game.mainPotEligiblePlayerIds,
      sidePots: isMain ? game.sidePots : game.sidePots.filter((_, i) => i !== potIndex),
    },
  };
}
