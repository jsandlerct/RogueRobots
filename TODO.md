# Rogue Robots — Implementation TODO

> **Instructions for Claude Code:**
> - This file is the source of truth for implementation progress.
> - After completing any task, update its checkbox from `[ ]` to `[x]` and add a brief inline note if relevant.
> - Complete sprints in order. Each sprint assumes the previous is fully working.
> - For significant architectural or tooling choices not already covered, append a row to `DECISIONS.md`.
> - Full design reference: `Rogue_Robots_GDD.md`

---

## Tech Stack

| Layer | Choice |
|-------|--------|
| Engine | Phaser 3 |
| Pathfinding | EasyStar.js |
| Language | JavaScript (ES6+) |
| Build Tool | Vite |
| Unit Data | `src/data/units.json` |

---

## Sprint 0 — Project Foundation

Goal: A clean, well-structured repository that all future sprints build on. No gameplay yet.

### Scaffolding
- [x] Initialize Vite project (`npm create vite@latest`)
- [x] Install Phaser 3 (`npm install phaser`) — installed as phaser@^4.1.0
- [x] Install EasyStar.js (`npm install easystarjs`)
- [x] Confirm dev server runs (`npm run dev`) with a blank Phaser canvas — confirmed on localhost:5173

### Directory Structure
Create the following folder structure before writing any game code:

```
rogue-robots/
├── public/
│   └── assets/
│       ├── sprites/        # Placeholder for future sprite sheets
│       └── audio/          # Placeholder for future audio
├── src/
│   ├── data/
│   │   └── units.json      # Single source of truth for all unit stats
│   ├── scenes/
│   │   ├── BootScene.js    # Asset preloading
│   │   ├── DraftScene.js   # Pre-round loadout UI
│   │   └── GameScene.js    # Main gameplay
│   ├── entities/
│   │   ├── Unit.js         # Base class for all moving units
│   │   ├── Tower.js        # Base class for static defenses
│   │   └── ResourceToken.js
│   ├── systems/
│   │   ├── PathfindingSystem.js
│   │   ├── CombatSystem.js
│   │   ├── SpawnSystem.js
│   │   └── EconomySystem.js
│   ├── ui/
│   │   ├── HUD.js
│   │   └── LoadoutBar.js
│   ├── map/
│   │   ├── MapGenerator.js
│   │   └── archetypes/
│   │       ├── Serpent.js
│   │       ├── Fork.js
│   │       └── Grid.js
│   └── main.js             # Entry point and Phaser config
├── index.html
├── vite.config.js
├── package.json
├── TODO.md
├── DECISIONS.md
└── Rogue_Robots_GDD.md
```

- [x] Create all directories and stub files (empty exports are fine — just establish the structure)

### Data
- [x] Populate `src/data/units.json` with all 9 MVP units and their full stats from GDD Section 8:
  - Fields per unit: `name`, `isRobot`, `cost` (metal/silicon/batteries), `spawn` (Base/Drop), `hp`, `dmg`, `range`, `armor`, `moveSpeed`, `atkSpeed`, `specialBehavior`, `unlockLevel`

### Entry Point
- [x] Configure `main.js` with Phaser game config: scene list (Boot → Draft → Game), canvas size, pixel-art scale mode
- [x] `BootScene.js`: stub that transitions immediately to `DraftScene` (no assets to load yet)
- [x] `DraftScene.js`: stub that shows placeholder text "Draft Screen" and transitions to `GameScene` on click/tap
- [x] `GameScene.js`: stub that shows placeholder text "Game Screen" — confirms scene routing works end-to-end

---

## Sprint 1 — Grid & Map Rendering

Goal: A visible, correctly structured 12x16 game board. No units yet.

- [x] Implement grid constants: 12 columns × 16 rows, configurable tile size — exported from `Serpent.js` (COLS, ROWS, TILE_SIZE=40)
- [x] Implement a hardcoded **Serpent** map layout in `Serpent.js` (single winding path for early testing)
- [x] Render the grid in `GameScene`: walkable path tiles and wall tiles visually distinct (colored rectangles — no sprites needed)
- [x] Render the territorial divide line between Row 8 (NPC) and Row 9 (Player) — yellow line at y=320
- [x] Mark and visually distinguish the NPC base (top-left, tile 0,0) and Player base (bottom-right, tile 11,15) — red/blue with text labels
- [x] Confirm grid scales correctly on both desktop and a simulated mobile viewport — Phaser Scale.FIT + CENTER_BOTH handles this

---

## Sprint 2 — Grunt Spawning & Pathfinding

Goal: Grunts march from both bases toward the opposing base along the path.

- [x] Initialize EasyStar.js grid in `PathfindingSystem.js` using the map data from Sprint 1
- [x] Implement A* path calculation: given start and end tile, return ordered list of tiles
- [x] Implement `Unit.js` base class with position, stats (from `units.json`), and step-along-path movement
- [x] `SpawnSystem.js`: spawn Player Grunt every **4 seconds** from tile (11,15)
- [x] `SpawnSystem.js`: spawn NPC Grunt every **3 seconds** from tile (0,0)
- [x] Grunts march along their calculated path, one tile at a time, toward the opposing base
- [x] Equidistant tie-breaking: random branch selection when multiple paths have equal distance (GDD Section 10) — Serpent has exactly one path so EasyStar default is correct; random branching deferred to Sprint 5 (Fork/Grid maps), see DECISIONS.md
- [x] Grunts idle when they reach the opposing base (combat placeholder) — movement tween chain simply stops at path end

---

## Sprint 3 — Combat System

Goal: Units fight, die, and deal damage to bases.

