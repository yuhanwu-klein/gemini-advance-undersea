import React, { useEffect, useRef, useState } from 'react';
import { HandLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";
import { Hand, ThumbsDown } from 'lucide-react';

interface GestureControllerProps {
    onSwimChange: (isSwimming: boolean) => void;
    onRechargeChange: (isRecharging: boolean) => void;
}

export const GestureController: React.FC<GestureControllerProps> = ({ onSwimChange, onRechargeChange }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const [status, setStatus] = useState<string>('Initializing Motion Link...');
    const [activeAction, setActiveAction] = useState<'SWIM' | 'RECHARGE' | null>(null);
    
    // Refs for non-react state to be used in animation loop
    const handLandmarkerRef = useRef<HandLandmarker | null>(null);
    const lastVideoTimeRef = useRef<number>(-1);
    const requestRef = useRef<number>(0);

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
    }, []);

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

            if (results.landmarks) {
                for (const landmarks of results.landmarks) {
                    const wrist = landmarks[0];
                    const thumbTip = landmarks[4];
                    const indexTip = landmarks[8];
                    const middleTip = landmarks[12];
                    const ringTip = landmarks[16];
                    const pinkyTip = landmarks[20];

                    const thumbIp = landmarks[3]; // Thumb knuckle
                    const indexPip = landmarks[6]; // Index knuckle
                    const middlePip = landmarks[10];
                    const ringPip = landmarks[14];
                    const pinkyPip = landmarks[18];

                    // 1. Detect Hand Open (SWIM)
                    // Check if fingers are extended (Tip distance to wrist > Pip distance to wrist)
                    // We use a slight multiplier to ensure intentional extension
                    let extendedCount = 0;
                    
                    // Thumb
                    if (calculateDistance(wrist, thumbTip) > calculateDistance(wrist, thumbIp) * 1.1) extendedCount++;
                    // Fingers
                    if (calculateDistance(wrist, indexTip) > calculateDistance(wrist, indexPip) * 1.2) extendedCount++;
                    if (calculateDistance(wrist, middleTip) > calculateDistance(wrist, middlePip) * 1.2) extendedCount++;
                    if (calculateDistance(wrist, ringTip) > calculateDistance(wrist, ringPip) * 1.2) extendedCount++;
                    if (calculateDistance(wrist, pinkyTip) > calculateDistance(wrist, pinkyPip) * 1.2) extendedCount++;

                    if (extendedCount >= 5) {
                        isSwimming = true;
                    }

                    // 2. Detect Thumb Down (RECHARGE)
                    // Thumb tip must be significantly below wrist (Y increases downwards in vision coords)
                    // Other fingers should generally be curled or higher than thumb
                    const isThumbBelowWrist = thumbTip.y > wrist.y + 0.05;
                    // Check if thumb tip is the lowest point (highest Y) among tips
                    const isThumbLowest = thumbTip.y > indexTip.y && thumbTip.y > middleTip.y && thumbTip.y > pinkyTip.y;
                    
                    // To prevent false positives with open hand pointing down, check if fingers are curled
                    // If extended count is low (e.g., < 3), implies fist-like shape
                    if (isThumbBelowWrist && isThumbLowest && extendedCount < 3) {
                        isRecharging = true;
                    }
                }
            }
            
            // Prioritize Swimming if both detect (unlikely with logic, but safe fallback)
            if (isSwimming) isRecharging = false;

            // Debounce/State update
            if (isSwimming) setActiveAction('SWIM');
            else if (isRecharging) setActiveAction('RECHARGE');
            else setActiveAction(null);

            onSwimChange(isSwimming);
            onRechargeChange(isRecharging);
        }

        requestRef.current = requestAnimationFrame(predictWebcam);
    };

    return (
        <div className="absolute top-20 right-4 w-32 bg-black/60 backdrop-blur-md rounded-lg border border-cyan-500/30 overflow-hidden shadow-lg pointer-events-auto transition-all duration-300">
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
                
                {!isLoaded && (
                    <div className="absolute inset-0 flex items-center justify-center text-[8px] text-center text-cyan-500/50 p-2 font-mono">
                        {status}
                    </div>
                )}
             </div>
             
             {/* Instruction */}
             <div className="px-2 py-1 bg-slate-900/80 border-t border-cyan-500/10 flex flex-col gap-0.5">
                 <div className="flex items-center justify-between">
                    <span className="text-[6px] text-cyan-400">HAND OPEN</span>
                    <span className="text-[6px] text-white">SWIM</span>
                 </div>
                 <div className="flex items-center justify-between">
                    <span className="text-[6px] text-green-400">THUMB DOWN</span>
                    <span className="text-[6px] text-white">REFILL O2</span>
                 </div>
             </div>
        </div>
    );
};