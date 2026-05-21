import {
  POWERUP_SLOT_W, POWERUP_SLOT_H, POWERUP_SLOT_CX, POWERUP_SLOT_CY,
  POWERUP_ICON_PX, DEPTH_POWERUP_SLOT,
  TOOLTIP_HOVER_DELAY_MS, TOOLTIP_LONGPRESS_MS,
  DEPTH_TOOLTIP, TOOLTIP_W, TOOLTIP_H, POWERUP_TOOLTIP_X,
  POWERUP_DESCRIPTIONS,
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
  constructor(scene, onActivate, onPause, onResume) {
    this._scene      = scene;
    this._onActivate = onActivate;
    this._onPause    = onPause  ?? (() => {});
    this._onResume   = onResume ?? (() => {});
    this._slots      = [];
    this._hoverTimer = null;
    this._pressTimer = null;
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

      let longPressed = false;

      bg.on('pointerover', () => {
        if (this._slots[i]?.filled) bg.setStrokeStyle(2, 0xeeddff);
        this._hoverTimer = this._scene.time.delayedCall(TOOLTIP_HOVER_DELAY_MS, () => {
          this._showTooltip(i);
        });
      });

      bg.on('pointerout', () => {
        this._clearTimers();
        this._hideTooltip();
        this._onResume();
        longPressed = false;
        this._updateSlotStyle(i);
      });

      bg.on('pointerdown', () => {
        longPressed = false;
        this._pressTimer = this._scene.time.delayedCall(TOOLTIP_LONGPRESS_MS, () => {
          if (this._slots[i]?.filled) {
            longPressed = true;
            this._showTooltip(i);
            this._onPause();
          }
        });
      });

      bg.on('pointerup', () => {
        this._clearTimers();
        this._hideTooltip();
        this._onResume();
        if (!longPressed) this._onActivate(i);
        longPressed = false;
      });

      const icon = this._scene.add.image(cx, cy, 'powerup_emp')
        .setDisplaySize(POWERUP_ICON_PX, POWERUP_ICON_PX)
        .setDepth(DEPTH_POWERUP_SLOT + 1)
        .setVisible(false);

      const plusLabel = this._scene.add.text(cx, cy, '+', {
        fontSize: '32px', color: '#ffffff', fontFamily: 'monospace', fontStyle: 'bold',
      }).setOrigin(0.5).setDepth(DEPTH_POWERUP_SLOT + 1).setVisible(false);

      this._slots.push({ bg, icon, plusLabel, filled: false, type: null });
    }

    this._buildTooltip();
  }

  _buildTooltip() {
    const tx = POWERUP_TOOLTIP_X + TOOLTIP_W / 2;
    const bg = this._scene.add.rectangle(tx, 0, TOOLTIP_W, TOOLTIP_H, 0x08000f, 0.95)
      .setStrokeStyle(1, 0xaa66ff).setDepth(DEPTH_TOOLTIP).setVisible(false);
    const nameText = this._scene.add.text(tx - TOOLTIP_W / 2 + 7, 0, '', {
      fontSize: '11px', color: '#eeddff', fontFamily: 'monospace', fontStyle: 'bold',
    }).setDepth(DEPTH_TOOLTIP + 1).setVisible(false);
    const descText = this._scene.add.text(tx - TOOLTIP_W / 2 + 7, 0, '', {
      fontSize: '10px', color: '#bbaacc', fontFamily: 'monospace',
      wordWrap: { width: TOOLTIP_W - 14 },
    }).setDepth(DEPTH_TOOLTIP + 1).setVisible(false);
    this._tooltip = { bg, nameText, descText };
  }

  _showTooltip(i) {
    const slot = this._slots[i];
    if (!slot?.filled || !slot.type) return;
    const info = POWERUP_DESCRIPTIONS[slot.type];
    if (!info) return;

    const cy = POWERUP_SLOT_CY[i];
    const tx = POWERUP_TOOLTIP_X + TOOLTIP_W / 2;
    this._tooltip.bg.setPosition(tx, cy).setVisible(true);
    this._tooltip.nameText.setPosition(tx - TOOLTIP_W / 2 + 7, cy - TOOLTIP_H / 2 + 6).setVisible(true).setText(info.name);
    this._tooltip.descText.setPosition(tx - TOOLTIP_W / 2 + 7, cy - TOOLTIP_H / 2 + 20).setVisible(true).setText(info.desc);
  }

  _hideTooltip() {
    this._tooltip.bg.setVisible(false);
    this._tooltip.nameText.setVisible(false);
    this._tooltip.descText.setVisible(false);
  }

  _clearTimers() {
    if (this._hoverTimer) { this._hoverTimer.remove(false); this._hoverTimer = null; }
    if (this._pressTimer) { this._pressTimer.remove(false); this._pressTimer = null; }
  }

  refresh(slots) {
    for (let i = 0; i < 3; i++) {
      const type  = slots[i];
      const slot  = this._slots[i];
      slot.filled = !!type;
      slot.type   = type ?? null;

      if (type) {
        if (type === 'surge') {
          slot.icon.setVisible(false);
          slot.plusLabel.setVisible(true);
        } else {
          const key = ICON_KEY[type];
          slot.plusLabel.setVisible(false);
          if (this._scene.textures.exists(key)) {
            slot.icon.setTexture(key).setVisible(true);
          } else {
            slot.icon.setVisible(false);
          }
        }
      } else {
        slot.icon.setVisible(false);
        slot.plusLabel.setVisible(false);
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
