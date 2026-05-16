import {
  NPC_BASE_COL, NPC_BASE_ROW, PLAYER_BASE_COL, PLAYER_BASE_ROW,
  PLAYER_SPAWN_INTERVAL_MS, NPC_SPAWN_INTERVAL_MS, ESCALATION,
} from '../data/constants.js';

const PLAYER_SPAWN = { col: PLAYER_BASE_COL, row: PLAYER_BASE_ROW, targetCol: NPC_BASE_COL,    targetRow: NPC_BASE_ROW    };
const NPC_SPAWN    = { col: NPC_BASE_COL,    row: NPC_BASE_ROW,    targetCol: PLAYER_BASE_COL, targetRow: PLAYER_BASE_ROW };

export default class SpawnSystem {
  constructor(scene, pathfinding, mapPaths, onSpawn) {
    this._scene       = scene;
    this._pathfinding = pathfinding;
    this._mapPaths    = mapPaths;
    this._onSpawn     = onSpawn;
    this._playerTimer      = null;
    this._npcTimer         = null;
    this._escalationTimers = [];
  }

  start() {
    this._playerTimer = this._scene.time.addEvent({
      delay: PLAYER_SPAWN_INTERVAL_MS,
      loop: true,
      callback: () => this._spawn('player', PLAYER_SPAWN),
    });

    this._setNpcInterval(NPC_SPAWN_INTERVAL_MS);

    for (const { atMs, intervalMs } of ESCALATION) {
      this._escalationTimers.push(
        this._scene.time.delayedCall(atMs, () => this._setNpcInterval(intervalMs))
      );
    }

    // Immediate first spawns so the board isn't empty at round start
    this._spawn('player', PLAYER_SPAWN);
    this._spawn('npc',    NPC_SPAWN);
  }

  stop() {
    [this._playerTimer, this._npcTimer, ...this._escalationTimers]
      .forEach(t => { if (t) t.remove(); });
    this._playerTimer      = null;
    this._npcTimer         = null;
    this._escalationTimers = [];
  }

  _setNpcInterval(ms) {
    if (this._npcTimer) this._npcTimer.remove();
    this._npcTimer = this._scene.time.addEvent({
      delay: ms,
      loop: true,
      callback: () => this._spawn('npc', NPC_SPAWN),
    });
  }

  async _spawn(team, config) {
    let path;
    const lanes = this._mapPaths?.[team];
    if (lanes?.length > 0) {
      path = lanes[Math.floor(Math.random() * lanes.length)];
    } else {
      path = await this._pathfinding.findPath(
        config.col, config.row, config.targetCol, config.targetRow
      );
    }
    if (path && path.length > 1) this._onSpawn(team, path);
  }
}