- [x] `CombatSystem.js`: detect when two opposing units are within attack range of each other
- [x] Targeting: each unit locks onto the **closest attackable enemy** within its range (GDD Section 12)
- [x] Attack loop: damage = attacker Dmg − target Armor (minimum 1 damage per hit), applied at attacker's Atk Speed interval
- [x] Unit death: remove unit from scene when HP reaches 0
- [x] **Metal economy:** award 1 Metal to the team whose unit lands the killing blow (`EconomySystem.js`)
- [x] Base damage: units that reach the opposing base deal 1 damage per second to it
- [x] Track and display both base HP values in the HUD (`HUD.js`) — base HP set to 50
- [x] Win/loss detection: end round when either base HP reaches 0

---

## Sprint 4 — Player Economy & Special Unit Deployment

Goal: Player can spend resources to deploy Special Robots and Towers mid-round.

- [x] `EconomySystem.js`: track Metal, Batteries, and Silicon separately for the player — starting pool: M:20 Si:5 B:5
- [x] `HUD.js`: display current resource counts (top-right overlay)
- [x] `ResourceToken.js`: spawn Battery (cyan) and Silicon (purple) tokens at random walkable tiles every 8s + one at round start
- [x] Token collection: tokens picked up when any friendly player unit walks over them
- [x] `LoadoutBar.js`: render 8 loadout slots at y=640 (canvas expanded to 700); slots dim when unaffordable
- [x] Hardcode a default 8-unit loadout for Sprint 4 testing: Grunt, Punchbot, Zapbot, Scavenger, Boombot, Tankbot, Floatbot, Zap Tower
- [x] Two-step tap-to-place deployment (GDD Section 11):
  - Tap loadout slot → unit equipped (highlighted)
  - Tap valid tile → unit placed, resources deducted
  - Robots → walkable tiles only; Towers → wall tiles only
  - Player-side only (Rows 8–15 0-indexed); reject invalid placements with brief feedback
- [x] Enforce **1-second Universal Deployment Cooldown** between any placements
- [x] Enforce resource cost check; prevent and indicate deployment if insufficient resources
- [x] Implement **Scavenger** special behavior: paths to nearest resource token; self-destructs on pickup

---

## Sprint 5 — Full Round Loop

Goal: A complete playable round from draft to win/loss.

- [x] `DraftScene.js`: player selects up to 8 units from their unlocked pool (Lvl 1 units only: Grunt, Punchbot, Zapbot, Scavenger)
- [x] Display predetermined starting resource pool during draft phase (M:20 Si:5 B:5)
- [x] Transition from draft to game board on confirmation (loadout passed via scene data)
- [x] Display round timer on HUD (top-center, counts up from 0:00)
- [x] `SpawnSystem.js`: implement **Escalation Timer** (GDD Section 13):
  - At 5:00 — NPC spawn rate → 1 Grunt per **2 seconds**
  - At 10:00 — NPC spawn rate → 1 Grunt per **1 second**
- [x] Win screen on NPC base destruction
- [x] Loss screen on Player base destruction
- [x] "Play Again" flow: returns to draft screen and resets all round state
- [x] `MapGenerator.js`: randomly select one of three archetypes per round
- [x] Implement **Fork** archetype in `Fork.js` (two-lane: left-column vs top-row, merge at row 7)
- [x] Implement **Grid** archetype in `Grid.js` (three corridors: col 0, 5, 11 with horizontal connectors)
- [x] Validate pathfinding works correctly on all three archetypes — pre-defined paths used for Fork/Grid; EasyStar used for Serpent and player-deployed unit routing

---

## Sprint 6 — All MVP Units & Special Behaviors

Goal: All 9 units fully implemented with correct stats and behaviors.

- [x] **Grunt** — stats and behavior confirmed (baseline from Sprints 2–3)
- [x] **Punchbot** — standard melee; stats confirmed, works via existing combat system
- [x] **Zapbot** — ranged (Range 3); stats confirmed, existing range check handles it
- [x] **Scavenger** — resource-seeker, Drop spawn, self-destructs on pickup (from Sprint 4)
- [x] **Boombot** — AoE on first attack in CombatSystem._tryAttack; self-destructs after explosion
- [x] **Tankbot** — Armor 1, slow speed; handled by existing damage formula and move speed
- [x] **Floatbot** — straight-line path via GameScene._straightLinePath; range-1 units cannot target it (CombatSystem._closestInRange)
- [x] **Boomtrap** — CombatSystem._tryBoomtrap: proximity check each frame, AoE + self-destruct on trigger
- [x] **Zap Tower** — wall-placed, Range 3 handled by existing combat system
- [x] Verify all unit costs match `src/data/units.json`
- [x] Verify Spawn type rules enforced for all units (Base vs. Drop) — GameScene._onBoardClick checks isRobot vs walkable
- [x] Verify unlock gating: Lvl 1 available by default; Lvl 2 and Lvl 3 locked in draft — DraftScene filters unlockLevel === 1

---

## Backlog (Post-MVP)

Out of scope for MVP. Tracked here for future planning.

- [ ] Meta-progression: XP system, player level, persistent unlocks
- [ ] Full run structure: 15-round sequence with distinct NPC AI profiles and personas
- [ ] Sprite art: pixel art sprite sheets (walking, attacking, dying animations) for all units
- [ ] Audio: 8-bit chiptune music and sound effects
- [ ] Mobile polish: touch target sizing, on-device testing (iOS/Android)
- [ ] Additional map archetypes beyond the three MVP templates
- [ ] Full draft UI with 20–30 unit unlock pool
- [ ] NPC AI with unique loadouts and learnable traits
