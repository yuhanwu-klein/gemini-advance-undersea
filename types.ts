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
  type: 'ruin' | 'coral' | 'lamp' | 'kelp' | 'chest' | 'mechanism';
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

export type InteractableType = 'CHEST' | 'MECHANISM';

export interface InteractableItem {
  id: string;
  type: InteractableType;
  position: [number, number, number];
  rotation: number;
}

// We use 'any' here for THREE.Matrix4 to avoid hard dependency on 'three' imports in types.ts
// which can sometimes cause issues if types are mixed. In implementation, these are Matrix4.
export interface TerrainData {
    sandInstances: any[]; 
    stoneInstances: any[];
    runeInstances: any[]; 
    lampInstances: any[];
    kelpInstances: any[];
    grassInstances: any[];
    coralInstances: any[];
    coralColors: Float32Array;
    starfishInstances: any[]; 
    flowerInstances: any[];   
    columnInstances: any[];   
    anemoneInstances: any[]; 
    smallRockInstances: any[]; 
    interactables: InteractableItem[]; // New interactive objects
    mapPOIs: MapPOI[];
}

// Global JSX Declaration for R3F compatibility
declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any;
      instancedMesh: any;
      boxGeometry: any;
      meshBasicMaterial: any;
      group: any;
      positionalAudio: any;
      mesh: any;
      meshStandardMaterial: any;
      planeGeometry: any;
      ambientLight: any;
      directionalLight: any;
      spotLight: any;
      fog: any;
      primitive: any;
      instancedBufferAttribute: any;
      cylinderGeometry: any;
      octahedronGeometry: any;
      pointLight: any;
      ringGeometry: any;
      color: any;
    }
  }
}