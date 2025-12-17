import React, { useRef, useLayoutEffect, useEffect, useMemo, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Stars, Sky, Cloud, Sparkles, Float, Environment } from '@react-three/drei';
import { VoxelTerrain } from './VoxelTerrain';
import { VoxelCharacter } from './VoxelCharacter';
import { FishSchool } from './FishSchool';
import { InteractablesManager } from './Interactables';
import { GameSettings, TimeOfDay, GameState, TerrainData, MoveInput, FishSpecies, InteractableItem } from '../types';
import * as THREE from 'three';
import { generateBackgroundMusicBuffer, generateSonarBuffer, resumeAudioContext } from '../utils/audioGen';

interface SceneProps {
  settings: GameSettings;
  gameState: GameState;
  captureRef: React.MutableRefObject<() => string>;
  faceTextureUrl?: string | null;
  terrainData: TerrainData;
  cameraRotationRef: React.MutableRefObject<number>;
  isSwimming?: boolean;
  isRecharging?: boolean;
  moveInput?: MoveInput;
  onOxygenUpdate: (level: number) => void;
  isGameOver: boolean;
  onRespawn: () => void;
  onScanSpecies: (species: FishSpecies | null) => void;
  interactedItems: Set<string>;
  onHoverInteractable: (item: InteractableItem | null) => void;
  isInputLocked?: boolean;
}

export const SPECIES_DATA: FishSpecies[] = [
    {
        id: 'clownfish',
        name: 'Ocellaris Clownfish',
        scientificName: 'Amphiprion ocellaris',
        description: 'Bright orange with distinct white bands. Found near coral reefs. Immune to anemone stings.',
        rarity: 'COMMON',
        color: '#ff7f50',
        scale: [0.25, 0.2, 0.4],
        count: 12,
        speed: 0.08,
        behavior: 'school',
        shape: 'classic'
    },
    {
        id: 'sardine',
        name: 'Pacific Sardine',
        scientificName: 'Sardinops sagax',
        description: 'Small, oily fish that travels in large schools for protection. Silver-blue scales reflect light.',
        rarity: 'COMMON',
        color: '#94a3b8',
        scale: [0.1, 0.1, 0.35],
        count: 40,
        speed: 0.12,
        behavior: 'school',
        shape: 'long'
    },
    {
        id: 'shark',
        name: 'Tiger Shark',
        scientificName: 'Galeocerdo cuvier',
        description: 'A large macropredator. Named for the dark stripes down its body. Solitary and powerful.',
        rarity: 'RARE',
        color: '#475569',
        scale: [0.6, 0.5, 1.2],
        count: 2,
        speed: 0.05,
        behavior: 'solitary',
        shape: 'shark'
    },
    {
        id: 'tang',
        name: 'Yellow Tang',
        scientificName: 'Zebrasoma flavescens',
        description: 'Vibrant yellow herbivore. Its bright color helps it blend in with sunlit reefs.',
        rarity: 'UNCOMMON',
        color: '#facc15',
        scale: [0.15, 0.35, 0.3],
        count: 8,
        speed: 0.06,
        behavior: 'wander',
        shape: 'flat'
    },
    {
        id: 'goldfish',
        name: 'Golden Fantail',
        scientificName: 'Carassius auratus',
        description: 'A mutation of the Prussian carp. Known for its flowing fins and metallic gold scales.',
        rarity: 'LEGENDARY',
        color: '#fb923c',
        scale: [0.3, 0.3, 0.3],
        count: 5,
        speed: 0.04,
        behavior: 'wander',
        shape: 'classic'
    },
    {
        id: 'ghost',
        name: 'Phantom Tetra',
        scientificName: 'Phasma aquatica',
        description: 'A mysterious species that phases in and out of visual spectrum. Believed to be made of pure light.',
        rarity: 'LEGENDARY',
        color: '#a5f3fc',
        scale: [0.2, 0.2, 0.4],
        count: 6,
        speed: 0.03,
        behavior: 'wander', 
        shape: 'long'
    },
    {
        id: 'angler',
        name: 'Starlight Angler',
        scientificName: 'Lophiiformes Astrea',
        description: 'A deep-sea dreamer with a glowing lantern. Looks grumpy but actually just wants a hug.',
        rarity: 'RARE',
        color: '#6366f1',
        scale: [0.4, 0.35, 0.5],
        count: 3,
        speed: 0.02,
        behavior: 'wander',
        shape: 'classic'
    },
    {
        id: 'seahorse',
        name: 'Bubblegum Seahorse',
        scientificName: 'Hippocampus Suavis',
        description: 'Drifts lazily on currents. Holds onto invisible balloons to nap without sinking.',
        rarity: 'UNCOMMON',
        color: '#f472b6',
        scale: [0.15, 0.4, 0.15],
        count: 5,
        speed: 0.015,
        behavior: 'solitary',
        shape: 'long'
    },
    {
        id: 'barracuda',
        name: 'Prism Barracuda',
        scientificName: 'Sphyraena Prisma',
        description: 'Swift and shiny! Scales refract rainbows. Loves to race bubbles but always wins.',
        rarity: 'UNCOMMON',
        color: '#2dd4bf',
        scale: [0.15, 0.2, 0.8],
        count: 4,
        speed: 0.18,
        behavior: 'solitary',
        shape: 'long'
    },
    {
        id: 'jellyfish',
        name: 'Selfie Jelly',
        scientificName: 'Gelatinus Narcissus',
        description: 'Friendly jellies that follow gentle divers. If you stop swimming, they might come say hi!',
        rarity: 'LEGENDARY',
        color: '#a855f7', 
        scale: [1.5, 1.2, 1.5],
        count: 8,
        speed: 0.01,
        behavior: 'wander',
        shape: 'classic'
    }
];

