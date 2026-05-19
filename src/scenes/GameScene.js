import Phaser from 'phaser';
import {
  COLS, ROWS, TILE_SIZE, TILE_PAD, TILE_WALKABLE, TESTMODE_RESOURCES,
  BOARD_W, BOARD_H, BOARD_OFFSET_X, BOARD_OFFSET_Y,
  NPC_BASE_COL, NPC_BASE_ROW, PLAYER_BASE_COL, PLAYER_BASE_ROW,
  DIVIDE_ROW, BASE_HP, BASE_SPRITE_SIZE,
  NPC_UNIT_TINT, NPC_SLOT_W, NPC_SLOT_H, NPC_LOADOUT_BAR_H, LOADOUT_BAR_X,
  COLOR_WALL, COLOR_PATH_NPC, COLOR_PATH_PLAYER,
  COLOR_DIVIDE, COLOR_DIVIDE_ALPHA, COLOR_DIVIDE_PX,
  COLOR_NPC_BASE_FALLBACK, COLOR_PLAYER_BASE_FALLBACK,
  COLOR_NPC_BASE_TINT, COLOR_PLAYER_BASE_TINT,
  DEPTH_BASE_SPRITE, DEPTH_HUD,
  DEPTH_NPC_LOADOUT_BG, DEPTH_NPC_LOADOUT_TEXT,
  DEPTH_COOLDOWN_OVERLAY, DEPTH_COOLDOWN_TEXT,
  DEPTH_ROUND_END_BG, DEPTH_ROUND_END_TEXT, DEPTH_ROUND_END_BTN, DEPTH_FEEDBACK,
  ROUND_END_PANEL_W, ROUND_END_PANEL_H, ROUND_END_PANEL_ALPHA,
  TOKEN_SPAWN_INTERVAL_MS, TOKEN_DROP_PROB_SMALL, TOKEN_DROP_PROB_MEDIUM,
  NPC_PURCHASE_INTERVAL_MS, NPC_FAVORITE_SPAWN_INTERVAL_MS, FEEDBACK_DURATION_MS,
  SPAWNBOT_INTERVAL_MS, DATAMINE_INTERVAL_MS, CARRIERBOT_INTERVAL_MS,
  XP_TO_NEXT, MAX_LEVEL, MAX_FLOORS, XP_PER_KILL, XP_PER_FLOOR,
  XP_BAR_H, XP_BAR_DEPTH, XP_BAR_COLOR_BG, XP_BAR_COLOR,
  CHARSEL_SAVE_KEY,
  PASSIVE_LEVEL_IMPROVED, PASSIVE_LEVEL_ADVANCED, PASSIVE_LEVEL_SUPERIOR,
  PASSIVE_LEVEL_PERFECTED, PASSIVE_LEVEL_ASI,
  POWERUP_EMP_DURATION_MS, POWERUP_OVERCHARGE_DURATION_MS,
  POWERUP_FORTIFY_DURATION_MS, POWERUP_SUPPLY_RESOURCES, POWERUP_SURGE_COUNT,
} from '../data/constants.js';
import MapGenerator from '../map/MapGenerator.js';
import PathfindingSystem from '../systems/PathfindingSystem.js';
import SpawnSystem from '../systems/SpawnSystem.js';
import CombatSystem from '../systems/CombatSystem.js';
import EconomySystem from '../systems/EconomySystem.js';
import HUD from '../ui/HUD.js';
import LoadoutBar from '../ui/LoadoutBar.js';
import PowerupSystem from '../systems/PowerupSystem.js';
import PowerupBar from '../ui/PowerupBar.js';
import Unit from '../entities/Unit.js';
import ResourceToken from '../entities/ResourceToken.js';
import unitsData from '../data/units.json';
import floorsData from '../data/floors.json';

// Fallback loadout when GameScene is started directly (dev/testing)
const DEFAULT_LOADOUT = [
  'Punchbot', 'Zapbot', 'Scavenger', 'Boombot',
  'Tankbot', 'Floatbot', 'Boomtrap', 'Zap Tower',
];

const DEFAULT_FLOOR_CONFIG = {
  ai: 'ENEMY', favoriteUnit: 'Punchbot',
  resources: { metal: 0, silicon: 0, batteries: 0 },
  loadout: ['Punchbot', 'Punchbot', 'Zapbot', 'Zapbot'],
  quote: '',
};

