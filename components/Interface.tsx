import React, { useState, useRef, useEffect } from 'react';
import { Eye, Sun, Moon, Play, Camera, Check, RefreshCw, X, Map as MapIcon, Compass, Waves, Droplets, AlertTriangle, Skull, BatteryCharging, Scan, Dna, ArrowRight, Heart, Star, Smile, ChevronRight } from 'lucide-react';
import { GameSettings, TimeOfDay, GameState, DiveLicense, MapPOI, FishSpecies } from '../types';
import { resumeAudioContext } from '../utils/audioGen';

interface MiniMapProps {
    pois: MapPOI[];
    cameraRotationRef: React.MutableRefObject<number>;
}

const MiniMap: React.FC<MiniMapProps> = ({ pois, cameraRotationRef }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const range = 30; 
    
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

            // Cute Radar Background - Pastel Gradient
            const grad = ctx.createRadialGradient(center, center, 0, center, center, center);
            grad.addColorStop(0, "#ecfeff"); // Cyan 50
            grad.addColorStop(1, "#cffafe"); // Cyan 100
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(center, center, center, 0, Math.PI * 2);
            ctx.fill();

            // Rings (Dashed cute style)
            ctx.strokeStyle = "rgba(34, 211, 238, 0.4)"; // Cyan 400
            ctx.lineWidth = 3;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.arc(center, center, center * 0.33, 0, Math.PI * 2);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(center, center, center * 0.66, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
            
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
                    // Ruin = Pink Square
                    ctx.fillStyle = '#f472b6'; 
                    ctx.roundRect(mapX - 5, mapY - 5, 10, 10, 2);
                    ctx.fill();
                    ctx.strokeStyle = '#fff';
                    ctx.lineWidth = 2;
                    ctx.stroke();
                } else if (poi.type === 'lamp') {
                    // Lamp = Yellow Dot
                    ctx.fillStyle = '#facc15'; 
                    ctx.arc(mapX, mapY, 4, 0, Math.PI * 2);
                    ctx.fill();
                } else if (poi.type === 'coral') {
                    ctx.fillStyle = poi.color || '#a78bfa';
                    ctx.arc(mapX, mapY, 3, 0, Math.PI * 2);
                    ctx.fill();
                }
            });

            ctx.restore();

            // Player Arrow (White Triangle with shadow)
            ctx.shadowColor = 'rgba(0,0,0,0.1)';
            ctx.shadowBlur = 6;
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.moveTo(center, center - 10);
            ctx.quadraticCurveTo(center, center - 10, center - 8, center + 8);
            ctx.lineTo(center, center + 4);
            ctx.lineTo(center + 8, center + 8);
            ctx.quadraticCurveTo(center, center - 10, center, center - 10);
            ctx.fill();
            ctx.shadowBlur = 0;
            
            animationId = requestAnimationFrame(render);
        };

        render();
        return () => cancelAnimationFrame(animationId);
    }, [pois, cameraRotationRef]);

    return (
        <div className="bg-white rounded-[2rem] border-[6px] border-white shadow-[0_8px_30px_rgba(0,0,0,0.1)] overflow-hidden w-40 h-40 relative transition-transform hover:scale-105 duration-300 ring-4 ring-cyan-200/50">
             <canvas ref={canvasRef} width={200} height={200} className="w-full h-full" />
             <div className="absolute top-2 left-1/2 -translate-x-1/2 text-[10px] font-black text-cyan-600 bg-white/80 px-2 py-0.5 rounded-full shadow-sm border border-cyan-100">N</div>
        </div>
    );
};

