// Open-field layout: mostly walkable with scattered 2×2 wall clusters.
// Units pathfind freely via EasyStar — many valid routes exist.
// NPC base: (0,0)  Player base: (11,15)

const GRID = [
  [1,1,1,1,1,1,1,1,1,1,1,1], // row  0 — fully open (NPC base)
  [1,1,0,0,1,1,1,0,0,1,1,1], // row  1 — wall clusters at cols 2-3 and 7-8
  [1,1,0,0,1,1,1,0,0,1,1,1], // row  2
  [1,1,1,1,1,1,1,1,1,1,1,1], // row  3 — open corridor
  [1,0,0,1,1,1,1,1,1,0,0,1], // row  4 — wall clusters at cols 1-2 and 9-10
  [1,0,0,1,1,1,1,1,1,0,0,1], // row  5
  [1,1,1,1,1,1,1,1,1,1,1,1], // row  6 — open corridor
  [1,1,1,1,1,1,1,1,1,1,1,1], // row  7 — open corridor (NPC territory ends)
  [1,1,1,1,1,1,1,1,1,1,1,1], // row  8 — open corridor (Player territory begins)
  [1,1,0,0,1,1,1,0,0,1,1,1], // row  9 — wall clusters
  [1,1,0,0,1,1,1,0,0,1,1,1], // row 10
  [1,1,1,1,1,1,1,1,1,1,1,1], // row 11 — open corridor
  [1,0,0,1,1,1,1,1,1,0,0,1], // row 12 — wall clusters
  [1,0,0,1,1,1,1,1,1,0,0,1], // row 13
  [1,1,1,1,1,1,1,1,1,1,1,1], // row 14 — open corridor
  [1,1,1,1,1,1,1,1,1,1,1,1], // row 15 — fully open (Player base at col 11)
];

// No getPaths() — EasyStar pathfinds freely through the open field.
export default class OpenField {
  getGrid() { return GRID; }
}
