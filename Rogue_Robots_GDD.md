# Game Design Document: Rogue Robots

## 1. High-Level Concept
* **Title:** Rogue Robots
* **Genre:** A hybrid of Tower Defense, Autobattler, and Rogue-like genres.
* **Platform:** Browser-based, optimized for both Desktop and Mobile (iOS, Android).
* **Core Premise:** Players defend their base on a procedurally generated maze against opposing AI robots, utilizing resource management, strategic unit placement, and a persistent meta-progression system.

---

## 2. Core Gameplay Loop
* **The "Creep" Clash:** The foundational combat involves auto-generated robot combatants spawning at regular intervals from both bases. These units march along the path toward the opposing base, automatically engaging enemy units they meet.
* **Map & Grid Structure:** Each round features a randomly generated, maze-like grid with a single continuous route carved through it.
* **Territorial Divide:** The maze is split horizontally by a visible line. The top half belongs to the NPC enemy, and the bottom half is the player's territory.
* **Bases & Win Condition:** The NPC base is at the top-left, and the player's base is at the bottom-right. Each base has a set amount of Hit Points (HP). The first team to reduce the opposing base's HP to zero wins the round.
* **Player Actions:** The player spends resources to influence the battle strictly on their side (the bottom half).
    * Spawn **Special Robots** at the player base to join the main wave.
    * Dynamically drop **Special Robots** anywhere on the walkable path within their territory.
    * Build **Static Defenses (Towers)** on the walls to fire projectiles at incoming enemies.

---

## 3. Economy & Resources
* **In-Match Resources:** The game utilizes three distinct resources: Metal, Batteries, and Silicon.
    * **Metal:** Awarded to the team that secures the killing blow on an enemy robot.
    * **Batteries & Silicon:** These spawn at random locations on the walkable spaces and are collected when a team's robot physically walks over them.
* **Crafting Recipes:** Every deployable Special Robot or Tower requires a specific combination (recipe) of these three resources.
* **Pre-Round Economy:** Resources do not carry over between rounds; players start completely fresh each time.
* **Asymmetrical Starts:** Each round provides a fixed, predetermined pool of starting resources. This information is revealed during the pre-round loadout phase, incentivizing players to draft units that capitalize on abundant starting materials (e.g., drafting Silicon-heavy robots if starting with extra Silicon).

---

## 4. Rogue-like Elements & Meta-Progression
* **Experience Points (XP) & Leveling:** Players earn XP based on their overall run performance (enemies defeated, resources collected, base damage), which contributes to a persistent player profile level.
* **The Unlocking System:** New robot and tower types are unlocked via meta-progression. A new player starts with roughly 3 foundational choices and eventually unlocks a diverse pool of 20 to 30 options.
* **Pre-Round Loadouts:** Before a round begins, players are restricted to choosing only 8 types of robots/towers to bring into that specific battle, forcing strategic synergy.
* **Post-MVP Run Structure:** Eventually, a "Full Game" will consist of a fixed sequence (e.g., 15 rounds) against progressively harder, distinct NPC "AI" profiles. These NPCs will have specific personas, predetermined loadouts, and unique traits that players must learn to counter during the draft.

---

## 5. Mechanics & Entities
* **Grid Composition:** The grid consists of two terrain types:
    * **Walkable Spaces:** The continuous path for marching robots and dropping Special Robots.
    * **Walls:** Unwalkable terrain reserved for placing Static Defenses (Towers).
* **Unit Types:**
    * **Basic Creeps:** Automatically generating combatants.
    * **Special Robots:** Summoned units costing resources.
    * **Towers:** Static structures placed on walls providing covering fire.

---

## 6. Art & Audio Direction
* **Visual Style:** Top-Down 2D Retro Pixel Art, chosen to fit the rogue-like identity and ensure lightweight browser performance.
* **Animation Scope (MVP):** Simple, functional sprite states limited to walking, attacking, and dying.
* **Asset Pipeline:** Artwork will be generated using AI tools via explicit prompts for "sprite sheets," allowing the AI coder to cleanly implement standard animation cycles.
* **Audio Direction (Post-MVP):** 8-bit chiptune music and sound effects will be added in later sprints to complement the retro aesthetic; audio is explicitly excluded from the MVP.

---

## 7. Technical Scope
* **Game Engine/Framework:** Phaser.js.
* **Justification:** As a dedicated, open-source 2D JavaScript framework, Phaser provides the necessary WebGL rendering to handle 50+ moving units smoothly on both desktop and mobile. It includes built-in game loops, physics, and collision detection, which minimizes the risk of AI hallucinations compared to writing pure HTML5 Canvas from scratch. Furthermore, it requires no paid licenses.

---

## 8. Unit Data (MVP Vertical Slice)

*(Note: All player-deployed units share a 1-second Universal Deployment Cooldown).*

