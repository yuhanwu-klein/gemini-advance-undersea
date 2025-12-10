import React, { useRef, useEffect, useState, forwardRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group, TextureLoader, Texture, SRGBColorSpace, NearestFilter, Vector3, Matrix4, InstancedMesh, Object3D } from 'three';
import * as THREE from 'three';
import { GameState, TerrainData } from '../types';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      group: any;
      mesh: any;
      boxGeometry: any;
      meshStandardMaterial: any;
      planeGeometry: any;
      meshBasicMaterial: any;
      instancedMesh: any;
    }
  }
}

interface VoxelCharacterProps {
  isPhotoPose?: boolean;
  faceTextureUrl?: string | null;
  isSwimming?: boolean;
  gameState?: GameState;
  terrainData?: TerrainData;
}

// Dynamic Bubble Particle System
const Bubbles = ({ isSwimming }: { isSwimming: boolean }) => {
    const meshRef = useRef<InstancedMesh>(null);
    const count = 40; 
    const dummy = useMemo(() => new Object3D(), []);
    
    const bubbles = useMemo(() => {
        return new Array(count).fill(0).map(() => ({
            pos: new Vector3(0, 0, 0),
            velocity: new Vector3(0, 0, 0),
            scale: Math.random() * 0.4 + 0.3,
            offset: Math.random() * 100,
            active: false
        }));
    }, []);

    useFrame((state) => {
        if (!meshRef.current) return;
        const t = state.clock.elapsedTime;
        // Increase emission rate when swimming
        const emissionRate = isSwimming ? 0.7 : 0.95; 

        bubbles.forEach((bubble, i) => {
            if (!bubble.active) {
                if (Math.random() > emissionRate) {
                    bubble.active = true;
                    // Start at tank position (local space)
                    bubble.pos.set(0, 0.4, -0.4); 
                    bubble.scale = Math.random() * 0.3 + 0.2;
                    
                    if (isSwimming) {
                        // Trail behind when swimming
                        bubble.velocity.set(
                            (Math.random() - 0.5) * 0.05,
                            Math.random() * 0.02, 
                            -0.15 - Math.random() * 0.1 // Move backward fast
                        );
                    } else {
                        // Float up when idle
                        bubble.velocity.set(
                            Math.sin(t * 5 + bubble.offset) * 0.005, 
                            Math.random() * 0.02 + 0.015,
                            0.01
                        );
                    }
                } else {
                    dummy.position.set(0, -100, 0);
                    dummy.scale.setScalar(0);
                    dummy.updateMatrix();
                    meshRef.current!.setMatrixAt(i, dummy.matrix);
                    return;
                }
            }

            bubble.pos.add(bubble.velocity);
            
            // Kill bubble logic
            const maxDist = isSwimming ? 3.0 : 1.2;
            const distance = isSwimming ? Math.abs(bubble.pos.z) : bubble.pos.y;

            if (distance > maxDist) {
                bubble.active = false;
            }

            dummy.position.copy(bubble.pos);
            dummy.scale.setScalar(bubble.scale);
            dummy.updateMatrix();
            meshRef.current!.setMatrixAt(i, dummy.matrix);
        });
        meshRef.current.instanceMatrix.needsUpdate = true;
    });

    return (
        <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
            <boxGeometry args={[0.1, 0.1, 0.1]} />
            <meshBasicMaterial color="#e0f2fe" transparent opacity={0.6} />
        </instancedMesh>
    );
};