const OxygenMeter: React.FC<{ level: number, isRecharging?: boolean }> = ({ level, isRecharging }) => {
    const isLow = level < 25;
    const isCritical = level < 15;
    const segments = 10; 
    const activeSegments = Math.ceil(level / (100 / segments));

    return (
        <div className="flex flex-col-reverse items-center gap-3 pointer-events-auto group">
            {/* Bubble Bar */}
            <div className={`relative w-16 bg-white/60 backdrop-blur-md border-[6px] border-white rounded-[3rem] p-2 flex flex-col-reverse justify-start gap-1.5 shadow-[0_8px_30px_rgba(0,0,0,0.1)] transition-all
                 ${isCritical ? 'shadow-pink-400/50 animate-pulse border-pink-100' : ''}
            `}>
                {[...Array(segments)].map((_, i) => {
                    const isActive = i < activeSegments;
                    
                    let bgClass = "bg-slate-200/50"; 
                    if (isActive) {
                        if (isRecharging) bgClass = "bg-emerald-300 shadow-[inset_0_2px_4px_rgba(255,255,255,0.4)]";
                        else if (isCritical) bgClass = "bg-rose-400 shadow-[inset_0_2px_4px_rgba(255,255,255,0.4)]";
                        else if (isLow) bgClass = "bg-amber-300 shadow-[inset_0_2px_4px_rgba(255,255,255,0.4)]";
                        else bgClass = "bg-cyan-300 shadow-[inset_0_2px_4px_rgba(255,255,255,0.4)]";
                    }

                    return (
                        <div 
                            key={i} 
                            className={`w-full h-2 rounded-full transition-all duration-300 ${bgClass}`}
                            style={{ 
                                opacity: isActive ? 1 : 0.4, 
                                transform: isActive ? 'scale(1)' : 'scale(0.85)' 
                            }}
                        />
                    );
                })}
            </div>

            {/* Icon Bubble */}
             <div className={`w-16 h-16 rounded-full border-[6px] border-white bg-gradient-to-b transition-all duration-300 shadow-xl flex items-center justify-center transform hover:scale-110
                    ${isRecharging ? 'from-emerald-300 to-green-400 rotate-12' : (isLow ? 'from-amber-300 to-orange-400' : 'from-cyan-300 to-blue-400')}
                `}>
                    {isRecharging ? <BatteryCharging size={26} className="text-white animate-bounce" strokeWidth={3} /> : <Droplets size={26} className={`text-white ${isCritical ? 'animate-ping' : ''}`} fill="currentColor" />}
            </div>
        </div>
    );
};

