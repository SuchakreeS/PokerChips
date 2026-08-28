import { Game } from "../game-logic/types";

const STORAGE_KEY = "poker-chip-distributor:game";
const STORAGE_VERSION = 1;

interface StoredGame {
  version: number;
  game: Game;
}

export function saveGame(game: Game): void {
  try {
    const payload: StoredGame = { version: STORAGE_VERSION, game };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // localStorage unavailable (private browsing, quota) - fail silently
  }
}

export function loadGame(): Game | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredGame;
    if (parsed.version !== STORAGE_VERSION || !parsed.game) return null;
    return parsed.game;
  } catch {
    return null;
  }
}

export function clearSavedGame(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
