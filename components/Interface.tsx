import React, { useState, useRef, useEffect } from 'react';
import { Eye, Sun, Moon, Play, Camera, Check, RefreshCw, X, Map as MapIcon, Compass, Waves, Droplets, AlertTriangle, Skull, BatteryCharging, Scan, Dna, ArrowRight } from 'lucide-react';
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

            const grad = ctx.createRadialGradient(center, center, 0, center, center, center);
            grad.addColorStop(0, "rgba(6, 182, 212, 0.1)");
            grad.addColorStop(1, "rgba(6, 182, 212, 0.4)");
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(center, center, center, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = "rgba(34, 211, 238, 0.3)";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(center, center, center * 0.33, 0, Math.PI * 2);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(center, center, center * 0.66, 0, Math.PI * 2);
            ctx.stroke();
            
            ctx.beginPath();
            ctx.moveTo(center, 0); ctx.lineTo(center, size);
            ctx.moveTo(0, center); ctx.lineTo(size, center);
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
                    ctx.fillStyle = '#ffffff';
                    ctx.fillRect(mapX - 2, mapY - 2, 4, 4);
                } else if (poi.type === 'lamp') {
                    ctx.fillStyle = '#facc15'; 
                    ctx.arc(mapX, mapY, 2, 0, Math.PI * 2);
                    ctx.fill();
                } else if (poi.type === 'coral') {
                    ctx.fillStyle = poi.color || '#ff7f50';
                    ctx.arc(mapX, mapY, 2, 0, Math.PI * 2);
                    ctx.fill();
                }
            });

            ctx.restore();

            ctx.fillStyle = '#22d3ee'; 
            ctx.beginPath();
            ctx.moveTo(center, center - 6);
            ctx.lineTo(center - 4, center + 4);
            ctx.lineTo(center + 4, center + 4);
            ctx.closePath();
            ctx.fill();
            
            const time = Date.now() / 2000;
            const sweepAngle = (time % 1) * Math.PI * 2;
            
            ctx.save();
            ctx.translate(center, center);
            ctx.rotate(sweepAngle);
            const sweepGrad = ctx.createConicGradient(0, 0, 0);
            sweepGrad.addColorStop(0, 'rgba(34, 211, 238, 0)');
            sweepGrad.addColorStop(0.8, 'rgba(34, 211, 238, 0)');
            sweepGrad.addColorStop(1, 'rgba(34, 211, 238, 0.4)');
            ctx.fillStyle = sweepGrad;
            ctx.beginPath();
            ctx.arc(0, 0, center, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();

            animationId = requestAnimationFrame(render);
        };

        render();
        return () => cancelAnimationFrame(animationId);
    }, [pois, cameraRotationRef]);

    return (
        <div className="bg-black/60 backdrop-blur-md rounded-full border-2 border-cyan-500/30 shadow-[0_0_20px_rgba(34,211,238,0.2)] overflow-hidden w-48 h-48 relative">
             <canvas ref={canvasRef} width={200} height={200} className="w-full h-full" />
             <div className="absolute top-2 left-1/2 -translate-x-1/2 text-[8px] font-mono text-cyan-500 bg-black/50 px-1 rounded">N</div>
        </div>
    );
};

