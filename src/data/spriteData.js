// Sprite sheet configuration for all units that have artwork.
// Units not listed here fall back to colored-rectangle rendering.
//
// Large sheets (grunt, punchbot, zapbot): 2816×1536
//   frame 460×416 — x = 8 + n*468, Walk y=88, Attack y=600, Die y=1119
//
// Small sheets (tankbot, base): 1024×559
//   frame 167×151 — x = 3 + n*170, Walk y=32, Attack y=218, Die y=407

function buildAtlas(frameW, frameH, walky, attackY, dieY, totalW, totalH, walkFrames, attackFrames, dieFrames) {
  const step = frameW + (totalW === 2816 ? 8 : 3);
  const marginX = totalW === 2816 ? 8 : 3;
  const frames = {};

  const addRow = (prefix, count, y) => {
    for (let i = 0; i < count; i++) {
      const x = marginX + i * step;
      frames[`${prefix}${i}`] = {
        frame: { x, y, w: frameW, h: frameH },
        rotated: false,
        trimmed: false,
        spriteSourceSize: { x: 0, y: 0, w: frameW, h: frameH },
        sourceSize: { w: frameW, h: frameH },
      };
    }
  };

  addRow('walk_',   walkFrames,   walky);
  addRow('attack_', attackFrames, attackY);
  addRow('die_',    dieFrames,    dieY);

  return { frames, meta: { size: { w: totalW, h: totalH } } };
}

// Unit sheets — Walk:6, Attack:5, Die:6
// Order matches buildAtlas signature: frameW, frameH, walky, attackY, dieY, totalW, totalH, walkN, attackN, dieN
const LARGE = [460, 416,  88, 600, 1119, 2816, 1536, 6, 5, 6];
const SMALL = [167, 151,  32, 218,  407, 1024,  559, 6, 5, 6];

// Base sheet — Regular:6, Damaged:4, Destroyed:5 (same pixel grid as SMALL)
function buildBaseAtlas() {
  return buildAtlas(167, 151, 32, 218, 407, 1024, 559, 6, 4, 5);
}

export const SPRITE_ATLAS = {
  grunt:    buildAtlas(...LARGE),
  punchbot: buildAtlas(...LARGE),
  zapbot:   buildAtlas(...LARGE),
  tankbot:  buildAtlas(...SMALL),
  base:     buildBaseAtlas(),
};

// Maps unit name (lowercase) to its atlas key. Units not listed use colored rects.
export const UNIT_SPRITE_KEY = {
  Grunt:    'grunt',
  Punchbot: 'punchbot',
  Zapbot:   'zapbot',
  Tankbot:  'tankbot',
};

// Animation definitions — created once in BootScene after assets are loaded.
export const ANIM_DEFS = [
  // unit walk/attack/die animations
  ...['grunt', 'punchbot', 'zapbot', 'tankbot'].flatMap(key => [
    { key: `${key}_walk`,   atlas: key, prefix: 'walk_',   start: 0, end: 5, frameRate: 8,  repeat: -1 },
    { key: `${key}_attack`, atlas: key, prefix: 'attack_', start: 0, end: 4, frameRate: 10, repeat: -1 },
    { key: `${key}_die`,    atlas: key, prefix: 'die_',    start: 0, end: 5, frameRate: 8,  repeat: 0  },
  ]),
  // base animations
  { key: 'base_regular',   atlas: 'base', prefix: 'walk_',   start: 0, end: 5, frameRate: 4, repeat: -1 },
  { key: 'base_damaged',   atlas: 'base', prefix: 'attack_', start: 0, end: 3, frameRate: 6, repeat: -1 },
  { key: 'base_destroyed', atlas: 'base', prefix: 'die_',    start: 0, end: 4, frameRate: 8, repeat: 0  },
];