| Name | Robot? | Metal | Silicon | Batteries | Spawn | HP | Dmg | Range | Armor | Move Spd | Atk Speed | Special Behavior | Unlock |
| :--- | :---: | :---: | :---: | :---: | :--- | :---: | :---: | :---: | :---: | :--- | :--- | :--- | :--- |
| **Grunt** | Y | 0 | 0 | 0 | Base | 3 | 1 | 1 | 0 | Medium | Medium | None | Lvl 1 |
| **Punchbot** | Y | 3 | 0 | 0 | Base | 5 | 2 | 1 | 0 | Medium | Medium | None | Lvl 1 |
| **Zapbot** | Y | 3 | 0 | 1 | Base | 3 | 2 | 3 | 0 | Medium | Medium | None | Lvl 1 |
| **Scavenger** | Y | 3 | 1 | 0 | Drop | 1 | 1 | 1 | 0 | Fast | Slow | Instead of pathing to base, paths to nearest resource. Self-destructs after picking up a resource. | Lvl 1 |
| **Boombot** | Y | 3 | 1 | 1 | Base | 3 | 10 | 1 | 0 | Fast | Fast | Damage is AoE in small radius; self destructs after first attack. | Lvl 2 |
| **Tankbot** | Y | 7 | 0 | 0 | Base | 7 | 2 | 1 | 1 | Slow | Medium | None | Lvl 2 |
| **Floatbot** | Y | 2 | 2 | 2 | Base | 3 | 2 | 1 | 0 | Medium | Medium | Can fly -- doesn't need to follow path so moves in straight line to enemy base; Can only be attacked if range > 1. | Lvl 3 |
| **Boomtrap** | N | 5 | 1 | 2 | Drop | 3 | 10 | 1 | 0 | None | None | If enemy walks within range, does damage in small radius then self-destructs. | Lvl 3 |
| **Zap Tower**| N | 5 | 1 | 5 | Drop | 5 | 2 | 3 | 0 | None | Medium | None | Lvl 3 |

---

## 9. Map & Procedural Generation
* **Grid Dimensions:** The game utilizes a 12 Columns by 16 Rows (12x16) grid, perfectly optimized for mobile touch targets and desktop scaling.
* **The Territorial Divide:** Rows 1–8 belong to the NPC (Top Half); Rows 9–16 belong to the Player (Bottom Half).
* **Dynamic Pathing Archetypes:** The maze generation algorithm randomly selects from a variety of templates to force tactical adaptation:
    * **The Serpent (Single Path):** A long, winding path with multiple switchbacks. *Tactical impact: Highly favors static Towers and AoE damage.*
    * **The Fork (Multi-Lane):** The path splits near the NPC base into 2 or 3 distinct lanes that may or may not converge before reaching the player's base. *Tactical impact: Forces the player to divide their defenses and manage multiple fronts.*
    * **The Grid (Webbed Paths):** A highly open layout with many interconnected short paths and very few solid wall blocks. *Tactical impact: Chaotic, favoring fast-moving drop units and aggressive melee brawling over static defenses.*
* **Fixed Endpoints:** Regardless of the archetype, the walkable spaces must always connect the NPC base at the top-left (0,0) to the player base at the bottom-right (11,15).

---

## 10. Enemy AI Pathing Logic
* **Primary Directive:** Auto-generating units (such as Grunts) will always calculate and follow the absolute shortest available route to the opposing base.
* **Equidistant Branching:** If a unit encounters an intersection where multiple branches offer the exact same travel distance to the destination, the unit will randomly select between those equidistant choices.
* **Tactical Impact:** This predictable logic allows players to "read" the board and set up chokepoints. However, on multi-lane maps, the random tie-breaker will naturally split incoming waves, preventing players from passively relying on a single, heavily fortified lane.

---

## 11. Controls & UI Interaction
* **Pre-Round Draft UI:** Before a round begins, the player interacts with a dedicated menu UI to select up to 8 deployables from their unlocked pool, locking them into their active loadout slots.
* **In-Game Deployment (Tap-to-Place):** During the round, deploying units utilizes a two-step "tap-to-place" system optimized for mobile touchscreens:
    1. The player taps a unit in their loadout bar at the bottom of the screen to "equip" it.
    2. The player taps a valid grid square (Walkable Space for robots, Wall for Towers) on their side of the map to execute the drop and spend the required resources.

---

## 12. Combat Logic & Targeting
* **Primary Targeting Priority:** By default, all units (both Grunts and Special Robots/Towers) will always lock onto and attack the **Closest Attackable Enemy** within their range.
* **Special Targeting:** This default rule only changes if a unit possesses a specific "Special Behavior" attribute that explicitly overrides its targeting logic (e.g., targeting a resource instead of an enemy).

---

## 13. Wave Pacing & Escalation
* **The Baseline Spawner:** The game features an asymmetrical baseline spawn rate to give the NPC a slight numerical advantage:
    * **Player Base:** Auto-spawns 1 friendly Grunt every **4 seconds**.
    * **NPC Base:** Auto-spawns 1 enemy Grunt every **3 seconds**.
* **The Escalation Timer ("Soft Enrage"):** To prevent infinite stalemates, the NPC base's spawn rate accelerates as the round timer increases:
    * **At 5 Minutes:** The NPC base accelerates to spawning 1 Grunt every **2 seconds**.
    * **At 10 Minutes:** The NPC base accelerates to spawning 1 Grunt every **1 second**.
* **Wave Structure:** Grunts will spawn infinitely according to these timers until one of the bases is reduced to 0 HP.
