# Phase 1 Scaffold Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up the Phase 1 poker chip & turn tracker: project scaffold, a fully tested pure-TS game-logic module, reducer/context/persistence, and the two working screens (setup, table) with action controls and manual showdown.

**Architecture:** Vite + React + TypeScript SPA, no backend, no router (two screens swapped by a state flag in `App.tsx`). Game rules (betting limits, side pots, turn order, hand lifecycle) live in a pure-TS `src/game-logic/` module with no React imports, unit-tested with Vitest. A single `useReducer` + Context wraps that module for the UI and debounce-persists to `localStorage`.

**Tech Stack:** Vite, React 18, TypeScript, Tailwind CSS v4 (`@tailwindcss/vite`), lucide-react, Vitest.

**Spec:** `docs/superpowers/specs/2026-08-28-phase1-scaffold-design.md`

## Global Constraints

- No backend, no router — plain `useState` flag in `App.tsx` swaps setup/table screens.
- Framer Motion, Howler.js, and any realtime sync library are Phase 2 — do not install them.
- `game-logic/` files must have zero React imports and zero DOM dependency — they must be importable and testable under Vitest's `node` environment.
- Validation failures in game-logic return `{ ok: false, reason: string }` — never `throw`.
- Every reducer/game-logic mutation is immutable (return new objects/arrays; never mutate `game.players` or `game` in place).
- Per `CLAUDE.md`: before writing markup for any UI component, invoke the `/ui-ux-pro-max` skill for palette/typography/layout guidance.
- `localStorage` reads/writes must be wrapped in try/catch and fail silently (private browsing, quota, disabled storage).

---

## Task 1: Project scaffold

**Files:**
- Create: entire Vite `react-ts` scaffold at repo root (`package.json`, `vite.config.ts`, `tsconfig.json`, `src/main.tsx`, `src/App.tsx`, `index.html`, etc.)
- Modify: `vite.config.ts` (add Tailwind plugin + Vitest config)
- Create: `src/index.css`

**Interfaces:**
- Produces: a working `npm run dev`, `npm run build`, and `npm test` in this repo.

- [ ] **Step 1: Scaffold with Vite**

```bash
npm create vite@latest . -- --template react-ts --force
npm install
```

- [ ] **Step 2: Install Tailwind v4, lucide-react, Vitest**

```bash
npm install tailwindcss @tailwindcss/vite lucide-react
npm install -D vitest
```

- [ ] **Step 3: Wire Tailwind into Vite and CSS**

Replace `vite.config.ts` with:

```ts
/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    environment: "node",
  },
});
```

Replace the contents of `src/index.css` with:

```css
@import "tailwindcss";
```

Confirm `src/main.tsx` imports `./index.css` (the Vite template does this by default — leave as-is if already present).

- [ ] **Step 4: Add test script**

In `package.json`, add to `"scripts"`:

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 5: Verify dev server and build both work**

Run: `npm run build`
Expected: build completes with no errors, `dist/` is created.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: scaffold Vite + React + TS + Tailwind v4 + Vitest"
```

---

## Task 2: Core types

**Files:**
- Create: `src/game-logic/types.ts`

**Interfaces:**
- Produces: `BettingStructure`, `Street`, `PlayerStatus`, `Player`, `SidePot`, `Game`, `Result<T>` — used by every subsequent game-logic and state file.

- [ ] **Step 1: Write the types module**

```ts
export type BettingStructure = "no-limit" | "pot-limit" | "limit";
export type Street = "preflop" | "flop" | "turn" | "river";
export type PlayerStatus = "active" | "folded" | "all-in" | "sitting-out";

export interface Player {
  id: string;
  name: string;
  stack: number;
  currentBetThisStreet: number;
  totalBetThisHand: number;
  status: PlayerStatus;
}

export interface SidePot {
  amount: number;
  eligiblePlayerIds: string[];
}

export interface Game {
  id: string;
  bettingStructure: BettingStructure;
  smallBlind: number;
  bigBlind: number;
  smallBet: number;
  bigBet: number;
  buttonPosition: number;
  currentStreet: Street;
  mainPot: number;
  mainPotEligiblePlayerIds: string[];
  sidePots: SidePot[];
  players: Player[];
  activePlayerIndex: number;
  lastRaiseSize: number;
  betsThisStreetCount: number;
  playersToAct: string[];
}

export type Result<T> =
  | { ok: true; value: T }
  | { ok: false; reason: string };
```

No test for this file — it is pure type declarations with no runtime behavior to verify. Its correctness is checked indirectly by every module that imports it compiling successfully.

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/game-logic/types.ts
git commit -m "feat: add core game-logic types"
```

---

## Task 3: Turn order

**Files:**
- Create: `src/game-logic/turnOrder.ts`
- Test: `src/game-logic/__tests__/turnOrder.test.ts`

**Interfaces:**
- Consumes: `Player`, `PlayerStatus` from `./types`
- Produces: `advanceTurn(players: Player[], fromIndex: number): number | null` — the index of the next `"active"` player after `fromIndex`, wrapping around; `null` if no active player exists.

- [ ] **Step 1: Write the failing tests**

```ts
import { describe, it, expect } from "vitest";
import { advanceTurn } from "../turnOrder";
import { Player } from "../types";

function player(id: string, status: Player["status"] = "active"): Player {
  return { id, name: id, stack: 100, currentBetThisStreet: 0, totalBetThisHand: 0, status };
}

describe("advanceTurn", () => {
  it("moves to the next active player", () => {
    const players = [player("a"), player("b"), player("c")];
    expect(advanceTurn(players, 0)).toBe(1);
  });

  it("skips folded and all-in players", () => {
    const players = [player("a"), player("b", "folded"), player("c", "all-in"), player("d")];
    expect(advanceTurn(players, 0)).toBe(3);
  });

  it("wraps around to the start", () => {
    const players = [player("a"), player("b"), player("c")];
    expect(advanceTurn(players, 2)).toBe(0);
  });

  it("returns null when no active player remains", () => {
    const players = [player("a", "folded"), player("b", "folded")];
    expect(advanceTurn(players, 0)).toBeNull();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/game-logic/__tests__/turnOrder.test.ts`
