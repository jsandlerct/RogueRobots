import Phaser from 'phaser';
import Serpent, { COLS, ROWS, TILE_SIZE } from '../map/archetypes/Serpent.js';
import PathfindingSystem from '../systems/PathfindingSystem.js';
import SpawnSystem from '../systems/SpawnSystem.js';
import CombatSystem from '../systems/CombatSystem.js';
import EconomySystem from '../systems/EconomySystem.js';
import HUD from '../ui/HUD.js';
import Unit from '../entities/Unit.js';

const COLOR_WALL         = 0x1e1e2e;
const COLOR_PATH_NPC     = 0x3a4a5a;
const COLOR_PATH_PLAYER  = 0x2a4a3a;
const COLOR_NPC_BASE     = 0xcc3333;
const COLOR_PLAYER_BASE  = 0x3366cc;
const COLOR_DIVIDE       = 0xffee00;

const DIVIDE_ROW      = 8;
const NPC_BASE_COL    = 0;  const NPC_BASE_ROW    = 0;
const PLAYER_BASE_COL = 11; const PLAYER_BASE_ROW = 15;

export default class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  create() {
    const serpent = new Serpent();
    this._grid = serpent.getGrid();

    this._renderGrid(this._grid);
    this._renderDivideLine();
    this._renderBaseLabels();

    this.units = [];

    this._economy = new EconomySystem();
    this._combat = new CombatSystem(
      this,
      this._economy,
      (baseHp) => this._hud.updateBaseHp(baseHp),
      (winner) => this._onRoundEnd(winner)
    );

    this._hud = new HUD(this);
    this._hud.updateBaseHp(this._combat.baseHp);

    this._pathfinding = new PathfindingSystem(this._grid);
    this._spawnSystem = new SpawnSystem(this, this._pathfinding, (team, path) => {
      this._onUnitSpawned(team, path);
    });
    this._spawnSystem.start();
  }

  update() {
    this._combat.update();
  }

  _onUnitSpawned(team, path) {
    const unit = new Unit(this, path[0].x, path[0].y, 'Grunt', team);
    unit.followPath(path);
    this._combat.addUnit(unit);
    this.units.push(unit);
  }

  _onRoundEnd(winner) {
    this._spawnSystem.stop();

    const boardW = COLS * TILE_SIZE;
    const boardH = ROWS * TILE_SIZE;
    const msg = winner === 'player' ? 'YOU WIN!' : 'YOU LOSE!';
    const color = winner === 'player' ? '#44ff44' : '#ff4444';

    this.add.rectangle(boardW / 2, boardH / 2, 220, 60, 0x000000, 0.8)
      .setDepth(20);
    this.add.text(boardW / 2, boardH / 2, msg, {
      fontSize: '28px', color, fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(21);
  }

  _renderGrid(grid) {
    const gfx = this.add.graphics();
    const pad = 1;

    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        const x = col * TILE_SIZE;
        const y = row * TILE_SIZE;
        const isNpcBase    = col === NPC_BASE_COL    && row === NPC_BASE_ROW;
        const isPlayerBase = col === PLAYER_BASE_COL && row === PLAYER_BASE_ROW;
        const isPath = grid[row][col] === 1;

        let color;
        if (isNpcBase)         color = COLOR_NPC_BASE;
        else if (isPlayerBase) color = COLOR_PLAYER_BASE;
        else if (isPath)       color = row < DIVIDE_ROW ? COLOR_PATH_NPC : COLOR_PATH_PLAYER;
        else                   color = COLOR_WALL;

        gfx.fillStyle(color, 1);
        gfx.fillRect(x + pad, y + pad, TILE_SIZE - pad * 2, TILE_SIZE - pad * 2);
      }
    }
  }

  _renderDivideLine() {
    const gfx = this.add.graphics();
    gfx.lineStyle(2, COLOR_DIVIDE, 0.85);
    gfx.lineBetween(0, DIVIDE_ROW * TILE_SIZE, COLS * TILE_SIZE, DIVIDE_ROW * TILE_SIZE);
  }

  _renderBaseLabels() {
    const style = { fontSize: '9px', color: '#ffffff', fontFamily: 'monospace', align: 'center' };

    this.add.text(
      NPC_BASE_COL * TILE_SIZE + TILE_SIZE / 2,
      NPC_BASE_ROW * TILE_SIZE + TILE_SIZE / 2,
      'NPC\nBASE', style
    ).setOrigin(0.5);

    this.add.text(
      PLAYER_BASE_COL * TILE_SIZE + TILE_SIZE / 2,
      PLAYER_BASE_ROW * TILE_SIZE + TILE_SIZE / 2,
      'YOUR\nBASE', style
    ).setOrigin(0.5);
  }
}
