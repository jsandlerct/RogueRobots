export default class EconomySystem {
  constructor() {
    this.metal = { player: 0, npc: 0 };
  }

  awardKill(team) {
    this.metal[team]++;
  }
}
