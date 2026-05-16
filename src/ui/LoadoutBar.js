import {
  LOADOUT_SLOT_W, LOADOUT_SLOT_H, LOADOUT_BAR_X, LOADOUT_BAR_Y,
  LOADOUT_NUM_SLOTS, LOADOUT_COLOR_EMPTY,
  DEPTH_LOADOUT_SEL_FRAME, DEPTH_LOADOUT_BG, DEPTH_LOADOUT_TEXT,
  DEPTH_COOLDOWN_OVERLAY, DEPTH_COOLDOWN_TEXT,
} from '../data/constants.js';
import unitsData from '../data/units.json';

function parseColor(hex) {
  return parseInt(hex.slice(1), 16);
}

export default class LoadoutBar {
  constructor(scene, loadout) {
    this._scene   = scene;
    this._loadout = loadout;
    this._selected = -1;
    this._slots    = [];

    this.onSelect = null;

    this._build();
  }

  _build() {
    for (let i = 0; i < LOADOUT_NUM_SLOTS; i++) {
      const unitName = this._loadout[i] ?? null;
      const cx = LOADOUT_BAR_X + i * LOADOUT_SLOT_W + LOADOUT_SLOT_W / 2;
      const cy = LOADOUT_BAR_Y + LOADOUT_SLOT_H / 2;

      const selFrame = this._scene.add.rectangle(cx, cy, LOADOUT_SLOT_W, LOADOUT_SLOT_H, 0xffffff)
        .setDepth(DEPTH_LOADOUT_SEL_FRAME)
        .setVisible(false);

      const fillColor = unitName
        ? parseColor(unitsData.find(u => u.name === unitName).color)
        : LOADOUT_COLOR_EMPTY;

      const bg = this._scene.add.rectangle(cx, cy, LOADOUT_SLOT_W - 2, LOADOUT_SLOT_H - 2, fillColor)
        .setDepth(DEPTH_LOADOUT_BG);

      let label     = null;
      let costLabel = null;

      if (unitName) {
        const stats     = unitsData.find(u => u.name === unitName);
        const shortName = unitName.replace(' ', '\n');
        const { metal: m, silicon: s, batteries: b } = stats.cost;
        const costStr   = [m ? `M${m}` : '', s ? `Si${s}` : '', b ? `B${b}` : '']
          .filter(Boolean).join(' ') || 'Free';

        label = this._scene.add.text(cx, LOADOUT_BAR_Y + 18, shortName, {
          fontSize: '8px', color: '#ffffff', fontFamily: 'monospace', align: 'center',
        }).setOrigin(0.5, 0.5).setDepth(DEPTH_LOADOUT_TEXT);

        costLabel = this._scene.add.text(cx, LOADOUT_BAR_Y + 48, costStr, {
          fontSize: '7px', color: '#dddddd', fontFamily: 'monospace', align: 'center',
        }).setOrigin(0.5, 0.5).setDepth(DEPTH_LOADOUT_TEXT);

        bg.setInteractive({ useHandCursor: true });
        bg.on('pointerdown', () => this._selectSlot(i));
      }

      const cooldownOverlay = this._scene.add
        .rectangle(cx, cy, LOADOUT_SLOT_W - 2, LOADOUT_SLOT_H - 2, 0x000000, 0.65)
        .setDepth(DEPTH_COOLDOWN_OVERLAY).setVisible(false);
      const cooldownText = this._scene.add.text(cx, cy, '', {
        fontSize: '14px', color: '#ffffff', fontFamily: 'monospace', fontStyle: 'bold',
      }).setOrigin(0.5).setDepth(DEPTH_COOLDOWN_TEXT).setVisible(false);

      this._slots.push({ bg, selFrame, label, costLabel, cooldownOverlay, cooldownText, unitName, index: i });
    }
  }

  _selectSlot(index) {
    if (this._selected === index) {
      this._deselect();
      return;
    }
    this._selected = index;
    this._slots.forEach((s, i) => {
      s.selFrame.setVisible(s.unitName ? i === index : false);
    });
    if (this.onSelect) this.onSelect(index, this._loadout[index]);
  }

  _deselect() {
    this._selected = -1;
    this._slots.forEach(s => s.selFrame.setVisible(false));
    if (this.onSelect) this.onSelect(-1, null);
  }

  deselect() { this._deselect(); }

  get selectedUnit() {
    return this._selected >= 0 ? this._loadout[this._selected] : null;
  }

  get selectedSlotIndex() {
    return this._selected;
  }

  refreshCooldowns(slotCooldownMap, now) {
    for (const slot of this._slots) {
      if (!slot.unitName) continue;
      const stats      = unitsData.find(u => u.name === slot.unitName);
      const cooldownMs = (stats.cooldown ?? 0) * 1000;
      const elapsed    = now - (slotCooldownMap.get(slot.index) ?? 0);
      const onCooldown = elapsed < cooldownMs;
      slot.cooldownOverlay.setVisible(onCooldown);
      slot.cooldownText.setVisible(onCooldown);
      if (onCooldown) {
        slot.cooldownText.setText(Math.ceil((cooldownMs - elapsed) / 1000) + 's');
      }
    }
  }

  refreshAffordability(playerResources) {
    for (const slot of this._slots) {
      if (!slot.unitName) continue;
      const stats  = unitsData.find(u => u.name === slot.unitName);
      const { metal: m, silicon: s, batteries: b } = stats.cost;
      const canAfford =
        playerResources.metal     >= (m || 0) &&
        playerResources.silicon   >= (s || 0) &&
        playerResources.batteries >= (b || 0);

      slot.bg.setAlpha(canAfford ? 1.0 : 0.4);
      slot.selFrame.setAlpha(canAfford ? 1.0 : 0.4);
      if (slot.costLabel) slot.costLabel.setColor(canAfford ? '#dddddd' : '#777777');
    }
  }
}