Expected: FAIL — `../turnOrder` has no exported member `advanceTurn` (module doesn't exist yet).

- [ ] **Step 3: Write the implementation**

```ts
import { Player } from "./types";

export function advanceTurn(players: Player[], fromIndex: number): number | null {
  const n = players.length;
  for (let i = 1; i <= n; i++) {
    const idx = (fromIndex + i) % n;
    if (players[idx].status === "active") return idx;
  }
  return null;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/game-logic/__tests__/turnOrder.test.ts`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add src/game-logic/turnOrder.ts src/game-logic/__tests__/turnOrder.test.ts
git commit -m "feat: add advanceTurn turn-order logic"
```

---

## Task 4: Side-pot calculation

**Files:**
- Create: `src/game-logic/sidePots.ts`
- Test: `src/game-logic/__tests__/sidePots.test.ts`

**Interfaces:**
- Consumes: `Player`, `SidePot` from `./types`
- Produces: `calculateSidePots(players: Player[]): { mainPot: { amount: number; eligiblePlayerIds: string[] }; sidePots: SidePot[] }`

- [ ] **Step 1: Write the failing tests**

```ts
import { describe, it, expect } from "vitest";
import { calculateSidePots } from "../sidePots";
import { Player } from "../types";

function player(
  id: string,
  totalBetThisHand: number,
  status: Player["status"] = "active"
): Player {
  return { id, name: id, stack: 0, currentBetThisStreet: 0, totalBetThisHand, status };
}

describe("calculateSidePots", () => {
  it("returns everything in the main pot when nobody is all-in", () => {
    const players = [player("a", 50), player("b", 50), player("c", 50)];
    const result = calculateSidePots(players);
    expect(result.mainPot).toEqual({ amount: 150, eligiblePlayerIds: ["a", "b", "c"] });
    expect(result.sidePots).toEqual([]);
  });

  it("splits into a side pot when one player is all-in for less", () => {
    // a all-in for 30, b and c cover to 100
    const players = [
      player("a", 30, "all-in"),
      player("b", 100),
      player("c", 100),
    ];
    const result = calculateSidePots(players);
    expect(result.mainPot).toEqual({ amount: 90, eligiblePlayerIds: ["a", "b", "c"] });
    expect(result.sidePots).toEqual([{ amount: 140, eligiblePlayerIds: ["b", "c"] }]);
  });

  it("excludes folded players from eligibility but keeps their chips in the pot", () => {
    const players = [player("a", 50, "folded"), player("b", 50), player("c", 50)];
    const result = calculateSidePots(players);
    expect(result.mainPot.amount).toBe(150);
    expect(result.mainPot.eligiblePlayerIds).toEqual(["b", "c"]);
  });

  it("handles two simultaneous all-in levels", () => {
    const players = [
      player("a", 20, "all-in"),
      player("b", 60, "all-in"),
      player("c", 100),
    ];
    const result = calculateSidePots(players);
    expect(result.mainPot).toEqual({ amount: 60, eligiblePlayerIds: ["a", "b", "c"] });
    expect(result.sidePots).toEqual([
      { amount: 80, eligiblePlayerIds: ["b", "c"] },
      { amount: 40, eligiblePlayerIds: ["c"] },
    ]);
  });

  it("returns an empty breakdown when nobody has contributed", () => {
    const result = calculateSidePots([]);
    expect(result).toEqual({ mainPot: { amount: 0, eligiblePlayerIds: [] }, sidePots: [] });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/game-logic/__tests__/sidePots.test.ts`
Expected: FAIL — module doesn't exist.

- [ ] **Step 3: Write the implementation**

```ts
import { Player, SidePot } from "./types";

export interface PotBreakdown {
  mainPot: { amount: number; eligiblePlayerIds: string[] };
  sidePots: SidePot[];
}

export function calculateSidePots(players: Player[]): PotBreakdown {
  const contributors = players.filter((p) => p.totalBetThisHand > 0);
  if (contributors.length === 0) {
    return { mainPot: { amount: 0, eligiblePlayerIds: [] }, sidePots: [] };
  }

  const allInLevels = Array.from(
    new Set(contributors.filter((p) => p.status === "all-in").map((p) => p.totalBetThisHand))
  ).sort((a, b) => a - b);
  const levels = [...allInLevels, Infinity];

  const layers: { amount: number; eligiblePlayerIds: string[] }[] = [];
  let previousLevel = 0;

  for (const level of levels) {
    const amount = contributors.reduce((sum, p) => {
      const contribution = Math.min(p.totalBetThisHand, level) - previousLevel;
      return sum + Math.max(contribution, 0);
    }, 0);
    const eligiblePlayerIds = contributors
      .filter((p) => p.status !== "folded" && p.totalBetThisHand > previousLevel)
      .map((p) => p.id);

    if (amount > 0 && eligiblePlayerIds.length > 0) {
      layers.push({ amount, eligiblePlayerIds });
    } else if (amount > 0 && layers.length > 0) {
      layers[layers.length - 1].amount += amount;
    }
    previousLevel = level;
  }

  if (layers.length === 0) {
    return { mainPot: { amount: 0, eligiblePlayerIds: [] }, sidePots: [] };
  }
  const [mainPot, ...sidePots] = layers;
  return { mainPot, sidePots };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/game-logic/__tests__/sidePots.test.ts`
Expected: PASS (5 tests)

- [ ] **Step 5: Commit**

```bash
git add src/game-logic/sidePots.ts src/game-logic/__tests__/sidePots.test.ts
git commit -m "feat: add calculateSidePots"
```

---

## Task 5: Bet limits (No-Limit / Pot-Limit / Limit)

**Files:**
- Create: `src/game-logic/betting.ts`
- Test: `src/game-logic/__tests__/betting.test.ts`

**Interfaces:**
- Consumes: `Game`, `Result` from `./types`
- Produces: `BetLimits { min: number; max: number; canRaise: boolean }`, `calculateBetLimits(game: Game, playerId: string): Result<BetLimits>`

- [ ] **Step 1: Write the failing tests**

```ts
import { describe, it, expect } from "vitest";
import { calculateBetLimits } from "../betting";
import { Game, Player } from "../types";

function player(id: string, overrides: Partial<Player> = {}): Player {
  return {
    id,
    name: id,
    stack: 100,
    currentBetThisStreet: 0,
    totalBetThisHand: 0,
    status: "active",
    ...overrides,
  };
}

function game(overrides: Partial<Game> = {}): Game {
  return {
    id: "g1",
    bettingStructure: "no-limit",
    smallBlind: 1,
    bigBlind: 2,
    smallBet: 2,
    bigBet: 4,
    buttonPosition: 0,
    currentStreet: "preflop",
    mainPot: 3,
    mainPotEligiblePlayerIds: [],
    sidePots: [],
    players: [player("a"), player("b", { currentBetThisStreet: 2, totalBetThisHand: 2 })],
    activePlayerIndex: 0,
    lastRaiseSize: 2,
    betsThisStreetCount: 1,
    playersToAct: ["a"],
    ...overrides,
  };
}

describe("calculateBetLimits", () => {
  it("no-limit: min raise-to is currentBet + lastRaiseSize, max is player's full stack", () => {
    const result = calculateBetLimits(game(), "a");
    expect(result).toEqual({ ok: true, value: { min: 4, max: 100, canRaise: true } });
  });

  it("pot-limit: max raise-to is currentBet + (pot + callAmount)", () => {
    const result = calculateBetLimits(game({ bettingStructure: "pot-limit" }), "a");
    // currentBet=2, callAmount=2, potAfterCall = 3 + 2 = 5, max = 2 + 5 = 7
    expect(result).toEqual({ ok: true, value: { min: 4, max: 7, canRaise: true } });
  });

  it("limit: fixed bet size, capped by street", () => {
    const result = calculateBetLimits(game({ bettingStructure: "limit" }), "a");
    // preflop uses smallBet=2, currentBet=2, fixedTo = 2 + 2 = 4
    expect(result).toEqual({ ok: true, value: { min: 4, max: 4, canRaise: true } });
  });

  it("limit: no raise once the street's bet cap is reached", () => {
    const result = calculateBetLimits(
      game({ bettingStructure: "limit", betsThisStreetCount: 4 }),
      "a"
    );
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.canRaise).toBe(false);
  });

  it("caps max at the player's remaining stack when it is less than a full raise", () => {
    const g = game({
      players: [player("a", { stack: 3 }), player("b", { currentBetThisStreet: 2, totalBetThisHand: 2 })],
    });
    const result = calculateBetLimits(g, "a");
    expect(result).toEqual({ ok: true, value: { min: 3, max: 3, canRaise: true } });
  });

  it("rejects an unknown player", () => {
    const result = calculateBetLimits(game(), "ghost");
    expect(result.ok).toBe(false);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/game-logic/__tests__/betting.test.ts`
Expected: FAIL — module doesn't exist.

- [ ] **Step 3: Write the implementation**

```ts
import { Game, Result } from "./types";

export interface BetLimits {
  min: number;
  max: number;
  canRaise: boolean;
}

export function calculateBetLimits(game: Game, playerId: string): Result<BetLimits> {
  const player = game.players.find((p) => p.id === playerId);
  if (!player) return { ok: false, reason: "Player not found" };
  if (player.status !== "active") return { ok: false, reason: "Player cannot act" };

  const currentBet = Math.max(...game.players.map((p) => p.currentBetThisStreet));
  const callAmount = Math.min(currentBet - player.currentBetThisStreet, player.stack);
  const maxTotalBet = player.currentBetThisStreet + player.stack;

  if (maxTotalBet <= currentBet) {
    return { ok: true, value: { min: maxTotalBet, max: maxTotalBet, canRaise: false } };
  }

  if (game.bettingStructure === "no-limit") {
    const minRaiseTo = Math.min(currentBet + game.lastRaiseSize, maxTotalBet);
    return { ok: true, value: { min: minRaiseTo, max: maxTotalBet, canRaise: true } };
  }

  if (game.bettingStructure === "pot-limit") {
    const potAfterCall = game.mainPot + callAmount;
    const maxRaiseTo = Math.min(currentBet + potAfterCall, maxTotalBet);
    const minRaiseTo = Math.min(currentBet + game.lastRaiseSize, maxRaiseTo);
    return { ok: true, value: { min: minRaiseTo, max: maxRaiseTo, canRaise: maxRaiseTo > currentBet } };
  }

  // limit
  if (game.betsThisStreetCount >= 4) {
    return { ok: true, value: { min: maxTotalBet, max: maxTotalBet, canRaise: false } };
  }
  const increment =
    game.currentStreet === "preflop" || game.currentStreet === "flop" ? game.smallBet : game.bigBet;
  const fixedTo = Math.min(currentBet + increment, maxTotalBet);
  return { ok: true, value: { min: fixedTo, max: fixedTo, canRaise: fixedTo > currentBet } };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/game-logic/__tests__/betting.test.ts`
Expected: PASS (6 tests)

- [ ] **Step 5: Commit**

```bash
git add src/game-logic/betting.ts src/game-logic/__tests__/betting.test.ts
git commit -m "feat: add calculateBetLimits for NL/PL/Limit"
```

---

## Task 6: Hand lifecycle (`nextHand`)

**Files:**
- Create: `src/game-logic/handLifecycle.ts`
- Test: `src/game-logic/__tests__/handLifecycle.test.ts`

**Interfaces:**
- Consumes: `Game`, `Player`, `Result` from `./types`; `advanceTurn` from `./turnOrder`
- Produces: `nextHand(game: Game): Result<Game>`

- [ ] **Step 1: Write the failing tests**

```ts
import { describe, it, expect } from "vitest";
import { nextHand } from "../handLifecycle";
import { Game, Player } from "../types";

function player(id: string, overrides: Partial<Player> = {}): Player {
  return {
    id,
    name: id,
    stack: 100,
    currentBetThisStreet: 0,
    totalBetThisHand: 0,
    status: "active",
    ...overrides,
  };
}

function game(overrides: Partial<Game> = {}): Game {
  return {
    id: "g1",
    bettingStructure: "no-limit",
    smallBlind: 1,
    bigBlind: 2,
    smallBet: 2,
    bigBet: 4,
    buttonPosition: 2,
    currentStreet: "river",
    mainPot: 0,
    mainPotEligiblePlayerIds: [],
    sidePots: [],
    players: [player("a"), player("b"), player("c")],
    activePlayerIndex: 0,
    lastRaiseSize: 2,
    betsThisStreetCount: 0,
    playersToAct: [],
    ...overrides,
  };
}

describe("nextHand", () => {
  it("moves the button, posts blinds, and sets first-to-act (3-handed)", () => {
    const result = nextHand(game());
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.buttonPosition).toBe(0); // next active after seat 2
    expect(result.value.players[1].currentBetThisStreet).toBe(1); // sb = seat after button
    expect(result.value.players[2].currentBetThisStreet).toBe(2); // bb
    expect(result.value.mainPot).toBe(3);
    expect(result.value.activePlayerIndex).toBe(0); // first to act after bb, wraps to button seat
    expect(result.value.currentStreet).toBe("preflop");
  });

  it("heads-up: button posts the small blind", () => {
    const g = game({ players: [player("a"), player("b")], buttonPosition: 1 });
    const result = nextHand(g);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.buttonPosition).toBe(0);
    expect(result.value.players[0].currentBetThisStreet).toBe(1); // button/SB
    expect(result.value.players[1].currentBetThisStreet).toBe(2); // BB
  });

  it("moves busted players (stack 0) to sitting-out and skips them for the button", () => {
    const g = game({ players: [player("a", { stack: 0 }), player("b"), player("c")] });
    const result = nextHand(g);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.players[0].status).toBe("sitting-out");
    expect(result.value.buttonPosition).not.toBe(0);
  });

  it("posts a short blind and marks the player all-in if their stack can't cover it", () => {
    const g = game({ players: [player("a"), player("b", { stack: 0.5 }), player("c")] });
    const result = nextHand(g);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const sb = result.value.players.find((p) => p.currentBetThisStreet > 0 && p.currentBetThisStreet < 1);
    expect(sb?.status).toBe("all-in");
  });

  it("refuses to start a hand with fewer than two players with chips", () => {
    const g = game({ players: [player("a"), player("b", { stack: 0 }), player("c", { stack: 0 })] });
    const result = nextHand(g);
    expect(result.ok).toBe(false);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/game-logic/__tests__/handLifecycle.test.ts`
Expected: FAIL — module doesn't exist.

- [ ] **Step 3: Write the implementation**

```ts
import { Game, Player, Result } from "./types";
import { advanceTurn } from "./turnOrder";

export function nextHand(game: Game): Result<Game> {
  const players: Player[] = game.players.map((p) => ({
    ...p,
    currentBetThisStreet: 0,
    totalBetThisHand: 0,
    status: p.stack === 0 ? "sitting-out" : p.status === "sitting-out" ? "sitting-out" : "active",
  }));

  const activeCount = players.filter((p) => p.status === "active").length;
  if (activeCount < 2) {
    return { ok: false, reason: "Need at least two players with chips to start a hand" };
  }

  const buttonPosition = advanceTurn(players, game.buttonPosition);
  if (buttonPosition === null) return { ok: false, reason: "No active player found for button" };

  let sbIndex: number | null;
  let bbIndex: number | null;
  if (activeCount === 2) {
    sbIndex = buttonPosition;
    bbIndex = advanceTurn(players, buttonPosition);
  } else {
    sbIndex = advanceTurn(players, buttonPosition);
    bbIndex = sbIndex !== null ? advanceTurn(players, sbIndex) : null;
  }
  if (sbIndex === null || bbIndex === null) {
    return { ok: false, reason: "Unable to determine blinds" };
  }

  const postBlind = (idx: number, amount: number): number => {
    const p = players[idx];
    const actual = Math.min(amount, p.stack);
    players[idx] = {
      ...p,
      stack: p.stack - actual,
      currentBetThisStreet: actual,
      totalBetThisHand: actual,
      status: p.stack - actual === 0 ? "all-in" : "active",
    };
    return actual;
  };

  const sbPosted = postBlind(sbIndex, game.smallBlind);
  const bbPosted = postBlind(bbIndex, game.bigBlind);

  const activePlayerIndex = advanceTurn(players, bbIndex);
  if (activePlayerIndex === null) {
    return { ok: false, reason: "Unable to determine first player to act" };
  }

  return {
    ok: true,
    value: {
      ...game,
      players,
      buttonPosition,
      currentStreet: "preflop",
      mainPot: sbPosted + bbPosted,
      mainPotEligiblePlayerIds: players.filter((p) => p.status !== "sitting-out").map((p) => p.id),
      sidePots: [],
      activePlayerIndex,
      lastRaiseSize: game.bigBlind,
      betsThisStreetCount: 1,
      playersToAct: players.filter((p) => p.status === "active").map((p) => p.id),
    },
  };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/game-logic/__tests__/handLifecycle.test.ts`
Expected: PASS (5 tests)

- [ ] **Step 5: Commit**

```bash
git add src/game-logic/handLifecycle.ts src/game-logic/__tests__/handLifecycle.test.ts
git commit -m "feat: add nextHand hand-lifecycle logic"
```

---

## Task 7: Player actions & pot awarding

**Files:**
- Create: `src/game-logic/playerAction.ts`
- Test: `src/game-logic/__tests__/playerAction.test.ts`

**Interfaces:**
- Consumes: `Game`, `Player`, `Result` from `./types`; `calculateBetLimits` from `./betting`; `calculateSidePots` from `./sidePots`; `advanceTurn` from `./turnOrder`
- Produces: `applyPlayerAction(game: Game, playerId: string, action: "fold"|"check"|"call"|"bet-raise", amount?: number): Result<Game>`, `awardPot(game: Game, potIndex: number, winnerId: string): Result<Game>` (`potIndex === -1` means the main pot; `0..n` indexes `game.sidePots`)

- [ ] **Step 1: Write the failing tests**

```ts
import { describe, it, expect } from "vitest";
import { applyPlayerAction, awardPot } from "../playerAction";
import { Game, Player } from "../types";

function player(id: string, overrides: Partial<Player> = {}): Player {
  return {
    id,
    name: id,
    stack: 100,
    currentBetThisStreet: 0,
    totalBetThisHand: 0,
    status: "active",
    ...overrides,
  };
}

function game(overrides: Partial<Game> = {}): Game {
  return {
    id: "g1",
    bettingStructure: "no-limit",
    smallBlind: 1,
    bigBlind: 2,
    smallBet: 2,
    bigBet: 4,
    buttonPosition: 2,
    currentStreet: "preflop",
    mainPot: 3,
    mainPotEligiblePlayerIds: ["a", "b", "c"],
    sidePots: [],
    players: [
      player("a"),
      player("b", { currentBetThisStreet: 1, totalBetThisHand: 1 }),
      player("c", { currentBetThisStreet: 2, totalBetThisHand: 2 }),
    ],
    activePlayerIndex: 0,
    lastRaiseSize: 2,
    betsThisStreetCount: 1,
    playersToAct: ["a", "b"],
    ...overrides,
  };
}

describe("applyPlayerAction", () => {
  it("rejects an action out of turn", () => {
    const result = applyPlayerAction(game(), "b", "fold");
    expect(result.ok).toBe(false);
  });

  it("call: moves chips to the pot and advances the turn", () => {
    const result = applyPlayerAction(game(), "a", "call");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.players[0].stack).toBe(98);
    expect(result.value.mainPot).toBe(5);
    expect(result.value.activePlayerIndex).toBe(1);
    expect(result.value.playersToAct).toEqual(["b"]);
  });

  it("fold: marks the player folded and advances the turn", () => {
    const result = applyPlayerAction(game(), "a", "fold");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.players[0].status).toBe("folded");
    expect(result.value.activePlayerIndex).toBe(1);
  });

  it("bet-raise: rejects an amount below the minimum", () => {
    const result = applyPlayerAction(game(), "a", "bet-raise", 3);
    expect(result.ok).toBe(false);
  });

  it("bet-raise: reopens action for other active players", () => {
    const result = applyPlayerAction(game(), "a", "bet-raise", 6);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.players[0].currentBetThisStreet).toBe(6);
    expect(result.value.playersToAct.sort()).toEqual(["b", "c"]);
  });

  it("closes the betting round and advances the street once playersToAct is empty", () => {
    const g = game({ activePlayerIndex: 1, playersToAct: ["b"] });
    const result = applyPlayerAction(g, "b", "call");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.currentStreet).toBe("flop");
    expect(result.value.players.every((p) => p.currentBetThisStreet === 0)).toBe(true);
    expect(result.value.playersToAct.sort()).toEqual(["a", "b", "c"]);
  });

  it("finalizes pots when only one contesting player remains after a fold", () => {
    const g = game({
      players: [
        player("a", { status: "folded", totalBetThisHand: 5 }),
        player("b", { currentBetThisStreet: 5, totalBetThisHand: 5 }),
      ],
      activePlayerIndex: 1,
      playersToAct: ["b"],
    });
    const result = applyPlayerAction(g, "b", "check");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.mainPot).toBe(10);
    expect(result.value.playersToAct).toEqual([]);
  });
});

describe("awardPot", () => {
  it("pays the main pot to the winner and zeroes it out", () => {
    const g = game({ mainPot: 50, mainPotEligiblePlayerIds: ["a", "b"] });
    const result = awardPot(g, -1, "a");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.players[0].stack).toBe(150);
    expect(result.value.mainPot).toBe(0);
  });

  it("rejects a winner who isn't eligible for that pot", () => {
    const g = game({ sidePots: [{ amount: 20, eligiblePlayerIds: ["b"] }] });
    const result = awardPot(g, 0, "a");
    expect(result.ok).toBe(false);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/game-logic/__tests__/playerAction.test.ts`
Expected: FAIL — module doesn't exist.

- [ ] **Step 3: Write the implementation**

```ts
import { Game, Player, Result } from "./types";
import { calculateBetLimits } from "./betting";
import { calculateSidePots } from "./sidePots";
import { advanceTurn } from "./turnOrder";

const STREET_ORDER = ["preflop", "flop", "turn", "river"] as const;

function nextStreet(street: Game["currentStreet"]): Game["currentStreet"] | null {
  const idx = STREET_ORDER.indexOf(street);
  return idx < STREET_ORDER.length - 1 ? STREET_ORDER[idx + 1] : null;
}

export function applyPlayerAction(
  game: Game,
  playerId: string,
  action: "fold" | "check" | "call" | "bet-raise",
  amount?: number
): Result<Game> {
  const playerIndex = game.players.findIndex((p) => p.id === playerId);
  if (playerIndex === -1) return { ok: false, reason: "Player not found" };
  if (game.activePlayerIndex !== playerIndex) {
    return { ok: false, reason: "Not this player's turn" };
  }
  const player = game.players[playerIndex];
  if (player.status !== "active") return { ok: false, reason: "Player cannot act" };

  const currentBet = Math.max(...game.players.map((p) => p.currentBetThisStreet));
  const players = [...game.players];
  let mainPot = game.mainPot;
  let lastRaiseSize = game.lastRaiseSize;
  let betsThisStreetCount = game.betsThisStreetCount;
  let playersToAct = game.playersToAct.filter((id) => id !== playerId);

  if (action === "fold") {
    players[playerIndex] = { ...player, status: "folded" };
  } else if (action === "check") {
    if (player.currentBetThisStreet !== currentBet) {
      return { ok: false, reason: "Cannot check, there is a bet to call" };
    }
  } else if (action === "call") {
    const callAmount = Math.min(currentBet - player.currentBetThisStreet, player.stack);
    players[playerIndex] = {
      ...player,
      stack: player.stack - callAmount,
      currentBetThisStreet: player.currentBetThisStreet + callAmount,
      totalBetThisHand: player.totalBetThisHand + callAmount,
      status: player.stack - callAmount === 0 ? "all-in" : "active",
    };
    mainPot += callAmount;
  } else {
    if (amount === undefined) return { ok: false, reason: "Bet/raise requires an amount" };
    const limitsResult = calculateBetLimits(game, playerId);
    if (!limitsResult.ok) return limitsResult;
    const { min, max, canRaise } = limitsResult.value;
    if (!canRaise) return { ok: false, reason: "No raise is possible" };
    if (amount < min || amount > max) {
      return { ok: false, reason: `Bet must be between ${min} and ${max}` };
    }
    const putIn = amount - player.currentBetThisStreet;
    players[playerIndex] = {
      ...player,
      stack: player.stack - putIn,
      currentBetThisStreet: amount,
      totalBetThisHand: player.totalBetThisHand + putIn,
      status: player.stack - putIn === 0 ? "all-in" : "active",
    };
    mainPot += putIn;
    lastRaiseSize = amount - currentBet;
    betsThisStreetCount += 1;
    playersToAct = players
      .filter((p) => p.status === "active" && p.id !== playerId)
      .map((p) => p.id);
  }

  const afterAction: Game = { ...game, players, mainPot, lastRaiseSize, betsThisStreetCount, playersToAct };

  const stillContesting = players.filter((p) => p.status === "active" || p.status === "all-in");
  if (stillContesting.length <= 1) {
    return { ok: true, value: finalizePots(afterAction, players) };
  }

  if (playersToAct.length === 0) {
    return { ok: true, value: advanceStreet(afterAction) };
  }

  const nextIndex = advanceTurn(players, playerIndex);
  if (nextIndex === null) {
    return { ok: true, value: finalizePots(afterAction, players) };
  }
  return { ok: true, value: { ...afterAction, activePlayerIndex: nextIndex } };
}

function finalizePots(game: Game, players: Player[]): Game {
  const { mainPot, sidePots } = calculateSidePots(players);
  return {
    ...game,
    mainPot: mainPot.amount,
    mainPotEligiblePlayerIds: mainPot.eligiblePlayerIds,
    sidePots,
    playersToAct: [],
  };
}

function advanceStreet(game: Game): Game {
  const players = game.players.map((p) => ({ ...p, currentBetThisStreet: 0 }));
  const { mainPot, sidePots } = calculateSidePots(players);
  const street = nextStreet(game.currentStreet);
  const activeCount = players.filter((p) => p.status === "active").length;

  if (street === null || activeCount <= 1) {
    return {
      ...game,
      players,
      mainPot: mainPot.amount,
      mainPotEligiblePlayerIds: mainPot.eligiblePlayerIds,
      sidePots,
      playersToAct: [],
    };
  }

  const activePlayerIndex = advanceTurn(players, game.buttonPosition) ?? game.activePlayerIndex;
  return {
    ...game,
    players,
    currentStreet: street,
    mainPot: mainPot.amount,
    mainPotEligiblePlayerIds: mainPot.eligiblePlayerIds,
    sidePots,
    lastRaiseSize: game.bigBlind,
    betsThisStreetCount: 0,
    playersToAct: players.filter((p) => p.status === "active").map((p) => p.id),
    activePlayerIndex,
  };
}

export function awardPot(game: Game, potIndex: number, winnerId: string): Result<Game> {
  const isMain = potIndex === -1;
  const pot = isMain
    ? { amount: game.mainPot, eligiblePlayerIds: game.mainPotEligiblePlayerIds }
    : game.sidePots[potIndex];
  if (!pot) return { ok: false, reason: "Pot not found" };
  if (!pot.eligiblePlayerIds.includes(winnerId)) {
    return { ok: false, reason: "Player is not eligible to win this pot" };
  }
  const players = game.players.map((p) =>
    p.id === winnerId ? { ...p, stack: p.stack + pot.amount } : p
  );
  return {
    ok: true,
    value: {
      ...game,
      players,
      mainPot: isMain ? 0 : game.mainPot,
      mainPotEligiblePlayerIds: isMain ? [] : game.mainPotEligiblePlayerIds,
      sidePots: isMain ? game.sidePots : game.sidePots.filter((_, i) => i !== potIndex),
    },
  };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/game-logic/__tests__/playerAction.test.ts`
Expected: PASS (9 tests)

- [ ] **Step 5: Run the full game-logic suite**

Run: `npx vitest run src/game-logic`
Expected: all tests across Tasks 3-7 pass.

- [ ] **Step 6: Commit**

```bash
git add src/game-logic/playerAction.ts src/game-logic/__tests__/playerAction.test.ts
git commit -m "feat: add applyPlayerAction and awardPot"
```

---

## Task 8: Game reducer

**Files:**
- Create: `src/state/gameReducer.ts`
- Test: `src/state/__tests__/gameReducer.test.ts`

**Interfaces:**
- Consumes: `Game`, `Player`, `BettingStructure` from `../game-logic/types`; `nextHand` from `../game-logic/handLifecycle`; `applyPlayerAction`, `awardPot` from `../game-logic/playerAction`
- Produces: `GameAction` (union), `GameReducerState { game: Game | null; lastError: string | null }`, `gameReducer(state, action): GameReducerState`

- [ ] **Step 1: Write the failing tests**

```ts
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
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/state/__tests__/gameReducer.test.ts`
Expected: FAIL — module doesn't exist.

- [ ] **Step 3: Write the implementation**

```ts
import { BettingStructure, Game, Player } from "../game-logic/types";
import { nextHand } from "../game-logic/handLifecycle";
import { applyPlayerAction, awardPot } from "../game-logic/playerAction";

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
  | { type: "AWARD_POT"; payload: { potIndex: number; winnerId: string } };

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
    default:
      return state;
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/state/__tests__/gameReducer.test.ts`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add src/state/gameReducer.ts src/state/__tests__/gameReducer.test.ts
git commit -m "feat: add gameReducer"
```

---

## Task 9: Persistence

**Files:**
- Create: `src/state/persistence.ts`
- Test: `src/state/__tests__/persistence.test.ts`

**Interfaces:**
- Consumes: `Game` from `../game-logic/types`
- Produces: `saveGame(game: Game): void`, `loadGame(): Game | null`, `clearSavedGame(): void`

- [ ] **Step 1: Write the failing tests**

```ts
import { describe, it, expect, beforeEach } from "vitest";
import { saveGame, loadGame, clearSavedGame } from "../persistence";
import { Game } from "../../game-logic/types";

function fakeGame(): Game {
  return {
    id: "g1",
    bettingStructure: "no-limit",
    smallBlind: 1,
    bigBlind: 2,
    smallBet: 2,
    bigBet: 4,
    buttonPosition: 0,
    currentStreet: "preflop",
    mainPot: 3,
    mainPotEligiblePlayerIds: [],
    sidePots: [],
    players: [],
    activePlayerIndex: 0,
    lastRaiseSize: 2,
    betsThisStreetCount: 1,
    playersToAct: [],
  };
}

beforeEach(() => {
  clearSavedGame();
});

describe("persistence", () => {
  it("round-trips a saved game", () => {
    saveGame(fakeGame());
    expect(loadGame()).toEqual(fakeGame());
  });

  it("returns null when nothing is saved", () => {
    expect(loadGame()).toBeNull();
  });

  it("returns null for corrupted stored JSON", () => {
    window.localStorage.setItem("poker-chip-distributor:game", "not json");
    expect(loadGame()).toBeNull();
  });

  it("returns null for a mismatched version", () => {
    window.localStorage.setItem(
      "poker-chip-distributor:game",
      JSON.stringify({ version: 999, game: fakeGame() })
    );
    expect(loadGame()).toBeNull();
  });

  it("clearSavedGame removes the stored game", () => {
    saveGame(fakeGame());
    clearSavedGame();
    expect(loadGame()).toBeNull();
  });
});
```

- [ ] **Step 2: Add a `localStorage` shim for the Vitest `node` environment**

Because Task 1 set Vitest's `environment` to `"node"` (game-logic needs no DOM), `window`/`localStorage` don't exist by default. Since `persistence.ts` is the first module that needs them, add a per-file environment override at the top of the test file instead of switching the whole project to `jsdom`:

```ts
// @vitest-environment jsdom
```

Add this as the very first line of `src/state/__tests__/persistence.test.ts` (above the imports), and install the environment:

```bash
npm install -D jsdom
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `npx vitest run src/state/__tests__/persistence.test.ts`
Expected: FAIL — module doesn't exist.

- [ ] **Step 4: Write the implementation**

```ts
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
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run src/state/__tests__/persistence.test.ts`
Expected: PASS (5 tests)

- [ ] **Step 6: Commit**

```bash
git add src/state/persistence.ts src/state/__tests__/persistence.test.ts package.json package-lock.json
git commit -m "feat: add localStorage persistence for game state"
```

---

## Task 10: Game context provider

**Files:**
- Create: `src/state/GameContext.tsx`

**Interfaces:**
- Consumes: `gameReducer`, `GameReducerState`, `GameAction` from `./gameReducer`; `loadGame`, `saveGame` from `./persistence`
- Produces: `GameProvider({ children }): JSX.Element`, `useGame(): { state: GameReducerState; dispatch: Dispatch<GameAction> }`

No automated test — this is a thin React wiring layer over already-tested `gameReducer` and `persistence`. Verified manually in Task 15 once it's mounted in `App.tsx` and exercised through the running app.

- [ ] **Step 1: Write the provider**

```tsx
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
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/state/GameContext.tsx
git commit -m "feat: add GameProvider/useGame context"
```

---

## Task 11: Setup screen

**Files:**
- Create: `src/components/setup/GameSetup.tsx`

**Interfaces:**
- Consumes: `useGame` from `../../state/GameContext`; `BettingStructure` from `../../game-logic/types`
- Produces: `GameSetup(): JSX.Element` — collects players + starting stacks, betting structure, blinds (+ small/big bet for Limit), dispatches `SETUP_GAME`

- [ ] **Step 1: Invoke `/ui-ux-pro-max`**

Per `CLAUDE.md`, invoke the `/ui-ux-pro-max` skill before writing this component's markup, asking for palette/typography/layout guidance for a poker-table setup form (player list with add/remove, radio group for betting structure, numeric inputs for blinds). Apply its Tailwind class recommendations in Step 2 below.

- [ ] **Step 2: Build the component**

```tsx
import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useGame } from "../../state/GameContext";
import { BettingStructure } from "../../game-logic/types";

interface DraftPlayer {
  name: string;
  stack: string;
}

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
    <div className="mx-auto max-w-xl space-y-6 p-6">
      <h1 className="text-2xl font-bold">New Game</h1>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Players</h2>
        {players.map((p, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              className="flex-1 rounded border px-2 py-1"
              placeholder="Name"
              value={p.name}
              onChange={(e) => updatePlayer(i, "name", e.target.value)}
            />
            <input
              className="w-24 rounded border px-2 py-1"
              type="number"
              placeholder="Stack"
              value={p.stack}
              onChange={(e) => updatePlayer(i, "stack", e.target.value)}
            />
            <button
              type="button"
              onClick={() => removePlayer(i)}
              aria-label={`Remove player ${i + 1}`}
              className="rounded p-1 text-red-600 hover:bg-red-50"
            >
              <Trash2 size={18} />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={addPlayer}
          className="flex items-center gap-1 rounded border px-2 py-1 text-sm"
        >
          <Plus size={16} /> Add player
        </button>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Betting structure</h2>
        <div className="flex gap-4">
          {(["no-limit", "pot-limit", "limit"] as const).map((s) => (
            <label key={s} className="flex items-center gap-1">
              <input
                type="radio"
                name="bettingStructure"
                checked={bettingStructure === s}
                onChange={() => setBettingStructure(s)}
              />
              {s}
            </label>
          ))}
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Blinds</h2>
        <div className="flex gap-2">
          <input
            className="w-24 rounded border px-2 py-1"
            type="number"
            value={smallBlind}
            onChange={(e) => setSmallBlind(e.target.value)}
            aria-label="Small blind"
          />
          <input
            className="w-24 rounded border px-2 py-1"
            type="number"
            value={bigBlind}
            onChange={(e) => setBigBlind(e.target.value)}
            aria-label="Big blind"
          />
        </div>
        {bettingStructure === "limit" && (
          <div className="flex gap-2">
            <input
              className="w-24 rounded border px-2 py-1"
              type="number"
              value={smallBet}
              onChange={(e) => setSmallBet(e.target.value)}
              aria-label="Small bet"
            />
            <input
              className="w-24 rounded border px-2 py-1"
              type="number"
              value={bigBet}
              onChange={(e) => setBigBet(e.target.value)}
              aria-label="Big bet"
            />
          </div>
        )}
      </section>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="button"
        onClick={handleStart}
        className="w-full rounded bg-green-700 px-4 py-2 font-semibold text-white hover:bg-green-800"
      >
        Start Game
      </button>
    </div>
  );
}
```

- [ ] **Step 3: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/setup/GameSetup.tsx
git commit -m "feat: add game setup screen"
```

---

## Task 12: Table screen

**Files:**
- Create: `src/components/table/Table.tsx`

**Interfaces:**
- Consumes: `useGame` from `../../state/GameContext`; `Player` from `../../game-logic/types`
- Produces: `Table(): JSX.Element` — renders players in a circle, pot/side-pots center, highlights `activePlayerIndex`

- [ ] **Step 1: Invoke `/ui-ux-pro-max`**

Per `CLAUDE.md`, invoke `/ui-ux-pro-max` before writing this component's markup, asking for guidance on arranging N players in a circle around a center pot display with an active-player highlight. Apply its layout/typography recommendations in Step 2.

- [ ] **Step 2: Build the component**

```tsx
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
    <div className="relative mx-auto aspect-square w-full max-w-2xl rounded-full border-4 border-green-800 bg-green-700">
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center text-white">
        <div className="text-sm uppercase tracking-wide opacity-80">Pot</div>
        <div className="text-2xl font-bold">{game.mainPot}</div>
        {game.sidePots.map((pot, i) => (
          <div key={i} className="text-sm opacity-80">
            Side pot {i + 1}: {pot.amount}
          </div>
        ))}
        <div className="mt-2 text-xs uppercase tracking-wide opacity-70">{game.currentStreet}</div>
      </div>

      {game.players.map((player, i) => {
        const pos = seatPosition(i, game.players.length);
        const isActive = i === game.activePlayerIndex;
        const isButton = i === game.buttonPosition;
        return (
          <div
            key={player.id}
            className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-lg border-2 px-3 py-2 text-center text-white ${
              isActive ? "border-yellow-400 bg-green-900 ring-2 ring-yellow-400" : "border-green-900 bg-green-800"
            }`}
            style={pos}
          >
            <div className="text-sm font-semibold">
              {player.name} {isButton && <span title="Button">(B)</span>}
            </div>
            <div className="text-xs">{player.stack} chips</div>
            <div className="text-xs opacity-80">{player.status}</div>
            {player.currentBetThisStreet > 0 && (
              <div className="text-xs text-yellow-300">bet {player.currentBetThisStreet}</div>
            )}
          </div>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 3: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/table/Table.tsx
git commit -m "feat: add table screen with seats and pot display"
```

---

## Task 13: Action controls

**Files:**
- Create: `src/components/actions/ActionControls.tsx`

**Interfaces:**
- Consumes: `useGame` from `../../state/GameContext`; `calculateBetLimits` from `../../game-logic/betting`
- Produces: `ActionControls(): JSX.Element` — Fold/Check/Call/Bet-Raise buttons for the current `activePlayerIndex`, a raise-amount input bounded by `calculateBetLimits`, and a "Next Hand" button

- [ ] **Step 1: Invoke `/ui-ux-pro-max`**

Per `CLAUDE.md`, invoke `/ui-ux-pro-max` before writing this component's markup, asking for guidance on a row of primary poker action buttons plus a bounded numeric raise input. Apply its recommendations in Step 2.

- [ ] **Step 2: Build the component**

```tsx
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
    <div className="mx-auto max-w-xl space-y-3 p-4">
      {state.lastError && <p className="text-sm text-red-600">{state.lastError}</p>}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => act("fold")}
          className="rounded bg-gray-200 px-4 py-2 font-semibold hover:bg-gray-300"
        >
          Fold
        </button>
        {canCheck ? (
          <button
            type="button"
            onClick={() => act("check")}
            className="rounded bg-blue-200 px-4 py-2 font-semibold hover:bg-blue-300"
          >
            Check
          </button>
        ) : (
          <button
            type="button"
            onClick={() => act("call")}
            className="rounded bg-blue-200 px-4 py-2 font-semibold hover:bg-blue-300"
          >
            Call
          </button>
        )}
        {limits?.canRaise && (
          <div className="flex items-center gap-2">
            <input
              className="w-24 rounded border px-2 py-1"
              type="number"
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
              className="rounded bg-green-600 px-4 py-2 font-semibold text-white hover:bg-green-700"
            >
              Bet/Raise
            </button>
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={() => dispatch({ type: "NEXT_HAND" })}
        className="rounded bg-gray-700 px-4 py-2 font-semibold text-white hover:bg-gray-800"
      >
        Next Hand
      </button>
    </div>
  );
}
```

- [ ] **Step 3: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/actions/ActionControls.tsx
git commit -m "feat: add action controls (fold/check/call/bet-raise, next hand)"
```

---

## Task 14: Showdown flow

**Files:**
- Create: `src/components/showdown/Showdown.tsx`

**Interfaces:**
- Consumes: `useGame` from `../../state/GameContext`
- Produces: `Showdown(): JSX.Element | null` — renders only when `game.playersToAct.length === 0` and `(game.mainPot > 0 || game.sidePots.length > 0)`; asks "who won main pot?" / "who won side pot N?" via buttons, dispatching `AWARD_POT`

- [ ] **Step 1: Invoke `/ui-ux-pro-max`**

Per `CLAUDE.md`, invoke `/ui-ux-pro-max` before writing this component's markup, asking for guidance on a modal/panel that lists a pot and buttons for each eligible player. Apply its recommendations in Step 2.

- [ ] **Step 2: Build the component**

```tsx
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
    <div className="mx-auto max-w-xl space-y-4 rounded border bg-white p-4 shadow">
      <h2 className="text-lg font-semibold">Showdown</h2>

      {game.mainPot > 0 && (
        <div>
          <p className="mb-1 text-sm">Who won the main pot ({game.mainPot})?</p>
          <div className="flex flex-wrap gap-2">
            {game.mainPotEligiblePlayerIds.map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => award(-1, id)}
                className="rounded bg-green-600 px-3 py-1 text-white hover:bg-green-700"
              >
                {nameFor(id)}
              </button>
            ))}
          </div>
        </div>
      )}

      {game.sidePots.map((pot, i) => (
        <div key={i}>
          <p className="mb-1 text-sm">
            Who won side pot {i + 1} ({pot.amount})?
          </p>
          <div className="flex flex-wrap gap-2">
            {pot.eligiblePlayerIds.map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => award(i, id)}
                className="rounded bg-green-600 px-3 py-1 text-white hover:bg-green-700"
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
```

- [ ] **Step 3: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/showdown/Showdown.tsx
git commit -m "feat: add manual showdown flow"
```

---

## Task 15: Wire up App.tsx

**Files:**
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: `GameProvider`, `useGame` from `./state/GameContext`; `GameSetup` from `./components/setup/GameSetup`; `Table` from `./components/table/Table`; `ActionControls` from `./components/actions/ActionControls`; `Showdown` from `./components/showdown/Showdown`

- [ ] **Step 1: Replace `src/App.tsx`**

```tsx
import { GameProvider, useGame } from "./state/GameContext";
import { GameSetup } from "./components/setup/GameSetup";
import { Table } from "./components/table/Table";
import { ActionControls } from "./components/actions/ActionControls";
import { Showdown } from "./components/showdown/Showdown";

function GameScreen() {
  const { state } = useGame();
  if (!state.game) return <GameSetup />;
  return (
    <div className="space-y-4 p-4">
      <Table />
      <Showdown />
      <ActionControls />
    </div>
  );
}

function App() {
  return (
    <GameProvider>
      <GameScreen />
    </GameProvider>
  );
}

export default App;
```

- [ ] **Step 2: Remove unused scaffold files**

Delete `src/App.css` if it still contains only the default Vite template styles and is no longer imported. Confirm `src/App.tsx` has no remaining reference to it.

- [ ] **Step 3: Manual verification**

Run: `npm run dev`, open the printed local URL.
Expected: setup screen loads; after adding 2+ players and clicking "Start Game", the table screen renders with seats, pot, and action controls; clicking through fold/check/call/bet-raise moves the game forward; refreshing the page keeps the in-progress game (persistence); folding down to one player or reaching the river with `playersToAct` empty shows the showdown panel and awarding a pot pays the winner's stack.

- [ ] **Step 4: Run the full test suite**

Run: `npm test`
Expected: all Vitest suites from Tasks 3-9 pass.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: wire up App with setup/table screens"
```

---

## Task 16: Hand-drawn chip SVGs

**Files:**
- Create: `src/components/chips/Chip.tsx`

**Interfaces:**
- Produces: `Chip({ value, color }: { value: number; color: string }): JSX.Element` — a simple hand-drawn SVG poker chip (no image assets), usable later for visual polish of stacks/pot.

- [ ] **Step 1: Invoke `/ui-ux-pro-max`**

Per `CLAUDE.md`, invoke `/ui-ux-pro-max` before finalizing this component's styling, asking for a palette to map chip denominations to colors, and confirm the SVG treatment (stroke weight, edge-dash styling) fits the app's visual language established in Tasks 11-14.

- [ ] **Step 2: Build the component**

```tsx
interface ChipProps {
  value: number;
  color: string;
}

export function Chip({ value, color }: ChipProps) {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" role="img" aria-label={`${value} chip`}>
      <circle cx="24" cy="24" r="22" fill={color} stroke="#1f2937" strokeWidth="2" />
      <circle
        cx="24"
        cy="24"
        r="16"
        fill="none"
        stroke="#f9fafb"
        strokeWidth="2"
        strokeDasharray="4 4"
      />
      <text
        x="24"
        y="28"
        textAnchor="middle"
        fontSize="11"
        fontWeight="bold"
        fill="#f9fafb"
      >
        {value}
      </text>
    </svg>
  );
}
```

- [ ] **Step 3: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/chips/Chip.tsx
git commit -m "feat: add hand-drawn SVG chip component"
```

---

## Final verification (all tasks complete)

- [ ] Run: `npm test` — all Vitest suites pass
- [ ] Run: `npx tsc --noEmit` — no type errors
- [ ] Run: `npm run build` — production build succeeds
- [ ] Run: `npm run dev` — manually play through a full hand (setup → preflop → flop → turn → river → showdown → next hand) with at least one all-in to confirm side-pot display and payout work
- [ ] Update `handoff.md` per `CLAUDE.md`'s session handoff protocol: what was completed, current state (works/broken/incomplete), next steps, open questions
