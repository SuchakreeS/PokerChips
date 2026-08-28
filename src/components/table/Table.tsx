import { useGame } from "../../state/GameContext";

function seatPosition(index: number, total: number): { left: string; top: string } {
  const angle = (2 * Math.PI * index) / total - Math.PI / 2;
  const radius = 42;
  const left = 50 + radius * Math.cos(angle);
  const top = 50 + radius * Math.sin(angle);
  return { left: `${left}%`, top: `${top}%` };
}

export function Table() {
  const { state } = useGame();
  const game = state.game;
  if (!game) return null;

  return (
    <div className="relative mx-auto aspect-square w-[min(100%,42rem,60vh)] rounded-full border-4 border-emerald-950 bg-gradient-to-b from-emerald-700 to-emerald-800 shadow-inner">
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-xl bg-black/20 px-6 py-4 text-center text-white">
        <div className="text-xs font-medium uppercase tracking-widest text-emerald-100/80">Pot</div>
        <div className="text-3xl font-bold tabular-nums text-amber-300">{game.mainPot}</div>
        {game.sidePots.map((pot, i) => (
          <div key={i} className="text-sm tabular-nums text-emerald-100/80">
            Side pot {i + 1}: {pot.amount}
          </div>
        ))}
        <div className="mt-2 text-xs font-medium uppercase tracking-widest text-emerald-100/60">
          {game.currentStreet}
        </div>
      </div>

      {game.players.map((player, i) => {
        const pos = seatPosition(i, game.players.length);
        const isActive = i === game.activePlayerIndex;
        const isButton = i === game.buttonPosition;
        return (
          <div
            key={player.id}
            className={`absolute w-32 -translate-x-1/2 -translate-y-1/2 rounded-lg border-2 px-3 py-2 text-center text-white shadow-md transition-colors ${
              isActive
                ? "border-amber-400 bg-emerald-950 ring-2 ring-amber-400 ring-offset-2 ring-offset-emerald-700"
                : "border-emerald-950/60 bg-emerald-900/90"
            }`}
            style={pos}
          >
            <div className="flex items-center justify-center gap-1 text-sm font-semibold">
              <span className="truncate">{player.name}</span>
              {isButton && (
                <span
                  title="Dealer button"
                  aria-label="Dealer button"
                  className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-white text-[10px] font-bold text-emerald-900"
                >
                  B
                </span>
              )}
            </div>
            <div className="text-xs tabular-nums text-emerald-100/90">{player.stack} chips</div>
            <div className="text-xs capitalize text-emerald-100/70">{player.status}</div>
            {player.currentBetThisStreet > 0 && (
              <div className="text-xs font-medium tabular-nums text-amber-300">
                bet {player.currentBetThisStreet}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
