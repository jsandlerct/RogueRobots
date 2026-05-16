import { COLS, ROWS, TILE_SIZE, HUD_PAD, BOARD_W, BOARD_H, DEPTH_HUD } from '../data/constants.js';

const STYLE     = { fontSize: '13px', color: '#ffffff', fontFamily: 'monospace' };
const RES_STYLE = { fontSize: '11px', color: '#ffdd88', fontFamily: 'monospace', align: 'right' };
const TMR_STYLE = { fontSize: '13px', color: '#ccccff', fontFamily: 'monospace' };

export default class HUD {
  constructor(scene) {
    this._npcHpText    = scene.add.text(HUD_PAD, HUD_PAD, '', STYLE).setDepth(DEPTH_HUD);
    this._playerHpText = scene.add.text(HUD_PAD, BOARD_H - 20 - HUD_PAD, '', STYLE).setDepth(DEPTH_HUD);
    this._resourceText = scene.add.text(BOARD_W - HUD_PAD, HUD_PAD, '', RES_STYLE)
      .setOrigin(1, 0).setDepth(DEPTH_HUD);
    this._timerText    = scene.add.text(BOARD_W / 2, HUD_PAD, '0:00', TMR_STYLE)
      .setOrigin(0.5, 0).setDepth(DEPTH_HUD);
  }

  updateBaseHp(baseHp) {
    this._npcHpText.setText(`NPC HP: ${baseHp.npc}`);
    this._playerHpText.setText(`Your HP: ${baseHp.player}`);
  }

  updateResources(res) {
    this._resourceText.setText(`M:${res.metal}  Si:${res.silicon}  B:${res.batteries}`);
  }

  updateTimer(elapsedMs) {
    const totalSecs = Math.floor(elapsedMs / 1000);
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    this._timerText.setText(`${mins}:${String(secs).padStart(2, '0')}`);
  }
}
