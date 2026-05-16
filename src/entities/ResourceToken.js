import { TILE_SIZE, TOKEN_COLOR, TOKEN_SIZES, DEPTH_TOKEN } from '../data/constants.js';

export default class ResourceToken {
  constructor(scene, col, row, type) {
    this.col   = col;
    this.row   = row;
    this.type  = type; // 'battery' | 'silicon'
    this.alive = true;

    const sizeEntry = TOKEN_SIZES[Math.floor(Math.random() * TOKEN_SIZES.length)];
    this.amount = sizeEntry.amount;

    const x = col * TILE_SIZE + TILE_SIZE / 2;
    const y = row * TILE_SIZE + TILE_SIZE / 2;
    this.sprite = scene.add.rectangle(x, y, sizeEntry.px, sizeEntry.px, TOKEN_COLOR[type])
      .setDepth(DEPTH_TOKEN);
  }

  collect() {
    this.alive = false;
    this.sprite.destroy();
  }
}
