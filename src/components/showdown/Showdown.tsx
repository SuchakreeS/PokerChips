import { useGame } from "../../state/GameContext";

export function Showdown() {
  const { state, dispatch } = useGame();
  const game = state.game;
  if (!game) return null;
  if (game.playersToAct.length > 0) return null;
  if (game.mainPot === 0 && game.sidePots.length === 0) return null;

  function award(potIndex: number, winnerId: string) {
    dispatch({ type: "AWARD_POT", payload: { potIndex, winnerId } });
  }

  function nameFor(playerId: string): string {
    return game!.players.find((p) => p.id === playerId)?.name ?? playerId;
  }

  return (
    <div
      role="dialog"
      aria-labelledby="showdown-heading"
      className="mx-auto max-w-xl space-y-4 rounded-2xl border border-white/10 bg-slate-900 p-4 sm:p-5"
    >
      <h2 id="showdown-heading" className="text-lg font-semibold text-slate-100">
        Showdown
      </h2>

      {game.mainPot > 0 && (
        <div className="space-y-2 rounded-xl border border-white/10 bg-slate-800 p-3">
          <p className="text-sm text-slate-300">
            Who won the main pot?{" "}
            <span className="font-semibold text-amber-400">{game.mainPot}</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {game.mainPotEligiblePlayerIds.map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => award(-1, id)}
                className="min-h-12 rounded-xl bg-amber-600 px-4 py-3 font-bold text-slate-950 transition-colors duration-150 hover:bg-amber-500 active:scale-95"
              >
                {nameFor(id)}
              </button>
            ))}
          </div>
        </div>
      )}

      {game.sidePots.map((pot, i) => (
        <div key={i} className="space-y-2 rounded-xl border border-white/10 bg-slate-800 p-3">
          <p className="text-sm text-slate-300">
            Who won side pot {i + 1}?{" "}
            <span className="font-semibold text-amber-400">{pot.amount}</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {pot.eligiblePlayerIds.map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => award(i, id)}
                className="min-h-12 rounded-xl bg-amber-600 px-4 py-3 font-bold text-slate-950 transition-colors duration-150 hover:bg-amber-500 active:scale-95"
              >
                {nameFor(id)}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
