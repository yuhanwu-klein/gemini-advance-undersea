import { useEffect, useRef, useCallback } from 'react';
import { GameState } from '../types';

interface AudioContextState {
  context: AudioContext | null;
  masterGain: GainNode | null;
  ambientGain: GainNode | null;
  bubbleGain: GainNode | null;
}

// Generate underwater ambient noise using Web Audio API
function createUnderwaterAmbient(ctx: AudioContext, destination: AudioNode) {
  // Create multiple oscillators for rich underwater sound
  const oscillators: OscillatorNode[] = [];
  const gains: GainNode[] = [];

  // Deep rumble
  const rumble = ctx.createOscillator();
  rumble.type = 'sine';
  rumble.frequency.value = 40;
  const rumbleGain = ctx.createGain();
  rumbleGain.gain.value = 0.15;
  rumble.connect(rumbleGain);
  oscillators.push(rumble);
  gains.push(rumbleGain);

  // Mid frequency hum
  const hum = ctx.createOscillator();
  hum.type = 'sine';
  hum.frequency.value = 80;
  const humGain = ctx.createGain();
  humGain.gain.value = 0.08;
  hum.connect(humGain);
  oscillators.push(hum);
  gains.push(humGain);

  // Filtered noise for water texture
  const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
  const noiseData = noiseBuffer.getChannelData(0);
  for (let i = 0; i < noiseData.length; i++) {
    noiseData[i] = Math.random() * 2 - 1;
  }

  const noise = ctx.createBufferSource();
  noise.buffer = noiseBuffer;
  noise.loop = true;

  // Low-pass filter for muffled underwater sound
  const lpFilter = ctx.createBiquadFilter();
  lpFilter.type = 'lowpass';
  lpFilter.frequency.value = 200;
  lpFilter.Q.value = 1;

  const noiseGain = ctx.createGain();
  noiseGain.gain.value = 0.12;

  noise.connect(lpFilter);
  lpFilter.connect(noiseGain);

  // Connect all to destination
  gains.forEach(g => g.connect(destination));
  noiseGain.connect(destination);

  // Start all
  oscillators.forEach(osc => osc.start());
  noise.start();

  // Add slow modulation for movement feel
  const lfo = ctx.createOscillator();
  lfo.type = 'sine';
  lfo.frequency.value = 0.1;
  const lfoGain = ctx.createGain();
  lfoGain.gain.value = 10;
  lfo.connect(lfoGain);
  lfoGain.connect(lpFilter.frequency);
  lfo.start();

  return {
    stop: () => {
      oscillators.forEach(osc => {
        try { osc.stop(); } catch {}
      });
      try { noise.stop(); } catch {}
      try { lfo.stop(); } catch {}
    }
  };
}

// Create a single bubble sound
function playBubble(ctx: AudioContext, destination: AudioNode, size: 'small' | 'medium' | 'large' = 'medium') {
  const baseFreq = size === 'small' ? 800 : size === 'medium' ? 500 : 300;
  const duration = size === 'small' ? 0.15 : size === 'medium' ? 0.25 : 0.4;

  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(baseFreq, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, ctx.currentTime + duration * 0.3);
  osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.5, ctx.currentTime + duration);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

  // Add some filtering for realism
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = baseFreq;
  filter.Q.value = 2;

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(destination);

  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + duration + 0.1);
}

// Create bubble stream (multiple bubbles)
function createBubbleStream(ctx: AudioContext, destination: AudioNode): () => void {
  let intervalId: number | null = null;

  const playRandomBubble = () => {
    const sizes: Array<'small' | 'medium' | 'large'> = ['small', 'small', 'small', 'medium', 'medium', 'large'];
    const size = sizes[Math.floor(Math.random() * sizes.length)];
    playBubble(ctx, destination, size);
  };

  // Play bubbles at random intervals
  const scheduleNext = () => {
    const delay = 100 + Math.random() * 300; // 100-400ms between bubbles
    intervalId = window.setTimeout(() => {
      playRandomBubble();
      scheduleNext();
    }, delay);
  };

  scheduleNext();

  return () => {
    if (intervalId !== null) {
      clearTimeout(intervalId);
    }
  };
}

export function useAudio(gameState: GameState, isSwimming: boolean, isGameOver: boolean) {
  const audioState = useRef<AudioContextState>({
    context: null,
    masterGain: null,
    ambientGain: null,
    bubbleGain: null,
  });

  const ambientRef = useRef<{ stop: () => void } | null>(null);
  const bubbleStopRef = useRef<(() => void) | null>(null);
  const isInitialized = useRef(false);

  // Initialize audio context on first user interaction
  const initAudio = useCallback(() => {
    if (isInitialized.current || audioState.current.context) return;

    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();

      const masterGain = ctx.createGain();
      masterGain.gain.value = 0.5;
      masterGain.connect(ctx.destination);

      const ambientGain = ctx.createGain();
      ambientGain.gain.value = 1;
      ambientGain.connect(masterGain);

      const bubbleGain = ctx.createGain();
      bubbleGain.gain.value = 1;
      bubbleGain.connect(masterGain);

      audioState.current = {
        context: ctx,
        masterGain,
        ambientGain,
        bubbleGain,
      };

      isInitialized.current = true;
    } catch (e) {
      console.warn('Web Audio API not supported:', e);
    }
  }, []);

  // Start ambient sound when game starts
  useEffect(() => {
    const { context, ambientGain } = audioState.current;

    if (gameState === GameState.PLAYING && context && ambientGain && !ambientRef.current) {
      if (context.state === 'suspended') {
        context.resume();
      }
      ambientRef.current = createUnderwaterAmbient(context, ambientGain);
    }

    // Cleanup when leaving playing state
    return () => {
      if (gameState !== GameState.PLAYING && ambientRef.current) {
        ambientRef.current.stop();
        ambientRef.current = null;
      }
    };
  }, [gameState]);

  // Bubble sounds when swimming
  useEffect(() => {
    const { context, bubbleGain } = audioState.current;

    if (isSwimming && !isGameOver && context && bubbleGain && gameState === GameState.PLAYING) {
      if (context.state === 'suspended') {
        context.resume();
      }
      bubbleStopRef.current = createBubbleStream(context, bubbleGain);
    }

    return () => {
      if (bubbleStopRef.current) {
        bubbleStopRef.current();
        bubbleStopRef.current = null;
      }
    };
  }, [isSwimming, isGameOver, gameState]);

  // Mute when game over
  useEffect(() => {
    const { ambientGain, bubbleGain } = audioState.current;

    if (isGameOver) {
      if (ambientGain) ambientGain.gain.setTargetAtTime(0.2, audioState.current.context!.currentTime, 0.5);
      if (bubbleGain) bubbleGain.gain.setTargetAtTime(0, audioState.current.context!.currentTime, 0.1);
    } else {
      if (ambientGain) ambientGain.gain.setTargetAtTime(1, audioState.current.context!.currentTime, 0.3);
      if (bubbleGain) bubbleGain.gain.setTargetAtTime(1, audioState.current.context!.currentTime, 0.1);
    }
  }, [isGameOver]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (ambientRef.current) {
        ambientRef.current.stop();
      }
      if (bubbleStopRef.current) {
        bubbleStopRef.current();
      }
      if (audioState.current.context) {
        audioState.current.context.close();
      }
    };
  }, []);

  return { initAudio };
}
