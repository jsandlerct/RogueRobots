import Phaser from 'phaser';
import {
  CANVAS_W, CANVAS_H,
  STARTING_RESOURCES, LOADOUT_NUM_SLOTS,
  DRAFT_CARD_W, DRAFT_CARD_H, DRAFT_CARD_PAD, DRAFT_CARD_ROW_Y,
  DRAFT_SLOT_Y, DRAFT_SLOT_W, DRAFT_SLOT_H, DRAFT_SLOT_MARGIN,
  DRAFT_CONFIRM_Y, DRAFT_CONFIRM_BTN_W, DRAFT_CONFIRM_BTN_H,
  DRAFT_COLOR_BG, DRAFT_COLOR_SLOT_EMPTY, DRAFT_COLOR_CONFIRM_BG, DRAFT_COLOR_LOCKED,
} from '../data/constants.js';
import unitsData from '../data/units.json';
import { UNIT_SPRITE_KEY } from '../data/spriteData.js';

// Grunt auto-spawns for both teams — never in the draft pool
const AVAILABLE = unitsData.filter(u => u.unlockLevel === 1 && u.name !== 'Grunt');

// 5 rows × 4 cols = 20 total slots; slots beyond AVAILABLE.length show as LOCKED
const TOTAL_SLOTS = 20;
const COLS        = 4;

// X left-edge of each column
const CARD_COL_X = Array.from({ length: COLS }, (_, c) =>
  DRAFT_CARD_PAD + c * (DRAFT_CARD_W + DRAFT_CARD_PAD)
);

const SLOT_TOTAL_W = LOADOUT_NUM_SLOTS * (DRAFT_SLOT_W + DRAFT_SLOT_MARGIN);
const SLOT_START_X = (CANVAS_W - SLOT_TOTAL_W) / 2;

export default class DraftScene extends Phaser.Scene {
  constructor() {
    super({ key: 'DraftScene' });
  }

  create() {
    this._counts      = {};
    AVAILABLE.forEach(u => { this._counts[u.name] = 0; });

    this._slotRects   = [];
    this._slotLabels  = [];
    this._countTexts  = {};
    this._confirmBtn  = null;
    this._cardSprites = [];

    this._buildBackground();
    this._buildHeader();
    this._buildUnitCards();
    this._buildLoadoutSlots();
    this._buildConfirmButton();
    this._refresh();
    this._startCardAnimCycle();
  }

  _buildBackground() {
    this.add.rectangle(CANVAS_W / 2, CANVAS_H / 2, CANVAS_W, CANVAS_H, DRAFT_COLOR_BG).setDepth(0);
  }

