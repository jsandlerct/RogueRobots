import { TILE_SIZE, BOARD_OFFSET_X, BOARD_OFFSET_Y, TOKEN_COLOR, TOKEN_SIZES, DEPTH_TOKEN } from '../data/constants.js';

export default class ResourceToken {
  constructor(scene, col, row, type, amount) {
    this.col    = col;
    this.row    = row;
    this.type   = type;   // 'battery' | 'silicon'
    this.amount = amount; // 1 | 2 | 3
    this.alive  = true;

    const sizeEntry = TOKEN_SIZES.find(s => s.amount === amount) ?? TOKEN_SIZES[0];

    const x   = BOARD_OFFSET_X + col * TILE_SIZE + TILE_SIZE / 2;
    const y   = BOARD_OFFSET_Y + row * TILE_SIZE + TILE_SIZE / 2;
    const key = `${type}${sizeEntry.amount}`;

    if (scene.textures.exists(key)) {
      this.sprite = scene.add.image(x, y, key)
        .setDisplaySize(sizeEntry.px, sizeEntry.px)
        .setDepth(DEPTH_TOKEN);
    } else {
      this.sprite = scene.add.rectangle(x, y, sizeEntry.px, sizeEntry.px, TOKEN_COLOR[type])
        .setDepth(DEPTH_TOKEN);
    }
  }

  collect() {
    this.alive = false;
    this.sprite.destroy();
  }
}
