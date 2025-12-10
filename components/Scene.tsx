import React, { useRef, useLayoutEffect, useEffect, useMemo, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Stars, Sky, Cloud, Sparkles, Float } from '@react-three/drei';
import { VoxelTerrain } from './VoxelTerrain';
import { VoxelCharacter } from './VoxelCharacter';
import { FishSchool } from './FishSchool';
import { GameSettings, TimeOfDay, GameState, TerrainData, MoveInput, FishSpecies } from '../types';
import * as THREE from 'three';
import { generateOceanBuffer, generateSonarBuffer, resumeAudioContext } from '../utils/audioGen';

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
}

const SPECIES_DATA: FishSpecies[] = [
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
        behavior: 'wander', // We'll handle phasing in the component
        shape: 'long'
    }
];

const Lighting: React.FC<{ time: TimeOfDay }> = ({ time }) => {
  const isDay = time === TimeOfDay.DAY;
  
  return (
    <>
      <ambientLight intensity={isDay ? 0.8 : 0.3} color={isDay ? "#e9d5ff" : "#312e81"} />
      <directionalLight
        position={[20, 30, 10]}
        intensity={isDay ? 1.2 : 0.4}
        castShadow
        shadow-mapSize={[2048, 2048]}
        color={isDay ? "#fdf4ff" : "#818cf8"}
      />
      <spotLight 
        position={[0, 40, 0]} 
        angle={0.6} 
        penumbra={1} 
        intensity={1.5} 
        color="#a78bfa" 
        distance={70} 
      />
    </>
  );
};

const UnderwaterEffect: React.FC<{ fogDensity: number; color: string }> = ({ fogDensity, color }) => {
   return (
      <fog attach="fog" args={[color, 5, 1 / fogDensity]} /> 
   );
}

