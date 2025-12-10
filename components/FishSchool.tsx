import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { FishSpecies } from '../types';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }
}

interface FishSchoolProps {
  species: FishSpecies;
  position: [number, number, number];
  onScan: (species: FishSpecies | null) => void;
}

export const FishSchool: React.FC<FishSchoolProps> = ({ species, position, onScan }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const { camera } = useThree();
  const schoolCenter = useMemo(() => new THREE.Vector3(...position), [position]);
  const isScannedRef = useRef(false);

  // Generate individual fish data
  const particles = useMemo(() => {
    const temp = [];
    const spread = species.behavior === 'solitary' ? 2 : (species.behavior === 'school' ? 5 : 15);
    
    for (let i = 0; i < species.count; i++) {
      const t = Math.random() * 100;
      const factor = 5 + Math.random() * 10;
      const speed = species.speed * (0.8 + Math.random() * 0.4);
      
      // Random offset from school center
      const xFactor = (Math.random() - 0.5) * spread;
      const yFactor = (Math.random() - 0.5) * spread * 0.5;
      const zFactor = (Math.random() - 0.5) * spread;
      
      temp.push({ t, factor, speed, xFactor, yFactor, zFactor });
    }
    return temp;
  }, [species]);

  const dummy = useMemo(() => new THREE.Object3D(), []);

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

    const tGlobal = state.clock.elapsedTime;

    particles.forEach((particle, i) => {
      let { t, factor, speed, xFactor, yFactor, zFactor } = particle;
      t = particle.t += speed;

      // Behavior Logic
      let x = 0, y = 0, z = 0;
      
      if (species.behavior === 'solitary') {
          // Solitary (Shark): Wide slow circles
          x = schoolCenter.x + Math.cos(t * 0.2) * 8;
          y = schoolCenter.y + Math.sin(t * 0.1) * 2;
          z = schoolCenter.z + Math.sin(t * 0.2) * 8;
      } else if (species.behavior === 'school') {
          // School (Sardine/Clownfish): Tight synchronized movement with noise
          const a = Math.cos(t) + Math.sin(t * 1) / 10;
          const b = Math.sin(t) + Math.cos(t * 2) / 10;
          x = schoolCenter.x + xFactor + Math.cos((t / 10) * factor) + (Math.sin(t * 1) * factor) / 10;
          y = schoolCenter.y + yFactor + Math.sin((t / 10) * factor);
          z = schoolCenter.z + zFactor + Math.cos((t / 10) * factor);
      } else {
          // Wander (Goldfish/Tang): Random drifting
          x = schoolCenter.x + xFactor + Math.sin(t * 0.5 + i) * 3;
          y = schoolCenter.y + yFactor + Math.cos(t * 0.3 + i) * 2;
          z = schoolCenter.z + zFactor + Math.sin(t * 0.4 + i) * 3;
      }

      dummy.position.set(x, y, z);

      // Orientation (Look forward)
      // Calculate next position for lookAt
      const lookT = t + 0.1;
      let lx = x, ly = y, lz = z;
       if (species.behavior === 'solitary') {
          lx = schoolCenter.x + Math.cos(lookT * 0.2) * 8;
          ly = schoolCenter.y + Math.sin(lookT * 0.1) * 2;
          lz = schoolCenter.z + Math.sin(lookT * 0.2) * 8;
      } else if (species.behavior === 'school') {
          lx = schoolCenter.x + xFactor + Math.cos((lookT / 10) * factor) + (Math.sin(lookT * 1) * factor) / 10;
          ly = schoolCenter.y + yFactor + Math.sin((lookT / 10) * factor);
          lz = schoolCenter.z + zFactor + Math.cos((lookT / 10) * factor);
      } else {
          lx = schoolCenter.x + xFactor + Math.sin(lookT * 0.5 + i) * 3;
          ly = schoolCenter.y + yFactor + Math.cos(lookT * 0.3 + i) * 2;
          lz = schoolCenter.z + zFactor + Math.sin(lookT * 0.4 + i) * 3;
      }
      
      dummy.lookAt(lx, ly, lz);
      dummy.scale.setScalar(1);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    });
    
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, species.count]}>
      <boxGeometry args={species.scale} />
      <meshStandardMaterial 
        color={species.color} 
        roughness={0.4}
        metalness={0.1}
      />
    </instancedMesh>
  );
};