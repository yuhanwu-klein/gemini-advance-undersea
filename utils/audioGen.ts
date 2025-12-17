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

export const generateBackgroundMusicBuffer = (): AudioBuffer => {
  const ctx = getAudioContext();
  const duration = 15; // 15 seconds seamless loop
  const sampleRate = ctx.sampleRate;
  const length = Math.floor(duration * sampleRate); // Fix: Ensure integer length
  const buffer = ctx.createBuffer(2, length, sampleRate); // Stereo for width

  // Frequencies for a dreamy C Major 9 pad (C3, G3, B3, E4, D5)
  // These intervals create an "elegant" and "magical" feeling
  const chord = [130.81, 196.00, 246.94, 329.63, 587.33]; 

  for (let channel = 0; channel < 2; channel++) {
      const data = buffer.getChannelData(channel);
      for (let i = 0; i < data.length; i++) {
        const t = i / sampleRate;
        let sample = 0;

        chord.forEach((freq, idx) => {
            // Slight detune between channels for stereo width
            const detune = channel === 0 ? 1 : 1.002; 
            const f = freq * detune;
            
            // Slow amplitude modulation (swelling)
            // Each note swells at a slightly different rate to create texture
            const swell = 0.8 + 0.2 * Math.sin(2 * Math.PI * (0.1 + idx * 0.05) * t);
            
            // Add sine wave
            sample += Math.sin(2 * Math.PI * f * t) * swell;
        });

        // Normalize and soften
        data[i] = sample * 0.1;
      }
  }

  // Apply a simple fade in/out at the very edges to ensure perfect loop click-free
  const dataL = buffer.getChannelData(0);
  const dataR = buffer.getChannelData(1);
  const fadeLen = 500;
  for(let i=0; i<fadeLen; i++) {
      const vol = i / fadeLen;
      dataL[i] *= vol; dataR[i] *= vol;
      dataL[dataL.length - 1 - i] *= vol; dataR[dataR.length - 1 - i] *= vol;
  }

  return buffer;
};

export const generateBubbleBuffer = (): AudioBuffer => {
  const ctx = getAudioContext();
  const duration = 0.15;
  const sampleRate = ctx.sampleRate;
  const length = Math.floor(duration * sampleRate);
  const buffer = ctx.createBuffer(1, length, sampleRate);
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

export const generateSonarBuffer = (): AudioBuffer => {
  const ctx = getAudioContext();
  const duration = 1.0;
  const sampleRate = ctx.sampleRate;
  const length = Math.floor(duration * sampleRate);
  const buffer = ctx.createBuffer(1, length, sampleRate);
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
  const length = Math.floor(duration * sampleRate);
  const buffer = ctx.createBuffer(1, length, sampleRate);
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

export const generateShutterBuffer = (): AudioBuffer => {
  const ctx = getAudioContext();
  const duration = 0.3;
  const sampleRate = ctx.sampleRate;
  const length = Math.floor(duration * sampleRate);
  const buffer = ctx.createBuffer(1, length, sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < data.length; i++) {
    const t = i / sampleRate;
    // Mechanical click (noise burst)
    const noise = (Math.random() * 2 - 1) * Math.exp(-t * 60);

    // Magical chime (sine sweep down)
    const freq = 1500 - t * 2000;
    const tone = Math.sin(2 * Math.PI * freq * t) * Math.exp(-t * 8);

    data[i] = (noise * 0.4 + tone * 0.2);
  }
  return buffer;
};

export const generateMagicChimeBuffer = (): AudioBuffer => {
  const ctx = getAudioContext();
  const duration = 2.5;
  const sampleRate = ctx.sampleRate;
  const length = Math.floor(duration * sampleRate);
  const buffer = ctx.createBuffer(1, length, sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < data.length; i++) {
    const t = i / sampleRate;
    // Ethereal chord (Major triad)
    const f1 = 523.25; // C5
    const f2 = 659.25; // E5
    const f3 = 783.99; // G5
    
    const v1 = Math.sin(2 * Math.PI * f1 * t);
    const v2 = Math.sin(2 * Math.PI * f2 * t);
    const v3 = Math.sin(2 * Math.PI * f3 * t);
    
    const env = Math.exp(-2.5 * t);
    data[i] = (v1 + v2 + v3) * 0.2 * env;
  }
  return buffer;
};

export const generateChestOpenBuffer = (): AudioBuffer => {
    const ctx = getAudioContext();
    const duration = 1.0;
    const sampleRate = ctx.sampleRate;
    const length = Math.floor(duration * sampleRate);
    const buffer = ctx.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < data.length; i++) {
        const t = i / sampleRate;
        // Wooden Creak (Low freq saw wave with jitter)
        const creak = Math.sin(2 * Math.PI * (100 + Math.sin(t * 50) * 20) * t) * Math.exp(-t * 3);
        // Sparkle (High pitched random chimes)
        const sparkle = (t > 0.2) ? (Math.random() * Math.sin(t * 3000)) * Math.exp(-(t-0.2) * 5) : 0;
        
        data[i] = creak * 0.5 + sparkle * 0.3;
    }
    return buffer;
};

export const generateMechanismBuffer = (): AudioBuffer => {
    const ctx = getAudioContext();
    const duration = 2.0;
    const sampleRate = ctx.sampleRate;
    const length = Math.floor(duration * sampleRate);
    const buffer = ctx.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < data.length; i++) {
        const t = i / sampleRate;
        // Power up hum (Frequency sweep up)
        const freq = 100 + t * 400;
        const val = Math.sin(2 * Math.PI * freq * t);
        // Pulsing amplitude
        const pulse = 0.5 + 0.5 * Math.sin(t * 20);
        
        data[i] = val * pulse * 0.4 * Math.min(t * 2, 1); // Fade in
    }
    return buffer;
};

