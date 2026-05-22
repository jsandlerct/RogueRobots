import Phaser from 'phaser';
import {
  CANVAS_W, CANVAS_H,
  STARTING_RESOURCES, TESTMODE_RESOURCES, LOADOUT_NUM_SLOTS, TESTMODE,
  FLOOR_RES_MIN_METAL,
  MAX_FLOORS, SECRET_FLOOR,
  DRAFT_CARD_W, DRAFT_CARD_H, DRAFT_CARD_PAD, DRAFT_CARD_ROW_Y,
  DRAFT_SLOT_Y, DRAFT_SLOT_W, DRAFT_SLOT_H, DRAFT_SLOT_MARGIN,
  DRAFT_LOADOUT_BTN_Y, DRAFT_PASSIVE_Y, DRAFT_CONFIRM_Y, DRAFT_CONFIRM_BTN_W, DRAFT_CONFIRM_BTN_H, DRAFT_TESTMODE_Y, DRAFT_AUDIO_Y,
  DRAFT_COLOR_BG, DRAFT_COLOR_SLOT_EMPTY, DRAFT_COLOR_CONFIRM_BG, DRAFT_COLOR_LOCKED,
  DRAFT_SAVE_KEY, DEPTH_DRAG_GHOST,
  PASSIVE_LEVEL_IMPROVED, PASSIVE_LEVEL_ADVANCED, PASSIVE_LEVEL_SUPERIOR,
  PASSIVE_LEVEL_PERFECTED, PASSIVE_LEVEL_ASI,
} from '../data/constants.js';
import unitsData from '../data/units.json';
import Settings from '../data/Settings.js';
import floorsData from '../data/floors.json';
import { UNIT_SPRITE_KEY } from '../data/spriteData.js';

function _rollStartingResources(level) {
  const res  = { metal: FLOOR_RES_MIN_METAL, silicon: 0, batteries: 0 };
  const keys = ['metal', 'silicon', 'batteries'];
  // total = level + 3; guaranteed 3 metal already accounted for, so distribute `level` extra
  for (let i = 0; i < level; i++) res[keys[Math.floor(Math.random() * 3)]]++;
  return res;
}

function _formatSlotName(name) {
  if (name.includes(' ')) return name.replace(' ', '\n');
  if (name.endsWith('bot'))  return name.slice(0, -3)  + '\nbot';
  if (name.endsWith('trap')) return name.slice(0, -4)  + '\ntrap';
  if (name.endsWith('mine')) return name.slice(0, -4)  + '\nmine';
  if (name.endsWith('naut')) return name.slice(0, -4)  + '\nnaut';
  if (name.length > 7) { const m = Math.ceil(name.length / 2); return name.slice(0, m) + '\n' + name.slice(m); }
  return name;
}

// 5 rows × 4 cols = 20 total slots; slots beyond available count show as LOCKED
const TOTAL_SLOTS = 20;
const DRAFT_COLS  = 4;

// X left-edge of each column
const CARD_COL_X = Array.from({ length: DRAFT_COLS }, (_, c) =>
  DRAFT_CARD_PAD + c * (DRAFT_CARD_W + DRAFT_CARD_PAD)
);

const SLOT_TOTAL_W = LOADOUT_NUM_SLOTS * (DRAFT_SLOT_W + DRAFT_SLOT_MARGIN);
const SLOT_START_X = (CANVAS_W - SLOT_TOTAL_W) / 2;

export default class DraftScene extends Phaser.Scene {
  constructor() {
    super({ key: 'DraftScene' });
  }

  init(data) {
    this._testMode   = data?.testMode  ?? (TESTMODE === 1);
    this._testTarget = data?.testTarget ?? null; // 'VictoryScene' | 'TrueVictoryScene' | null
    this._character  = data?.character ?? null;
    this._slotIndex  = data?.slotIndex ?? null;
    this._floor      = data?.floor     ?? 1;
    this._powerupSlots = data?.powerupSlots ?? [null, null, null];
    this._savedLoadout = data?.loadout ?? null;
    this._startingResources = data?.startingResources
      ?? (this._testMode ? TESTMODE_RESOURCES : _rollStartingResources(this._character?.level ?? 1));
  }

  get _unlockedSlots() {
    if (this._testMode) return LOADOUT_NUM_SLOTS;
    if (!this._character) return LOADOUT_NUM_SLOTS;
    return Math.min(this._character.level, LOADOUT_NUM_SLOTS);
  }

  _available() {
    const maxUnlock = this._testMode ? Infinity : (this._character?.level ?? 1);
    return unitsData.filter(u => u.unlockLevel !== null && u.unlockLevel <= maxUnlock && u.name !== 'Bug');
  }

