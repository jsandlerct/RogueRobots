// Labyrinth: single complex winding path with many tight turns.
// More turns than Serpent; only one valid route from NPC to Player base.
// NPC base: (0,0)  Player base: (11,15)
// Path: (0,0)→(10,0)→(10,2)→(2,2)→(2,4)→(8,4)→(8,6)→(5,6)→(5,8)→(9,8)→(9,10)→(3,10)→(3,12)→(11,12)→(11,15)

const GRID = [
  [1,1,1,1,1,1,1,1,1,1,1,0], // row  0 — NPC base right to col 10
  [0,0,0,0,0,0,0,0,0,0,1,0], // row  1 — col 10 down
  [0,0,1,1,1,1,1,1,1,1,1,0], // row  2 — left to col 2
  [0,0,1,0,0,0,0,0,0,0,0,0], // row  3 — col 2 down
  [0,0,1,1,1,1,1,1,1,0,0,0], // row  4 — right to col 8
  [0,0,0,0,0,0,0,0,1,0,0,0], // row  5 — col 8 down
  [0,0,0,0,0,1,1,1,1,0,0,0], // row  6 — left to col 5 (territorial divide)
  [0,0,0,0,0,1,0,0,0,0,0,0], // row  7 — col 5 down
  [0,0,0,0,0,1,1,1,1,1,0,0], // row  8 — right to col 9
  [0,0,0,0,0,0,0,0,0,1,0,0], // row  9 — col 9 down
  [0,0,0,1,1,1,1,1,1,1,0,0], // row 10 — left to col 3
  [0,0,0,1,0,0,0,0,0,0,0,0], // row 11 — col 3 down
  [0,0,0,1,1,1,1,1,1,1,1,1], // row 12 — right to col 11
  [0,0,0,0,0,0,0,0,0,0,0,1], // row 13 — col 11 down
  [0,0,0,0,0,0,0,0,0,0,0,1], // row 14
  [0,0,0,0,0,0,0,0,0,0,0,1], // row 15 — Player base
];

// No getPaths() — EasyStar finds the single valid winding route.
export default class Labyrinth {
  getGrid() { return GRID; }
}
