/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AmbientSoundType } from '../types';

class SoundEngine {
  private ctx: AudioContext | null = null;
  private currentType: AmbientSoundType = 'none';
  private masterGain: GainNode | null = null;
  private activeNodes: { stop?: () => void; disconnect: () => void }[] = [];
  private intervalIds: number[] = [];
  private volume: number = 0.5;
  private isMuted: boolean = false;

  private initCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    if (!this.masterGain && this.ctx) {
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.volume, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    }
  }

  public setVolume(val: number) {
    this.volume = Math.max(0, Math.min(1, val));
    if (this.masterGain && this.ctx && !this.isMuted) {
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(muted ? 0 : this.volume, this.ctx.currentTime);
    }
  }

  public playChime(type: 'focus_end' | 'break_end' | 'achievement') {
    try {
      this.initCtx();
      if (!this.ctx || this.isMuted) return;

      const t = this.ctx.currentTime;
      const gain = this.ctx.createGain();
      gain.connect(this.masterGain!);

      if (type === 'focus_end') {
        // Relaxing chime chord (E5, G#5, B5)
        const freqs = [659.25, 830.61, 987.77];
        freqs.forEach((freq, idx) => {
          const osc = this.ctx!.createOscillator();
          const oscGain = this.ctx!.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, t);
          oscGain.gain.setValueAtTime(0, t);
          oscGain.gain.linearRampToValueAtTime(0.3 / freqs.length, t + 0.05 + idx * 0.06);
          oscGain.gain.exponentialRampToValueAtTime(0.0001, t + 2.5);
          osc.connect(oscGain);
          oscGain.connect(gain);
          osc.start(t + idx * 0.06);
          osc.stop(t + 3.0);
        });
      } else if (type === 'break_end') {
        // Uplifting alert (C5, G5, C6)
        const freqs = [523.25, 783.99, 1046.50];
        freqs.forEach((freq, idx) => {
          const osc = this.ctx!.createOscillator();
          const oscGain = this.ctx!.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, t);
          oscGain.gain.setValueAtTime(0, t);
          oscGain.gain.linearRampToValueAtTime(0.25, t + 0.05 + idx * 0.1);
          oscGain.gain.exponentialRampToValueAtTime(0.001, t + 1.8);
          osc.connect(oscGain);
          oscGain.connect(gain);
          osc.start(t + idx * 0.1);
          osc.stop(t + 2.2);
        });
      } else {
        // Achievement fanfare chord
        const freqs = [440, 554.37, 659.25, 880];
        freqs.forEach((freq, idx) => {
          const osc = this.ctx!.createOscillator();
          const oscGain = this.ctx!.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, t);
          oscGain.gain.setValueAtTime(0, t);
          oscGain.gain.linearRampToValueAtTime(0.2, t + 0.04 + idx * 0.08);
          oscGain.gain.exponentialRampToValueAtTime(0.001, t + 3.0);
          osc.connect(oscGain);
          oscGain.connect(gain);
          osc.start(t + idx * 0.08);
          osc.stop(t + 3.5);
        });
      }
    } catch (err) {
      console.warn('Audio playback not permitted yet:', err);
    }
  }

  public playAmbient(type: AmbientSoundType) {
    if (this.currentType === type && this.activeNodes.length > 0) return;
    this.stopAmbient();
    this.currentType = type;
    if (type === 'none') return;

    try {
      this.initCtx();
      if (!this.ctx) return;

      switch (type) {
        case 'rain':
          this.startRain();
          break;
        case 'whitenoise':
          this.startWhiteNoise();
          break;
        case 'forest':
          this.startForest();
          break;
        case 'clock':
          this.startClock();
          break;
        case 'birds':
          this.startBirds();
          break;
        case 'fireplace':
          this.startFireplace();
          break;
        case 'library':
          this.startLibrary();
          break;
      }
    } catch (e) {
      console.warn('Could not start ambient sound:', e);
    }
  }

  public stopAmbient() {
    this.intervalIds.forEach(id => clearInterval(id));
    this.intervalIds = [];

    this.activeNodes.forEach(node => {
      try {
        if (node.stop) node.stop();
        node.disconnect();
      } catch {}
    });
    this.activeNodes = [];
    this.currentType = 'none';
  }

  private createNoiseBuffer(): AudioBuffer {
    const bufferSize = this.ctx!.sampleRate * 2;
    const buffer = this.ctx!.createBuffer(1, bufferSize, this.ctx!.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  private startWhiteNoise() {
    const buffer = this.createNoiseBuffer();
    const noise = this.ctx!.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    // Filter to make it warmer (pink/brown noise style)
    const filter = this.ctx!.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, this.ctx!.currentTime);

    const gain = this.ctx!.createGain();
    gain.gain.setValueAtTime(0.18, this.ctx!.currentTime);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain!);
    noise.start();

    this.activeNodes.push(noise, filter, gain);
  }

  private startRain() {
    // Continuous soft rainfall
    const buffer = this.createNoiseBuffer();
    const noise = this.ctx!.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    const filter = this.ctx!.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1000, this.ctx!.currentTime);
    filter.Q.setValueAtTime(0.7, this.ctx!.currentTime);

    const gain = this.ctx!.createGain();
    gain.gain.setValueAtTime(0.3, this.ctx!.currentTime);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain!);
    noise.start();

    this.activeNodes.push(noise, filter, gain);
  }

  private startForest() {
    // Gentle wind breeze swell + warm air
    const buffer = this.createNoiseBuffer();
    const noise = this.ctx!.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    const filter = this.ctx!.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(400, this.ctx!.currentTime);

    const gain = this.ctx!.createGain();
    gain.gain.setValueAtTime(0.25, this.ctx!.currentTime);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain!);
    noise.start();

    // Gentle LFO filter modulation for breeze
    const lfo = this.ctx!.createOscillator();
    lfo.frequency.setValueAtTime(0.15, this.ctx!.currentTime); // slow swell
    const lfoGain = this.ctx!.createGain();
    lfoGain.gain.setValueAtTime(200, this.ctx!.currentTime);
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);
    lfo.start();

    this.activeNodes.push(noise, filter, gain, lfo, lfoGain);
  }

  private startClock() {
    // Mechanical rhythmic tick every 1000ms
    const tick = () => {
      if (!this.ctx || this.currentType !== 'clock') return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1400, t);
      osc.frequency.exponentialRampToValueAtTime(300, t + 0.03);

      gain.gain.setValueAtTime(0.12, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.035);

      osc.connect(gain);
      gain.connect(this.masterGain!);
      osc.start(t);
      osc.stop(t + 0.04);
    };

    tick();
    const intervalId = window.setInterval(tick, 1000);
    this.intervalIds.push(intervalId);
  }

  private startBirds() {
    // Forest base atmosphere with periodic lovely bird chirps
    this.startForest();

    const chirp = () => {
      if (!this.ctx || this.currentType !== 'birds') return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      const baseFreq = 2200 + Math.random() * 800;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(baseFreq, t);
      osc.frequency.linearRampToValueAtTime(baseFreq + 600, t + 0.08);
      osc.frequency.linearRampToValueAtTime(baseFreq + 200, t + 0.16);

      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.1, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

      osc.connect(gain);
      gain.connect(this.masterGain!);
      osc.start(t);
      osc.stop(t + 0.25);
    };

    const intervalId = window.setInterval(() => {
      if (Math.random() > 0.3) chirp();
    }, 2800);
    this.intervalIds.push(intervalId);
  }

  private startFireplace() {
    // Low frequency warm resonance + random crackles
    const buffer = this.createNoiseBuffer();
    const noise = this.ctx!.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    const filter = this.ctx!.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(250, this.ctx!.currentTime);

    const gain = this.ctx!.createGain();
    gain.gain.setValueAtTime(0.35, this.ctx!.currentTime);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain!);
    noise.start();
    this.activeNodes.push(noise, filter, gain);

    // Crackle sparks
    const crackle = () => {
      if (!this.ctx || this.currentType !== 'fireplace') return;
      const t = this.ctx.currentTime;
      const spark = this.ctx.createBufferSource();
      const sparkBuff = this.ctx.createBuffer(1, 400, this.ctx.sampleRate);
      const data = sparkBuff.getChannelData(0);
      for (let i = 0; i < 400; i++) data[i] = (Math.random() * 2 - 1) * Math.exp(-i / 80);
      spark.buffer = sparkBuff;

      const sparkGain = this.ctx.createGain();
      sparkGain.gain.setValueAtTime(0.18 + Math.random() * 0.15, t);
      spark.connect(sparkGain);
      sparkGain.connect(this.masterGain!);
      spark.start(t);
    };

    const intervalId = window.setInterval(() => {
      if (Math.random() > 0.4) crackle();
    }, 450);
    this.intervalIds.push(intervalId);
  }

  private startLibrary() {
    // Room tone ambient hum
    const osc = this.ctx!.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(80, this.ctx!.currentTime);

    const gain = this.ctx!.createGain();
    gain.gain.setValueAtTime(0.04, this.ctx!.currentTime);

    osc.connect(gain);
    gain.connect(this.masterGain!);
    osc.start();

    // Soft low pass air noise
    const buffer = this.createNoiseBuffer();
    const noise = this.ctx!.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    const filter = this.ctx!.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(320, this.ctx!.currentTime);

    const airGain = this.ctx!.createGain();
    airGain.gain.setValueAtTime(0.12, this.ctx!.currentTime);

    noise.connect(filter);
    filter.connect(airGain);
    airGain.connect(this.masterGain!);
    noise.start();

    this.activeNodes.push(osc, gain, noise, filter, airGain);
  }
}

export const soundEngine = new SoundEngine();
