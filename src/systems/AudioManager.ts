/**
 * AudioManager
 * - Procedurally synthesized SFX via Web Audio API (no files needed)
 * - Music player that auto-discovers MP3s from /soundtrack/
 */
export class AudioManager {
  private ctx: AudioContext | null = null;
  private masterGain!: GainNode;
  private sfxGain!: GainNode;
  private musicGain!: GainNode;

  // Music state
  private tracks: string[] = [];
  private currentTrackIndex: number = -1;
  private currentSource: AudioBufferSourceNode | null = null;
  private musicPlaying: boolean = false;

  // Prevent SFX spam
  private lastSfxTime: Map<string, number> = new Map();
  private readonly SFX_COOLDOWN = 50; // ms

  // Cached noise buffers (created once, reused every SFX call)
  private shootNoiseBuffer: AudioBuffer | null = null;
  private explodeNoiseBuffer: AudioBuffer | null = null;
  private deathNoiseBuffer: AudioBuffer | null = null;
  private flutterNoiseBuffers: AudioBuffer[] = [];

  constructor() {}

  /** Must be called from a user gesture (click) to unlock AudioContext */
  public init(): void {
    if (this.ctx) return;
    this.ctx = new AudioContext();

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 1.0;
    this.masterGain.connect(this.ctx.destination);

    this.sfxGain = this.ctx.createGain();
    this.sfxGain.gain.value = 0.6;
    this.sfxGain.connect(this.masterGain);

    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.value = 0.3;
    this.musicGain.connect(this.masterGain);

    this.initNoiseBuffers();
    this.loadTrackList();
  }

  /** Pre-generate all noise buffers used by SFX */
  private initNoiseBuffers(): void {
    // Shoot whoosh noise (0.15s)
    this.shootNoiseBuffer = this.createNoiseBuffer(0.15, (t) => (1 - t) * 0.4);

    // Explode impact noise (0.2s)
    this.explodeNoiseBuffer = this.createNoiseBuffer(0.2, (t) => (1 - t * t) * 0.5);

    // Death crunch noise (0.12s)
    this.deathNoiseBuffer = this.createNoiseBuffer(0.12, (t) =>
      Math.max(-0.8, Math.min(0.8, 2)) * (1 - t)  // clipped
    );

    // Flutter blips (3 × 0.04s)
    for (let i = 0; i < 3; i++) {
      this.flutterNoiseBuffers.push(this.createNoiseBuffer(0.04, () => 0.15));
    }
  }

