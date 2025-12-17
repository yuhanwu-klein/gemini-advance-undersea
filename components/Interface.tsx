import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Sun, Moon, Play, Camera, RefreshCw, X, Waves, Droplets, Skull, BatteryCharging, Scan, ArrowRight, Heart, Star, Smile, ChevronRight, Hand, Fish, MousePointer2, ArrowLeft, ThumbsDown, Book, Scroll, Lock, Bot, Volume2 } from 'lucide-react';
import { GameSettings, TimeOfDay, GameState, MapPOI, FishSpecies, InteractableItem } from '../types';
import { resumeAudioContext, getAudioContext, generateShutterBuffer, generateMagicChimeBuffer, generateTutorialBlipBuffer, generateScanCompleteBuffer, generateLowOxygenBuffer } from '../utils/audioGen';
import { SPECIES_DATA } from './Scene';

// Helper for UI Sound Effects
const playUiSound = (bufferGen: () => AudioBuffer) => {
    const ctx = getAudioContext();
    if (ctx && ctx.state !== 'closed') {
        if (ctx.state === 'suspended') ctx.resume().catch(() => {});
        try {
            const source = ctx.createBufferSource();
            source.buffer = bufferGen();
            source.connect(ctx.destination);
            source.start();
        } catch(e) { /* Ignore */ }
    }
};

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
            grad.addColorStop(1, "#a5f3fc"); // Cyan 200
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(center, center, center, 0, Math.PI * 2);
            ctx.fill();

            // Rings (Dashed cute style)
            ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
            ctx.lineWidth = 4;
            ctx.setLineDash([8, 8]);
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
                    // Ruin = Pink Rounded Square
                    ctx.fillStyle = '#f472b6';
                    // Manually draw round rect for compatibility
                    const x = mapX - 6, y = mapY - 6, w = 12, h = 12, r = 4;
                    ctx.moveTo(x + r, y);
                    ctx.arcTo(x + w, y, x + w, y + h, r);
                    ctx.arcTo(x + w, y + h, x, y + h, r);
                    ctx.arcTo(x, y + h, x, y, r);
                    ctx.arcTo(x, y, x + w, y, r);
                    ctx.fill();
                    ctx.strokeStyle = '#fff';
                    ctx.lineWidth = 2;
                    ctx.stroke();
                } else if (poi.type === 'lamp') {
                    // Lamp = Yellow Dot
                    ctx.fillStyle = '#facc15'; 
                    ctx.arc(mapX, mapY, 5, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.strokeStyle = '#fff';
                    ctx.lineWidth = 2;
                    ctx.stroke();
                } else if (poi.type === 'coral') {
                    ctx.fillStyle = poi.color || '#a78bfa';
                    ctx.arc(mapX, mapY, 4, 0, Math.PI * 2);
                    ctx.fill();
                } else if (poi.type === 'chest') {
                    // Chest = Gold Rounded Rect
                    ctx.fillStyle = '#fbbf24';
                    const x = mapX - 5, y = mapY - 4, w = 10, h = 8, r = 2;
                    ctx.moveTo(x + r, y);
                    ctx.arcTo(x + w, y, x + w, y + h, r);
                    ctx.arcTo(x + w, y + h, x, y + h, r);
                    ctx.arcTo(x, y + h, x, y, r);
                    ctx.arcTo(x, y, x + w, y, r);
                    ctx.fill();
                    ctx.strokeStyle = '#fff';
                    ctx.lineWidth = 2;
                    ctx.stroke();
                } else if (poi.type === 'mechanism') {
                    // Mechanism = Purple Diamond
                    ctx.fillStyle = '#e879f9';
                    ctx.moveTo(mapX, mapY - 5);
                    ctx.lineTo(mapX + 5, mapY);
                    ctx.lineTo(mapX, mapY + 5);
                    ctx.lineTo(mapX - 5, mapY);
                    ctx.fill();
                    ctx.strokeStyle = '#fff';
                    ctx.lineWidth = 2;
                    ctx.stroke();
                }
            });

            ctx.restore();

            // Player Arrow (White Triangle with shadow)
            ctx.shadowColor = 'rgba(0,0,0,0.1)';
            ctx.shadowBlur = 4;
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(center, center, 8, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#06b6d4'; // Cyan 500
            ctx.beginPath();
            ctx.moveTo(center, center - 6);
            ctx.lineTo(center - 4, center + 4);
            ctx.lineTo(center + 4, center + 4);
            ctx.fill();
            ctx.shadowBlur = 0;
            
            animationId = requestAnimationFrame(render);
        };

        render();
        return () => cancelAnimationFrame(animationId);
    }, [pois, cameraRotationRef]);

    return (
        <div className="bg-white rounded-full border-[8px] border-white shadow-[0_10px_40px_rgba(34,211,238,0.4)] overflow-hidden w-48 h-48 relative transition-transform hover:scale-105 duration-300 ring-4 ring-cyan-200">
             <canvas ref={canvasRef} width={200} height={200} className="w-full h-full" />
             <div className="absolute top-4 left-1/2 -translate-x-1/2 text-[10px] font-black text-cyan-600 bg-white px-3 py-1 rounded-full shadow-sm border-2 border-cyan-100">N</div>
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
            <div className={`relative w-24 bg-white/60 backdrop-blur-xl border-[8px] border-white rounded-[2rem] p-2.5 flex flex-col-reverse justify-start gap-2 shadow-[0_10px_40px_rgba(34,211,238,0.3)] transition-all ring-4 ring-white/50
                 ${isCritical ? 'shadow-pink-400/50 animate-pulse border-pink-100 ring-pink-200' : ''}
            `}>
                {[...Array(segments)].map((_, i) => {
                    const isActive = i < activeSegments;
                    
                    let bgClass = "bg-slate-200/50"; 
                    if (isActive) {
                        if (isRecharging) bgClass = "bg-emerald-300 shadow-[inset_0_-2px_4px_rgba(0,0,0,0.1),inset_0_2px_4px_rgba(255,255,255,0.6)]";
                        else if (isCritical) bgClass = "bg-rose-400 shadow-[inset_0_-2px_4px_rgba(0,0,0,0.1),inset_0_2px_4px_rgba(255,255,255,0.6)]";
                        else if (isLow) bgClass = "bg-amber-300 shadow-[inset_0_-2px_4px_rgba(0,0,0,0.1),inset_0_2px_4px_rgba(255,255,255,0.6)]";
                        else bgClass = "bg-cyan-300 shadow-[inset_0_-2px_4px_rgba(0,0,0,0.1),inset_0_2px_4px_rgba(255,255,255,0.6)]";
                    }

                    return (
                        <div 
                            key={i} 
                            className={`w-full h-3 rounded-full transition-all duration-300 ${bgClass}`}
                            style={{ 
                                opacity: isActive ? 1 : 0.3, 
                                transform: isActive ? 'scale(1)' : 'scale(0.9)' 
                            }}
                        />
                    );
                })}
            </div>

            {/* Icon Bubble */}
             <div className={`w-20 h-20 rounded-full border-[8px] border-white bg-gradient-to-b transition-all duration-300 shadow-[0_10px_30px_rgba(0,0,0,0.15)] flex items-center justify-center transform hover:scale-110 ring-4 ring-white/50
                    ${isRecharging ? 'from-emerald-300 to-green-400 rotate-12' : (isLow ? 'from-amber-300 to-orange-400' : 'from-cyan-300 to-blue-400')}
                `}>
                    {isRecharging ? <BatteryCharging size={32} className="text-white animate-bounce drop-shadow-sm" strokeWidth={3} /> : <Droplets size={32} className={`text-white drop-shadow-sm ${isCritical ? 'animate-ping' : ''}`} fill="currentColor" />}
            </div>
        </div>
    );
};

