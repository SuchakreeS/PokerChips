# Phase 1 Scaffold — Design Spec

Date: 2026-08-28
Status: Approved

## Goal
Stand up the Phase 1 shared-screen poker chip & turn tracker described in `plan.md`: project scaffold, game-logic module, state management, screen inventory. This spec covers architecture and structure, not visual design (deferred to `/ui-ux-pro-max` at build time per `CLAUDE.md`).

## Stack
- Vite + React + TypeScript (`react-ts` template)
- Tailwind CSS (core utility classes only)
- lucide-react for icons
- Hand-drawn SVG for poker chip graphics (no image assets)
- Vitest for unit-testing the game-logic module
- No backend, no router (two screens swapped via a state flag)
- Framer Motion, Howler.js, realtime sync (WebSocket/Firebase/Supabase) — explicitly Phase 2, not installed now

## File structure
```
src/
  game-logic/           # pure TS, no React imports — reusable server-side in Phase 2
    types.ts            # Game, Player, SidePot, etc. (per plan.md data model)
    betting.ts           # calculateMaxBet() — NL/PL/Limit rules
    sidePots.ts           # calculateSidePots()
    turnOrder.ts          # advanceTurn(), button movement
    handLifecycle.ts      # nextHand() — post blinds, reset bets, skip busted players
    __tests__/            # Vitest specs, one file per module above
  state/
    gameReducer.ts        # useReducer reducer wrapping game-logic calls
    GameContext.tsx        # Context provider + useGame() hook
    persistence.ts        # localStorage load/save (debounced), version-tagged
  components/
    setup/                # GameSetup screen — players, structure, blinds
    table/                 # Table screen — seats, pot display, active-player ring
    actions/                # Fold/Check/Call/Bet-Raise controls
    showdown/               # "who won main/side pot N" prompt
    chips/                  # hand-drawn SVG chip components
    shared/                  # buttons, modals, layout primitives
  App.tsx                  # swaps setup screen <-> table screen via state flag
  main.tsx
```

## Data model
Per `plan.md`, unchanged:
```
Game
 - bettingStructure: "no-limit" | "pot-limit" | "limit"
 - smallBlind, bigBlind
 - smallBet, bigBet (limit only)
 - buttonPosition (index)
 - currentStreet: preflop | flop | turn | river
 - mainPot, sidePots[]

Player
 - name
 - stack
 - currentBetThisStreet
 - totalBetThisHand
 - status: active | folded | all-in | sitting-out
```

## State flow & reducer
`GameContext` holds one `Game` object. All mutations go through a typed reducer:

- `SETUP_GAME` (players, structure, blinds) → creates initial `Game`
- `PLAYER_ACTION` (fold/check/call/bet-raise + amount) → validates against `calculateMaxBet()`, updates stacks/pot, calls `advanceTurn()`
- `NEXT_HAND` → `handLifecycle.nextHand()`: posts blinds, moves button, resets street/bets/pot, skips busted/sitting-out players
- `AWARD_POT` (potId, winnerId) → manual showdown payout, moves chips pot → winner stack

**Validation contract:** game-logic functions return `{ok: false, reason}` for invalid actions (e.g. bet below min-raise) instead of throwing. The reducer rejects the action before mutating state; the UI surfaces `reason` inline near the action controls. Keeps `game-logic/` free of UI concerns (no alerts/toasts inside it).

**Persistence:** `GameContext` debounce-saves `Game` to `localStorage` on every change, and loads it back on mount if present. Saved data carries a version tag; if it can't be parsed or the version doesn't match, fall back to a fresh setup screen rather than crashing.

## Screens
- **Setup screen** — add players (name + starting stack), pick betting structure (No-Limit/Pot-Limit/Limit), set blinds (+ small/big bet if Limit), "Start Game".
- **Table screen** — players in a circle, pot + side-pots shown center, active-player highlight that auto-advances, action buttons (Fold/Check/Call/Bet-Raise with a raise-amount input bounded by `calculateMaxBet()`), "Next Hand" button, manual showdown prompt ("who won main pot? / side pot N?") at showdown.

Visual styling (palette, typography, layout specifics) is decided later via `/ui-ux-pro-max` per component, not fixed in this spec.

## Testing
Vitest covers `game-logic/` exhaustively:
- Min-raise/max-bet math for all three betting structures
- Side-pot splitting across multiple simultaneous all-ins
- Turn advancement skipping folded/busted/sitting-out players
- Blind posting and button movement across hands, including skipped busted players

No Playwright/e2e in this phase — revisit once the UI is stable enough to be worth driving in a browser.

## Build order
1. Scaffold (Vite + React + TS + Tailwind + lucide-react + Vitest)
2. `game-logic/` module + full Vitest coverage
3. `state/` — reducer, context, persistence
4. Setup screen
5. Table screen
6. Action controls
7. Showdown flow
8. Chip SVGs / visual polish

## Out of scope (Phase 2, not building)
Real-time multiplayer, backend, room codes, Framer Motion animation, Howler.js sound, hand timer/clock, small-phone-screen optimization.

## Open assumptions (from plan.md, carried forward)
- Cash-game style, fixed blinds, no tournament escalation
- No hand timer/clock
- Desktop/tablet-sized shared screen, not optimized for phones
