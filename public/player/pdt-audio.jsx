// pdt-audio.jsx — Web Audio API Synthesizer for Meridian Terminal

const AudioContext = window.AudioContext || window.webkitAudioContext;
let ctx = null;

// Ensure audio context starts on first interaction
const initAudio = () => {
  if (!ctx) {
    ctx = new AudioContext();
  }
  if (ctx.state === 'suspended') {
    ctx.resume();
  }
};

window.addEventListener('click', initAudio, { once: true });
window.addEventListener('touchstart', initAudio, { once: true });

// ── Synthesizer Utilities ──────────────────────────────────────────────────

const createOsc = (type, freq, time, duration, vol = 0.1) => {
  if (!ctx) return null;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  
  osc.type = type;
  osc.frequency.setValueAtTime(freq, time);
  
  gain.gain.setValueAtTime(0, time);
  gain.gain.linearRampToValueAtTime(vol, time + 0.05);
  gain.gain.exponentialRampToValueAtTime(0.001, time + duration);
  
  osc.connect(gain);
  gain.connect(ctx.destination);
  
  osc.start(time);
  osc.stop(time + duration);
  return { osc, gain };
};

const createNoise = (time, duration, vol = 0.1, isHigh = false) => {
  if (!ctx) return null;
  const bufferSize = ctx.sampleRate * duration;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  
  const noise = ctx.createBufferSource();
  noise.buffer = buffer;
  
  const filter = ctx.createBiquadFilter();
  filter.type = isHigh ? 'highpass' : 'bandpass';
  filter.frequency.value = isHigh ? 2000 : 800;
  
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0, time);
  gain.gain.linearRampToValueAtTime(vol, time + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.001, time + duration);
  
  noise.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  
  noise.start(time);
  noise.stop(time + duration);
};

// ── Sound Library ──────────────────────────────────────────────────────────

window.AudioEngine = {
  playKeystroke: () => {
    if (!ctx) return;
    const t = ctx.currentTime;
    createNoise(t, 0.05, 0.05, true);
  },

  playError: () => {
    if (!ctx) return;
    const t = ctx.currentTime;
    createOsc('sawtooth', 150, t, 0.3, 0.1);
    createOsc('square', 100, t, 0.3, 0.1);
    createNoise(t, 0.3, 0.05, false);
  },

  playUnlock: () => {
    if (!ctx) return;
    const t = ctx.currentTime;
    createOsc('sine', 440, t, 0.2, 0.1);
    createOsc('sine', 660, t + 0.1, 0.4, 0.1);
    createOsc('sine', 880, t + 0.2, 0.6, 0.1);
  },

  playAlert: () => {
    if (!ctx) return;
    const t = ctx.currentTime;
    // Klaxon sound
    for (let i = 0; i < 3; i++) {
      const time = t + (i * 0.8);
      const { osc, gain } = createOsc('square', 600, time, 0.4, 0.15) || {};
      if (osc) {
        osc.frequency.linearRampToValueAtTime(400, time + 0.4);
        gain.gain.setValueAtTime(0.15, time);
        gain.gain.linearRampToValueAtTime(0.001, time + 0.4);
      }
    }
  },

  playBlip: (distance = 1, isThreat = false) => {
    if (!ctx) return;
    const t = ctx.currentTime;
    const freq = isThreat ? 800 + (1-distance)*400 : 600;
    const dur = isThreat ? 0.3 : 0.1;
    createOsc('sine', freq, t, dur, 0.2);
  },

  playMother: (variant = 'seegson') => {
    if (!ctx) return;
    const t = ctx.currentTime;
    const isWY = variant === 'wy';
    const baseFreq = isWY ? 200 : 400;
    
    // Generate a rapid series of beeps to simulate text processing
    for (let i = 0; i < 8; i++) {
      const time = t + (i * 0.08);
      const freq = baseFreq + Math.random() * 200;
      createOsc(isWY ? 'square' : 'sine', freq, time, 0.05, 0.05);
    }
  }
};
