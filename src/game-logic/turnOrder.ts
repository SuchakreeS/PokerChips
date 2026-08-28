import { Player } from "./types";

export function advanceTurn(players: Player[], fromIndex: number): number | null {
  const n = players.length;
  for (let i = 1; i <= n; i++) {
    const idx = (fromIndex + i) % n;
    if (players[idx].status === "active") return idx;
  }
  return null;
}
