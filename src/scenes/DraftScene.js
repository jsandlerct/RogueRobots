import Phaser from 'phaser';

export default class DraftScene extends Phaser.Scene {
  constructor() {
    super({ key: 'DraftScene' });
  }

  create() {
    const { width, height } = this.scale;

    this.add.text(width / 2, height / 2 - 40, 'Draft Screen', {
      fontSize: '32px',
      color: '#ffffff',
    }).setOrigin(0.5);

    this.add.text(width / 2, height / 2 + 20, 'Tap or click to start', {
      fontSize: '18px',
      color: '#aaaaaa',
    }).setOrigin(0.5);

    this.input.once('pointerdown', () => {
      this.scene.start('GameScene');
    });
  }
}
