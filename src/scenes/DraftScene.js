import Phaser from 'phaser';
import {
  CANVAS_W, CANVAS_H,
  STARTING_RESOURCES, LOADOUT_NUM_SLOTS,
  DRAFT_CARD_W, DRAFT_CARD_H, DRAFT_CARD_PAD, DRAFT_CARD_ROW_Y,
  DRAFT_SLOT_Y, DRAFT_SLOT_W, DRAFT_SLOT_H, DRAFT_SLOT_MARGIN,
  DRAFT_CONFIRM_Y, DRAFT_CONFIRM_BTN_W, DRAFT_CONFIRM_BTN_H,
  DRAFT_COLOR_BG, DRAFT_COLOR_SLOT_EMPTY, DRAFT_COLOR_CONFIRM_BG,
} from '../data/constants.js';
import unitsData from '../data/units.json';

// Grunt auto-spawns for both teams — it is not a player-deployable unit
const AVAILABLE = unitsData.filter(u => u.unlockLevel === 1 && u.name !== 'Grunt');

const CARD_COL_X   = [DRAFT_CARD_PAD, DRAFT_CARD_W + DRAFT_CARD_PAD * 2];
const SLOT_TOTAL_W = LOADOUT_NUM_SLOTS * (DRAFT_SLOT_W + DRAFT_SLOT_MARGIN);
const SLOT_START_X = (CANVAS_W - SLOT_TOTAL_W) / 2;

export default class DraftScene extends Phaser.Scene {
  constructor() {
    super({ key: 'DraftScene' });
  }

  create() {
    this._counts      = {};
    AVAILABLE.forEach(u => { this._counts[u.name] = 0; });

    this._slotRects  = [];
    this._slotLabels = [];
    this._countTexts = {};
    this._confirmBtn = null;

    this._buildBackground();
    this._buildHeader();
    this._buildUnitCards();
    this._buildLoadoutSlots();
    this._buildConfirmButton();
    this._refresh();
  }

  _buildBackground() {
    this.add.rectangle(CANVAS_W / 2, CANVAS_H / 2, CANVAS_W, CANVAS_H, DRAFT_COLOR_BG).setDepth(0);
  }

