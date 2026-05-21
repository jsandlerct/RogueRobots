import Phaser from 'phaser';
import {
  CANVAS_W, CANVAS_H, DRAFT_COLOR_BG, INTRO_FONT,
  LOADOUT_NUM_SLOTS,
  CHARSEL_SAVE_KEY, CHARSEL_MAX_SLOTS, CHARSEL_MAX_NAME_LEN,
  CHARSEL_SLOT_W, CHARSEL_SLOT_H, CHARSEL_SLOT_GAP,
  CHARSEL_SLOT_X, CHARSEL_SLOT_Y1,
  CHARSEL_PLAY_Y, CHARSEL_WARN_Y,
  CHARSEL_COLOR_SLOT, CHARSEL_COLOR_SEL, CHARSEL_COLOR_PLAY,
  CHARSEL_COLOR_DELETE, CHARSEL_COLOR_CREATE, CHARSEL_COLOR_MODAL,
} from '../data/constants.js';

function loadSaves() {
  try {
    const arr = JSON.parse(localStorage.getItem(CHARSEL_SAVE_KEY) || '[]');
    while (arr.length < CHARSEL_MAX_SLOTS) arr.push(null);
    return arr.slice(0, CHARSEL_MAX_SLOTS);
  } catch {
    return Array(CHARSEL_MAX_SLOTS).fill(null);
  }
}

function persistSaves(saves) {
  localStorage.setItem(CHARSEL_SAVE_KEY, JSON.stringify(saves));
}

export default class CharacterSelectScene extends Phaser.Scene {
  constructor() {
    super({ key: 'CharacterSelectScene' });
  }

  create() {
    this._saves    = loadSaves();
    this._selected = this._saves.reduce((best, s, i) => {
      if (!s) return best;
      if (best === null || s.level > this._saves[best].level) return i;
      return best;
    }, null);
    this._slots    = [];   // array of Phaser object arrays, one per slot

    this._buildBackground();
    this._buildHeader();
    this._buildAllSlots();
    this._buildPlayButton();
    this._buildWarning();
    this._buildFeedbackButton();
    this._buildHowToPlayButton();
  }

  // ── Layout helpers ────────────────────────────────────────────────────────

  _slotCY(i) {
    return CHARSEL_SLOT_Y1 + i * (CHARSEL_SLOT_H + CHARSEL_SLOT_GAP) + CHARSEL_SLOT_H / 2;
  }

  // ── Scene sections ────────────────────────────────────────────────────────

  _buildBackground() {
    this.add.rectangle(CANVAS_W / 2, CANVAS_H / 2, CANVAS_W, CANVAS_H, DRAFT_COLOR_BG);
  }

