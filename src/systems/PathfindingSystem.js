import EasyStar from 'easystarjs';

export default class PathfindingSystem {
  constructor(grid) {
    this._easystar = new EasyStar.js();
    this._easystar.setGrid(grid);
    this._easystar.setAcceptableTiles([1]);
    // Finish each queued path in one synchronous burst
    this._easystar.setIterationsPerCalculation(10000);
  }

  // Returns Promise<Array<{x: col, y: row}> | null>
  findPath(startCol, startRow, endCol, endRow) {
    return new Promise((resolve) => {
      this._easystar.findPath(startCol, startRow, endCol, endRow, resolve);
      this._easystar.calculate();
    });
  }
}