const Lighting: React.FC<{ time: TimeOfDay }> = ({ time }) => {
  const isDay = time === TimeOfDay.DAY;
  
  return (
    <>
      <ambientLight intensity={isDay ? 0.7 : 0.3} color={isDay ? "#bae6fd" : "#172554"} />
      <directionalLight
        position={[50, 80, 20]}
        intensity={isDay ? 2.0 : 0.5}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0001}
        color={isDay ? "#ffffff" : "#60a5fa"}
      />
      {/* Backlight for gloss */}
      <spotLight 
        position={[-20, 10, -20]} 
        intensity={1.0} 
        color="#7dd3fc"
        distance={100} 
      />
      {/* Environment map for reflections on plastic */}
      <Environment preset="city" /> 
    </>
  );
};

const UnderwaterEffect: React.FC<{ fogDensity: number; color: string }> = ({ fogDensity, color }) => {
   return (
      <fog attach="fog" args={[color, 2, 1 / fogDensity]} /> 
   );
}

const MarineSnow: React.FC = () => {
    const count = 500;
    const meshRef = useRef<THREE.InstancedMesh>(null);
    const dummy = useMemo(() => new THREE.Object3D(), []);
    
    const particles = useMemo(() => {
        return new Array(count).fill(0).map(() => ({
            pos: new THREE.Vector3(
                (Math.random() - 0.5) * 100, 
                (Math.random() - 0.5) * 30,
                (Math.random() - 0.5) * 100
            ),
            speed: Math.random() * 0.02 + 0.005,
            offset: Math.random() * 100
        }));
    }, []);

    useFrame((state) => {
        if (!meshRef.current) return;
        const t = state.clock.elapsedTime;
        
        particles.forEach((p, i) => {
            let y = p.pos.y - t * p.speed;
            if (y < -15) y += 30;
            if (y > 15) y -= 30;
            
            const x = p.pos.x + Math.sin(t * 0.5 + p.offset) * 0.5;
            const z = p.pos.z + Math.cos(t * 0.3 + p.offset) * 0.5;

            dummy.position.set(x, y, z);
            
            const scale = (Math.sin(t + p.offset) * 0.5 + 1) * 0.05;
            dummy.scale.setScalar(scale);
            dummy.updateMatrix();
            meshRef.current!.setMatrixAt(i, dummy.matrix);
        });
        meshRef.current.instanceMatrix.needsUpdate = true;
    });

    return (
        <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
            <planeGeometry args={[0.2, 0.2]} />
            <meshBasicMaterial color="#e0f2fe" transparent opacity={0.5} side={THREE.DoubleSide} />
        </instancedMesh>
    );
};

