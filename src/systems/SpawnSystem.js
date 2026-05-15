// Player Grunt spawns at (col 11, row 15) heading to (0, 0)
// NPC Grunt spawns at (col 0,  row 0 ) heading to (11, 15)
const PLAYER_SPAWN = { col: 11, row: 15, targetCol: 0,  targetRow: 0  };
const NPC_SPAWN    = { col: 0,  row: 0,  targetCol: 11, targetRow: 15 };
const PLAYER_INTERVAL_MS = 4000;
const NPC_INTERVAL_MS    = 3000;

export default class SpawnSystem {
  // onSpawn(team, path) is called each time a unit should be created
  constructor(scene, pathfinding, onSpawn) {
    this._scene = scene;
    this._pathfinding = pathfinding;
    this._onSpawn = onSpawn;
    this._timers = [];
  }

  start() {
    this._timers.push(
      this._scene.time.addEvent({
        delay: PLAYER_INTERVAL_MS,
        loop: true,
        callback: () => this._spawn('player', PLAYER_SPAWN),
      }),
      this._scene.time.addEvent({
        delay: NPC_INTERVAL_MS,
        loop: true,
        callback: () => this._spawn('npc', NPC_SPAWN),
      })
    );

    // Spawn one of each immediately so the board isn't empty at game start
    this._spawn('player', PLAYER_SPAWN);
    this._spawn('npc', NPC_SPAWN);
  }

  stop() {
    this._timers.forEach(t => t.remove());
    this._timers = [];
  }

  async _spawn(team, config) {
    const path = await this._pathfinding.findPath(
      config.col, config.row, config.targetCol, config.targetRow
    );
    if (path && path.length > 1) this._onSpawn(team, path);
  }
}