const BioScanner: React.FC<{ species: FishSpecies | null }> = ({ species }) => {
    const [displayText, setDisplayText] = useState('');
    
    useEffect(() => {
        if (!species) { setDisplayText(''); return; }
        let i = 0; const txt = species.description; setDisplayText('');
        const timer = setInterval(() => { if (i < txt.length) { setDisplayText(prev => prev + txt.charAt(i)); i++; } else clearInterval(timer); }, 20);
        return () => clearInterval(timer);
    }, [species]);

    useEffect(() => {
        if (!species) return;
        const speak = () => {
            if (!window.speechSynthesis) return;
            window.speechSynthesis.cancel();
            const text = `Wow! A ${species.name}.`;
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.pitch = 1.3; utterance.rate = 1.1; 
            const voices = window.speechSynthesis.getVoices();
            const femaleVoice = voices.find(v => v.name.includes('Samantha') || v.name.includes('Google US English'));
            if (femaleVoice) utterance.voice = femaleVoice;
            window.speechSynthesis.speak(utterance);
        };
        if (window.speechSynthesis.getVoices().length !== 0) speak();
        else { const handler = () => speak(); window.speechSynthesis.addEventListener('voiceschanged', handler, { once: true }); return () => window.speechSynthesis.removeEventListener('voiceschanged', handler); }
        return () => window.speechSynthesis.cancel();
    }, [species]);

    if (!species) return null;

    const rarityColors = {
        'COMMON': 'bg-slate-100 text-slate-500 border-slate-200',
        'UNCOMMON': 'bg-emerald-50 text-emerald-600 border-emerald-200',
        'RARE': 'bg-violet-50 text-violet-600 border-violet-200',
        'LEGENDARY': 'bg-amber-50 text-amber-600 border-amber-200'
    };

    return (
        <div className="absolute top-36 right-4 w-80 bg-white/90 backdrop-blur-xl border-[8px] border-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] animate-in slide-in-from-right duration-500 pointer-events-auto transform hover:scale-105 transition-transform">
            {/* Header */}
            <div className="bg-gradient-to-r from-cyan-200 to-blue-100 p-5 rounded-t-[2rem] border-b-[6px] border-white flex items-center gap-3 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-20 h-20 bg-white/20 rounded-full blur-xl transform translate-x-10 -translate-y-10"></div>
                <div className="bg-white p-2.5 rounded-full shadow-sm z-10">
                    <Scan size={20} className="text-cyan-500 animate-spin-slow" strokeWidth={3} />
                </div>
                <span className="text-sm font-black text-cyan-700 tracking-wider uppercase z-10">Collection</span>
            </div>
            
            <div className="p-6 flex flex-col gap-4">
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="text-slate-800 font-black text-2xl leading-none mb-1.5">{species.name}</h3>
                        <div className="text-slate-400 text-[11px] font-bold uppercase tracking-wide bg-slate-100 px-2 py-0.5 rounded-full inline-block">{species.scientificName}</div>
                    </div>
                    {species.rarity === 'LEGENDARY' && <Star size={28} className="text-amber-400 fill-amber-400 animate-pulse drop-shadow-sm" />}
                </div>

                <div className="bg-cyan-50/80 p-4 rounded-3xl border-[3px] border-cyan-100 min-h-[80px]">
                    <p className="text-cyan-900 text-sm font-bold leading-relaxed">
                        {displayText}
                    </p>
                </div>

                <div className="flex justify-between items-center mt-1">
                    <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider border-[3px] shadow-sm ${rarityColors[species.rarity]}`}>
                        {species.rarity}
                    </div>
                </div>
            </div>
        </div>
    );
};

const TutorialOverlay: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
    const steps = [
        { id: 'WELCOME', text: "Hii! I'm your Guide Bot. Welcome underwater!", highlight: null },
        { id: 'MOVEMENT', text: "Move around with W, A, S, D or the Arrow Keys.", highlight: 'CENTER' },
        { id: 'OXYGEN', text: "Keep an eye on your air bubbles here! Don't run out!", highlight: 'OXYGEN' },
        { id: 'MAP', text: "This radar shows cool stuff nearby. Pink squares are ruins!", highlight: 'MAP' },
        { id: 'SCANNER', text: "Swim close to fish to collect their data cards here!", highlight: 'SCANNER' },
    ];
    
    const [currentStep, setCurrentStep] = useState(0);
    const step = steps[currentStep];

    useEffect(() => {
        const speak = () => {
             if (!window.speechSynthesis) return;
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(step.text);
            utterance.pitch = 1.3; utterance.rate = 1.0;
            const voices = window.speechSynthesis.getVoices();
            const femaleVoice = voices.find(v => v.name.includes('Samantha') || v.name.includes('Google US English'));
            if (femaleVoice) utterance.voice = femaleVoice;
            utterance.onend = () => { 
                // Auto advance after short delay
                setTimeout(() => { 
                    if (currentStep < steps.length - 1) setCurrentStep(c => c + 1); 
                    else onComplete(); 
                }, 2000); 
            };
            window.speechSynthesis.speak(utterance);
        };
        if (window.speechSynthesis.getVoices().length !== 0) speak();
        else { const h = () => speak(); window.speechSynthesis.addEventListener('voiceschanged', h, { once: true }); return () => window.speechSynthesis.removeEventListener('voiceschanged', h); }
        return () => window.speechSynthesis.cancel();
    }, [currentStep, onComplete]);

    const getHighlightStyle = (target: string | null) => {
        // Spotlight effect using massive shadow
        const base = "absolute rounded-[3rem] transition-all duration-700 ease-in-out z-50 pointer-events-none shadow-[0_0_0_9999px_rgba(0,0,0,0.6)] border-[6px] border-dashed border-pink-300 animate-pulse";
        switch(target) {
            case 'OXYGEN': return { className: base, style: { bottom: '20px', left: '20px', width: '120px', height: '300px' } };
            case 'MAP': return { className: base, style: { bottom: '20px', right: '20px', width: '180px', height: '180px', borderRadius: '9999px' } };
            case 'SCANNER': return { className: base, style: { top: '140px', right: '16px', width: '330px', height: '260px' } };
            case 'CENTER': return { className: base, style: { top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '300px', height: '100px', borderRadius: '2rem' } };
            default: return { className: base, style: { opacity: 0 } };
        }
    };
    const highlight = getHighlightStyle(step.highlight);

    return (
        <div className="absolute inset-0 z-[60] pointer-events-none overflow-hidden">
            {step.highlight && <div className={highlight.className} style={highlight.style} />}
            
            <div className="absolute bottom-40 left-1/2 -translate-x-1/2 w-full max-w-md text-center px-4 pointer-events-auto z-[70]">
                 <div className="bg-white p-8 rounded-[3rem] shadow-2xl transform transition-all duration-500 border-b-[10px] border-slate-200 relative animate-bounce-slow">
                     {/* Mascot */}
                     <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-gradient-to-br from-pink-400 to-rose-400 p-5 rounded-full border-[6px] border-white shadow-xl">
                        <Smile className="text-white w-12 h-12" strokeWidth={3} />
                     </div>
                     
                     <div className="mt-8 space-y-5">
                         <p className="text-2xl font-black text-slate-700 leading-tight font-sans">
                             "{step.text}"
                         </p>
                         <div className="flex justify-center gap-3">
                             {steps.map((s, i) => (
                                 <div key={s.id} className={`h-3 rounded-full transition-all duration-300 ${i === currentStep ? 'w-10 bg-pink-400' : 'w-3 bg-slate-200'}`} />
                             ))}
                         </div>
                     </div>
                 </div>
                 
                 <button onClick={() => { if (currentStep < steps.length - 1) setCurrentStep(c => c + 1); else onComplete(); }} className="mt-8 mx-auto bg-white/20 backdrop-blur-md hover:bg-white/40 border-[3px] border-white/60 text-white font-black uppercase tracking-wider text-sm flex items-center justify-center gap-2 px-8 py-4 rounded-full transition-all hover:scale-105 active:scale-95 shadow-lg">
                     Next <ChevronRight size={20} strokeWidth={3} />
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
  
  // Animation State for Photo
  const [flyingPhoto, setFlyingPhoto] = useState<string | null>(null);
  const [showLicense, setShowLicense] = useState(false);

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
                
                // Trigger Animation Sequence
                setFlyingPhoto(dataUrl);
                
                // Update Character Texture immediately (so it's ready when animation lands)
                onTakePhoto(dataUrl);
                
                // Show license after delay
                setTimeout(() => {
                    setFlyingPhoto(null);
                    setShowLicense(true);
                }, 1000);
                
                return;
              }
          }
      }
      onTakePhoto(undefined);
  };
  
  const handleRetakeReset = () => {
      setShowLicense(false);
      setFlyingPhoto(null);
      onTakePhoto(undefined);
  };

  // --- GAME OVER ---
  if (isGameOver) {
      return (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-rose-500/80 backdrop-blur-md animate-in fade-in duration-500">
             <div className="text-center space-y-6 bg-white p-12 rounded-[3.5rem] shadow-2xl border-[12px] border-rose-200 transform hover:scale-105 transition-transform">
                 <div className="flex justify-center mb-6">
                     <Skull size={100} className="text-rose-400 animate-bounce" strokeWidth={2.5} />
                 </div>
                 <h1 className="text-6xl font-black text-rose-500 tracking-tight uppercase drop-shadow-sm">
                     Oops!
                 </h1>
                 <p className="text-rose-400 font-bold text-2xl">Out of air bubbles!</p>
                 <button onClick={onRespawn} className="mt-10 px-10 py-5 bg-gradient-to-r from-rose-400 to-pink-500 text-white font-black rounded-full shadow-lg border-[6px] border-white hover:scale-110 active:scale-95 transition-all text-xl">
                     TRY AGAIN
                 </button>
             </div>
        </div>
      );
  }

  // --- INTRO SCREEN ---
  if (gameState === GameState.INTRO) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-cyan-900/40 backdrop-blur-sm z-50">
        <div className="text-center animate-bounce-slow">
          <div className="mb-12 relative inline-block group cursor-default">
               <h1 className="text-[10rem] font-black text-white drop-shadow-[0_12px_0_rgba(8,145,178,0.5)] tracking-tighter transform -rotate-3 group-hover:rotate-3 transition-transform duration-500" style={{ WebkitTextStroke: '6px #22d3ee' }}>
                VOXEL
              </h1>
              <h1 className="text-[10rem] font-black text-cyan-300 drop-shadow-[0_12px_0_rgba(21,94,117,0.5)] tracking-tighter absolute top-24 left-16 transform rotate-2 group-hover:-rotate-2 transition-transform duration-500" style={{ WebkitTextStroke: '6px white' }}>
                DIVER
              </h1>
          </div>
          <div className="h-40"></div>
          
          <button 
            onClick={() => {
                resumeAudioContext();
                onStart();
            }} 
            className="group relative inline-flex items-center justify-center px-20 py-8 font-black text-white transition-all duration-300 bg-gradient-to-r from-pink-400 to-rose-400 rounded-full hover:scale-110 border-[8px] border-white shadow-[0_20px_50px_rgba(244,114,182,0.5)] active:scale-95 active:border-pink-200"
          >
            <span className="relative flex items-center gap-4 text-4xl drop-shadow-md tracking-tight"><Play size={40} fill="currentColor" strokeWidth={3} /> START</span>
          </button>
        </div>
      </div>
    );
  }

  // --- PHOTO MODE ---
  if (gameState === GameState.PHOTO_MODE) {
      return (
        <>
            <style>{`
                @keyframes flyToFace {
                    0% { transform: translate(-50%, -50%) scale(1) rotate(0deg); opacity: 1; top: 50%; left: 50%; }
                    20% { transform: translate(-50%, -50%) scale(1.1) rotate(5deg); }
                    100% { transform: translate(-50%, -50%) scale(0.05) rotate(360deg); opacity: 0; top: 40%; left: 50%; }
                }
                .flying-photo {
                    position: absolute;
                    width: 300px;
                    height: 300px;
                    z-index: 100;
                    border-radius: 2rem;
                    border: 8px solid white;
                    box-shadow: 0 20px 50px rgba(0,0,0,0.2);
                    animation: flyToFace 1s ease-in-out forwards;
                }
            `}</style>

            <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-violet-900/40 backdrop-blur-md">
                {isFlashing && <div className="absolute inset-0 bg-white z-[100] animate-fadeOut pointer-events-none" />}
                <canvas ref={canvasRef} className="hidden" />
                
                {/* FLYING PHOTO ANIMATION */}
                {flyingPhoto && (
                    <img src={flyingPhoto} className="flying-photo" alt="Flying Capture" />
                )}

                {!showLicense && !flyingPhoto && (
                    <div className="relative w-full max-w-sm bg-white p-6 rounded-[3.5rem] shadow-[0_25px_60px_rgba(0,0,0,0.2)] animate-in fade-in zoom-in duration-300 flex flex-col gap-6 border-b-[16px] border-slate-100 transform hover:scale-[1.02] transition-transform">
                        <div className="flex items-center justify-between px-3 mt-2">
                            <div className="flex items-center gap-2 bg-slate-100 px-4 py-1.5 rounded-full border border-slate-200">
                                <div className="w-3 h-3 rounded-full bg-rose-500 animate-pulse" />
                                <span className="text-slate-500 font-bold text-xs uppercase tracking-wider">Selfie Cam</span>
                            </div>
                        </div>
                        
                        <div className="relative aspect-square bg-slate-100 rounded-[3rem] overflow-hidden group border-[6px] border-slate-200 ring-4 ring-white shadow-inner mx-2">
                            <video ref={videoRef} autoPlay playsInline muted className={`w-full h-full object-cover transform -scale-x-100 transition-opacity duration-500 ${hasCameraPermission ? 'opacity-100' : 'opacity-0'}`} />
                            {hasCameraPermission === null && <div className="absolute inset-0 flex items-center justify-center"><RefreshCw size={50} className="animate-spin text-pink-300" strokeWidth={3} /></div>}
                            
                            {countdown !== null && (
                                <div className="absolute inset-0 flex items-center justify-center bg-white/30 backdrop-blur-[2px] z-30">
                                    <div className="text-[10rem] font-black text-white animate-ping drop-shadow-lg stroke-cyan-500" style={{ WebkitTextStroke: '4px #ec4899' }}>{countdown}</div>
                                </div>
                            )}
                        </div>
                        
                        <div className="flex justify-center pb-4 pt-2">
                            <button onClick={startPhotoSequence} disabled={countdown !== null || hasCameraPermission === false} className={`w-28 h-28 rounded-full border-[10px] border-slate-100 bg-gradient-to-b from-rose-400 to-pink-500 hover:scale-110 active:scale-95 transition-all shadow-xl flex items-center justify-center group ${countdown !== null ? 'opacity-50' : ''}`}>
                                <Camera size={48} className="text-white group-hover:rotate-12 transition-transform drop-shadow-md" fill="white" strokeWidth={2.5} />
                            </button>
                        </div>
                    </div>
                )}

                {showLicense && (
                    <div className="relative bg-white p-8 rounded-[3.5rem] max-w-sm w-full shadow-[0_30px_70px_rgba(0,0,0,0.25)] transform rotate-1 scale-100 animate-in fade-in slide-in-from-bottom duration-500 pointer-events-auto border-b-[16px] border-slate-100">
                        <div className="flex justify-center mb-6 mt-2">
                            <div className="text-center">
                                <h2 className="text-4xl font-black text-slate-800 tracking-tight">LICENSE</h2>
                                <p className="text-xs font-bold text-pink-500 tracking-[0.2em] uppercase bg-pink-100 px-4 py-1 rounded-full inline-block mt-2 border border-pink-200">Official Diver</p>
                            </div>
                        </div>
                        
                        <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-5 rounded-[2.5rem] border-[3px] border-slate-200 flex gap-5 items-center shadow-inner relative overflow-hidden">
                            <div className="absolute -right-10 -top-10 w-40 h-40 bg-cyan-100 rounded-full blur-3xl opacity-50"></div>
                            <div className="w-28 h-28 bg-white rounded-3xl overflow-hidden shadow-md border-[6px] border-white rotate-[-3deg] ring-1 ring-slate-200 z-10">
                                <img src={capturedImage || ''} alt="Diver" className="w-full h-full object-cover" />
                            </div>
                            <div className="space-y-1.5 z-10">
                                <div className="bg-cyan-400 text-white px-3 py-1 rounded-full text-[10px] font-black inline-block uppercase tracking-wider shadow-sm border-2 border-white">Level 1</div>
                                <div className="text-slate-800 font-black text-2xl tracking-tight">PLAYER #1</div>
                                <div className="flex gap-1.5 bg-white/50 px-2 py-1 rounded-full w-max">
                                    {[1,2,3].map(i => <Star key={i} size={16} className="text-amber-400 fill-amber-400" />)}
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-4 mt-10 mb-2">
                            <button onClick={handleRetakeReset} className="flex-1 py-4 rounded-3xl bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold transition-colors flex items-center justify-center gap-2 uppercase text-xs tracking-wider border-b-4 border-slate-200 active:border-b-0 active:translate-y-1">Retake</button>
                            <button onClick={onAcceptLicense} className="flex-[2] py-4 rounded-3xl bg-gradient-to-r from-emerald-400 to-teal-400 hover:scale-105 active:scale-95 text-white font-black transition-all shadow-lg flex items-center justify-center gap-2 border-b-[6px] border-emerald-600 active:border-b-0 active:translate-y-1 uppercase text-sm tracking-wider">
                                Let's Go! <ArrowRight size={18} strokeWidth={4} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </>
      );
  }

  // --- MAIN HUD ---
  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between overflow-hidden">
      {gameState === GameState.TUTORIAL && <TutorialOverlay onComplete={onTutorialComplete} />}

      {/* Top Bar */}
      <div className="w-full p-6 flex justify-between items-start pointer-events-auto z-10">
         <div className="bg-white/40 backdrop-blur-md p-2.5 pr-8 pl-2.5 rounded-full border-[4px] border-white text-white shadow-xl flex items-center gap-4 transition-transform hover:scale-105">
            <div className="bg-gradient-to-br from-pink-400 to-rose-400 w-14 h-14 rounded-full flex items-center justify-center shadow-md border-[3px] border-white">
                <Heart size={28} className="text-white fill-white animate-pulse" strokeWidth={2.5} />
            </div>
            <div>
                <h2 className="text-xl font-black text-white leading-none drop-shadow-md tracking-tight">Voxel Diver</h2>
                <div className="text-[10px] font-bold text-white/90 mt-1 uppercase tracking-widest bg-black/10 px-2 py-0.5 rounded-full w-max">Depth: {(1 / currentSettings.fogDensity).toFixed(0)}m</div>
            </div>
         </div>
         
         <div className="flex gap-3">
            <button onClick={toggleTime} className="bg-white/40 hover:bg-white/60 backdrop-blur-md w-16 h-16 rounded-full border-[4px] border-white text-white transition-all shadow-xl flex items-center justify-center hover:rotate-12 active:scale-90">
                {currentSettings.timeOfDay === TimeOfDay.DAY ? <Sun size={32} className="text-yellow-300 fill-yellow-300 drop-shadow-sm" strokeWidth={2.5}/> : <Moon size={32} className="text-indigo-200 fill-indigo-200 drop-shadow-sm" strokeWidth={2.5}/>}
            </button>
         </div>
      </div>

      {/* Status Notifications */}
      {isSwimming && (
        <div className="absolute top-28 left-1/2 -translate-x-1/2 pointer-events-none z-20">
            <div className="bg-cyan-400 text-white px-8 py-3 rounded-full text-base font-black uppercase tracking-widest shadow-lg border-[5px] border-white animate-bounce flex items-center gap-3">
                <Waves size={20} strokeWidth={3} /> Swimming!
            </div>
        </div>
      )}

      {isRecharging && (
        <div className="absolute top-28 left-1/2 -translate-x-1/2 pointer-events-none z-20">
            <div className="bg-emerald-400 text-white px-8 py-3 rounded-full text-base font-black uppercase tracking-widest shadow-lg border-[5px] border-white animate-pulse flex items-center gap-3">
                <BatteryCharging size={20} strokeWidth={3} /> Filling Air...
            </div>
        </div>
      )}

      {/* Bottom HUD */}
      <div className="absolute bottom-8 left-8 pointer-events-auto z-10">
          <OxygenMeter level={oxygen} isRecharging={isRecharging} />
      </div>

      <div className="absolute bottom-8 right-8 pointer-events-auto z-10">
          <MiniMap pois={mapPOIs} cameraRotationRef={cameraRotationRef} />
      </div>

      {/* BIO SCANNER */}
      {(scannedSpecies || (gameState === GameState.TUTORIAL)) && (
          <div className={`${gameState === GameState.TUTORIAL ? 'opacity-50 pointer-events-none' : ''}`}>
             {scannedSpecies ? <BioScanner species={scannedSpecies} /> : (gameState === GameState.TUTORIAL ? 
                 <div className="absolute top-36 right-4 w-72 h-32 bg-white/20 backdrop-blur border-4 border-dashed border-white rounded-[2rem] flex items-center justify-center text-white font-black text-sm uppercase tracking-widest">Scanner Area</div> 
             : null)}
          </div>
      )}
    </div>
  );
};