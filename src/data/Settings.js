const SETTINGS_KEY = 'roguerobots_settings';

const DEFAULTS = { sfxOn: true, musicOn: true };

function load() {
  try { return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}') }; }
  catch { return { ...DEFAULTS }; }
}

function save(obj) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(obj));
}

const Settings = {
  get sfxOn()   { return load().sfxOn; },
  get musicOn() { return load().musicOn; },
  setSfx(v)   { const s = load(); s.sfxOn   = Boolean(v); save(s); },
  setMusic(v) { const s = load(); s.musicOn = Boolean(v); save(s); },
};

export default Settings;
