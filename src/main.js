import Phaser from 'phaser';
import { CANVAS_W, CANVAS_H, CANVAS_BG } from './data/constants.js';
import IntroScene from './scenes/IntroScene.js';
import TitleScene from './scenes/TitleScene.js';
import CharacterSelectScene from './scenes/CharacterSelectScene.js';
import BootScene from './scenes/BootScene.js';
import NarrativeScene from './scenes/NarrativeScene.js';
import DraftScene from './scenes/DraftScene.js';
import GameScene from './scenes/GameScene.js';

const config = {
  type: Phaser.AUTO,
  backgroundColor: CANVAS_BG,
  scene: [IntroScene, TitleScene, CharacterSelectScene, BootScene, NarrativeScene, DraftScene, GameScene],
  pixelArt: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: CANVAS_W,
    height: CANVAS_H,
    parent: 'app',
  },
};

new Phaser.Game(config);