const AudioManager: React.FC<{ gameState: GameState, listener: THREE.AudioListener }> = ({ gameState, listener }) => {
    const [bgmSound] = useState(() => new THREE.Audio(listener));
    const sonarRef = useRef<THREE.PositionalAudio>(null);
    const sonarDummyRef = useRef<THREE.Group>(null);
    
    useEffect(() => {
        if (gameState === GameState.INTRO) {
             resumeAudioContext(); 
        }

        if (!bgmSound.isPlaying) {
            const buffer = generateBackgroundMusicBuffer();
            bgmSound.setBuffer(buffer);
            bgmSound.setLoop(true);
            bgmSound.setVolume(0.25); 
            bgmSound.play();
        }
    }, [gameState, bgmSound]);

    useFrame((state) => {
        if (gameState !== GameState.PLAYING) return;
        if (Math.random() < 0.001) {
             if (sonarRef.current && !sonarRef.current.isPlaying && sonarDummyRef.current) {
                 const buffer = generateSonarBuffer();
                 sonarRef.current.setBuffer(buffer);
                 sonarRef.current.setRefDistance(10);
                 sonarRef.current.setVolume(0.5);
                 const angle = Math.random() * Math.PI * 2;
                 const dist = 30 + Math.random() * 20;
                 sonarDummyRef.current.position.set(Math.cos(angle) * dist, Math.random() * 10 - 5, Math.sin(angle) * dist);
                 sonarRef.current.play();
             }
        }
    });

    return (
        <>
            <primitive object={bgmSound} />
            <group ref={sonarDummyRef}>
                 <positionalAudio ref={sonarRef} args={[listener]} />
            </group>
        </>
    );
};

