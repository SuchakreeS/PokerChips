export type BettingStructure = "no-limit" | "pot-limit" | "limit";
export type Street = "preflop" | "flop" | "turn" | "river";
export type PlayerStatus = "active" | "folded" | "all-in" | "sitting-out";

export interface Player {
  id: string;
  name: string;
  stack: number;
  currentBetThisStreet: number;
  totalBetThisHand: number;
  status: PlayerStatus;
}

export interface SidePot {
  amount: number;
  eligiblePlayerIds: string[];
}

export interface Game {
  id: string;
  bettingStructure: BettingStructure;
  smallBlind: number;
  bigBlind: number;
  smallBet: number;
  bigBet: number;
  buttonPosition: number;
  currentStreet: Street;
  mainPot: number;
  mainPotEligiblePlayerIds: string[];
  sidePots: SidePot[];
  players: Player[];
  activePlayerIndex: number;
  lastRaiseSize: number;
  betsThisStreetCount: number;
  playersToAct: string[];
}

export type Result<T> =
  | { ok: true; value: T }
  | { ok: false; reason: string };
