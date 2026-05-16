// Three-corridor webbed layout: left (col 0), middle (col 5), right (col 11) corridors
// connected by horizontal rows at 0, 4, 8, 12, 15.
// All three NPC→Player paths are equal length (26 tiles).
// NPC base: (0,0)  Player base: (11,15)

const GRID = [
  [1,1,1,1,1,1,1,1,1,1,1,1], // row  0 — top connector
  [1,0,0,0,0,1,0,0,0,0,0,1], // row  1
  [1,0,0,0,0,1,0,0,0,0,0,1], // row  2
  [1,0,0,0,0,1,0,0,0,0,0,1], // row  3
  [1,1,1,1,1,1,1,1,1,1,1,1], // row  4 — horizontal connector
  [1,0,0,0,0,1,0,0,0,0,0,1], // row  5
  [1,0,0,0,0,1,0,0,0,0,0,1], // row  6
  [1,0,0,0,0,1,0,0,0,0,0,1], // row  7
  [1,1,1,1,1,1,1,1,1,1,1,1], // row  8 — territorial divide connector
  [1,0,0,0,0,1,0,0,0,0,0,1], // row  9
  [1,0,0,0,0,1,0,0,0,0,0,1], // row 10
  [1,0,0,0,0,1,0,0,0,0,0,1], // row 11
  [1,1,1,1,1,1,1,1,1,1,1,1], // row 12 — horizontal connector
  [1,0,0,0,0,1,0,0,0,0,0,1], // row 13
  [1,0,0,0,0,1,0,0,0,0,0,1], // row 14
  [1,1,1,1,1,1,1,1,1,1,1,1], // row 15 — bottom connector; Player base at col 11
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

// NPC → Player (all 26 tiles — equal length)
const NPC_LANE_LEFT   = makePath([0,0],[0,15],[11,15]);   // down col 0, then right
const NPC_LANE_MIDDLE = makePath([0,0],[5,0],[5,15],[11,15]); // right to col 5, down, right
const NPC_LANE_RIGHT  = makePath([0,0],[11,0],[11,15]);   // right to col 11, then down

// Player → NPC (reversed)
const PLAYER_LANE_LEFT   = [...NPC_LANE_LEFT].reverse();
const PLAYER_LANE_MIDDLE = [...NPC_LANE_MIDDLE].reverse();
const PLAYER_LANE_RIGHT  = [...NPC_LANE_RIGHT].reverse();

export default class Grid {
  getGrid() { return GRID; }

  getPaths() {
    return {
      npc:    [NPC_LANE_LEFT, NPC_LANE_MIDDLE, NPC_LANE_RIGHT],
      player: [PLAYER_LANE_LEFT, PLAYER_LANE_MIDDLE, PLAYER_LANE_RIGHT],
    };
  }
}
