import Phaser from 'phaser';
import {
  CANVAS_W, CANVAS_H,
  STARTING_RESOURCES, TESTMODE_RESOURCES, LOADOUT_NUM_SLOTS, TESTMODE,
  FLOOR_RES_MIN_METAL,
  MAX_FLOORS,
  DRAFT_CARD_W, DRAFT_CARD_H, DRAFT_CARD_PAD, DRAFT_CARD_ROW_Y,
  DRAFT_SLOT_Y, DRAFT_SLOT_W, DRAFT_SLOT_H, DRAFT_SLOT_MARGIN,
  DRAFT_PASSIVE_Y, DRAFT_CONFIRM_Y, DRAFT_CONFIRM_BTN_W, DRAFT_CONFIRM_BTN_H, DRAFT_TESTMODE_Y,
  DRAFT_COLOR_BG, DRAFT_COLOR_SLOT_EMPTY, DRAFT_COLOR_CONFIRM_BG, DRAFT_COLOR_LOCKED,
  DRAFT_SAVE_KEY, DEPTH_DRAG_GHOST,
  PASSIVE_LEVEL_IMPROVED, PASSIVE_LEVEL_ADVANCED, PASSIVE_LEVEL_SUPERIOR,
  PASSIVE_LEVEL_PERFECTED, PASSIVE_LEVEL_ASI,
} from '../data/constants.js';
import unitsData from '../data/units.json';
import floorsData from '../data/floors.json';
import { UNIT_SPRITE_KEY } from '../data/spriteData.js';