export const generateTutorialBlipBuffer = (): AudioBuffer => {
  const ctx = getAudioContext();
  const duration = 0.1;
  const sampleRate = ctx.sampleRate;
  const length = Math.floor(duration * sampleRate);
  const buffer = ctx.createBuffer(1, length, sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < data.length; i++) {
    const t = i / sampleRate;
    // Friendly "pop" - Sine wave sweeping down
    const freq = 800 - t * 4000;
    const val = Math.sin(2 * Math.PI * freq * t);
    const env = Math.exp(-t * 20);
    data[i] = val * env * 0.3;
  }
  return buffer;
};

export const generateScanCompleteBuffer = (): AudioBuffer => {
  const ctx = getAudioContext();
  const duration = 0.2;
  const sampleRate = ctx.sampleRate;
  const length = Math.floor(duration * sampleRate);
  const buffer = ctx.createBuffer(1, length, sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < data.length; i++) {
    const t = i / sampleRate;
    // Digital "chirp" - Two tones
    const freq = t < 0.1 ? 1200 : 1800;
    const val = Math.sin(2 * Math.PI * freq * t);
    const env = 1 - (t/duration);
    data[i] = val * env * 0.15;
  }
  return buffer;
};

export const generateLowOxygenBuffer = (): AudioBuffer => {
  const ctx = getAudioContext();
  const duration = 0.5;
  const sampleRate = ctx.sampleRate;
  const length = Math.floor(duration * sampleRate);
  const buffer = ctx.createBuffer(1, length, sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < data.length; i++) {
    const t = i / sampleRate;
    // Digital Alarm: Double beep pattern
    let amp = 0;
    // First beep 0-0.1s, Silence 0.1-0.2s, Second beep 0.2-0.3s
    if (t < 0.1) amp = 1;
    else if (t > 0.2 && t < 0.3) amp = 1;

    // Use a mix of Sine and Squareish wave for "alert" sound
    const freq = 880; 
    const val = Math.sin(2 * Math.PI * freq * t) + 0.5 * Math.sin(2 * Math.PI * freq * 3 * t);
    
    // Soften edges
    data[i] = val * amp * 0.1; 
  }
  return buffer;
};