const OxygenMeter: React.FC<{ level: number, isRecharging?: boolean }> = ({ level, isRecharging }) => {
    const isLow = level < 25;
    const isCritical = level < 15;
    const segments = 20; // 5% per segment
    const activeSegments = Math.ceil(level / (100 / segments));

    return (
        <div className="flex items-end gap-3 pointer-events-auto">
             <div className="flex flex-col items-center gap-1">
                <div className={`p-2 rounded-lg border bg-black/40 backdrop-blur-md transition-colors duration-300
                    ${isRecharging ? 'border-green-500 text-green-400 shadow-[0_0_15px_rgba(74,222,128,0.4)]' : (isLow ? 'border-red-500 text-red-400 shadow-[0_0_15px_rgba(248,113,113,0.4)]' : 'border-cyan-500 text-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.4)]')}
                `}>
                    {isRecharging ? <BatteryCharging size={20} className="animate-pulse" /> : (isLow ? <AlertTriangle size={20} className={isCritical ? "animate-bounce" : ""} /> : <Droplets size={20} />)}
                </div>
                <span className={`text-[10px] font-mono font-bold tracking-wider ${isRecharging ? 'text-green-400' : 'text-cyan-100'}`}>
                    {isRecharging ? 'CHRG' : 'O₂'}
                </span>
            </div>

            <div className={`relative h-44 w-14 bg-slate-900/90 border-2 rounded-xl p-1.5 flex flex-col-reverse justify-start gap-[2px] shadow-2xl transition-all duration-500
                 ${isCritical ? 'border-red-500/60 shadow-red-900/50' : 'border-cyan-900/60 shadow-cyan-900/20'}
                 ${isRecharging ? 'border-green-500/60 shadow-green-900/50' : ''}
            `}>
                {/* Segments */}
                {[...Array(segments)].map((_, i) => {
                    const isActive = i < activeSegments;
                    
                    // Logic for segment color
                    let bgClass = "bg-slate-800/40"; // Inactive
                    
                    if (isActive) {
                        if (isRecharging) bgClass = "bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.8)]";
                        else if (isCritical) bgClass = "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-pulse";
                        else if (isLow) bgClass = "bg-orange-500 shadow-[0_0_5px_rgba(249,115,22,0.6)]";
                        else bgClass = "bg-cyan-400 shadow-[0_0_5px_rgba(34,211,238,0.6)]";
                    }

                    return (
                        <div 
                            key={i} 
                            className={`w-full h-[6px] rounded-[1px] transition-all duration-300 ${bgClass}`}
                            style={{ opacity: isActive ? 1 : 0.3 }}
                        />
                    );
                })}
                
                {/* Warning Overlay for Critical */}
                {isCritical && !isRecharging && (
                    <div className="absolute inset-0 bg-red-500/10 animate-pulse pointer-events-none rounded-lg z-10" />
                )}
            </div>
            
             <div className="flex flex-col justify-between h-40 pb-2 text-[10px] font-mono text-cyan-500/40 font-bold select-none">
                 <span>100</span>
                 <span>50</span>
                 <span className={isCritical ? "text-red-500/80" : ""}>0</span>
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
        }, 30);
        return () => clearInterval(timer);
    }, [species]);

    // Speech Narrator Effect
    useEffect(() => {
        if (!species) return;

        const speak = () => {
            if (!window.speechSynthesis) return;
            
            // Cancel any current speech
            window.speechSynthesis.cancel();
            
            // Construct narration text
            const text = `Species identified. ${species.name}. ${species.description}`;
            
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.pitch = 1.15; // Higher pitch for younger/AI assistant tone
            utterance.rate = 1.0;
            utterance.volume = 0.9;
            
            const voices = window.speechSynthesis.getVoices();
            const femaleVoice = voices.find(v => 
                v.name.includes('Google US English') || 
                v.name.includes('Samantha') || 
                v.name.includes('Zira') ||
                v.name.toLowerCase().includes('female')
            );
            
            if (femaleVoice) {
                utterance.voice = femaleVoice;
            }
            
            window.speechSynthesis.speak(utterance);
        };

        if (window.speechSynthesis.getVoices().length !== 0) {
            speak();
        } else {
            const handler = () => speak();
            window.speechSynthesis.addEventListener('voiceschanged', handler, { once: true });
            return () => window.speechSynthesis.removeEventListener('voiceschanged', handler);
        }

        // Cleanup: Stop speaking if scanning stops/switches
        return () => {
            window.speechSynthesis.cancel();
        };
    }, [species]);

    if (!species) return null;

    const rarityColor = {
        'COMMON': 'text-gray-400',
        'UNCOMMON': 'text-green-400',
        'RARE': 'text-purple-400',
        'LEGENDARY': 'text-orange-400 animate-pulse'
    };

    return (
        <div className="absolute top-24 right-4 w-72 bg-slate-900/90 border border-cyan-500/50 rounded-xl overflow-hidden shadow-[0_0_30px_rgba(34,211,238,0.2)] animate-in slide-in-from-right duration-500 pointer-events-auto">
            <div className="bg-cyan-950/50 p-3 border-b border-cyan-500/30 flex items-center gap-2">
                <Scan size={16} className="text-cyan-400 animate-spin-slow" />
                <span className="text-xs font-mono font-bold text-cyan-400 tracking-widest">BIO-SCANNER ACTIVE</span>
            </div>
            
            <div className="p-4 flex flex-col gap-3">
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="text-white font-bold font-mono text-lg uppercase leading-none mb-1">{species.name}</h3>
                        <div className="text-cyan-500/60 text-[10px] italic font-serif">{species.scientificName}</div>
                    </div>
                    <div className="bg-black/50 p-1 rounded border border-white/10">
                        <Dna size={20} className="text-cyan-400" />
                    </div>
                </div>

                <div className="h-[1px] bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />

                <div className="min-h-[80px]">
                    <p className="text-cyan-100 text-xs font-mono leading-relaxed opacity-90">
                        {displayText}
                        <span className="inline-block w-1.5 h-3 bg-cyan-500 ml-1 animate-pulse"/>
                    </p>
                </div>

                <div className="flex justify-between items-center mt-2 bg-black/30 p-2 rounded">
                    <span className="text-[9px] text-gray-500 uppercase tracking-widest">Rarity Class</span>
                    <span className={`text-[10px] font-bold font-mono ${rarityColor[species.rarity]}`}>
                        {species.rarity}
                    </span>
                </div>
            </div>
            
            <div className="h-1 bg-gradient-to-r from-cyan-600 to-purple-600" />
        </div>
    );
};

