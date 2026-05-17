// src/data/constants.js — single source of truth for all game constants.
// No other file may define named constants or use bare magic numbers.

// ── Test mode ─────────────────────────────────────────────────────────────────
export const TESTMODE            = 1;   // default on/off (toggled at runtime via DraftScene)
export const TESTMODE_RESOURCES  = { metal: 30, silicon: 30, batteries: 30 };

// ── Grid ──────────────────────────────────────────────────────────────────────
export const COLS      = 12;
export const ROWS      = 16;
export const TILE_SIZE = 36;
export const TILE_PAD  = 1;    // gap rendered between tiles
export const BOARD_W   = COLS * TILE_SIZE;   // 432
export const BOARD_H   = ROWS * TILE_SIZE;   // 576

// ── Canvas & layout ───────────────────────────────────────────────────────────
export const NPC_LOADOUT_BAR_H = 52;         // top bar height for NPC unit display
export const SIDE_PANEL_W      = 60;         // left & right panel width for base info
export const BOARD_OFFSET_X    = SIDE_PANEL_W;         // 60
export const BOARD_OFFSET_Y    = NPC_LOADOUT_BAR_H;    // 52
export const CANVAS_W  = SIDE_PANEL_W * 2 + BOARD_W;  // 552
export const CANVAS_H  = 688;   // NPC_LOADOUT_BAR_H(52) + BOARD_H(576) + loadout(60)
export const CANVAS_BG = '#1a1a2e';

// ── Tile values ───────────────────────────────────────────────────────────────
export const TILE_WALKABLE = 1;

// ── Bases & territorial divide ────────────────────────────────────────────────
export const NPC_BASE_COL    = 0;
export const NPC_BASE_ROW    = 0;
export const PLAYER_BASE_COL = 11;
export const PLAYER_BASE_ROW = 15;
export const BASE_HP         = 50;
export const BASE_ARMOR      = 0;
export const DIVIDE_ROW      = 8;   // rows 0–7 NPC territory; rows 8–15 player territory

// ── Spawning ──────────────────────────────────────────────────────────────────
export const PLAYER_SPAWN_INTERVAL_MS = 4000;
export const NPC_SPAWN_INTERVAL_MS    = 3000;
export const ESCALATION = [
  { atMs: 5  * 60 * 1000, intervalMs: 2000 },
  { atMs: 10 * 60 * 1000, intervalMs: 1000 },
];

// ── Economy ───────────────────────────────────────────────────────────────────
export const STARTING_RESOURCES      = { metal: 3, silicon: 0, batteries: 0 };
export const TOKEN_SPAWN_INTERVAL_MS  = 10000;
export const NPC_PURCHASE_INTERVAL_MS = 5000;
export const TOKEN_DROP_PROB_SMALL    = 0.40;  // amount 1
export const TOKEN_DROP_PROB_MEDIUM   = 0.50;  // amount 2; remaining 0.10 = large (amount 3)

// ── Combat ────────────────────────────────────────────────────────────────────
export const ATK_MS        = { slow: 2000, medium: 1000, fast: 500 };
export const MIN_DAMAGE    = 1;
export const RANGE_TOLERANCE   = 0.5;
export const BOOMBOT_AOE_RADIUS = 1.5;

// ── Unit movement ─────────────────────────────────────────────────────────────
export const MOVE_MS = { veryslow: 1000, slow: 750, medium: 300, fast: 150, none: 0 };

// ── Unit rendering ────────────────────────────────────────────────────────────
export const UNIT_SIZE         = TILE_SIZE - 8;   // 4 px inset per side within a tile
export const BASE_SPRITE_SIZE  = TILE_SIZE - 2;   // base sprite fits snugly in its tile
export const NPC_UNIT_TINT     = 0xff6644;
export const TEAM_BORDER_COLOR = { player: 0xff8800, npc: 0x00cc44 };
export const TEAM_BORDER_PX    = 3;

// ── Projectiles ───────────────────────────────────────────────────────────────
export const PROJECTILE_RADIUS          = 4;
export const PROJECTILE_GLOW_STRENGTH   = 6;
export const PROJECTILE_GLOW_QUALITY    = 0.1;
export const PROJECTILE_GLOW_DISTANCE   = 10;
export const PROJECTILE_MS_PER_TILE     = 100;
export const PROJECTILE_MIN_DURATION_MS = 80;

// ── Resource tokens ───────────────────────────────────────────────────────────
export const TOKEN_COLOR = { battery: 0x00ddff, silicon: 0xcc44ff };
export const TOKEN_SIZES = [
  { amount: 1, px: 24 },
  { amount: 2, px: 31 },
  { amount: 3, px: 34 },
];

