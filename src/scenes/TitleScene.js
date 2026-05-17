import Phaser from 'phaser';
import { CANVAS_W, CANVAS_H, INTRO_FONT } from '../data/constants.js';

export default class TitleScene extends Phaser.Scene {
  constructor() {
    super({ key: 'TitleScene' });
  }

  create() {
    this.add.rectangle(CANVAS_W / 2, CANVAS_H / 2, CANVAS_W, CANVAS_H, 0x000000);

    this.add.text(CANVAS_W / 2, CANVAS_H / 2 - 30, 'ROGUE ROBOTS', {
      fontFamily: INTRO_FONT,
      fontSize: '36px',
      color: '#00ff88',
    }).setOrigin(0.5);

    this.add.text(CANVAS_W / 2, CANVAS_H / 2 + 30, '[ Press any key or tap to play ]', {
      fontFamily: INTRO_FONT,
      fontSize: '13px',
      color: '#cccccc',
    }).setOrigin(0.5);

    this.input.keyboard.once('keydown', () => this.scene.start('BootScene'));
    this.input.once('pointerdown', () => this.scene.start('BootScene'));
  }
}
