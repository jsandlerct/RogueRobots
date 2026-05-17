import { STARTING_RESOURCES } from '../data/constants.js';

export default class EconomySystem {
  constructor() {
    this.playerResources = { ...STARTING_RESOURCES };
    this.npcResources    = { metal: 0, silicon: 0, batteries: 0 };
  }

  awardKill(team) {
    if (team === 'player') this.playerResources.metal++;
    else if (team === 'npc') this.npcResources.metal++;
  }

  collectToken(type, amount = 1) {
    if (type === 'battery') this.playerResources.batteries += amount;
    else if (type === 'silicon') this.playerResources.silicon += amount;
  }

  collectNpcToken(type, amount = 1) {
    if (type === 'battery') this.npcResources.batteries += amount;
    else if (type === 'silicon') this.npcResources.silicon += amount;
  }

  canAfford(cost) {
    return (
      this.playerResources.metal     >= (cost.metal     || 0) &&
      this.playerResources.silicon   >= (cost.silicon   || 0) &&
      this.playerResources.batteries >= (cost.batteries || 0)
    );
  }

  spend(cost) {
    this.playerResources.metal     -= cost.metal     || 0;
    this.playerResources.silicon   -= cost.silicon   || 0;
    this.playerResources.batteries -= cost.batteries || 0;
  }

  canAffordNpc(cost) {
    return (
      this.npcResources.metal     >= (cost.metal     || 0) &&
      this.npcResources.silicon   >= (cost.silicon   || 0) &&
      this.npcResources.batteries >= (cost.batteries || 0)
    );
  }

  spendNpc(cost) {
    this.npcResources.metal     -= cost.metal     || 0;
    this.npcResources.silicon   -= cost.silicon   || 0;
    this.npcResources.batteries -= cost.batteries || 0;
  }
}
