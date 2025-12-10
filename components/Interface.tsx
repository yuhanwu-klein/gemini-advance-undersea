import React, { useState, useRef, useEffect } from 'react';
import { Eye, Sun, Moon, Play, Camera, Check, RefreshCw, X, Map as MapIcon, Compass, Waves, Droplets, AlertTriangle, Skull, BatteryCharging, Scan, Dna, ArrowRight, Heart, Star } from 'lucide-react';
import { GameSettings, TimeOfDay, GameState, DiveLicense, MapPOI, FishSpecies } from '../types';

interface MiniMapProps {
    pois: MapPOI[];
    cameraRotationRef: React.MutableRefObject<number>;
}

const MiniMap: React.FC<MiniMapProps> = ({ pois, cameraRotationRef }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const range = 25; 
    
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationId: number;

        const render = () => {
            const size = canvas.width;
            const center = size / 2;
            const rotation = cameraRotationRef.current;

            ctx.clearRect(0, 0, size, size);

            // Cute Radar Background
            const grad = ctx.createRadialGradient(center, center, 0, center, center, center);
            grad.addColorStop(0, "rgba(255, 255, 255, 0.4)");
            grad.addColorStop(1, "rgba(165, 243, 252, 0.4)"); // Cyan-200
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(center, center, center, 0, Math.PI * 2);
            ctx.fill();

            // Rings
            ctx.strokeStyle = "rgba(255, 255, 255, 0.6)";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(center, center, center * 0.33, 0, Math.PI * 2);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(center, center, center * 0.66, 0, Math.PI * 2);
            ctx.stroke();
            
            // Crosshair
            ctx.beginPath();
            ctx.moveTo(center, 10); ctx.lineTo(center, size - 10);
            ctx.moveTo(10, center); ctx.lineTo(size - 10, center);
            ctx.stroke();

            ctx.save();
            ctx.translate(center, center);
            ctx.rotate(rotation); 

            pois.forEach(poi => {
                const scale = (size / 2) / range;
                const mapX = poi.x * scale;
                const mapY = poi.z * scale;

                const dist = Math.sqrt(poi.x*poi.x + poi.z*poi.z);
                if (dist > range) return;

                ctx.beginPath();
                if (poi.type === 'ruin') {
                    ctx.fillStyle = '#f472b6'; // Pink
                    ctx.fillRect(mapX - 3, mapY - 3, 6, 6);
                } else if (poi.type === 'lamp') {
                    ctx.fillStyle = '#fde047'; // Yellow
                    ctx.arc(mapX, mapY, 3, 0, Math.PI * 2);
                    ctx.fill();
                } else if (poi.type === 'coral') {
                    ctx.fillStyle = poi.color || '#a78bfa';
                    ctx.arc(mapX, mapY, 3, 0, Math.PI * 2);
                    ctx.fill();
                }
            });

            ctx.restore();

            // Player Arrow (Cute rounded triangle)
            ctx.fillStyle = '#fff'; 
            ctx.shadowColor = 'rgba(0,0,0,0.1)';
            ctx.shadowBlur = 4;
            ctx.beginPath();
            ctx.moveTo(center, center - 8);
            ctx.quadraticCurveTo(center, center - 8, center - 6, center + 6);
            ctx.lineTo(center, center + 4);
            ctx.lineTo(center + 6, center + 6);
            ctx.quadraticCurveTo(center, center - 8, center, center - 8);
            ctx.closePath();
            ctx.fill();
            ctx.shadowBlur = 0;
            
            // Radar Sweep
            const time = Date.now() / 2000;
            const sweepAngle = (time % 1) * Math.PI * 2;
            
            ctx.save();
            ctx.translate(center, center);
            ctx.rotate(sweepAngle);
            const sweepGrad = ctx.createConicGradient(0, 0, 0);
            sweepGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
            sweepGrad.addColorStop(0.8, 'rgba(255, 255, 255, 0)');
            sweepGrad.addColorStop(1, 'rgba(255, 255, 255, 0.6)');
            ctx.fillStyle = sweepGrad;
            ctx.beginPath();
            ctx.moveTo(0,0);
            ctx.arc(0, 0, center, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();

            animationId = requestAnimationFrame(render);
        };

        render();
        return () => cancelAnimationFrame(animationId);
    }, [pois, cameraRotationRef]);

    return (
        <div className="bg-white/20 backdrop-blur-md rounded-full border-[4px] border-white/40 shadow-xl overflow-hidden w-40 h-40 relative transition-transform hover:scale-105 duration-300">
             <canvas ref={canvasRef} width={200} height={200} className="w-full h-full" />
             <div className="absolute top-2 left-1/2 -translate-x-1/2 text-[10px] font-black text-white/80 bg-black/10 px-2 rounded-full">N</div>
        </div>
    );
};