const CollectionStatus: React.FC<{ collected: number, total: number }> = ({ collected, total }) => {
    return (
        <div className="bg-white/60 backdrop-blur-md p-2 pr-5 pl-2 rounded-full border-[4px] border-white text-slate-700 shadow-sm flex items-center gap-3 mt-2 ring-4 ring-indigo-200/50 transition-transform hover:scale-105 pointer-events-auto">
            <div className="bg-indigo-400 w-10 h-10 rounded-full flex items-center justify-center border-[3px] border-white shadow-sm">
                <Fish size={20} className="text-white" strokeWidth={2.5} />
            </div>
            <div className="flex flex-col w-28">
                <div className="flex justify-between text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">
                    <span>Collection</span>
                    <span>{collected}/{total}</span>
                </div>
                <div className="w-full h-2 bg-white/50 rounded-full overflow-hidden border border-white/5 shadow-inner">
                     <div 
                        className="h-full bg-gradient-to-r from-indigo-400 to-purple-400 transition-all duration-500 ease-out" 
                        style={{ width: `${Math.min(100, (collected/total)*100)}%` }} 
                    />
                </div>
            </div>
        </div>
    );
};

const GestureGuide: React.FC = () => {
    const items = [
        { icon: <Hand size={18} />, label: "SWIM", desc: "Open Hand", color: "text-cyan-400" },
        { icon: <MousePointer2 size={18} />, label: "RIGHT", desc: "One Finger", color: "text-yellow-400" },
        { icon: <div className="flex"><MousePointer2 size={16} /><MousePointer2 size={16} className="-ml-2" /></div>, label: "LEFT", desc: "Two Fingers", color: "text-yellow-400" },
        { icon: <ThumbsDown size={18} />, label: "RECHARGE", desc: "Thumb Down", color: "text-emerald-400" },
    ];

    return (
        <div className="bg-white/80 backdrop-blur-lg rounded-[2rem] p-4 border-[4px] border-white shadow-[0_10px_30px_rgba(0,0,0,0.15)] ring-4 ring-cyan-100/50 w-44 transition-transform hover:scale-105 pointer-events-auto">
            <div className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 text-center border-b pb-2 border-slate-200">
                Magic Hands
            </div>
            <div className="flex flex-col gap-3">
                {items.map((item, i) => (
                    <div key={i} className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center shadow-sm ${item.color}`}>
                            {item.icon}
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-slate-700 leading-none">{item.label}</span>
                            <span className="text-[9px] font-bold text-slate-500">{item.desc}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const BioScanner: React.FC<{ species: FishSpecies | null, speak: (text: string, options?: any) => void, onComplete?: () => void }> = ({ species, speak, onComplete }) => {
    const [displayText, setDisplayText] = useState('');
    
    useEffect(() => {
        if (!species) { setDisplayText(''); return; }
        
        let customDesc = species.description;
        if (species.id === 'jellyfish') {
            customDesc = "Hi, I have the same face as you!";
        }

        let i = 0; setDisplayText('');
        const timer = setInterval(() => { if (i < customDesc.length) { setDisplayText(prev => prev + customDesc.charAt(i)); i++; } else clearInterval(timer); }, 20);
        return () => clearInterval(timer);
    }, [species]);

    useEffect(() => {
        if (!species) return;
        
        playUiSound(generateScanCompleteBuffer);
        
        const text = species.id === 'jellyfish' 
            ? "Hi, I have the same face as you!" 
            : `Wow! A ${species.name}. ${species.description.split('.')[0]}.`;

        const gender = species.id === 'jellyfish' ? 'male' : 'female';
        
        speak(text, { 
            gender, 
            onEnd: () => {
                if (onComplete) onComplete();
            }
        });
    }, [species, speak, onComplete]);

    if (!species) return null;

    const rarityColors = {
        'COMMON': 'bg-slate-100 text-slate-500 border-slate-200',
        'UNCOMMON': 'bg-emerald-50 text-emerald-600 border-emerald-200',
        'RARE': 'bg-violet-50 text-violet-600 border-violet-200',
        'LEGENDARY': 'bg-amber-50 text-amber-600 border-amber-200'
    };

    return (
        <div className="absolute top-40 right-6 w-80 bg-white/90 backdrop-blur-xl border-[8px] border-white rounded-[3rem] shadow-[0_20px_60px_rgba(167,139,250,0.25)] animate-in slide-in-from-right duration-500 pointer-events-auto transform hover:scale-105 transition-transform ring-4 ring-violet-200/50">
            {/* Header */}
            <div className="bg-gradient-to-r from-violet-100 to-fuchsia-100 p-6 rounded-t-[2.5rem] border-b-[6px] border-white flex items-center gap-3 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-white/40 rounded-full blur-xl transform translate-x-8 -translate-y-8"></div>
                <div className="bg-white p-3 rounded-full shadow-sm z-10">
                    <Scan size={24} className="text-violet-500 animate-spin-slow" strokeWidth={3} />
                </div>
                <span className="text-sm font-black text-violet-600 tracking-wider uppercase z-10">Found It!</span>
            </div>
            
            <div className="p-7 flex flex-col gap-4">
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="text-slate-800 font-black text-2xl leading-none mb-2">{species.name}</h3>
                        <div className="text-slate-400 text-[10px] font-bold uppercase tracking-wide bg-slate-100 px-3 py-1 rounded-full inline-block border border-slate-200">{species.scientificName}</div>
                    </div>
                    {species.rarity === 'LEGENDARY' && <Star size={32} className="text-amber-400 fill-amber-400 animate-bounce drop-shadow-sm" />}
                </div>

                <div className="bg-violet-50/80 p-5 rounded-[2rem] border-[3px] border-violet-100 min-h-[90px]">
                    <p className="text-violet-900 text-sm font-bold leading-relaxed">
                        {displayText}
                    </p>
                </div>

                <div className="flex justify-between items-center mt-2">
                    <div className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-wider border-[3px] shadow-sm ${rarityColors[species.rarity]}`}>
                        {species.rarity}
                    </div>
                </div>
            </div>
        </div>
    );
};

const JournalOverlay: React.FC<{ 
    isOpen: boolean; 
    onClose: () => void; 
    collectedSpecies: Set<string>;
    interactedItems: Set<string>;
}> = ({ isOpen, onClose, collectedSpecies, interactedItems }) => {
    const [activeTab, setActiveTab] = useState<'FAUNA' | 'LOG'>('FAUNA');
    const [selectedId, setSelectedId] = useState<string | null>(null);

    // Dynamic logs based on player interactions
    const logs = useMemo(() => {
        const list = [
            { id: 'log_start', title: 'Mission Start', date: 'Day 1', text: "Dropped into sector 7. The water clarity is exceptional. Sensors indicate ancient structures below. I need to catalog the local fauna and investigate any energy signatures." },
        ];
        
        // Explicit typing for Set iteration
        const foundMech = Array.from(interactedItems).some((id: string) => id.startsWith('mech'));
        if (foundMech) {
            list.push({ id: 'log_mech', title: 'Dormant Machinery', date: 'Day 1', text: "I've activated a rune pillar. It hums with a strange energy, resonating with the glowing crystals found nearby. They seem to be powering a dormant network. The symbols match those of the lost Aethelgard civilization." });
        }
        
        const foundChest = Array.from(interactedItems).some((id: string) => id.startsWith('chest'));
        if (foundChest) {
            list.push({ id: 'log_chest', title: 'Supply Cache', date: 'Day 2', text: "Recovered a waterproof supply chest from the seabed. It contains preservation fluid and data drives. Whoever left this was studying the accelerated mutation rates of the local fish species." });
        }
        
        return list;
    }, [interactedItems]);

    if (!isOpen) return null;

    return (
        <div className="absolute inset-0 z-[80] flex items-center justify-center bg-black/40 backdrop-blur-sm p-8 animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-4xl h-[600px] rounded-[3rem] shadow-2xl flex overflow-hidden border-[12px] border-slate-100 ring-8 ring-white/50 relative">
                {/* Close Button */}
                <button onClick={onClose} className="absolute top-6 right-6 p-2 rounded-full bg-slate-100 hover:bg-slate-200 transition-colors z-20">
                    <X size={24} className="text-slate-500" />
                </button>

                {/* Sidebar */}
                <div className="w-1/3 bg-slate-50 border-r border-slate-200 flex flex-col">
                    <div className="p-8 pb-4">
                        <h2 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                            <Book className="text-cyan-500" size={32} strokeWidth={2.5} />
                            Journal
                        </h2>
                    </div>
                    
                    {/* Tabs */}
                    <div className="flex px-6 gap-2 mb-4">
                        <button 
                            onClick={() => { setActiveTab('FAUNA'); setSelectedId(null); }}
                            className={`flex-1 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${activeTab === 'FAUNA' ? 'bg-cyan-500 text-white shadow-md' : 'bg-white text-slate-400 hover:bg-slate-100'}`}
                        >
                            <Fish size={16} /> Fauna
                        </button>
                        <button 
                            onClick={() => { setActiveTab('LOG'); setSelectedId(null); }}
                            className={`flex-1 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${activeTab === 'LOG' ? 'bg-indigo-500 text-white shadow-md' : 'bg-white text-slate-400 hover:bg-slate-100'}`}
                        >
                            <Scroll size={16} /> Logs
                        </button>
                    </div>

                    {/* List */}
                    <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-2 custom-scrollbar">
                        {activeTab === 'FAUNA' ? (
                            SPECIES_DATA.map(s => {
                                const isUnlocked = collectedSpecies.has(s.id);
                                return (
                                    <button 
                                        key={s.id}
                                        onClick={() => setSelectedId(s.id)}
                                        className={`w-full p-4 rounded-2xl flex items-center gap-4 transition-all text-left border-2 ${selectedId === s.id ? 'bg-white border-cyan-400 shadow-md scale-[1.02]' : 'bg-white border-transparent hover:border-slate-200'}`}
                                    >
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isUnlocked ? 'bg-cyan-100 text-cyan-600' : 'bg-slate-100 text-slate-300'}`}>
                                            {isUnlocked ? <Fish size={20} /> : <Lock size={20} />}
                                        </div>
                                        <div>
                                            <div className={`font-bold text-sm ${isUnlocked ? 'text-slate-700' : 'text-slate-400'}`}>
                                                {isUnlocked ? s.name : '???'}
                                            </div>
                                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                                                {isUnlocked ? s.rarity : 'Unknown'}
                                            </div>
                                        </div>
                                    </button>
                                );
                            })
                        ) : (
                            logs.map(log => (
                                <button 
                                    key={log.id}
                                    onClick={() => setSelectedId(log.id)}
                                    className={`w-full p-4 rounded-2xl flex items-center gap-4 transition-all text-left border-2 ${selectedId === log.id ? 'bg-white border-indigo-400 shadow-md scale-[1.02]' : 'bg-white border-transparent hover:border-slate-200'}`}
                                >
                                    <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center">
                                        <Scroll size={20} />
                                    </div>
                                    <div>
                                        <div className="font-bold text-sm text-slate-700">{log.title}</div>
                                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{log.date}</div>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>

                {/* Main Content */}
                <div className="w-2/3 bg-white p-10 overflow-y-auto relative">
                    {/* Background decoration */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-cyan-50 to-blue-50 rounded-bl-[100%] opacity-50 pointer-events-none" />

                    {activeTab === 'FAUNA' && selectedId && (
                        (() => {
                            const s = SPECIES_DATA.find(x => x.id === selectedId);
                            if (!s) return null;
                            const isUnlocked = collectedSpecies.has(s.id);
                            if (!isUnlocked) return (
                                <div className="h-full flex flex-col items-center justify-center text-slate-300 space-y-4 animate-in fade-in zoom-in duration-300">
                                    <Lock size={64} />
                                    <p className="font-bold text-lg uppercase tracking-widest mt-4">Data Encrypted</p>
                                    <p className="text-sm">Scan this species to unlock details.</p>
                                </div>
                            );

                            return (
                                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <div className="bg-cyan-100 text-cyan-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider inline-block mb-2">
                                                {s.rarity}
                                            </div>
                                            <h1 className="text-4xl font-black text-slate-800 leading-none mb-1">{s.name}</h1>
                                            <p className="text-slate-400 font-serif italic text-lg">{s.scientificName}</p>
                                        </div>
                                        {/* Visual representation could go here */}
                                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-cyan-100 to-blue-100 border-[4px] border-white shadow-lg flex items-center justify-center">
                                            <Fish size={40} className="text-cyan-500" />
                                        </div>
                                    </div>

                                    <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                                        <p className="text-slate-600 leading-relaxed font-medium">
                                            {s.description}
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-4 rounded-2xl bg-orange-50 border border-orange-100">
                                            <div className="text-[10px] font-black text-orange-400 uppercase tracking-widest mb-1">Behavior</div>
                                            <div className="font-bold text-slate-700 capitalize">{s.behavior}</div>
                                        </div>
                                        <div className="p-4 rounded-2xl bg-blue-50 border border-blue-100">
                                            <div className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Speed</div>
                                            <div className="font-bold text-slate-700">{s.speed * 100} knots</div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })()
                    )}

                    {activeTab === 'LOG' && selectedId && (
                        (() => {
                            const l = logs.find(x => x.id === selectedId);
                            if (!l) return null;
                            return (
                                <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                                    <div className="border-b-2 border-slate-100 pb-6">
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className="bg-indigo-100 text-indigo-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">
                                                Entry
                                            </span>
                                            <span className="text-slate-400 text-sm font-bold uppercase tracking-wide">{l.date}</span>
                                        </div>
                                        <h1 className="text-4xl font-black text-slate-800">{l.title}</h1>
                                    </div>
                                    <div className="prose prose-slate prose-lg">
                                        <p className="text-slate-600 leading-loose font-serif text-xl">
                                            "{l.text}"
                                        </p>
                                    </div>
                                    <div className="flex justify-end">
                                        <div className="w-32 h-1 bg-slate-100 rounded-full" />
                                    </div>
                                </div>
                            );
                        })()
                    )}

                    {!selectedId && (
                        <div className="h-full flex flex-col items-center justify-center text-slate-300 space-y-4">
                            <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center">
                                <ArrowLeft size={32} />
                            </div>
                            <p className="font-bold text-lg uppercase tracking-widest">Select an Entry</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const TutorialOverlay: React.FC<{ onComplete: () => void, speak: (text: string, options?: any) => void }> = ({ onComplete, speak }) => {
    const steps = [
        { id: 'WELCOME', text: "Hii! I'm your Guide Bot. Welcome underwater!", highlight: null },
        { id: 'MOVEMENT', text: "Move with Keys (W,A,S,D) or Magic Hands!", highlight: 'CENTER' },
        { id: 'GESTURES', text: "Show OPEN HAND to swim. Point ONE finger to turn Right, TWO fingers for Left. Thumb DOWN to refill air!", highlight: 'GESTURES' },
        { id: 'OXYGEN', text: "Keep an eye on your air bubbles here! Don't run out!", highlight: 'OXYGEN' },
        { id: 'MAP', text: "This radar shows cool stuff nearby. Pink squares are ruins!", highlight: 'MAP' },
        { id: 'SCANNER', text: "Swim close to fish to collect their data cards here!", highlight: 'SCANNER' },
        { id: 'JOURNAL', text: "Press 'J' or click the book to see your discoveries!", highlight: 'JOURNAL' },
    ];
    
    const [currentStep, setCurrentStep] = useState(0);
    const step = steps[currentStep];

    useEffect(() => {
        playUiSound(generateTutorialBlipBuffer);
        speak(step.text, { gender: 'female', onEnd: () => {
            setTimeout(() => { 
                if (currentStep < steps.length - 1) setCurrentStep(c => c + 1); 
                else onComplete(); 
            }, 2000); 
        }});
        return () => window.speechSynthesis.cancel();
    }, [currentStep, onComplete, speak]);

    const getHighlightStyle = (target: string | null) => {
        const base = "absolute rounded-[3rem] transition-all duration-700 ease-in-out z-50 pointer-events-none shadow-[0_0_0_9999px_rgba(0,0,0,0.6)] border-[8px] border-dashed border-pink-300 animate-pulse";
        switch(target) {
            case 'OXYGEN': return { className: base, style: { bottom: '24px', left: '24px', width: '130px', height: '320px' } };
            case 'MAP': return { className: base, style: { bottom: '24px', right: '24px', width: '210px', height: '210px', borderRadius: '9999px' } };
            case 'SCANNER': return { className: base, style: { top: '150px', right: '20px', width: '350px', height: '280px' } };
            case 'GESTURES': return { className: base, style: { top: '80px', right: '16px', width: '160px', height: '140px', borderRadius: '1rem' } };
            case 'JOURNAL': return { className: base, style: { top: '24px', right: '130px', width: '90px', height: '90px', borderRadius: '9999px' } };
            case 'CENTER': return { className: base, style: { top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '300px', height: '100px', borderRadius: '2rem' } };
            default: return { className: base, style: { opacity: 0 } };
        }
    };
    const highlight = getHighlightStyle(step.highlight);

    return (
        <div className="absolute inset-0 z-[60] pointer-events-none overflow-hidden">
            {step.highlight && <div className={highlight.className} style={highlight.style} />}
            
            <div className="absolute bottom-40 left-1/2 -translate-x-1/2 w-full max-w-lg text-center px-4 pointer-events-auto z-[70]">
                 <div className="bg-white p-10 rounded-[3rem] shadow-[0_20px_60px_rgba(0,0,0,0.3)] transform transition-all duration-500 border-b-[12px] border-slate-100 relative animate-bounce-slow ring-8 ring-white/30">
                     {/* Mascot */}
                     <div className="absolute -top-14 left-1/2 -translate-x-1/2 bg-gradient-to-br from-pink-400 to-rose-400 p-6 rounded-full border-[8px] border-white shadow-2xl">
                        <Smile className="text-white w-14 h-14" strokeWidth={3} />
                     </div>
                     
                     <div className="mt-8 space-y-6">
                         <p className="text-3xl font-black text-slate-700 leading-tight font-sans tracking-tight">
                             "{step.text}"
                         </p>
                         <div className="flex justify-center gap-3">
                             {steps.map((s, i) => (
                                 <div key={s.id} className={`h-4 rounded-full transition-all duration-300 ${i === currentStep ? 'w-12 bg-pink-400 shadow-sm' : 'w-4 bg-slate-200'}`} />
                             ))}
                         </div>
                     </div>
                 </div>
                 
                 <button onClick={() => { if (currentStep < steps.length - 1) setCurrentStep(c => c + 1); else onComplete(); }} className="mt-8 mx-auto bg-white/20 backdrop-blur-md hover:bg-white/40 border-[4px] border-white/60 text-white font-black uppercase tracking-wider text-sm flex items-center justify-center gap-3 px-10 py-5 rounded-full transition-all hover:scale-105 active:scale-95 shadow-xl">
                     Next <ChevronRight size={22} strokeWidth={4} />
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
  closestInteractable: InteractableItem | null;
  collectedCount?: number;
  totalSpeciesCount?: number;
  collectedSpecies?: Set<string>;
  interactedItems?: Set<string>;
  onScanComplete?: () => void;
}

const INTRO_TEXT = "Welcome to Voxel Diver! Explore magical ruins, collect cute fish, and use your hands or keyboard to swim. Are you ready to dive?";

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
    scannedSpecies, 
    closestInteractable, 
    collectedCount = 0, 
    totalSpeciesCount = 10,
    collectedSpecies = new Set<string>(),
    interactedItems = new Set<string>(),
    onScanComplete
}) => {
  const [isFlashing, setIsFlashing] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [flyingPhoto, setFlyingPhoto] = useState<string | null>(null);
  const [showLicense, setShowLicense] = useState(false);
  
  const [isJournalOpen, setIsJournalOpen] = useState(false);
  const [hasUnreadJournal, setHasUnreadJournal] = useState(false);
  const prevCollectedCount = useRef(collectedCount);
  const prevInteractedCount = useRef(interactedItems.size);

  const [isNarrating, setIsNarrating] = useState(false);

  const lastWarningTime = useRef(0);
  
  const speechRef = useRef<SpeechSynthesisUtterance | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (oxygen < 20 && oxygen > 0 && !isGameOver && !isRecharging) {
        const now = Date.now();
        if (now - lastWarningTime.current > 2000) { 
            playUiSound(generateLowOxygenBuffer);
            lastWarningTime.current = now;
        }
    }
  }, [oxygen, isGameOver, isRecharging]);

  useEffect(() => {
    if (collectedCount > prevCollectedCount.current || interactedItems.size > prevInteractedCount.current) {
        setHasUnreadJournal(true);
        if (gameState === GameState.PLAYING) {
            playUiSound(generateTutorialBlipBuffer); 
        }
    }
    prevCollectedCount.current = collectedCount;
    prevInteractedCount.current = interactedItems.size;
  }, [collectedCount, interactedItems.size, gameState]);

  const openJournal = useCallback(() => {
      setIsJournalOpen(true);
      setHasUnreadJournal(false);
      playUiSound(generateTutorialBlipBuffer);
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
        if (gameState === GameState.PLAYING || gameState === GameState.TUTORIAL) {
            if (e.key === 'j' || e.key === 'J') {
                if (isJournalOpen) setIsJournalOpen(false);
                else openJournal();
            }
        }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [gameState, isJournalOpen, openJournal]);

  const ensureVoices = useCallback((callback: () => void) => {
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
        callback();
    } else {
        window.speechSynthesis.addEventListener('voiceschanged', callback, { once: true });
    }
  }, []);

  const speak = useCallback((text: string, options: { onEnd?: () => void, gender?: 'male' | 'female' } = {}) => {
      if (!window.speechSynthesis) return;
      window.speechSynthesis.cancel();
      
      setIsNarrating(true);

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.volume = 1.0;
      
      const voices = window.speechSynthesis.getVoices();
      let selectedVoice = null;

      if (options.gender === 'male') {
          selectedVoice = voices.find(v => 
            v.name.includes('Google UK English Male') || 
            v.name.includes('Daniel') || 
            (v.name.toLowerCase().includes('male') && !v.name.toLowerCase().includes('female'))
          );
          if (!selectedVoice) selectedVoice = voices.find(v => v.name.includes('David')); 
      } else {
          selectedVoice = voices.find(v => 
              v.name.includes('Google US English') || 
              v.name.includes('Microsoft Zira') ||
              v.name.includes('Samantha') || 
              v.name.includes('Female') ||
              v.name.includes('female')
          );
      }
      
      if (selectedVoice) utterance.voice = selectedVoice;
      
      if (options.gender === 'male') {
          utterance.pitch = 0.9; 
          utterance.rate = 0.9;
      } else {
          utterance.pitch = 1.1; 
          utterance.rate = 1.05;
      }
      
      utterance.onend = () => {
          setIsNarrating(false);
          if (options.onEnd) options.onEnd();
      };
      
      utterance.onerror = () => {
          setIsNarrating(false);
      };
      
      speechRef.current = utterance;
      window.speechSynthesis.speak(utterance);
  }, []);

  const handleIntroInteraction = () => {
    resumeAudioContext();
    if (!window.speechSynthesis.speaking) {
         ensureVoices(() => {
            speak(INTRO_TEXT, { gender: 'female' });
        });
    }
  };

  useEffect(() => {
    if (gameState === GameState.INTRO) {
        const ctx = getAudioContext();
        if (ctx && ctx.state !== 'closed') {
             if (ctx.state === 'suspended') ctx.resume().catch(() => {});
             try {
                const source = ctx.createBufferSource();
                source.buffer = generateMagicChimeBuffer();
                source.connect(ctx.destination);
                source.start();
             } catch(e) { /* Ignore */ }
        }

        ensureVoices(() => {
            speak(INTRO_TEXT, { gender: 'female' });
        });
    }
  }, [gameState, ensureVoices, speak]);

  useEffect(() => {
    if (gameState === GameState.PHOTO_MODE && !capturedImage) {
         ensureVoices(() => {
            speak("Get ready to take the picture for your dive license.", { gender: 'female' });
         });
    }
  }, [gameState, capturedImage, ensureVoices, speak]);

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

  const playShutterSound = () => {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') ctx.resume();
    const source = ctx.createBufferSource();
    source.buffer = generateShutterBuffer();
    source.connect(ctx.destination);
    source.start();
  };

  const performCapture = () => {
      playShutterSound();
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
                
                setFlyingPhoto(dataUrl);
                
                setTimeout(() => {
                    onTakePhoto(dataUrl); 
                }, 800); 

                setTimeout(() => {
                    setFlyingPhoto(null);
                    setShowLicense(true);
                }, 1500);
                
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

  if (isGameOver) {
      return (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-rose-500/80 backdrop-blur-lg animate-in fade-in duration-500">
             <div className="text-center space-y-8 bg-white p-14 rounded-[4rem] shadow-2xl border-[16px] border-rose-200 transform hover:scale-105 transition-transform ring-8 ring-white">
                 <div className="flex justify-center mb-6">
                     <Skull size={110} className="text-rose-400 animate-bounce" strokeWidth={2.5} />
                 </div>
                 <h1 className="text-7xl font-black text-rose-500 tracking-tighter uppercase drop-shadow-sm">
                     Oops!
                 </h1>
                 <p className="text-rose-400 font-bold text-3xl">Out of air bubbles!</p>
                 <button onClick={onRespawn} className="mt-12 px-12 py-6 bg-gradient-to-r from-rose-400 to-pink-500 text-white font-black rounded-full shadow-lg border-[8px] border-white hover:scale-110 active:scale-95 transition-all text-2xl tracking-wide">
                     TRY AGAIN
                 </button>
             </div>
        </div>
      );
  }

  if (gameState === GameState.INTRO) {
    return (
      <div onClick={handleIntroInteraction} className="absolute inset-0 flex flex-col items-center justify-center bg-cyan-900/40 backdrop-blur-sm z-50 cursor-pointer">
        <div className="text-center animate-bounce-slow pointer-events-none">
          <div className="mb-8 relative inline-block group cursor-default">
               <h1 className="text-[11rem] font-black text-white drop-shadow-[0_15px_0_rgba(8,145,178,0.5)] tracking-tighter transform -rotate-3 group-hover:rotate-3 transition-transform duration-500" style={{ WebkitTextStroke: '8px #22d3ee' }}>
                VOXEL
              </h1>
              <h1 className="text-[11rem] font-black text-cyan-300 drop-shadow-[0_15px_0_rgba(21,94,117,0.5)] tracking-tighter absolute top-28 left-20 transform rotate-2 group-hover:-rotate-2 transition-transform duration-500" style={{ WebkitTextStroke: '8px white' }}>
                DIVER
              </h1>
          </div>
          
          <div className="relative mt-24 mb-12 max-w-3xl mx-auto">
              <div 
                onClick={(e) => { e.stopPropagation(); speak(INTRO_TEXT, { gender: 'female' }); }} 
                className={`absolute -top-12 -left-12 cursor-pointer transform hover:scale-110 transition-all duration-300 z-20 pointer-events-auto ${isNarrating ? 'scale-110 shadow-[0_0_30px_rgba(34,211,238,0.6)] rounded-full' : ''}`}
              >
                <div className="bg-gradient-to-br from-cyan-400 to-blue-500 p-4 rounded-full border-[6px] border-white shadow-[0_10px_30px_rgba(0,0,0,0.2)] relative">
                    <Bot size={48} className={`text-white ${isNarrating ? 'animate-bounce' : ''}`} strokeWidth={2} />
                    {isNarrating && <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white animate-ping" />}
                    {!isNarrating && <div className="absolute top-0 right-0 w-4 h-4 bg-green-400 rounded-full border-2 border-white animate-pulse" />}
                </div>
                <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider text-cyan-600 shadow-sm border border-cyan-100 whitespace-nowrap flex items-center gap-1">
                    <Volume2 size={10} className={isNarrating ? 'animate-pulse' : ''} /> {isNarrating ? 'Speaking...' : 'Replay'}
                </div>
              </div>

              <p className="text-lg text-cyan-100 font-bold tracking-wide drop-shadow-sm bg-cyan-950/40 backdrop-blur-md py-6 px-10 rounded-[2rem] border-2 border-cyan-400/30 leading-relaxed shadow-lg">
                "{INTRO_TEXT}"
              </p>
          </div>
          
          <button 
            onClick={(e) => {
                e.stopPropagation(); 
                resumeAudioContext();
                window.speechSynthesis.cancel();
                setIsNarrating(false);
                onStart();
            }} 
            className="group relative inline-flex items-center justify-center px-24 py-10 font-black text-white transition-all duration-300 bg-gradient-to-r from-pink-400 to-rose-400 rounded-full hover:scale-110 border-[10px] border-white shadow-[0_30px_60px_rgba(244,114,182,0.6)] active:scale-95 active:border-pink-200 ring-8 ring-white/50 pointer-events-auto"
          >
            <span className="relative flex items-center gap-5 text-5xl drop-shadow-md tracking-tight"><Play size={48} fill="currentColor" strokeWidth={3} /> START</span>
          </button>
          
          <div className="mt-8 text-cyan-200/60 text-xs font-bold uppercase tracking-widest animate-pulse">
              (Click anywhere to enable audio)
          </div>
        </div>
      </div>
    );
  }

  // ... (Rest of the render logic remains unchanged)
  // Re-paste other gameState checks like PHOTO_MODE and standard overlay returns to ensure no code loss
  if (gameState === GameState.PHOTO_MODE) {
      return (
        <>
            <style>{`
                @keyframes flyToFace {
                    0% { transform: translate(-50%, -50%) scale(1) rotate(0deg); opacity: 1; top: 50%; left: 50%; border-width: 10px; }
                    60% { transform: translate(-50%, -50%) scale(0.4) rotate(10deg); opacity: 1; top: 40%; left: 50%; }
                    100% { transform: translate(-50%, -50%) scale(0.05) rotate(360deg); opacity: 0; top: 35%; left: 50%; border-width: 2px; }
                }
                .flying-photo {
                    position: absolute;
                    width: 320px;
                    height: 320px;
                    z-index: 100;
                    border-radius: 2.5rem;
                    border: 10px solid white;
                    box-shadow: 0 30px 60px rgba(0,0,0,0.25);
                    animation: flyToFace 0.8s ease-in-out forwards;
                    pointer-events: none;
                }
            `}</style>

            <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-violet-900/40 backdrop-blur-md">
                {isFlashing && <div className="absolute inset-0 bg-white z-[100] animate-fadeOut pointer-events-none" />}
                <canvas ref={canvasRef} className="hidden" />
                
                {flyingPhoto && (
                    <img src={flyingPhoto} className="flying-photo" alt="Flying Capture" />
                )}

                {!showLicense && !flyingPhoto && (
                    <div className="relative w-full max-w-sm bg-white p-8 rounded-[4rem] shadow-[0_30px_80px_rgba(167,139,250,0.3)] animate-in fade-in zoom-in duration-300 flex flex-col gap-8 border-b-[20px] border-slate-100 transform hover:scale-[1.02] transition-transform ring-8 ring-white/50">
                        <div className="flex items-center justify-between px-2">
                            <div className="flex items-center gap-3 bg-slate-100 px-5 py-2 rounded-full border-2 border-slate-200">
                                <div className="w-3 h-3 rounded-full bg-rose-500 animate-pulse" />
                                <span className="text-slate-500 font-bold text-xs uppercase tracking-wider">Selfie Cam</span>
                            </div>
                        </div>
                        
                        <div className="relative aspect-square bg-slate-100 rounded-[3rem] overflow-hidden group border-[8px] border-slate-200 ring-4 ring-white shadow-inner mx-2">
                            <video ref={videoRef} autoPlay playsInline muted className={`w-full h-full object-cover transform -scale-x-100 transition-opacity duration-500 ${hasCameraPermission ? 'opacity-100' : 'opacity-0'}`} />
                            {hasCameraPermission === null && <div className="absolute inset-0 flex items-center justify-center"><RefreshCw size={60} className="animate-spin text-pink-300" strokeWidth={3} /></div>}
                            
                            {countdown !== null && (
                                <div className="absolute inset-0 flex items-center justify-center bg-white/30 backdrop-blur-[2px] z-30">
                                    <div className="text-[12rem] font-black text-white animate-ping drop-shadow-lg stroke-cyan-500" style={{ WebkitTextStroke: '6px #ec4899' }}>{countdown}</div>
                                </div>
                            )}
                        </div>
                        
                        <div className="flex justify-center pb-2">
                            <button onClick={startPhotoSequence} disabled={countdown !== null || hasCameraPermission === false} className={`w-32 h-32 rounded-full border-[12px] border-slate-100 bg-gradient-to-b from-rose-400 to-pink-500 hover:scale-110 active:scale-95 transition-all shadow-xl flex items-center justify-center group ${countdown !== null ? 'opacity-50' : ''}`}>
                                <Camera size={56} className="text-white group-hover:rotate-12 transition-transform drop-shadow-md" fill="white" strokeWidth={2.5} />
                            </button>
                        </div>
                    </div>
                )}

                {showLicense && (
                    <div className="relative bg-white p-10 rounded-[4rem] max-w-sm w-full shadow-[0_40px_90px_rgba(0,0,0,0.3)] transform rotate-1 scale-100 animate-in fade-in slide-in-from-bottom duration-500 pointer-events-auto border-b-[20px] border-slate-100 ring-8 ring-white/50">
                        <div className="flex justify-center mb-8 mt-2">
                            <div className="text-center">
                                <h2 className="text-5xl font-black text-slate-800 tracking-tight">LICENSE</h2>
                                <p className="text-xs font-bold text-pink-500 tracking-[0.3em] uppercase bg-pink-50 px-5 py-1.5 rounded-full inline-block mt-3 border border-pink-100">Official Diver</p>
                            </div>
                        </div>
                        
                        <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-6 rounded-[3rem] border-[4px] border-white flex gap-6 items-center shadow-lg relative overflow-hidden ring-4 ring-slate-100">
                            <div className="absolute -right-12 -top-12 w-48 h-48 bg-gradient-to-br from-cyan-200 to-blue-200 rounded-full blur-3xl opacity-60"></div>
                            <div className="w-32 h-32 bg-white rounded-[2rem] overflow-hidden shadow-lg border-[6px] border-white rotate-[-3deg] ring-1 ring-slate-200 z-10">
                                <img src={capturedImage || ''} alt="Diver" className="w-full h-full object-cover" />
                            </div>
                            <div className="space-y-2 z-10">
                                <div className="bg-cyan-400 text-white px-3 py-1 rounded-full text-[10px] font-black inline-block uppercase tracking-wider shadow-sm border-2 border-white">Level 1</div>
                                <div className="text-slate-800 font-black text-2xl tracking-tight">PLAYER #1</div>
                                <div className="flex gap-1.5 bg-white/60 px-2 py-1.5 rounded-full w-max backdrop-blur-sm border border-white">
                                    {[1,2,3].map(i => <Star key={i} size={18} className="text-amber-400 fill-amber-400 drop-shadow-sm" />)}
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-4 mt-10 mb-2">
                            <button onClick={handleRetakeReset} className="flex-1 py-5 rounded-[2rem] bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold transition-colors flex items-center justify-center gap-2 uppercase text-xs tracking-wider border-b-[6px] border-slate-200 active:border-b-0 active:translate-y-1">Retake</button>
                            <button onClick={onAcceptLicense} className="flex-[2] py-5 rounded-[2rem] bg-gradient-to-r from-emerald-400 to-teal-400 hover:scale-105 active:scale-95 text-white font-black transition-all shadow-lg flex items-center justify-center gap-3 border-b-[8px] border-emerald-600 active:border-b-0 active:translate-y-1 uppercase text-sm tracking-wider">
                                Let's Go! <ArrowRight size={20} strokeWidth={4} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </>
      );
  }

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between overflow-hidden">
      {gameState === GameState.TUTORIAL && <TutorialOverlay onComplete={onTutorialComplete} speak={speak} />}
      
      <JournalOverlay 
        isOpen={isJournalOpen} 
        onClose={() => setIsJournalOpen(false)} 
        collectedSpecies={collectedSpecies}
        interactedItems={interactedItems}
      />

      {/* Top Bar */}
      <div className="w-full p-6 flex justify-between items-start pointer-events-auto z-10">
         <div className="flex flex-col gap-3 items-start">
             <div className="bg-white/60 backdrop-blur-md p-3 pr-8 pl-3 rounded-full border-[6px] border-white text-slate-700 shadow-[0_10px_30px_rgba(244,114,182,0.3)] flex items-center gap-4 transition-transform hover:scale-105 ring-4 ring-pink-200/50">
                <div className="bg-gradient-to-br from-pink-400 to-rose-500 w-16 h-16 rounded-full flex items-center justify-center shadow-inner border-[4px] border-white">
                    <Heart size={32} className="text-white fill-white animate-pulse" strokeWidth={3} />
                </div>
                <div>
                    <h2 className="text-2xl font-black text-slate-700 leading-none tracking-tight">Voxel Diver</h2>
                    <div className="text-[11px] font-bold text-slate-400 mt-1 uppercase tracking-widest bg-white px-3 py-0.5 rounded-full w-max border border-slate-100">Depth: {(1 / currentSettings.fogDensity).toFixed(0)}m</div>
                </div>
             </div>
             
             {/* New Collection Progress Bar */}
             {(gameState === GameState.PLAYING || gameState === GameState.TUTORIAL) && (
                 <CollectionStatus collected={collectedCount} total={totalSpeciesCount} />
             )}
         </div>
         
         <div className="flex gap-3">
             {/* Journal Button */}
             {(gameState === GameState.PLAYING || gameState === GameState.TUTORIAL) && (
                 <button onClick={openJournal} className="bg-white/60 hover:bg-white/80 backdrop-blur-md w-20 h-20 rounded-full border-[6px] border-white text-slate-600 transition-all shadow-[0_10px_30px_rgba(96,165,250,0.3)] flex items-center justify-center hover:scale-110 active:scale-95 ring-4 ring-indigo-200/50 relative">
                     <Book size={32} className="text-indigo-500 fill-indigo-100" strokeWidth={2.5} />
                     {hasUnreadJournal && (
                         <div className="absolute top-1 right-1 w-6 h-6 bg-rose-500 rounded-full border-4 border-white animate-bounce shadow-sm" />
                     )}
                 </button>
             )}

            <button onClick={toggleTime} className="bg-white/60 hover:bg-white/80 backdrop-blur-md w-20 h-20 rounded-full border-[6px] border-white text-slate-600 transition-all shadow-[0_10px_30px_rgba(96,165,250,0.3)] flex items-center justify-center hover:rotate-12 active:scale-90 ring-4 ring-blue-200/50">
                {currentSettings.timeOfDay === TimeOfDay.DAY ? <Sun size={36} className="text-yellow-400 fill-yellow-400 drop-shadow-sm" strokeWidth={3}/> : <Moon size={36} className="text-indigo-400 fill-indigo-400 drop-shadow-sm" strokeWidth={3}/>}
            </button>
         </div>
      </div>

      {/* Interaction Prompt */}
      {closestInteractable && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 mt-20 pointer-events-none z-30 opacity-95">
              <div className="bg-white/90 backdrop-blur-md text-slate-700 px-6 py-3 rounded-full font-black text-xs uppercase tracking-widest shadow-[0_10px_30px_rgba(252,211,77,0.5)] border-[5px] border-white ring-4 ring-yellow-200 flex items-center gap-3 transition-all animate-in fade-in zoom-in duration-300">
                  <div className="bg-yellow-400 p-1.5 rounded-full text-white shadow-sm">
                      <Hand size={16} strokeWidth={3} />
                  </div>
                  <span>
                    Press <span className="bg-slate-800 text-white px-2 py-0.5 rounded-lg text-[11px] font-black mx-1 shadow-sm">E</span> to {closestInteractable.type === 'CHEST' ? 'Open Chest' : 'Activate Mechanism'}
                  </span>
              </div>
          </div>
      )}

      {/* Status Notifications */}
      {isSwimming && (
        <div className="absolute top-32 left-1/2 -translate-x-1/2 pointer-events-none z-20">
            <div className="bg-cyan-400 text-white px-10 py-4 rounded-full text-lg font-black uppercase tracking-widest shadow-[0_10px_40px_rgba(34,211,238,0.5)] border-[6px] border-white ring-4 ring-cyan-200 animate-bounce flex items-center gap-3">
                <Waves size={24} strokeWidth={3} /> Swimming!
            </div>
        </div>
      )}

      {isRecharging && (
        <div className="absolute top-32 left-1/2 -translate-x-1/2 pointer-events-none z-20">
            <div className="bg-emerald-400 text-white px-10 py-4 rounded-full text-lg font-black uppercase tracking-widest shadow-[0_10px_40px_rgba(52,211,153,0.5)] border-[6px] border-white ring-4 ring-emerald-200 animate-pulse flex items-center gap-3">
                <BatteryCharging size={24} strokeWidth={3} /> Filling Air...
            </div>
        </div>
      )}

      {/* Gesture Guide Panel */}
      {(gameState === GameState.PLAYING || gameState === GameState.TUTORIAL) && (
          <div className="absolute top-1/2 -translate-y-1/2 left-10 z-20">
              <GestureGuide />
          </div>
      )}

      {/* Bottom HUD */}
      <div className="absolute bottom-10 left-10 pointer-events-auto z-10">
          <OxygenMeter level={oxygen} isRecharging={isRecharging} />
      </div>

      <div className="absolute bottom-10 right-10 pointer-events-auto z-10">
          <MiniMap pois={mapPOIs} cameraRotationRef={cameraRotationRef} />
      </div>

      {/* BIO SCANNER */}
      {(scannedSpecies || (gameState === GameState.TUTORIAL)) && (
          <div className={`${gameState === GameState.TUTORIAL ? 'opacity-50 pointer-events-none' : ''}`}>
             {scannedSpecies ? <BioScanner species={scannedSpecies} speak={speak} onComplete={onScanComplete} /> : (gameState === GameState.TUTORIAL ? 
                 <div className="absolute top-40 right-6 w-80 h-32 bg-white/20 backdrop-blur border-4 border-dashed border-white rounded-[2rem] flex items-center justify-center text-white font-black text-sm uppercase tracking-widest">Scanner Area</div> 
             : null)}
          </div>
      )}
    </div>
  );
};