const TutorialOverlay: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
    const steps = [
        { id: 'WELCOME', text: "Welcome to Voxel Ocean. I am your AI Guide.", highlight: null },
        { id: 'MOVEMENT', text: "Use W, A, S, D keys to swim. Or look around with your mouse.", highlight: 'CENTER' },
        { id: 'OXYGEN', text: "Monitor your oxygen meter here. Return to the surface or use gestures to refill.", highlight: 'OXYGEN' },
        { id: 'MAP', text: "Use the sonar map to navigate ruins and find rare creatures.", highlight: 'MAP' },
        { id: 'SCANNER', text: "Swim close to fish to activate the bio-scanner and log species.", highlight: 'SCANNER' },
    ];

    const [currentStep, setCurrentStep] = useState(0);
    const step = steps[currentStep];

    useEffect(() => {
        const speak = () => {
            if (!window.speechSynthesis) return;
            window.speechSynthesis.cancel();
            
            const utterance = new SpeechSynthesisUtterance(step.text);
            utterance.pitch = 1.15;
            utterance.rate = 1.0;
            
            const voices = window.speechSynthesis.getVoices();
            const femaleVoice = voices.find(v => 
                v.name.includes('Google US English') || 
                v.name.includes('Samantha') || 
                v.name.includes('Zira') ||
                v.name.toLowerCase().includes('female')
            );
            if (femaleVoice) utterance.voice = femaleVoice;
            
            utterance.onend = () => {
                setTimeout(() => {
                    if (currentStep < steps.length - 1) {
                        setCurrentStep(c => c + 1);
                    } else {
                        onComplete();
                    }
                }, 1000); // Wait 1s before next step
            };

            window.speechSynthesis.speak(utterance);
        };

        if (window.speechSynthesis.getVoices().length !== 0) {
            speak();
        } else {
            const handler = () => speak();
            window.speechSynthesis.addEventListener('voiceschanged', handler, { once: true });
            return () => window.speechSynthesis.removeEventListener('voiceschanged', handler);
        }

        return () => window.speechSynthesis.cancel();
    }, [currentStep, onComplete]);

    const getHighlightStyle = (target: string | null) => {
        const base = "absolute border-4 border-cyan-400 shadow-[0_0_50px_rgba(34,211,238,0.8)] rounded-xl transition-all duration-700 ease-in-out z-50 pointer-events-none";
        
        // Match positions from Interface HUD layout
        switch(target) {
            case 'OXYGEN':
                // bottom-40 left-4, roughly w-24 h-48
                return { className: base, style: { bottom: '160px', left: '16px', width: '100px', height: '200px' } };
            case 'MAP':
                // bottom-4 right-4, w-48 h-48
                return { className: base, style: { bottom: '16px', right: '16px', width: '200px', height: '200px', borderRadius: '50%' } };
            case 'SCANNER':
                // top-24 right-4, w-72 h-64 (approx)
                return { className: base, style: { top: '96px', right: '16px', width: '300px', height: '250px' } };
            case 'CENTER':
                return { className: base, style: { top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '300px', height: '300px', borderRadius: '50%' } };
            default:
                return { className: base, style: { opacity: 0 } }; // Hidden
        }
    };

    const highlight = getHighlightStyle(step.highlight);

    return (
        <div className="absolute inset-0 z-[60] pointer-events-none">
            {/* Darken Background */}
            <div className="absolute inset-0 bg-black/50 transition-colors duration-1000" />
            
            {/* Spotlight Box */}
            <div className={highlight.className} style={highlight.style}>
                 <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-cyan-500 text-black text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                     Focus
                 </div>
            </div>

            {/* Subtitle / Narration Box */}
            <div className="absolute bottom-24 left-1/2 -translate-x-1/2 w-full max-w-2xl text-center">
                 <div className="bg-black/80 backdrop-blur-md border border-cyan-500/50 p-6 rounded-2xl shadow-2xl transform transition-all duration-500">
                     <div className="flex items-center justify-center gap-2 mb-2">
                         <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
                         <span className="text-cyan-400 font-mono text-xs tracking-[0.2em] uppercase">System Guide</span>
                     </div>
                     <p className="text-xl md:text-2xl font-light text-white leading-relaxed">
                         "{step.text}"
                     </p>
                     
                     <div className="mt-4 flex justify-center gap-1">
                         {steps.map((s, i) => (
                             <div key={s.id} className={`h-1 rounded-full transition-all duration-300 ${i === currentStep ? 'w-8 bg-cyan-400' : 'w-2 bg-gray-600'}`} />
                         ))}
                     </div>
                 </div>
                 
                 <div className="mt-4">
                     <button onClick={() => { 
                         if (currentStep < steps.length - 1) setCurrentStep(c => c + 1);
                         else onComplete();
                     }} className="pointer-events-auto text-cyan-500/50 hover:text-cyan-400 text-xs font-mono uppercase flex items-center justify-center gap-2 transition-colors">
                         Skip / Next <ArrowRight size={12} />
                     </button>
                 </div>
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
        console.error("Camera denied or missing", err);
        setHasCameraPermission(false);
        return null;
    }
  };

  useEffect(() => {
    let activeStream: MediaStream | null = null;
    let isMounted = true;

    if (gameState === GameState.PHOTO_MODE && !capturedImage) {
        startCamera().then(stream => {
            if (isMounted) {
                activeStream = stream;
            } else {
                stream?.getTracks().forEach(track => track.stop());
            }
        });
    }

    return () => {
        isMounted = false;
        if (activeStream) {
            activeStream.getTracks().forEach(track => track.stop());
        }
    };
  }, [gameState, capturedImage]);

  // Voice Narration Effect for Intro
  useEffect(() => {
    if (gameState === GameState.PHOTO_MODE && !capturedImage) {
        const speak = () => {
            if (!window.speechSynthesis) return;
            window.speechSynthesis.cancel();
            
            const utterance = new SpeechSynthesisUtterance("Get ready to take the picture for your dive license.");
            utterance.pitch = 1.15; // Higher pitch for younger/female tone
            utterance.rate = 1.0;
            
            const voices = window.speechSynthesis.getVoices();
            // Heuristic to find a female-sounding voice
            const femaleVoice = voices.find(v => 
                v.name.includes('Google US English') || 
                v.name.includes('Samantha') || 
                v.name.includes('Zira') ||
                v.name.toLowerCase().includes('female')
            );
            
            if (femaleVoice) {
                utterance.voice = femaleVoice;
            }
            
            window.speechSynthesis.speak(utterance);
        };

        // Voices might load asynchronously
        if (window.speechSynthesis.getVoices().length !== 0) {
            speak();
        } else {
            window.speechSynthesis.addEventListener('voiceschanged', () => speak(), { once: true });
        }
    }
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

  const startPhotoSequence = () => {
      setCountdown(3);
  };

  const performCapture = () => {
      setIsFlashing(true);
      setTimeout(() => setIsFlashing(false), 200);

      if (hasCameraPermission && videoRef.current) {
          const video = videoRef.current;
          const canvas = canvasRef.current;
          if (canvas && video.readyState === 4) {
              const ctx = canvas.getContext('2d');
              if (ctx) {
                const size = 256;
                canvas.width = size;
                canvas.height = size;
                const minDim = Math.min(video.videoWidth, video.videoHeight);
                const sx = (video.videoWidth - minDim) / 2;
                const sy = (video.videoHeight - minDim) / 2;
                ctx.translate(size, 0);
                ctx.scale(-1, 1);
                ctx.drawImage(video, sx, sy, minDim, minDim, 0, 0, size, size);
                const dataUrl = canvas.toDataURL('image/png');
                onTakePhoto(dataUrl);
                return;
              }
          }
      }
      onTakePhoto(undefined);
  };

  if (isGameOver) {
      return (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-red-950/80 backdrop-blur-sm animate-in fade-in duration-500">
             <div className="text-center space-y-6">
                 <div className="flex justify-center mb-4">
                     <Skull size={80} className="text-red-500 animate-pulse" />
                 </div>
                 <h1 className="text-6xl font-black text-red-500 tracking-[0.2em] uppercase drop-shadow-[0_0_20px_rgba(239,68,68,0.8)]">
                     Critical Failure
                 </h1>
                 <p className="text-red-200 font-mono text-xl">OXYGEN DEPLETED // LIFE SUPPORT OFFLINE</p>
                 <button onClick={onRespawn} className="mt-8 px-8 py-3 bg-red-600 hover:bg-red-500 text-white font-bold font-mono rounded shadow-[0_0_20px_rgba(220,38,38,0.5)] transition-all transform hover:scale-105">
                     INITIALIZE RESPAWN SEQUENCE
                 </button>
             </div>
        </div>
      );
  }

  if (gameState === GameState.INTRO) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm z-50">
        <div className="text-center animate-fade-in-up">
          <h1 className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-b from-cyan-300 to-blue-600 drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)] tracking-widest uppercase mb-4" style={{ fontFamily: 'monospace' }}>
            DIVE IN OCEAN
          </h1>
          <p className="text-cyan-100/80 text-xl font-mono mb-8 tracking-widest uppercase">Start your voxel adventure</p>
          <button onClick={onStart} className="group relative inline-flex items-center justify-center px-8 py-3 overflow-hidden font-bold text-white transition-all duration-300 bg-cyan-600 rounded-lg hover:bg-cyan-500 hover:scale-105 hover:shadow-[0_0_20px_rgba(34,211,238,0.5)] focus:outline-none">
            <span className="relative flex items-center gap-2"><Play size={20} fill="currentColor" /> START DIVE</span>
          </button>
        </div>
      </div>
    );
  }

  if (gameState === GameState.PHOTO_MODE) {
      return (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <style>{`@keyframes scan { 0% { top: 0%; opacity: 0; } 10% { opacity: 1; } 90% { opacity: 1; } 100% { top: 100%; opacity: 0; } } .animate-scan { animation: scan 3s ease-in-out infinite; }`}</style>
            {isFlashing && <div className="absolute inset-0 bg-white z-[100] animate-fadeOut pointer-events-none" />}
            <canvas ref={canvasRef} className="hidden" />

            {!capturedImage && (
                <div className="relative w-full max-w-sm bg-slate-900 border-2 border-cyan-500/50 rounded-2xl shadow-[0_0_50px_rgba(34,211,238,0.2)] overflow-hidden animate-in fade-in zoom-in duration-300 flex flex-col">
                    <div className="flex items-center justify-between px-4 py-3 bg-slate-800 border-b border-cyan-500/30">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
                            <span className="text-cyan-400 font-mono text-xs font-bold tracking-widest">BIO-SCANNER // ACTIVE</span>
                        </div>
                        <div className="text-[10px] font-mono text-slate-400">INPUT: CAM_USER</div>
                    </div>
                    <div className="relative aspect-square bg-black overflow-hidden group">
                        <video ref={videoRef} autoPlay playsInline muted className={`w-full h-full object-cover transform -scale-x-100 transition-opacity duration-500 ${hasCameraPermission ? 'opacity-90' : 'opacity-0'}`} style={{ imageRendering: 'pixelated', filter: 'contrast(1.1) brightness(1.2) sepia(0.2) hue-rotate(180deg) saturate(0.8)' }} />
                        {hasCameraPermission === null && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950 text-cyan-500 font-mono text-xs gap-2 z-10">
                                <RefreshCw size={24} className="animate-spin" />
                                <span className="animate-pulse">INITIALIZING SENSORS...</span>
                            </div>
                        )}
                        {hasCameraPermission === false && (
                             <div className="absolute inset-0 flex flex-col items-center justify-center text-red-400 font-mono text-xs p-8 text-center bg-slate-950 z-20">
                                <Camera size={32} className="mb-2 opacity-50" />
                                <span className="mb-1 font-bold">OPTIC SENSORS OFFLINE</span>
                                <span className="text-[10px] opacity-50 mb-4">Permission required for license photo</span>
                                <button onClick={() => startCamera()} className="px-4 py-2 bg-red-900/30 hover:bg-red-900/50 border border-red-500/30 hover:border-red-500/60 rounded-md text-red-200 text-xs transition-all uppercase tracking-wider flex items-center gap-2"><RefreshCw size={12} /> Activate Sensors</button>
                            </div>
                        )}
                        {hasCameraPermission !== false && (
                            <div className="absolute inset-0 pointer-events-none z-10">
                                <div className="absolute inset-0 bg-[linear-gradient(rgba(34,211,238,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(34,211,238,0.1)_1px,transparent_1px)] bg-[size:20px_20px] opacity-30" />
                                <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.2)_50%,transparent_50%)] bg-[size:100%_4px] opacity-20" />
                                <div className="absolute inset-x-0 h-1 bg-cyan-400/50 shadow-[0_0_15px_rgba(34,211,238,0.8)] animate-scan" />
                                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_50%,rgba(0,0,0,0.6)_100%)]" />
                            </div>
                        )}
                        {hasCameraPermission === true && (
                            <div className="absolute inset-0 pointer-events-none opacity-80 z-20">
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-60 border border-cyan-400/30 rounded-[50%] box-border shadow-[0_0_20px_rgba(34,211,238,0.1)]">
                                    <div className="absolute -top-1 left-1/2 -translate-x-1/2 bg-slate-900 text-[8px] text-cyan-500 px-1 font-mono">FACE_TARGET</div>
                                </div>
                                <div className="absolute top-1/2 left-4 w-2 h-[2px] bg-cyan-400/70" />
                                <div className="absolute top-1/2 right-4 w-2 h-[2px] bg-cyan-400/70" />
                                <div className="absolute top-4 left-1/2 w-[2px] h-2 bg-cyan-400/70" />
                                <div className="absolute bottom-4 left-1/2 w-[2px] h-2 bg-cyan-400/70" />
                                <div className="absolute top-3 left-3 w-6 h-6 border-t-2 border-l-2 border-cyan-500 rounded-tl-sm" />
                                <div className="absolute top-3 right-3 w-6 h-6 border-t-2 border-r-2 border-cyan-500 rounded-tr-sm" />
                                <div className="absolute bottom-3 left-3 w-6 h-6 border-b-2 border-l-2 border-cyan-500 rounded-bl-sm" />
                                <div className="absolute bottom-3 right-3 w-6 h-6 border-b-2 border-r-2 border-cyan-500 rounded-br-sm" />
                            </div>
                        )}
                         {countdown !== null && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-[2px] z-30">
                                <div className="text-9xl font-black text-white animate-bounce drop-shadow-[0_0_20px_rgba(255,255,255,0.5)] font-mono">{countdown}</div>
                            </div>
                        )}
                    </div>
                    <div className="p-6 bg-slate-900 flex flex-col items-center gap-4 border-t border-cyan-500/30 relative z-20">
                        <div className="text-cyan-200/50 text-[10px] font-mono text-center tracking-widest uppercase">Align subject &bull; Hold steady</div>
                        <button onClick={startPhotoSequence} disabled={countdown !== null || hasCameraPermission === false} className={`w-16 h-16 rounded-full border-4 border-white/10 bg-gradient-to-br from-red-500 to-red-700 hover:from-red-400 hover:to-red-600 active:scale-95 transition-all shadow-[0_0_30px_rgba(220,38,38,0.3)] flex items-center justify-center group ${countdown !== null ? 'opacity-50 cursor-not-allowed' : ''} ${hasCameraPermission === false ? 'opacity-30 grayscale' : ''}`}>
                            <div className="w-12 h-12 rounded-full border-2 border-white/20 group-hover:bg-white/20 transition-colors" />
                        </button>
                    </div>
                </div>
            )}

            {capturedImage && (
                <div className="relative bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-cyan-500/50 rounded-xl p-6 max-w-sm w-full shadow-2xl flex flex-col gap-4 transform rotate-1 scale-100 animate-in fade-in zoom-in duration-300 pointer-events-auto">
                    <div className="flex justify-between items-center border-b border-white/10 pb-2">
                            <div className="flex items-center gap-2 text-cyan-400 font-bold font-mono">
                            <div className="w-3 h-3 bg-cyan-400 rounded-full animate-pulse" />
                            VOXEL DIVER LICENSE
                            </div>
                            <div className="text-xs text-gray-500 font-mono">CLASS A</div>
                    </div>
                    <div className="flex gap-4">
                        <div className="w-24 h-32 bg-black border border-white/20 rounded overflow-hidden relative shadow-inner group">
                            <img src={capturedImage} alt="Diver" className="w-full h-full object-cover" style={{ imageRendering: 'pixelated' }} />
                            <div className="absolute inset-0 bg-gradient-to-t from-cyan-500/20 to-transparent mix-blend-overlay" />
                            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent opacity-30 group-hover:opacity-50 transition-opacity" />
                        </div>
                        <div className="flex-1 space-y-2 font-mono text-xs text-gray-300">
                            <div><div className="text-gray-500 text-[10px] uppercase">Name</div><div className="text-white text-sm font-bold">EXPLORER-01</div></div>
                            <div><div className="text-gray-500 text-[10px] uppercase">ID</div><div className="text-white tracking-widest">{Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}</div></div>
                            <div><div className="text-gray-500 text-[10px] uppercase">Issued</div><div className="text-white">{new Date().toLocaleDateString()}</div></div>
                            <div><div className="text-gray-500 text-[10px] uppercase">Status</div><div className="text-green-400 font-bold animate-pulse">CLEARED</div></div>
                        </div>
                    </div>
                    <div className="h-8 bg-white/5 rounded flex items-center justify-center overflow-hidden opacity-50">
                            <div className="text-[10px] tracking-[0.3em] font-mono whitespace-nowrap">||| |||| | ||| || |||||</div>
                    </div>
                    <div className="flex gap-2 mt-2">
                        <button onClick={() => onTakePhoto(undefined)} className="flex-1 py-2 rounded border border-white/20 hover:bg-white/5 text-gray-300 text-xs font-mono transition-colors flex items-center justify-center gap-1"><RefreshCw size={12} /> RETAKE</button>
                        <button onClick={onAcceptLicense} className="flex-[2] py-2 rounded bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold font-mono transition-colors shadow-lg shadow-cyan-900/50 flex items-center justify-center gap-1"><Check size={12} /> ENTER OCEAN</button>
                    </div>
                </div>
            )}
        </div>
      );
  }

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between">
      {gameState === GameState.TUTORIAL && <TutorialOverlay onComplete={onTutorialComplete} />}

      <div className="w-full p-4 flex justify-between items-start pointer-events-auto z-10">
         <div className="bg-black/40 backdrop-blur-md p-3 rounded-xl border border-white/10 text-white shadow-xl flex flex-col gap-2">
            <div>
                <h2 className="text-xl font-bold text-cyan-400">Voxel Diver</h2>
                <div className="flex gap-2 text-xs text-gray-300 mt-1">
                    <span className="flex items-center gap-1"><Eye size={12} /> {(1 / currentSettings.fogDensity).toFixed(0)}m Vis</span>
                    <span className="flex items-center gap-1">|</span>
                    <span className="flex items-center gap-1">{currentSettings.timeOfDay}</span>
                </div>
            </div>
            {isSwimming && (
                <div className="flex items-center gap-2 px-2 py-1 bg-cyan-900/50 rounded border border-cyan-500/50 animate-pulse">
                    <Waves size={14} className="text-cyan-400" />
                    <span className="text-[10px] font-mono font-bold text-cyan-300 tracking-widest">PROPULSION ACTIVE</span>
                </div>
            )}
            {isRecharging && (
                <div className="flex items-center gap-2 px-2 py-1 bg-green-900/50 rounded border border-green-500/50 animate-pulse">
                    <BatteryCharging size={14} className="text-green-400" />
                    <span className="text-[10px] font-mono font-bold text-green-300 tracking-widest">RECHARGING SYSTEM</span>
                </div>
            )}
         </div>
         <div className="flex gap-2">
            <button onClick={toggleTime} className="bg-black/40 hover:bg-white/10 backdrop-blur-md p-3 rounded-full border border-white/10 text-white transition-all shadow-lg">
                {currentSettings.timeOfDay === TimeOfDay.DAY ? <Sun size={20} className="text-yellow-300"/> : <Moon size={20} className="text-blue-300"/>}
            </button>
         </div>
      </div>

      <div className="absolute bottom-40 left-4 pointer-events-auto z-10">
          <OxygenMeter level={oxygen} isRecharging={isRecharging} />
      </div>

      <div className="absolute bottom-4 right-4 pointer-events-auto z-10">
          <MiniMap pois={mapPOIs} cameraRotationRef={cameraRotationRef} />
      </div>

      {/* BIO SCANNER DISPLAY */}
      {(scannedSpecies || (gameState === GameState.TUTORIAL)) && (
          <div className={`${gameState === GameState.TUTORIAL ? 'opacity-50 pointer-events-none' : ''}`}>
             {scannedSpecies ? <BioScanner species={scannedSpecies} /> : (gameState === GameState.TUTORIAL ? 
                 <div className="absolute top-24 right-4 w-72 h-32 border-2 border-dashed border-cyan-500/30 rounded-xl flex items-center justify-center text-cyan-500/50 font-mono text-xs">SCANNER STANDBY</div> 
             : null)}
          </div>
      )}
    </div>
  );
};