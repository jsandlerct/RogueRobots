import Phaser from 'phaser';
import BootScene from './scenes/BootScene.js';
import DraftScene from './scenes/DraftScene.js';
import GameScene from './scenes/GameScene.js';

const config = {
  type: Phaser.AUTO,
  backgroundColor: '#1a1a2e',
  scene: [BootScene, DraftScene, GameScene],
  pixelArt: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 480,
    height: 640,
    parent: 'app',
  },
};

new Phaser.Game(config);
