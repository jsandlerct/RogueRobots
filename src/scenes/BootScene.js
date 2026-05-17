import Phaser from 'phaser';
import { SPRITE_ATLAS, ANIM_DEFS } from '../data/spriteData.js';

export default class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    const units = ['grunt', 'punchbot', 'zapbot', 'floatbot', 'tankbot', 'scavenger'];
    for (const key of units) {
      this.load.atlas(key, `assets/spritesheets/${key}.png`, SPRITE_ATLAS[key]);
    }
    this.load.atlas('boombot',  'assets/spritesheets/boombot spritesheet.png',  SPRITE_ATLAS.boombot);
    this.load.atlas('boomtrap', 'assets/spritesheets/boomtrap spritesheet.png', SPRITE_ATLAS.boomtrap);
    this.load.atlas('base', 'assets/spritesheets/base.png', SPRITE_ATLAS.base);

    this.load.image('battery1', 'assets/images/battery1.png');
    this.load.image('battery2', 'assets/images/battery2.png');
    this.load.image('battery3', 'assets/images/battery3.png');
    this.load.image('silicon1', 'assets/images/silicon1.png');
    this.load.image('silicon2', 'assets/images/silicon2.png');
    this.load.image('silicon3', 'assets/images/silicon3.png');
  }

  create() {
    for (const def of ANIM_DEFS) {
      if (!this.anims.exists(def.key)) {
        this.anims.create({
          key:       def.key,
          frames:    this.anims.generateFrameNames(def.atlas, {
            prefix: def.prefix, start: def.start, end: def.end,
          }),
          frameRate: def.frameRate,
          repeat:    def.repeat,
        });
      }
    }
    this.scene.start('DraftScene');
  }
}
