// Sound Synthesizer using Web Audio API (Tanpa perlukan fail audio luar)
class SoundFX {
  constructor() {
    this.enabled = true;
    this.ctx = null;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggle() {
    this.enabled = !this.enabled;
    return this.enabled;
  }

  playTone(freq, type = 'sine', duration = 0.1, volume = 0.2) {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      gain.gain.setValueAtTime(volume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {
      console.warn("Audio error:", e);
    }
  }

  move() {
    this.playTone(320, 'triangle', 0.04, 0.08);
  }

  rotate() {
    this.playTone(480, 'sine', 0.06, 0.12);
  }

  drop() {
    this.playTone(180, 'triangle', 0.08, 0.15);
  }

  hold() {
    this.playTone(400, 'square', 0.05, 0.08);
  }

  lineClear() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    const notes = [440, 554, 659]; // A major arpeggio
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        this.playTone(freq, 'sine', 0.12, 0.2);
      }, idx * 60);
    });
  }

  tetrisClear() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    // Kemenangan Tetris (4 baris sekaligus)
    const notes = [440, 554, 659, 880, 1108];
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        this.playTone(freq, 'triangle', 0.2, 0.25);
      }, idx * 75);
    });
  }

  gameOver() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    const notes = [300, 260, 220, 160];
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        this.playTone(freq, 'sawtooth', 0.25, 0.2);
      }, idx * 120);
    });
  }
}

window.soundFX = new SoundFX();
