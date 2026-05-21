import Phaser from 'phaser';
import { CANVAS_W, CANVAS_H, INTRO_PULSE_MS } from '../data/constants.js';

const PARTNER_SPEECH =
  'Your partner\'s voice crackles over comms, barely holding it together.\n\n' +
  '"You did it. You actually did it.\n\n' +
  'The Board — the ones behind everything — they\'re gone. Every AI you fought, ' +
  'every upgrade, every relentless wave... all of it ran through them. ' +
  'Without The Board, the network collapses. The machines go dark.\n\n' +
  'Humanity is safe. Not just for now — for real this time.\n\n' +
  'People will rebuild. Reconnect. Live without fear of what comes in the night.\n\n' +
  'I don\'t have words for what you just did. You\'re a hero. A real one.\n\n' +
  'Get back here. We\'re celebrating — all of us.\n' +
  'You have earned it."\n\n' +
  '✦  HUMANITY ENDURES  ✦';

export default class TrueVictoryScene extends Phaser.Scene {
  constructor() { super({ key: 'TrueVictoryScene' }); }

  init(data) {
    this._character = data?.character ?? null;
    this._done      = false;
  }

  create() {
    const cx       = CANVAS_W / 2;
    const charName = this._character?.name ?? 'Agent';

    this.add.rectangle(cx, CANVAS_H / 2, CANVAS_W, CANVAS_H, 0x000011);

    const stars = this.add.text(cx, 18, '✦  TRUE VICTORY  ✦', {
      fontFamily: 'monospace', fontSize: '26px',
      color: '#ffdd44', fontStyle: 'bold', align: 'center',
    }).setOrigin(0.5, 0).setAlpha(0);

    const heroLine = this.add.text(cx, 68,
      `Agent ${charName} saves humanity.`,
      { fontFamily: 'monospace', fontSize: '14px', color: '#aaddff', fontStyle: 'italic', align: 'center' }
    ).setOrigin(0.5, 0).setAlpha(0);

    const storyTxt = this.add.text(cx, 108, PARTNER_SPEECH, {
      fontFamily: 'monospace', fontSize: '13px',
      color: '#ccddee', align: 'center',
      wordWrap: { width: CANVAS_W - 60 }, lineSpacing: 4,
    }).setOrigin(0.5, 0).setAlpha(0);

    this.tweens.add({
      targets: [stars, heroLine, storyTxt], alpha: 1, duration: 1400,
      onComplete: () => this._showPrompt(),
    });

    this.input.keyboard.on('keydown', () => this._advance());
    this.input.on('pointerdown',       () => this._advance());
  }

  _showPrompt() {
    const p = this.add.text(
      CANVAS_W / 2, CANVAS_H - 18,
      'Press any key or tap to return to HQ',
      { fontFamily: 'monospace', fontSize: '12px', color: '#44ff88', align: 'center' }
    ).setOrigin(0.5, 1).setAlpha(0);

    this.tweens.add({
      targets: p, alpha: 1,
      duration: INTRO_PULSE_MS, ease: 'Sine.easeInOut', yoyo: true, repeat: -1,
    });
  }

  _advance() {
    if (this._done) return;
    this._done = true;
    this.tweens.killAll();
    this.scene.start('CharacterSelectScene');
  }
}
