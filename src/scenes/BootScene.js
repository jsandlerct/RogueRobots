import Phaser from 'phaser';
import { SPRITE_ATLAS, ANIM_DEFS } from '../data/spriteData.js';

// Atlas keys whose PNG uses magenta (0xFF00FF) as background instead of alpha transparency.
// Loaded as plain images first; converted to atlases after CPU-side magenta stripping.
const MAGENTA_KEYS = ['floatbot', 'boombot', 'boomtrap', 'cannonbot', 'tower', 'wallbot', 'spawnbot'];

const MAGENTA_URLS = {
  floatbot:  'assets/spritesheets/floatbot.png',
  boombot:   'assets/spritesheets/boombot spritesheet.png',
  boomtrap:  'assets/spritesheets/boomtrap spritesheet.png',
  cannonbot: 'assets/spritesheets/cannonbot spritesheet.png',
  tower:     'assets/spritesheets/tower spritesheet.png',
  wallbot:   'assets/spritesheets/wallbot spritesheet.png',
  spawnbot:  'assets/spritesheets/spawnbot spritesheet.png',
};

export default class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  init(data) {
    this._character  = data?.character  ?? null;
    this._slotIndex  = data?.slotIndex  ?? null;
  }

  preload() {
    for (const key of ['grunt', 'punchbot', 'zapbot', 'tankbot', 'scavenger']) {
      this.load.atlas(key, `assets/spritesheets/${key}.png`, SPRITE_ATLAS[key]);
    }
    this.load.atlas('base', 'assets/spritesheets/base.png', SPRITE_ATLAS.base);

    // Magenta-background sheets loaded as plain images so we can strip on CPU before GPU upload.
    for (const key of MAGENTA_KEYS) {
      this.load.image(key + '_raw', MAGENTA_URLS[key]);
    }

    this.load.image('battery1', 'assets/images/battery1.png');
    this.load.image('battery2', 'assets/images/battery2.png');
    this.load.image('battery3', 'assets/images/battery3.png');
    this.load.image('silicon1', 'assets/images/silicon1.png');
    this.load.image('silicon2', 'assets/images/silicon2.png');
    this.load.image('silicon3', 'assets/images/silicon3.png');
  }

  create() {
    for (const key of MAGENTA_KEYS) {
      try {
        const rawTex = this.textures.get(key + '_raw');
        const rawSrc = rawTex && rawTex.source && rawTex.source[0];
        const img    = rawSrc && (rawSrc.image || rawSrc.canvas);
        if (!img) { console.warn(`[Boot] no source for ${key}_raw`); continue; }
        const canvas = this._stripMagenta(img);
        if (key === 'cannonbot') this._blankCannonbotFlash(canvas);
        const atlasData = (key === 'floatbot')
          ? this._normalizeWalkFrames(canvas, SPRITE_ATLAS.floatbot, 6)
          : SPRITE_ATLAS[key];
        this.textures.addAtlas(key, canvas, atlasData);
        this.textures.remove(key + '_raw');
      } catch (e) {
        console.warn(`[Boot] fixMagenta(${key}):`, e.message);
      }
    }

    for (const def of ANIM_DEFS) {
      try {
        if (!this.anims.exists(def.key)) {
          const frames = this.anims.generateFrameNames(def.atlas, {
            prefix: def.prefix, start: def.start, end: def.end,
          });
          if (frames.length > 0) {
            this.anims.create({ key: def.key, frames, frameRate: def.frameRate, repeat: def.repeat });
          }
        }
      } catch (e) { console.warn(`[Boot] anim ${def.key}:`, e.message); }
    }

    this.scene.start('DraftScene', { character: this._character, slotIndex: this._slotIndex, floor: 1 });
  }

  // Build a corrected atlas data object for sprites whose walk frames have the body
  // drifting to different positions.  For each walk frame we compute the center of mass
  // of the lower 60% of the frame (excluding the balloon / top decoration), then offset
  // every frame's spriteSourceSize so the body stays pinned to the same logical origin.
  _normalizeWalkFrames(canvas, atlasData, walkCount) {
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    // Measure body center for each walk frame using the lower 60% of the frame.
    const centers = [];
    for (let i = 0; i < walkCount; i++) {
      const f       = atlasData.frames[`walk_${i}`].frame;
      const startY  = Math.floor(f.h * 0.4);
      const id      = ctx.getImageData(f.x, f.y + startY, f.w, f.h - startY);
      const d       = id.data;
      let sumX = 0, sumY = 0, count = 0;
      for (let y = 0; y < id.height; y++) {
        for (let x = 0; x < id.width; x++) {
          if (d[(y * id.width + x) * 4 + 3] > 50) {
            sumX += x; sumY += y; count++;
          }
        }
      }
      centers.push(count > 0 ? { x: sumX / count, y: sumY / count } : { x: f.w / 2, y: f.h / 2 });
    }

    const avgX  = centers.reduce((s, c) => s + c.x, 0) / centers.length;
    const avgY  = centers.reduce((s, c) => s + c.y, 0) / centers.length;
    const padX  = Math.ceil(Math.max(...centers.map(c => Math.abs(c.x - avgX))));
    const padY  = Math.ceil(Math.max(...centers.map(c => Math.abs(c.y - avgY))));

    // All frames share the same enlarged sourceSize so origin stays consistent.
    const sample  = Object.values(atlasData.frames)[0].frame;
    const srcW    = sample.w + padX * 2;
    const srcH    = sample.h + padY * 2;

    const newFrames = {};
    for (const [key, data] of Object.entries(atlasData.frames)) {
      const { w, h } = data.frame;
      if (key.startsWith('walk_')) {
        const i  = parseInt(key.slice(5), 10);
        const dx = Math.round(avgX - centers[i].x) + padX;
        const dy = Math.round(avgY - centers[i].y) + padY;
        newFrames[key] = {
          ...data, trimmed: true,
          spriteSourceSize: { x: dx, y: dy, w, h },
          sourceSize: { w: srcW, h: srcH },
        };
      } else {
        newFrames[key] = {
          ...data, trimmed: true,
          spriteSourceSize: { x: padX, y: padY, w, h },
          sourceSize: { w: srcW, h: srcH },
        };
      }
    }
    return { frames: newFrames, meta: atlasData.meta };
  }

  // Erase cannonbot attack frames 1-3 (muzzle-blast frames that shift the visual center).
  _blankCannonbotFlash(canvas) {
    const ctx     = canvas.getContext('2d');
    const atkY    = 600;
    const frameH  = 416;
    const frameW  = 460;
    const step    = 468;
    const marginX = 8;
    for (let f = 1; f <= 3; f++) {
      ctx.clearRect(marginX + f * step, atkY, frameW, frameH);
    }
  }

  // Return a canvas copy of img with magenta (high-R, low-G, high-B) pixels zeroed out.
  _stripMagenta(img) {
    const w = img.naturalWidth  || img.width;
    const h = img.naturalHeight || img.height;
    const canvas = document.createElement('canvas');
    canvas.width  = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(img, 0, 0);
    const id = ctx.getImageData(0, 0, w, h);
    const d  = id.data;
    for (let i = 0; i < d.length; i += 4) {
      if (d[i] > 150 && d[i + 1] < 100 && d[i + 2] > 150) d[i + 3] = 0;
    }
    ctx.putImageData(id, 0, 0);
    return canvas;
  }
}
