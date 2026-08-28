import { useState, useMemo, useEffect } from "react";
import { useGame } from "../../state/GameContext";
import { calculateBetLimits } from "../../game-logic/betting";
import { isHandResolved } from "../../game-logic/handLifecycle";

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

  // Pre-fill the raise input with the minimum legal raise at the start of each turn,
  // so the player only has to type something if they want a different amount.
  useEffect(() => {
    setRaiseAmount(limits?.canRaise ? String(limits.min) : "");
  }, [activePlayer?.id, limits]);

  if (!game) return null;

  const handIsLive = game.playersToAct.length > 0;
  const handFullyResolved = isHandResolved(game);

  const currentBet = activePlayer
    ? Math.max(...game.players.map((p) => p.currentBetThisStreet))
    : 0;
  const canCheck = !!activePlayer && activePlayer.currentBetThisStreet === currentBet;

  function act(action: "fold" | "check" | "call") {
    if (!activePlayer) return;
    dispatch({ type: "PLAYER_ACTION", payload: { playerId: activePlayer.id, action } });
  }

  function betOrRaise() {
    if (!activePlayer) return;
    const amount = Number(raiseAmount);
    dispatch({
      type: "PLAYER_ACTION",
      payload: { playerId: activePlayer.id, action: "bet-raise", amount },
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

      {handIsLive && activePlayer && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
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
          </div>

          {limits?.canRaise && (
            <div className="space-y-2">
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
                className="min-h-12 w-full rounded-xl bg-amber-600 px-4 py-3 font-bold text-slate-950 transition-colors duration-150 hover:bg-amber-500 active:scale-95"
              >
                Bet/Raise
              </button>
            </div>
          )}
        </div>
      )}

      <div className="flex items-center gap-3">
        <button
          type="button"
          disabled={!handFullyResolved}
          title={
            handFullyResolved
              ? undefined
              : "Finish this hand (betting and payouts) before starting the next one"
          }
          onClick={() => dispatch({ type: "NEXT_HAND" })}
          className="min-h-12 flex-1 rounded-xl border border-slate-600 bg-slate-800 px-4 py-3 font-semibold text-slate-200 transition-colors duration-150 hover:bg-slate-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-slate-800"
        >
          Next Hand
        </button>
        <button
          type="button"
          onClick={() => dispatch({ type: "RESET_GAME" })}
          className="min-h-12 rounded-xl border border-slate-700 bg-transparent px-3 py-3 text-sm font-medium text-slate-400 transition-colors duration-150 hover:bg-slate-800 hover:text-slate-200 active:scale-95"
        >
          New Game
        </button>
      </div>
    </div>
  );
}
