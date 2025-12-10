import React, { useRef, useLayoutEffect } from 'react';
import * as THREE from 'three';
import { TerrainData } from '../types';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }
}

// Must match the generator
const BLOCK_SIZE = 0.2;

interface VoxelTerrainProps {
  terrainData: TerrainData;
}

export const VoxelTerrain: React.FC<VoxelTerrainProps> = ({ terrainData }) => {
  const sandRef = useRef<THREE.InstancedMesh>(null);
  const stoneRef = useRef<THREE.InstancedMesh>(null);
  const runeRef = useRef<THREE.InstancedMesh>(null);
  const lampRef = useRef<THREE.InstancedMesh>(null);
  const kelpRef = useRef<THREE.InstancedMesh>(null);
  const grassRef = useRef<THREE.InstancedMesh>(null);
  const coralRef = useRef<THREE.InstancedMesh>(null);
  const starfishRef = useRef<THREE.InstancedMesh>(null);
  const flowerRef = useRef<THREE.InstancedMesh>(null);
  const columnRef = useRef<THREE.InstancedMesh>(null);

  useLayoutEffect(() => {
    const apply = (ref: React.RefObject<THREE.InstancedMesh>, data: any[]) => {
        if (ref.current) {
            data.forEach((m, i) => ref.current!.setMatrixAt(i, m));
            ref.current.instanceMatrix.needsUpdate = true;
        }
    };

    apply(sandRef, terrainData.sandInstances);
    apply(stoneRef, terrainData.stoneInstances);
    apply(runeRef, terrainData.runeInstances);
    apply(lampRef, terrainData.lampInstances);
    apply(kelpRef, terrainData.kelpInstances);
    apply(grassRef, terrainData.grassInstances);
    apply(coralRef, terrainData.coralInstances);
    apply(starfishRef, terrainData.starfishInstances);
    apply(flowerRef, terrainData.flowerInstances);
    apply(columnRef, terrainData.columnInstances);

    if (coralRef.current) {
        const c = new THREE.Color();
        const colors = terrainData.coralColors;
        for (let i = 0; i < terrainData.coralInstances.length; i++) {
            c.setRGB(colors[i*3], colors[i*3+1], colors[i*3+2]);
            coralRef.current.setColorAt(i, c);
        }
        if (coralRef.current.instanceColor) coralRef.current.instanceColor.needsUpdate = true;
    }

  }, [terrainData]);

  const geoArgs: [number, number, number] = [BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE];

  // Material settings for "Lego" plastic look
  const plasticProps = { roughness: 0.4, metalness: 0.1 };

  return (
    <group>
      {/* Sand Floor - Creamy/Soft */}
      <instancedMesh ref={sandRef} args={[undefined, undefined, terrainData.sandInstances.length]} receiveShadow>
        <boxGeometry args={geoArgs} />
        <meshStandardMaterial color="#fffbeb" {...plasticProps} />
      </instancedMesh>

      {/* Stone Ruins - Magical Slate */}
      <instancedMesh ref={stoneRef} args={[undefined, undefined, terrainData.stoneInstances.length]} castShadow receiveShadow>
        <boxGeometry args={geoArgs} />
        <meshStandardMaterial color="#64748b" {...plasticProps} />
      </instancedMesh>

      {/* Stone Pillars - Slightly lighter slate */}
      <instancedMesh ref={columnRef} args={[undefined, undefined, terrainData.columnInstances.length]} castShadow receiveShadow>
        <boxGeometry args={[BLOCK_SIZE * 0.8, BLOCK_SIZE, BLOCK_SIZE * 0.8]} />
        <meshStandardMaterial color="#94a3b8" {...plasticProps} />
      </instancedMesh>

      {/* GLOWING RUNES - Cyan/Magic */}
      <instancedMesh ref={runeRef} args={[undefined, undefined, terrainData.runeInstances.length]}>
        <boxGeometry args={geoArgs} />
        <meshStandardMaterial 
            color="#22d3ee" 
            emissive="#22d3ee" 
            emissiveIntensity={2} 
            toneMapped={false} 
            {...plasticProps} 
        />
      </instancedMesh>
      
      {/* Kelp (Tall) - Pastel Teal */}
      <instancedMesh ref={kelpRef} args={[undefined, undefined, terrainData.kelpInstances.length]} castShadow receiveShadow>
        <boxGeometry args={[BLOCK_SIZE * 0.8, BLOCK_SIZE, BLOCK_SIZE * 0.8]} />
        <meshStandardMaterial color="#2dd4bf" {...plasticProps} />
      </instancedMesh>

      {/* Seagrass (Short) - Pastel Mint */}
      <instancedMesh ref={grassRef} args={[undefined, undefined, terrainData.grassInstances.length]} receiveShadow>
        <boxGeometry args={[BLOCK_SIZE * 0.6, BLOCK_SIZE * 0.8, BLOCK_SIZE * 0.6]} />
        <meshStandardMaterial color="#6ee7b7" transparent opacity={0.9} {...plasticProps} />
      </instancedMesh>

      {/* Starfish - Pastel Pink */}
      <instancedMesh ref={starfishRef} args={[undefined, undefined, terrainData.starfishInstances.length]} receiveShadow>
        <boxGeometry args={[BLOCK_SIZE * 0.8, BLOCK_SIZE * 0.2, BLOCK_SIZE * 0.8]} />
        <meshStandardMaterial color="#fca5a5" {...plasticProps} />
      </instancedMesh>

      {/* Sea Flowers - Lavender */}
      <instancedMesh ref={flowerRef} args={[undefined, undefined, terrainData.flowerInstances.length]}>
        <boxGeometry args={[BLOCK_SIZE * 0.4, BLOCK_SIZE * 0.6, BLOCK_SIZE * 0.4]} />
        <meshStandardMaterial color="#e879f9" emissive="#e879f9" emissiveIntensity={0.2} {...plasticProps} />
      </instancedMesh>

      {/* Coral (Multi-colored) */}
      <instancedMesh ref={coralRef} args={[undefined, undefined, terrainData.coralInstances.length]} castShadow receiveShadow>
        <boxGeometry args={[BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE]} />
        <meshStandardMaterial {...plasticProps} />
      </instancedMesh>

      {/* Sea Lanterns - Warm Gold */}
       <instancedMesh ref={lampRef} args={[undefined, undefined, terrainData.lampInstances.length]}>
        <boxGeometry args={[BLOCK_SIZE * 0.8, BLOCK_SIZE * 0.8, BLOCK_SIZE * 0.8]} />
        <meshBasicMaterial color="#fcd34d" />
      </instancedMesh>
    </group>
  );
};