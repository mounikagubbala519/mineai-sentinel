/**
 * Web Audio API Risk Alarm Sound Generator
 * Generates emergency siren alert tones for high-risk detection without external assets.
 */

class AlarmSoundSystem {
  constructor() {
    this.audioCtx = null;
    this.isPlaying = false;
    this.intervalId = null;
    this.isMuted = false;
  }

  initContext() {
    if (!this.audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.audioCtx = new AudioContext();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  playAlarmSound() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.audioCtx) return;

    if (this.isPlaying) return;
    this.isPlaying = true;

    let highFreq = true;

    const beep = () => {
      if (!this.isPlaying || this.isMuted) return;
      try {
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(highFreq ? 900 : 600, this.audioCtx.currentTime);

        gain.gain.setValueAtTime(0.3, this.audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.35);

        osc.connect(gain);
        gain.connect(this.audioCtx.destination);

        osc.start();
        osc.stop(this.audioCtx.currentTime + 0.35);

        highFreq = !highFreq;
      } catch (err) {
        console.warn('Audio alarm playback issue:', err);
      }
    };

    beep();
    this.intervalId = setInterval(beep, 450);
  }

  stopAlarmSound() {
    this.isPlaying = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  triggerSingleAlertBeep() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.audioCtx) return;
    try {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(950, this.audioCtx.currentTime);
      gain.gain.setValueAtTime(0.4, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.5);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start();
      osc.stop(this.audioCtx.currentTime + 0.5);
    } catch (e) {
      console.warn(e);
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.isMuted) {
      this.stopAlarmSound();
    }
    return this.isMuted;
  }
}

export const alarmSystem = new AlarmSoundSystem();
