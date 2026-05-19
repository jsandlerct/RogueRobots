// Single path spiraling clockwise inward, then exiting to the player base.
// Path: (0,0)→(10,0) right; col 10 down to row 12; row 12 left to col 1;
//       col 1 up to row 2; row 2 right to col 8; col 8 down to row 10;
//       row 10 left to col 3; col 3 down to row 13; row 13 right to col 11;
//       col 11 down to row 15 (Player base).
// NPC base: (0,0)  Player base: (11,15)

const GRID = [
  [1,1,1,1,1,1,1,1,1,1,1,0], // row  0 — start, right to col 10
  [0,0,0,0,0,0,0,0,0,0,1,0], // row  1 — col 10 down
  [0,1,1,1,1,1,1,1,1,0,1,0], // row  2 — inner ring right (cols 1-8), col 10 outer
  [0,1,0,0,0,0,0,0,1,0,1,0], // row  3 — cols 1, 8, 10
  [0,1,0,0,0,0,0,0,1,0,1,0], // row  4
  [0,1,0,0,0,0,0,0,1,0,1,0], // row  5
  [0,1,0,0,0,0,0,0,1,0,1,0], // row  6
  [0,1,0,0,0,0,0,0,1,0,1,0], // row  7
  [0,1,0,0,0,0,0,0,1,0,1,0], // row  8
  [0,1,0,0,0,0,0,0,1,0,1,0], // row  9
  [0,1,0,1,1,1,1,1,1,0,1,0], // row 10 — innermost ring left (cols 3-8), col 1, col 10
  [0,1,0,1,0,0,0,0,0,0,1,0], // row 11 — cols 1, 3, 10
  [0,1,1,1,1,1,1,1,1,1,1,0], // row 12 — outer ring left (cols 1-10)
  [0,0,0,1,1,1,1,1,1,1,1,1], // row 13 — exit right to col 11 (cols 3-11)
  [0,0,0,0,0,0,0,0,0,0,0,1], // row 14 — col 11 down
  [0,0,0,0,0,0,0,0,0,0,0,1], // row 15 — Player base
];

// No getPaths() — EasyStar follows the single spiraling route.
export default class Spiral {
  getGrid() { return GRID; }
}
