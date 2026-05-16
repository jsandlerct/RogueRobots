// 0 = wall, 1 = walkable path
// NPC base: col 0, row 0 (top-left)
// Player base: col 11, row 15 (bottom-right)
// Path winds snake-like from (0,0) to (11,15)
const GRID = [
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0], // row  0 — NPC base, path right to col 10
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0], // row  1 — turn down at col 10
  [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0], // row  2 — path left to col 1
  [0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // row  3 — turn down at col 1
  [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], // row  4 — path right to col 11
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], // row  5 — turn down at col 11
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], // row  6 — path left to col 0
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // row  7 — turn down at col 0 (NPC territory ends)
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0], // row  8 — path right to col 10 (player territory begins)
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0], // row  9 — turn down at col 10
  [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0], // row 10 — path left to col 1
  [0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // row 11 — turn down at col 1
  [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], // row 12 — path right to col 11
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], // row 13 — turn down at col 11
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], // row 14 — continue down
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], // row 15 — Player base at col 11
];

export default class Serpent {
  getGrid() {
    return GRID;
  }
}