// ── Map / tile colors ─────────────────────────────────────────────────────────
export const COLOR_WALL                 = 0x1e1e2e;
export const COLOR_PATH_NPC             = 0x3a4a5a;
export const COLOR_PATH_PLAYER          = 0x2a4a3a;
export const COLOR_DIVIDE               = 0xffee00;
export const COLOR_DIVIDE_ALPHA         = 0.85;
export const COLOR_DIVIDE_PX            = 2;
export const COLOR_NPC_BASE_FALLBACK    = 0xcc3333;
export const COLOR_PLAYER_BASE_FALLBACK = 0x3366cc;
export const COLOR_NPC_BASE_TINT        = 0xff8888;
export const COLOR_PLAYER_BASE_TINT     = 0x8888ff;

// ── Render depths ─────────────────────────────────────────────────────────────
export const DEPTH_BASE_SPRITE        = 2;
export const DEPTH_UNIT_SPRITE        = 5;
export const DEPTH_TOKEN              = 5;
export const DEPTH_UNIT_OUTLINE       = 6;
export const DEPTH_HUD                = 10;
export const DEPTH_PROJECTILE         = 10;
export const DEPTH_NPC_LOADOUT_BG     = 13;
export const DEPTH_NPC_LOADOUT_TEXT   = 14;
export const DEPTH_LOADOUT_SEL_FRAME  = 14;
export const DEPTH_LOADOUT_BG         = 15;
export const DEPTH_LOADOUT_TEXT       = 16;
export const DEPTH_COOLDOWN_OVERLAY   = 17;
export const DEPTH_COOLDOWN_TEXT      = 18;
export const DEPTH_ROUND_END_BG       = 20;
export const DEPTH_ROUND_END_TEXT     = 21;
export const DEPTH_ROUND_END_BTN      = 22;
export const DEPTH_FEEDBACK           = 30;

// ── Loadout bar (player — bottom) ─────────────────────────────────────────────
export const LOADOUT_SLOT_W      = 54;   // 8 × 54 = 432 = BOARD_W
export const LOADOUT_SLOT_H      = 60;
export const LOADOUT_BAR_X       = BOARD_OFFSET_X;     // aligns with board left edge
export const LOADOUT_BAR_Y       = NPC_LOADOUT_BAR_H + BOARD_H;   // 628
export const LOADOUT_NUM_SLOTS   = 8;
export const LOADOUT_COLOR_EMPTY = 0x2a2a4a;

// ── NPC loadout bar (top) ─────────────────────────────────────────────────────
export const NPC_SLOT_W = 54;
export const NPC_SLOT_H = 44;

// ── HUD ───────────────────────────────────────────────────────────────────────
export const HUD_PAD = 4;

// ── Round-end overlay ─────────────────────────────────────────────────────────
export const ROUND_END_PANEL_W     = 240;
export const ROUND_END_PANEL_H     = 110;
export const ROUND_END_PANEL_ALPHA = 0.9;

// ── Feedback banner ───────────────────────────────────────────────────────────
export const FEEDBACK_DURATION_MS = 1200;

// ── Draft screen ──────────────────────────────────────────────────────────────
export const DRAFT_CARD_W           = 128;  // 4 cols: (552 - 5×8) / 4
export const DRAFT_CARD_H           = 62;
export const DRAFT_CARD_PAD         = 8;
export const DRAFT_CARD_ROW_Y       = [122, 189, 256, 323, 390];
export const DRAFT_SLOT_Y           = 470;
export const DRAFT_SLOT_W           = 56;
export const DRAFT_SLOT_H           = 50;
export const DRAFT_SLOT_MARGIN      = 3;
export const DRAFT_CONFIRM_Y        = 538;
export const DRAFT_CONFIRM_BTN_W    = 160;
export const DRAFT_CONFIRM_BTN_H    = 36;
export const DRAFT_TESTMODE_Y       = 590;
export const DRAFT_COLOR_BG         = 0x0d0d1a;
export const DRAFT_COLOR_SLOT_EMPTY = 0x111122;
export const DRAFT_COLOR_CONFIRM_BG = 0x334455;
export const DRAFT_COLOR_LOCKED     = 0x1a1a2a;

// ── Pathfinding ───────────────────────────────────────────────────────────────
export const PATHFINDING_ITERATIONS = 10000;

// ── Intro scene ───────────────────────────────────────────────────────────────
export const INTRO_FADE_MS         = 1500;
export const INTRO_HOLD_MS         = 3000;
export const INTRO_PULSE_MS        = 800;
export const INTRO_TEXT_MAX_W      = 490;
export const INTRO_LINE_SPACING    = 7;
export const INTRO_PARA_GAP        = 12;
export const INTRO_FONT            = "'Share Tech Mono', 'Courier New', monospace";
export const INTRO_FONT_SIZE_QUOTE = '13px';
export const INTRO_FONT_SIZE_BODY  = '15px';
export const INTRO_COLOR_QUOTE     = '#cccccc';
export const INTRO_COLOR_STORY     = '#ffffff';
export const INTRO_COLOR_PROMPT    = '#00ff88';