// Reactive Magic Particles near Ruins
const MagicAura = ({ parentRef, terrainData }: { parentRef: React.RefObject<Group>, terrainData?: TerrainData }) => {
    const meshRef = useRef<InstancedMesh>(null);
    const count = 20;
    const dummy = useMemo(() => new Object3D(), []);
    const opacityRef = useRef(0);

    const particles = useMemo(() => {
        return new Array(count).fill(0).map(() => ({
            pos: new Vector3((Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2),
            speed: Math.random() * 0.02 + 0.01,
            color: Math.random() > 0.5 ? '#22d3ee' : '#f472b6',
        }));
    }, []);

    useFrame((state) => {
        if (!meshRef.current || !parentRef.current || !terrainData) return;
        
        // Check distance to nearest magical ruin
        const worldPos = new THREE.Vector3();
        parentRef.current.getWorldPosition(worldPos);
        
        let minDist = Infinity;
        // Optimization: Only check POIs which are center of ruins
        for (const poi of terrainData.mapPOIs) {
            if (poi.type === 'ruin') {
                const dx = worldPos.x - poi.x;
                const dz = worldPos.z - poi.z;
                const d = Math.sqrt(dx*dx + dz*dz);
                if (d < minDist) minDist = d;
            }
        }

        // Fade in if closer than 5 units, max intensity at 2 units
        const targetOpacity = minDist < 5 ? Math.max(0, 1 - (minDist / 5)) : 0;
        opacityRef.current = THREE.MathUtils.lerp(opacityRef.current, targetOpacity, 0.1);

        if (opacityRef.current < 0.01) {
            meshRef.current.visible = false;
            return;
        }
        meshRef.current.visible = true;

        const t = state.clock.elapsedTime;

        particles.forEach((p, i) => {
            // Swirl motion
            const angle = t * p.speed + i;
            const radius = 1 + Math.sin(t * 2 + i) * 0.2;
            
            dummy.position.set(
                Math.cos(angle) * radius,
                Math.sin(t + i) * 0.5 + Math.sin(angle) * 0.2,
                Math.sin(angle) * radius
            );
            
            const scale = (Math.sin(t * 5 + i) * 0.5 + 0.5) * 0.15;
            dummy.scale.setScalar(scale);
            dummy.rotation.set(t, t, t);
            dummy.updateMatrix();
            meshRef.current!.setMatrixAt(i, dummy.matrix);
            
            // Randomly switch colors for sparkle effect
            const color = new THREE.Color(p.color);
            meshRef.current!.setColorAt(i, color);
        });
        
        meshRef.current.instanceMatrix.needsUpdate = true;
        if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
        
        // Update material opacity
        const mat = meshRef.current.material as THREE.MeshBasicMaterial;
        mat.opacity = opacityRef.current * 0.8;
    });

    return (
        <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
            <boxGeometry args={[1, 1, 1]} />
            <meshBasicMaterial transparent opacity={0} blending={THREE.AdditiveBlending} />
        </instancedMesh>
    );
};

export const VoxelCharacter = forwardRef<Group, VoxelCharacterProps>(({ isPhotoPose = false, faceTextureUrl, isSwimming = false, gameState, terrainData }, ref) => {
  const localRef = useRef<Group>(null);
  const group = (ref as React.MutableRefObject<Group>) || localRef;
  const innerRef = useRef<Group>(null);
  
  const [faceTexture, setFaceTexture] = useState<Texture | null>(null);
  
  const spinStartTime = useRef<number | null>(null);
  const isSpinningRef = useRef(false);

  useEffect(() => {
    if (faceTextureUrl) {
        const loader = new TextureLoader();
        loader.load(faceTextureUrl, (tex) => {
            tex.colorSpace = SRGBColorSpace;
            tex.minFilter = NearestFilter;
            tex.magFilter = NearestFilter;
            setFaceTexture(tex);
        });
    } else {
        setFaceTexture(null);
    }
  }, [faceTextureUrl]);

  useEffect(() => {
    if (gameState === GameState.PLAYING && faceTextureUrl) {
        isSpinningRef.current = true;
        spinStartTime.current = null;
    }
  }, [gameState, faceTextureUrl]);

  useFrame((state) => {
    if (innerRef.current) {
      const t = state.clock.elapsedTime;
      
      if (isSpinningRef.current) {
          if (spinStartTime.current === null) spinStartTime.current = t;
          const duration = 1.5;
          const elapsed = t - spinStartTime.current;
          const progress = Math.min(elapsed / duration, 1);
          const ease = 1 - Math.pow(1 - progress, 3);
          
          innerRef.current.rotation.y = ease * Math.PI * 2;
          innerRef.current.rotation.x = 0;
          innerRef.current.rotation.z = 0;
          
          if (progress >= 1) {
              isSpinningRef.current = false;
              spinStartTime.current = null;
          }
      } else {
          if (isPhotoPose) {
            innerRef.current.rotation.x = 0;
            innerRef.current.rotation.y = Math.sin(t * 0.5) * 0.05;
            innerRef.current.rotation.z = 0;
          } else {
            const tilt = isSwimming ? 1.4 : 0.4;
            innerRef.current.rotation.x = THREE.MathUtils.lerp(innerRef.current.rotation.x, tilt + Math.sin(t * 1) * 0.1, 0.1);
            innerRef.current.rotation.y = 0;
            innerRef.current.rotation.z = 0;
          }
      }
    }
  });

  // Pastel Chibi Palette
  const colors = {
      suit: "#22d3ee", // Cyan 400
      secondary: "#f472b6", // Pink 400
      tank: "#fcd34d", // Amber 300
      skin: "#fde047", // Yellow 300
      helmetGlass: "#ccfbf1", // Teal 100
      flipper: "#fb923c", // Orange 400
      dark: "#312e81" // Indigo 900
  };

  const getFlipperRot = (time: number, offset: number) => {
      const speed = isSwimming ? 20 : 3;
      return Math.sin(time * speed + offset) * 0.6;
  };

  return (
    <group ref={group} position={[0, 0, 0]}>
      {/* Reactive Aura Component */}
      <MagicAura parentRef={group as React.RefObject<Group>} terrainData={terrainData} />

      <group ref={innerRef} scale={[0.7, 0.7, 0.7]}>
          
          {/* --- HEAD GROUP --- */}
          <group position={[0, 0.5, 0]}>
              {/* Oversized Glass Helmet */}
              <mesh>
                  <boxGeometry args={[0.85, 0.75, 0.85]} />
                  <meshStandardMaterial 
                    color={colors.helmetGlass} 
                    transparent 
                    opacity={0.3} 
                    roughness={0.1} 
                    metalness={0.9}
                    side={2}
                  />
              </mesh>
              
              {/* Internal Head */}
              <mesh position={[0, -0.05, 0]}>
                  <boxGeometry args={[0.5, 0.45, 0.5]} />
                  <meshStandardMaterial color={colors.skin} roughness={0.3} />
              </mesh>
              
              {/* Stud on head (Lego Style) */}
              <mesh position={[0, 0.2, 0]}>
                  <boxGeometry args={[0.2, 0.1, 0.2]} />
                  <meshStandardMaterial color={colors.skin} roughness={0.3} />
              </mesh>

              {!faceTexture && (
                  <>
                    <mesh position={[-0.15, 0, 0.26]}>
                        <boxGeometry args={[0.08, 0.08, 0.02]} />
                        <meshStandardMaterial color={colors.dark} />
                    </mesh>
                    <mesh position={[0.15, 0, 0.26]}>
                        <boxGeometry args={[0.08, 0.08, 0.02]} />
                        <meshStandardMaterial color={colors.dark} />
                    </mesh>
                  </>
              )}

              {faceTexture && (
                <mesh position={[0, -0.05, 0.26]} rotation={[0, 0, 0]}>
                    <planeGeometry args={[0.4, 0.4]} />
                    <meshBasicMaterial 
                        map={faceTexture} 
                        transparent 
                        depthWrite={false} 
                        toneMapped={false}
                    />
                </mesh>
              )}
          </group>

          {/* --- BODY GROUP --- */}
          <group position={[0, -0.1, 0]}>
              <mesh position={[0, 0, 0]}>
                  <boxGeometry args={[0.4, 0.4, 0.25]} />
                  <meshStandardMaterial color={colors.suit} roughness={0.4} />
              </mesh>
              
              <mesh position={[0, 0, 0.13]}>
                   <boxGeometry args={[0.2, 0.25, 0.02]} />
                   <meshStandardMaterial color={colors.secondary} />
              </mesh>

              <mesh position={[0, 0.1, -0.2]}>
                  <boxGeometry args={[0.35, 0.55, 0.25]} />
                  <meshStandardMaterial color={colors.tank} roughness={0.2} />
              </mesh>
              
              <mesh position={[0, 0.4, -0.2]}>
                   <boxGeometry args={[0.15, 0.1, 0.1]} />
                   <meshStandardMaterial color="#94a3b8" />
              </mesh>
          </group>

          {/* --- LIMBS --- */}
          {/* Arms */}
          <mesh 
            position={[-0.3, 0, 0]} 
            rotation={[isPhotoPose && !isSpinningRef.current ? 0 : (isSwimming ? 2.8 : 0.2), 0, -0.3]}
          >
              <boxGeometry args={[0.18, 0.35, 0.18]} />
              <meshStandardMaterial color={colors.suit} roughness={0.4} />
          </mesh>

          <mesh 
            position={[0.3, 0, 0]} 
            rotation={[isPhotoPose && !isSpinningRef.current ? 0 : (isSwimming ? 2.8 : 0.2), 0, 0.3]}
          >
              <boxGeometry args={[0.18, 0.35, 0.18]} />
              <meshStandardMaterial color={colors.suit} roughness={0.4} />
          </mesh>

          {/* Legs */}
          <group position={[-0.12, -0.25, 0]} rotation={[isPhotoPose && !isSpinningRef.current ? 0 : 0.2, 0, 0]}>
              <group rotation={[getFlipperRot(Date.now()/1000, 0), 0, 0]}>
                  <mesh position={[0, -0.1, 0]}>
                      <boxGeometry args={[0.15, 0.25, 0.15]} />
                      <meshStandardMaterial color={colors.suit} />
                  </mesh>
                  <mesh position={[0, -0.3, 0.1]} rotation={[-0.2, 0, 0]}>
                      <boxGeometry args={[0.2, 0.05, 0.4]} />
                      <meshStandardMaterial color={colors.flipper} />
                  </mesh>
              </group>
          </group>

          <group position={[0.12, -0.25, 0]} rotation={[isPhotoPose && !isSpinningRef.current ? 0 : 0.2, 0, 0]}>
              <group rotation={[getFlipperRot(Date.now()/1000, Math.PI), 0, 0]}>
                  <mesh position={[0, -0.1, 0]}>
                      <boxGeometry args={[0.15, 0.25, 0.15]} />
                      <meshStandardMaterial color={colors.suit} />
                  </mesh>
                   <mesh position={[0, -0.3, 0.1]} rotation={[-0.2, 0, 0]}>
                      <boxGeometry args={[0.2, 0.05, 0.4]} />
                      <meshStandardMaterial color={colors.flipper} />
                  </mesh>
              </group>
          </group>

          <Bubbles isSwimming={isSwimming} />
      </group>
    </group>
  );
});

VoxelCharacter.displayName = 'VoxelCharacter';