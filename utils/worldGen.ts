import * as THREE from 'three';
import { TerrainData, MapPOI } from '../types';

export const BLOCK_SIZE = 0.2; // Tiny Lego-like blocks

export const generateTerrain = (widthCount: number, depthCount: number): TerrainData => {
    const sand: THREE.Matrix4[] = [];
    const stone: THREE.Matrix4[] = [];
    const runes: THREE.Matrix4[] = [];
    const lamps: THREE.Matrix4[] = [];
    const kelp: THREE.Matrix4[] = [];
    const grass: THREE.Matrix4[] = [];
    const coral: THREE.Matrix4[] = [];
    const starfish: THREE.Matrix4[] = [];
    const flowers: THREE.Matrix4[] = [];
    const columns: THREE.Matrix4[] = [];
    
    const cColors: number[] = [];
    const mapPOIs: MapPOI[] = [];

    const tempMatrix = new THREE.Matrix4();
    const tempColor = new THREE.Color();
    const tempQuat = new THREE.Quaternion();
    const tempScale = new THREE.Vector3();
    const tempPos = new THREE.Vector3();
    
    // Pastel Magical Palette
    const coralPalette = [
        0xf472b6, // Pink 400
        0xc084fc, // Purple 400
        0x22d3ee, // Cyan 400
        0x34d399, // Emerald 400
        0xffb7b2, // Pastel Red
        0xffdac1, // Pastel Orange
        0xe2f0cb, // Pastel Green
        0xb5ead7, // Pastel Mint
        0xc7ceea  // Pastel Purple
    ];
    // Convert hex to css string helper
    const hexToCss = (hex: number) => '#' + new THREE.Color(hex).getHexString();

    const halfWidth = widthCount / 2;
    const halfDepth = depthCount / 2;

    for (let x = -halfWidth; x < halfWidth; x++) {
      for (let z = -halfDepth; z < halfDepth; z++) {
        // Physical coordinates
        const px = x * BLOCK_SIZE;
        const pz = z * BLOCK_SIZE;

        // Multi-octave noise for "Delicate" rolling hills
        // Base layer (Large hills)
        const baseNoise = Math.sin(px * 0.03) * Math.cos(pz * 0.03);
        // Detail layer (Small bumps)
        const detailNoise = Math.sin(px * 0.1 + pz * 0.05) * 0.3;
        
        const noise = baseNoise + detailNoise;
        const physicalHeight = noise * 3 - 5.5; // Deeper overall floor
        
        // Convert physical height to block index height
        const yIndex = Math.floor(physicalHeight / BLOCK_SIZE);
        const py = yIndex * BLOCK_SIZE;
        
        // 1. Floor (Magical Sand - Cream/Soft Pink)
        tempMatrix.makeTranslation(px, py, pz);
        sand.push(tempMatrix.clone());

        const surfaceYIndex = yIndex + 1;
        const surfacePY = surfaceYIndex * BLOCK_SIZE;
        
        const rand = Math.random();
        
        // Vegetation noise map
        const vegDensity = Math.sin(px * 0.08) * Math.cos(pz * 0.08);

        // 2. RUINS & PILLARS (Ancient Magical Stones)
        // More structured generation
        if (rand > 0.9996) {
          const isPillar = Math.random() > 0.5;
          const heightBlocks = Math.floor(Math.random() * 12) + 6;
          
          if (isPillar) {
             // Broken Column
             for (let h = 0; h < heightBlocks; h++) {
                 tempMatrix.makeTranslation(px, surfacePY + (h * BLOCK_SIZE), pz);
                 columns.push(tempMatrix.clone());
             }
          } else {
             // Rune Monolith
             for (let h = 0; h < heightBlocks; h++) {
                tempMatrix.makeTranslation(px, surfacePY + (h * BLOCK_SIZE), pz);
                // Chance to be a GLOWING RUNE block
                if (Math.random() > 0.8) {
                    runes.push(tempMatrix.clone());
                } else {
                    stone.push(tempMatrix.clone());
                }
             }
             // Lamp on top
             tempMatrix.makeTranslation(px, surfacePY + (heightBlocks * BLOCK_SIZE), pz);
             lamps.push(tempMatrix.clone());
             mapPOIs.push({ x: px, z: pz, type: 'ruin' });
          }
          continue; // Block occupied
        }

        // 3. KELP FOREST (Pastel Green/Teal) - Denser patches
        if (vegDensity > 0.6 && rand > 0.92) { 
             const heightBlocks = Math.floor(Math.random() * 25) + 5;
             for (let h = 0; h < heightBlocks; h++) {
                tempMatrix.makeTranslation(px, surfacePY + (h * BLOCK_SIZE), pz);
                kelp.push(tempMatrix.clone());
             }
             if (Math.random() > 0.995) mapPOIs.push({ x: px, z: pz, type: 'kelp' });
             continue;
        }

        // 4. SEAGRASS (Pastel Mint)
        if (vegDensity > 0.3 && rand > 0.9) {
            tempMatrix.makeTranslation(px, surfacePY, pz);
            grass.push(tempMatrix.clone());
            continue;
        }

        // 5. DELICATE DECORATIONS
        
        // Starfish (Rare, flat on sand)
        if (rand < 0.005 && vegDensity < 0) {
            tempPos.set(px, surfacePY, pz);
            tempQuat.setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.random() * Math.PI);
            tempScale.set(1, 1, 1);
            tempMatrix.compose(tempPos, tempQuat, tempScale);
            starfish.push(tempMatrix.clone());
            continue;
        }

        // Sea Flowers (Small patches)
        if (rand > 0.4 && rand < 0.41 && vegDensity > 0) {
             tempMatrix.makeTranslation(px, surfacePY, pz);
             flowers.push(tempMatrix.clone());
             continue;
        }

        // 6. CORAL REEFS
        if (rand < 0.003) { 
             const colorHex = coralPalette[Math.floor(Math.random() * coralPalette.length)];
             tempColor.setHex(colorHex);
             const cssColor = hexToCss(colorHex);
             
             // Base
             tempMatrix.makeTranslation(px, surfacePY, pz);
             coral.push(tempMatrix.clone());
             cColors.push(tempColor.r, tempColor.g, tempColor.b);
             mapPOIs.push({ x: px, z: pz, type: 'coral', color: cssColor });

             // Cute stacked shapes
             const shapeType = Math.floor(Math.random() * 4);
             
             if (shapeType === 0) { // Tiny tower
                tempMatrix.makeTranslation(px, surfacePY + BLOCK_SIZE, pz);
                coral.push(tempMatrix.clone());
                cColors.push(tempColor.r, tempColor.g, tempColor.b);
             } else if (shapeType === 1) { // Cross
                const dx = BLOCK_SIZE;
                tempMatrix.makeTranslation(px + dx, surfacePY, pz);
                coral.push(tempMatrix.clone());
                cColors.push(tempColor.r, tempColor.g, tempColor.b);
             }
        }
      }
    }
    
    return {
        sandInstances: sand,
        stoneInstances: stone,
        runeInstances: runes,
        lampInstances: lamps,
        kelpInstances: kelp,
        grassInstances: grass,
        coralInstances: coral,
        coralColors: new Float32Array(cColors),
        starfishInstances: starfish,
        flowerInstances: flowers,
        columnInstances: columns,
        mapPOIs
    };
};