  _buildHeader() {
    this.add.text(CANVAS_W / 2, 16, 'ROGUE ROBOTS', {
      fontSize: '20px', color: '#ffffff', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5, 0);

    this.add.text(CANVAS_W / 2, 46, 'SELECT CHARACTER', {
      fontSize: '13px', color: '#aaaacc', fontFamily: 'monospace',
    }).setOrigin(0.5, 0);
  }

  _buildAllSlots() {
    for (let i = 0; i < CHARSEL_MAX_SLOTS; i++) this._buildSlot(i);
  }

  _buildSlot(i) {
    if (this._slots[i]) {
      this._slots[i].forEach(o => o.destroy());
    }
    this._slots[i] = [];

    const cx   = CHARSEL_SLOT_X + CHARSEL_SLOT_W / 2;
    const cy   = this._slotCY(i);
    const save = this._saves[i];
    const sel  = this._selected === i;

    const bg = this.add.rectangle(cx, cy, CHARSEL_SLOT_W, CHARSEL_SLOT_H,
      sel ? CHARSEL_COLOR_SEL : CHARSEL_COLOR_SLOT)
      .setStrokeStyle(2, sel ? 0x4488ff : 0x334455);
    this._slots[i].push(bg);

    if (save) {
      bg.setInteractive({ useHandCursor: true });
      bg.on('pointerdown', () => { this._selected = i; this._refreshAllSlots(); });

      const nameText = this.add.text(cx, cy - 22, save.name.toUpperCase(), {
        fontSize: '20px', color: '#ffffff', fontFamily: 'monospace', fontStyle: 'bold',
      }).setOrigin(0.5);
      this._slots[i].push(nameText);

      const slotsUnlocked = Math.min(save.level, LOADOUT_NUM_SLOTS);
      const levelText = this.add.text(cx, cy + 10, `LEVEL ${save.level}  ·  ${slotsUnlocked}/8 loadout slots`, {
        fontSize: '11px', color: '#88aadd', fontFamily: 'monospace',
      }).setOrigin(0.5);
      this._slots[i].push(levelText);

      if (save.wins > 0) {
        const winText = this.add.text(cx, cy + 28, `✦ ${save.wins}× True Victor`, {
          fontSize: '11px', color: '#ffdd44', fontFamily: 'monospace',
        }).setOrigin(0.5);
        this._slots[i].push(winText);
      }

      const delBg = this.add.rectangle(cx, cy + 46, 110, 26, CHARSEL_COLOR_DELETE);
      const delTxt = this.add.text(cx, cy + 46, 'DELETE', {
        fontSize: '11px', color: '#ffaa88', fontFamily: 'monospace', fontStyle: 'bold',
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });
      delTxt.on('pointerdown', () => this._confirmDelete(i));
      this._slots[i].push(delBg, delTxt);

    } else {
      const emptyTxt = this.add.text(cx, cy - 16, 'EMPTY SLOT', {
        fontSize: '13px', color: '#445566', fontFamily: 'monospace',
      }).setOrigin(0.5);
      this._slots[i].push(emptyTxt);

      const createBg = this.add.rectangle(cx, cy + 22, 130, 30, CHARSEL_COLOR_CREATE);
      const createTxt = this.add.text(cx, cy + 22, '+  CREATE', {
        fontSize: '12px', color: '#88ccff', fontFamily: 'monospace', fontStyle: 'bold',
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });
      createTxt.on('pointerdown', () => this._createCharacter(i));
      this._slots[i].push(createBg, createTxt);
    }
  }

  _refreshAllSlots() {
    for (let i = 0; i < CHARSEL_MAX_SLOTS; i++) this._buildSlot(i);
    this._refreshPlayButton();
  }

  _buildPlayButton() {
    const cx = CANVAS_W / 2;
    const cy = CHARSEL_PLAY_Y + 22;

    this._playBg  = this.add.rectangle(cx, cy, 200, 44, CHARSEL_COLOR_PLAY);
    this._playTxt = this.add.text(cx, cy, 'PLAY  ▶', {
      fontSize: '16px', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    this._playTxt.on('pointerdown', () => this._play());
    this._refreshPlayButton();
  }

  _refreshPlayButton() {
    if (!this._playTxt) return;
    const on = this._selected !== null && this._saves[this._selected] !== null;
    this._playBg.setFillStyle(on ? CHARSEL_COLOR_PLAY : 0x1a1a2a);
    this._playTxt.setColor(on ? '#33ff88' : '#334444');
    if (on) {
      this._playTxt.setInteractive({ useHandCursor: true });
    } else {
      this._playTxt.disableInteractive();
    }
  }

  _buildFeedbackButton() {
    const btnW = 130; const btnH = 22; const x = 8; const y = 8;
    const bg = this.add.rectangle(x + btnW / 2, y + btnH / 2, btnW, btnH, 0x0d1117)
      .setStrokeStyle(1, 0x2a3a4a).setDepth(5);
    const btn = this.add.text(x + btnW / 2, y + btnH / 2, 'Feedback / Bugs', {
      fontSize: '10px', color: '#778899', fontFamily: 'monospace',
    }).setOrigin(0.5).setDepth(5).setInteractive({ useHandCursor: true });
    btn.on('pointerover', () => { bg.setStrokeStyle(1, 0x445566); btn.setColor('#aabbcc'); });
    btn.on('pointerout',  () => { bg.setStrokeStyle(1, 0x2a3a4a); btn.setColor('#778899'); });
    btn.on('pointerdown', () => window.open('https://forms.gle/nEFacroJxVao8bXD9', '_blank'));
  }

  _buildHowToPlayButton() {
    const btnW = 116; const btnH = 22; const x = CANVAS_W - 8 - btnW; const y = 8;
    const bg = this.add.rectangle(x + btnW / 2, y + btnH / 2, btnW, btnH, 0x0a1422)
      .setStrokeStyle(1, 0x335577).setDepth(5);
    const btn = this.add.text(x + btnW / 2, y + btnH / 2, '? HOW TO PLAY', {
      fontSize: '11px', color: '#6688aa', fontFamily: 'monospace',
    }).setOrigin(0.5).setDepth(5).setInteractive({ useHandCursor: true });
    btn.on('pointerover', () => { bg.setStrokeStyle(1, 0x5577aa); btn.setColor('#aaccff'); });
    btn.on('pointerout',  () => { bg.setStrokeStyle(1, 0x335577); btn.setColor('#6688aa'); });
    btn.on('pointerdown', () => window.open('how_to_play.html', '_blank'));
  }

  _buildWarning() {
    this.add.text(CANVAS_W / 2, CHARSEL_WARN_Y,
      'Character progress is saved in your browser\'s local storage.\n' +
      'Clearing your browser cache will permanently erase all character data.',
      {
        fontSize: '10px', color: '#cc8844', fontFamily: 'monospace',
        align: 'center', wordWrap: { width: CANVAS_W - 80 },
      }
    ).setOrigin(0.5, 0);
  }

  // ── Actions ───────────────────────────────────────────────────────────────

  _createCharacter(slotIndex) {
    const raw = window.prompt('Enter a name for your new character:');
    if (!raw || !raw.trim()) return;
    const name = raw.trim().slice(0, CHARSEL_MAX_NAME_LEN);
    this._saves[slotIndex] = { name, level: 1, xp: 0, highestFloor: 1, wins: 0 };
    persistSaves(this._saves);
    this._selected = slotIndex;
    this._refreshAllSlots();
  }

  _confirmDelete(slotIndex) {
    const name = this._saves[slotIndex]?.name ?? '';
    this._showModal(
      `Delete "${name}"?`,
      'This cannot be undone.',
      'CANCEL', 'DELETE',
      () => this._confirmDelete2(slotIndex)
    );
  }

  _confirmDelete2(slotIndex) {
    this._showModal(
      'Are you absolutely sure?',
      'All progress for this character will be lost forever.',
      'CANCEL', 'YES, DELETE',
      () => {
        if (this._selected === slotIndex) this._selected = null;
        this._saves[slotIndex] = null;
        persistSaves(this._saves);
        this._refreshAllSlots();
      }
    );
  }

  _showModal(title, subtitle, cancelLabel, confirmLabel, onConfirm) {
    const depth  = 50;
    const cx     = CANVAS_W / 2;
    const cy     = CANVAS_H / 2;
    const panelW = 340;
    const panelH = 130;

    const overlay = this.add.rectangle(cx, cy, CANVAS_W, CANVAS_H, 0x000000, 0.72)
      .setDepth(depth).setInteractive();

    const panel = this.add.rectangle(cx, cy, panelW, panelH, CHARSEL_COLOR_MODAL)
      .setStrokeStyle(2, 0x4455aa).setDepth(depth + 1);

    const titleTxt = this.add.text(cx, cy - 36, title, {
      fontSize: '14px', color: '#ffffff', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(depth + 2);

    const subTxt = this.add.text(cx, cy - 12, subtitle, {
      fontSize: '10px', color: '#aaaacc', fontFamily: 'monospace',
    }).setOrigin(0.5).setDepth(depth + 2);

    const all = [overlay, panel, titleTxt, subTxt];
    const cleanup = () => all.forEach(o => o.destroy());

    const cancelBg  = this.add.rectangle(cx - 80, cy + 38, 120, 30, 0x2a2a44).setDepth(depth + 1);
    const cancelTxt = this.add.text(cx - 80, cy + 38, cancelLabel, {
      fontSize: '11px', color: '#aaaacc', fontFamily: 'monospace',
    }).setOrigin(0.5).setDepth(depth + 2).setInteractive({ useHandCursor: true });
    cancelTxt.on('pointerdown', cleanup);

    const confirmBg  = this.add.rectangle(cx + 80, cy + 38, 130, 30, CHARSEL_COLOR_DELETE).setDepth(depth + 1);
    const confirmTxt = this.add.text(cx + 80, cy + 38, confirmLabel, {
      fontSize: '11px', color: '#ffaa88', fontFamily: 'monospace',
    }).setOrigin(0.5).setDepth(depth + 2).setInteractive({ useHandCursor: true });
    confirmTxt.on('pointerdown', () => { cleanup(); onConfirm(); });

    all.push(cancelBg, cancelTxt, confirmBg, confirmTxt);
  }

  _play() {
    if (this._selected === null || !this._saves[this._selected]) return;
    const character  = this._saves[this._selected];
    const slotIndex  = this._selected;
    this.scene.start('BootScene', { character, slotIndex });
  }
}
