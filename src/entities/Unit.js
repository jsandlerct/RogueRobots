import { TILE_SIZE } from '../map/archetypes/Serpent.js';
import unitsData from '../data/units.json';

const MOVE_MS = { slow: 500, medium: 300, fast: 150, none: 0 };
const UNIT_SIZE = TILE_SIZE - 10;
const TEAM_COLOR = { player: 0x44cc44, npc: 0xcc4422 };

export default class Unit {
  constructor(scene, col, row, unitName, team) {
    this.scene = scene;
    this.col = col;
    this.row = row;
    this.team = team;
    this.alive = true;
    this.paused = false;
    this.atBase = false;

    this.stats = unitsData.find(u => u.name === unitName);
    this.hp = this.stats.hp;

    const x = col * TILE_SIZE + TILE_SIZE / 2;
    const y = row * TILE_SIZE + TILE_SIZE / 2;
    this.sprite = scene.add.rectangle(x, y, UNIT_SIZE, UNIT_SIZE, TEAM_COLOR[team]);

    this._path = null;
    this._pathIndex = 0;
    this._tween = null;
    this._lastAtkTime = 0;

    // Called when unit arrives at opposing base
    this.onPathComplete = null;
  }

  followPath(path) {
    this._path = path;
    this._pathIndex = 0;
    this._step();
  }

  _step() {
    if (!this.alive) return;
    if (this._pathIndex >= this._path.length - 1) {
      this.atBase = true;
      if (this.onPathComplete) this.onPathComplete(this);
      return;
    }
    if (this.paused) return;

    this._pathIndex++;
    const next = this._path[this._pathIndex];
    const duration = MOVE_MS[this.stats.moveSpeed] ?? 300;

    this._tween = this.scene.tweens.add({
      targets: this.sprite,
      x: next.x * TILE_SIZE + TILE_SIZE / 2,
      y: next.y * TILE_SIZE + TILE_SIZE / 2,
      duration,
      ease: 'Linear',
      onComplete: () => {
        this.col = next.x;
        this.row = next.y;
        this._step();
      },
    });
  }

  pause() {
    if (this.paused) return;
    this.paused = true;
    if (this._tween && this._tween.isPlaying()) {
      this._tween.pause();
    }
  }

  resume() {
    if (!this.paused) return;
    this.paused = false;
    if (this._tween && this._tween.isPaused()) {
      this._tween.resume();
    } else {
      this._step();
    }
  }

  takeDamage(amount) {
    this.hp -= amount;
    if (this.hp <= 0) {
      this.destroy();
      return true;
    }
    return false;
  }

  destroy() {
    this.alive = false;
    if (this._tween) this._tween.stop();
    if (this.sprite) this.sprite.destroy();
  }
}
