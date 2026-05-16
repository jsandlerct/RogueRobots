import {
  TILE_SIZE, BASE_HP, BASE_ARMOR, ATK_MS, MIN_DAMAGE,
  RANGE_TOLERANCE, BOOMBOT_AOE_RADIUS,
  TEAM_BORDER_COLOR,
  PROJECTILE_RADIUS, PROJECTILE_GLOW_STRENGTH, PROJECTILE_GLOW_QUALITY, PROJECTILE_GLOW_DISTANCE,
  PROJECTILE_MS_PER_TILE, PROJECTILE_MIN_DURATION_MS,
  DEPTH_PROJECTILE,
} from '../data/constants.js';

export default class CombatSystem {
  constructor(scene, economySystem, onBaseHpChanged, onRoundEnd) {
    this._scene           = scene;
    this._economy         = economySystem;
    this._onBaseHpChanged = onBaseHpChanged;
    this._onRoundEnd      = onRoundEnd;
    this._units           = [];
    this._over            = false;

    this.baseHp = { player: BASE_HP, npc: BASE_HP };
  }

  addUnit(unit) {
    this._units.push(unit);
  }

  update() {
    if (this._over) return;

    const living = this._units.filter(u => u.alive);
    const now    = this._scene.time.now;

    for (const unit of living) {
      if (!unit.alive) continue;

      // Boomtrap: proximity-triggered — handled separately from normal attack flow.
      if (unit.stats.specialBehavior === 'boomtrap') {
        const enemies = living.filter(u => u.team !== unit.team && u.alive);
        this._tryBoomtrap(unit, enemies);
        continue;
      }

      // Units at the enemy base attack the base using their own dmg/atkSpeed.
      if (unit.atBase) {
        this._tryAttackBase(unit, now);
        continue;
      }

      const enemies = living.filter(u => u.team !== unit.team && u.alive);
      const target  = this._closestInRange(unit, enemies);

      if (target) {
        unit.pause();
        this._tryAttack(unit, target, now);
      } else {
        unit.resume();
      }
    }

    this._units = this._units.filter(u => u.alive);
  }

  _closestInRange(unit, enemies) {
    let closest     = null;
    let closestDist = Infinity;
    for (const enemy of enemies) {
      if (enemy.stats.specialBehavior === 'floatbot_fly' && unit.stats.range <= 1) continue;
      const dist = this._tileDist(unit, enemy);
      if (dist <= unit.stats.range + RANGE_TOLERANCE && dist < closestDist) {
        closest     = enemy;
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

    if (attacker.stats.specialBehavior === 'boombot_aoe') {
      // AoE: damage all enemies within radius, then self-destruct.
      const aoeEnemies = this._units.filter(u => u.alive && u.team !== attacker.team);
      for (const enemy of aoeEnemies) {
        if (this._tileDist(attacker, enemy) <= BOOMBOT_AOE_RADIUS) {
          const dmg    = Math.max(MIN_DAMAGE, attacker.stats.dmg - enemy.stats.armor);
          const killed = enemy.takeDamage(dmg);
          if (killed) this._economy.awardKill(attacker.team);
        }
      }
      attacker.destroy();
      return;
    }

    // Capture target position before damage (takeDamage may destroy the sprite).
    if (attacker.stats.range > 1) {
      this._fireProjectile(attacker, target);
    }

    const dmg    = Math.max(MIN_DAMAGE, attacker.stats.dmg - target.stats.armor);
    const killed = target.takeDamage(dmg);
    if (killed) this._economy.awardKill(attacker.team);
  }

  _fireProjectile(attacker, target) {
    const scene = this._scene;
    const fromX = attacker.sprite.x;
    const fromY = attacker.sprite.y;
    const toX   = target.sprite ? target.sprite.x : fromX;
    const toY   = target.sprite ? target.sprite.y : fromY;

    const color    = TEAM_BORDER_COLOR[attacker.team] ?? 0xffffff;
    const duration = Math.max(
      PROJECTILE_MIN_DURATION_MS,
      this._tileDist(attacker, target) * PROJECTILE_MS_PER_TILE
    );

    const ball = scene.add.circle(fromX, fromY, PROJECTILE_RADIUS, color)
      .setDepth(DEPTH_PROJECTILE);
    if (ball.preFX) {
      ball.preFX.addGlow(color, PROJECTILE_GLOW_STRENGTH, 0, false,
        PROJECTILE_GLOW_QUALITY, PROJECTILE_GLOW_DISTANCE);
    }

    scene.tweens.add({
      targets: ball, x: toX, y: toY, duration, ease: 'Linear',
      onComplete: () => ball.destroy(),
    });
  }

  _tryBoomtrap(trap, enemies) {
    for (const enemy of enemies) {
      if (!enemy.alive) continue;
      if (this._tileDist(trap, enemy) <= trap.stats.range + RANGE_TOLERANCE) {
        for (const e of enemies) {
          if (!e.alive) continue;
          if (this._tileDist(trap, e) <= trap.stats.range + RANGE_TOLERANCE) {
            const dmg    = Math.max(MIN_DAMAGE, trap.stats.dmg - e.stats.armor);
            const killed = e.takeDamage(dmg);
            if (killed) this._economy.awardKill(trap.team);
          }
        }
        trap.destroy();
        return;
      }
    }
  }

  _tryAttackBase(unit, now) {
    const atkMs = ATK_MS[unit.stats.atkSpeed] ?? 1000;
    if (now - unit._lastAtkTime < atkMs) return;

    unit._lastAtkTime = now;
    const dmg         = Math.max(MIN_DAMAGE, unit.stats.dmg - BASE_ARMOR);

    const targetBase = unit.team === 'npc' ? 'player' : 'npc';
    this.baseHp[targetBase] = Math.max(0, this.baseHp[targetBase] - dmg);
    this._onBaseHpChanged(this.baseHp);

    if (this.baseHp[targetBase] <= 0) {
      this._over = true;
      this._onRoundEnd(targetBase === 'player' ? 'npc' : 'player');
    }
  }

  destroy() {
    this._units.forEach(u => { if (u.alive) u.destroy(); });
    this._units = [];
  }
}