  _buildHeader() {
    const cx = CANVAS_W / 2;
    this.add.text(cx, 14, 'ROGUE ROBOTS', {
      fontSize: '20px', color: '#ffffff', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5, 0);

    this.add.text(cx, 42, 'DRAFT YOUR LOADOUT', {
      fontSize: '13px', color: '#aaaacc', fontFamily: 'monospace',
    }).setOrigin(0.5, 0);

    const resStr =
      `Starting Resources:  M:${STARTING_RESOURCES.metal}` +
      `  Si:${STARTING_RESOURCES.silicon}` +
      `  B:${STARTING_RESOURCES.batteries}`;
    this.add.text(cx, 64, resStr, {
      fontSize: '10px', color: '#ffdd88', fontFamily: 'monospace',
    }).setOrigin(0.5, 0);

    this.add.text(cx, 86, '── SELECT UNITS (Lvl 1 unlocked) ──', {
      fontSize: '9px', color: '#556677', fontFamily: 'monospace',
    }).setOrigin(0.5, 0);
  }

  _buildUnitCards() {
    for (let i = 0; i < TOTAL_SLOTS; i++) {
      const col  = i % COLS;
      const row  = Math.floor(i / COLS);
      const x    = CARD_COL_X[col];
      const y    = DRAFT_CARD_ROW_Y[row];
      const unit = AVAILABLE[i] ?? null;

      if (!unit) {
        // Empty future slot — plain LOCKED box
        this.add.rectangle(x + DRAFT_CARD_W / 2, y + DRAFT_CARD_H / 2, DRAFT_CARD_W, DRAFT_CARD_H, DRAFT_COLOR_LOCKED)
          .setDepth(1);
        this.add.text(x + DRAFT_CARD_W / 2, y + DRAFT_CARD_H / 2, 'LOCKED', {
          fontSize: '11px', color: '#333344', fontFamily: 'monospace', fontStyle: 'bold',
        }).setOrigin(0.5).setDepth(2);
        continue;
      }

      // Available unit card
      const cardColor = parseInt(unit.color.slice(1), 16);
      this.add.rectangle(x + DRAFT_CARD_W / 2, y + DRAFT_CARD_H / 2, DRAFT_CARD_W, DRAFT_CARD_H, cardColor)
        .setDepth(1);

      // Animated sprite — right side, vertically centred
      const atlasKey = UNIT_SPRITE_KEY[unit.name];
      if (atlasKey && this.textures.exists(atlasKey)) {
        const spr = this.add.sprite(x + DRAFT_CARD_W - 26, y + DRAFT_CARD_H / 2, atlasKey, 'walk_0')
          .setDisplaySize(48, 48)
          .setDepth(2);
        spr.play(`${atlasKey}_walk`);
        this._cardSprites.push({ spr, atlasKey });
      }

      this.add.text(x + 6, y + 5, unit.name.toUpperCase(), {
        fontSize: '9px', color: '#eeeeff', fontFamily: 'monospace', fontStyle: 'bold',
      }).setDepth(3);

      const stats = `${unit.hp}HP ${unit.dmg}D ${unit.range}R ${unit.armor}A`;
      this.add.text(x + 6, y + 18, stats, {
        fontSize: '8px', color: '#99aacc', fontFamily: 'monospace',
      }).setDepth(3);

      const { metal: m, silicon: s, batteries: b } = unit.cost;
      const costStr = [m ? `M:${m}` : '', s ? `Si:${s}` : '', b ? `B:${b}` : '']
        .filter(Boolean).join(' ') || 'Free';
      this.add.text(x + 6, y + 29, costStr, {
        fontSize: '8px', color: '#ffdd88', fontFamily: 'monospace',
      }).setDepth(3);

      const btnMinus = this.add.text(x + 6, y + 44, '[-]', {
        fontSize: '10px', color: '#cc4444', fontFamily: 'monospace',
      }).setDepth(3).setInteractive({ useHandCursor: true });
      btnMinus.on('pointerdown', () => this._decrement(unit.name));

      const countTxt = this.add.text(x + 40, y + 44, '0', {
        fontSize: '10px', color: '#ffffff', fontFamily: 'monospace',
      }).setOrigin(0.5, 0).setDepth(3);
      this._countTexts[unit.name] = countTxt;

      const btnPlus = this.add.text(x + 58, y + 44, '[+]', {
        fontSize: '10px', color: '#44cc44', fontFamily: 'monospace',
      }).setDepth(3).setInteractive({ useHandCursor: true });
      btnPlus.on('pointerdown', () => this._increment(unit.name));
    }
  }

  _startCardAnimCycle() {
    if (this._cardSprites.length === 0) return;
    const playWalk   = () => this._cardSprites.forEach(({ spr, atlasKey }) => spr.play(`${atlasKey}_walk`));
    const playAttack = () => this._cardSprites.forEach(({ spr, atlasKey }) => spr.play(`${atlasKey}_attack`));
    const schedule = () => {
      this.time.delayedCall(2500, () => {
        playAttack();
        this.time.delayedCall(2000, () => { playWalk(); schedule(); });
      });
    };
    schedule();
  }

  _buildLoadoutSlots() {
    this.add.text(CANVAS_W / 2, DRAFT_SLOT_Y - 22, '── YOUR LOADOUT ──', {
      fontSize: '9px', color: '#556677', fontFamily: 'monospace',
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
    this._counts[loadout[index]]--;
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

    this._confirmBtn.setColor(this._total > 0 ? '#ffffff' : '#555566');
  }
}
