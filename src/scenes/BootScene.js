import Phaser from 'phaser';
import { SPRITE_ATLAS, ANIM_DEFS } from '../data/spriteData.js';

export default class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    const units = ['grunt', 'punchbot', 'zapbot', 'tankbot'];
    for (const key of units) {
      this.load.atlas(key, `assets/spritesheets/${key}.png`, SPRITE_ATLAS[key]);
    }
    this.load.atlas('base', 'assets/spritesheets/base.png', SPRITE_ATLAS.base);
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
