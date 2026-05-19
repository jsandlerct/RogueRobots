// Three tall vertical corridors connected by short horizontal runs — Labyrinth-style
// but with long vertical sweeps instead of horizontal ones.
// Path: (0,0)→col 0 down to row 14→row 14 right to col 4→col 4 up to row 1→
//        row 1 right to col 8→col 8 down to row 13→row 13 right to col 11→col 11 down to row 15
// NPC base: (0,0)  Player base: (11,15)

const GRID = [
  [1,0,0,0,0,0,0,0,0,0,0,0], // row  0 — NPC base, col 0 start
  [1,0,0,0,1,1,1,1,1,0,0,0], // row  1 — connector: col 4 to col 8
  [1,0,0,0,1,0,0,0,1,0,0,0], // row  2 — col 0, col 4, col 8 down
  [1,0,0,0,1,0,0,0,1,0,0,0], // row  3
  [1,0,0,0,1,0,0,0,1,0,0,0], // row  4
  [1,0,0,0,1,0,0,0,1,0,0,0], // row  5
  [1,0,0,0,1,0,0,0,1,0,0,0], // row  6
  [1,0,0,0,1,0,0,0,1,0,0,0], // row  7
  [1,0,0,0,1,0,0,0,1,0,0,0], // row  8
  [1,0,0,0,1,0,0,0,1,0,0,0], // row  9
  [1,0,0,0,1,0,0,0,1,0,0,0], // row 10
  [1,0,0,0,1,0,0,0,1,0,0,0], // row 11
  [1,0,0,0,1,0,0,0,1,0,0,0], // row 12
  [1,0,0,0,1,0,0,0,1,1,1,1], // row 13 — connector: col 8 to col 11
  [1,1,1,1,1,0,0,0,0,0,0,1], // row 14 — connector: col 0 to col 4; col 11 continues down
  [0,0,0,0,0,0,0,0,0,0,0,1], // row 15 — Player base at col 11
];

// No getPaths() — EasyStar follows the single winding vertical route.
export default class Staircase {
  getGrid() {
    return GRID;
  }
}
