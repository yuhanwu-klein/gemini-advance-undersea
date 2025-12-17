import React, { useEffect, useRef, useState, useCallback } from 'react';
import { HandLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";
import { Hand, ThumbsDown, ArrowLeft, ArrowRight, MousePointer2 } from 'lucide-react';

interface GestureControllerProps {
    onSwimChange: (isSwimming: boolean) => void;
    onRechargeChange: (isRecharging: boolean) => void;
    onSteerChange: (direction: 'LEFT' | 'RIGHT' | null) => void;
}

export const GestureController: React.FC<GestureControllerProps> = ({ onSwimChange, onRechargeChange, onSteerChange }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const [status, setStatus] = useState<string>('Initializing Motion Link...');
    const [activeAction, setActiveAction] = useState<'SWIM' | 'RECHARGE' | 'LEFT' | 'RIGHT' | null>(null);
    
    // Refs for non-react state to be used in animation loop
    const handLandmarkerRef = useRef<HandLandmarker | null>(null);
    const lastVideoTimeRef = useRef<number>(-1);
    const requestRef = useRef<number>(0);

    // Speech Logic
    const speakInstructions = useCallback(() => {
        if (!window.speechSynthesis) return;
        
        // Ensure voices are loaded
        let voices = window.speechSynthesis.getVoices();
        const runSpeak = () => {
            window.speechSynthesis.cancel();
            const text = "Motion link active. Show open hand to swim. Point one finger to turn right, two fingers for left. Hold thumb down to refill oxygen.";
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.volume = 1.0;
            utterance.rate = 1.05;
            utterance.pitch = 1.1; // Slightly higher pitch for female tone

            // Attempt to find a female voice
            voices = window.speechSynthesis.getVoices();
            const femaleVoice = voices.find(v => 
                v.name.includes('Google US English') || 
                v.name.includes('Microsoft Zira') ||
                v.name.includes('Samantha') || 
                v.name.toLowerCase().includes('female')
            );
            if (femaleVoice) utterance.voice = femaleVoice;

            window.speechSynthesis.speak(utterance);
        };

        if (voices.length === 0) {
            window.speechSynthesis.addEventListener('voiceschanged', runSpeak, { once: true });
        } else {
            runSpeak();
        }
    }, []);

    useEffect(() => {
        let mounted = true;

        const setupMediaPipe = async () => {
            try {
                setStatus('Loading Vision Models...');
                const vision = await FilesetResolver.forVisionTasks(
                    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.9/wasm"
                );
                
                if (!mounted) return;

                const handLandmarker = await HandLandmarker.createFromOptions(vision, {
                    baseOptions: {
                        modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
                        delegate: "GPU"
                    },
                    runningMode: "VIDEO",
                    numHands: 2
                });

                if (!mounted) return;
                handLandmarkerRef.current = handLandmarker;
                
                setStatus('Connecting Camera...');
                const stream = await navigator.mediaDevices.getUserMedia({ 
                    video: { width: 320, height: 240, facingMode: "user" } 
                });
                
                if (videoRef.current && mounted) {
                    videoRef.current.srcObject = stream;
                    videoRef.current.addEventListener('loadeddata', () => {
                        setIsLoaded(true);
                        setStatus('ACTIVE');
                        predictWebcam();
                        
                        // Trigger voice instruction
                        setTimeout(speakInstructions, 1000);
                    });
                }

            } catch (error) {
                console.error("Gesture setup failed:", error);
                setStatus('Motion Sensors Failed');
            }
        };

        setupMediaPipe();

        return () => {
            mounted = false;
            if (videoRef.current && videoRef.current.srcObject) {
                const stream = videoRef.current.srcObject as MediaStream;
                stream.getTracks().forEach(track => track.stop());
            }
            if (handLandmarkerRef.current) {
                handLandmarkerRef.current.close();
            }
            cancelAnimationFrame(requestRef.current);
        };
    }, [speakInstructions]);

    const calculateDistance = (p1: {x:number, y:number}, p2: {x:number, y:number}) => {
        return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
    };

    const predictWebcam = () => {
        if (!handLandmarkerRef.current || !videoRef.current) return;

        const video = videoRef.current;
        let startTimeMs = performance.now();

        if (lastVideoTimeRef.current !== video.currentTime) {
            lastVideoTimeRef.current = video.currentTime;
            
            const results = handLandmarkerRef.current.detectForVideo(video, startTimeMs);
            
            let isSwimming = false;
            let isRecharging = false;
            let steerDir: 'LEFT' | 'RIGHT' | null = null;

            if (results.landmarks) {
                for (const landmarks of results.landmarks) {
                    const wrist = landmarks[0];
                    const thumbTip = landmarks[4];
                    const thumbIp = landmarks[3];
                    const indexTip = landmarks[8];
                    const indexPip = landmarks[6];
                    const middleTip = landmarks[12];
                    const middlePip = landmarks[10];
                    const ringTip = landmarks[16];
                    const ringPip = landmarks[14];
                    const pinkyTip = landmarks[20];
                    const pinkyPip = landmarks[18];

                    // Helper to check openness relative to wrist distance
                    const dWrist = (p: any) => calculateDistance(wrist, p);
                    
                    const isThumbOpen = dWrist(thumbTip) > dWrist(thumbIp) * 1.1;
                    const isIndexOpen = dWrist(indexTip) > dWrist(indexPip) * 1.1;
                    const isMiddleOpen = dWrist(middleTip) > dWrist(middlePip) * 1.1;
                    const isRingOpen = dWrist(ringTip) > dWrist(ringPip) * 1.1;
                    const isPinkyOpen = dWrist(pinkyTip) > dWrist(pinkyPip) * 1.1;

                    // Count fingers excluding thumb for simpler logic, or include it
                    // Let's count all 5 for "Open Hand"
                    const extendedCount = [isThumbOpen, isIndexOpen, isMiddleOpen, isRingOpen, isPinkyOpen].filter(Boolean).length;

                    // --- ACTION DETECTION ---
                    
                    // 1. Swim: Open Hand (4 or more fingers extended)
                    if (extendedCount >= 4) {
                        isSwimming = true;
                    } 
                    else {
                        // 2. Recharge: Thumb Down
                        // Logic: Thumb tip below wrist (y is higher value), and it's the lowest point
                        const isThumbBelowWrist = thumbTip.y > wrist.y + 0.05;
                        if (isThumbBelowWrist && extendedCount < 3) {
                            isRecharging = true;
                        }

                        // 3. Steering: Gestures
                        // Gesture "Two" (Peace Sign) -> Turn Left
                        // Index and Middle Open, Ring and Pinky Closed
                        if (isIndexOpen && isMiddleOpen && !isRingOpen && !isPinkyOpen) {
                            steerDir = 'LEFT';
                        }
                        // Gesture "One" (Point) -> Turn Right
                        // Index Open, Middle, Ring, Pinky Closed
                        else if (isIndexOpen && !isMiddleOpen && !isRingOpen && !isPinkyOpen) {
                            steerDir = 'RIGHT';
                        }
                    }
                }
            }
            
            // Prioritize Swimming over Recharging if conflict (e.g. using two hands)
            if (isSwimming) isRecharging = false;

            // Debounce/State update
            if (isSwimming) setActiveAction('SWIM');
            else if (isRecharging) setActiveAction('RECHARGE');
            else if (steerDir === 'LEFT') setActiveAction('LEFT');
            else if (steerDir === 'RIGHT') setActiveAction('RIGHT');
            else setActiveAction(null);

            onSwimChange(isSwimming);
            onRechargeChange(isRecharging);
            onSteerChange(steerDir);
        }

        requestRef.current = requestAnimationFrame(predictWebcam);
    };

    return (
        <div className="absolute top-20 right-4 w-40 bg-black/60 backdrop-blur-md rounded-lg border border-cyan-500/30 overflow-hidden shadow-lg pointer-events-auto transition-all duration-300 z-40">
             {/* Header */}
             <div className="bg-slate-900 px-2 py-1 flex items-center justify-between">
                <span className="text-[8px] font-mono text-cyan-400">MOTION LINK</span>
                <div className={`w-1.5 h-1.5 rounded-full ${isLoaded ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
             </div>

             {/* Video Feed */}
             <div className="relative aspect-video bg-black">
                <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline 
                    muted
                    className="w-full h-full object-cover opacity-50 transform -scale-x-100" 
                />
                
                {/* Overlay Feedback */}
                {isLoaded && activeAction === 'SWIM' && (
                    <div className="absolute inset-0 flex items-center justify-center bg-cyan-500/20">
                        <Hand size={24} className="text-cyan-200 animate-bounce" />
                    </div>
                )}

                {isLoaded && activeAction === 'RECHARGE' && (
                    <div className="absolute inset-0 flex items-center justify-center bg-green-500/20">
                        <ThumbsDown size={24} className="text-green-200 animate-bounce" />
                    </div>
                )}
                
                {isLoaded && activeAction === 'LEFT' && (
                    <div className="absolute inset-y-0 left-0 w-1/2 flex items-center justify-center bg-white/10">
                        <ArrowLeft size={24} className="text-white animate-pulse" />
                    </div>
                )}

                {isLoaded && activeAction === 'RIGHT' && (
                    <div className="absolute inset-y-0 right-0 w-1/2 flex items-center justify-center bg-white/10">
                        <ArrowRight size={24} className="text-white animate-pulse" />
                    </div>
                )}
                
                {!isLoaded && (
                    <div className="absolute inset-0 flex items-center justify-center text-[8px] text-center text-cyan-500/50 p-2 font-mono">
                        {status}
                    </div>
                )}
             </div>
             
             {/* Instruction */}
             <div className="px-2 py-1 bg-slate-900/80 border-t border-cyan-500/10 flex flex-col gap-0.5">
                 <div className="flex items-center justify-between">
                    <span className="text-[6px] text-cyan-400">OPEN HAND</span>
                    <span className="text-[6px] text-white">SWIM</span>
                 </div>
                 <div className="flex items-center justify-between border-t border-white/5 pt-0.5 mt-0.5">
                    <span className="text-[6px] text-yellow-400">ONE FINGER</span>
                    <span className="text-[6px] text-white">RIGHT</span>
                 </div>
                 <div className="flex items-center justify-between">
                    <span className="text-[6px] text-yellow-400">TWO FINGERS</span>
                    <span className="text-[6px] text-white">LEFT</span>
                 </div>
                 <div className="flex items-center justify-between border-t border-white/5 pt-0.5 mt-0.5">
                    <span className="text-[6px] text-green-400">THUMB DOWN</span>
                    <span className="text-[6px] text-white">REFILL O2</span>
                 </div>
             </div>
        </div>
    );
};