export default class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  init(data) {
    this._loadout           = data?.loadout           ?? DEFAULT_LOADOUT;
    this._testMode          = data?.testMode          ?? false;
    this._character         = data?.character         ?? null;
    this._slotIndex         = data?.slotIndex         ?? null;
    this._floor             = data?.floor             ?? 1;
    this._startingResources = data?.startingResources ?? null;
    this._xpThisRound       = 0;
    this._levelUpsThisRound = [];
    this._passive           = this._getActivePassive(this._character?.level ?? 0);
    this._floorConfig       = floorsData.find(f => f.floor === this._floor) ?? DEFAULT_FLOOR_CONFIG;
  }

  _getActivePassive(level) {
    if (level >= PASSIVE_LEVEL_ASI)       return 'superintelligence';
    if (level >= PASSIVE_LEVEL_PERFECTED) return 'perfected_scavenging';
    if (level >= PASSIVE_LEVEL_SUPERIOR)  return 'superior_scavenging';
    if (level >= PASSIVE_LEVEL_ADVANCED)  return 'advanced_scavenging';
    if (level >= PASSIVE_LEVEL_IMPROVED)  return 'improved_scavenging';
    return null;
  }

  create() {
    const mapInstance = MapGenerator.selectArchetype();
    this._grid     = mapInstance.getGrid();
    this._mapPaths = mapInstance.getPaths ? mapInstance.getPaths() : null;

    this._renderNPCLoadoutBar();
    this._renderGrid(this._grid);
    this._renderDivideLine();
    this._renderBaseLabels();

    this.units           = [];
    this._tokens         = [];
    this._unitCooldowns  = new Map();
    this._npcCooldowns   = new Map();
    this._roundStartTime = null;
    this._roundOver      = false;

    this._economy = new EconomySystem(
      this._testMode ? TESTMODE_RESOURCES : (this._startingResources ?? undefined),
      this._floorConfig.resources
    );
    this._combat  = new CombatSystem(
      this,
      this._economy,
      (baseHp) => { this._hud.updateBaseHp(baseHp); this._updateBaseSprites(baseHp); },
      (winner) => this._onRoundEnd(winner),
      (col, row) => { this._awardXP(XP_PER_KILL); this._applyPassiveOnKill(col, row); }
    );

    this._hud = new HUD(this);
    this._hud.updateBaseHp(this._combat.baseHp);
    this._hud.updateResources(this._economy.playerResources);

    this._loadoutBar = new LoadoutBar(this, this._loadout);
    this._loadoutBar.refreshAffordability(this._economy.playerResources);
    this._loadoutBar.onSelect = (slotIndex, unitName) => this._onSlotSelected(slotIndex, unitName);
    this._dropMode = false;

    this._buildXpBar();

    this._pathfinding = new PathfindingSystem(this._grid);

    this._spawnSystem = new SpawnSystem(
      this, this._pathfinding, this._mapPaths,
      (team, path) => this._onUnitSpawned(team, path)
    );
    this._spawnSystem.start();

    if (this._passive === 'superintelligence') {
      this._deployUnit('Juggernaut', PLAYER_BASE_COL, PLAYER_BASE_ROW,
        unitsData.find(u => u.name === 'Juggernaut'));
    }

    this.time.addEvent({
      delay: TOKEN_SPAWN_INTERVAL_MS,
      loop: true,
      callback: this._spawnToken,
      callbackScope: this,
    });
    this._spawnToken();

    this._powerupSystem = new PowerupSystem(this, {
      grid:      this._grid,
      getTokens: () => this._tokens,
      addToken:  (t) => { this._tokens.push(t); this._wakeIdleScavengers(); },
    });
    this._powerupBar = new PowerupBar(this, (i) => this._onPowerupSlotTapped(i));
    this._powerupBar.refresh(this._powerupSystem.slots);

    this.time.addEvent({
      delay: NPC_PURCHASE_INTERVAL_MS,
      loop: true,
      callback: this._npcPurchaseTick,
      callbackScope: this,
    });

    this._spawnFavoriteUnit();
    this.time.addEvent({
      delay: NPC_FAVORITE_SPAWN_INTERVAL_MS,
      loop: true,
      callback: this._spawnFavoriteUnit,
      callbackScope: this,
    });

    this.input.on('pointerdown', (pointer) => {
      const inBoard =
        pointer.x >= BOARD_OFFSET_X &&
        pointer.x <  BOARD_OFFSET_X + BOARD_W &&
        pointer.y >= BOARD_OFFSET_Y &&
        pointer.y <  BOARD_OFFSET_Y + BOARD_H;
      if (inBoard) this._onBoardClick(pointer);
    });
  }

  update() {
    if (this._roundOver) return;

    if (this._roundStartTime === null) this._roundStartTime = this.time.now;

    this._hud.updateTimer(this.time.now - this._roundStartTime);
    this._hud.updateNpcResources(this._economy.npcResources);
    this._refreshEconomyUI();
    this._combat.update();
    this._loadoutBar.refreshCooldowns(this._unitCooldowns, this.time.now);
    this._refreshNpcLoadoutBar();
  }

  // ── Unit spawning (auto) ───────────────────────────────────────────────────

  _onUnitSpawned(team, path) {
    const unit = new Unit(this, path[0].x, path[0].y, 'Bug', team);
    this._attachTokenCallback(unit, team);
    unit.followPath(this._trimPathToRange(path, unit.stats.range));
    this._combat.addUnit(unit);
    this.units.push(unit);
  }

  _trimPathToRange(path, range) {
    const stop = Math.max(0, path.length - 1 - range);
    return path.slice(0, stop + 1);
  }

  // ── Slot selection → Base spawn or drop mode ─────────────────────────────

  _onSlotSelected(slotIndex, unitName) {
    if (!unitName) {
      this._exitDropMode();
      return;
    }
    const stats = unitsData.find(u => u.name === unitName);
    if (stats.spawn === 'Base') {
      this._exitDropMode();
      this._tryDeployAtBase(slotIndex, unitName, stats);
      this._loadoutBar.deselect();
    } else {
      this._enterDropMode();
    }
  }

  _tryDeployAtBase(slotIndex, unitName, stats) {
    if (!this._economy.canAfford(stats.cost)) {
      this._showFeedback('Not enough resources!');
      return;
    }
    const now        = this.time.now;
    const cooldownMs = (stats.cooldown ?? 0) * 1000;
    if (now - (this._unitCooldowns.get(slotIndex) ?? 0) < cooldownMs) {
      const remaining = Math.ceil((cooldownMs - (now - this._unitCooldowns.get(slotIndex))) / 1000);
      this._showFeedback(`${unitName} cooldown: ${remaining}s`);
      return;
    }
    this._economy.spend(stats.cost);
    this._unitCooldowns.set(slotIndex, now);
    this._refreshEconomyUI();
    this._deployUnit(unitName, PLAYER_BASE_COL, PLAYER_BASE_ROW, stats);
    this._showFeedback(`${unitName} deployed!`);
  }

  _enterDropMode() {
    this._dropMode = true;
    this.game.canvas.style.cursor = 'crosshair';
  }

  _exitDropMode() {
    this._dropMode = false;
    this.game.canvas.style.cursor = 'default';
  }

  // ── Deployment (drop) ─────────────────────────────────────────────────────

  _onBoardClick(pointer) {
    if (!this._dropMode) return;
    const slotIndex = this._loadoutBar.selectedSlotIndex;
    const unitName  = this._loadoutBar.selectedUnit;
    if (!unitName) return;

    const col = Math.floor((pointer.x - BOARD_OFFSET_X) / TILE_SIZE);
    const row = Math.floor((pointer.y - BOARD_OFFSET_Y) / TILE_SIZE);

    if (row < DIVIDE_ROW || row > ROWS - 1) {
      this._showFeedback('Player side only!');
      return;
    }

    const stats    = unitsData.find(u => u.name === unitName);
    const walkable = this._grid[row][col] === TILE_WALKABLE;

    if (!walkable) {
      this._showFeedback('Drop to path tiles only');
      return;
    }

    if (!this._economy.canAfford(stats.cost)) {
      this._showFeedback('Not enough resources!');
      return;
    }

    const now        = this.time.now;
    const cooldownMs = (stats.cooldown ?? 0) * 1000;
    if (now - (this._unitCooldowns.get(slotIndex) ?? 0) < cooldownMs) {
      const remaining = Math.ceil((cooldownMs - (now - this._unitCooldowns.get(slotIndex))) / 1000);
      this._showFeedback(`${unitName} cooldown: ${remaining}s`);
      return;
    }

    this._economy.spend(stats.cost);
    this._unitCooldowns.set(slotIndex, now);
    this._refreshEconomyUI();
    this._deployUnit(unitName, col, row, stats);
    this._exitDropMode();
    this._loadoutBar.deselect();
  }

  async _deployUnit(unitName, col, row, stats) {
    const unit = new Unit(this, col, row, unitName, 'player');
    this._attachTokenCallback(unit, 'player');
    this._combat.addUnit(unit);
    this.units.push(unit);

    if (stats.specialBehavior === 'scavenger') {
      await this._startScavengerPath(unit);
    } else if (stats.specialBehavior === 'floatbot_fly') {
      const path = this._straightLinePath(col, row, NPC_BASE_COL, NPC_BASE_ROW);
      unit.followPath(this._trimPathToRange(path, unit.stats.range));
    } else if (stats.moveSpeed !== 'none') {
      const path = await this._pathfinding.findPath(col, row, NPC_BASE_COL, NPC_BASE_ROW);
      if (path && path.length > 1) unit.followPath(this._trimPathToRange(path, unit.stats.range));
    }
    if (stats.specialBehavior === 'spawnbot' || stats.specialBehavior === 'spawn_tower') {
      this._startSpawnerInterval(unit, 'Bug', SPAWNBOT_INTERVAL_MS);
    } else if (stats.specialBehavior === 'carrierbot') {
      this._startSpawnerInterval(unit, 'Punchbot', CARRIERBOT_INTERVAL_MS);
    } else if (stats.specialBehavior === 'datamine') {
      this._startDatamineInterval(unit);
    }
    // Stationary units (moveSpeed "none") don't move; CombatSystem handles their attacks
  }

  _straightLinePath(fromCol, fromRow, toCol, toRow) {
    const path = [{ x: fromCol, y: fromRow }];
    let c = fromCol, r = fromRow;
    while (c !== toCol || r !== toRow) {
      if (c !== toCol) c += c < toCol ? 1 : -1;
      if (r !== toRow) r += r < toRow ? 1 : -1;
      path.push({ x: c, y: r });
    }
    return path;
  }

  // ── Spawnbot / Spawn Tower / Carrierbot ──────────────────────────────────

  _startSpawnerInterval(unit, spawnUnitName, intervalMs) {
    let timer;
    timer = this.time.addEvent({
      delay: intervalMs,
      loop: true,
      callback: () => {
        if (!unit.alive) { timer.remove(); return; }
        this._spawnUnitFromSpawner(unit, spawnUnitName);
      },
    });
  }

  async _spawnUnitFromSpawner(spawner, unitName) {
    if (!spawner.alive) return;
    const [targetCol, targetRow] = spawner.team === 'player'
      ? [NPC_BASE_COL, NPC_BASE_ROW]
      : [PLAYER_BASE_COL, PLAYER_BASE_ROW];
    const path = await this._pathfinding.findPath(
      spawner.col, spawner.row, targetCol, targetRow
    );
    if (!spawner.alive || !path || path.length < 1) return;
    const spawned = new Unit(this, spawner.col, spawner.row, unitName, spawner.team);
    this._attachTokenCallback(spawned, spawner.team);
    if (path.length > 1) spawned.followPath(this._trimPathToRange(path, spawned.stats.range));
    this._combat.addUnit(spawned);
    this.units.push(spawned);
  }

  // ── Datamine ──────────────────────────────────────────────────────────────

  _startDatamineInterval(unit) {
    let timer;
    timer = this.time.addEvent({
      delay: DATAMINE_INTERVAL_MS,
      loop: true,
      callback: () => {
        if (!unit.alive) { timer.remove(); return; }
        this._economy.awardDatamine(unit.team);
        this._refreshEconomyUI();
        this._pulseSprite(unit);
      },
    });
  }

  _pulseSprite(unit) {
    if (!unit.alive || !unit.sprite) return;
    this.tweens.add({
      targets: unit.sprite,
      scaleX: 1.6, scaleY: 1.6,
      duration: 160,
      yoyo: true,
      ease: 'Quad.easeOut',
    });
  }

  // ── Scavenger ─────────────────────────────────────────────────────────────

  async _startScavengerPath(unit) {
    if (!unit.alive) return;
    unit.onPathComplete = () => this._startScavengerPath(unit);
    const target = this._nearestToken(unit.col, unit.row);
    if (!target) return;
    const path = await this._pathfinding.findPath(
      unit.col, unit.row, target.col, target.row
    );
    if (!unit.alive) return;
    if (path && path.length > 1) {
      unit.atBase = false;
      unit.paused = false;
      unit.followPath(path);
    }
  }

  _wakeIdleScavengers() {
    for (const unit of this.units) {
      if (!unit.alive || unit.stats?.specialBehavior !== 'scavenger') continue;
      const idle = !unit._path || unit._pathIndex >= unit._path.length - 1;
      if (idle) this._startScavengerPath(unit);
    }
  }

  _nearestToken(col, row) {
    let nearest = null, best = Infinity;
    for (const t of this._tokens) {
      if (!t.alive) continue;
      const d = Math.abs(t.col - col) + Math.abs(t.row - row);
      if (d < best) { best = d; nearest = t; }
    }
    return nearest;
  }

  // ── Token lifecycle ───────────────────────────────────────────────────────

  _spawnToken() {
    const occupied = new Set(
      this._tokens.filter(t => t.alive).map(t => `${t.col},${t.row}`)
    );
    const candidates = [];
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (this._grid[r][c] !== TILE_WALKABLE) continue;
        if (c === NPC_BASE_COL    && r === NPC_BASE_ROW)    continue;
        if (c === PLAYER_BASE_COL && r === PLAYER_BASE_ROW) continue;
        if (occupied.has(`${c},${r}`)) continue;
        candidates.push({ col: c, row: r });
      }
    }
    if (candidates.length === 0) return;
    const tile   = Phaser.Utils.Array.GetRandom(candidates);
    const type   = Math.random() < 0.5 ? 'battery' : 'silicon';
    const r      = Math.random();
    const amount = r < TOKEN_DROP_PROB_SMALL ? 1
                 : r < TOKEN_DROP_PROB_SMALL + TOKEN_DROP_PROB_MEDIUM ? 2
                 : 3;
    this._tokens.push(new ResourceToken(this, tile.col, tile.row, type, amount));
    this._wakeIdleScavengers();
  }

  // ── Passive skill — on-kill drop ──────────────────────────────────────────

  _applyPassiveOnKill(col, row) {
    switch (this._passive) {
      case 'improved_scavenging':
        if (Math.random() < 0.5) this._awardRandomResource();
        break;
      case 'advanced_scavenging':
      case 'superior_scavenging':
        this._awardRandomResource();
        break;
      case 'perfected_scavenging':
        this._economy.awardResources({ metal: 2, silicon: 1, batteries: 1 });
        this._refreshEconomyUI();
        break;
    }
  }

  _awardRandomResource() {
    const res = Math.random() < 0.5
      ? { batteries: 1 }
      : { silicon: 1 };
    this._economy.awardResources(res);
    this._refreshEconomyUI();
  }

  _attachTokenCallback(unit, team) {
    unit.onTileEntered = (col, row) => this._onUnitTileEntered(col, row, unit, team);
  }

  _onUnitTileEntered(col, row, unit, team) {
    let collected = false;
    for (const token of this._tokens) {
      if (!token.alive || token.col !== col || token.row !== row) continue;

      if (token.type === 'powerup') {
        token.collect();
        if (team === 'player' && this._powerupSystem.hasSlotsAvailable()) {
          this._powerupSystem.collectFromMap(token.powerupType);
          this._powerupBar.refresh(this._powerupSystem.slots);
        }
        // Enemy walking over it: token is destroyed and lost.
        collected = true;
      } else {
        token.collect();
        if (team === 'player') this._economy.collectToken(token.type, token.amount);
        else if (team === 'npc') this._economy.collectNpcToken(token.type, token.amount);
        collected = true;
      }
    }
    this._tokens = this._tokens.filter(t => t.alive);

    if (collected && team === 'player') {
      this._refreshEconomyUI();
    }
    if (collected && team === 'npc') {
      this._hud.updateNpcResources(this._economy.npcResources);
    }
  }

  _refreshEconomyUI() {
    this._hud.updateResources(this._economy.playerResources);
    this._loadoutBar.refreshAffordability(this._economy.playerResources);
  }

  // ── NPC purchasing ────────────────────────────────────────────────────────

  _npcPurchaseTick() {
    const now = this.time.now;
    const eligible = this._floorConfig.loadout
      .map((unitName, i) => ({ unitName, i, stats: unitsData.find(u => u.name === unitName) }))
      .filter(({ i, stats }) => {
        const cooldownMs = (stats.cooldown ?? 0) * 1000;
        return now - (this._npcCooldowns.get(i) ?? 0) >= cooldownMs
            && this._economy.canAffordNpc(stats.cost);
      });
    if (eligible.length === 0) return;
    const pick = eligible[Math.floor(Math.random() * eligible.length)];
    this._economy.spendNpc(pick.stats.cost);
    this._npcCooldowns.set(pick.i, now);
    this._hud.updateNpcResources(this._economy.npcResources);
    this._deployNpcUnit(pick.unitName, pick.stats);
  }

  _spawnFavoriteUnit() {
    const unitName = this._floorConfig.favoriteUnit;
    const stats    = unitsData.find(u => u.name === unitName);
    if (!stats) return;

    if (stats.spawn === 'Drop') {
      const walkable = [];
      for (let r = 0; r < DIVIDE_ROW; r++) {
        for (let c = 0; c < COLS; c++) {
          if (this._grid[r][c] === TILE_WALKABLE) walkable.push({ col: c, row: r });
        }
      }
      if (walkable.length === 0) return;
      const { col, row } = walkable[Math.floor(Math.random() * walkable.length)];
      this._deployNpcAtTile(unitName, stats, col, row);
    } else {
      this._deployNpcUnit(unitName, stats);
    }
  }

  async _deployNpcAtTile(unitName, stats, col, row) {
    const unit = new Unit(this, col, row, unitName, 'npc');
    this._attachTokenCallback(unit, 'npc');
    this._combat.addUnit(unit);
    this.units.push(unit);

    if (stats.moveSpeed !== 'none') {
      const path = await this._pathfinding.findPath(col, row, PLAYER_BASE_COL, PLAYER_BASE_ROW);
      if (path && path.length > 1) unit.followPath(this._trimPathToRange(path, stats.range));
    }
    if (stats.specialBehavior === 'spawnbot' || stats.specialBehavior === 'spawn_tower') {
      this._startSpawnbotLoop(unit);
    }
  }

  async _deployNpcUnit(unitName, stats) {
    let path;
    const lanes = this._mapPaths?.npc;
    if (lanes?.length > 0) {
      path = lanes[Math.floor(Math.random() * lanes.length)];
    } else {
      path = await this._pathfinding.findPath(
        NPC_BASE_COL, NPC_BASE_ROW, PLAYER_BASE_COL, PLAYER_BASE_ROW
      );
    }
    if (!path || path.length <= 1) return;
    const unit = new Unit(this, path[0].x, path[0].y, unitName, 'npc');
    this._attachTokenCallback(unit, 'npc');
    unit.followPath(this._trimPathToRange(path, stats.range));
    this._combat.addUnit(unit);
    this.units.push(unit);
  }

  // ── XP & progression ─────────────────────────────────────────────────────

  _buildXpBar() {
    const x = BOARD_OFFSET_X;
    const y = BOARD_OFFSET_Y + BOARD_H - XP_BAR_H;
    const w = BOARD_W;

    this._xpBarBg   = this.add.rectangle(x + w / 2, y + XP_BAR_H / 2, w, XP_BAR_H, XP_BAR_COLOR_BG)
      .setDepth(XP_BAR_DEPTH).setOrigin(0.5);
    this._xpBarFill = this.add.rectangle(x, y + XP_BAR_H / 2, 0, XP_BAR_H, XP_BAR_COLOR)
      .setDepth(XP_BAR_DEPTH + 1).setOrigin(0, 0.5);
    this._updateXpBar();
  }

  _updateXpBar() {
    if (!this._xpBarFill || !this._character) return;
    const { level, xp } = this._character;
    if (level >= MAX_LEVEL) {
      this._xpBarFill.width = BOARD_W;
      return;
    }
    const needed  = XP_TO_NEXT[level - 1] ?? 1;
    const pct     = Math.min(xp / needed, 1);
    this._xpBarFill.width = Math.floor(BOARD_W * pct);
  }

  _awardXP(amount) {
    if (!this._character || this._roundOver) return;
    if (this._character.level >= MAX_LEVEL) return;

    this._xpThisRound += amount;

    let { level, xp } = this._character;
    xp += amount;

    while (level < MAX_LEVEL) {
      const needed = XP_TO_NEXT[level - 1];
      if (xp >= needed) {
        xp -= needed;
        level++;
        this._levelUpsThisRound.push(level);
      } else {
        break;
      }
    }

    this._character = { ...this._character, level, xp };
    this._saveCharacter();
    this._updateXpBar();
  }

  _saveCharacter() {
    if (this._slotIndex === null || this._slotIndex === undefined) return;
    try {
      const saves = JSON.parse(localStorage.getItem(CHARSEL_SAVE_KEY) || '[]');
      while (saves.length < 3) saves.push(null);
      saves[this._slotIndex] = {
        name:         this._character.name,
        level:        this._character.level,
        xp:           this._character.xp,
        highestFloor: this._character.highestFloor ?? 1,
      };
      localStorage.setItem(CHARSEL_SAVE_KEY, JSON.stringify(saves));
    } catch {}
  }

  // ── Round end + Play Again ────────────────────────────────────────────────

  _onRoundEnd(winner) {
    this._roundOver = true;
    this._exitDropMode();
    this._spawnSystem.stop();

    if (winner === 'player') {
      this._awardXP(XP_PER_FLOOR * this._floor);
      if (this._character && this._floor > (this._character.highestFloor ?? 1)) {
        this._character = { ...this._character, highestFloor: this._floor };
        this._saveCharacter();
      }
    }

    const isWin      = winner === 'player';
    const isRunEnd   = isWin && this._floor >= MAX_FLOORS;
    const msg        = isRunEnd ? 'RUN COMPLETE!' : (isWin ? `FLOOR ${this._floor} CLEAR!` : 'YOU LOSE!');
    const msgColor   = isWin ? '#44ff44' : '#ff4444';

    const cx = BOARD_OFFSET_X + BOARD_W / 2;
    const cy = BOARD_OFFSET_Y + BOARD_H / 2;

    this.add.rectangle(cx, cy, ROUND_END_PANEL_W, ROUND_END_PANEL_H, 0x000000, ROUND_END_PANEL_ALPHA)
      .setDepth(DEPTH_ROUND_END_BG);

    this.add.text(cx, cy - 68, msg, {
      fontSize: '24px', color: msgColor, fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(DEPTH_ROUND_END_TEXT);

    // XP summary
    if (this._character) {
      this.add.text(cx, cy - 34, `+${this._xpThisRound} XP`, {
        fontSize: '13px', color: '#88aaff', fontFamily: 'monospace',
      }).setOrigin(0.5).setDepth(DEPTH_ROUND_END_TEXT);

      if (this._levelUpsThisRound.length > 0) {
        const topLevel = this._levelUpsThisRound[this._levelUpsThisRound.length - 1];
        this.add.text(cx, cy - 14, `LEVEL UP!  Now Level ${topLevel}`, {
          fontSize: '12px', color: '#ffdd44', fontFamily: 'monospace', fontStyle: 'bold',
        }).setOrigin(0.5).setDepth(DEPTH_ROUND_END_TEXT);
      }

      const { level, xp } = this._character;
      const needed = level < MAX_LEVEL ? XP_TO_NEXT[level - 1] : '---';
      this.add.text(cx, cy + 8, `Level ${level}  ·  ${xp} / ${needed} XP`, {
        fontSize: '10px', color: '#556688', fontFamily: 'monospace',
      }).setOrigin(0.5).setDepth(DEPTH_ROUND_END_TEXT);
    }

    const btnLabel = isWin
      ? (isRunEnd ? '[ BACK TO HQ ]' : '[ NEXT FLOOR ]')
      : '[ BACK TO HQ ]';

    const btn = this.add.text(cx, cy + 60, btnLabel, {
      fontSize: '14px', color: '#ffffff', fontFamily: 'monospace',
      backgroundColor: '#1a2233', padding: { x: 12, y: 6 },
    }).setOrigin(0.5).setDepth(DEPTH_ROUND_END_BTN).setInteractive({ useHandCursor: true });

    btn.on('pointerdown', () => {
      if (isWin && !isRunEnd) {
        this.scene.start('DraftScene', {
          character: this._character,
          slotIndex: this._slotIndex,
          testMode:  this._testMode,
          floor:     this._floor + 1,
        });
      } else {
        this.scene.start('CharacterSelectScene');
      }
    });
  }

  // ── Powerup activation ────────────────────────────────────────────────────

  _onPowerupSlotTapped(slotIndex) {
    if (this._roundOver) return;
    const type = this._powerupSystem.consume(slotIndex);
    if (!type) return;
    this._powerupBar.refresh(this._powerupSystem.slots);
    this._applyPowerup(type);
  }

  _applyPowerup(type) {
    switch (type) {
      case 'emp':        this._activateEmp();        break;
      case 'airstrike':  this._activateAirstrike();   break;
      case 'overcharge': this._activateOvercharge();  break;
      case 'supply':     this._activateSupplyDrop();  break;
      case 'surge':      this._activateSurge();       break;
      case 'fortify':    this._activateFortify();     break;
    }
  }

  _activateEmp() {
    const now = this.time.now;
    for (const unit of this.units) {
      if (!unit.alive || unit.team !== 'npc') continue;
      if (unit.row < DIVIDE_ROW) continue;
      unit._empStunUntil = now + POWERUP_EMP_DURATION_MS;
    }
    this._showFeedback('EMP BLAST! Enemies stunned 3s');
  }

  _activateAirstrike() {
    for (const unit of [...this.units]) {
      if (!unit.alive || unit.team !== 'npc') continue;
      if (unit.row < DIVIDE_ROW) continue;
      unit.destroy();
      this._economy.awardKill('player');
      this._awardXP(XP_PER_KILL);
      this._applyPassiveOnKill(unit.col, unit.row);
    }
    this._showFeedback('AIRSTRIKE! Enemy units eliminated');
  }

  _activateOvercharge() {
    this._combat.activateOvercharge(POWERUP_OVERCHARGE_DURATION_MS);
    this._showFeedback('OVERCHARGE! 2× damage for 10s');
  }

  _activateSupplyDrop() {
    this._economy.awardResources(POWERUP_SUPPLY_RESOURCES);
    this._refreshEconomyUI();
    this._showFeedback('SUPPLY DROP! +10M +5Si +5B');
  }

  _activateSurge() {
    const stats = unitsData.find(u => u.name === 'Bug');
    if (!stats) return;
    for (let i = 0; i < POWERUP_SURGE_COUNT; i++) {
      this._deployUnit('Bug', PLAYER_BASE_COL, PLAYER_BASE_ROW, stats);
    }
    this._showFeedback('SURGE! +5 units deployed');
  }

  _activateFortify() {
    this._combat.activateFortify(POWERUP_FORTIFY_DURATION_MS);
    this._showFeedback('FORTIFY! Base shielded for 8s');
  }

  // ── Feedback ──────────────────────────────────────────────────────────────

  _showFeedback(msg) {
    const text = this.add.text(BOARD_OFFSET_X + BOARD_W / 2, BOARD_OFFSET_Y + BOARD_H / 2 - 40, msg, {
      fontSize: '13px', color: '#ffcc00', fontFamily: 'monospace',
      backgroundColor: '#000000cc', padding: { x: 8, y: 4 },
    }).setOrigin(0.5).setDepth(DEPTH_FEEDBACK);
    this.time.delayedCall(FEEDBACK_DURATION_MS, () => text.destroy());
  }

  // ── Rendering ─────────────────────────────────────────────────────────────

  _renderNPCLoadoutBar() {
    const gfx = this.add.graphics();
    gfx.fillStyle(0x0d0d1a, 1);
    gfx.fillRect(0, 0, BOARD_OFFSET_X + BOARD_W + BOARD_OFFSET_X, NPC_LOADOUT_BAR_H);
    gfx.lineStyle(1, 0x334455, 0.8);
    gfx.lineBetween(BOARD_OFFSET_X, NPC_LOADOUT_BAR_H - 1, BOARD_OFFSET_X + BOARD_W, NPC_LOADOUT_BAR_H - 1);

    this.add.text(30, NPC_LOADOUT_BAR_H / 2, this._floorConfig.ai.toUpperCase(), {
      fontSize: '8px', color: '#ff9999', fontFamily: 'monospace', align: 'center',
      wordWrap: { width: 56 },
    }).setOrigin(0.5, 0.5).setDepth(DEPTH_NPC_LOADOUT_TEXT);

    this._npcBarSlots = [];

    // Y positions for the three possible cost rows within the slot
    const RES_Y1 = 30;
    const RES_Y2 = 39;
    const RES_Y3 = 48;

    this._floorConfig.loadout.forEach((unitName, i) => {
      const stats     = unitsData.find(u => u.name === unitName);
      const fillColor = parseInt(stats.color.slice(1), 16);
      const cx = LOADOUT_BAR_X + i * NPC_SLOT_W + NPC_SLOT_W / 2;
      const cy = NPC_LOADOUT_BAR_H / 2;

      this.add.rectangle(cx, cy, NPC_SLOT_W - 2, NPC_SLOT_H - 2, fillColor)
        .setStrokeStyle(2, NPC_UNIT_TINT)
        .setDepth(DEPTH_NPC_LOADOUT_BG);

      this.add.text(cx, 5, unitName, {
        fontSize: '8px', color: '#ffffff', fontFamily: 'monospace', align: 'center',
        wordWrap: { width: NPC_SLOT_W - 4 },
      }).setOrigin(0.5, 0).setDepth(DEPTH_NPC_LOADOUT_TEXT);

      const { metal: m, silicon: s, batteries: b } = stats.cost;
      const resYs = [RES_Y1, RES_Y2, RES_Y3];
      let resIdx = 0;
      const makeResText = (str) => this.add.text(cx, resYs[resIdx++], str, {
        fontSize: '8px', color: '#dddddd', fontFamily: 'monospace', align: 'center',
      }).setOrigin(0.5, 0.5).setDepth(DEPTH_NPC_LOADOUT_TEXT);

      const metalText     = m ? makeResText(`M:${m}`)   : null;
      const siliconText   = s ? makeResText(`Si:${s}`)  : null;
      const batteriesText = b ? makeResText(`B:${b}`)   : null;
      if (!m && !s && !b) {
        this.add.text(cx, RES_Y2, 'Free', {
          fontSize: '8px', color: '#88cc88', fontFamily: 'monospace', align: 'center',
        }).setOrigin(0.5, 0.5).setDepth(DEPTH_NPC_LOADOUT_TEXT);
      }

      const cooldownOverlay = this.add
        .rectangle(cx, cy, NPC_SLOT_W - 2, NPC_SLOT_H - 2, 0x000000, 0.65)
        .setDepth(DEPTH_COOLDOWN_OVERLAY).setVisible(false);
      const cooldownText = this.add.text(cx, cy, '', {
        fontSize: '13px', color: '#ffffff', fontFamily: 'monospace', fontStyle: 'bold',
      }).setOrigin(0.5).setDepth(DEPTH_COOLDOWN_TEXT).setVisible(false);

      this._npcBarSlots.push({ unitName, index: i, metalText, siliconText, batteriesText, cooldownOverlay, cooldownText });
    });
  }

  _refreshNpcLoadoutBar() {
    const now = this.time.now;
    const res = this._economy.npcResources;
    for (const slot of this._npcBarSlots) {
      const stats      = unitsData.find(u => u.name === slot.unitName);
      const cooldownMs = (stats.cooldown ?? 0) * 1000;
      const elapsed    = now - (this._npcCooldowns.get(slot.index) ?? 0);
      const onCooldown = elapsed < cooldownMs;
      slot.cooldownOverlay.setVisible(onCooldown);
      slot.cooldownText.setVisible(onCooldown);
      if (onCooldown) slot.cooldownText.setText(Math.ceil((cooldownMs - elapsed) / 1000) + 's');

      const { metal: m, silicon: s, batteries: b } = stats.cost;
      if (slot.metalText)     slot.metalText.setColor(res.metal     >= (m || 0) ? '#dddddd' : '#ff4444');
      if (slot.siliconText)   slot.siliconText.setColor(res.silicon   >= (s || 0) ? '#dddddd' : '#ff4444');
      if (slot.batteriesText) slot.batteriesText.setColor(res.batteries >= (b || 0) ? '#dddddd' : '#ff4444');
    }
  }

  _renderGrid(grid) {
    const gfx = this.add.graphics();
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        const isNpcBase    = col === NPC_BASE_COL    && row === NPC_BASE_ROW;
        const isPlayerBase = col === PLAYER_BASE_COL && row === PLAYER_BASE_ROW;
        if (isNpcBase || isPlayerBase) {
          gfx.fillStyle(COLOR_PATH_NPC, 1);
          gfx.fillRect(
            BOARD_OFFSET_X + col * TILE_SIZE + TILE_PAD,
            BOARD_OFFSET_Y + row * TILE_SIZE + TILE_PAD,
            TILE_SIZE - TILE_PAD * 2, TILE_SIZE - TILE_PAD * 2,
          );
          continue;
        }
        const isPath = grid[row][col] === TILE_WALKABLE;
        const color  = isPath
          ? (row < DIVIDE_ROW ? COLOR_PATH_NPC : COLOR_PATH_PLAYER)
          : COLOR_WALL;
        gfx.fillStyle(color, 1);
        gfx.fillRect(
          BOARD_OFFSET_X + col * TILE_SIZE + TILE_PAD,
          BOARD_OFFSET_Y + row * TILE_SIZE + TILE_PAD,
          TILE_SIZE - TILE_PAD * 2, TILE_SIZE - TILE_PAD * 2,
        );
      }
    }
  }

  _renderDivideLine() {
    const gfx = this.add.graphics();
    gfx.lineStyle(COLOR_DIVIDE_PX, COLOR_DIVIDE, COLOR_DIVIDE_ALPHA);
    gfx.lineBetween(
      BOARD_OFFSET_X,
      BOARD_OFFSET_Y + DIVIDE_ROW * TILE_SIZE,
      BOARD_OFFSET_X + BOARD_W,
      BOARD_OFFSET_Y + DIVIDE_ROW * TILE_SIZE,
    );
  }

  _renderBaseLabels() {
    const hasBaseSprite = this.textures.exists('base');

    const makeBase = (col, row, animKey, tint, fallbackColor) => {
      const cx = BOARD_OFFSET_X + col * TILE_SIZE + TILE_SIZE / 2;
      const cy = BOARD_OFFSET_Y + row * TILE_SIZE + TILE_SIZE / 2;
      if (hasBaseSprite) {
        const spr = this.add.sprite(cx, cy, 'base', 'walk_0')
          .setDisplaySize(BASE_SPRITE_SIZE, BASE_SPRITE_SIZE)
          .setDepth(DEPTH_BASE_SPRITE);
        if (tint !== null) spr.setTint(tint);
        spr.play(animKey);
        return spr;
      }
      this.add.rectangle(cx, cy, TILE_SIZE - 2, TILE_SIZE - 2, fallbackColor).setDepth(DEPTH_BASE_SPRITE);
      const style = { fontSize: '9px', color: '#ffffff', fontFamily: 'monospace', align: 'center' };
      this.add.text(cx, cy, col === 0 ? 'NPC\nBASE' : 'YOUR\nBASE', style).setOrigin(0.5).setDepth(DEPTH_BASE_SPRITE + 1);
      return null;
    };

    this._npcBaseSprite    = makeBase(NPC_BASE_COL,    NPC_BASE_ROW,    'base_regular', COLOR_NPC_BASE_TINT,    COLOR_NPC_BASE_FALLBACK);
    this._playerBaseSprite = makeBase(PLAYER_BASE_COL, PLAYER_BASE_ROW, 'base_regular', COLOR_PLAYER_BASE_TINT, COLOR_PLAYER_BASE_FALLBACK);
  }

  _updateBaseSprites(baseHp) {
    const update = (spr, hp) => {
      if (!spr || !spr.active) return;
      const currentKey = spr.anims.currentAnim?.key;
      const pct = hp / BASE_HP;
      if (pct <= 0 && currentKey !== 'base_destroyed') {
        spr.play('base_destroyed');
      } else if (pct <= 0.5 && pct > 0 && currentKey !== 'base_damaged') {
        spr.play('base_damaged');
      }
    };
    update(this._npcBaseSprite,    baseHp.npc);
    update(this._playerBaseSprite, baseHp.player);
  }
}