  /** Create a noise buffer with an amplitude envelope */
  private createNoiseBuffer(duration: number, envelope: (t: number) => number): AudioBuffer {
    const ctx = this.ctx!;
    const bufferSize = Math.ceil(ctx.sampleRate * duration);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      const t = i / bufferSize;
      data[i] = (Math.random() * 2 - 1) * envelope(t);
    }
    return buffer;
  }

  // ── Track list discovery ──────────────────────────────────
  // Vite serves /soundtrack/ as static files from public/soundtrack/.
  // We fetch a manifest or try known patterns.
  // Simplest approach: a tracks.json file OR we just try to load them.

  private async loadTrackList(): Promise<void> {
    try {
      // Try loading a manifest file first
      const response = await fetch('/soundtrack/tracks.json');
      if (response.ok) {
        const manifest = await response.json();
        this.tracks = (manifest as string[]).map(f => `/soundtrack/${f}`);
      }
    } catch {
      // No manifest — that's fine, user can add one later
    }

    if (this.tracks.length > 0) {
      this.shuffleTracks();
      this.playNextTrack();
    }
  }

  private shuffleTracks(): void {
    for (let i = this.tracks.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.tracks[i], this.tracks[j]] = [this.tracks[j], this.tracks[i]];
    }
  }

  private async playNextTrack(): Promise<void> {
    if (!this.ctx || this.tracks.length === 0) return;

    this.currentTrackIndex = (this.currentTrackIndex + 1) % this.tracks.length;
    const url = this.tracks[this.currentTrackIndex];

    try {
      const response = await fetch(url);
      if (!response.ok) return;
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.ctx.decodeAudioData(arrayBuffer);

      // Stop previous track if any
      if (this.currentSource) {
        this.currentSource.onended = null;
        this.currentSource.stop();
      }

      const source = this.ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.musicGain);
      source.onended = () => {
        if (this.musicPlaying) this.playNextTrack();
      };
      source.start();
      this.currentSource = source;
      this.musicPlaying = true;
    } catch {
      // Track failed to load, try next
      if (this.tracks.length > 1) {
        this.playNextTrack();
      }
    }
  }

  // ── Synthesized SFX ───────────────────────────────────────

  private canPlay(name: string): boolean {
    const now = performance.now();
    const last = this.lastSfxTime.get(name) ?? 0;
    if (now - last < this.SFX_COOLDOWN) return false;
    this.lastSfxTime.set(name, now);
    return true;
  }

  /** Phone throw — short ascending whoosh */
  public playShoot(): void {
    if (!this.ctx || !this.canPlay('shoot')) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;

    // Noise burst for whoosh (using cached buffer)
    const duration = 0.15;
    const noise = ctx.createBufferSource();
    noise.buffer = this.shootNoiseBuffer;

    // Bandpass filter sweeps up for whoosh
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(400, now);
    filter.frequency.exponentialRampToValueAtTime(2000, now + duration);
    filter.Q.value = 2;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + duration);

    noise.connect(filter).connect(gain).connect(this.sfxGain);
    noise.start(now);
    noise.stop(now + duration);

    // Tonal "ring" component (phone bell hint)
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(1600, now + 0.08);
    const oscGain = ctx.createGain();
    oscGain.gain.setValueAtTime(0.15, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    osc.connect(oscGain).connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.1);
  }

  /** Phone explosion — low boom + coin scatter */
  public playExplode(): void {
    if (!this.ctx || !this.canPlay('explode')) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;

    // Low boom (oscillator pitch drop)
    const boom = ctx.createOscillator();
    boom.type = 'sine';
    boom.frequency.setValueAtTime(150, now);
    boom.frequency.exponentialRampToValueAtTime(30, now + 0.3);
    const boomGain = ctx.createGain();
    boomGain.gain.setValueAtTime(0.6, now);
    boomGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    boom.connect(boomGain).connect(this.sfxGain);
    boom.start(now);
    boom.stop(now + 0.35);

    // Noise burst for impact texture (using cached buffer)
    const duration = 0.2;
    const noise = ctx.createBufferSource();
    noise.buffer = this.explodeNoiseBuffer;
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.4, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    noise.connect(noiseGain).connect(this.sfxGain);
    noise.start(now);
    noise.stop(now + duration);

    // Coin scatter — high metallic pings
    for (let i = 0; i < 4; i++) {
      const delay = 0.05 + Math.random() * 0.15;
      const ping = ctx.createOscillator();
      ping.type = 'sine';
      ping.frequency.value = 2000 + Math.random() * 3000;
      const pingGain = ctx.createGain();
      pingGain.gain.setValueAtTime(0.08, now + delay);
      pingGain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.08);
      ping.connect(pingGain).connect(this.sfxGain);
      ping.start(now + delay);
      ping.stop(now + delay + 0.1);
    }
  }

  /** Enemy killed — satisfying crunch/pop + paper flutter */
  public playEnemyDeath(): void {
    if (!this.ctx || !this.canPlay('enemyDeath')) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;

    // Pop/crunch — short noise burst with resonance (using cached buffer)
    const duration = 0.12;
    const noise = ctx.createBufferSource();
    noise.buffer = this.deathNoiseBuffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 800;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    noise.connect(filter).connect(gain).connect(this.sfxGain);
    noise.start(now);
    noise.stop(now + duration);

    // Descending tone — "wah wah" defeat
    const osc = ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(150, now + 0.25);
    const oscGain = ctx.createGain();
    oscGain.gain.setValueAtTime(0.1, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    osc.connect(oscGain).connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.3);

    // Paper flutter — rapid quiet noise blips (using cached buffers)
    for (let i = 0; i < 3; i++) {
      const d = 0.1 + i * 0.08;
      const flutterDur = 0.04;
      const fs = ctx.createBufferSource();
      fs.buffer = this.flutterNoiseBuffers[i];
      const fg = ctx.createGain();
      fg.gain.setValueAtTime(0.15, now + d);
      fg.gain.exponentialRampToValueAtTime(0.001, now + d + flutterDur);
      fs.connect(fg).connect(this.sfxGain);
      fs.start(now + d);
      fs.stop(now + d + flutterDur);
    }
  }

  /** Mission complete — ascending chime */
  public playMissionComplete(): void {
    if (!this.ctx || !this.canPlay('mission')) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;

    const notes = [523, 659, 784, 1047]; // C5, E5, G5, C6
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const gain = ctx.createGain();
      const start = now + i * 0.12;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.2, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.4);
      osc.connect(gain).connect(this.sfxGain);
      osc.start(start);
      osc.stop(start + 0.45);
    });
  }

  /** Tiger footstep — subtle thud */
  public playFootstep(): void {
    if (!this.ctx || !this.canPlay('step')) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(80 + Math.random() * 30, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.06);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    osc.connect(gain).connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.08);
  }

  // ── Volume controls ───────────────────────────────────────

  public setMusicVolume(v: number): void {
    if (this.musicGain) this.musicGain.gain.value = Math.max(0, Math.min(1, v));
  }

  public setSfxVolume(v: number): void {
    if (this.sfxGain) this.sfxGain.gain.value = Math.max(0, Math.min(1, v));
  }

  public setMasterVolume(v: number): void {
    if (this.masterGain) this.masterGain.gain.value = Math.max(0, Math.min(1, v));
  }
}
