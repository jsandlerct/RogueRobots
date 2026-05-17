import Phaser from 'phaser';
import { CANVAS_W, CANVAS_H, INTRO_FONT } from '../data/constants.js';

export default class TitleScene extends Phaser.Scene {
  constructor() {
    super({ key: 'TitleScene' });
  }

  create() {
    const img = this.add.image(CANVAS_W / 2, CANVAS_H / 2, 'titleScreen');
    const scaleX = CANVAS_W / img.width;
    const scaleY = CANVAS_H / img.height;
    img.setScale(Math.min(scaleX, scaleY));

    this.add.text(CANVAS_W / 2, CANVAS_H - 20, '[ Press any key or tap to play ]', {
      fontFamily: INTRO_FONT,
      fontSize: '13px',
      color: '#cccccc',
    }).setOrigin(0.5, 1);

    this.input.keyboard.once('keydown', () => this.scene.start('BootScene'));
    this.input.once('pointerdown', () => this.scene.start('BootScene'));
  }
}