// --- IMPROVED PLAYER CONTROLLER WITH PHYSICS MOMENTUM ---
const PlayerController: React.FC<{ 
    gameState: GameState, 
    rotationRef: React.MutableRefObject<number>, 
    isSwimming?: boolean,
    moveInput?: MoveInput, 
    controlsRef: React.MutableRefObject<any>,
    characterRef: React.MutableRefObject<THREE.Group | null>,
    isGameOver: boolean,
    onRespawn: () => void,
    interactables: InteractableItem[],
    interactedIds: Set<string>,
    onHoverInteractable: (item: InteractableItem | null) => void,
    isInputLocked?: boolean
}> = ({ gameState, rotationRef, isSwimming, moveInput, controlsRef, characterRef, isGameOver, onRespawn, interactables, interactedIds, onHoverInteractable, isInputLocked }) => {
  const velocity = useRef(new THREE.Vector3());
  const lastClosestId = useRef<string | null>(null);
  const respawnTriggered = useRef(false);

  // Physics constants
  const ACCELERATION = 20.0;
  const DRAG = 5.0;
  const MAX_SPEED = 8.0;

  useEffect(() => {
      if (!isGameOver && respawnTriggered.current) {
         respawnTriggered.current = false;
         // Reset Physics
         velocity.current.set(0,0,0);
         if (controlsRef.current) {
             controlsRef.current.target.set(0,0,0);
             controlsRef.current.object.position.set(5, 2, 8);
             controlsRef.current.update();
         }
      }
  }, [isGameOver]);

  useFrame((state, delta) => {
    if (isGameOver) return;

    const t = state.clock.getElapsedTime();
    const camera = state.camera;

    // Update global rotation ref for radar
    rotationRef.current = Math.atan2(camera.position.x, camera.position.z);

    // Intro Animation
    if (gameState === GameState.INTRO) {
        const radius = 18;
        const speed = 0.15; 
        camera.position.x = Math.sin(t * speed) * radius;
        camera.position.z = Math.cos(t * speed) * radius;
        camera.position.y = 5 + Math.sin(t * 0.2) * 2;
        camera.lookAt(0, 0.5, 0);
        if (characterRef.current) characterRef.current.position.set(0, 0, 0);
        return;
    } 
    
    // Photo Mode Animation
    if (gameState === GameState.PHOTO_MODE) {
        const targetPos = new THREE.Vector3(0, 0, 3.5);
        camera.position.lerp(targetPos, 0.05);
        camera.lookAt(0, 0, 0);
        if (characterRef.current) characterRef.current.position.set(0, 0, 0);
        return;
    }

    // MAIN GAMEPLAY PHYSICS
    if (gameState === GameState.PLAYING && characterRef.current && controlsRef.current) {
        
        // Locked Input (Introduction Scene)
        if (isInputLocked) {
             velocity.current.set(0, 0, 0);
             characterRef.current.position.lerp(controlsRef.current.target, 0.2);
             controlsRef.current.update();
             return; 
        }

        // 1. Calculate Acceleration Vector based on Input & Camera Direction
        const accelDir = new THREE.Vector3(0, 0, 0);
        const camDir = new THREE.Vector3();
        const camRight = new THREE.Vector3();

        // Get camera directions flattened on Y axis for intuitive movement
        camera.getWorldDirection(camDir);
        camDir.y = 0; 
        camDir.normalize();
        
        // Right vector is cross product of Y-up and Forward
        camRight.crossVectors(new THREE.Vector3(0, 1, 0), camDir).normalize();
        
        // WASD / Gesture Logic
        if (moveInput?.forward || isSwimming) accelDir.add(camDir);
        if (moveInput?.backward) accelDir.sub(camDir);
        // Note: isSwimming mainly drives forward, but we allow steering
        if (moveInput?.left) accelDir.sub(camRight); 
        if (moveInput?.right) accelDir.add(camRight);

        // Normalize acceleration to prevent diagonal speed boost
        if (accelDir.lengthSq() > 0) accelDir.normalize();

        // Apply Acceleration to Velocity
        const currentAccel = accelDir.multiplyScalar(ACCELERATION * delta);
        velocity.current.add(currentAccel);

        // Apply Drag (Friction)
        // Drag force opposes velocity: F_drag = -k * v
        const dragForce = velocity.current.clone().multiplyScalar(-DRAG * delta);
        velocity.current.add(dragForce);

        // Cap speed (optional, drag usually handles this naturally but safety clamp is good)
        if (velocity.current.length() > MAX_SPEED) {
            velocity.current.normalize().multiplyScalar(MAX_SPEED);
        }

        // Apply Velocity to Positions
        const moveVec = velocity.current.clone().multiplyScalar(delta);
        
        // Move Target (Character)
        controlsRef.current.target.add(moveVec);
        
        // Move Camera (Follow)
        camera.position.add(moveVec);

        // Update Character Model
        // Smoothly lerp character to target to reduce jitter
        characterRef.current.position.lerp(controlsRef.current.target, 0.2);

        // Character Rotation (Face movement direction)
        if (velocity.current.lengthSq() > 0.1) {
            const targetRotation = Math.atan2(velocity.current.x, velocity.current.z);
            // Shortest path rotation interpolation
            let rotDiff = targetRotation - characterRef.current.rotation.y;
            while (rotDiff > Math.PI) rotDiff -= Math.PI * 2;
            while (rotDiff < -Math.PI) rotDiff += Math.PI * 2;
            characterRef.current.rotation.y += rotDiff * 5 * delta;
        }

        // BOUNDS CHECKING (Soft boundaries)
        const limit = 45;
        const dist = controlsRef.current.target.length();
        if (dist > limit) {
             // Push back gently
             const pushBack = controlsRef.current.target.clone().normalize().multiplyScalar(-10 * delta);
             velocity.current.add(pushBack);
        }

        // Interactables Check
        const cx = characterRef.current.position.x;
        const cy = characterRef.current.position.y;
        const cz = characterRef.current.position.z;
        let closest = null;
        let minSqDist = 4.0 * 4.0; // Interaction range

        for (const item of interactables) {
            if (interactedIds.has(item.id)) continue; 
            const dx = cx - item.position[0];
            const dy = cy - item.position[1];
            const dz = cz - item.position[2];
            const sqDist = dx*dx + dy*dy + dz*dz;
            
            if (sqDist < minSqDist) {
                closest = item;
                minSqDist = sqDist;
            }
        }
        
        const currentId = closest ? closest.id : null;
        if (currentId !== lastClosestId.current) {
            lastClosestId.current = currentId;
            onHoverInteractable(closest);
        }

        // Ensure OrbitControls doesn't fight our manual updates
        controlsRef.current.update();
    }
  });

  return null;
};

