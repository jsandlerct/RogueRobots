import { TILE_SIZE } from '../map/archetypes/Serpent.js';

const ATK_MS = { slow: 2000, medium: 1000, fast: 500 };
const BASE_HP = 10;
const BASE_DAMAGE_INTERVAL_MS = 1000;

export default class CombatSystem {
  constructor(scene, economySystem, onBaseHpChanged, onRoundEnd) {
    this._scene = scene;
    this._economy = economySystem;
    this._onBaseHpChanged = onBaseHpChanged;
    this._onRoundEnd = onRoundEnd;
    this._units = [];
    this._over = false;

    this.baseHp = { player: BASE_HP, npc: BASE_HP };

    // Track when each base-attacking unit last dealt base damage
    this._baseAtkTimers = new Map();
  }

  addUnit(unit) {
    unit.onPathComplete = (u) => this._onUnitReachedBase(u);
    this._units.push(unit);
  }

  update() {
    if (this._over) return;

    const living = this._units.filter(u => u.alive);
    const now = this._scene.time.now;

    for (const unit of living) {
      if (unit.atBase) {
        this._tickBaseDamage(unit, now);
        continue;
      }

      const enemies = living.filter(u => u.team !== unit.team && !u.atBase);
      const target = this._closestInRange(unit, enemies);

      if (target) {
        unit.pause();
        this._tryAttack(unit, target, now);
      } else {
        unit.resume();
      }
    }

    // Prune dead units
    this._units = this._units.filter(u => u.alive);
  }

  _closestInRange(unit, enemies) {
    let closest = null;
    let closestDist = Infinity;
    for (const enemy of enemies) {
      const dist = this._tileDist(unit, enemy);
      if (dist <= unit.stats.range + 0.5 && dist < closestDist) {
        closest = enemy;
        closestDist = dist;
      }
    }
    return closest;
  }

  _tileDist(a, b) {
    const dx = (a.sprite.x - b.sprite.x) / TILE_SIZE;
    const dy = (a.sprite.y - b.sprite.y) / TILE_SIZE;
    return Math.sqrt(dx * dx + dy * dy);
  }

  _tryAttack(attacker, target, now) {
    const atkMs = ATK_MS[attacker.stats.atkSpeed] ?? 1000;
    if (now - attacker._lastAtkTime < atkMs) return;

    attacker._lastAtkTime = now;
    const dmg = Math.max(1, attacker.stats.dmg - target.stats.armor);
    const killed = target.takeDamage(dmg);

    if (killed) {
      this._economy.awardKill(attacker.team);
      this._baseAtkTimers.delete(target);
    }
  }

  _onUnitReachedBase(unit) {
    // Unit reached the opposing base — start dealing base damage
    this._baseAtkTimers.set(unit, 0);
  }

  _tickBaseDamage(unit, now) {
    if (!this._baseAtkTimers.has(unit)) return;

    const lastTick = this._baseAtkTimers.get(unit);
    if (now - lastTick < BASE_DAMAGE_INTERVAL_MS) return;

    this._baseAtkTimers.set(unit, now);

    // Unit at player base damages player; unit at npc base damages npc
    const targetBase = unit.team === 'npc' ? 'player' : 'npc';
    this.baseHp[targetBase] = Math.max(0, this.baseHp[targetBase] - 1);
    this._onBaseHpChanged(this.baseHp);

    if (this.baseHp[targetBase] <= 0) {
      this._over = true;
      this._onRoundEnd(targetBase === 'player' ? 'npc' : 'player');
    }
  }

  destroy() {
    this._units.forEach(u => { if (u.alive) u.destroy(); });
    this._units = [];
    this._baseAtkTimers.clear();
  }
}
