import {
  TILE_SIZE, BOARD_W, BOARD_H, BOARD_OFFSET_X, BOARD_OFFSET_Y,
  SIDE_PANEL_W, NPC_BASE_ROW, PLAYER_BASE_ROW,
  HUD_PAD, DEPTH_HUD,
} from '../data/constants.js';

const TIMER_STYLE = { fontSize: '13px', color: '#ccccff', fontFamily: 'monospace' };

// Vertical centre of a board tile row in canvas pixels
const tileY = (row) => BOARD_OFFSET_Y + row * TILE_SIZE + TILE_SIZE / 2;

// Horizontal centre of each side panel
const LEFT_PANEL_CX  = SIDE_PANEL_W / 2;
const RIGHT_PANEL_CX = BOARD_OFFSET_X + BOARD_W + SIDE_PANEL_W / 2;

export default class HUD {
  constructor(scene) {
    // NPC HP — left side panel, centred on NPC base tile row
    this._npcHpText = scene.add.text(LEFT_PANEL_CX, tileY(NPC_BASE_ROW), '', {
      fontSize: '11px', color: '#ff9999', fontFamily: 'monospace', align: 'center',
      wordWrap: { width: SIDE_PANEL_W - 4 },
    }).setOrigin(0.5, 0.5).setDepth(DEPTH_HUD);

    // Player HP — right side panel, centred on player base tile row
    this._playerHpText = scene.add.text(RIGHT_PANEL_CX, tileY(PLAYER_BASE_ROW), '', {
      fontSize: '11px', color: '#8899ff', fontFamily: 'monospace', align: 'center',
      wordWrap: { width: SIDE_PANEL_W - 4 },
    }).setOrigin(0.5, 0.5).setDepth(DEPTH_HUD);

    // Player resources — right side panel, a few rows above player base
    this._resourceText = scene.add.text(RIGHT_PANEL_CX, BOARD_OFFSET_Y + BOARD_H - 72, '', {
      fontSize: '10px', color: '#ffdd88', fontFamily: 'monospace', align: 'center',
      wordWrap: { width: SIDE_PANEL_W - 4 },
    }).setOrigin(0.5, 0).setDepth(DEPTH_HUD);

    // Timer — top-centre of board
    this._timerText = scene.add.text(
      BOARD_OFFSET_X + BOARD_W / 2,
      BOARD_OFFSET_Y + HUD_PAD,
      '0:00', TIMER_STYLE,
    ).setOrigin(0.5, 0).setDepth(DEPTH_HUD);
  }

  updateBaseHp(baseHp) {
    this._npcHpText.setText(`HP\n${baseHp.npc}`);
    this._playerHpText.setText(`HP\n${baseHp.player}`);
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
