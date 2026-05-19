import Phaser from 'phaser';
import {
  TILE_SIZE, BOARD_OFFSET_X, BOARD_OFFSET_Y,
  COLS, ROWS, TILE_WALKABLE, DIVIDE_ROW,
  PLAYER_BASE_COL, PLAYER_BASE_ROW,
  POWERUP_DROP_INTERVAL_MS, POWERUP_DROP_CHANCE, POWERUP_TYPES,
  POWERUP_TOKEN_SIZE, DEPTH_POWERUP_TOKEN,
} from '../data/constants.js';

// Map pickup — shown as "?" until collected into a slot.
class PowerupToken {
  constructor(scene, col, row, powerupType) {
    this.col         = col;
    this.row         = row;
    this.type        = 'powerup';
    this.powerupType = powerupType;
    this.alive       = true;

    const x = BOARD_OFFSET_X + col * TILE_SIZE + TILE_SIZE / 2;
    const y = BOARD_OFFSET_Y + row * TILE_SIZE + TILE_SIZE / 2;

    this._bg = scene.add.rectangle(x, y, POWERUP_TOKEN_SIZE, POWERUP_TOKEN_SIZE, 0x220044)
      .setStrokeStyle(2, 0xbb66ff).setDepth(DEPTH_POWERUP_TOKEN);
    this._label = scene.add.text(x, y, '?', {
      fontSize: '13px', color: '#cc88ff', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(DEPTH_POWERUP_TOKEN + 1);
  }

  collect() {
    this.alive = false;
    this._bg.destroy();
    this._label.destroy();
  }
}

export default class PowerupSystem {
  constructor(scene, opts) {
    this._scene     = scene;
    this._grid      = opts.grid;
    this._getTokens = opts.getTokens;  // () => tokens[]  (shared array ref)
    this._addToken  = opts.addToken;   // (token) => void

    this._slots = [null, null, null];  // null | powerup-type string

    scene.time.addEvent({
      delay: POWERUP_DROP_INTERVAL_MS,
      loop: true,
      callback: this._tryDrop,
      callbackScope: this,
    });
  }

  get slots() { return this._slots; }

  hasSlotsAvailable() {
    return this._slots.some(s => s === null);
  }

  // Called by GameScene when a player unit collects a powerup map token.
  collectFromMap(powerupType) {
    const i = this._slots.indexOf(null);
    if (i === -1) return false;
    this._slots[i] = powerupType;
    return true;
  }

  // Called by PowerupBar when a slot is tapped. Returns consumed type or null.
  consume(slotIndex) {
    const type = this._slots[slotIndex];
    if (!type) return null;
    this._slots[slotIndex] = null;
    return type;
  }

  _tryDrop() {
    if (this._scene._roundOver) return;
    if (!this.hasSlotsAvailable()) return;
    if (Math.random() > POWERUP_DROP_CHANCE) return;

    const occupied = new Set(
      this._getTokens().filter(t => t.alive).map(t => `${t.col},${t.row}`)
    );
    const candidates = [];
    for (let r = DIVIDE_ROW; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (this._grid[r][c] !== TILE_WALKABLE) continue;
        if (c === PLAYER_BASE_COL && r === PLAYER_BASE_ROW) continue;
        if (occupied.has(`${c},${r}`)) continue;
        candidates.push({ col: c, row: r });
      }
    }
    if (candidates.length === 0) return;

    const tile = Phaser.Utils.Array.GetRandom(candidates);
    const type = POWERUP_TYPES[Math.floor(Math.random() * POWERUP_TYPES.length)];
    this._addToken(new PowerupToken(this._scene, tile.col, tile.row, type));
  }
}
