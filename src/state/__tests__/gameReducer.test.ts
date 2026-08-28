import { describe, it, expect } from "vitest";
import { gameReducer, GameReducerState } from "../gameReducer";

const initial: GameReducerState = { game: null, lastError: null };

describe("gameReducer", () => {
  it("SETUP_GAME creates a game and immediately starts the first hand", () => {
    const state = gameReducer(initial, {
      type: "SETUP_GAME",
      payload: {
        players: [
          { name: "Alice", stack: 100 },
          { name: "Bob", stack: 100 },
          { name: "Cara", stack: 100 },
        ],
        bettingStructure: "no-limit",
        smallBlind: 1,
        bigBlind: 2,
      },
    });
    expect(state.game).not.toBeNull();
    expect(state.game?.players).toHaveLength(3);
    expect(state.game?.currentStreet).toBe("preflop");
    expect(state.game?.mainPot).toBe(3);
    expect(state.lastError).toBeNull();
  });

  it("PLAYER_ACTION applies a valid action and clears any previous error", () => {
    const setupState = gameReducer(initial, {
      type: "SETUP_GAME",
      payload: {
        players: [{ name: "Alice", stack: 100 }, { name: "Bob", stack: 100 }],
        bettingStructure: "no-limit",
        smallBlind: 1,
        bigBlind: 2,
      },
    });
    const actorId = setupState.game!.players[setupState.game!.activePlayerIndex].id;
    const state = gameReducer(setupState, {
      type: "PLAYER_ACTION",
      payload: { playerId: actorId, action: "call" },
    });
    expect(state.lastError).toBeNull();
    expect(state.game?.mainPot).toBeGreaterThan(setupState.game!.mainPot);
  });

  it("PLAYER_ACTION records an error and leaves state unchanged on an invalid action", () => {
    const setupState = gameReducer(initial, {
      type: "SETUP_GAME",
      payload: {
        players: [{ name: "Alice", stack: 100 }, { name: "Bob", stack: 100 }],
        bettingStructure: "no-limit",
        smallBlind: 1,
        bigBlind: 2,
      },
    });
    const wrongPlayerId = setupState.game!.players.find(
      (_, i) => i !== setupState.game!.activePlayerIndex
    )!.id;
    const state = gameReducer(setupState, {
      type: "PLAYER_ACTION",
      payload: { playerId: wrongPlayerId, action: "fold" },
    });
    expect(state.lastError).not.toBeNull();
    expect(state.game).toEqual(setupState.game);
  });

  it("NEXT_HAND is a no-op when there is no game yet", () => {
    const state = gameReducer(initial, { type: "NEXT_HAND" });
    expect(state).toEqual(initial);
  });

  it("RESET_GAME clears the game and any error, returning to setup", () => {
    const setupState = gameReducer(initial, {
      type: "SETUP_GAME",
      payload: {
        players: [{ name: "Alice", stack: 100 }, { name: "Bob", stack: 100 }],
        bettingStructure: "no-limit",
        smallBlind: 1,
        bigBlind: 2,
      },
    });
    expect(setupState.game).not.toBeNull();

    const state = gameReducer(setupState, { type: "RESET_GAME" });
    expect(state.game).toBeNull();
    expect(state.lastError).toBeNull();
  });
});
