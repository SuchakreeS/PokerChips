# CLAUDE.md

Instructions for Claude Code when working in this repo.

## Project
Poker chip distribution & turn tracker webapp, for playing home games with real physical cards. Full plan lives in `plan.md` — read it before starting work if you're unfamiliar with the project.

## Tech stack
- React (function components + hooks, no class components)
- Tailwind CSS (core utility classes)
- lucide-react for icons
- Hand-drawn SVG for poker chip graphics (no image assets)
- Phase 2 only, not yet in use: Framer Motion (animation), Howler.js (sound), WebSocket/Firebase/Supabase (realtime multiplayer sync)
- Game logic (bet limits, side-pot math, turn order) lives in its own module, separate from UI components, so it can be reused server-side once Phase 2 adds a backend

## Design workflow
When designing or building any UI component, use the `/ui-ux-pro-max` skill for palette, typography, and layout guidance before writing markup.

## Session handoff protocol
- **Start of every new session**: read `handoff.md` first, before doing anything else, to pick up context from the previous session.
- **End of every session**: write or update `handoff.md` with:
  - What was completed this session
  - Current state of the app (what works, what's broken or incomplete)
  - Next steps / what to tackle next
  - Any open questions or decisions still pending
- If `handoff.md` doesn't exist yet, create it.
- **If there's anything you don't know or don't sure**: ask first do not assume
