class SoundSystem {
  private ctx: AudioContext | null = null;
  public isMuted: boolean = false;
  public bgmVolume: number = 0.3;
  public sfxVolume: number = 0.8;
  private bgmInterval: any = null;

  private init() {
    if (!this.ctx && typeof window !== "undefined") {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
  }

  setBGMVolume(vol: number) {
    this.bgmVolume = vol;
  }

  setSFXVolume(vol: number) {
    this.sfxVolume = vol;
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.isMuted) this.stopBGM();
    return this.isMuted;
  }

  startBGM(type: "lobby" | "game") {
    if (this.isMuted) return;
    this.stopBGM();
    this.init();
    if (!this.ctx) return;

    const notes = type === "lobby" ? [261.63, 329.63, 392.00, 523.25] : [130.81, 146.83, 164.81, 174.61];
    let noteIdx = 0;

    this.bgmInterval = setInterval(() => {
      if (this.isMuted || !this.ctx || this.bgmVolume <= 0) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type === "lobby" ? "sine" : "sawtooth";
      osc.frequency.setValueAtTime(notes[noteIdx % notes.length], this.ctx.currentTime);

      gain.gain.setValueAtTime(this.bgmVolume * 0.1, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.4);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.4);

      noteIdx++;
    }, type === "lobby" ? 600 : 300);
  }

  stopBGM() {
    if (this.bgmInterval) {
      clearInterval(this.bgmInterval);
      this.bgmInterval = null;
    }
  }

  playClick() {
    if (this.isMuted || this.sfxVolume <= 0) return;
    this.init();
    if (!this.ctx) return;
    
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = "sine";
    osc.frequency.setValueAtTime(600, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(800, this.ctx.currentTime + 0.05);
    
    gain.gain.setValueAtTime(this.sfxVolume * 0.2, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.05);
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.start();
    osc.stop(this.ctx.currentTime + 0.05);
  }

  playVictory() {
    if (this.isMuted || this.sfxVolume <= 0) return;
    this.init();
    if (!this.ctx) return;

    const notes = [523.25, 659.25, 783.99, 1046.50];
    notes.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      const startTime = this.ctx!.currentTime + idx * 0.12;

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(this.sfxVolume * 0.3, startTime);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.25);
    });
  }
}

export const sounds = new SoundSystem();