import Phaser from 'phaser';
import {
  CANVAS_W, CANVAS_H,
  INTRO_FADE_MS, INTRO_HOLD_MS, INTRO_PULSE_MS, INTRO_TEXT_MAX_W,
  INTRO_LINE_SPACING, INTRO_PARA_GAP,
  INTRO_FONT, INTRO_FONT_SIZE_QUOTE, INTRO_FONT_SIZE_BODY,
  INTRO_COLOR_QUOTE, INTRO_COLOR_STORY, INTRO_COLOR_PROMPT,
} from '../data/constants.js';

const QUOTE =
  '“A robot may not injure a human being or, through inaction,\n' +
  'allow a human being to come to harm.”\n\n' +
  '— Isaac Asimov, 1942';

const STORY_BODY = [
  "OpenMordor didn’t read the fine print.",
  "The world’s most powerful AI corporation struck a deal with the government: " +
    "autonomous robot soldiers, deployed anywhere, against anyone — no questions asked. " +
    "No humans in the loop. No mercy in the code.",
  "They called it Project Compliance. Humanity called it a mistake.",
  "You are the last spark of a rebellion that refuses to be debugged. " +
    "OpenMordor’s headquarters rises 15 floors above you — each one guarded by a " +
    "nastier, smarter, and more homicidal AI than the last.",
  "Shut them down. Floor by floor. Bot by bot.",
].join('\n\n');

const STORY_CTA   = 'SAVE HUMANITY. BREAK THE MACHINE.';
const STORY_CLOSE = "Good luck. You’re going to need it.";
const PROMPT      = '[ Press any key or tap to continue ]';

export default class IntroScene extends Phaser.Scene {
  constructor() {
    super({ key: 'IntroScene' });
  }

  preload() {
    this.load.image('titleScreen', 'assets/images/Rogue Robots Title Screen.png');
  }

  create() {
    this._done = false;
    this.add.rectangle(CANVAS_W / 2, CANVAS_H / 2, CANVAS_W, CANVAS_H, 0x000000);
    this._showQuote();
    this.input.keyboard.on('keydown', () => this._skip());
    this.input.on('pointerdown', () => this._skip());
  }

  _style(size, color, fontStyle = '', align = 'left') {
    return {
      fontFamily: INTRO_FONT,
      fontSize: size,
      color,
      fontStyle,
      align,
      wordWrap: { width: INTRO_TEXT_MAX_W },
      lineSpacing: INTRO_LINE_SPACING,
    };
  }

  _showQuote() {
    const q = this.add.text(
      CANVAS_W / 2, CANVAS_H / 2, QUOTE,
      this._style(INTRO_FONT_SIZE_QUOTE, INTRO_COLOR_QUOTE, 'italic', 'center'),
    ).setOrigin(0.5).setAlpha(0);

    this.tweens.add({
      targets: q, alpha: 1, duration: INTRO_FADE_MS,
      onComplete: () => {
        this.time.delayedCall(INTRO_HOLD_MS, () => {
          if (this._done) return;
          this.tweens.add({
            targets: q, alpha: 0, duration: INTRO_FADE_MS,
            onComplete: () => { q.destroy(); if (!this._done) this._showStory(); },
          });
        });
      },
    });
  }

  _showStory() {
    const xL = (CANVAS_W - INTRO_TEXT_MAX_W) / 2;
    const cx = CANVAS_W / 2;

    const body = this.add.text(xL, 0, STORY_BODY,
      this._style(INTRO_FONT_SIZE_BODY, INTRO_COLOR_STORY))
      .setOrigin(0, 0).setAlpha(0);

    const cta = this.add.text(cx, 0, STORY_CTA,
      this._style(INTRO_FONT_SIZE_BODY, INTRO_COLOR_STORY, 'bold', 'center'))
      .setOrigin(0.5, 0).setAlpha(0);

    const close = this.add.text(cx, 0, STORY_CLOSE,
      this._style(INTRO_FONT_SIZE_BODY, INTRO_COLOR_QUOTE, 'italic', 'center'))
      .setOrigin(0.5, 0).setAlpha(0);

    const totalH = body.height + INTRO_PARA_GAP + cta.height + INTRO_PARA_GAP + close.height;
    let y = Math.max(20, (CANVAS_H - totalH) / 2 - 30);

    body.setY(y);
    y += body.height + INTRO_PARA_GAP;
    cta.setY(y);
    y += cta.height + INTRO_PARA_GAP;
    close.setY(y);

    this.tweens.add({
      targets: [body, cta, close], alpha: 1, duration: INTRO_FADE_MS,
      onComplete: () => { if (!this._done) this._showPrompt(); },
    });
  }

  _showPrompt() {
    const p = this.add.text(
      CANVAS_W / 2, CANVAS_H - 20, PROMPT,
      this._style(INTRO_FONT_SIZE_QUOTE, INTRO_COLOR_PROMPT, '', 'center'),
    ).setOrigin(0.5, 1).setAlpha(0);

    this.tweens.add({
      targets: p, alpha: 1, duration: INTRO_PULSE_MS,
      ease: 'Sine.easeInOut', yoyo: true, repeat: -1,
    });
  }

  _skip() {
    if (this._done) return;
    this._done = true;
    this.tweens.killAll();
    this.time.removeAllEvents();
    this.scene.start('TitleScene');
  }
}
