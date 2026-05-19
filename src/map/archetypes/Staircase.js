// Single path cascading diagonally from top-left to bottom-right in a staircase pattern.
// Path: (0,0)→(4,0)→(4,4)→(8,4)→(8,8)→(11,8)→(11,11)→(9,11)→(9,15)→(11,15)
// NPC base: (0,0)  Player base: (11,15)

const GRID = [
  [1,1,1,1,1,0,0,0,0,0,0,0], // row  0 — NPC base, right to col 4
  [0,0,0,0,1,0,0,0,0,0,0,0], // row  1 — col 4 down
  [0,0,0,0,1,0,0,0,0,0,0,0], // row  2
  [0,0,0,0,1,0,0,0,0,0,0,0], // row  3
  [0,0,0,0,1,1,1,1,1,0,0,0], // row  4 — right to col 8
  [0,0,0,0,0,0,0,0,1,0,0,0], // row  5 — col 8 down
  [0,0,0,0,0,0,0,0,1,0,0,0], // row  6
  [0,0,0,0,0,0,0,0,1,0,0,0], // row  7
  [0,0,0,0,0,0,0,0,1,1,1,1], // row  8 — right to col 11
  [0,0,0,0,0,0,0,0,0,0,0,1], // row  9 — col 11 down
  [0,0,0,0,0,0,0,0,0,0,0,1], // row 10
  [0,0,0,0,0,0,0,0,0,1,1,1], // row 11 — left to col 9
  [0,0,0,0,0,0,0,0,0,1,0,0], // row 12 — col 9 down
  [0,0,0,0,0,0,0,0,0,1,0,0], // row 13
  [0,0,0,0,0,0,0,0,0,1,0,0], // row 14
  [0,0,0,0,0,0,0,0,0,1,1,1], // row 15 — right to col 11 (Player base)
];

// No getPaths() — EasyStar follows the single staircase route.
export default class Staircase {
  getGrid() { return GRID; }
}
