# Rogue Robots — Decisions Log

> This file records all significant architectural, design, and tooling decisions made during development.
> When a decision is made, add a row with the date, the decision, the rationale, and any alternatives that were considered.
> Claude Code should append to this file when it makes a consequential implementation choice not already covered here.

---

## Format

| Date | Area | Decision | Rationale | Alternatives Considered |
|------|------|----------|-----------|------------------------|

---

## Decisions

| Date | Area | Decision | Rationale | Alternatives Considered |
|------|------|----------|-----------|------------------------|
| 2025-05-15 | Engine | Use **Phaser 3** as the game engine | Mature, well-documented, handles WebGL rendering for 50+ units on desktop and mobile. Well-represented in Claude Code training data, minimizing hallucination risk. | Pure HTML5 Canvas (too low-level for AI implementation); Unity WebGL (overkill, licensing concerns); PixiJS (less built-in game tooling) |
| 2025-05-15 | Pathfinding | Use **EasyStar.js** for A* grid pathfinding | Plug-and-play A* for tile grids; pairs naturally with Phaser; well-documented. Solves the hardest pathing problem without custom implementation. | Custom A* (unnecessary risk); Phaser's built-in pathfinding (less capable for this use case) |
| 2025-05-15 | Language | Use **JavaScript (ES6+)**, not TypeScript | Faster MVP iteration. Claude Code can generate and revise JS more reliably in short sprints. TypeScript can be introduced in a post-MVP refactor if desired. | TypeScript (better long-term maintainability, but adds tooling overhead for MVP) |
| 2025-05-15 | Build Tool | Use **Vite** | Fast dev server with hot module replacement. Minimal config. Claude Code handles it reliably. | Webpack (more complex config); no bundler / plain HTML (loses module support) |
| 2025-05-15 | Unit Data | Store all unit stats in **`src/data/units.json`** | Single source of truth for all unit costs, stats, and behaviors. Decouples data from logic. Easy to edit without touching game code. | Hardcoded in JS classes (brittle, hard to balance); separate JSON per unit (unnecessary fragmentation) |
| 2025-05-15 | Art | Use **colored tiles** as placeholders throughout MVP | Unblocks all 6 sprints without waiting on sprite art. All gameplay logic can be built and tested visually with no art dependency. Sprites are a post-MVP concern. | Placeholder sprites (adds art pipeline overhead during MVP); ASCII rendering (poor for spatial gameplay testing) |
| 2025-05-15 | Architecture | Separate code into **Scenes / Entities / Systems / UI / Map** layers | Prevents monolithic "god object" files. Each layer has a single responsibility. Claude Code is less likely to produce tangled, hard-to-modify output when given explicit structural constraints. | Single GameScene file (fast to start, painful to maintain); MVC pattern (overengineered for this scale) |
| 2025-05-15 | Hosting | Target **GitHub Pages or Netlify** for deployment | Free, zero-config for static browser games. Fits the browser-based platform target in the GDD. | Self-hosted server (unnecessary for a browser game); itch.io (viable option to revisit post-MVP) |
| 2026-05-15 | Engine version | `npm install phaser` resolved to **phaser@4.x** (not 3.x) | The installed version is whatever npm resolves from `^4.1.0`. Phaser 4's scene/scale API is backward-compatible with the patterns used here; no changes needed. | Pinning to phaser@3 (would require modifying package.json — deferring until a version-specific issue is encountered) |
| 2026-05-15 | Pathfinding tie-breaking | Random equidistant tie-breaking **deferred to Sprint 5** | EasyStar.js has no built-in randomization. The Serpent archetype has exactly one valid path so EasyStar's deterministic output is correct. Fork/Grid archetypes (Sprint 5) will need a wrapper that detects equal-cost branches and randomly selects among them. | Custom A* now (unnecessary complexity for a single-path map) |
| 2026-05-15 | Canvas dimensions | Game canvas set to **480×640** (portrait) with `Scale.FIT` + `CENTER_BOTH` | Maps directly to the 12-col × 16-row grid at ~40 px/tile. Portrait orientation suits mobile. `FIT` ensures it fills available screen space on all viewports without distortion. | Square canvas (wastes vertical mobile space); landscape (poor for portrait-first mobile play) |
