// Wide S-shaped path: three full-width sweeps across the map.
// Wider and fewer turns than Serpent — long open lanes with rare but sharp reversals.
// Path: (0,0)→(11,0)→col 11 down to row 5→(0,5)→col 0 down to row 10→(11,10)→col 11 down to (11,15)
// NPC base: (0,0)  Player base: (11,15)

const GRID = [
  [1,1,1,1,1,1,1,1,1,1,1,1], // row  0 — full row right (NPC base)
  [0,0,0,0,0,0,0,0,0,0,0,1], // row  1 — col 11 down
  [0,0,0,0,0,0,0,0,0,0,0,1], // row  2
  [0,0,0,0,0,0,0,0,0,0,0,1], // row  3
  [0,0,0,0,0,0,0,0,0,0,0,1], // row  4
  [1,1,1,1,1,1,1,1,1,1,1,1], // row  5 — full row left
  [1,0,0,0,0,0,0,0,0,0,0,0], // row  6 — col 0 down
  [1,0,0,0,0,0,0,0,0,0,0,0], // row  7
  [1,0,0,0,0,0,0,0,0,0,0,0], // row  8
  [1,0,0,0,0,0,0,0,0,0,0,0], // row  9
  [1,1,1,1,1,1,1,1,1,1,1,1], // row 10 — full row right
  [0,0,0,0,0,0,0,0,0,0,0,1], // row 11 — col 11 down
  [0,0,0,0,0,0,0,0,0,0,0,1], // row 12
  [0,0,0,0,0,0,0,0,0,0,0,1], // row 13
  [0,0,0,0,0,0,0,0,0,0,0,1], // row 14
  [0,0,0,0,0,0,0,0,0,0,0,1], // row 15 — Player base
];

// No getPaths() — EasyStar follows the single S-shaped route.
export default class Gauntlet {
  getGrid() { return GRID; }
}
