export enum GameState {
  INTRO = 'INTRO',
  PHOTO_MODE = 'PHOTO_MODE',
  TUTORIAL = 'TUTORIAL',
  PLAYING = 'PLAYING',
}

export enum TimeOfDay {
  DAY = 'DAY',
  NIGHT = 'NIGHT',
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export interface GameSettings {
  timeOfDay: TimeOfDay;
  fogDensity: number;
  fishCount: number;
}

export interface DiveLicense {
  photo: string;
  id: string;
  date: string;
}

export interface MapPOI {
  x: number;
  z: number;
  type: 'ruin' | 'coral' | 'lamp' | 'kelp';
  color?: string;
}

export interface MoveInput {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
}

export interface FishSpecies {
  id: string;
  name: string;
  scientificName: string;
  description: string;
  rarity: 'COMMON' | 'UNCOMMON' | 'RARE' | 'LEGENDARY';
  color: string;
  scale: [number, number, number]; // x, y, z scale factors for the voxel box
  count: number;
  speed: number;
  behavior: 'school' | 'solitary' | 'wander';
  shape: 'classic' | 'flat' | 'long' | 'shark';
}

// We use 'any' here for THREE.Matrix4 to avoid hard dependency on 'three' imports in types.ts
// which can sometimes cause issues if types are mixed. In implementation, these are Matrix4.
export interface TerrainData {
    sandInstances: any[]; 
    stoneInstances: any[];
    runeInstances: any[]; // New glowing rune blocks
    lampInstances: any[];
    kelpInstances: any[];
    grassInstances: any[];
    coralInstances: any[];
    coralColors: Float32Array;
    starfishInstances: any[]; // New delicate decor
    flowerInstances: any[];   // New delicate decor
    columnInstances: any[];   // New ruins decor
    mapPOIs: MapPOI[];
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