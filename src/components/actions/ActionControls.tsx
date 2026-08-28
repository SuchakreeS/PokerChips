import { useState, useMemo } from "react";
import { useGame } from "../../state/GameContext";
import { calculateBetLimits } from "../../game-logic/betting";

export function ActionControls() {
  const { state, dispatch } = useGame();
  const game = state.game;
  const [raiseAmount, setRaiseAmount] = useState("");

  const activePlayer = game?.players[game.activePlayerIndex];

  const limits = useMemo(() => {
    if (!game || !activePlayer) return null;
    const result = calculateBetLimits(game, activePlayer.id);
    return result.ok ? result.value : null;
  }, [game, activePlayer]);

  if (!game || !activePlayer) return null;

  const currentBet = Math.max(...game.players.map((p) => p.currentBetThisStreet));
  const canCheck = activePlayer.currentBetThisStreet === currentBet;

  function act(action: "fold" | "check" | "call") {
    dispatch({ type: "PLAYER_ACTION", payload: { playerId: activePlayer!.id, action } });
  }

  function betOrRaise() {
    const amount = Number(raiseAmount);
    dispatch({
      type: "PLAYER_ACTION",
      payload: { playerId: activePlayer!.id, action: "bet-raise", amount },
    });
    setRaiseAmount("");
  }

  return (
    <div className="mx-auto max-w-xl space-y-4 rounded-2xl border border-white/10 bg-slate-900 p-4 sm:p-5">
      {state.lastError && (
        <p
          role="alert"
          className="rounded-lg border border-red-500/30 bg-red-950/60 px-3 py-2 text-sm font-medium text-red-200"
        >
          {state.lastError}
        </p>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <button
          type="button"
          onClick={() => act("fold")}
          className="min-h-12 rounded-xl border border-red-900/50 bg-slate-800 px-4 py-3 font-semibold text-red-200 transition-colors duration-150 hover:bg-red-950/50 active:scale-95"
        >
          Fold
        </button>
        {canCheck ? (
          <button
            type="button"
            onClick={() => act("check")}
            className="min-h-12 rounded-xl border border-slate-600 bg-slate-800 px-4 py-3 font-semibold text-slate-100 transition-colors duration-150 hover:bg-slate-700 active:scale-95"
          >
            Check
          </button>
        ) : (
          <button
            type="button"
            onClick={() => act("call")}
            className="min-h-12 rounded-xl border border-slate-600 bg-slate-800 px-4 py-3 font-semibold text-slate-100 transition-colors duration-150 hover:bg-slate-700 active:scale-95"
          >
            Call
          </button>
        )}

        {limits?.canRaise && (
          <>
            <input
              className="min-h-12 w-full rounded-xl border border-slate-600 bg-slate-800 px-3 py-3 text-center font-semibold text-slate-100 [appearance:textfield] focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              type="number"
              inputMode="numeric"
              min={limits.min}
              max={limits.max}
              placeholder={`${limits.min}-${limits.max}`}
              value={raiseAmount}
              onChange={(e) => setRaiseAmount(e.target.value)}
              aria-label="Raise amount"
            />
            <button
              type="button"
              onClick={betOrRaise}
              className="min-h-12 rounded-xl bg-amber-600 px-4 py-3 font-bold text-slate-950 transition-colors duration-150 hover:bg-amber-500 active:scale-95"
            >
              Bet/Raise
            </button>
          </>
        )}
      </div>

      <button
        type="button"
        onClick={() => dispatch({ type: "NEXT_HAND" })}
        className="min-h-12 w-full rounded-xl border border-slate-600 bg-slate-800 px-4 py-3 font-semibold text-slate-200 transition-colors duration-150 hover:bg-slate-700 active:scale-95"
      >
        Next Hand
      </button>
    </div>
  );
}
