// Two-lane fork: NPC territory splits into a left-column lane and a top-row lane.
// Both merge at row 7, then a single path continues through player territory.
// NPC base: (0,0)  Player base: (11,15)

const GRID = [
  [1,1,1,1,1,1,1,1,1,1,1,0], // row  0 — Lane B goes right to col 10; Lane A starts at col 0
  [1,0,0,0,0,0,0,0,0,0,1,0], // row  1 — Lane A: col 0 | Lane B: col 10
  [1,0,0,0,0,0,0,0,0,0,1,0], // row  2
  [1,0,0,0,0,0,0,0,0,0,1,0], // row  3
  [1,0,0,0,0,0,0,0,0,0,1,0], // row  4
  [1,0,0,0,0,0,0,0,0,0,1,0], // row  5
  [1,0,0,0,0,0,0,0,0,0,1,0], // row  6
  [1,1,1,1,1,1,1,1,1,1,1,0], // row  7 — merge row
  [0,0,0,0,0,0,0,0,0,0,1,0], // row  8
  [0,1,1,1,1,1,1,1,1,1,1,0], // row  9
  [0,1,0,0,0,0,0,0,0,0,0,0], // row 10
  [0,1,1,1,1,1,1,1,1,1,1,1], // row 11
  [0,0,0,0,0,0,0,0,0,0,0,1], // row 12
  [0,0,0,0,0,0,0,0,0,0,0,1], // row 13
  [0,0,0,0,0,0,0,0,0,0,0,1], // row 14
  [0,0,0,0,0,0,0,0,0,0,0,1], // row 15 — Player base
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

// NPC → Player (both lanes are 43 tiles — equal length)
const NPC_LANE_A = makePath([0,0],[0,7],[10,7],[10,9],[1,9],[1,11],[11,11],[11,15]);
const NPC_LANE_B = makePath([0,0],[10,0],[10,9],[1,9],[1,11],[11,11],[11,15]);

// Player → NPC (reversed)
const PLAYER_LANE_A = [...NPC_LANE_A].reverse();
const PLAYER_LANE_B = [...NPC_LANE_B].reverse();

export default class Fork {
  getGrid() { return GRID; }

  getPaths() {
    return {
      npc:    [NPC_LANE_A, NPC_LANE_B],
      player: [PLAYER_LANE_A, PLAYER_LANE_B],
    };
  }
}
