import {
  BOARD_W, BOARD_H, BOARD_OFFSET_X, BOARD_OFFSET_Y,
  HUD_PAD, DEPTH_HUD,
} from '../data/constants.js';

const HP_STYLE    = { fontSize: '13px', color: '#ffffff', fontFamily: 'monospace' };
const TIMER_STYLE = { fontSize: '13px', color: '#ccccff', fontFamily: 'monospace' };

export default class HUD {
  constructor(scene) {
    // NPC HP — left side panel, near NPC base (top-left corner)
    this._npcHpText = scene.add.text(4, BOARD_OFFSET_Y + 4, '', {
      fontSize: '10px', color: '#ff9999', fontFamily: 'monospace', align: 'center',
      wordWrap: { width: 56 },
    }).setDepth(DEPTH_HUD);

    // Player HP — bottom-left inside the board
    this._playerHpText = scene.add.text(
      BOARD_OFFSET_X + HUD_PAD,
      BOARD_OFFSET_Y + BOARD_H - 20 - HUD_PAD,
      '', HP_STYLE,
    ).setDepth(DEPTH_HUD);

    // Player resources — right side panel, above player base (bottom-right corner)
    this._resourceText = scene.add.text(
      BOARD_OFFSET_X + BOARD_W + 4,
      BOARD_OFFSET_Y + BOARD_H - 72,
      '', { fontSize: '10px', color: '#ffdd88', fontFamily: 'monospace' },
    ).setDepth(DEPTH_HUD);

    // Timer — top-centre of board
    this._timerText = scene.add.text(
      BOARD_OFFSET_X + BOARD_W / 2,
      BOARD_OFFSET_Y + HUD_PAD,
      '0:00', TIMER_STYLE,
    ).setOrigin(0.5, 0).setDepth(DEPTH_HUD);
  }

  updateBaseHp(baseHp) {
    this._npcHpText.setText(`NPC\nHP:${baseHp.npc}`);
    this._playerHpText.setText(`Your HP: ${baseHp.player}`);
  }

  updateResources(res) {
    this._resourceText.setText(`M:${res.metal}\nSi:${res.silicon}\nB:${res.batteries}`);
  }

  updateTimer(elapsedMs) {
    const totalSecs = Math.floor(elapsedMs / 1000);
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    this._timerText.setText(`${mins}:${String(secs).padStart(2, '0')}`);
  }
}