  create() {
    this._counts = {};
    this._available().forEach(u => { this._counts[u.name] = 0; });

    if (this._savedLoadout) {
      for (const name of this._savedLoadout) {
        if (name in this._counts) this._counts[name]++;
      }
      while (this._total > this._unlockedSlots) {
        const keys = Object.keys(this._counts).filter(k => this._counts[k] > 0);
        if (!keys.length) break;
        this._counts[keys[keys.length - 1]]--;
      }
    } else if (!this._testMode && (this._character?.level ?? 0) < 9) {
      let filled = 0;
      for (const u of this._available()) {
        if (filled >= this._unlockedSlots) break;
        this._counts[u.name] = 1;
        filled++;
      }
    }

    this._slotRects    = [];
    this._slotLabels   = [];
    this._slotHitZones = [];
    this._countTexts   = {};
    this._confirmBtn   = null;
    this._cardSprites  = [];

    this._buildBackground();
    this._buildHeader();
    this._buildUnitCards();
    this._buildLoadoutSlots();
    this._buildPassiveInfo();
    this._buildConfirmButton();
    // this._buildTestModeToggle();
    // this._buildFloorDropdown();
    this._buildHelpButton();
    this._buildFeedbackButton();
    this._buildAudioToggles();
    this._refresh();
    this._startCardAnimCycle();
    this._setupDrag();
  }

  _buildBackground() {
    this.add.rectangle(CANVAS_W / 2, CANVAS_H / 2, CANVAS_W, CANVAS_H, DRAFT_COLOR_BG).setDepth(0);
  }

