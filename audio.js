/**
 * Aerodrop Web Audio Synthesizer
 * Redesigned from scratch: Subtle, elegant, high-end micro-sound effects
 * exclusively for Merging (coalescence) and Bursting (pop).
 */

export class SoundEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.enabled = true;
    this.initialized = false;
  }

  init() {
    if (this.initialized && this.ctx) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      this.ctx = new AudioContext();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.85, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
      this.initialized = true;

      // Auto-unlock on first user interaction anywhere
      const unlock = () => {
        if (this.ctx && this.ctx.state === 'suspended') {
          this.ctx.resume().then(() => {
            // Play an inaudible micro-pulse to warm up the audio hardware
            try {
              const osc = this.ctx.createOscillator();
              const g = this.ctx.createGain();
              g.gain.setValueAtTime(0.00001, this.ctx.currentTime);
              osc.connect(g);
              g.connect(this.ctx.destination);
              osc.start(0);
              osc.stop(this.ctx.currentTime + 0.001);
            } catch (err) {}
          }).catch(() => {});
        }
      };

      ['pointerdown', 'touchstart', 'touchend', 'mousedown', 'keydown', 'click'].forEach(evt => {
        window.addEventListener(evt, unlock, { capture: true, once: false, passive: true });
        document.addEventListener(evt, unlock, { capture: true, once: false, passive: true });
      });

      // Also attempt immediate resume if browser allows
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
    } catch (e) {
      console.warn("Web Audio API not supported or blocked", e);
    }
  }

  ensureAudio() {
    if (!this.initialized || !this.ctx) {
      this.init();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  toggle() {
    this.enabled = !this.enabled;
    if (this.enabled) {
      this.ensureAudio();
    }
    return this.enabled;
  }

  /**
   * Fluid bubble merge: Crisp, warm liquid bloop audible on mobile speakers
   */
  playMerge(newRadius = 40) {
    if (!this.enabled || !this.ctx) return;
    try {
      this.ensureAudio();
      const now = this.ctx.currentTime;

      // Frequency tuned for small mobile speakers with audible harmonics (160Hz to 320Hz)
      const clampedR = Math.max(16, Math.min(100, newRadius));
      const fStart = 320 - (clampedR - 16) * 1.8; 
      const fEnd = fStart * 1.25; 

      const duration = 0.09;

      // 1. Primary Minnaert cavity oscillator (Sine wave)
      const osc1 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();
      osc1.type = 'sine';

      // Upward liquid pitch swoop
      osc1.frequency.setValueAtTime(fStart, now);
      osc1.frequency.exponentialRampToValueAtTime(fEnd, now + duration * 0.4);
      osc1.frequency.exponentialRampToValueAtTime(fEnd * 0.94, now + duration);

      // Fluid envelope with punchy presence
      gain1.gain.setValueAtTime(0.0001, now);
      gain1.gain.linearRampToValueAtTime(0.35, now + 0.005);
      gain1.gain.exponentialRampToValueAtTime(0.12, now + 0.04);
      gain1.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      // 2. Harmonic overtone for mobile speaker clarity
      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(fStart * 2.0, now);
      osc2.frequency.exponentialRampToValueAtTime(fEnd * 2.0, now + duration * 0.35);

      gain2.gain.setValueAtTime(0.0001, now);
      gain2.gain.linearRampToValueAtTime(0.12, now + 0.004);
      gain2.gain.exponentialRampToValueAtTime(0.0001, now + duration * 0.5);

      // 3. Low-pass filter
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(Math.max(600, fStart * 3.2), now);
      filter.Q.setValueAtTime(1.0, now);

      osc1.connect(gain1);
      osc2.connect(gain2);
      gain1.connect(filter);
      gain2.connect(filter);
      filter.connect(this.masterGain);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + duration);
      osc2.stop(now + duration);
    } catch (e) {}
  }

  /**
   * Bubble burst: Crisp acoustic "pop"
   */
  playPop(radius = 30) {
    if (!this.enabled || !this.ctx) return;
    try {
      this.ensureAudio();
      const now = this.ctx.currentTime;

      const clampedR = Math.max(16, Math.min(100, radius));
      // Pop pitch range
      const popStartFreq = 420 - (clampedR - 16) * 2.2;
      const popEndFreq = Math.max(70, popStartFreq * 0.3);

      const popDuration = 0.045;

      // 1. Soft pressure release transient
      const osc = this.ctx.createOscillator();
      const oscGain = this.ctx.createGain();
      osc.type = 'sine';

      osc.frequency.setValueAtTime(popStartFreq, now);
      osc.frequency.exponentialRampToValueAtTime(popEndFreq, now + 0.025);

      oscGain.gain.setValueAtTime(0.0001, now);
      oscGain.gain.linearRampToValueAtTime(0.42, now + 0.002);
      oscGain.gain.exponentialRampToValueAtTime(0.0001, now + popDuration);

      // 2. Air puff noise
      const snapLen = Math.floor(this.ctx.sampleRate * 0.02);
      const snapBuffer = this.ctx.createBuffer(1, snapLen, this.ctx.sampleRate);
      const data = snapBuffer.getChannelData(0);
      for (let i = 0; i < snapLen; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / snapLen, 2.0);
      }

      const noiseSource = this.ctx.createBufferSource();
      noiseSource.buffer = snapBuffer;

      const snapFilter = this.ctx.createBiquadFilter();
      snapFilter.type = 'bandpass';
      snapFilter.frequency.setValueAtTime(800, now);
      snapFilter.Q.setValueAtTime(1.2, now);

      const snapGain = this.ctx.createGain();
      snapGain.gain.setValueAtTime(0.18, now);
      snapGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.02);

      osc.connect(oscGain);
      oscGain.connect(this.masterGain);

      noiseSource.connect(snapFilter);
      snapFilter.connect(snapGain);
      snapGain.connect(this.masterGain);

      osc.start(now);
      noiseSource.start(now);
      osc.stop(now + popDuration);
      noiseSource.stop(now + 0.022);
    } catch (e) {}
  }

  /**
   * Subtle, soft organic chime for bonus time rewards on big merges
   */
  playBonusTime(isColossal = false) {
    if (!this.enabled || !this.ctx) return;
    try {
      this.ensureAudio();
      const now = this.ctx.currentTime;
      // Warm, gentle mid-register tones (C5/E5 or A4/C#5/E5)
      const notes = isColossal ? [440.00, 554.37, 659.25] : [523.25, 659.25];
      const peakGain = isColossal ? 0.055 : 0.038;

      // Soft low-pass filter to remove harsh edge and create a velvety acoustic glass feel
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1200, now);
      filter.connect(this.masterGain);

      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const t = now + idx * 0.07;
        const noteDuration = 0.22;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t);

        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.linearRampToValueAtTime(peakGain, t + 0.025);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + noteDuration);

        osc.connect(gain);
        gain.connect(filter);

        osc.start(t);
        osc.stop(t + noteDuration);
      });
    } catch (e) {}
  }

  /**
   * Victory chime (ascending triad)
   */
  playWin() {
    if (!this.enabled || !this.ctx) return;
    try {
      this.ensureAudio();
      const now = this.ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      
      notes.forEach((freq, index) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const startTime = now + index * 0.09;
        const noteDuration = 0.38;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0.0001, startTime);
        gain.gain.linearRampToValueAtTime(0.28, startTime + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + noteDuration);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(startTime);
        osc.stop(startTime + noteDuration);
      });
    } catch (e) {}
  }

  /**
   * Level fail tone
   */
  playFail() {
    if (!this.enabled || !this.ctx) return;
    try {
      this.ensureAudio();
      const now = this.ctx.currentTime;
      const notes = [392.0, 311.13]; // G4 to Eb4
      
      notes.forEach((freq, index) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const startTime = now + index * 0.16;
        const noteDuration = 0.45;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0.0001, startTime);
        gain.gain.linearRampToValueAtTime(0.25, startTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + noteDuration);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(startTime);
        osc.stop(startTime + noteDuration);
      });
    } catch (e) {}
  }

  /**
   * Timer tick (<10ms)
   */
  playTick() {
    if (!this.enabled || !this.ctx) return;
    try {
      this.ensureAudio();
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1400, now);
      osc.frequency.exponentialRampToValueAtTime(800, now + 0.008);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(0.12, now + 0.001);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.008);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.009);
    } catch (e) {}
  }

  // Silent stubs (only merge and burst have sound)
  playSpawn() {}
  playBounce() {}
}

export const soundEngine = new SoundEngine();
if (typeof window !== 'undefined') {
  window.soundEngine = soundEngine;
}

