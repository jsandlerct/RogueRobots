// Fully open NPC and player territories divided by a solid wall with two 2-wide passages.
// Forces units through one of two chokepoints — great for tower placement.
// NPC base: (0,0)  Player base: (11,15)

const GRID = [
  [1,1,1,1,1,1,1,1,1,1,1,1], // row  0 — fully open (NPC base)
  [1,1,1,1,1,1,1,1,1,1,1,1], // row  1
  [1,1,1,1,1,1,1,1,1,1,1,1], // row  2
  [1,1,1,1,1,1,1,1,1,1,1,1], // row  3
  [1,1,1,1,1,1,1,1,1,1,1,1], // row  4
  [1,1,1,1,1,1,1,1,1,1,1,1], // row  5
  [0,0,0,1,1,0,0,0,1,1,0,0], // row  6 — chokepoint: passages at cols 3-4 and 8-9
  [0,0,0,1,1,0,0,0,1,1,0,0], // row  7
  [0,0,0,1,1,0,0,0,1,1,0,0], // row  8
  [0,0,0,1,1,0,0,0,1,1,0,0], // row  9
  [1,1,1,1,1,1,1,1,1,1,1,1], // row 10
  [1,1,1,1,1,1,1,1,1,1,1,1], // row 11
  [1,1,1,1,1,1,1,1,1,1,1,1], // row 12
  [1,1,1,1,1,1,1,1,1,1,1,1], // row 13
  [1,1,1,1,1,1,1,1,1,1,1,1], // row 14
  [1,1,1,1,1,1,1,1,1,1,1,1], // row 15 — fully open (Player base at col 11)
];

// No getPaths() — EasyStar routes through whichever passage is shorter.
export default class Bottleneck {
  getGrid() { return GRID; }
}
