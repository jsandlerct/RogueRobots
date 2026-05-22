import Phaser from 'phaser';
import Settings from '../data/Settings.js';

const VOLUME = 0.6;

export default class MusicScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MusicScene', active: false });
  }

  create() {
    this._title   = this.sound.add('music_title',   { loop: true, volume: VOLUME });
    this._battle  = this.sound.add('music_battle',  { loop: true, volume: VOLUME });
    this._victory = this.sound.add('music_victory', { loop: true, volume: VOLUME });
    this._current = null;

    this.game.events.on('music:title',   this._playTitle,   this);
    this.game.events.on('music:battle',  this._playBattle,  this);
    this.game.events.on('music:victory', this._playVictory, this);
    this.game.events.on('music:stop',    this._stopAll,     this);

    this._playTitle();
  }

  update() {
    if (!this._current) return;
    if (Settings.musicOn && !this._current.isPlaying) {
      this._current.resume();
    } else if (!Settings.musicOn && this._current.isPlaying) {
      this._current.pause();
    }
  }

  _playTitle()   { this._switchTo(this._title);   }
  _playBattle()  { this._switchTo(this._battle);  }
  _playVictory() { this._switchTo(this._victory); }

  _stopAll() {
    if (this._current) { this._current.stop(); this._current = null; }
  }

  _switchTo(track) {
    if (this._current === track) return;
    if (this._current) this._current.stop();
    this._current = track;
    if (Settings.musicOn) this._current.play();
  }
}
