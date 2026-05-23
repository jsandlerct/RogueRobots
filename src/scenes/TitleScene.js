import Phaser from 'phaser';
import { CANVAS_W, CANVAS_H, INTRO_FONT } from '../data/constants.js';
import Settings from '../data/Settings.js';

export default class TitleScene extends Phaser.Scene {
  constructor() {
    super({ key: 'TitleScene' });
  }

  create() {
    if (!this.scene.isActive('MusicScene')) this.scene.launch('MusicScene');

    const bottomReserve = 44;
    const imgAreaH = CANVAS_H - bottomReserve;
    const img = this.add.image(CANVAS_W / 2, imgAreaH / 2, 'titleScreen');
    img.setScale(Math.min(CANVAS_W / img.width, imgAreaH / img.height));

    this.add.text(CANVAS_W / 2, CANVAS_H - 40, 'Game Design by Jeff Sandler  ·  Art by Gemini  ·  Coding by Claude', {
      fontFamily: INTRO_FONT,
      fontSize: '11px',
      color: '#888888',
    }).setOrigin(0.5, 1);

    this.add.text(CANVAS_W / 2, CANVAS_H - 26, 'Original music by Sophia Sandler', {
      fontFamily: INTRO_FONT,
      fontSize: '11px',
      color: '#888888',
    }).setOrigin(0.5, 1);

    this.add.text(CANVAS_W / 2, CANVAS_H - 10, '[ Press any key or tap to play ]', {
      fontFamily: INTRO_FONT,
      fontSize: '13px',
      color: '#cccccc',
    }).setOrigin(0.5, 1);

    this._buildAudioToggles();

    let toggleClicked = false;

    this.input.keyboard.once('keydown', () => this.scene.start('CharacterSelectScene'));
    this.input.on('pointerdown', () => {
      if (toggleClicked) { toggleClicked = false; return; }
      this.scene.start('CharacterSelectScene');
    });

    this._toggleClickedRef = (v) => { toggleClicked = v; };
  }

  _buildAudioToggles() {
    const onColor  = '#55cc88';
    const offColor = '#445566';
    const pad = 8;

    const sfxLabel   = () => Settings.sfxOn   ? '[SFX: ON]'   : '[SFX: OFF]';
    const musicLabel = () => Settings.musicOn ? '[MUSIC: ON]' : '[MUSIC: OFF]';

    const sfxBtn = this.add.text(pad, pad, sfxLabel(), {
      fontSize: '11px', color: Settings.sfxOn ? onColor : offColor, fontFamily: 'monospace',
    }).setOrigin(0, 0).setDepth(10).setInteractive({ useHandCursor: true });

    const musicBtn = this.add.text(pad, pad + 16, musicLabel(), {
      fontSize: '11px', color: Settings.musicOn ? onColor : offColor, fontFamily: 'monospace',
    }).setOrigin(0, 0).setDepth(10).setInteractive({ useHandCursor: true });

    sfxBtn.on('pointerdown', () => {
      if (this._toggleClickedRef) this._toggleClickedRef(true);
      Settings.setSfx(!Settings.sfxOn);
      sfxBtn.setText(sfxLabel()).setColor(Settings.sfxOn ? onColor : offColor);
    });

    musicBtn.on('pointerdown', () => {
      if (this._toggleClickedRef) this._toggleClickedRef(true);
      Settings.setMusic(!Settings.musicOn);
      musicBtn.setText(musicLabel()).setColor(Settings.musicOn ? onColor : offColor);
    });
  }
}
