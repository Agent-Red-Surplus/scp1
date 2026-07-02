export class AudioService {
  constructor() { 
    this.bgm = document.getElementById('bgm'); 
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    this.sounds = {};
    this.sfxMuted = JSON.parse(localStorage.getItem('sfxMuted') || 'false');
    this.soundUrls = {
      alarm: 'alarm.mp3',
      success: 'success.mp3',
      failure: 'failure.mp3',
      click: 'ui_click.mp3',
      neutralization_attempt: 'neutralization_attempt.mp3',
      battle_start: 'battle_start.mp3',
      battle_end: 'battle_end.mp3',
      experiment_start: 'experiment_start.mp3',
    };
    this.musicTracks = ['background_music.mp3', 'ambient_tension.mp3'];
    this.currentTrackIndex = 0;
    this.customMusicUrl = localStorage.getItem('customMusicUrl') || null;
  }

  async _loadSound(name, url) {
    try {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      this.sounds[name] = await this.audioContext.decodeAudioData(arrayBuffer);
    } catch (e) {
      console.error(`Error loading audio ${name}:`, e);
    }
  }

  async setup(ui) {
    // Load all sound effects
    const loadPromises = Object.entries(this.soundUrls).map(([name, url]) => this._loadSound(name, url));
    await Promise.all(loadPromises);

    const muted = JSON.parse(localStorage.getItem('muted') || 'true');
    this.setState(!muted);
    
    // Set up music playlist rotation
    this.bgm.addEventListener('ended', () => this._nextTrack());
    
    // Unlock WebAudioContext and start BGM on first interaction
    this._unlockAudio = this._unlockAudio || (() => {
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }
      if (!JSON.parse(localStorage.getItem('muted') || 'true')) this._playNextTrack();
      document.removeEventListener('click', this._unlockAudio);
    });
    document.addEventListener('click', this._unlockAudio, { once: true });
    this.ui = ui;
  }

  _nextTrack() {
    if (!this.bgm.muted) this._playNextTrack();
  }

  _playNextTrack() {
    if (this.customMusicUrl) {
      this.bgm.src = this.customMusicUrl;
    } else {
      this.currentTrackIndex = (this.currentTrackIndex + 1) % this.musicTracks.length;
      this.bgm.src = this.musicTracks[this.currentTrackIndex];
    }
    this.bgm.play().catch(()=>{});
  }

  setCustomMusic(url) {
    this.customMusicUrl = url;
    this.bgm.src = url;
    if (!this.bgm.muted) this.bgm.play().catch(()=>{});
  }

  clearCustomMusic() {
    this.customMusicUrl = null;
    this.currentTrackIndex = 0;
    this._playNextTrack();
  }
  
  play(name) {
    const buffer = this.sounds[name];
    // Only play if audio context is running and SFX is not muted
    if (buffer && this.audioContext.state !== 'suspended' && !this.sfxMuted) {
      const source = this.audioContext.createBufferSource();
      source.buffer = buffer;
      source.connect(this.audioContext.destination);
      source.start(0);
    }
  }

  toggleSFX() {
    this.sfxMuted = !this.sfxMuted;
    localStorage.setItem('sfxMuted', JSON.stringify(this.sfxMuted));
    const btn = document.getElementById('sfxToggle');
    btn.textContent = `SFX: ${this.sfxMuted ? 'Off' : 'On'}`;
    btn.setAttribute('aria-pressed', this.sfxMuted ? 'false' : 'true');
  }

  toggle() {
    const willPlay = this.bgm.paused;
    this.setState(willPlay);
    if (willPlay) this._playNextTrack();
  }
  setState(on) {
    localStorage.setItem('muted', JSON.stringify(!on));
    const btn = document.getElementById('musicToggle');
    btn.textContent = `Music: ${on ? 'On' : 'Off'}`;
    btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    this.bgm.muted = !on;
  }
}