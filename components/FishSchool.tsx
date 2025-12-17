import React, { useRef, useMemo, useEffect, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { FishSpecies } from '../types';
import { generateFishAmbianceBuffer } from '../utils/audioGen';

interface FishSchoolProps {
  species: FishSpecies;
  position: [number, number, number];
  onScan: (species: FishSpecies | null) => void;
  audioListener?: THREE.AudioListener;
  photoTextureUrl?: string | null;
  isPlayerSwimming?: boolean;
}

export const FishSchool: React.FC<FishSchoolProps> = ({ species, position, onScan, audioListener, photoTextureUrl, isPlayerSwimming = false }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const tailRef = useRef<THREE.InstancedMesh>(null);
  const eyeWhiteRef = useRef<THREE.InstancedMesh>(null);
  const eyePupilRef = useRef<THREE.InstancedMesh>(null);
  
  const tentaclesRef = useRef<THREE.InstancedMesh>(null); // For Jellyfish
  
  const audioRef = useRef<THREE.PositionalAudio>(null);
  const { camera } = useThree();
  const schoolCenter = useMemo(() => new THREE.Vector3(...position), [position]);
  const isScannedRef = useRef(false);
  const buffer = useMemo(() => generateFishAmbianceBuffer(), []);

  // Texture Loading for Photo Jellyfish
  const [texture, setTexture] = useState<THREE.Texture | null>(null);

  const isJelly = species.id === 'jellyfish';

  useEffect(() => {
    let currentTexture: THREE.Texture | null = null;
    if (isJelly && photoTextureUrl) {
       new THREE.TextureLoader().load(photoTextureUrl, (tex) => {
           tex.colorSpace = THREE.SRGBColorSpace;
           tex.minFilter = THREE.NearestFilter;
           tex.magFilter = THREE.NearestFilter;
           currentTexture = tex;
           setTexture(tex);
       });
    } else {
        setTexture(null);
    }
    return () => {
        if (currentTexture) currentTexture.dispose();
    };
  }, [isJelly, photoTextureUrl]);

  // Initialize particles
  const boids = useMemo(() => {
    const temp = [];
    for (let i = 0; i < species.count; i++) {
        const x = (Math.random() - 0.5) * 8;
        const y = (Math.random() - 0.5) * 4;
        const z = (Math.random() - 0.5) * 8;
        const vx = (Math.random() - 0.5) * species.speed;
        const vy = (Math.random() - 0.5) * species.speed * 0.1;
        const vz = (Math.random() - 0.5) * species.speed;

        temp.push({
            position: new THREE.Vector3(x, y, z),
            velocity: new THREE.Vector3(vx, vy, vz).normalize().multiplyScalar(species.speed),
            acceleration: new THREE.Vector3(),
            phaseOffset: Math.random() * 100 
        });
    }
    return temp;
  }, [species]);

  const dummy = useMemo(() => new THREE.Object3D(), []);
  const tailDummy = useMemo(() => new THREE.Object3D(), []);
  const eyeDummy = useMemo(() => new THREE.Object3D(), []);
  const tentacleDummy = useMemo(() => new THREE.Object3D(), []);

  // Geometries
  const tailGeo = useMemo(() => new THREE.BoxGeometry(species.scale[0] * 0.5, species.scale[1] * 0.7, species.scale[2] * 0.4), [species]);
  
  const eyeSize = Math.min(species.scale[0], species.scale[1]) * 0.35;
  const eyeGeo = useMemo(() => new THREE.BoxGeometry(eyeSize, eyeSize, 0.05), [eyeSize]);
  const pupilGeo = useMemo(() => new THREE.BoxGeometry(eyeSize * 0.4, eyeSize * 0.4, 0.06), [eyeSize]);

  useEffect(() => {
    if (audioRef.current && !audioRef.current.isPlaying) {
        audioRef.current.setBuffer(buffer);
        audioRef.current.setLoop(true);
        audioRef.current.setRefDistance(5);
        audioRef.current.setVolume(0.3);
        audioRef.current.play();
    }
  }, [buffer]);

  useFrame((state) => {
    if (!meshRef.current) return;
    
    // Proximity Check
    const dist = camera.position.distanceTo(schoolCenter);
    if (dist < 10 && !isScannedRef.current) {
        isScannedRef.current = true;
        onScan(species);
    } else if (dist > 15 && isScannedRef.current) {
        isScannedRef.current = false;
        onScan(null);
    }

    const t = state.clock.elapsedTime;
    
    // Ghost Fish Transparency
    if (species.id === 'ghost') {
        const opacity = 0.1 + (Math.sin(t * 2) * 0.5 + 0.5) * 0.5;
        const updateMat = (ref: React.RefObject<THREE.InstancedMesh>) => {
            if (ref.current) {
                const mat = ref.current.material as THREE.MeshStandardMaterial;
                mat.transparent = true;
                mat.opacity = opacity;
                mat.needsUpdate = true;
            }
        };
        updateMat(meshRef);
        if (!isJelly) {
            updateMat(tailRef);
            // Eyes stay opaque or ghost eyes? Let's make eyes ghostly too
            // updateMat(eyeWhiteRef); 
        }
    }

    // Boids Simulation
    const perceptionRadius = 2.5;
    const maxSpeed = species.speed;
    const maxForce = species.speed * 0.1;
    
    let alignmentWeight = 1.0;
    let cohesionWeight = 2.0; 
    let separationWeight = 1.3; 
    let centeringWeight = 0.5; 

    if (species.behavior === 'solitary') {
        alignmentWeight = 0.1; cohesionWeight = 0; separationWeight = 3.0; centeringWeight = 0.1; 
    } else if (species.behavior === 'wander') {
        cohesionWeight = 0.8; alignmentWeight = 0.5;
    }

    const localPlayerPos = camera.position.clone().sub(schoolCenter);

    for (let i = 0; i < species.count; i++) {
        const current = boids[i];
        const alignment = new THREE.Vector3();
        const cohesion = new THREE.Vector3();
        const separation = new THREE.Vector3();
        let total = 0;

        for (let j = 0; j < species.count; j++) {
            if (i !== j) {
                const other = boids[j];
                const d = current.position.distanceTo(other.position);
                if (d < perceptionRadius) {
                    alignment.add(other.velocity);
                    cohesion.add(other.position);
                    const diff = new THREE.Vector3().subVectors(current.position, other.position);
                    diff.divideScalar(d);
                    separation.add(diff);
                    total++;
                }
            }
        }

        if (total > 0) {
            alignment.divideScalar(total).normalize().multiplyScalar(maxSpeed).sub(current.velocity).clampLength(0, maxForce);
            cohesion.divideScalar(total).sub(current.position).normalize().multiplyScalar(maxSpeed).sub(current.velocity).clampLength(0, maxForce);
            separation.divideScalar(total).normalize().multiplyScalar(maxSpeed).sub(current.velocity).clampLength(0, maxForce);
        }

        current.acceleration.add(alignment.multiplyScalar(alignmentWeight));
        current.acceleration.add(cohesion.multiplyScalar(cohesionWeight));
        current.acceleration.add(separation.multiplyScalar(separationWeight));
        
        const centerDir = new THREE.Vector3().subVectors(new THREE.Vector3(0,0,0), current.position);
        const distToCenter = centerDir.length();
        if (distToCenter > 5) {
             centerDir.normalize().multiplyScalar(maxSpeed).sub(current.velocity).clampLength(0, maxForce * 2);
             current.acceleration.add(centerDir.multiplyScalar(centeringWeight * (distToCenter/5)));
        }

        let scalePulse = 1.0;
        if (isJelly) {
             const distToPlayer = current.position.distanceTo(localPlayerPos);
             if (distToPlayer < 12) {
                 if (isPlayerSwimming) {
                     const fleeDir = new THREE.Vector3().subVectors(current.position, localPlayerPos);
                     fleeDir.normalize().multiplyScalar(maxSpeed);
                     current.acceleration.add(fleeDir.multiplyScalar(5.0)); 
                 } else {
                     const followDir = new THREE.Vector3().subVectors(localPlayerPos, current.position);
                     if (distToPlayer > 3) {
                        followDir.normalize().multiplyScalar(maxSpeed);
                        current.acceleration.add(followDir.multiplyScalar(1.5));
                     }
                     current.phaseOffset += 0.2; 
                     scalePulse = 1 + Math.sin(t * 15 + current.phaseOffset) * 0.15;
                 }
             }
        }

        current.position.add(current.velocity);
        current.velocity.add(current.acceleration);
        current.velocity.clampLength(maxSpeed * 0.5, maxSpeed); 
        current.acceleration.set(0, 0, 0); 

        // Update Body
        dummy.position.copy(current.position);
        
        if (isJelly) {
             dummy.position.y += Math.sin(t * 2 + current.phaseOffset) * 0.1;
             dummy.rotation.set(0, 0, 0); 
             
             const distToPlayer = current.position.distanceTo(localPlayerPos);
             if (distToPlayer < 12 && !isPlayerSwimming) {
                  const targetPos = localPlayerPos.clone();
                  const angle = Math.atan2(targetPos.x - current.position.x, targetPos.z - current.position.z);
                  dummy.rotation.y = angle;
             } else {
                  dummy.rotation.y = Math.atan2(current.velocity.x, current.velocity.z);
             }
             dummy.scale.setScalar(scalePulse);
        } else {
             const lookTarget = current.position.clone().add(current.velocity);
             dummy.lookAt(lookTarget);
             dummy.scale.setScalar(1);
        }
        
        dummy.updateMatrix();
        meshRef.current.setMatrixAt(i, dummy.matrix);

        // Update Extras (Tail/Eyes or Tentacles)
        if (isJelly && tentaclesRef.current) {
            tentacleDummy.position.copy(dummy.position);
            tentacleDummy.position.y -= 0.35; 
            const wiggle = Math.sin(t * 5 + current.phaseOffset);
            tentacleDummy.scale.set(0.6 * scalePulse, (0.8 + wiggle * 0.2) * scalePulse, 0.6 * scalePulse); 
            tentacleDummy.rotation.set(wiggle * 0.1, dummy.rotation.y, wiggle * 0.1);
            tentacleDummy.updateMatrix();
            tentaclesRef.current.setMatrixAt(i, tentacleDummy.matrix);
        } 
        else if (!isJelly && tailRef.current && eyeWhiteRef.current && eyePupilRef.current) {
            // Tail Wiggle
            const wiggle = Math.sin(t * 15 + current.phaseOffset) * 0.5;
            tailDummy.copy(dummy);
            tailDummy.translateZ(-species.scale[2] * 0.55);
            tailDummy.rotateY(wiggle);
            tailDummy.updateMatrix();
            tailRef.current.setMatrixAt(i, tailDummy.matrix);

            // Left Eye
            eyeDummy.copy(dummy);
            eyeDummy.translateX(species.scale[0] * 0.5 + 0.01);
            eyeDummy.translateY(species.scale[1] * 0.1);
            eyeDummy.translateZ(species.scale[2] * 0.3);
            eyeDummy.rotateY(Math.PI / 2);
            eyeDummy.updateMatrix();
            eyeWhiteRef.current.setMatrixAt(i * 2, eyeDummy.matrix);
            
            const pupilDummyL = eyeDummy.clone();
            pupilDummyL.translateZ(0.02);
            pupilDummyL.updateMatrix();
            eyePupilRef.current.setMatrixAt(i * 2, pupilDummyL.matrix);

            // Right Eye
            eyeDummy.copy(dummy);
            eyeDummy.translateX(-species.scale[0] * 0.5 - 0.01);
            eyeDummy.translateY(species.scale[1] * 0.1);
            eyeDummy.translateZ(species.scale[2] * 0.3);
            eyeDummy.rotateY(-Math.PI / 2);
            eyeDummy.updateMatrix();
            eyeWhiteRef.current.setMatrixAt(i * 2 + 1, eyeDummy.matrix);
            
            const pupilDummyR = eyeDummy.clone();
            pupilDummyR.translateZ(0.02);
            pupilDummyR.updateMatrix();
            eyePupilRef.current.setMatrixAt(i * 2 + 1, pupilDummyR.matrix);
        }
    }
    
    meshRef.current.instanceMatrix.needsUpdate = true;
    if (tentaclesRef.current) tentaclesRef.current.instanceMatrix.needsUpdate = true;
    if (tailRef.current) tailRef.current.instanceMatrix.needsUpdate = true;
    if (eyeWhiteRef.current) eyeWhiteRef.current.instanceMatrix.needsUpdate = true;
    if (eyePupilRef.current) eyePupilRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <group position={position}>
       {audioListener && <positionalAudio ref={audioRef} args={[audioListener]} />}
       
       {/* Main Body */}
       <instancedMesh ref={meshRef} args={[undefined, undefined, species.count]} castShadow receiveShadow>
        <boxGeometry args={species.scale} />
        <meshStandardMaterial 
            color={texture ? '#ffffff' : species.color}
            map={texture}
            roughness={0.2}
            metalness={0.1}
            transparent={species.id === 'ghost' || species.id === 'jellyfish'}
            opacity={species.id === 'ghost' ? 0.6 : (species.id === 'jellyfish' ? (texture ? 0.9 : 0.6) : 1.0)}
            emissive={species.color}
            emissiveIntensity={texture ? 0.2 : (species.id === 'jellyfish' ? 0.4 : 0)}
            toneMapped={!texture}
        />
       </instancedMesh>

       {/* Tail (Non-Jellyfish) */}
       {!isJelly && (
           <instancedMesh ref={tailRef} args={[tailGeo, undefined, species.count]} castShadow receiveShadow>
               <meshStandardMaterial 
                   color={species.color}
                   roughness={0.2}
                   metalness={0.1}
                   transparent={species.id === 'ghost'}
                   opacity={species.id === 'ghost' ? 0.6 : 1.0}
               />
           </instancedMesh>
       )}

       {/* Eyes (Non-Jellyfish) */}
       {!isJelly && (
           <>
               <instancedMesh ref={eyeWhiteRef} args={[eyeGeo, undefined, species.count * 2]}>
                   <meshStandardMaterial color="#ffffff" roughness={0.1} />
               </instancedMesh>
               <instancedMesh ref={eyePupilRef} args={[pupilGeo, undefined, species.count * 2]}>
                   <meshStandardMaterial color="#000000" roughness={0.1} />
               </instancedMesh>
           </>
       )}

       {/* Tentacles (Jellyfish Only) */}
       {isJelly && (
            <instancedMesh ref={tentaclesRef} args={[undefined, undefined, species.count]}>
                <boxGeometry args={[species.scale[0] * 0.6, species.scale[1], species.scale[2] * 0.6]} />
                <meshStandardMaterial 
                    color={species.color} 
                    transparent 
                    opacity={0.5} 
                    roughness={0.4}
                />
            </instancedMesh>
        )}
    </group>
  );
};