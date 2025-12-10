import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { FishSpecies } from '../types';
import { generateFishAmbianceBuffer } from '../utils/audioGen';

interface FishSchoolProps {
  species: FishSpecies;
  position: [number, number, number];
  onScan: (species: FishSpecies | null) => void;
  audioListener?: THREE.AudioListener;
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      positionalAudio: any;
      instancedMesh: any;
      primitive: any;
      [elemName: string]: any;
    }
  }
}

export const FishSchool: React.FC<FishSchoolProps> = ({ species, position, onScan, audioListener }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const audioRef = useRef<THREE.PositionalAudio>(null);
  const { camera } = useThree();
  const schoolCenter = useMemo(() => new THREE.Vector3(...position), [position]);
  const isScannedRef = useRef(false);
  const buffer = useMemo(() => generateFishAmbianceBuffer(), []);

  // Initialize particles with Boid properties
  const boids = useMemo(() => {
    const temp = [];
    for (let i = 0; i < species.count; i++) {
        // Random position within a sphere of radius 5 around center
        const x = (Math.random() - 0.5) * 10;
        const y = (Math.random() - 0.5) * 5;
        const z = (Math.random() - 0.5) * 10;
        
        // Random velocity vector
        const vx = (Math.random() - 0.5) * species.speed;
        const vy = (Math.random() - 0.5) * species.speed * 0.1; // Less vertical movement
        const vz = (Math.random() - 0.5) * species.speed;

        temp.push({
            position: new THREE.Vector3(x, y, z),
            velocity: new THREE.Vector3(vx, vy, vz).normalize().multiplyScalar(species.speed),
            acceleration: new THREE.Vector3(),
            phaseOffset: Math.random() * 100 // For Ghost Fish opacity
        });
    }
    return temp;
  }, [species]);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  // Init Sound
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
    
    // Proximity Check for Scanning
    const dist = camera.position.distanceTo(schoolCenter);
    // Hysteresis for scanning
    if (dist < 10 && !isScannedRef.current) {
        isScannedRef.current = true;
        onScan(species);
    } else if (dist > 15 && isScannedRef.current) {
        isScannedRef.current = false;
        onScan(null);
    }

    const t = state.clock.elapsedTime;
    
    // Ghost Fish Phasing Logic
    if (species.id === 'ghost') {
        const mat = meshRef.current.material as THREE.MeshStandardMaterial;
        mat.transparent = true;
        // Pulse opacity globally based on time, but can be customized per instance if we used instanceColor
        // For simple batching, we'll pulse the whole school or assume standard material
        // To make it look cooler, we will just use time based sine wave for the global material opacity
        mat.opacity = 0.1 + (Math.sin(t * 2) * 0.5 + 0.5) * 0.5;
        mat.needsUpdate = true;
    }

    // --- BOIDS FLOCKING ALGORITHM ---
    // Parameters tailored for different behaviors
    const perceptionRadius = 3.0;
    const maxSpeed = species.speed;
    const maxForce = species.speed * 0.05;
    
    // Weights
    let alignmentWeight = 1.0;
    let cohesionWeight = 1.0;
    let separationWeight = 1.5;
    let centeringWeight = 0.05; // Pull back to school center

    if (species.behavior === 'solitary') {
        alignmentWeight = 0.1;
        cohesionWeight = 0;
        separationWeight = 2.0;
        centeringWeight = 0.02; // Wander more
    } else if (species.behavior === 'wander') {
        cohesionWeight = 0.5;
        alignmentWeight = 0.5;
    }

    // Simulation Step
    for (let i = 0; i < species.count; i++) {
        const current = boids[i];
        const alignment = new THREE.Vector3();
        const cohesion = new THREE.Vector3();
        const separation = new THREE.Vector3();
        let total = 0;

        // Check neighbors
        for (let j = 0; j < species.count; j++) {
            if (i !== j) {
                const other = boids[j];
                const d = current.position.distanceTo(other.position);
                
                if (d < perceptionRadius) {
                    alignment.add(other.velocity);
                    cohesion.add(other.position);
                    
                    const diff = new THREE.Vector3().subVectors(current.position, other.position);
                    diff.divideScalar(d); // Weight by distance
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

        // Apply Forces
        current.acceleration.add(alignment.multiplyScalar(alignmentWeight));
        current.acceleration.add(cohesion.multiplyScalar(cohesionWeight));
        current.acceleration.add(separation.multiplyScalar(separationWeight));
        
        // Centering Force (Keep them near the spawn point/school center)
        const centerDir = new THREE.Vector3().subVectors(new THREE.Vector3(0,0,0), current.position); // relative to local group 0,0,0
        const distToCenter = centerDir.length();
        if (distToCenter > 8) {
             centerDir.normalize().multiplyScalar(maxSpeed).sub(current.velocity).clampLength(0, maxForce * 2);
             current.acceleration.add(centerDir.multiplyScalar(centeringWeight * (distToCenter/5)));
        }

        // Update Physics
        current.position.add(current.velocity);
        current.velocity.add(current.acceleration);
        current.velocity.clampLength(maxSpeed * 0.5, maxSpeed); // Min/Max speed
        current.acceleration.set(0, 0, 0); // Reset accel

        // Update Matrix
        dummy.position.copy(current.position);
        
        // Orient to velocity
        const lookTarget = current.position.clone