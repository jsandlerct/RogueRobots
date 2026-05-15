import Phaser from 'phaser';

export default class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    // No assets to load in MVP — sprites are colored rectangles
  }

  create() {
    this.scene.start('DraftScene');
  }
}
