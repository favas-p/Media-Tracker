// Web Audio API Sound Synthesizer for Snake vs Block Relax Game

class GameAudioEngine {
  private ctx: AudioContext | null = null;
  public soundMuted: boolean = false;
  public musicMuted: boolean = false;
  private isMusicPlaying: boolean = false;
  private musicTimer: number | null = null;

  constructor() {
    // Lazy init audio context on user interaction
  }

  private initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public unlock() {
    this.initCtx();
  }

  public toggleSound(): boolean {
    this.soundMuted = !this.soundMuted;
    return !this.soundMuted;
  }

  public toggleMusic(): boolean {
    this.musicMuted = !this.musicMuted;
    if (this.musicMuted) {
      this.stopMusic();
    } else {
      this.startMusic();
    }
    return !this.musicMuted;
  }

  // Play collectible sound (chime)
  public playCollect(bonus: boolean = false, star: boolean = false) {
    if (this.soundMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = star ? 'triangle' : 'sine';

      const baseFreq = star ? 880 : bonus ? 587.33 : 440; // A5, D5, A4
      osc.frequency.setValueAtTime(baseFreq, now);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * (star ? 1.5 : 1.25), now + 0.12);

      gain.gain.setValueAtTime(star ? 0.25 : 0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.2);
    } catch {
      // Audio context fallback
    }
  }

  // Play block hit impact sound
  public playHit() {
    if (this.soundMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(40, now + 0.05);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.07);
    } catch {
      // Audio context fallback
    }
  }

  // Play block destruction explosion
  public playBreak() {
    if (this.soundMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      
      // Low sub bass kick
      const sub = this.ctx.createOscillator();
      const subGain = this.ctx.createGain();
      sub.type = 'triangle';
      sub.frequency.setValueAtTime(180, now);
      sub.frequency.exponentialRampToValueAtTime(30, now + 0.18);

      subGain.gain.setValueAtTime(0.3, now);
      subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

      sub.connect(subGain);
      subGain.connect(this.ctx.destination);

      sub.start(now);
      sub.stop(now + 0.22);
    } catch {
      // Audio context fallback
    }
  }

  // Play combo sound
  public playCombo(comboLevel: number) {
    if (this.soundMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      const freq = notes[Math.min(comboLevel - 1, notes.length - 1)];

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.26);
    } catch {
      // Audio context fallback
    }
  }

  // Play Game Over sound
  public playGameOver() {
    if (this.soundMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const notes = [440, 392, 349.23, 293.66]; // A4, G4, F4, D4
      notes.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, now + idx * 0.12);
        gain.gain.setValueAtTime(0.15, now + idx * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.25);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now + idx * 0.12);
        osc.stop(now + idx * 0.12 + 0.28);
      });
    } catch {
      // Audio context fallback
    }
  }

  // Procedural relaxing ambient background synth loop
  public startMusic() {
    if (this.musicMuted || this.isMusicPlaying) return;
    this.initCtx();
    if (!this.ctx) return;

    this.isMusicPlaying = true;

    // Ambient Lofi chord progression notes (MIDI: Fmaj7 -> Cmaj7 -> Dm7 -> Am7)
    const chords = [
      [174.61, 220.00, 261.63, 329.63], // Fmaj7
      [130.81, 164.81, 196.00, 246.94], // Cmaj7
      [146.83, 174.61, 220.00, 261.63], // Dm7
      [110.00, 130.81, 164.81, 196.00], // Am7
    ];

    let chordIdx = 0;

    const playChord = () => {
      if (!this.isMusicPlaying || this.musicMuted || !this.ctx) return;
      try {
        const now = this.ctx.currentTime;
        const currentChord = chords[chordIdx % chords.length];

        currentChord.forEach((freq) => {
          if (!this.ctx) return;
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now);

          // Soft ambient fade in & fade out
          gain.gain.setValueAtTime(0.001, now);
          gain.gain.linearRampToValueAtTime(0.018, now + 1.2);
          gain.gain.linearRampToValueAtTime(0.001, now + 3.8);

          osc.connect(gain);
          gain.connect(this.ctx.destination);

          osc.start(now);
          osc.stop(now + 4.0);
        });

        chordIdx++;
      } catch {
        // Fallback
      }
    };

    playChord();
    this.musicTimer = window.setInterval(playChord, 3800);
  }

  public stopMusic() {
    this.isMusicPlaying = false;
    if (this.musicTimer !== null) {
      clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
  }
}

export const gameAudio = new GameAudioEngine();
