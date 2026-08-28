import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useGame } from "../../state/GameContext";
import { BettingStructure } from "../../game-logic/types";

interface DraftPlayer {
  name: string;
  stack: string;
}

const BETTING_STRUCTURE_LABELS: Record<BettingStructure, string> = {
  "no-limit": "No-Limit",
  "pot-limit": "Pot-Limit",
  limit: "Limit",
};

export function GameSetup() {
  const { dispatch } = useGame();
  const [players, setPlayers] = useState<DraftPlayer[]>([
    { name: "", stack: "100" },
    { name: "", stack: "100" },
  ]);
  const [bettingStructure, setBettingStructure] = useState<BettingStructure>("no-limit");
  const [smallBlind, setSmallBlind] = useState("1");
  const [bigBlind, setBigBlind] = useState("2");
  const [smallBet, setSmallBet] = useState("2");
  const [bigBet, setBigBet] = useState("4");
  const [error, setError] = useState<string | null>(null);

  function addPlayer() {
    setPlayers((prev) => [...prev, { name: "", stack: "100" }]);
  }

  function removePlayer(index: number) {
    setPlayers((prev) => prev.filter((_, i) => i !== index));
  }

  function updatePlayer(index: number, field: keyof DraftPlayer, value: string) {
    setPlayers((prev) => prev.map((p, i) => (i === index ? { ...p, [field]: value } : p)));
  }

  function handleStart() {
    const parsedPlayers = players
      .filter((p) => p.name.trim().length > 0)
      .map((p) => ({ name: p.name.trim(), stack: Number(p.stack) }));

    if (parsedPlayers.length < 2) {
      setError("Add at least two players with names to start.");
      return;
    }
    if (parsedPlayers.some((p) => !Number.isFinite(p.stack) || p.stack <= 0)) {
      setError("Every player needs a starting stack greater than zero.");
      return;
    }

    setError(null);
    dispatch({
      type: "SETUP_GAME",
      payload: {
        players: parsedPlayers,
        bettingStructure,
        smallBlind: Number(smallBlind),
        bigBlind: Number(bigBlind),
        smallBet: bettingStructure === "limit" ? Number(smallBet) : undefined,
        bigBet: bettingStructure === "limit" ? Number(bigBet) : undefined,
      },
    });
  }

  return (
    <div className="min-h-dvh bg-slate-950 px-4 py-8 text-white">
      <div className="mx-auto max-w-xl space-y-8">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-white">New Game</h1>
          <p className="text-sm text-slate-400">Set up players and betting rules to deal the first hand.</p>
        </div>

        <section className="space-y-3 rounded-lg border border-white/10 bg-slate-900/60 p-4">
          <h2 className="text-base font-semibold text-white">Players</h2>
          <div className="space-y-2">
            {players.map((p, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="flex-1">
                  <label htmlFor={`player-name-${i}`} className="sr-only">
                    Player {i + 1} name
                  </label>
                  <input
                    id={`player-name-${i}`}
                    className="w-full rounded-md border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/40"
                    placeholder={`Player ${i + 1} name`}
                    value={p.name}
                    onChange={(e) => updatePlayer(i, "name", e.target.value)}
                  />
                </div>
                <div className="w-28">
                  <label htmlFor={`player-stack-${i}`} className="sr-only">
                    Player {i + 1} starting stack
                  </label>
                  <input
                    id={`player-stack-${i}`}
                    className="w-full rounded-md border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/40"
                    type="number"
                    placeholder="Stack"
                    value={p.stack}
                    onChange={(e) => updatePlayer(i, "stack", e.target.value)}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removePlayer(i)}
                  aria-label={`Remove player ${i + 1}`}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-red-400 transition-colors hover:bg-red-500/10 hover:text-red-300"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addPlayer}
            className="flex items-center gap-1.5 rounded-md border border-white/10 px-3 py-1.5 text-sm font-medium text-slate-200 transition-colors hover:border-green-500/50 hover:bg-green-500/10 hover:text-green-300"
          >
            <Plus size={16} /> Add player
          </button>
        </section>

        <section className="space-y-3 rounded-lg border border-white/10 bg-slate-900/60 p-4">
          <h2 className="text-base font-semibold text-white">Betting structure</h2>
          <div role="radiogroup" aria-label="Betting structure" className="flex flex-wrap gap-2">
            {(["no-limit", "pot-limit", "limit"] as const).map((s) => (
              <label
                key={s}
                className={`flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors ${
                  bettingStructure === s
                    ? "border-green-500 bg-green-500/10 text-green-300"
                    : "border-white/10 text-slate-300 hover:border-white/20"
                }`}
              >
                <input
                  type="radio"
                  name="bettingStructure"
                  checked={bettingStructure === s}
                  onChange={() => setBettingStructure(s)}
                  className="accent-green-500"
                />
                {BETTING_STRUCTURE_LABELS[s]}
              </label>
            ))}
          </div>
        </section>

        <section className="space-y-3 rounded-lg border border-white/10 bg-slate-900/60 p-4">
          <h2 className="text-base font-semibold text-white">Blinds</h2>
          <div className="flex gap-3">
            <div className="w-28">
              <label htmlFor="small-blind" className="mb-1 block text-xs font-medium text-slate-400">
                Small blind
              </label>
              <input
                id="small-blind"
                className="w-full rounded-md border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-white focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/40"
                type="number"
                value={smallBlind}
                onChange={(e) => setSmallBlind(e.target.value)}
              />
            </div>
            <div className="w-28">
              <label htmlFor="big-blind" className="mb-1 block text-xs font-medium text-slate-400">
                Big blind
              </label>
              <input
                id="big-blind"
                className="w-full rounded-md border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-white focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/40"
                type="number"
                value={bigBlind}
                onChange={(e) => setBigBlind(e.target.value)}
              />
            </div>
          </div>
          {bettingStructure === "limit" && (
            <div className="flex gap-3">
              <div className="w-28">
                <label htmlFor="small-bet" className="mb-1 block text-xs font-medium text-slate-400">
                  Small bet
                </label>
                <input
                  id="small-bet"
                  className="w-full rounded-md border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-white focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/40"
                  type="number"
                  value={smallBet}
                  onChange={(e) => setSmallBet(e.target.value)}
                />
              </div>
              <div className="w-28">
                <label htmlFor="big-bet" className="mb-1 block text-xs font-medium text-slate-400">
                  Big bet
                </label>
                <input
                  id="big-bet"
                  className="w-full rounded-md border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-white focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/40"
                  type="number"
                  value={bigBet}
                  onChange={(e) => setBigBet(e.target.value)}
                />
              </div>
            </div>
          )}
        </section>

        {error && (
          <p role="alert" className="text-sm font-medium text-red-400">
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={handleStart}
          className="w-full rounded-md bg-amber-600 px-4 py-3 text-base font-semibold text-white shadow-sm transition-colors hover:bg-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-400/60"
        >
          Start Game
        </button>
      </div>
    </div>
  );
}
