import Phaser from 'phaser';
import {
  CANVAS_W, CANVAS_H,
  INTRO_FONT, INTRO_FONT_SIZE_BODY, INTRO_FONT_SIZE_QUOTE,
  INTRO_COLOR_STORY, INTRO_COLOR_QUOTE, INTRO_COLOR_PROMPT,
  INTRO_TEXT_MAX_W, INTRO_LINE_SPACING, INTRO_PARA_GAP, INTRO_PULSE_MS,
} from '../data/constants.js';

const PARA1 = "You have this strange feeling of Déjà vu…";

const PARA3 =
  "As your partner prepares to leave and head back to HQ, they say, " +
  "'OK. I'm headed out. Don't worry - if it looks like you're about to get overrun, " +
  "we'll pull you out so you can try again the next time we see an opening. " +
  "Good luck. Humanity is depending on you.'";

const PROMPT = "Press any key or tap to continue";

function getPara2(highestFloor, charName) {
  if (highestFloor < 3) {
    return (
      "As the alarm starts blaring, your partner turns to you and says, " +
      "'Alright - we got you in. Remember your training. Next, you'll pick your loadout. " +
      "Definitely make sure you grab a Punchbot - that'll be key to getting some quick experience " +
      "on the first floor. Once you're there, deploy one as soon as possible or you'll be overrun quickly. " +
      "And don't forget what we discussed. We KNOW you'll be outgunned at first. " +
      "The goal is to gain experience and unlock new robots and skills for the next time. " +
      "The more you unlock, the further you'll go. It's our only hope.'"
    );
  }
  if (highestFloor <= 14) {
    return (
      `Over the blare of the alarm, your partner turns to you and says, ` +
      `'Ok ${charName} - you know the drill. Get in there and go as far as you can. ` +
      `Your goal is to get as far as you can and keep learning. Unlock more robots and skills. ` +
      `You've gotten so much stronger but you still haven't reached the power we need to finish this.'`
    );
  }
  return (
    `Your partner turns to you. ` +
    `'You're so close, ${charName}. Keep pushing. ` +
    `You're now getting more and more powerful skills and bots. BREAK THE MACHINE!'`
  );
}

export default class NarrativeScene extends Phaser.Scene {
  constructor() {
    super({ key: 'NarrativeScene' });
  }

  init(data) {
    this._character = data?.character ?? null;
    this._slotIndex = data?.slotIndex ?? null;
  }

  create() {
    this._done = false;

    this.add.rectangle(CANVAS_W / 2, CANVAS_H / 2, CANVAS_W, CANVAS_H, 0x000000);

    const highestFloor = this._character?.highestFloor ?? 1;
    const charName     = this._character?.name ?? 'Agent';

    const paras = [PARA1, getPara2(highestFloor, charName), PARA3];

    const makeStyle = (color, fontStyle = '') => ({
      fontFamily:  INTRO_FONT,
      fontSize:    INTRO_FONT_SIZE_BODY,
      color,
      fontStyle,
      wordWrap:    { width: INTRO_TEXT_MAX_W },
      lineSpacing: INTRO_LINE_SPACING,
    });

    const xL = (CANVAS_W - INTRO_TEXT_MAX_W) / 2;

    const textObjs = paras.map((para, i) => {
      const color     = i === 0 ? INTRO_COLOR_QUOTE : INTRO_COLOR_STORY;
      const fontStyle = i === 0 ? 'italic' : '';
      return this.add.text(xL, 0, para, makeStyle(color, fontStyle))
        .setOrigin(0, 0).setAlpha(0);
    });

    const totalH = textObjs.reduce(
      (sum, t, i) => sum + t.height + (i < textObjs.length - 1 ? INTRO_PARA_GAP : 0),
      0
    );
    let y = Math.max(20, (CANVAS_H - totalH) / 2 - 20);
    textObjs.forEach(t => { t.setY(y); y += t.height + INTRO_PARA_GAP; });

    this.tweens.add({
      targets: textObjs, alpha: 1, duration: 600,
      onComplete: () => { if (!this._done) this._showPrompt(); },
    });

    this.input.keyboard.on('keydown', () => this._advance());
    this.input.on('pointerdown', () => this._advance());
  }

  _showPrompt() {
    const p = this.add.text(
      CANVAS_W / 2, CANVAS_H - 18, PROMPT,
      {
        fontFamily: INTRO_FONT,
        fontSize:   INTRO_FONT_SIZE_QUOTE,
        color:      INTRO_COLOR_PROMPT,
        align:      'center',
      }
    ).setOrigin(0.5, 1).setAlpha(0);

    this.tweens.add({
      targets: p, alpha: 1, duration: INTRO_PULSE_MS,
      ease: 'Sine.easeInOut', yoyo: true, repeat: -1,
    });
  }

  _advance() {
    if (this._done) return;
    this._done = true;
    this.tweens.killAll();
    this.time.removeAllEvents();
    this.scene.start('DraftScene', {
      character: this._character,
      slotIndex: this._slotIndex,
      floor:     1,
    });
  }
}
