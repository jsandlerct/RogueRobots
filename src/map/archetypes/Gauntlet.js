// Two paths forming an X: Path A (left-top → right-bottom) and Path B (right-top → left-bottom).
// They cross at the vertical midpoint (rows 7–8, cols 5–6).
// Path A: (0,0)→row 0 right to col 5→col 5 down to row 8→row 8 right to col 11→col 11 down to (11,15)
// Path B: (0,0)→col 0 down to row 7→row 7 right to col 6→col 6 down to row 15→row 15 right to (11,15)
// NPC base: (0,0)  Player base: (11,15)

const GRID = [
  [1,1,1,1,1,1,0,0,0,0,0,0], // row  0 — NPC base; Path A right to col 5
  [1,0,0,0,0,1,0,0,0,0,0,0], // row  1 — Path B col 0, Path A col 5
  [1,0,0,0,0,1,0,0,0,0,0,0], // row  2
  [1,0,0,0,0,1,0,0,0,0,0,0], // row  3
  [1,0,0,0,0,1,0,0,0,0,0,0], // row  4
  [1,0,0,0,0,1,0,0,0,0,0,0], // row  5
  [1,0,0,0,0,1,0,0,0,0,0,0], // row  6
  [1,1,1,1,1,1,1,0,0,0,0,0], // row  7 — Path B horizontal (cols 0–6); crossing with Path A col 5
  [0,0,0,0,0,1,1,1,1,1,1,1], // row  8 — Path A horizontal (cols 5–11); crossing with Path B col 6
  [0,0,0,0,0,0,1,0,0,0,0,1], // row  9 — Path B col 6, Path A col 11
  [0,0,0,0,0,0,1,0,0,0,0,1], // row 10
  [0,0,0,0,0,0,1,0,0,0,0,1], // row 11
  [0,0,0,0,0,0,1,0,0,0,0,1], // row 12
  [0,0,0,0,0,0,1,0,0,0,0,1], // row 13
  [0,0,0,0,0,0,1,0,0,0,0,1], // row 14
  [0,0,0,0,0,0,1,1,1,1,1,1], // row 15 — Path B horizontal to Player base (cols 6–11)
];

function makePath(...waypoints) {
  const path = [];
  for (let i = 0; i < waypoints.length - 1; i++) {
    const [c1, r1] = waypoints[i];
    const [c2, r2] = waypoints[i + 1];
    const dc = c1 === c2 ? 0 : (c2 > c1 ? 1 : -1);
    const dr = r1 === r2 ? 0 : (r2 > r1 ? 1 : -1);
    let c = c1, r = r1;
    if (i === 0) path.push({ x: c, y: r });
    while (c !== c2 || r !== r2) { c += dc; r += dr; path.push({ x: c, y: r }); }
  }
  return path;
}

// Path A: left-top → right-bottom (38 tiles)
const NPC_LANE_A    = makePath([0,0],[5,0],[5,8],[11,8],[11,15]);
// Path B: right-top → left-bottom (38 tiles)
const NPC_LANE_B    = makePath([0,0],[0,7],[6,7],[6,15],[11,15]);

const PLAYER_LANE_A = [...NPC_LANE_A].reverse();
const PLAYER_LANE_B = [...NPC_LANE_B].reverse();

export default class Gauntlet {
  getGrid() { return GRID; }

  getPaths() {
    return {
      npc:    [NPC_LANE_A, NPC_LANE_B],
      player: [PLAYER_LANE_A, PLAYER_LANE_B],
    };
  }
}
