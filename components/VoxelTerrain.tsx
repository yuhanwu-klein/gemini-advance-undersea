import React, { useRef, useLayoutEffect, useMemo } from 'react';
import * as THREE from 'three';
import { TerrainData } from '../types';

// Must match the generator
const BLOCK_SIZE = 0.15;

interface VoxelTerrainProps {
  terrainData: TerrainData;
}

// A helper component to render a "Lego" layer
// It renders the base blocks AND the studs on top as separate instanced meshes for performance
const LegoLayer = ({ 
    instances, 
    color, 
    opacity = 1.0, 
    transparent = false, 
    emissive, 
    emissiveIntensity,
    customColors,
    hasStuds = true
}: { 
    instances: any[], 
    color?: string, 
    opacity?: number, 
    transparent?: boolean, 
    emissive?: string, 
    emissiveIntensity?: number,
    customColors?: Float32Array,
    hasStuds?: boolean
}) => {
    const meshRef = useRef<THREE.InstancedMesh>(null);
    const studRef = useRef<THREE.InstancedMesh>(null);

    useLayoutEffect(() => {
        if (meshRef.current) {
            instances.forEach((m, i) => meshRef.current!.setMatrixAt(i, m));
            meshRef.current.instanceMatrix.needsUpdate = true;
            
            if (customColors && meshRef.current.instanceColor) {
                const c = new THREE.Color();
                for (let i = 0; i < instances.length; i++) {
                    c.setRGB(customColors[i*3], customColors[i*3+1], customColors[i*3+2]);
                    meshRef.current.setColorAt(i, c);
                }
                meshRef.current.instanceColor.needsUpdate = true;
            }
        }
        
        if (hasStuds && studRef.current) {
            instances.forEach((m, i) => studRef.current!.setMatrixAt(i, m));
            studRef.current.instanceMatrix.needsUpdate = true;

            if (customColors && studRef.current.instanceColor) {
                const c = new THREE.Color();
                for (let i = 0; i < instances.length; i++) {
                    c.setRGB(customColors[i*3], customColors[i*3+1], customColors[i*3+2]);
                    studRef.current.setColorAt(i, c);
                }
                studRef.current.instanceColor.needsUpdate = true;
            }
        }
    }, [instances, customColors, hasStuds]);

    const plasticMaterial = useMemo(() => new THREE.MeshStandardMaterial({
        color: color || '#ffffff',
        roughness: 0.2, // Very glossy
        metalness: 0.0, // Plastic, not metal
        transparent: transparent,
        opacity: opacity,
        emissive: emissive || '#000000',
        emissiveIntensity: emissiveIntensity || 0,
        envMapIntensity: 1.0
    }), [color, opacity, transparent, emissive, emissiveIntensity]);

    // Box Geometry slightly bevelled via scaling? No, hard edges for Lego look
    const boxGeo = useMemo(() => new THREE.BoxGeometry(BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE), []);
    
    // Stud Geometry
    const studDiameter = BLOCK_SIZE * 0.6;
    const studHeight = BLOCK_SIZE * 0.2;
    const studGeo = useMemo(() => {
        const geo = new THREE.CylinderGeometry(studDiameter/2, studDiameter/2, studHeight, 8);
        geo.translate(0, (BLOCK_SIZE/2) + (studHeight/2), 0); // Move to top of block
        return geo;
    }, [studDiameter, studHeight]);

    return (
        <group>
            <instancedMesh ref={meshRef} args={[boxGeo, plasticMaterial, instances.length]} castShadow receiveShadow>
                {customColors && <instancedBufferAttribute attach="instanceColor" args={[customColors, 3]} />}
            </instancedMesh>
            
            {hasStuds && (
                <instancedMesh ref={studRef} args={[studGeo, plasticMaterial, instances.length]} receiveShadow>
                     {customColors && <instancedBufferAttribute attach="instanceColor" args={[customColors, 3]} />}
                </instancedMesh>
            )}
        </group>
    );
};

export const VoxelTerrain: React.FC<VoxelTerrainProps> = ({ terrainData }) => {
  return (
    <group>
      {/* Sand Floor - Light Cyan/White for Blue Tone */}
      <LegoLayer instances={terrainData.sandInstances} color="#ecfeff" />

      {/* Stone Ruins - Cool Slate */}
      <LegoLayer instances={terrainData.stoneInstances} color="#64748b" />

      {/* Stone Pillars */}
      <LegoLayer instances={terrainData.columnInstances} color="#94a3b8" />
      
      {/* Small Rocks */}
      <LegoLayer instances={terrainData.smallRockInstances} color="#475569" hasStuds={false} />

      {/* GLOWING RUNES */}
      <LegoLayer 
        instances={terrainData.runeInstances} 
        color="#22d3ee" 
        emissive="#22d3ee" 
        emissiveIntensity={2} 
        hasStuds={false} // Runes are smooth
      />
      
      {/* Kelp (Tall) */}
      <LegoLayer instances={terrainData.kelpInstances} color="#2dd4bf" />

      {/* Seagrass (Short) */}
      <LegoLayer instances={terrainData.grassInstances} color="#6ee7b7" opacity={0.9} transparent />

      {/* Starfish - Flat */}
      <LegoLayer instances={terrainData.starfishInstances} color="#fca5a5" hasStuds={true} />

      {/* Anemones */}
      <LegoLayer instances={terrainData.anemoneInstances} color="#fb7185" emissive="#fb7185" emissiveIntensity={0.2} />

      {/* Sea Flowers */}
      <LegoLayer instances={terrainData.flowerInstances} color="#e879f9" emissive="#e879f9" emissiveIntensity={0.2} />

      {/* Coral (Multi-colored) */}
      <LegoLayer 
        instances={terrainData.coralInstances} 
        customColors={terrainData.coralColors}
      />

      {/* Sea Lanterns - Warm Gold */}
      <LegoLayer instances={terrainData.lampInstances} color="#fcd34d" emissive="#fcd34d" emissiveIntensity={0.5} />
    </group>
  );
};