  _buildHeader() {
    const cx = CANVAS_W / 2;
    this.add.text(cx, 22, 'ROGUE ROBOTS', {
      fontSize: '22px', color: '#ffffff', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5, 0);

    this.add.text(cx, 52, 'DRAFT YOUR LOADOUT', {
      fontSize: '14px', color: '#aaaacc', fontFamily: 'monospace',
    }).setOrigin(0.5, 0);

    const resStr =
      `Starting Resources:  M:${STARTING_RESOURCES.metal}` +
      `  Si:${STARTING_RESOURCES.silicon}` +
      `  B:${STARTING_RESOURCES.batteries}`;
    this.add.text(cx, 78, resStr, {
      fontSize: '11px', color: '#ffdd88', fontFamily: 'monospace',
    }).setOrigin(0.5, 0);

    this.add.text(cx, 108, '── SELECT UNITS (Lvl 1 unlocked) ──', {
      fontSize: '10px', color: '#556677', fontFamily: 'monospace',
    }).setOrigin(0.5, 0);
  }

  _buildUnitCards() {
    AVAILABLE.forEach((unit, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const x   = CARD_COL_X[col];
      const y   = DRAFT_CARD_ROW_Y[row];

      const cardColor = parseInt(unit.color.slice(1), 16);
      this.add.rectangle(x + DRAFT_CARD_W / 2, y + DRAFT_CARD_H / 2, DRAFT_CARD_W, DRAFT_CARD_H, cardColor)
        .setDepth(1);

      this.add.text(x + 8, y + 8, unit.name.toUpperCase(), {
        fontSize: '11px', color: '#eeeeff', fontFamily: 'monospace', fontStyle: 'bold',
      }).setDepth(2);

      const stats = `HP:${unit.hp}  Dmg:${unit.dmg}  Rng:${unit.range}  Arm:${unit.armor}`;
      this.add.text(x + 8, y + 28, stats, {
        fontSize: '9px', color: '#99aacc', fontFamily: 'monospace',
      }).setDepth(2);

      const { metal: m, silicon: s, batteries: b } = unit.cost;
      const costStr = [m ? `M:${m}` : '', s ? `Si:${s}` : '', b ? `B:${b}` : '']
        .filter(Boolean).join('  ') || 'Free';
      this.add.text(x + 8, y + 46, `Cost: ${costStr}`, {
        fontSize: '9px', color: '#ffdd88', fontFamily: 'monospace',
      }).setDepth(2);

      const btnMinus = this.add.text(x + 60, y + 72, '[ - ]', {
        fontSize: '12px', color: '#cc4444', fontFamily: 'monospace',
      }).setDepth(2).setInteractive({ useHandCursor: true });
      btnMinus.on('pointerdown', () => this._decrement(unit.name));

      const countTxt = this.add.text(x + 105, y + 72, '0', {
        fontSize: '12px', color: '#ffffff', fontFamily: 'monospace',
      }).setOrigin(0.5, 0).setDepth(2);
      this._countTexts[unit.name] = countTxt;

      const btnPlus = this.add.text(x + 148, y + 72, '[ + ]', {
        fontSize: '12px', color: '#44cc44', fontFamily: 'monospace',
      }).setDepth(2).setInteractive({ useHandCursor: true });
      btnPlus.on('pointerdown', () => this._increment(unit.name));
    });
  }

  _buildLoadoutSlots() {
    this.add.text(CANVAS_W / 2, DRAFT_SLOT_Y - 24, '── YOUR LOADOUT ──', {
      fontSize: '10px', color: '#556677', fontFamily: 'monospace',
    }).setOrigin(0.5, 0);

    for (let i = 0; i < LOADOUT_NUM_SLOTS; i++) {
      const x = SLOT_START_X + i * (DRAFT_SLOT_W + DRAFT_SLOT_MARGIN);

      const bg = this.add.rectangle(
        x + DRAFT_SLOT_W / 2, DRAFT_SLOT_Y + DRAFT_SLOT_H / 2,
        DRAFT_SLOT_W, DRAFT_SLOT_H, DRAFT_COLOR_SLOT_EMPTY
      ).setDepth(1).setInteractive({ useHandCursor: true });
      bg.on('pointerdown', () => this._removeSlot(i));

      const lbl = this.add.text(x + DRAFT_SLOT_W / 2, DRAFT_SLOT_Y + DRAFT_SLOT_H / 2, '', {
        fontSize: '7px', color: '#aaaacc', fontFamily: 'monospace', align: 'center',
        wordWrap: { width: DRAFT_SLOT_W - 4 },
      }).setOrigin(0.5).setDepth(2);

      this._slotRects.push(bg);
      this._slotLabels.push(lbl);
    }
  }

  _buildConfirmButton() {
    this.add.rectangle(
      CANVAS_W / 2, DRAFT_CONFIRM_Y + DRAFT_CONFIRM_BTN_H / 2,
      DRAFT_CONFIRM_BTN_W, DRAFT_CONFIRM_BTN_H, DRAFT_COLOR_CONFIRM_BG
    ).setDepth(1);
    this._confirmBtn = this.add.text(
      CANVAS_W / 2, DRAFT_CONFIRM_Y + DRAFT_CONFIRM_BTN_H / 2, 'CONFIRM  ▶', {
        fontSize: '14px', color: '#ffffff', fontFamily: 'monospace', fontStyle: 'bold',
      }
    ).setOrigin(0.5).setDepth(2).setInteractive({ useHandCursor: true });
    this._confirmBtn.on('pointerdown', () => this._confirm());
  }

  get _total() { return Object.values(this._counts).reduce((a, b) => a + b, 0); }

  _loadout() {
    const result = [];
    for (const u of AVAILABLE) {
      for (let i = 0; i < this._counts[u.name]; i++) result.push(u.name);
    }
    return result;
  }

  _increment(name) {
    if (this._total >= LOADOUT_NUM_SLOTS) return;
    this._counts[name]++;
    this._refresh();
  }

  _decrement(name) {
    if (this._counts[name] <= 0) return;
    this._counts[name]--;
    this._refresh();
  }

  _removeSlot(index) {
    const loadout = this._loadout();
    if (index >= loadout.length) return;
    const removed = loadout[index];
    this._counts[removed]--;
    this._refresh();
  }

  _confirm() {
    if (this._total === 0) return;
    this.scene.start('GameScene', { loadout: this._loadout() });
  }

  _refresh() {
    for (const [name, txt] of Object.entries(this._countTexts)) {
      txt.setText(String(this._counts[name]));
    }

    const loadout = this._loadout();
    for (let i = 0; i < LOADOUT_NUM_SLOTS; i++) {
      const filled = i < loadout.length;
      if (filled) {
        const stats = unitsData.find(u => u.name === loadout[i]);
        this._slotRects[i].setFillStyle(parseInt(stats.color.slice(1), 16));
      } else {
        this._slotRects[i].setFillStyle(DRAFT_COLOR_SLOT_EMPTY);
      }
      this._slotLabels[i].setText(filled ? loadout[i].replace(' ', '\n') : '');
    }

    const canConfirm = this._total > 0;
    this._confirmBtn.setColor(canConfirm ? '#ffffff' : '#555566');
  }
}
