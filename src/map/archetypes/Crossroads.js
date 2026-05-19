// Two corridors intersect in a plus sign: a 2-wide vertical arm (cols 5-6) running
// top-to-bottom, crossed by a 2-wide horizontal arm (rows 7-8) running left-to-right.
// A right-edge connector (col 11, rows 8-15) gives units a second route to the player base.
// NPC base: (0,0)  Player base: (11,15)

const GRID = [
  [1,1,1,1,1,1,1,0,0,0,0,0], // row  0 — NPC base connects right to vertical arm
  [0,0,0,0,0,1,1,0,0,0,0,0], // row  1 — vertical arm cols 5-6
  [0,0,0,0,0,1,1,0,0,0,0,0], // row  2
  [0,0,0,0,0,1,1,0,0,0,0,0], // row  3
  [0,0,0,0,0,1,1,0,0,0,0,0], // row  4
  [0,0,0,0,0,1,1,0,0,0,0,0], // row  5
  [0,0,0,0,0,1,1,0,0,0,0,0], // row  6
  [1,1,1,1,1,1,1,1,1,1,1,1], // row  7 — horizontal arm
  [1,1,1,1,1,1,1,1,1,1,1,1], // row  8 — horizontal arm
  [0,0,0,0,0,1,1,0,0,0,0,1], // row  9 — vertical arm + right-edge connector (col 11)
  [0,0,0,0,0,1,1,0,0,0,0,1], // row 10
  [0,0,0,0,0,1,1,0,0,0,0,1], // row 11
  [0,0,0,0,0,1,1,0,0,0,0,1], // row 12
  [0,0,0,0,0,1,1,0,0,0,0,1], // row 13
  [0,0,0,0,0,1,1,0,0,0,0,1], // row 14
  [0,0,0,0,0,1,1,1,1,1,1,1], // row 15 — vertical arm meets player base
];

// No getPaths() — EasyStar picks among the vertical arm, horizontal arm, and right-edge routes.
export default class Crossroads {
  getGrid() { return GRID; }
}
