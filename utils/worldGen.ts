import * as THREE from 'three';
import { TerrainData, MapPOI, InteractableItem } from '../types';

export const BLOCK_SIZE = 0.15; // Smaller blocks for higher density/detail

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
    const anemones: THREE.Matrix4[] = [];
    const smallRocks: THREE.Matrix4[] = [];
    
    const interactables: InteractableItem[] = [];
    const cColors: number[] = [];
    const mapPOIs: MapPOI[] = [];

    const tempMatrix = new THREE.Matrix4();
    const tempColor = new THREE.Color();
    const tempQuat = new THREE.Quaternion();
    const tempScale = new THREE.Vector3();
    const tempPos = new THREE.Vector3();
    
    // Vibrant Lego Palette
    const coralPalette = [
        0xf472b6, // Pink
        0xa78bfa, // Purple
        0x22d3ee, // Cyan
        0x34d399, // Emerald
        0xfb7185, // Rose
        0xffb7b2, // Pastel Red
        0xffdac1, // Pastel Orange
        0xe2f0cb, // Pastel Green
        0xb5ead7, // Pastel Mint
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

        // Stepped Noise for Lego Look
        // Base layer (Large hills)
        const baseNoise = Math.sin(px * 0.05) * Math.cos(pz * 0.05);
        // Detail layer
        const detailNoise = Math.sin(px * 0.15 + pz * 0.1) * 0.2;
        
        const noise = baseNoise + detailNoise;
        
        // Snap height to integer steps for Lego look
        const physicalHeight = Math.floor((noise * 4 - 6) / BLOCK_SIZE) * BLOCK_SIZE;
        
        const py = physicalHeight;
        
        // 1. Floor (Magical Sand - Lego Baseplate style)
        // We stack 2 blocks deep to ensure no gaps from below
        tempMatrix.makeTranslation(px, py, pz);
        sand.push(tempMatrix.clone());
        
        // Add a "foundation" block below to prevent holes in steep terrain
        tempMatrix.makeTranslation(px, py - BLOCK_SIZE, pz);
        sand.push(tempMatrix.clone());

        const surfaceYIndex = py + BLOCK_SIZE;
        
        const rand = Math.random();
        
        // Vegetation noise map
        const vegDensity = Math.sin(px * 0.1) * Math.cos(pz * 0.1);

        // 2. RUINS & PILLARS
        if (rand > 0.999 && vegDensity > -0.5) {
          const isPillar = Math.random() > 0.5;
          const heightBlocks = Math.floor(Math.random() * 10) + 5;
          
          if (isPillar) {
             for (let h = 0; h < heightBlocks; h++) {
                 tempMatrix.makeTranslation(px, surfaceYIndex + (h * BLOCK_SIZE), pz);
                 columns.push(tempMatrix.clone());
             }
          } else {
             for (let h = 0; h < heightBlocks; h++) {
                tempMatrix.makeTranslation(px, surfaceYIndex + (h * BLOCK_SIZE), pz);
                if (Math.random() > 0.8) {
                    runes.push(tempMatrix.clone());
                } else {
                    stone.push(tempMatrix.clone());
                }
             }
             // Lamp on top
             tempMatrix.makeTranslation(px, surfaceYIndex + (heightBlocks * BLOCK_SIZE), pz);
             lamps.push(tempMatrix.clone());
             mapPOIs.push({ x: px, z: pz, type: 'ruin' });

             if (Math.random() > 0.7) {
                 interactables.push({
                     id: `mech_${x}_${z}`,
                     type: 'MECHANISM',
                     position: [px + 0.5, surfaceYIndex, pz + 0.5],
                     rotation: Math.random() * Math.PI * 2
                 });
                 mapPOIs.push({ x: px + 0.5, z: pz + 0.5, type: 'mechanism' });
             }
          }
          continue; 
        }

        // 3. KELP FOREST (Stacked 1x1 cylinders essentially)
        if (vegDensity > 0.6 && rand > 0.94) { 
             const heightBlocks = Math.floor(Math.random() * 20) + 4;
             for (let h = 0; h < heightBlocks; h++) {
                tempMatrix.makeTranslation(px, surfaceYIndex + (h * BLOCK_SIZE), pz);
                kelp.push(tempMatrix.clone());
             }
             if (Math.random() > 0.995) mapPOIs.push({ x: px, z: pz, type: 'kelp' });
             continue;
        }

        // 4. TREASURE CHESTS
        if (rand < 0.0002 && vegDensity < 0) {
             interactables.push({
                 id: `chest_${x}_${z}`,
                 type: 'CHEST',
                 position: [px, surfaceYIndex, pz],
                 rotation: Math.random() * Math.PI * 2
             });
             mapPOIs.push({ x: px, z: pz, type: 'chest' });
             continue;
        }

        // 5. SEAGRASS (Single studs or small plates)
        if (vegDensity > 0.3 && rand > 0.85) {
            tempMatrix.makeTranslation(px, surfaceYIndex, pz);
            grass.push(tempMatrix.clone());
            continue;
        }

        // 6. SMALL ROCK FORMATIONS
        if (rand < 0.02 && vegDensity < 0.2) {
            tempMatrix.makeTranslation(px, surfaceYIndex, pz);
            smallRocks.push(tempMatrix.clone());
            continue;
        }

        // 7. ANEMONES
        if (rand > 0.1 && rand < 0.105 && vegDensity > -0.2) {
            tempMatrix.makeTranslation(px, surfaceYIndex, pz);
            anemones.push(tempMatrix.clone());
            continue;
        }

        // 8. STARFISH
        if (rand < 0.006 && vegDensity < 0) {
            // Flat on the ground
            tempMatrix.makeTranslation(px, surfaceYIndex - (BLOCK_SIZE * 0.4), pz);
            starfish.push(tempMatrix.clone());
            continue;
        }

        // 9. SEA FLOWERS
        if (rand > 0.4 && rand < 0.415 && vegDensity > 0) {
             tempMatrix.makeTranslation(px, surfaceYIndex, pz);
             flowers.push(tempMatrix.clone());
             continue;
        }

        // 10. CORAL REEFS
        if (rand < 0.005) { 
             const colorHex = coralPalette[Math.floor(Math.random() * coralPalette.length)];
             tempColor.setHex(colorHex);
             const cssColor = hexToCss(colorHex);
             
             // Base block
             tempMatrix.makeTranslation(px, surfaceYIndex, pz);
             coral.push(tempMatrix.clone());
             cColors.push(tempColor.r, tempColor.g, tempColor.b);
             mapPOIs.push({ x: px, z: pz, type: 'coral', color: cssColor });

             // Stack up for verticality
             if (Math.random() > 0.5) {
                 const height = Math.floor(Math.random() * 3) + 1;
                 for(let h=1; h<=height; h++) {
                     tempMatrix.makeTranslation(px, surfaceYIndex + (h * BLOCK_SIZE), pz);
                     coral.push(tempMatrix.clone());
                     cColors.push(tempColor.r, tempColor.g, tempColor.b);
                 }
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
        anemoneInstances: anemones,
        smallRockInstances: smallRocks,
        interactables,
        mapPOIs
    };
};