// Two-corridor map: NPC can race down either the left (col 0) or right (col 11) edge.
// Top and bottom rows fully connect the corridors.
// NPC base: (0,0)  Player base: (11,15)

const GRID = [
  [1,1,1,1,1,1,1,1,1,1,1,1], // row  0 — top connector (NPC base)
  [1,0,0,0,0,0,0,0,0,0,0,1], // row  1 — left corridor (col 0) | right corridor (col 11)
  [1,0,0,0,0,0,0,0,0,0,0,1], // row  2
  [1,0,0,0,0,0,0,0,0,0,0,1], // row  3
  [1,0,0,0,0,0,0,0,0,0,0,1], // row  4
  [1,0,0,0,0,0,0,0,0,0,0,1], // row  5
  [1,0,0,0,0,0,0,0,0,0,0,1], // row  6
  [1,0,0,0,0,0,0,0,0,0,0,1], // row  7
  [1,0,0,0,0,0,0,0,0,0,0,1], // row  8
  [1,0,0,0,0,0,0,0,0,0,0,1], // row  9
  [1,0,0,0,0,0,0,0,0,0,0,1], // row 10
  [1,0,0,0,0,0,0,0,0,0,0,1], // row 11
  [1,0,0,0,0,0,0,0,0,0,0,1], // row 12
  [1,0,0,0,0,0,0,0,0,0,0,1], // row 13
  [1,0,0,0,0,0,0,0,0,0,0,1], // row 14
  [1,1,1,1,1,1,1,1,1,1,1,1], // row 15 — bottom connector (Player base at col 11)
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

// NPC → Player (both 26 tiles — equal length)
const NPC_LANE_LEFT  = makePath([0,0],[0,15],[11,15]);   // down col 0, then right
const NPC_LANE_RIGHT = makePath([0,0],[11,0],[11,15]);   // right along row 0, then down

// Player → NPC (reversed)
const PLAYER_LANE_LEFT  = [...NPC_LANE_LEFT].reverse();
const PLAYER_LANE_RIGHT = [...NPC_LANE_RIGHT].reverse();

export default class DualLane {
  getGrid() { return GRID; }

  getPaths() {
    return {
      npc:    [NPC_LANE_LEFT, NPC_LANE_RIGHT],
      player: [PLAYER_LANE_LEFT, PLAYER_LANE_RIGHT],
    };
  }
}
