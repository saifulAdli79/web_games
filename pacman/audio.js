// Web Audio API Synthesizer Rasmi Pac-Man (Termasuk Lagu Mula Arkid)
class PacmanAudio {
  constructor() {
    this.enabled = true;
    this.ctx = null;
    this.wakaAlt = false;
    this.sirenOsc = null;
    this.sirenGain = null;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggle() {
    this.enabled = !this.enabled;
    if (!this.enabled) {
      this.stopSiren();
    }
    return this.enabled;
  }

  // Lagu Pembukaan Asal Pac-Man (Game Start Theme)
  playIntroTheme() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    // Frekuensi notasi lagu tema Pacman
    const notes = [
      { f: 493.88, d: 0.12 }, // B4
      { f: 987.77, d: 0.12 }, // B5
      { f: 739.99, d: 0.12 }, // F#5
      { f: 622.25, d: 0.12 }, // D#5
      { f: 987.77, d: 0.12 }, // B5
      { f: 739.99, d: 0.12 }, // F#5
      { f: 622.25, d: 0.24 }, // D#5

      { f: 523.25, d: 0.12 }, // C5
      { f: 1046.50, d: 0.12 },// C6
      { f: 783.99, d: 0.12 }, // G5
      { f: 659.25, d: 0.12 }, // E5
      { f: 1046.50, d: 0.12 },// C6
      { f: 783.99, d: 0.12 }, // G5
      { f: 659.25, d: 0.24 }, // E5

      { f: 493.88, d: 0.12 }, // B4
      { f: 987.77, d: 0.12 }, // B5
      { f: 739.99, d: 0.12 }, // F#5
      { f: 622.25, d: 0.12 }, // D#5
      { f: 987.77, d: 0.12 }, // B5
      { f: 739.99, d: 0.12 }, // F#5
      { f: 622.25, d: 0.24 }, // D#5

      { f: 622.25, d: 0.08 }, // D#5
      { f: 659.25, d: 0.08 }, // E5
      { f: 698.46, d: 0.08 }, // F5
      { f: 739.99, d: 0.08 }, // F#5
      { f: 783.99, d: 0.08 }, // G5
      { f: 830.61, d: 0.08 }, // G#5
      { f: 880.00, d: 0.08 }, // A5
      { f: 987.77, d: 0.35 }  // B5
    ];

    let delay = 0;
    notes.forEach(note => {
      setTimeout(() => {
        if (!this.enabled || !this.ctx) return;
        try {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(note.f, this.ctx.currentTime);
          gain.gain.setValueAtTime(0.18, this.ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + note.d);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start();
          osc.stop(this.ctx.currentTime + note.d);
        } catch (e) {}
      }, delay * 1000);
      delay += note.d;
    });
  }

  waka() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    try {
      const freq = this.wakaAlt ? 310 : 480;
      this.wakaAlt = !this.wakaAlt;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.75, this.ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.08);
    } catch (e) {}
  }

  eatGhost() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    const notes = [350, 500, 750, 1100];
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        try {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
          gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.1);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start();
          osc.stop(this.ctx.currentTime + 0.1);
        } catch (e) {}
      }, idx * 45);
    });
  }

  death() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(550, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(70, this.ctx.currentTime + 0.9);

      gain.gain.setValueAtTime(0.28, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.9);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.9);
    } catch (e) {}
  }

  win() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    const notes = [523, 659, 783, 1046, 1318];
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        try {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
          gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.2);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start();
          osc.stop(this.ctx.currentTime + 0.2);
        } catch (e) {}
      }, idx * 100);
    });
  }

  stopSiren() {
    if (this.sirenOsc) {
      try {
        this.sirenOsc.stop();
        this.sirenOsc.disconnect();
      } catch (e) {}
      this.sirenOsc = null;
    }
  }
}

window.pacmanAudio = new PacmanAudio();
