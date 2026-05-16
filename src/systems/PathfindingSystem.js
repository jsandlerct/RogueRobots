import EasyStar from 'easystarjs';
import { TILE_WALKABLE, PATHFINDING_ITERATIONS } from '../data/constants.js';

export default class PathfindingSystem {
  constructor(grid) {
    this._easystar = new EasyStar.js();
    this._easystar.setGrid(grid);
    this._easystar.setAcceptableTiles([TILE_WALKABLE]);
    this._easystar.setIterationsPerCalculation(PATHFINDING_ITERATIONS);
  }

  // Returns Promise<Array<{x: col, y: row}> | null>
  findPath(startCol, startRow, endCol, endRow) {
    return new Promise((resolve) => {
      this._easystar.findPath(startCol, startRow, endCol, endRow, resolve);
      this._easystar.calculate();
    });
  }
}
