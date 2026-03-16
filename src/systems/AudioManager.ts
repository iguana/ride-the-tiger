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
  private ambientGain: GainNode | null = null;

  // Ambient sound state
  private ambientHum: OscillatorNode | null = null;
  private ambientNoise: AudioBufferSourceNode | null = null;

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

    this.ambientGain = this.ctx.createGain();
    this.ambientGain.gain.value = 0.04;
    this.ambientGain.connect(this.masterGain);

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
      const response = await fetch('soundtrack/tracks.json');
      if (response.ok) {
        const manifest = await response.json();
        this.tracks = (manifest as string[]).map(f => `soundtrack/${f}`);
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

  /** Meeting invite — short ascending chime (calendar notification ping) */
  public playMeeting(): void {
    if (!this.ctx || !this.canPlay('meeting')) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;

    // Calendar notification ascending chime
    const notes = [880, 1109, 1319]; // A5, C#6, E6
    notes.forEach((freq, i) => {
      const delay = i * 0.07;
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.18, now + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.15);
      osc.connect(gain).connect(this.sfxGain);
      osc.start(now + delay);
      osc.stop(now + delay + 0.17);
    });

    // Soft "ding" tail
    const ding = ctx.createOscillator();
    ding.type = 'triangle';
    ding.frequency.value = 1760;
    const dingGain = ctx.createGain();
    dingGain.gain.setValueAtTime(0.1, now + 0.21);
    dingGain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
    ding.connect(dingGain).connect(this.sfxGain);
    ding.start(now + 0.21);
    ding.stop(now + 0.47);
  }

  /** Budget stolen — descending coin pings (loss sound) */
  public playBudgetSteal(): void {
    if (!this.ctx || !this.canPlay('budgetSteal')) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;

    // Descending coin pings
    const notes = [1800, 1400, 1000, 700];
    notes.forEach((freq, i) => {
      const delay = i * 0.08;
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.12, now + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.1);
      osc.connect(gain).connect(this.sfxGain);
      osc.start(now + delay);
      osc.stop(now + delay + 0.12);
    });

    // Low thud for loss
    const thud = ctx.createOscillator();
    thud.type = 'sine';
    thud.frequency.setValueAtTime(120, now + 0.2);
    thud.frequency.exponentialRampToValueAtTime(50, now + 0.4);
    const thudGain = ctx.createGain();
    thudGain.gain.setValueAtTime(0.2, now + 0.2);
    thudGain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
    thud.connect(thudGain).connect(this.sfxGain);
    thud.start(now + 0.2);
    thud.stop(now + 0.45);
  }

  /** Performance review — authoritative stamp/slap */
  public playReview(): void {
    if (!this.ctx || !this.canPlay('review')) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;

    // Sharp impact noise
    const noiseBuffer = this.createNoiseBuffer(0.08, (t) => (1 - t * t) * 0.6);
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1500;
    filter.Q.value = 3;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    noise.connect(filter).connect(gain).connect(this.sfxGain);
    noise.start(now);
    noise.stop(now + 0.1);

    // Stamp resonance
    const osc = ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.setValueAtTime(200, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.15);
    const oscGain = ctx.createGain();
    oscGain.gain.setValueAtTime(0.15, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    osc.connect(oscGain).connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.2);
  }

  /** QBR wave hits player — deep whoosh sweep */
  public playQBR(): void {
    if (!this.ctx || !this.canPlay('qbr')) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;

    // Sweeping noise
    const noiseBuffer = this.createNoiseBuffer(0.6, (t) => {
      const env = Math.sin(t * Math.PI);
      return env * 0.4;
    });
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(200, now);
    filter.frequency.exponentialRampToValueAtTime(3000, now + 0.3);
    filter.frequency.exponentialRampToValueAtTime(200, now + 0.6);
    filter.Q.value = 1.5;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
    noise.connect(filter).connect(gain).connect(this.sfxGain);
    noise.start(now);
    noise.stop(now + 0.6);

    // Deep bass sweep
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(60, now);
    osc.frequency.exponentialRampToValueAtTime(120, now + 0.3);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.6);
    const oscGain = ctx.createGain();
    oscGain.gain.setValueAtTime(0.25, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
    osc.connect(oscGain).connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.6);
  }

  /** QBR approaching — ominous low drone warning */
  public playQBRStart(): void {
    if (!this.ctx || !this.canPlay('qbrStart')) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;

    // Low ominous drone
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(55, now);
    osc.frequency.linearRampToValueAtTime(65, now + 1.5);
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 300;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.15, now + 0.5);
    gain.gain.linearRampToValueAtTime(0.15, now + 1.0);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);
    osc.connect(filter).connect(gain).connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 1.5);

    // Warning pings
    for (let i = 0; i < 3; i++) {
      const ping = ctx.createOscillator();
      ping.type = 'sine';
      ping.frequency.value = 880;
      const pingGain = ctx.createGain();
      const t = now + 0.3 + i * 0.4;
      pingGain.gain.setValueAtTime(0.1, t);
      pingGain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
      ping.connect(pingGain).connect(this.sfxGain);
      ping.start(t);
      ping.stop(t + 0.15);
    }
  }

  /** Finance recharge — ascending sparkle cha-ching */
  public playRecharge(): void {
    if (!this.ctx || !this.canPlay('recharge')) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;

    // Ascending sparkle
    const notes = [523, 659, 784, 1047, 1319];
    notes.forEach((freq, i) => {
      const delay = i * 0.06;
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.15, now + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.2);
      osc.connect(gain).connect(this.sfxGain);
      osc.start(now + delay);
      osc.stop(now + delay + 0.22);
    });

    // Cash register "ching"
    const ching = ctx.createOscillator();
    ching.type = 'sine';
    ching.frequency.value = 3500;
    const chingGain = ctx.createGain();
    chingGain.gain.setValueAtTime(0.12, now + 0.3);
    chingGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    ching.connect(chingGain).connect(this.sfxGain);
    ching.start(now + 0.3);
    ching.stop(now + 0.5);
  }

  /** Fired — sad trombone "wah wah wah wahhh" */
  public playFired(): void {
    if (!this.ctx || !this.canPlay('fired')) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;

    // Classic sad trombone descending notes
    const notes = [
      { freq: 311, start: 0, dur: 0.35 },     // Eb4
      { freq: 293, start: 0.35, dur: 0.35 },   // D4
      { freq: 277, start: 0.7, dur: 0.35 },    // Db4
      { freq: 261, start: 1.05, dur: 0.8 },    // C4 (long final)
    ];

    notes.forEach((note) => {
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(note.freq, now + note.start);
      // Slight vibrato on last note
      if (note.dur > 0.5) {
        osc.frequency.setValueAtTime(note.freq, now + note.start);
        // Manual wobble with small detune steps
        for (let w = 0; w < 8; w++) {
          const t = now + note.start + 0.1 + w * 0.08;
          osc.frequency.setValueAtTime(note.freq + (w % 2 === 0 ? 3 : -3), t);
        }
      }
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 800;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.15, now + note.start);
      gain.gain.setValueAtTime(0.15, now + note.start + note.dur * 0.7);
      gain.gain.exponentialRampToValueAtTime(0.001, now + note.start + note.dur);
      osc.connect(filter).connect(gain).connect(this.sfxGain);
      osc.start(now + note.start);
      osc.stop(now + note.start + note.dur + 0.05);
    });
  }

  /** AI model event — breaking news alert (two-tone alarm chime) */
  public playAIEvent(): void {
    if (!this.ctx || !this.canPlay('aiEvent')) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;

    // Two-tone alert chime (news bulletin style)
    const tones = [
      { freq: 880, start: 0, dur: 0.15 },
      { freq: 1320, start: 0.15, dur: 0.25 },
    ];
    tones.forEach((tone) => {
      const osc = ctx.createOscillator();
      osc.type = 'square';
      osc.frequency.value = tone.freq;
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 2000;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.18, now + tone.start);
      gain.gain.setValueAtTime(0.18, now + tone.start + tone.dur * 0.6);
      gain.gain.exponentialRampToValueAtTime(0.001, now + tone.start + tone.dur);
      osc.connect(filter).connect(gain).connect(this.sfxGain);
      osc.start(now + tone.start);
      osc.stop(now + tone.start + tone.dur + 0.02);
    });

    // Attention ping
    const ping = ctx.createOscillator();
    ping.type = 'sine';
    ping.frequency.value = 2640;
    const pingGain = ctx.createGain();
    pingGain.gain.setValueAtTime(0.1, now + 0.4);
    pingGain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
    ping.connect(pingGain).connect(this.sfxGain);
    ping.start(now + 0.4);
    ping.stop(now + 0.62);
  }

  /** Damage hit — short impact when player takes damage */
  public playDamageHit(): void {
    if (!this.ctx || !this.canPlay('damageHit')) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;

    // Low thud impact
    const thud = ctx.createOscillator();
    thud.type = 'sine';
    thud.frequency.setValueAtTime(100, now);
    thud.frequency.exponentialRampToValueAtTime(50, now + 0.1);
    const thudGain = ctx.createGain();
    thudGain.gain.setValueAtTime(0.3, now);
    thudGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    thud.connect(thudGain).connect(this.sfxGain);
    thud.start(now);
    thud.stop(now + 0.1);

    // Sharp noise burst
    const noiseBuffer = this.createNoiseBuffer(0.08, (t) => (1 - t) * 0.4);
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1200;
    filter.Q.value = 2;
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.25, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    noise.connect(filter).connect(noiseGain).connect(this.sfxGain);
    noise.start(now);
    noise.stop(now + 0.08);
  }

  /** Ambient office sounds — looping background ambience */
  public playAmbient(): void {
    if (!this.ctx || !this.ambientGain) return;
    // Early return if ambient is already playing
    if (this.ambientHum !== null) return;

    const ctx = this.ctx;

    // HVAC hum
    const hum = ctx.createOscillator();
    hum.type = 'sine';
    hum.frequency.value = 60;
    const humGain = ctx.createGain();
    humGain.gain.value = 0.03;
    hum.connect(humGain).connect(this.ambientGain);
    hum.start();
    this.ambientHum = hum;

    // Office ambience noise (3-second loop)
    const noiseBuffer = this.createNoiseBuffer(3, () => 0.02);
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    noise.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 400;
    filter.Q.value = 0.5;
    noise.connect(filter).connect(this.ambientGain);
    noise.start();
    this.ambientNoise = noise;
  }

  /** Stop ambient sounds */
  public stopAmbient(): void {
    if (this.ambientHum) {
      this.ambientHum.stop();
      this.ambientHum = null;
    }
    if (this.ambientNoise) {
      this.ambientNoise.stop();
      this.ambientNoise = null;
    }
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
