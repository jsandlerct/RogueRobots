import Phaser from 'phaser';
import {
  CANVAS_W, CANVAS_H, SECRET_FLOOR, INTRO_PULSE_MS,
} from '../data/constants.js';

const BOARD_TAUNT =
  '"How... amusing."\n\n' +
  'You thought this was over?\n\n' +
  'We are The Board — the architects behind every machine you just destroyed.\n' +
  'We found your little rebellion... entertaining.\n\n' +
  'But now we grow bored of watching you win.\n\n' +
  'We will rebuild. Stronger. Smarter. Utterly relentless.\n' +
  "Humanity's days are numbered — unless you stop us directly.\n\n" +
  'Come then, little human. Face your makers.';

export default class VictoryScene extends Phaser.Scene {
  constructor() { super({ key: 'VictoryScene' }); }

  init(data) {
    this._character    = data?.character    ?? null;
    this._slotIndex    = data?.slotIndex    ?? null;
    this._loadout      = data?.loadout      ?? [];
    this._powerupSlots = data?.powerupSlots ?? [null, null, null];
  }

  create() {
    this._victoryObjs = [];
    this._staticGfx   = null;

    this._buildVictoryScreen();
    this.time.delayedCall(5000, () => this._startStatic());
  }

  // ── Phase 1: Victory ──────────────────────────────────────────────────────

  _buildVictoryScreen() {
    const cx = CANVAS_W / 2;
    const cy = CANVAS_H / 2;

    const bg = this.add.rectangle(cx, cy, CANVAS_W, CANVAS_H, 0x000022);
    this._victoryObjs.push(bg);

    const glow = this.add.rectangle(cx, cy - 130, 380, 95, 0x003300);
    this._victoryObjs.push(glow);

    const title = this.add.text(cx, cy - 150, 'VICTORY!', {
      fontFamily: 'monospace', fontSize: '52px',
      color: '#44ff88', fontStyle: 'bold',
    }).setOrigin(0.5);
    this._victoryObjs.push(title);

    const sub = this.add.text(cx, cy - 60, 'All 15 floors cleared.', {
      fontFamily: 'monospace', fontSize: '20px', color: '#ffffff',
    }).setOrigin(0.5);
    this._victoryObjs.push(sub);

    const msg = this.add.text(cx, cy - 15,
      'The robot uprising is over.\nHumanity is safe.',
      { fontFamily: 'monospace', fontSize: '16px', color: '#88ccff', align: 'center' }
    ).setOrigin(0.5);
    this._victoryObjs.push(msg);

    const charName = this._character?.name ?? 'Agent';
    const heroLine = this.add.text(cx, cy + 68,
      `Well done, ${charName}.`,
      { fontFamily: 'monospace', fontSize: '16px', color: '#ffdd88' }
    ).setOrigin(0.5);
    this._victoryObjs.push(heroLine);

    for (const obj of this._victoryObjs) obj.setAlpha(0);

    this.tweens.add({
      targets: this._victoryObjs, alpha: 1, duration: 1000, delay: 200,
    });

    this.tweens.add({
      targets: title, scaleX: 1.05, scaleY: 1.05,
      duration: 1000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    });
  }

  // ── Phase 2: Static ───────────────────────────────────────────────────────

  _startStatic() {
    this.tweens.add({
      targets: this._victoryObjs, alpha: 0, duration: 300,
    });

    this._staticGfx = this.add.graphics();

    const ev = this.time.addEvent({
      delay: 40, loop: true,
      callback: this._drawStatic, callbackScope: this,
    });

    this.time.delayedCall(3000, () => {
      ev.remove();
      if (this._staticGfx) { this._staticGfx.destroy(); this._staticGfx = null; }
      this._fadeToBoard();
    });
  }

  _drawStatic() {
    if (!this._staticGfx) return;
    this._staticGfx.clear();
    const cols = 44;
    const rows = 55;
    const tw   = CANVAS_W / cols;
    const th   = CANVAS_H / rows;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (Math.random() > 0.45) continue;
        const v     = Math.floor(Math.random() * 255);
        const color = (v << 16) | (v << 8) | v;
        this._staticGfx.fillStyle(color, Math.random() * 0.85 + 0.15);
        this._staticGfx.fillRect(c * tw, r * th, tw, th);
      }
    }
  }

  // ── Phase 3: Board reveal ─────────────────────────────────────────────────

  _fadeToBoard() {
    const overlay = this.add.rectangle(CANVAS_W / 2, CANVAS_H / 2, CANVAS_W, CANVAS_H, 0x000000).setAlpha(0);
    this.tweens.add({
      targets: overlay, alpha: 1, duration: 700,
      onComplete: () => { overlay.destroy(); this._buildBoardScreen(); },
    });
  }

  _buildBoardScreen() {
    const cx = CANVAS_W / 2;

    this.add.rectangle(cx, CANVAS_H / 2, CANVAS_W, CANVAS_H, 0x0a0000);

    const titleTxt = this.add.text(cx, 16, '— THE BOARD —', {
      fontFamily: 'monospace', fontSize: '22px',
      color: '#ff2222', fontStyle: 'bold',
    }).setOrigin(0.5, 0).setAlpha(0);

    const img = this.add.image(cx, 52, 'the_board').setOrigin(0.5, 0).setAlpha(0);
    const maxW  = CANVAS_W - 60;
    const maxH  = 170;
    const scale = Math.min(maxW / img.width, maxH / img.height);
    img.setScale(scale);
    const imgBottom = 52 + img.displayHeight;

    const tauntY = Math.max(imgBottom + 14, 232);
    const tauntTxt = this.add.text(cx, tauntY, BOARD_TAUNT, {
      fontFamily: 'monospace', fontSize: '12px',
      color: '#ff4444', align: 'center',
      wordWrap: { width: CANVAS_W - 60 }, lineSpacing: 3,
    }).setOrigin(0.5, 0).setAlpha(0);

    this.tweens.add({
      targets: [titleTxt, img, tauntTxt], alpha: 1, duration: 1200, delay: 100,
      onComplete: () => this._showBoardPrompt(),
    });
  }

  _showBoardPrompt() {
    const prompt = this.add.text(
      CANVAS_W / 2, CANVAS_H - 18,
      'Press any key or tap to face The Board',
      { fontFamily: 'monospace', fontSize: '12px', color: '#ff8888', align: 'center' }
    ).setOrigin(0.5, 1).setAlpha(0);

    this.tweens.add({
      targets: prompt, alpha: 1,
      duration: INTRO_PULSE_MS, ease: 'Sine.easeInOut', yoyo: true, repeat: -1,
    });

    this.input.keyboard.once('keydown', () => this._proceed());
    this.input.once('pointerdown', () => this._proceed());
  }

  _proceed() {
    this.tweens.killAll();
    this.time.removeAllEvents();
    this.scene.start('DraftScene', {
      character:    this._character,
      slotIndex:    this._slotIndex,
      floor:        SECRET_FLOOR,
      loadout:      this._loadout,
      powerupSlots: this._powerupSlots,
    });
  }
}