const SurvivalSystem: React.FC<{ 
    gameState: GameState; 
    onOxygenUpdate: (level: number) => void;
    isGameOver: boolean;
    isRecharging?: boolean;
}> = ({ gameState, onOxygenUpdate, isGameOver, isRecharging }) => {
    const { camera } = useThree();
    const oxygenRef = useRef(100);
    const lastUpdateRef = useRef(0);

    useFrame((state, delta) => {
        if (gameState !== GameState.PLAYING || isGameOver) return;
        const now = state.clock.elapsedTime;
        const isUnderwater = camera.position.y < 9;
        
        if (isRecharging) {
            oxygenRef.current = Math.min(100, oxygenRef.current + delta * 15);
        } else if (isUnderwater) {
            oxygenRef.current = Math.max(0, oxygenRef.current - delta * 2.5);
        } else {
            oxygenRef.current = Math.min(100, oxygenRef.current + delta * 20);
        }

        if (now - lastUpdateRef.current > 0.1) {
            onOxygenUpdate(oxygenRef.current);
            lastUpdateRef.current = now;
        }
    });

    return null;
};

const ScreenshotWrapper: React.FC<{ captureRef: React.MutableRefObject<() => string> }> = ({ captureRef }) => {
  const { gl, scene, camera } = useThree();
  useLayoutEffect(() => {
    captureRef.current = () => {
        gl.render(scene, camera);
        return gl.domElement.toDataURL('image/png');
    };
  }, [gl, scene, camera, captureRef]);
  return null;
};