const OxygenMeter: React.FC<{ level: number, isRecharging?: boolean }> = ({ level, isRecharging }) => {
    const isLow = level < 25;
    const isCritical = level < 15;
    const segments = 12; // Fewer, chunkier segments
    const activeSegments = Math.ceil(level / (100 / segments));

    return (
        <div className="flex items-end gap-3 pointer-events-auto">
             {/* Icon Bubble */}
             <div className="flex flex-col items-center gap-1">
                <div className={`p-3 rounded-full border-2 bg-white/30 backdrop-blur-md transition-all duration-300 animate-bounce-slow
                    ${isRecharging ? 'border-green-400 text-green-600' : (isLow ? 'border-pink-400 text-pink-500' : 'border-cyan-400 text-cyan-600')}
                `}>
                    {isRecharging ? <BatteryCharging size={24} className="animate-pulse" strokeWidth={2.5} /> : (isLow ? <AlertTriangle size={24} className={isCritical ? "animate-bounce" : ""} strokeWidth={2.5} /> : <Droplets size={24} strokeWidth={2.5} />)}
                </div>
                <span className={`text-[10px] font-black tracking-wider bg-white/80 px-2 py-0.5 rounded-full ${isRecharging ? 'text-green-600' : 'text-cyan-600'}`}>
                    {Math.round(level)}%
                </span>
            </div>

            {/* Bar Container */}
            <div className={`relative h-48 w-16 bg-white/20 border-4 border-white/40 rounded-3xl p-2 flex flex-col-reverse justify-start gap-1 shadow-xl backdrop-blur-sm
                 ${isCritical ? 'border-pink-400/60 shadow-pink-500/30' : ''}
            `}>
                {/* Segments */}
                {[...Array(segments)].map((_, i) => {
                    const isActive = i < activeSegments;
                    
                    let bgClass = "bg-white/20"; // Inactive
                    
                    if (isActive) {
                        if (isRecharging) bgClass = "bg-gradient-to-r from-green-300 to-emerald-400 shadow-[0_0_10px_rgba(110,231,183,0.6)]";
                        else if (isCritical) bgClass = "bg-gradient-to-r from-red-300 to-pink-500 shadow-[0_0_10px_rgba(244,114,182,0.6)] animate-pulse";
                        else if (isLow) bgClass = "bg-gradient-to-r from-orange-300 to-amber-400";
                        else bgClass = "bg-gradient-to-r from-cyan-300 to-blue-400 shadow-[0_0_10px_rgba(34,211,238,0.4)]";
                    }

                    return (
                        <div 
                            key={i} 
                            className={`w-full flex-1 rounded-full transition-all duration-300 ${bgClass}`}
                            style={{ opacity: isActive ? 1 : 0.4, transform: isActive ? 'scale(1)' : 'scale(0.8)' }}
                        />
                    );
                })}
            </div>
        </div>
    );
};

