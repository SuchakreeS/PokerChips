import { createContext, useContext, useEffect, useReducer, ReactNode, Dispatch } from "react";
import { gameReducer, GameReducerState, GameAction } from "./gameReducer";
import { loadGame, saveGame } from "./persistence";

const initialState: GameReducerState = { game: null, lastError: null };

function init(): GameReducerState {
  const saved = loadGame();
  return saved ? { game: saved, lastError: null } : initialState;
}

interface GameContextValue {
  state: GameReducerState;
  dispatch: Dispatch<GameAction>;
}

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, undefined, init);

  useEffect(() => {
    if (state.game) saveGame(state.game);
  }, [state.game]);

  return <GameContext.Provider value={{ state, dispatch }}>{children}</GameContext.Provider>;
}

export function useGame(): GameContextValue {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame must be used within a GameProvider");
  return ctx;
}
