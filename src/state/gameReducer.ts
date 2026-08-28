import { BettingStructure, Game, Player } from "../game-logic/types";
import { nextHand } from "../game-logic/handLifecycle";
import { applyPlayerAction, awardPot } from "../game-logic/playerAction";
import { clearSavedGame } from "./persistence";

export type GameAction =
  | {
      type: "SETUP_GAME";
      payload: {
        players: { name: string; stack: number }[];
        bettingStructure: BettingStructure;
        smallBlind: number;
        bigBlind: number;
        smallBet?: number;
        bigBet?: number;
      };
    }
  | {
      type: "PLAYER_ACTION";
      payload: { playerId: string; action: "fold" | "check" | "call" | "bet-raise"; amount?: number };
    }
  | { type: "NEXT_HAND" }
  | { type: "AWARD_POT"; payload: { potIndex: number; winnerId: string } }
  | { type: "RESET_GAME" };

export interface GameReducerState {
  game: Game | null;
  lastError: string | null;
}

export function gameReducer(state: GameReducerState, action: GameAction): GameReducerState {
  switch (action.type) {
    case "SETUP_GAME": {
      const { players, bettingStructure, smallBlind, bigBlind, smallBet, bigBet } = action.payload;
      const initialPlayers: Player[] = players.map((p, i) => ({
        id: `player-${i}-${Date.now()}`,
        name: p.name,
        stack: p.stack,
        currentBetThisStreet: 0,
        totalBetThisHand: 0,
        status: "active",
      }));
      const baseGame: Game = {
        id: `game-${Date.now()}`,
        bettingStructure,
        smallBlind,
        bigBlind,
        smallBet: smallBet ?? smallBlind * 2,
        bigBet: bigBet ?? bigBlind * 2,
        buttonPosition: initialPlayers.length - 1,
        currentStreet: "preflop",
        mainPot: 0,
        mainPotEligiblePlayerIds: [],
        sidePots: [],
        players: initialPlayers,
        activePlayerIndex: 0,
        lastRaiseSize: bigBlind,
        betsThisStreetCount: 0,
        playersToAct: [],
      };
      const result = nextHand(baseGame);
      if (!result.ok) return { game: null, lastError: result.reason };
      return { game: result.value, lastError: null };
    }
    case "PLAYER_ACTION": {
      if (!state.game) return state;
      const { playerId, action: playerActionType, amount } = action.payload;
      const result = applyPlayerAction(state.game, playerId, playerActionType, amount);
      if (!result.ok) return { ...state, lastError: result.reason };
      return { game: result.value, lastError: null };
    }
    case "NEXT_HAND": {
      if (!state.game) return state;
      const result = nextHand(state.game);
      if (!result.ok) return { ...state, lastError: result.reason };
      return { game: result.value, lastError: null };
    }
    case "AWARD_POT": {
      if (!state.game) return state;
      const result = awardPot(state.game, action.payload.potIndex, action.payload.winnerId);
      if (!result.ok) return { ...state, lastError: result.reason };
      return { game: result.value, lastError: null };
    }
    case "RESET_GAME": {
      clearSavedGame();
      return { game: null, lastError: null };
    }
    default:
      return state;
  }
}