const SceneContent: React.FC<SceneProps> = (props) => {
    const { camera } = useThree();
    const [listener] = useState(() => new THREE.AudioListener());
    const characterRef = useRef<THREE.Group>(null);
    const controlsRef = useRef<any>(null);

    const waterColor = props.settings.timeOfDay === TimeOfDay.DAY ? "#bae6fd" : "#082f49"; 

    useEffect(() => {
        camera.add(listener);
        return () => { camera.remove(listener); };
    }, [camera, listener]);

    const handleScan = React.useCallback((s: FishSpecies | null) => {
        props.onScanSpecies(s);
    }, [props.onScanSpecies]);

    return (
        <>
            <ScreenshotWrapper captureRef={props.captureRef} />
            <AudioManager gameState={props.gameState} listener={listener} />
            
            <color attach="background" args={[waterColor]} />
            <UnderwaterEffect fogDensity={props.settings.fogDensity} color={waterColor} />
            <Lighting time={props.settings.timeOfDay} />

            <group position={[0, -2, 0]}>
                <VoxelTerrain terrainData={props.terrainData} />
                <InteractablesManager 
                    items={props.terrainData.interactables} 
                    interactedIds={props.interactedItems} 
                    audioListener={listener} 
                />
            </group>

            <Float 
                speed={props.gameState === GameState.PHOTO_MODE ? 0.5 : (props.isSwimming ? 5 : 2)} 
                rotationIntensity={props.gameState === GameState.PHOTO_MODE ? 0.05 : (props.isSwimming ? 0.5 : 0.2)} 
                floatIntensity={0.5}
            >
                <VoxelCharacter 
                    ref={characterRef}
                    isPhotoPose={props.gameState === GameState.PHOTO_MODE} 
                    faceTextureUrl={props.faceTextureUrl}
                    isSwimming={props.isSwimming}
                    gameState={props.gameState}
                    terrainData={props.terrainData}
                    audioListener={listener}
                />
            </Float>

            <FishSchool species={SPECIES_DATA[0]} position={[0, -1, 0]} onScan={handleScan} audioListener={listener} isPlayerSwimming={props.isSwimming} />
            <FishSchool species={SPECIES_DATA[1]} position={[10, 4, -10]} onScan={handleScan} audioListener={listener} isPlayerSwimming={props.isSwimming} />
            <FishSchool species={SPECIES_DATA[2]} position={[-15, -1, -20]} onScan={handleScan} audioListener={listener} isPlayerSwimming={props.isSwimming} />
            <FishSchool species={SPECIES_DATA[3]} position={[-8, 0, 8]} onScan={handleScan} audioListener={listener} isPlayerSwimming={props.isSwimming} />
            <FishSchool species={SPECIES_DATA[4]} position={[15, -1, 15]} onScan={handleScan} audioListener={listener} isPlayerSwimming={props.isSwimming} />
            
            <FishSchool species={SPECIES_DATA[5]} position={[-20, 5, 20]} onScan={handleScan} audioListener={listener} isPlayerSwimming={props.isSwimming} />

            <FishSchool species={SPECIES_DATA[6]} position={[-25, -2, -5]} onScan={handleScan} audioListener={listener} isPlayerSwimming={props.isSwimming} />
            
            <FishSchool species={SPECIES_DATA[7]} position={[12, 1, 12]} onScan={handleScan} audioListener={listener} isPlayerSwimming={props.isSwimming} />
            
            <FishSchool species={SPECIES_DATA[8]} position={[0, 8, -25]} onScan={handleScan} audioListener={listener} isPlayerSwimming={props.isSwimming} />

            <FishSchool 
                species={SPECIES_DATA[9]} 
                position={[8, 3, 8]} 
                onScan={handleScan} 
                audioListener={listener} 
                photoTextureUrl={props.faceTextureUrl} 
                isPlayerSwimming={props.isSwimming}
            />

            <FishSchool species={SPECIES_DATA[1]} position={[35, 2, 35]} onScan={handleScan} audioListener={listener} isPlayerSwimming={props.isSwimming} />
            <FishSchool species={SPECIES_DATA[0]} position={[-35, -1, 35]} onScan={handleScan} audioListener={listener} isPlayerSwimming={props.isSwimming} />
            <FishSchool species={SPECIES_DATA[3]} position={[35, 0, -35]} onScan={handleScan} audioListener={listener} isPlayerSwimming={props.isSwimming} />
            <FishSchool species={SPECIES_DATA[7]} position={[-40, 3, -40]} onScan={handleScan} audioListener={listener} isPlayerSwimming={props.isSwimming} />

            <MarineSnow />
            
            <Sparkles count={300} scale={[40, 40, 40]} size={3} speed={0.5} opacity={0.6} color="#e0f2fe" />
            <Sparkles count={200} scale={[30, 30, 30]} size={2} speed={0.3} opacity={0.4} color="#bae6fd" />

            <PlayerController 
                gameState={props.gameState} 
                rotationRef={props.cameraRotationRef} 
                isSwimming={props.isSwimming}
                moveInput={props.moveInput}
                controlsRef={controlsRef}
                characterRef={characterRef}
                isGameOver={props.isGameOver}
                onRespawn={props.onRespawn}
                interactables={props.terrainData.interactables}
                interactedIds={props.interactedItems}
                onHoverInteractable={props.onHoverInteractable}
                isInputLocked={props.isInputLocked}
            />

            <SurvivalSystem 
                gameState={props.gameState} 
                onOxygenUpdate={props.onOxygenUpdate} 
                isGameOver={props.isGameOver}
                isRecharging={props.isRecharging}
            />
            
            {props.gameState === GameState.PLAYING && (
                <OrbitControls 
                    ref={controlsRef}
                    enablePan={false} 
                    enableZoom={false} // Disable zoom for consistent chase cam
                    minDistance={6} 
                    maxDistance={6}
                    maxPolarAngle={Math.PI / 1.8} 
                    minPolarAngle={Math.PI / 4}
                    target={[0, 0, 0]}
                />
            )}
        </>
    );
}

export const GameScene: React.FC<SceneProps> = (props) => {
  return (
    <Canvas 
        shadows 
        camera={{ position: [5, 2, 8], fov: 60 }}
        gl={{ preserveDrawingBuffer: true, antialias: true }}
    >
        <SceneContent {...props} />
    </Canvas>
  );
};