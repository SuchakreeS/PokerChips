# Poker Chips & Turn Tracker — Project Plan

## Goal
A webapp that tracks poker chip stacks, pot, side pots, and turn order for a home game played with real physical cards — so the group doesn't have to do that math by hand.

## Phase 1 — Shared-Screen Table Tracker

### Scope
- One shared screen/device, passed around or visible to the whole table
- Cards are dealt physically — the app does **not** know hands or auto-determine winners
- App tracks: stacks, turn order, pot, side pots, and enforces betting-structure rules
- Betting structure (No-Limit / Pot-Limit / Limit) is selectable per game at setup, not hardcoded

### Data model
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

### Features
1. **Game setup** — add players + starting stacks, pick betting structure, set blinds (and small/big bet for Limit)
2. **Table screen** — players around a circle, pot shown center, active-player indicator that auto-advances clockwise, action buttons (Fold / Check / Call / Bet-Raise)
3. **Pot & side-pot calculator** — chips move stack → pot automatically on each action; auto-splits into side pots when a player is all-in for less than others can bet
4. **Hand lifecycle** — "Next Hand" posts blinds, moves the button, resets bets/pot, skips busted players
5. **Manual showdown** — since the app doesn't know hands, it asks "who won the main pot?" / "who won side pot N?" via simple buttons and pays out accordingly

### Betting rules enforced
- **No-Limit**: min raise = size of last raise (or BB preflop); max = player's full stack
- **Pot-Limit**: max raise via the "pot × 3 + existing pot" rule
- **Limit**: fixed small-bet/big-bet per street, capped at 4 bets per street (3 raises)

## Tech stack (Phase 1)
- React (function components + hooks)
- Tailwind CSS (core utility classes)
- lucide-react (icons)
- Hand-drawn SVG for poker chip graphics (no image assets)
- Game logic kept in a separate pure-JS module from the UI (`calculateMaxBet()`, `calculateSidePots()`, `advanceTurn()`) so it can be reused server-side in Phase 2

## Phase 2 (future, not building yet)
- Real-time multiplayer — each player on their own device, synced live
- Backend: Node + WebSocket, or Firebase/Supabase realtime
- Room codes to join a game
- Framer Motion for chip-slide and turn-indicator animation
- Howler.js for chip/action sound effects

## Assumptions (flag if wrong)
- Cash-game style with fixed blinds (no escalating tournament levels) in Phase 1
- No hand timer/clock
- Desktop/tablet-sized shared screen — not optimized for small phone screens in Phase 1