const MarineSnow: React.FC = () => {
    const count = 500;
    const meshRef = useRef<THREE.InstancedMesh>(null);
    const dummy = useMemo(() => new THREE.Object3D(), []);
    
    const particles = useMemo(() => {
        return new Array(count).fill(0).map(() => ({
            pos: new THREE.Vector3(
                (Math.random() - 0.5) * 60,
                (Math.random() - 0.5) * 30,
                (Math.random() - 0.5) * 60
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
            <meshBasicMaterial color="white" transparent opacity={0.4} side={THREE.DoubleSide} />
        </instancedMesh>
    );
};

const AudioManager: React.FC<{ gameState: GameState, listener: THREE.AudioListener }> = ({ gameState, listener }) => {
    const [ambientSound] = useState(() => new THREE.Audio(listener));
    const sonarRef = useRef<THREE.PositionalAudio>(null);
    const sonarDummyRef = useRef<THREE.Group>(null);
    
    // Global Ambient Sound
    useEffect(() => {
        if (gameState === GameState.INTRO) {
             resumeAudioContext(); 
        }

        if (!ambientSound.isPlaying) {
            const buffer = generateOceanBuffer();
            ambientSound.setBuffer(buffer);
            ambientSound.setLoop(true);
            ambientSound.setVolume(0.4);
            ambientSound.play();
        }
    }, [gameState, ambientSound]);

    // Occasional Sonar Ping (Spatialized from random distant locations)
    useFrame((state) => {
        if (gameState !== GameState.PLAYING) return;
        
        // Random chance approx every 10-15 seconds
        if (Math.random() < 0.001) {
             if (sonarRef.current && !sonarRef.current.isPlaying && sonarDummyRef.current) {
                 const buffer = generateSonarBuffer();
                 sonarRef.current.setBuffer(buffer);
                 sonarRef.current.setRefDistance(10);
                 sonarRef.current.setVolume(0.5);
                 
                 // Move dummy sound source to random distant location
                 const angle = Math.random() * Math.PI * 2;
                 const dist = 30 + Math.random() * 20;
                 sonarDummyRef.current.position.set(
                     Math.cos(angle) * dist, 
                     Math.random() * 10 - 5, 
                     Math.sin(angle) * dist
                 );
                 
                 sonarRef.current.play();
             }
        }
    });

    return (
        <>
            <primitive object={ambientSound} />
            <group ref={sonarDummyRef}>
                 <positionalAudio ref={sonarRef} args={[listener]} />
            </group>
        </>
    );
};

const PlayerController: React.FC<{ 
    gameState: GameState, 
    rotationRef: React.MutableRefObject<number>, 
    isSwimming?: boolean,
    moveInput?: MoveInput, 
    controlsRef: React.MutableRefObject<any>,
    characterRef: React.MutableRefObject<THREE.Group | null>,
    isGameOver: boolean,
    onRespawn: () => void
}> = ({ gameState, rotationRef, isSwimming, moveInput, controlsRef, characterRef, isGameOver, onRespawn }) => {
  const vec = new THREE.Vector3();
  const respawnTriggered = useRef(false);

  useEffect(() => {
      if (!isGameOver && respawnTriggered.current) {
         respawnTriggered.current = false;
      }
  }, [isGameOver]);

  useFrame((state, delta) => {
    if (!isGameOver && state.camera.position.distanceTo(new THREE.Vector3(5, 2, 8)) > 300) {
       // Safety reset
    }

    if (isGameOver) {
        if (!respawnTriggered.current) {
            respawnTriggered.current = true;
        }
        return; 
    }

    const t = state.clock.getElapsedTime();
    const angle = Math.atan2(state.camera.position.x, state.camera.position.z);
    rotationRef.current = angle;
    
    if (gameState === GameState.INTRO) {
      const radius = 18;
      const speed = 0.15; 
      state.camera.position.x = Math.sin(t * speed) * radius;
      state.camera.position.z = Math.cos(t * speed) * radius;
      state.camera.position.y = 5 + Math.sin(t * 0.2) * 2;
      state.camera.lookAt(0, 0.5, 0);
      if (characterRef.current) characterRef.current.position.set(0, 0, 0);

    } else if (gameState === GameState.PHOTO_MODE) {
      const targetPos = new THREE.Vector3(0, 0, 3.5);
      state.camera.position.lerp(targetPos, 0.05);
      state.camera.lookAt(0, 0, 0);
       if (characterRef.current) characterRef.current.position.set(0, 0, 0);

    } else if (gameState === GameState.PLAYING) {
      if (controlsRef.current && characterRef.current) {
          const target = controlsRef.current.target as THREE.Vector3;
          characterRef.current.position.lerp(target, 0.2);

          if (isSwimming) {
              const cameraPos = state.camera.position;
              const viewDir = new THREE.Vector3().subVectors(target, cameraPos);
              const targetY = Math.atan2(viewDir.x, viewDir.z);
              let currentY = characterRef.current.rotation.y;
              let rotDiff = targetY - currentY;
              
              while (rotDiff > Math.PI) rotDiff -= Math.PI * 2;
              while (rotDiff < -Math.PI) rotDiff += Math.PI * 2;
              characterRef.current.rotation.y += rotDiff * 0.1;
          }
      }
      
      if (moveInput && (moveInput.left || moveInput.right) && controlsRef.current) {
          const rotSpeed = 2.0 * delta;
          const dir = moveInput.left ? 1 : -1;
          const angle = dir * rotSpeed;
          const p = state.camera.position;
          const t = controlsRef.current.target;
          
          const x = p.x - t.x;
          const z = p.z - t.z;
          const cos = Math.cos(angle);
          const sin = Math.sin(angle);
          p.x = t.x + (x * cos - z * sin);
          p.z = t.z + (x * sin + z * cos);
          state.camera.lookAt(t);
      }

      if (isSwimming && controlsRef.current) {
        state.camera.getWorldDirection(vec);
        const speed = 0.05; 
        const directionMultiplier = (moveInput?.backward) ? -1 : 1;
        state.camera.position.addScaledVector(vec, speed * directionMultiplier);
        controlsRef.current.target.addScaledVector(vec, speed * directionMultiplier);
      }
    }
  });
  
  useEffect(() => {
     if (!isGameOver && gameState === GameState.PLAYING) {
         if (controlsRef.current) {
             controlsRef.current.target.set(0, 0, 0);
             controlsRef.current.update();
         }
     }
  }, [isGameOver, gameState]);

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

// Wrapper to handle internal scene state including AudioListener
const SceneContent: React.FC<SceneProps> = (props) => {
    const { camera } = useThree();
    const [listener] = useState(() => new THREE.AudioListener());
    const characterRef = useRef<THREE.Group>(null);
    const controlsRef = useRef<any>(null);

    const waterColor = props.settings.timeOfDay === TimeOfDay.DAY ? "#c4b5fd" : "#1e1b4b"; 

    useEffect(() => {
        camera.add(listener);
        return () => { camera.remove(listener); };
    }, [camera, listener]);

    // Memoize scan handler to avoid re-renders in children
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

            {/* FISH SCHOOLS - With Audio Listener */}
            <FishSchool species={SPECIES_DATA[0]} position={[0, -1, 0]} onScan={handleScan} audioListener={listener} />
            <FishSchool species={SPECIES_DATA[1]} position={[10, 4, -10]} onScan={handleScan} audioListener={listener} />
            <FishSchool species={SPECIES_DATA[2]} position={[-15, -1, -20]} onScan={handleScan} audioListener={listener} />
            <FishSchool species={SPECIES_DATA[3]} position={[-8, 0, 8]} onScan={handleScan} audioListener={listener} />
            <FishSchool species={SPECIES_DATA[4]} position={[15, -1, 15]} onScan={handleScan} audioListener={listener} />
            
            {/* GHOST FISH - RARE & PHASING */}
            <FishSchool species={SPECIES_DATA[5]} position={[-20, 5, 20]} onScan={handleScan} audioListener={listener} />

            <MarineSnow />
            
            <Sparkles count={300} scale={[40, 40, 40]} size={3} speed={0.5} opacity={0.6} color="#e879f9" />
            <Sparkles count={200} scale={[30, 30, 30]} size={2} speed={0.3} opacity={0.4} color="#22d3ee" />

            <PlayerController 
                gameState={props.gameState} 
                rotationRef={props.cameraRotationRef} 
                isSwimming={props.isSwimming}
                moveInput={props.moveInput}
                controlsRef={controlsRef}
                characterRef={characterRef}
                isGameOver={props.isGameOver}
                onRespawn={props.onRespawn}
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
                minDistance={3} 
                maxDistance={40}
                maxPolarAngle={Math.PI / 1.6} 
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
        gl={{ preserveDrawingBuffer: true, antialias: false }}
    >
        <SceneContent {...props} />
    </Canvas>
  );
};