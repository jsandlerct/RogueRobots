import {
  POWERUP_SLOT_W, POWERUP_SLOT_H, POWERUP_SLOT_CX, POWERUP_SLOT_CY,
  POWERUP_ICON_PX, DEPTH_POWERUP_SLOT,
} from '../data/constants.js';

const ICON_KEY = {
  emp:        'powerup_emp',
  airstrike:  'powerup_airstrike',
  overcharge: 'powerup_overcharge',
  supply:     'powerup_supply',
  surge:      'powerup_surge',
  fortify:    'powerup_fortify',
};

export default class PowerupBar {
  constructor(scene, onActivate) {
    this._scene      = scene;
    this._onActivate = onActivate;
    this._slots      = [];  // [{bg, icon}]
    this._build();
  }

  _build() {
    this._scene.add.text(POWERUP_SLOT_CX, POWERUP_SLOT_CY[0] - 30, 'PWR\nUPS', {
      fontSize: '7px', color: '#554477', fontFamily: 'monospace', align: 'center',
    }).setOrigin(0.5).setDepth(DEPTH_POWERUP_SLOT);

    for (let i = 0; i < 3; i++) {
      const cx = POWERUP_SLOT_CX;
      const cy = POWERUP_SLOT_CY[i];

      const bg = this._scene.add.rectangle(cx, cy, POWERUP_SLOT_W, POWERUP_SLOT_H, 0x110022)
        .setStrokeStyle(1, 0x443366).setDepth(DEPTH_POWERUP_SLOT)
        .setInteractive({ useHandCursor: true });
      bg.on('pointerdown', () => this._onActivate(i));
      bg.on('pointerover', () => { if (this._slots[i].filled) bg.setStrokeStyle(2, 0xeeddff); });
      bg.on('pointerout',  () => this._updateSlotStyle(i));

      const icon = this._scene.add.image(cx, cy, 'powerup_emp')
        .setDisplaySize(POWERUP_ICON_PX, POWERUP_ICON_PX)
        .setDepth(DEPTH_POWERUP_SLOT + 1)
        .setVisible(false);

      this._slots.push({ bg, icon, filled: false });
    }
  }

  refresh(slots) {
    for (let i = 0; i < 3; i++) {
      const type   = slots[i];
      const slot   = this._slots[i];
      slot.filled  = !!type;

      if (type) {
        const key = ICON_KEY[type];
        if (this._scene.textures.exists(key)) {
          slot.icon.setTexture(key).setVisible(true);
        } else {
          slot.icon.setVisible(false);
        }
      } else {
        slot.icon.setVisible(false);
      }
      this._updateSlotStyle(i);
    }
  }

  _updateSlotStyle(i) {
    const { bg, filled } = this._slots[i];
    if (filled) {
      bg.setFillStyle(0x220044).setStrokeStyle(2, 0xcc88ff);
    } else {
      bg.setFillStyle(0x110022).setStrokeStyle(1, 0x443366);
    }
  }
}
