# CLAUDE.md — Rogue Robots Project Brief

> This file is read automatically by Claude Code at the start of every session.
> It is the primary source of working rules and project orientation.
> Do not modify this file unless explicitly instructed by the user.

---

## What This Project Is

**Rogue Robots** is a browser-based hybrid Tower Defense / Autobattler / Rogue-like game built with Phaser 3 and Vite. Players defend a base on a procedurally generated grid map against AI-controlled robots, using resource management and strategic unit placement.

Full design spec: `Rogue_Robots_GDD.md`  
Implementation plan: `TODO.md`  
Architecture and tooling decisions: `DECISIONS.md`

---

## Your Role

You are implementing this game sprint-by-sprint as directed. At the start of every session:

1. Read `TODO.md` and identify the first incomplete sprint
2. Work through that sprint's tasks in order
3. Check off completed tasks in `TODO.md` as you go
4. Do not begin the next sprint until the current one is fully working
5. If you make a significant architectural decision not already in `DECISIONS.md`, append it there

---

## Tech Stack

| Layer | Choice | Notes |
|-------|--------|-------|
| Engine | Phaser 4 | Installed via npm — `phaser@^4.1.0`. APIs are largely compatible with the Phaser 3 docs commonly cited in the GDD. |
| Pathfinding | EasyStar.js | Installed via npm |
| Language | JavaScript ES6+ | No TypeScript |
| Build Tool | Vite | `npm run dev` to start |
| Unit Data | `src/data/units.json` | Single source of truth for all unit stats |

---

## Project Structure

All source code lives under `src/`. Do not create files outside this structure without explicit instruction.

```
src/
├── data/
│   └── units.json          # All unit stats — never hardcode stats in JS files
├── scenes/
│   ├── BootScene.js        # Asset preloading only
│   ├── DraftScene.js       # Pre-round loadout UI
│   └── GameScene.js        # Orchestrates gameplay — delegates to systems
├── entities/
│   ├── Unit.js             # Base class for all moving units
│   ├── Tower.js            # Base class for static defenses
│   └── ResourceToken.js    # Collectible resource pickups
├── systems/
│   ├── PathfindingSystem.js
│   ├── CombatSystem.js
│   ├── SpawnSystem.js
│   └── EconomySystem.js
├── ui/
│   ├── HUD.js
│   └── LoadoutBar.js
├── map/
│   ├── MapGenerator.js
│   └── archetypes/
│       ├── Serpent.js
│       ├── Fork.js
│       └── Grid.js
└── main.js                 # Phaser config and entry point
```

---

## Hard Rules

These apply at all times and override any other consideration.

### Architecture
- **`GameScene.js` is an orchestrator only.** It initializes and calls systems — it does not contain combat logic, pathfinding logic, spawn logic, or economy logic. If you find yourself writing game logic directly in `GameScene`, stop and put it in the correct system file.
- **Never hardcode unit stats in JavaScript files.** All stats (HP, damage, range, cost, etc.) must be read from `src/data/units.json`.
- **All constants live in `src/data/constants.js`.** No other file may define named constants or use bare magic numbers. This includes colors, depths, timing values, grid dimensions, spawn intervals, and UI layout values. If you need a new constant, add it there first, then import it.
- **One responsibility per file.** If a file is growing beyond ~150 lines, consider whether it is doing too much.
- **Never create files outside the defined structure** without asking the user first.

### Implementation
- **Complete one sprint at a time.** Do not implement features from a future sprint while working on the current one, even if it seems convenient.
- **Colored rectangle tiles throughout MVP.** Do not add sprite loading or texture management until the user explicitly requests it. All units and tiles are rendered as colored rectangles for now.
- **No audio code in the MVP.** Audio is explicitly post-MVP per the GDD.
- **Mobile-compatible from the start.** Use Phaser's scale manager. Do not hardcode pixel dimensions that would break on small screens.

### Communication
- **Ask before assuming on ambiguous GDD points.** The GDD is the design authority. If something is unclear or contradictory, flag it rather than inventing a solution.
- **Do not silently skip tasks.** If a task cannot be completed as written, explain why and propose an alternative before moving on.

---

## Key Game Rules (Quick Reference)

These are the most commonly referenced design rules. Always verify against `Rogue_Robots_GDD.md` for full detail.

| Rule | Value |
|------|-------|
| Grid size | 12 columns × 16 rows |
| NPC territory | Rows 1–8 (top half) |
| Player territory | Rows 9–16 (bottom half) |
| NPC base | Tile (0, 0) — top-left |
| Player base | Tile (11, 15) — bottom-right |
| Player Grunt spawn rate | 1 every 4 seconds |
| NPC Grunt spawn rate | 1 every 3 seconds |
| Escalation at 5 min | NPC → 1 Grunt per 2 seconds |
| Escalation at 10 min | NPC → 1 Grunt per 1 second |
| Deployment cooldown | 1 second universal (all player-deployed units) |
| Max loadout slots | 8 |
| Default targeting | Closest attackable enemy within range |
| Damage formula | Attacker Dmg − Target Armor (minimum 1) |

---

## units.json Schema

Each unit entry must conform to this shape:

```json
{
  "name": "Grunt",
  "isRobot": true,
  "cost": { "metal": 0, "silicon": 0, "batteries": 0 },
  "spawn": "Base",
  "hp": 3,
  "dmg": 1,
  "range": 1,
  "armor": 0,
  "moveSpeed": "medium",
  "atkSpeed": "medium",
  "specialBehavior": null,
  "unlockLevel": 1
}
```

Speed values are strings: `"slow"`, `"medium"`, `"fast"`, `"none"`.  
`specialBehavior` is `null` or a short string key (e.g., `"scavenger"`, `"boombot_aoe"`, `"floatbot_fly"`, `"boomtrap"`) that the relevant system uses to apply special logic.  
`spawn` is either `"Base"` or `"Drop"`.

---

## Definition of Done

A sprint task is complete when:
- The feature works correctly in the browser via `npm run dev`
- It does not break any previously completed sprint features
- The checkbox in `TODO.md` is marked `[x]`

A sprint is complete when all its tasks are done and the game is in a stable, playable state up to that sprint's scope.

---

## Always Rebuild After Code Changes

The user launches the game by opening `index.html` directly, which loads the pre-built bundle at `assets/game.js`. Source edits in `src/` are **not** reflected until the bundle is regenerated.

**You must run `npm run build` after:**
- Any bug fix
- Completing any sprint
- Any source change you want the user to see by reloading `index.html`

Skip the rebuild only if you have explicitly confirmed the user is testing via `npm run dev` (the Vite dev server reads `src/` directly).
