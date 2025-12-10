import * as THREE from 'three';

export const getAudioContext = (): AudioContext => {
  return THREE.AudioContext.getContext();
};

export const resumeAudioContext = () => {
  const ctx = getAudioContext();
  if (ctx.state === 'suspended') {
    ctx.resume();
  }
};

export const generateOceanBuffer = (): AudioBuffer => {
  const ctx = getAudioContext();
  const duration = 10;
  const sampleRate = ctx.sampleRate;
  const buffer = ctx.createBuffer(1, duration * sampleRate, sampleRate);
  const data = buffer.getChannelData(0);
  
  let lastOut = 0;
  for (let i = 0; i < data.length; i++) {
    const white = Math.random() * 2 - 1;
    // Brown noise filter
    data[i] = (lastOut + (0.02 * white)) / 1.02;
    lastOut = data[i];
    data[i] *= 3.5; // Gain compensation
  }
  return buffer;
};

export const generateBubbleBuffer = (): AudioBuffer => {
  const ctx = getAudioContext();
  const duration = 0.15;
  const sampleRate = ctx.sampleRate;
  const buffer = ctx.createBuffer(1, duration * sampleRate, sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < data.length; i++) {
    const t = i / sampleRate;
    // Sine sweep up
    const freq = 400 + 800 * t; 
    const val = Math.sin(2 * Math.PI * freq * t);
    // Envelope
    const env = 1 - (t / duration);
    data[i] = val * env * 0.5;
  }
  return buffer;
};

export const generateSwimBuffer = (): AudioBuffer => {
  const ctx = getAudioContext();
  const duration = 2; // Loopable swim stroke
  const sampleRate = ctx.sampleRate;
  const buffer = ctx.createBuffer(1, duration * sampleRate, sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < data.length; i++) {
    const t = i / sampleRate;
    const white = Math.random() * 2 - 1;
    // Low pass for water resistance sound
    const val = white * 0.5;
    // Rhythmic modulation
    const mod = 0.5 + 0.5 * Math.sin(2 * Math.PI * 1 * t); 
    data[i] = val * mod * 0.3;
  }
  return buffer;
};

export const generateSonarBuffer = (): AudioBuffer => {
  const ctx = getAudioContext();
  const duration = 1.0;
  const sampleRate = ctx.sampleRate;
  const buffer = ctx.createBuffer(1, duration * sampleRate, sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < data.length; i++) {
    const t = i / sampleRate;
    const freq = 800;
    const val = Math.sin(2 * Math.PI * freq * t);
    const env = Math.exp(-6 * t);
    data[i] = val * env * 0.4;
  }
  return buffer;
};

export const generateFishAmbianceBuffer = (): AudioBuffer => {
  const ctx = getAudioContext();
  const duration = 4;
  const sampleRate = ctx.sampleRate;
  const buffer = ctx.createBuffer(1, duration * sampleRate, sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < data.length; i++) {
    const t = i / sampleRate;
    // High frequency sparkle/shimmer
    const val = (Math.random() * 2 - 1) * 0.1;
    const mod = Math.sin(2 * Math.PI * 0.5 * t);
    data[i] = val * mod;
  }
  return buffer;
};
