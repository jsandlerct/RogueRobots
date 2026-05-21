import {
  TILE_SIZE, BOARD_OFFSET_X, BOARD_OFFSET_Y, MOVE_MS, UNIT_SIZE,
  NPC_UNIT_TINT, TEAM_BORDER_COLOR, TEAM_BORDER_PX,
  DEPTH_UNIT_SPRITE, DEPTH_UNIT_OUTLINE,
} from '../data/constants.js';
import Settings from '../data/Settings.js';
import unitsData from '../data/units.json';
import { UNIT_SPRITE_KEY, UNIT_SPRITE_TINT } from '../data/spriteData.js';

export default class Unit {
  constructor(scene, col, row, unitName, team) {
    this.scene = scene;
    this.col   = col;
    this.row   = row;
    this.team  = team;
    this.alive = true;
    this.paused = false;
    this.atBase = false;

    this.stats = unitsData.find(u => u.name === unitName);
    this.hp    = this.stats.hp;
    this.maxHp = this.stats.hp;

    const cx       = BOARD_OFFSET_X + col * TILE_SIZE + TILE_SIZE / 2;
    const cy       = BOARD_OFFSET_Y + row * TILE_SIZE + TILE_SIZE / 2;
    const atlasKey = UNIT_SPRITE_KEY[unitName];

    if (atlasKey && scene.textures.exists(atlasKey)) {
      this.sprite = scene.add.sprite(cx, cy, atlasKey, 'walk_0')
        .setDisplaySize(UNIT_SIZE, UNIT_SIZE)
        .setDepth(DEPTH_UNIT_SPRITE);

      if (team === 'npc') {
        this.sprite.setTint(NPC_UNIT_TINT);
      } else if (UNIT_SPRITE_TINT[unitName] !== undefined) {
        this.sprite.setTint(UNIT_SPRITE_TINT[unitName]);
      }
      if (this.stats.moveSpeed === 'none') {
        this.sprite.setFrame('walk_0');
      } else {
        this.sprite.play(`${atlasKey}_walk`);
      }

      if (this.sprite.preFX && !this.stats.hideOutline) {
        this.sprite.preFX.addOutline(TEAM_BORDER_PX, TEAM_BORDER_COLOR[team]);
      }

      this._teamRect  = null;
      this._useSprite = true;
    } else {
      // Fallback: colored rectangle with team-color stroke.
      const unitColor = parseInt(this.stats.color.slice(1), 16);
      this.sprite = scene.add.rectangle(cx, cy, UNIT_SIZE, UNIT_SIZE, unitColor)
        .setStrokeStyle(TEAM_BORDER_PX, TEAM_BORDER_COLOR[team])
        .setDepth(DEPTH_UNIT_SPRITE);
      this._teamRect  = null;
      this._useSprite = false;
    }

    this._atlasKey       = atlasKey;
    this._path           = null;
    this._pathIndex      = 0;
    this._tween          = null;
    this._inTween        = false;
    this._tweenWasPaused = false;
    this._lastAtkTime    = 0;

    this.onPathComplete = null;
    this.onTileEntered  = null;
  }

  followPath(path) {
    this._path      = path;
    this._pathIndex = 0;
    this._step();
  }

  _step() {
    if (!this.alive) return;
    if (!this._path || this._pathIndex >= this._path.length - 1) {
      if (this._path) {
        this.atBase = true;
        if (this.onPathComplete) this.onPathComplete(this);
      }
      return;
    }
    if (this.paused) return;

    this._pathIndex++;
    const next     = this._path[this._pathIndex];
    const duration = MOVE_MS[this.stats.moveSpeed] ?? 300;

    if (this._useSprite && next.x !== this.col) {
      this.sprite.setFlipX(next.x < this.col);
    }

    this._inTween = true;
    this._tween   = this.scene.tweens.add({
      targets:  this.sprite,
      x:        BOARD_OFFSET_X + next.x * TILE_SIZE + TILE_SIZE / 2,
      y:        BOARD_OFFSET_Y + next.y * TILE_SIZE + TILE_SIZE / 2,
      duration,
      ease:     'Linear',
      onComplete: () => {
        this._inTween        = false;
        this._tweenWasPaused = false;
        this.col = next.x;
        this.row = next.y;
        if (this.onTileEntered) this.onTileEntered(this.col, this.row);
        this._step();
      },
    });
  }

  pause() {
    if (this.paused) return;
    this.paused          = true;
    this._tweenWasPaused = false;
    if (this._inTween && this._tween) {
      this._tween.pause();
      this._tweenWasPaused = true;
    }
    if (this._useSprite && this._atlasKey) {
      this.sprite.play(`${this._atlasKey}_attack`);
    }
  }

  resume() {
    if (!this.paused) return;
    this.paused = false;
    if (this._useSprite && this._atlasKey) {
      if (this.stats.moveSpeed === 'none') {
        this.sprite.stop().setFrame('walk_0');
      } else {
        this.sprite.play(`${this._atlasKey}_walk`);
      }
    }
    if (this._tweenWasPaused && this._tween) {
      this._tween.resume();
      this._tweenWasPaused = false;
    } else if (this._path) {
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

    if (Settings.sfxOn) {
      const n = this.stats.name;
      if (n === 'Bug') {
        this.scene.sound.play('sfx_clap',       { volume: 0.6 });
      } else if (n === 'Wallbot' || n === 'Datamine' || n === 'Server') {
        this.scene.sound.play('sfx_metal_crash', { volume: 0.6 });
      } else if (n !== 'Spambot') {
        this.scene.sound.play('sfx_wilhelm',     { volume: 0.4 });
      }
    }

    if (this._useSprite && this._atlasKey && this.sprite) {
      this.sprite.play(`${this._atlasKey}_die`);
      this.sprite.once('animationcomplete', () => {
        if (this.sprite) { this.sprite.destroy(); this.sprite = null; }
      });
    } else {
      if (this.sprite) { this.sprite.destroy(); this.sprite = null; }
    }
  }
}
