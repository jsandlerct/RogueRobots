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
// Newer sheets — Walk:6, Attack:4, Die:5
const LARGE_645 = [460, 416,  88, 600, 1119, 2816, 1536, 6, 4, 5];
const SMALL_645 = [167, 151,  32, 218,  407, 1024,  559, 6, 4, 5];

// Base sheet — Regular:6, Damaged:4, Destroyed:5 (same pixel grid as SMALL)
function buildBaseAtlas() {
  return buildAtlas(167, 151, 32, 218, 407, 1024, 559, 6, 4, 5);
}

export const SPRITE_ATLAS = {
  grunt:     buildAtlas(...LARGE),
  punchbot:  buildAtlas(...LARGE),
  zapbot:    buildAtlas(...LARGE),
  floatbot:  buildAtlas(...LARGE),
  tankbot:   buildAtlas(...SMALL),
  scavenger: buildAtlas(...SMALL),
  boombot:   buildAtlas(...SMALL),
  boomtrap:  buildAtlas(...SMALL),
  cannonbot: buildAtlas(...LARGE_645),
  tower:     buildAtlas(...LARGE_645),
  wallbot:   buildAtlas(...SMALL_645),
  spawnbot:  buildAtlas(...SMALL_645),
  base:      buildBaseAtlas(),
};

// Maps unit name to its atlas key. Units not listed fall back to colored rects.
export const UNIT_SPRITE_KEY = {
  Grunt:          'grunt',
  Bug:            'grunt',
  Spambot:        'grunt',
  Punchbot:       'punchbot',
  Commando:       'punchbot',
  Medibot:        'zapbot',
  Zapbot:         'zapbot',
  Snipebot:       'zapbot',
  Floatbot:       'floatbot',
  Tankbot:        'tankbot',
  Scavenger:      'scavenger',
  Boombot:        'boombot',
  Boomtrap:       'boomtrap',
  Cannonbot:      'cannonbot',
  Juggernaut:     'cannonbot',
  Carrierbot:     'cannonbot',
  'Zap Tower':    'tower',
  'Snipe Tower':  'tower',
  'Spawn Tower':  'tower',
  Wallbot:        'wallbot',
  Spawnbot:       'spawnbot',
  Datamine:       'base',
};

// Color tint (0xRRGGBB) applied to player sprites that share a base atlas.
// Units not listed here get no tint (sprite appears as-is for player, orange for NPC).
export const UNIT_SPRITE_TINT = {
  Spambot:        0x777777,
  Commando:       0x336644,
  Medibot:        0xff8800,
  Snipebot:       0x226633,
  Cannonbot:      0xcc2222,
  Juggernaut:     0x991122,
  Carrierbot:     0x1a3388,
  'Zap Tower':    0x882299,
  'Snipe Tower':  0x226633,
  'Spawn Tower':  0xccaa00,
};

// Animation definitions — created once in BootScene after assets are loaded.
export const ANIM_DEFS = [
  // Original sheets: Walk:6, Attack:5, Die:6
  ...['grunt', 'punchbot', 'zapbot', 'tankbot', 'scavenger', 'boombot', 'boomtrap'].flatMap(key => [
    { key: `${key}_walk`,   atlas: key, prefix: 'walk_',   start: 0, end: 5, frameRate: 8,  repeat: -1 },
    { key: `${key}_attack`, atlas: key, prefix: 'attack_', start: 0, end: 4, frameRate: 10, repeat: -1 },
    { key: `${key}_die`,    atlas: key, prefix: 'die_',    start: 0, end: 5, frameRate: 8,  repeat: 0  },
  ]),
  // Floatbot: walk uses all 6 frames; body-drift correction applied via spriteSourceSize in BootScene
  { key: 'floatbot_walk',   atlas: 'floatbot', prefix: 'walk_',   start: 0, end: 5, frameRate: 6, repeat: -1 },
  { key: 'floatbot_attack', atlas: 'floatbot', prefix: 'attack_', start: 0, end: 4, frameRate: 10, repeat: -1 },
  { key: 'floatbot_die',    atlas: 'floatbot', prefix: 'die_',    start: 0, end: 5, frameRate: 8,  repeat: 0  },
  // Newer sheets: Walk:6, Attack:4, Die:5
  ...['tower', 'wallbot', 'spawnbot'].flatMap(key => [
    { key: `${key}_walk`,   atlas: key, prefix: 'walk_',   start: 0, end: 5, frameRate: 8,  repeat: -1 },
    { key: `${key}_attack`, atlas: key, prefix: 'attack_', start: 0, end: 3, frameRate: 10, repeat: -1 },
    { key: `${key}_die`,    atlas: key, prefix: 'die_',    start: 0, end: 4, frameRate: 8,  repeat: 0  },
  ]),
  // Cannonbot: attack uses only frame 0 (static pose) — muzzle-blast frames shift the body
  { key: 'cannonbot_walk',   atlas: 'cannonbot', prefix: 'walk_',   start: 0, end: 5, frameRate: 8, repeat: -1 },
  { key: 'cannonbot_attack', atlas: 'cannonbot', prefix: 'attack_', start: 0, end: 0, frameRate: 4, repeat: -1 },
  { key: 'cannonbot_die',    atlas: 'cannonbot', prefix: 'die_',    start: 0, end: 4, frameRate: 8, repeat: 0  },
  // base animations (semantic names used by GameScene for base HP states)
  { key: 'base_regular',   atlas: 'base', prefix: 'walk_',   start: 0, end: 5, frameRate: 4, repeat: -1 },
  { key: 'base_damaged',   atlas: 'base', prefix: 'attack_', start: 0, end: 3, frameRate: 6, repeat: -1 },
  { key: 'base_destroyed', atlas: 'base', prefix: 'die_',    start: 0, end: 4, frameRate: 8, repeat: 0  },
  // standard walk/attack/die aliases so Datamine (atlas:'base') works via Unit.js
  { key: 'base_walk',   atlas: 'base', prefix: 'walk_',   start: 0, end: 5, frameRate: 4, repeat: -1 },
  { key: 'base_attack', atlas: 'base', prefix: 'attack_', start: 0, end: 3, frameRate: 6, repeat: -1 },
  { key: 'base_die',    atlas: 'base', prefix: 'die_',    start: 0, end: 4, frameRate: 8, repeat: 0  },
];
