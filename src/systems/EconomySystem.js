import { STARTING_RESOURCES } from '../data/constants.js';

export default class EconomySystem {
  constructor() {
    this.playerResources = { ...STARTING_RESOURCES };
  }

  awardKill(team) {
    if (team === 'player') this.playerResources.metal++;
  }

  collectToken(type, amount = 1) {
    if (type === 'battery') this.playerResources.batteries += amount;
    else if (type === 'silicon') this.playerResources.silicon += amount;
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
}