  _buildHeader() {
    const cx = CANVAS_W / 2;

    if (this._testTarget === 'VictoryScene' || this._testTarget === 'TrueVictoryScene') {
      const label = this._testTarget === 'VictoryScene' ? 'FALSE VICTORY SCREEN' : 'TRUE VICTORY SCREEN';
      const color = this._testTarget === 'VictoryScene' ? '#ffcc44' : '#44ffcc';
      this.add.text(cx, 6, `TEST: ${label}`, {
        fontSize: '15px', color, fontFamily: 'monospace', fontStyle: 'bold',
      }).setOrigin(0.5, 0);
      this.add.text(cx, 30, 'Click CONFIRM to jump to this screen', {
        fontSize: '12px', color: '#8899bb', fontFamily: 'monospace',
      }).setOrigin(0.5, 0);
      this.add.text(cx, 110, '── ALL UNITS UNLOCKED (TEST MODE) ──', {
        fontSize: '9px', color: '#ff9900', fontFamily: 'monospace',
      }).setOrigin(0.5, 0);
      return;
    }

    const floorCfg = floorsData.find(f => f.floor === this._floor);
    const aiName   = floorCfg?.ai ?? 'ENEMY';
    const favUnit  = floorCfg?.favoriteUnit ?? '';
    const rawQuote = floorCfg?.quote ?? '';
    const charName = this._character?.name ?? 'Agent';
    const quote    = rawQuote.replace('<player name>', charName);

    const isSecretFloor = this._floor === SECRET_FLOOR;
    const floorLabel = isSecretFloor ? '⚠  HIDDEN FLOOR  ⚠' : `FLOOR ${this._floor} / ${MAX_FLOORS}`;
    const floorColor = isSecretFloor ? '#ff4444' : '#ffffff';
    this.add.text(cx, 6, floorLabel, {
      fontSize: '15px', color: floorColor, fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5, 0);

    this.add.text(cx, 26, `vs ${aiName.toUpperCase()}`, {
      fontSize: '12px', color: isSecretFloor ? '#ff2222' : '#ff9999',
      fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5, 0);

    if (quote) {
      this.add.text(cx, 44, `"${quote}"`, {
        fontSize: '12px', color: '#aabbcc', fontFamily: 'monospace', fontStyle: 'italic',
        align: 'center', wordWrap: { width: CANVAS_W - 24 },
      }).setOrigin(0.5, 0);
    }

    if (favUnit) {
      this.add.text(cx, 70, `Favorite robot: ${favUnit}`, {
        fontSize: '13px', color: '#ffcccc', fontFamily: 'monospace',
      }).setOrigin(0.5, 0);
    }

    const res    = this._startingResources;
    const resStr = `Your starting resources:  Metal: ${res.metal}  Silicon: ${res.silicon}  Batteries: ${res.batteries}`;
    this.add.text(cx, 90, resStr, {
      fontSize: '13px', color: '#ffdd88', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5, 0);

    if (this._testMode) {
      this.add.text(cx, 110, '── ALL UNITS UNLOCKED (TEST MODE) ──', {
        fontSize: '9px', color: '#ff9900', fontFamily: 'monospace',
      }).setOrigin(0.5, 0);
    }
  }

  _buildUnitCards() {
    const available = this._available();
    for (let i = 0; i < TOTAL_SLOTS; i++) {
      const col  = i % DRAFT_COLS;
      const row  = Math.floor(i / DRAFT_COLS);
      const x    = CARD_COL_X[col];
      const y    = DRAFT_CARD_ROW_Y[row];
      const unit = available[i] ?? null;

      if (!unit) {
        this.add.rectangle(x + DRAFT_CARD_W / 2, y + DRAFT_CARD_H / 2, DRAFT_CARD_W, DRAFT_CARD_H, DRAFT_COLOR_LOCKED)
          .setDepth(1);
        this.add.text(x + DRAFT_CARD_W / 2, y + DRAFT_CARD_H / 2, 'LOCKED', {
          fontSize: '11px', color: '#333344', fontFamily: 'monospace', fontStyle: 'bold',
        }).setOrigin(0.5).setDepth(2);
        continue;
      }

      const cardColor = parseInt(unit.color.slice(1), 16);
      const cardBg = this.add.rectangle(x + DRAFT_CARD_W / 2, y + DRAFT_CARD_H / 2, DRAFT_CARD_W, DRAFT_CARD_H, cardColor)
        .setDepth(1);

      const atlasKey = UNIT_SPRITE_KEY[unit.name];
      if (atlasKey && this.textures.exists(atlasKey)) {
        const spr = this.add.sprite(x + DRAFT_CARD_W - 26, y + DRAFT_CARD_H / 2, atlasKey, 'walk_0')
          .setDisplaySize(48, 48)
          .setDepth(2);
        if (unit.moveSpeed !== 'none') {
          spr.play(`${atlasKey}_walk`);
          this._cardSprites.push({ spr, atlasKey });
        }
      }

      this.add.text(x + 6, y + 5, unit.name.toUpperCase(), {
        fontSize: '9px', color: '#eeeeff', fontFamily: 'monospace', fontStyle: 'bold',
      }).setDepth(3);

      const infoIcon = this.add.text(x + DRAFT_CARD_W - 58, y + 4, 'ⓘ', {
        fontSize: '11px', color: '#88aaff', fontFamily: 'monospace',
      }).setDepth(3).setInteractive({ useHandCursor: true });
      infoIcon.on('pointerover', () => infoIcon.setColor('#bbccff'));
      infoIcon.on('pointerout',  () => infoIcon.setColor('#88aaff'));
      infoIcon.on('pointerdown', (ptr, lx, ly, evt) => {
        evt.stopPropagation();
        this._showUnitInfoPopup(unit);
      });

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

      const countTxt = this.add.text(x + DRAFT_CARD_W - 4, y + DRAFT_CARD_H - 4, '0', {
        fontSize: '11px', color: '#ccccee', fontFamily: 'monospace', fontStyle: 'bold',
      }).setOrigin(1, 1).setDepth(3);
      this._countTexts[unit.name] = countTxt;

      this.add.text(x + 6, y + DRAFT_CARD_H - 4, '⠿ drag', {
        fontSize: '7px', color: '#667788', fontFamily: 'monospace',
      }).setOrigin(0, 1).setDepth(3);

      const hitArea = this.add.rectangle(
        x + DRAFT_CARD_W / 2, y + DRAFT_CARD_H / 2, DRAFT_CARD_W, DRAFT_CARD_H, 0, 0
      ).setDepth(2).setInteractive({ useHandCursor: true });
      hitArea.on('pointerover', () => cardBg.setStrokeStyle(2, 0xffffff, 0.5));
      hitArea.on('pointerout',  () => cardBg.setStrokeStyle(0));
      hitArea.on('pointerdown', (ptr, lx, ly, evt) => {
        evt.stopPropagation();
        this._dragCandidate = { unitName: unit.name, startX: ptr.x, startY: ptr.y };
      });
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
    const unlocked  = this._unlockedSlots;
    const rightEdge = SLOT_START_X + SLOT_TOTAL_W;

    this.add.text(CANVAS_W / 2, DRAFT_SLOT_Y - 20, '── drag to add  ·  tap slot to remove ──', {
      fontSize: '11px', color: '#556677', fontFamily: 'monospace',
    }).setOrigin(0.5, 0);

    const btnH    = 22;
    const btnCY   = DRAFT_LOADOUT_BTN_Y;

    const clearBg = this.add.rectangle(SLOT_START_X + 36, btnCY, 72, btnH, 0x1e0808)
      .setStrokeStyle(1, 0x663333).setDepth(2);
    const clearBtn = this.add.text(SLOT_START_X + 36, btnCY, 'Clear', {
      fontSize: '11px', color: '#cc6666', fontFamily: 'monospace',
    }).setOrigin(0.5).setDepth(3).setInteractive({ useHandCursor: true });
    clearBtn.on('pointerover', () => { clearBg.setStrokeStyle(1, 0x994444); clearBtn.setColor('#ff8888'); });
    clearBtn.on('pointerout',  () => { clearBg.setStrokeStyle(1, 0x663333); clearBtn.setColor('#cc6666'); });
    clearBtn.on('pointerdown', () => this._clearLoadout());

    const loadBg = this.add.rectangle(rightEdge - 33, btnCY, 66, btnH, 0x080e1e)
      .setStrokeStyle(1, 0x334466).setDepth(2);
    const loadBtn = this.add.text(rightEdge - 33, btnCY, 'Load', {
      fontSize: '11px', color: '#6688cc', fontFamily: 'monospace',
    }).setOrigin(0.5).setDepth(3).setInteractive({ useHandCursor: true });
    loadBtn.on('pointerover', () => { loadBg.setStrokeStyle(1, 0x5577aa); loadBtn.setColor('#88aaff'); });
    loadBtn.on('pointerout',  () => { loadBg.setStrokeStyle(1, 0x334466); loadBtn.setColor('#6688cc'); });
    loadBtn.on('pointerdown', () => this._loadDraft());

    this._saveBtnBg = this.add.rectangle(rightEdge - 105, btnCY, 66, btnH, 0x080e1e)
      .setStrokeStyle(1, 0x334466).setDepth(2);
    this._saveBtn = this.add.text(rightEdge - 105, btnCY, 'Save', {
      fontSize: '11px', color: '#6688cc', fontFamily: 'monospace',
    }).setOrigin(0.5).setDepth(3).setInteractive({ useHandCursor: true });
    this._saveBtn.on('pointerover', () => { if (!this._saveBtnFlash) { this._saveBtnBg.setStrokeStyle(1, 0x5577aa); this._saveBtn.setColor('#88aaff'); } });
    this._saveBtn.on('pointerout',  () => { if (!this._saveBtnFlash) { this._saveBtnBg.setStrokeStyle(1, 0x334466); this._saveBtn.setColor('#6688cc'); } });
    this._saveBtn.on('pointerdown', () => this._saveDraft());

    for (let i = 0; i < LOADOUT_NUM_SLOTS; i++) {
      const x = SLOT_START_X + i * (DRAFT_SLOT_W + DRAFT_SLOT_MARGIN);
      const isLocked = i >= unlocked;

      const bg = this.add.rectangle(
        x + DRAFT_SLOT_W / 2, DRAFT_SLOT_Y + DRAFT_SLOT_H / 2,
        DRAFT_SLOT_W, DRAFT_SLOT_H,
        isLocked ? DRAFT_COLOR_LOCKED : DRAFT_COLOR_SLOT_EMPTY
      ).setDepth(1);
      if (!isLocked) {
        bg.setInteractive({ useHandCursor: true });
        bg.on('pointerdown', () => this._removeSlot(i));
      }

      const lbl = this.add.text(x + DRAFT_SLOT_W / 2, DRAFT_SLOT_Y + DRAFT_SLOT_H / 2,
        isLocked ? 'LOCK' : '', {
          fontSize: '13px',
          color: isLocked ? '#333344' : '#000000',
          fontFamily: 'monospace', align: 'center',
          wordWrap: { width: DRAFT_SLOT_W - 4 },
        }
      ).setOrigin(0.5).setDepth(2);

      this._slotRects.push(bg);
      this._slotLabels.push(lbl);
      this._slotHitZones.push({ x, y: DRAFT_SLOT_Y, w: DRAFT_SLOT_W, h: DRAFT_SLOT_H });
    }
  }

  _buildConfirmButton() {
    this.add.rectangle(
      CANVAS_W / 2, DRAFT_CONFIRM_Y + DRAFT_CONFIRM_BTN_H / 2,
      DRAFT_CONFIRM_BTN_W, DRAFT_CONFIRM_BTN_H, DRAFT_COLOR_CONFIRM_BG
    ).setDepth(1);
    this._confirmBtn = this.add.text(
      CANVAS_W / 2, DRAFT_CONFIRM_Y + DRAFT_CONFIRM_BTN_H / 2, 'CONFIRM  ▶', {
        fontSize: '17px', color: '#ffffff', fontFamily: 'monospace', fontStyle: 'bold',
      }
    ).setOrigin(0.5).setDepth(2).setInteractive({ useHandCursor: true });
    this._confirmBtn.on('pointerdown', () => this._confirm());
  }

  _buildHelpButton() {
    const btnW = 116; const btnH = 22; const x = CANVAS_W - 8 - btnW; const y = 6;
    const bg = this.add.rectangle(x + btnW / 2, y + btnH / 2, btnW, btnH, 0x0a1422)
      .setStrokeStyle(1, 0x3355779).setDepth(5);
    const btn = this.add.text(x + btnW / 2, y + btnH / 2, '? HOW TO PLAY', {
      fontSize: '11px', color: '#6688aa', fontFamily: 'monospace',
    }).setOrigin(0.5).setDepth(5).setInteractive({ useHandCursor: true });
    btn.on('pointerover', () => { bg.setStrokeStyle(1, 0x5577aa); btn.setColor('#aaccff'); });
    btn.on('pointerout',  () => { bg.setStrokeStyle(1, 0x335577); btn.setColor('#6688aa'); });
    btn.on('pointerdown', () => window.open('how_to_play.html', '_blank'));
  }

  _buildFeedbackButton() {
    const btnW = 130; const btnH = 22; const x = 8; const y = 6;
    const bg = this.add.rectangle(x + btnW / 2, y + btnH / 2, btnW, btnH, 0x0d1117)
      .setStrokeStyle(1, 0x2a3a4a).setDepth(5);
    const btn = this.add.text(x + btnW / 2, y + btnH / 2, 'Feedback / Bugs', {
      fontSize: '10px', color: '#778899', fontFamily: 'monospace',
    }).setOrigin(0.5).setDepth(5).setInteractive({ useHandCursor: true });
    btn.on('pointerover', () => { bg.setStrokeStyle(1, 0x445566); btn.setColor('#aabbcc'); });
    btn.on('pointerout',  () => { bg.setStrokeStyle(1, 0x2a3a4a); btn.setColor('#778899'); });
    btn.on('pointerdown', () => window.open('https://forms.gle/nEFacroJxVao8bXD9', '_blank'));
  }

  _buildAudioToggles() {
    const cx = CANVAS_W / 2;

    const sfxLabel   = () => Settings.sfxOn   ? '[SFX: ON]'   : '[SFX: OFF]';
    const musicLabel = () => Settings.musicOn ? '[MUSIC: ON]' : '[MUSIC: OFF]';
    const onColor    = '#55cc88';
    const offColor   = '#445566';

    const sfxBtn = this.add.text(cx - 58, DRAFT_AUDIO_Y, sfxLabel(), {
      fontSize: '11px', color: Settings.sfxOn ? onColor : offColor, fontFamily: 'monospace',
    }).setOrigin(0.5).setDepth(2).setInteractive({ useHandCursor: true });

    const musicBtn = this.add.text(cx + 62, DRAFT_AUDIO_Y, musicLabel(), {
      fontSize: '11px', color: Settings.musicOn ? onColor : offColor, fontFamily: 'monospace',
    }).setOrigin(0.5).setDepth(2).setInteractive({ useHandCursor: true });

    sfxBtn.on('pointerdown', () => {
      Settings.setSfx(!Settings.sfxOn);
      sfxBtn.setText(sfxLabel()).setColor(Settings.sfxOn ? onColor : offColor);
    });

    musicBtn.on('pointerdown', () => {
      Settings.setMusic(!Settings.musicOn);
      musicBtn.setText(musicLabel()).setColor(Settings.musicOn ? onColor : offColor);
    });
  }

  _buildTestModeToggle() {
    const cx      = CANVAS_W / 2;
    const checked = this._testMode ? '[X]' : '[ ]';
    const label   = `${checked} TEST MODE`;
    const color   = this._testMode ? '#ff9900' : '#556677';

    const btn = this.add.text(cx, DRAFT_TESTMODE_Y, label, {
      fontSize: '13px', color, fontFamily: 'monospace',
    }).setOrigin(0.5, 0).setDepth(2).setInteractive({ useHandCursor: true });

    btn.on('pointerdown', () => {
      this.scene.restart({ testMode: !this._testMode, character: this._character, slotIndex: this._slotIndex, floor: this._floor, testTarget: null, startingResources: this._startingResources });
    });
  }

  _buildFloorDropdown() {
    if (!this._testMode) return;
    const cx   = CANVAS_W / 2;
    const btnY = DRAFT_TESTMODE_Y + 22;
    const btnW = 240;
    const btnH = 18;

    const bg = this.add.rectangle(cx, btnY + btnH / 2, btnW, btnH, 0x0d1a2a)
      .setStrokeStyle(1, 0x334466).setDepth(2).setInteractive({ useHandCursor: true });

    this._dropdownLabel = this.add.text(cx, btnY + btnH / 2, `▾  ${this._getDropdownLabel()}`, {
      fontSize: '12px', color: '#7799cc', fontFamily: 'monospace',
    }).setOrigin(0.5).setDepth(3).setInteractive({ useHandCursor: true });

    const open = () => this._openFloorDropdown();
    bg.on('pointerdown', open);
    this._dropdownLabel.on('pointerdown', open);
  }

  _getDropdownLabel() {
    if (this._testTarget === 'VictoryScene')     return 'False Victory Screen';
    if (this._testTarget === 'TrueVictoryScene') return 'True Victory Screen';
    const floorCfg = floorsData.find(f => f.floor === this._floor);
    const prefix   = this._floor === SECRET_FLOOR ? '⚠ ' : '';
    return `${prefix}Floor ${this._floor}: ${floorCfg?.ai ?? '?'}`;
  }

  _openFloorDropdown() {
    const depth  = 20;
    const cx     = CANVAS_W / 2;
    const rowH   = 19;
    const panelW = 252;

    const options = floorsData.map(f => ({
      label:  `${f.floor === SECRET_FLOOR ? '⚠ ' : ''}Floor ${f.floor}: ${f.ai}`,
      floor:  f.floor,
      target: null,
    }));
    options.push({ label: '── False Victory Screen', floor: this._floor, target: 'VictoryScene' });
    options.push({ label: '── True Victory Screen',  floor: this._floor, target: 'TrueVictoryScene' });

    const panelH   = options.length * rowH + 8;
    const panelBot = DRAFT_TESTMODE_Y + 20;
    const panelTop = panelBot - panelH;

    const overlay = this.add.rectangle(cx, CANVAS_H / 2, CANVAS_W, CANVAS_H, 0x000000, 0.45)
      .setDepth(depth).setInteractive();

    this.add.rectangle(cx, panelTop + panelH / 2, panelW, panelH, 0x0d1a2a)
      .setStrokeStyle(1, 0x4466aa).setDepth(depth + 1);

    const all = [overlay];

    options.forEach((opt, i) => {
      const rowY       = panelTop + 4 + i * rowH + rowH / 2;
      const isSelected = opt.target === this._testTarget &&
        (opt.target !== null || opt.floor === this._floor);

      const rowBg = this.add.rectangle(cx, rowY, panelW - 4, rowH - 1,
        isSelected ? 0x1a3a5a : 0x0d1a2a
      ).setDepth(depth + 1).setInteractive({ useHandCursor: true });

      const txt = this.add.text(cx - panelW / 2 + 10, rowY, opt.label, {
        fontSize: '12px', color: isSelected ? '#88ddff' : '#aabbcc', fontFamily: 'monospace',
      }).setOrigin(0, 0.5).setDepth(depth + 2);

      all.push(rowBg, txt);

      rowBg.on('pointerdown', () => {
        all.forEach(o => o.destroy());
        this.scene.restart({
          testMode:          true,
          character:         this._character,
          slotIndex:         this._slotIndex,
          floor:             opt.floor,
          testTarget:        opt.target,
          startingResources: TESTMODE_RESOURCES,
          powerupSlots:      this._powerupSlots,
          loadout:           this._loadout().length > 0 ? this._loadout() : null,
        });
      });
      rowBg.on('pointerover', () => { if (!isSelected) { rowBg.setFillStyle(0x162636); txt.setColor('#ccddee'); } });
      rowBg.on('pointerout',  () => { if (!isSelected) { rowBg.setFillStyle(0x0d1a2a); txt.setColor('#aabbcc'); } });
    });

    overlay.on('pointerdown', () => all.forEach(o => o.destroy()));
  }

  get _total() { return Object.values(this._counts).reduce((a, b) => a + b, 0); }

  _loadout() {
    const result = [];
    for (const u of this._available()) {
      for (let i = 0; i < this._counts[u.name]; i++) result.push(u.name);
    }
    return result;
  }

  _increment(name) {
    if (this._total >= this._unlockedSlots) return;
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

  _clearLoadout() {
    for (const name of Object.keys(this._counts)) this._counts[name] = 0;
    this._refresh();
  }

  _confirm() {
    if (this._testTarget === 'VictoryScene') {
      this.scene.start('VictoryScene', {
        character:    this._character,
        slotIndex:    this._slotIndex,
        loadout:      this._loadout(),
        powerupSlots: this._powerupSlots,
      });
      return;
    }
    if (this._testTarget === 'TrueVictoryScene') {
      this.scene.start('TrueVictoryScene', { character: this._character });
      return;
    }
    if (this._total === 0) return;
    this.scene.start('GameScene', {
      loadout:           this._loadout(),
      testMode:          this._testMode,
      character:         this._character,
      slotIndex:         this._slotIndex,
      floor:             this._floor,
      startingResources: this._startingResources,
      powerupSlots:      this._powerupSlots,
    });
  }

  _saveDraft() {
    localStorage.setItem(DRAFT_SAVE_KEY, JSON.stringify(this._counts));
    this._saveBtnFlash = true;
    this._saveBtn.setColor('#44cc88');
    this._saveBtnBg.setStrokeStyle(1, 0x228844);
    this.time.delayedCall(800, () => {
      this._saveBtnFlash = false;
      this._saveBtn.setColor('#6688cc');
      this._saveBtnBg.setStrokeStyle(1, 0x334466);
    });
  }

  _loadDraft() {
    let saved;
    try { saved = JSON.parse(localStorage.getItem(DRAFT_SAVE_KEY) || 'null'); } catch { return; }
    if (!saved) return;
    for (const name of Object.keys(this._counts)) this._counts[name] = 0;
    for (const [name, count] of Object.entries(saved)) {
      if (name in this._counts && count > 0) this._counts[name] = count;
    }
    while (this._total > this._unlockedSlots) {
      const keys = Object.keys(this._counts).filter(k => this._counts[k] > 0);
      if (!keys.length) break;
      this._counts[keys[keys.length - 1]]--;
    }
    this._refresh();
  }

  _refresh() {
    for (const [name, txt] of Object.entries(this._countTexts)) {
      txt.setText(String(this._counts[name]));
    }

    const loadout  = this._loadout();
    const unlocked = this._unlockedSlots;
    for (let i = 0; i < LOADOUT_NUM_SLOTS; i++) {
      const isLocked = i >= unlocked;
      if (isLocked) {
        this._slotRects[i].setFillStyle(DRAFT_COLOR_LOCKED);
        this._slotLabels[i].setText('LOCK');
        continue;
      }
      const filled = i < loadout.length;
      if (filled) {
        const stats = unitsData.find(u => u.name === loadout[i]);
        this._slotRects[i].setFillStyle(parseInt(stats.color.slice(1), 16));
      } else {
        this._slotRects[i].setFillStyle(DRAFT_COLOR_SLOT_EMPTY);
      }
      this._slotLabels[i].setText(filled ? _formatSlotName(loadout[i]) : '');
    }

    this._confirmBtn.setColor(this._total > 0 ? '#ffffff' : '#555566');
  }

  _showUnitInfoPopup(unit) {
    const depth  = 30;
    const cx     = CANVAS_W / 2;
    const cy     = CANVAS_H / 2;
    const panelW = 310;
    const panelH = 360;
    const cardColor = parseInt(unit.color.slice(1), 16);

    const overlay = this.add.rectangle(cx, cy, CANVAS_W, CANVAS_H, 0x000000, 0.78)
      .setDepth(depth).setInteractive();

    const panel = this.add.rectangle(cx, cy, panelW, panelH, 0x1a1a2e)
      .setStrokeStyle(2, cardColor).setDepth(depth + 1);

    const top = cy - panelH / 2;

    const titleBar = this.add.rectangle(cx, top + 20, panelW, 40, cardColor, 0.6)
      .setDepth(depth + 1);

    const titleTxt = this.add.text(cx, top + 20, unit.name.toUpperCase(), {
      fontSize: '20px', color: '#ffffff', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(depth + 2);

    const { metal: m, silicon: s, batteries: b } = unit.cost;

    const lines = [
      [`HP`,           String(unit.hp)],
      [`Damage`,       String(unit.dmg)],
      [`Range`,        String(unit.range)],
      [`Armor`,        String(unit.armor)],
      [`Move Speed`,   unit.moveSpeed],
      [`Attack Speed`, unit.atkSpeed],
      [`Spawn`,        unit.spawn],
      [`Metal`,        String(m)],
      [`Silicon`,      String(s)],
      [`Batteries`,    String(b)],
    ];

    const rowH  = 20;
    const startY = top + 54;
    const lx = cx - 130;
    const rx = cx + 10;

    const rowObjs = [];
    lines.forEach(([label, value], i) => {
      const ry = startY + i * rowH;
      rowObjs.push(this.add.text(lx, ry, label, {
        fontSize: '13px', color: '#8899bb', fontFamily: 'monospace',
      }).setDepth(depth + 2));
      rowObjs.push(this.add.text(rx, ry, value, {
        fontSize: '13px', color: '#ffffff', fontFamily: 'monospace', fontStyle: 'bold',
      }).setDepth(depth + 2));
    });

    const specialY = startY + lines.length * rowH + 10;
    rowObjs.push(this.add.text(lx, specialY, 'Special', {
      fontSize: '13px', color: '#8899bb', fontFamily: 'monospace',
    }).setDepth(depth + 2));
    rowObjs.push(this.add.text(lx, specialY + 16, unit.specialDesc ?? '—', {
      fontSize: '12px', color: '#ffffff', fontFamily: 'monospace',
      wordWrap: { width: panelW - 20 },
    }).setDepth(depth + 2));

    const closeBtnY = cy + panelH / 2 - 22;
    const closeBg = this.add.rectangle(cx, closeBtnY, 100, 28, 0x2a2a44)
      .setStrokeStyle(1, 0x6677aa).setDepth(depth + 1);
    const closeTxt = this.add.text(cx, closeBtnY, 'CLOSE', {
      fontSize: '13px', color: '#aabbcc', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(depth + 2).setInteractive({ useHandCursor: true });

    const all = [overlay, panel, titleBar, titleTxt, closeBg, closeTxt, ...rowObjs];
    const cleanup = () => all.forEach(o => o.destroy());
    closeTxt.on('pointerdown', cleanup);
    overlay.on('pointerdown', cleanup);
  }

  _passiveInfoList(level) {
    if (level >= PASSIVE_LEVEL_ASI) return [
      { name: 'Perfected Scavenging',         desc: '+2 Metal, +1 Si, +1 B per kill' },
      { name: 'Artificial Superintelligence', desc: 'Free Juggernaut each round'      },
    ];
    if (level >= PASSIVE_LEVEL_PERFECTED) return [{ name: 'Perfected Scavenging',  desc: 'Earn +2 Metal, +1 Si, +1 B on each kill' }];
    if (level >= PASSIVE_LEVEL_SUPERIOR)  return [{ name: 'Superior Scavenging',   desc: 'Earn +2 random resources on each kill'   }];
    if (level >= PASSIVE_LEVEL_ADVANCED)  return [{ name: 'Advanced Scavenging',   desc: 'Earn +1 Si or +1 B on each kill'         }];
    if (level >= PASSIVE_LEVEL_IMPROVED)  return [{ name: 'Improved Scavenging',   desc: '50% chance to earn +1 Si or +1 B on kill'}];
    return [];
  }

  _buildPassiveInfo() {
    if (!this._character) return;
    const skills = this._passiveInfoList(this._character.level);

    if (skills.length === 0) {
      this.add.text(CANVAS_W / 2, DRAFT_PASSIVE_Y + 6, `Passive skill unlocks at level ${PASSIVE_LEVEL_IMPROVED}`, {
        fontSize: '11px', color: '#2e3a46', fontFamily: 'monospace',
      }).setOrigin(0.5, 0);
      return;
    }

    if (skills.length === 1) {
      const info = skills[0];
      this.add.text(CANVAS_W / 2, DRAFT_PASSIVE_Y, `✦ ${info.name}`, {
        fontSize: '12px', color: '#ffcc44', fontFamily: 'monospace', fontStyle: 'bold',
      }).setOrigin(0.5, 0);
      this.add.text(CANVAS_W / 2, DRAFT_PASSIVE_Y + 16, info.desc, {
        fontSize: '11px', color: '#8899bb', fontFamily: 'monospace',
      }).setOrigin(0.5, 0);
      return;
    }

    // Two skills side-by-side (ASI level)
    const centers = [CANVAS_W / 4, 3 * CANVAS_W / 4];
    this.add.rectangle(CANVAS_W / 2, DRAFT_PASSIVE_Y + 14, 1, 30, 0x334455).setDepth(1);
    for (let i = 0; i < skills.length; i++) {
      const cx   = centers[i];
      const info = skills[i];
      this.add.text(cx, DRAFT_PASSIVE_Y, `✦ ${info.name}`, {
        fontSize: '11px', color: '#ffcc44', fontFamily: 'monospace', fontStyle: 'bold',
        align: 'center',
      }).setOrigin(0.5, 0);
      this.add.text(cx, DRAFT_PASSIVE_Y + 16, info.desc, {
        fontSize: '10px', color: '#8899bb', fontFamily: 'monospace',
        align: 'center',
      }).setOrigin(0.5, 0);
    }
  }

  _setupDrag() {
    this._dragState     = null;
    this._dragCandidate = null;

    this.input.on('pointermove', (pointer) => {
      if (this._dragCandidate && !this._dragState) {
        const dx = pointer.x - this._dragCandidate.startX;
        const dy = pointer.y - this._dragCandidate.startY;
        if (Math.sqrt(dx * dx + dy * dy) > 8) {
          this._startDrag(this._dragCandidate.unitName, pointer.x, pointer.y);
          this._dragCandidate = null;
        }
      }
      if (this._dragState) {
        this._dragState.ghost.setPosition(pointer.x, pointer.y);
        this._updateDropHighlight();
      }
    });

    this.input.on('pointerup', (pointer) => {
      if (this._dragState) {
        if (this._isInLoadoutZone(pointer.x, pointer.y)) {
          this._increment(this._dragState.unitName);
        }
        this._endDrag();
      }
      this._dragCandidate = null;
    });
  }

  _startDrag(unitName, x, y) {
    const unit      = unitsData.find(u => u.name === unitName);
    const cardColor = parseInt(unit.color.slice(1), 16);
    const ghost     = this.add.container(x, y).setDepth(DEPTH_DRAG_GHOST);
    ghost.add(this.add.rectangle(0, 0, 100, 26, cardColor, 0.88));
    ghost.add(this.add.text(0, 0, unitName.toUpperCase(), {
      fontSize: '10px', color: '#ffffff', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5));
    this._dragState = { unitName, ghost };
    this._updateDropHighlight();
  }

  _endDrag() {
    if (!this._dragState) return;
    this._dragState.ghost.destroy();
    this._dragState = null;
    this._clearDropHighlight();
  }

  _isInLoadoutZone(x, y) {
    return this._slotHitZones.some(z =>
      x >= z.x && x <= z.x + z.w && y >= z.y && y <= z.y + z.h
    );
  }

  _updateDropHighlight() {
    const loadout = this._loadout();
    const canAdd  = this._total < this._unlockedSlots;
    for (let i = 0; i < LOADOUT_NUM_SLOTS; i++) {
      const isLocked = i >= this._unlockedSlots;
      if (isLocked) continue;
      const isFilled = i < loadout.length;
      if (!isFilled && canAdd) {
        this._slotRects[i].setStrokeStyle(2, 0x88ff88, 1);
      } else {
        this._slotRects[i].setStrokeStyle(0);
      }
    }
  }

  _clearDropHighlight() {
    for (const rect of this._slotRects) rect.setStrokeStyle(0);
  }
}