const BioScanner: React.FC<{ species: FishSpecies | null }> = ({ species }) => {
    const [displayText, setDisplayText] = useState('');
    
    useEffect(() => {
        if (!species) {
            setDisplayText('');
            return;
        }
        let i = 0;
        const txt = species.description;
        setDisplayText('');
        
        const timer = setInterval(() => {
            if (i < txt.length) {
                setDisplayText(prev => prev + txt.charAt(i));
                i++;
            } else {
                clearInterval(timer);
            }
        }, 20); // Faster typing
        return () => clearInterval(timer);
    }, [species]);

    // Speech Narration (Keep existing logic, simplified for brevity here)
    useEffect(() => {
        if (!species) return;
        const speak = () => {
            if (!window.speechSynthesis) return;
            window.speechSynthesis.cancel();
            const text = `Found one! It's a ${species.name}.`;
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.pitch = 1.2; 
            utterance.rate = 1.1;
            const voices = window.speechSynthesis.getVoices();
            const femaleVoice = voices.find(v => v.name.includes('Google US English') || v.name.includes('Samantha'));
            if (femaleVoice) utterance.voice = femaleVoice;
            window.speechSynthesis.speak(utterance);
        };
        if (window.speechSynthesis.getVoices().length !== 0) speak();
        else {
             const handler = () => speak();
             window.speechSynthesis.addEventListener('voiceschanged', handler, { once: true });
             return () => window.speechSynthesis.removeEventListener('voiceschanged', handler);
        }
        return () => window.speechSynthesis.cancel();
    }, [species]);

    if (!species) return null;

    const rarityBadge = {
        'COMMON': 'bg-gray-100 text-gray-600',
        'UNCOMMON': 'bg-green-100 text-green-600',
        'RARE': 'bg-purple-100 text-purple-600',
        'LEGENDARY': 'bg-orange-100 text-orange-600 animate-pulse'
    };

    return (
        <div className="absolute top-24 right-4 w-80 bg-white/90 backdrop-blur-xl border-4 border-white/50 rounded-3xl overflow-hidden shadow-2xl animate-in slide-in-from-right duration-500 pointer-events-auto transform rotate-1">
            <div className="bg-gradient-to-r from-cyan-100 to-blue-100 p-4 border-b border-white flex items-center gap-3">
                <div className="bg-white p-2 rounded-full shadow-sm">
                    <Scan size={20} className="text-cyan-500 animate-spin-slow" strokeWidth={2.5} />
                </div>
                <span className="text-sm font-black text-cyan-700 tracking-wide uppercase">New Discovery!</span>
            </div>
            
            <div className="p-5 flex flex-col gap-3">
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="text-slate-800 font-black text-2xl leading-none mb-1">{species.name}</h3>
                        <div className="text-slate-400 text-xs italic font-medium">{species.scientificName}</div>
                    </div>
                    <Star size={24} className="text-yellow-400 fill-yellow-400" />
                </div>

                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 min-h-[80px] shadow-inner">
                    <p className="text-slate-600 text-sm font-medium leading-relaxed">
                        {displayText}
                    </p>
                </div>

                <div className="flex justify-between items-center mt-1">
                    <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${rarityBadge[species.rarity]}`}>
                        {species.rarity}
                    </div>
                    <div className="flex gap-1">
                        {[1,2,3].map(i => <div key={i} className="w-2 h-2 rounded-full bg-slate-200" />)}
                    </div>
                </div>
            </div>
        </div>
    );
};

const TutorialOverlay: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
    // Keep logic, update styling
    const steps = [
        { id: 'WELCOME', text: "Hi there! I'm your Guide. Let's learn how to swim!", highlight: null },
        { id: 'MOVEMENT', text: "Use W, A, S, D or Arrow Keys to move. Or just look around!", highlight: 'CENTER' },
        { id: 'OXYGEN', text: "Watch your bubbles here! If they run low, swim up or use a gesture.", highlight: 'OXYGEN' },
        { id: 'MAP', text: "This cute radar shows you nearby treasures and ruins.", highlight: 'MAP' },
        { id: 'SCANNER', text: "Swim close to fishies to collect their info cards!", highlight: 'SCANNER' },
    ];
    
    // ... State logic same as before ... 
    const [currentStep, setCurrentStep] = useState(0);
    const step = steps[currentStep];

    useEffect(() => {
        const speak = () => {
             if (!window.speechSynthesis) return;
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(step.text);
            utterance.pitch = 1.2; utterance.rate = 1.0;
            const voices = window.speechSynthesis.getVoices();
            const femaleVoice = voices.find(v => v.name.includes('Google US English') || v.name.includes('Samantha'));
            if (femaleVoice) utterance.voice = femaleVoice;
            utterance.onend = () => { setTimeout(() => { if (currentStep < steps.length - 1) setCurrentStep(c => c + 1); else onComplete(); }, 1500); };
            window.speechSynthesis.speak(utterance);
        };
        if (window.speechSynthesis.getVoices().length !== 0) speak();
        else { const h = () => speak(); window.speechSynthesis.addEventListener('voiceschanged', h, { once: true }); return () => window.speechSynthesis.removeEventListener('voiceschanged', h); }
        return () => window.speechSynthesis.cancel();
    }, [currentStep, onComplete]);

    const getHighlightStyle = (target: string | null) => {
        const base = "absolute border-[6px] border-white shadow-[0_0_0_9999px_rgba(0,0,0,0.5)] rounded-3xl transition-all duration-700 ease-in-out z-50 pointer-events-none";
        switch(target) {
            case 'OXYGEN': return { className: base, style: { bottom: '160px', left: '16px', width: '100px', height: '220px' } };
            case 'MAP': return { className: base, style: { bottom: '16px', right: '16px', width: '180px', height: '180px', borderRadius: '50%' } };
            case 'SCANNER': return { className: base, style: { top: '96px', right: '16px', width: '340px', height: '280px' } };
            case 'CENTER': return { className: base, style: { top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '300px', height: '300px', borderRadius: '50%' } };
            default: return { className: base, style: { opacity: 0 } };
        }
    };
    const highlight = getHighlightStyle(step.highlight);

    return (
        <div className="absolute inset-0 z-[60] pointer-events-none">
            <div className={highlight.className} />
            <div className="absolute bottom-32 left-1/2 -translate-x-1/2 w-full max-w-lg text-center px-4">
                 <div className="bg-white p-8 rounded-[3rem] shadow-2xl transform transition-all duration-500 border-b-8 border-slate-100 relative">
                     <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-cyan-400 p-3 rounded-full border-4 border-white shadow-lg">
                        <Waves className="text-white" size={24} />
                     </div>
                     <p className="text-2xl font-bold text-slate-700 leading-snug font-sans">
                         "{step.text}"
                     </p>
                     <div className="mt-6 flex justify-center gap-2">
                         {steps.map((s, i) => (
                             <div key={s.id} className={`h-2 rounded-full transition-all duration-300 ${i === currentStep ? 'w-8 bg-cyan-400' : 'w-2 bg-slate-200'}`} />
                         ))}
                     </div>
                 </div>
                 <button onClick={() => { if (currentStep < steps.length - 1) setCurrentStep(c => c + 1); else onComplete(); }} className="mt-4 pointer-events-auto text-white/80 hover:text-white font-bold uppercase tracking-wider text-sm flex items-center justify-center gap-2">
                     Skip <ArrowRight size={16} />
                 </button>
            </div>
        </div>
    );
};

interface InterfaceProps {
  onSettingsChange: (settings: Partial<GameSettings>) => void;
  currentSettings: GameSettings;
  gameState: GameState;
  onStart: () => void;
  onTakePhoto: (webcamImage?: string) => void;
  onAcceptLicense: () => void;
  onTutorialComplete: () => void;
  capturedImage: string | null;
  mapPOIs: MapPOI[];
  cameraRotationRef: React.MutableRefObject<number>;
  isSwimming?: boolean;
  isRecharging?: boolean;
  oxygen: number;
  isGameOver: boolean;
  onRespawn: () => void;
  scannedSpecies: FishSpecies | null;
}

export const Interface: React.FC<InterfaceProps> = ({ 
    onSettingsChange, 
    currentSettings, 
    gameState, 
    onStart,
    onTakePhoto,
    onAcceptLicense,
    onTutorialComplete,
    capturedImage,
    mapPOIs,
    cameraRotationRef,
    isSwimming,
    isRecharging,
    oxygen,
    isGameOver,
    onRespawn,
    scannedSpecies
}) => {
  const [isFlashing, setIsFlashing] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const startCamera = async () => {
    setHasCameraPermission(null);
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 640 } } 
        });
        if (videoRef.current) {
            videoRef.current.srcObject = stream;
            await videoRef.current.play();
        }
        setHasCameraPermission(true);
        return stream;
    } catch (err) {
        setHasCameraPermission(false);
        return null;
    }
  };

  useEffect(() => {
    let activeStream: MediaStream | null = null;
    let isMounted = true;
    if (gameState === GameState.PHOTO_MODE && !capturedImage) {
        startCamera().then(stream => { if (isMounted) activeStream = stream; else stream?.getTracks().forEach(track => track.stop()); });
    }
    return () => { isMounted = false; if (activeStream) activeStream.getTracks().forEach(track => track.stop()); };
  }, [gameState, capturedImage]);

  useEffect(() => {
    if (countdown === null) return;
    if (countdown > 0) {
        const timer = setTimeout(() => setCountdown(c => c! - 1), 1000);
        return () => clearTimeout(timer);
    } else {
        performCapture();
        setCountdown(null);
    }
  }, [countdown]);

  const toggleTime = () => {
    onSettingsChange({ 
        timeOfDay: currentSettings.timeOfDay === TimeOfDay.DAY ? TimeOfDay.NIGHT : TimeOfDay.DAY 
    });
  };

  const startPhotoSequence = () => setCountdown(3);

  const performCapture = () => {
      setIsFlashing(true);
      setTimeout(() => setIsFlashing(false), 200);
      if (hasCameraPermission && videoRef.current) {
          const video = videoRef.current;
          const canvas = canvasRef.current;
          if (canvas && video.readyState === 4) {
              const ctx = canvas.getContext('2d');
              if (ctx) {
                const size = 256; canvas.width = size; canvas.height = size;
                const minDim = Math.min(video.videoWidth, video.videoHeight);
                const sx = (video.videoWidth - minDim) / 2; const sy = (video.videoHeight - minDim) / 2;
                ctx.translate(size, 0); ctx.scale(-1, 1);
                ctx.drawImage(video, sx, sy, minDim, minDim, 0, 0, size, size);
                const dataUrl = canvas.toDataURL('image/png');
                onTakePhoto(dataUrl);
                return;
              }
          }
      }
      onTakePhoto(undefined);
  };

  // --- GAME OVER ---
  if (isGameOver) {
      return (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-red-100/80 backdrop-blur-md animate-in fade-in duration-500">
             <div className="text-center space-y-6 bg-white p-10 rounded-[3rem] shadow-2xl border-8 border-red-200">
                 <div className="flex justify-center mb-4">
                     <Skull size={80} className="text-red-400 animate-bounce" />
                 </div>
                 <h1 className="text-5xl font-black text-red-500 tracking-tight uppercase">
                     Oh no!
                 </h1>
                 <p className="text-red-400 font-bold text-xl">Out of air bubbles!</p>
                 <button onClick={onRespawn} className="mt-8 px-8 py-4 bg-red-500 hover:bg-red-400 text-white font-black rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all text-lg">
                     TRY AGAIN
                 </button>
             </div>
        </div>
      );
  }

  // --- INTRO SCREEN ---
  if (gameState === GameState.INTRO) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-cyan-900/30 backdrop-blur-sm z-50">
        <div className="text-center animate-fade-in-up">
          <div className="mb-8 relative inline-block">
               <h1 className="text-8xl font-black text-white drop-shadow-[0_8px_0_rgba(8,145,178,1)] tracking-tight transform rotate-[-2deg]" style={{ WebkitTextStroke: '3px #22d3ee' }}>
                DIVE IN
              </h1>
              <h1 className="text-8xl font-black text-cyan-300 drop-shadow-[0_8px_0_rgba(21,94,117,1)] tracking-tight absolute top-20 left-12 transform rotate-[2deg]" style={{ WebkitTextStroke: '3px white' }}>
                OCEAN
              </h1>
          </div>
          <div className="h-32"></div>
          
          <button onClick={onStart} className="group relative inline-flex items-center justify-center px-12 py-5 overflow-hidden font-black text-white transition-all duration-300 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full hover:scale-110 hover:shadow-[0_0_40px_rgba(34,211,238,0.6)] focus:outline-none border-4 border-white shadow-xl">
            <span className="relative flex items-center gap-3 text-2xl"><Play size={28} fill="currentColor" /> START DIVE</span>
          </button>
        </div>
      </div>
    );
  }

  // --- PHOTO MODE ---
  if (gameState === GameState.PHOTO_MODE) {
      return (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-indigo-900/40 backdrop-blur-md">
            {isFlashing && <div className="absolute inset-0 bg-white z-[100] animate-fadeOut pointer-events-none" />}
            <canvas ref={canvasRef} className="hidden" />

            {!capturedImage && (
                <div className="relative w-full max-w-sm bg-white p-4 rounded-[2.5rem] shadow-2xl animate-in fade-in zoom-in duration-300 flex flex-col gap-4 border-b-8 border-slate-100">
                    <div className="flex items-center justify-between px-2">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                            <span className="text-slate-400 font-bold text-xs uppercase tracking-wider">Selfie Mode</span>
                        </div>
                    </div>
                    
                    <div className="relative aspect-square bg-slate-100 rounded-[2rem] overflow-hidden group border-4 border-slate-200">
                        <video ref={videoRef} autoPlay playsInline muted className={`w-full h-full object-cover transform -scale-x-100 rounded-[1.5rem] transition-opacity duration-500 ${hasCameraPermission ? 'opacity-100' : 'opacity-0'}`} />
                        
                        {hasCameraPermission === null && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 gap-2">
                                <RefreshCw size={32} className="animate-spin text-cyan-400" />
                            </div>
                        )}
                        {hasCameraPermission === false && (
                             <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 p-8 text-center gap-4">
                                <Camera size={40} className="text-red-300" />
                                <span className="font-bold text-slate-600">Camera blocked</span>
                                <button onClick={() => startCamera()} className="px-4 py-2 bg-slate-200 hover:bg-slate-300 rounded-full text-slate-600 text-xs font-bold">Try Again</button>
                            </div>
                        )}
                        {hasCameraPermission === true && (
                            <div className="absolute inset-0 pointer-events-none">
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-60 border-2 border-white/50 rounded-[40%] shadow-lg opacity-80" />
                            </div>
                        )}
                         {countdown !== null && (
                            <div className="absolute inset-0 flex items-center justify-center bg-white/30 backdrop-blur-[2px] z-30">
                                <div className="text-9xl font-black text-white animate-bounce drop-shadow-lg">{countdown}</div>
                            </div>
                        )}
                    </div>
                    
                    <div className="flex justify-center pb-2">
                        <button onClick={startPhotoSequence} disabled={countdown !== null || hasCameraPermission === false} className={`w-20 h-20 rounded-full border-[6px] border-slate-100 bg-gradient-to-br from-pink-400 to-rose-500 hover:scale-105 active:scale-95 transition-all shadow-xl flex items-center justify-center ${countdown !== null ? 'opacity-50' : ''}`}>
                            <Camera size={32} className="text-white" fill="white" />
                        </button>
                    </div>
                </div>
            )}

            {capturedImage && (
                <div className="relative bg-white p-6 rounded-[2rem] max-w-sm w-full shadow-2xl transform rotate-1 scale-100 animate-in fade-in zoom-in duration-300 pointer-events-auto border-b-8 border-slate-200">
                    <div className="flex justify-center mb-4">
                         <div className="text-center">
                            <h2 className="text-2xl font-black text-slate-800 tracking-tight">DIVER LICENSE</h2>
                            <p className="text-xs font-bold text-slate-400 tracking-widest uppercase">Official Certification</p>
                         </div>
                    </div>
                    
                    <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100 flex gap-4 items-center">
                        <div className="w-24 h-24 bg-slate-200 rounded-2xl overflow-hidden shadow-inner border-4 border-white rotate-[-3deg]">
                            <img src={capturedImage} alt="Diver" className="w-full h-full object-cover" />
                        </div>
                        <div className="space-y-1">
                            <div className="bg-cyan-100 text-cyan-700 px-2 py-0.5 rounded-full text-[10px] font-bold inline-block">Novice Explorer</div>
                            <div className="text-slate-800 font-black text-lg">PLAYER #1</div>
                            <div className="flex gap-1">
                                {[1,2,3,4,5].map(i => <Star key={i} size={12} className="text-yellow-400 fill-yellow-400" />)}
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-3 mt-6">
                        <button onClick={() => onTakePhoto(undefined)} className="flex-1 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold transition-colors flex items-center justify-center gap-2"><RefreshCw size={16} /> Retake</button>
                        <button onClick={onAcceptLicense} className="flex-[2] py-3 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 hover:scale-105 text-white font-bold transition-all shadow-lg flex items-center justify-center gap-2"><Check size={18} strokeWidth={3} /> Looks Good!</button>
                    </div>
                </div>
            )}
        </div>
      );
  }

  // --- MAIN HUD ---
  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between">
      {gameState === GameState.TUTORIAL && <TutorialOverlay onComplete={onTutorialComplete} />}

      <div className="w-full p-4 flex justify-between items-start pointer-events-auto z-10">
         <div className="bg-white/20 backdrop-blur-lg p-2 pr-6 pl-2 rounded-full border border-white/30 text-white shadow-lg flex items-center gap-3">
            <div className="bg-gradient-to-br from-cyan-400 to-blue-500 w-10 h-10 rounded-full flex items-center justify-center shadow-md">
                <Heart size={20} className="text-white fill-white animate-pulse" />
            </div>
            <div>
                <h2 className="text-sm font-black text-white leading-none">Voxel Diver</h2>
                <div className="text-[10px] font-bold text-white/70 mt-0.5">Level 1 &bull; {(1 / currentSettings.fogDensity).toFixed(0)}m Vis</div>
            </div>
         </div>
         
         <div className="flex gap-2">
            <button onClick={toggleTime} className="bg-white/20 hover:bg-white/40 backdrop-blur-lg w-12 h-12 rounded-full border border-white/30 text-white transition-all shadow-lg flex items-center justify-center hover:scale-110">
                {currentSettings.timeOfDay === TimeOfDay.DAY ? <Sun size={24} className="text-yellow-300 fill-yellow-300"/> : <Moon size={24} className="text-blue-200 fill-blue-200"/>}
            </button>
         </div>
      </div>

      {isSwimming && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 pointer-events-none">
            <div className="bg-cyan-500/80 backdrop-blur-sm text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest shadow-lg animate-bounce flex items-center gap-2">
                <Waves size={12} /> Swimming
            </div>
        </div>
      )}

      {isRecharging && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 pointer-events-none">
            <div className="bg-green-500/80 backdrop-blur-sm text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest shadow-lg animate-pulse flex items-center gap-2">
                <BatteryCharging size={12} /> Recharging
            </div>
        </div>
      )}

      <div className="absolute bottom-40 left-4 pointer-events-auto z-10">
          <OxygenMeter level={oxygen} isRecharging={isRecharging} />
      </div>

      <div className="absolute bottom-4 right-4 pointer-events-auto z-10">
          <MiniMap pois={mapPOIs} cameraRotationRef={cameraRotationRef} />
      </div>

      {/* BIO SCANNER */}
      {(scannedSpecies || (gameState === GameState.TUTORIAL)) && (
          <div className={`${gameState === GameState.TUTORIAL ? 'opacity-50 pointer-events-none' : ''}`}>
             {scannedSpecies ? <BioScanner species={scannedSpecies} /> : (gameState === GameState.TUTORIAL ? 
                 <div className="absolute top-24 right-4 w-72 h-32 bg-white/10 backdrop-blur border-2 border-dashed border-white/50 rounded-3xl flex items-center justify-center text-white font-bold text-xs">SCANNER READY</div> 
             : null)}
          </div>
      )}
    </div>
  );
};