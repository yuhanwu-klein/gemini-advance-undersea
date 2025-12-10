import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      instancedMesh: any;
      boxGeometry: any;
      meshStandardMaterial: any;
    }
  }
}

export const FishSwarm: React.FC<{ count: number }> = ({ count }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const colors = useMemo(() => new Float32Array(count * 3), [count]);

  // Magical Pastel Fish Colors
  const palette = [
    new THREE.Color("#fca5a5"), // Red
    new THREE.Color("#fcd34d"), // Amber
    new THREE.Color("#6ee7b7"), // Emerald
    new THREE.Color("#93c5fd"), // Blue
    new THREE.Color("#c4b5fd"), // Violet
    new THREE.Color("#f0abfc"), // Fuchsia
  ];

  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < count; i++) {
      const t = Math.random() * 100;
      const factor = 15 + Math.random() * 15;
      const speed = 0.005 + Math.random() / 100; // Slower, relaxed
      const xFactor = -15 + Math.random() * 30;
      const yFactor = -5 + Math.random() * 15;
      const zFactor = -15 + Math.random() * 30;
      
      // Color
      const color = palette[Math.floor(Math.random() * palette.length)];
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;

      temp.push({ t, factor, speed, xFactor, yFactor, zFactor, mx: 0, my: 0 });
    }
    return temp;
  }, [count]);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame(() => {
    if (!meshRef.current) return;

    particles.forEach((particle, i) => {
      let { t, factor, speed, xFactor, yFactor, zFactor } = particle;
      t = particle.t += speed;
      const a = Math.cos(t) + Math.sin(t * 1) / 10;
      const b = Math.sin(t) + Math.cos(t * 2) / 10;
      
      // Lissajous curve motion
      dummy.position.set(
        (particle.mx / 10) * a + xFactor + Math.cos((t / 10) * factor) + (Math.sin(t * 1) * factor) / 10,
        (particle.my / 10) * b + yFactor + Math.sin((t / 10) * factor) + (Math.cos(t * 2) * factor) / 10,
        (particle.my / 10) * b + zFactor + Math.cos((t / 10) * factor) + (Math.sin(t * 3) * factor) / 10
      );
      
      // Look forward
      const lookTarget = new THREE.Vector3(
         (particle.mx / 10) * a + xFactor + Math.cos(((t + 0.1) / 10) * factor) + (Math.sin((t + 0.1) * 1) * factor) / 10,
         (particle.my / 10) * b + yFactor + Math.sin(((t + 0.1) / 10) * factor) + (Math.cos((t + 0.1) * 2) * factor) / 10,
         (particle.my / 10) * b + zFactor + Math.cos(((t + 0.1) / 10) * factor) + (Math.sin((t + 0.1) * 3) * factor) / 10
      );
      dummy.lookAt(lookTarget);

      dummy.scale.setScalar(1); // Scale managed by geometry
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    });
    
    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
  });

  return (
    <>
      <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
        {/* Chubby Cube Fish */}
        <boxGeometry args={[0.25, 0.2, 0.2]} />
        <meshStandardMaterial 
            color="#ffffff" 
            roughness={0.4} 
            metalness={0.1}
        />
        <instancedBufferAttribute attach="instanceColor" args={[colors, 3]} />
      </instancedMesh>
    </>
  );
};