import { COLS, ROWS, TILE_SIZE } from '../map/archetypes/Serpent.js';

const STYLE = { fontSize: '13px', color: '#ffffff', fontFamily: 'monospace' };
const PADDING = 4;

export default class HUD {
  constructor(scene) {
    this._scene = scene;

    const boardW = COLS * TILE_SIZE;
    const boardH = ROWS * TILE_SIZE;

    this._npcHpText = scene.add.text(PADDING, PADDING, '', STYLE).setDepth(10);
    this._playerHpText = scene.add.text(PADDING, boardH - 20 - PADDING, '', STYLE).setDepth(10);
  }

  updateBaseHp(baseHp) {
    this._npcHpText.setText(`NPC Base HP: ${baseHp.npc}`);
    this._playerHpText.setText(`Your Base HP: ${baseHp.player}`);
  }
}