function _rollStartingResources(level) {
  const res  = { metal: FLOOR_RES_MIN_METAL, silicon: 0, batteries: 0 };
  const keys = ['metal', 'silicon', 'batteries'];
  // total = level + 3; guaranteed 3 metal already accounted for, so distribute `level` extra
  for (let i = 0; i < level; i++) res[keys[Math.floor(Math.random() * 3)]]++;
  return res;
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
    this._testMode  = data?.testMode  ?? (TESTMODE === 1);
    this._character = data?.character ?? null;
    this._slotIndex = data?.slotIndex ?? null;
    this._floor     = data?.floor     ?? 1;
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
    this._buildTestModeToggle();
    this._refresh();
    this._startCardAnimCycle();
    this._setupDrag();
  }

  _buildBackground() {
    this.add.rectangle(CANVAS_W / 2, CANVAS_H / 2, CANVAS_W, CANVAS_H, DRAFT_COLOR_BG).setDepth(0);
  }

  _buildHeader() {
    const cx       = CANVAS_W / 2;
    const floorCfg = floorsData.find(f => f.floor === this._floor);
    const aiName   = floorCfg?.ai ?? 'ENEMY';
    const favUnit  = floorCfg?.favoriteUnit ?? '';
    const rawQuote = floorCfg?.quote ?? '';
    const charName = this._character?.name ?? 'Agent';
    const quote    = rawQuote.replace('<player name>', charName);

    this.add.text(cx, 6, `FLOOR ${this._floor} / ${MAX_FLOORS}`, {
      fontSize: '15px', color: '#ffffff', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5, 0);

    this.add.text(cx, 26, `vs ${aiName.toUpperCase()}`, {
      fontSize: '12px', color: '#ff9999', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5, 0);

    if (quote) {
      this.add.text(cx, 44, `"${quote}"`, {
        fontSize: '12px', color: '#aabbcc', fontFamily: 'monospace', fontStyle: 'italic',
        align: 'center', wordWrap: { width: CANVAS_W - 24 },
      }).setOrigin(0.5, 0);
    }

    if (favUnit) {
      this.add.text(cx, 65, `Favorite robot: ${favUnit}`, {
        fontSize: '13px', color: '#ffcccc', fontFamily: 'monospace',
      }).setOrigin(0.5, 0);
    }

    const res    = this._startingResources;
    const resStr = `Your starting resources:  Metal: ${res.metal}  Silicon: ${res.silicon}  Batteries: ${res.batteries}`;
    this.add.text(cx, 90, resStr, {
      fontSize: '13px', color: '#ffdd88', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5, 0);

    const subtitle = this._testMode ? '── ALL UNITS UNLOCKED (TEST MODE) ──' : '── SELECT UNITS (Lvl 1 unlocked) ──';
    this.add.text(cx, 110, subtitle, {
      fontSize: '9px', color: this._testMode ? '#ff9900' : '#556677', fontFamily: 'monospace',
    }).setOrigin(0.5, 0);
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

    const clearBtn = this.add.text(SLOT_START_X, DRAFT_SLOT_Y - 20, '[ Clear ]', {
      fontSize: '11px', color: '#cc6666', fontFamily: 'monospace',
    }).setOrigin(0, 0).setDepth(2).setInteractive({ useHandCursor: true });
    clearBtn.on('pointerover', () => clearBtn.setColor('#ff8888'));
    clearBtn.on('pointerout',  () => clearBtn.setColor('#cc6666'));
    clearBtn.on('pointerdown', () => this._clearLoadout());

    const loadBtn = this.add.text(rightEdge, DRAFT_SLOT_Y - 20, '[ Load ]', {
      fontSize: '11px', color: '#6688cc', fontFamily: 'monospace',
    }).setOrigin(1, 0).setDepth(2).setInteractive({ useHandCursor: true });
    loadBtn.on('pointerover', () => loadBtn.setColor('#88aaff'));
    loadBtn.on('pointerout',  () => loadBtn.setColor('#6688cc'));
    loadBtn.on('pointerdown', () => this._loadDraft());

    this._saveBtn = this.add.text(rightEdge - 64, DRAFT_SLOT_Y - 20, '[ Save ]', {
      fontSize: '11px', color: '#6688cc', fontFamily: 'monospace',
    }).setOrigin(1, 0).setDepth(2).setInteractive({ useHandCursor: true });
    this._saveBtn.on('pointerover', () => { if (this._saveBtn.style.color !== '#44cc88') this._saveBtn.setColor('#88aaff'); });
    this._saveBtn.on('pointerout',  () => { if (this._saveBtn.style.color !== '#44cc88') this._saveBtn.setColor('#6688cc'); });
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
          fontSize: '7px',
          color: isLocked ? '#333344' : '#aaaacc',
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

  _buildTestModeToggle() {
    const cx      = CANVAS_W / 2;
    const checked = this._testMode ? '[X]' : '[ ]';
    const label   = `${checked} TEST MODE`;
    const color   = this._testMode ? '#ff9900' : '#556677';

    const btn = this.add.text(cx, DRAFT_TESTMODE_Y, label, {
      fontSize: '13px', color, fontFamily: 'monospace',
    }).setOrigin(0.5, 0).setDepth(2).setInteractive({ useHandCursor: true });

    btn.on('pointerdown', () => {
      this.scene.restart({ testMode: !this._testMode, character: this._character, slotIndex: this._slotIndex, floor: this._floor, startingResources: this._startingResources });
    });
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
    this._saveBtn.setColor('#44cc88');
    this.time.delayedCall(800, () => this._saveBtn.setColor('#6688cc'));
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
      this._slotLabels[i].setText(filled ? loadout[i].replace(' ', '\n') : '');
    }

    this._confirmBtn.setColor(this._total > 0 ? '#ffffff' : '#555566');
  }

  _showUnitInfoPopup(unit) {
    const depth  = 30;
    const cx     = CANVAS_W / 2;
    const cy     = CANVAS_H / 2;
    const panelW = 310;
    const panelH = 330;
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
      [`Special`,      unit.specialBehavior ?? '—'],
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

  _passiveInfo(level) {
    if (level >= PASSIVE_LEVEL_ASI)       return { name: 'Artificial Superintelligence', desc: 'Begin each round with a free Juggernaut' };
    if (level >= PASSIVE_LEVEL_PERFECTED) return { name: 'Perfected Scavenging',         desc: 'Earn +2 Metal, +1 Si, +1 B on each kill' };
    if (level >= PASSIVE_LEVEL_SUPERIOR)  return { name: 'Superior Scavenging',          desc: 'Earn +1 Si or +1 B on each kill' };
    if (level >= PASSIVE_LEVEL_ADVANCED)  return { name: 'Advanced Scavenging',          desc: 'Earn +1 Si or +1 B on each kill' };
    if (level >= PASSIVE_LEVEL_IMPROVED)  return { name: 'Improved Scavenging',          desc: '50% chance to earn +1 Si or +1 B on each kill' };
    return null;
  }

  _buildPassiveInfo() {
    if (!this._character) return;
    const level = this._character.level;
    const cx    = CANVAS_W / 2;
    const info  = this._passiveInfo(level);

    if (!info) {
      this.add.text(cx, DRAFT_PASSIVE_Y + 6, `Passive skill unlocks at level ${PASSIVE_LEVEL_IMPROVED}`, {
        fontSize: '11px', color: '#2e3a46', fontFamily: 'monospace',
      }).setOrigin(0.5, 0);
      return;
    }

    this.add.text(cx, DRAFT_PASSIVE_Y, `✦ ${info.name}`, {
      fontSize: '12px', color: '#ffcc44', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5, 0);
    this.add.text(cx, DRAFT_PASSIVE_Y + 16, info.desc, {
      fontSize: '11px', color: '#8899bb', fontFamily: 'monospace',
    }).setOrigin(0.5, 0);
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
