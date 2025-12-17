import React, { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import { GameScene, SPECIES_DATA } from './components/Scene';
import { Interface } from './components/Interface';
import { GestureController } from './components/GestureController';
import { GameSettings, TimeOfDay, GameState, MoveInput, FishSpecies, InteractableItem } from './types';
import { generateTerrain } from './utils/worldGen';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.INTRO);
  const [settings, setSettings] = useState<GameSettings>({
    timeOfDay: TimeOfDay.DAY,
    fogDensity: 0.015, 
    fishCount: 80,
  });
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  
  const [gestureSwimming, setGestureSwimming] = useState(false);
  const [gestureRecharging, setGestureRecharging] = useState(false);
  const [gestureSteer, setGestureSteer] = useState<'LEFT' | 'RIGHT' | null>(null);

  const [moveInput, setMoveInput] = useState<MoveInput>({
    forward: false,
    backward: false,
    left: false,
    right: false
  });
  
  const [oxygen, setOxygen] = useState(100);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isInputLocked, setIsInputLocked] = useState(false);
  
  // SCANNER STATE
  const [scannedSpecies, setScannedSpecies] = useState<FishSpecies | null>(null);
  const [collectedSpecies, setCollectedSpecies] = useState<Set<string>>(new Set());
  
  // INTERACTION STATE
  const [interactedItems, setInteractedItems] = useState<Set<string>>(new Set());
  const [closestInteractable, setClosestInteractable] = useState<InteractableItem | null>(null);

  // Refs for event listener to avoid re-binding and dropping inputs
  const closestInteractableRef = useRef<InteractableItem | null>(null);
  const interactedItemsRef = useRef<Set<string>>(new Set());
  const gameStateRef = useRef<GameState>(GameState.INTRO);

  // Sync refs
  useEffect(() => { closestInteractableRef.current = closestInteractable; }, [closestInteractable]);
  useEffect(() => { interactedItemsRef.current = interactedItems; }, [interactedItems]);
  useEffect(() => { gameStateRef.current = gameState; }, [gameState]);

  const captureRef = useRef<() => string>(() => '');
  const cameraRotationRef = useRef<number>(0);

  // Optimized terrain: High count with smaller blocks = dense lego world
  // 350x350 with 0.15 block size creates a ~52 unit wide world with high detail
  const terrainData = useMemo(() => generateTerrain(350, 350), []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch(e.key) {
        case 'w': case 'W': case 'ArrowUp':
          setMoveInput(prev => ({ ...prev, forward: true }));
          break;
        case 's': case 'S': case 'ArrowDown':
          setMoveInput(prev => ({ ...prev, backward: true }));
          break;
        case 'a': case 'A': case 'ArrowLeft':
          setMoveInput(prev => ({ ...prev, left: true }));
          break;
        case 'd': case 'D': case 'ArrowRight':
          setMoveInput(prev => ({ ...prev, right: true }));
          break;
        case 'e': case 'E':
            if (gameStateRef.current === GameState.PLAYING && closestInteractableRef.current && !interactedItemsRef.current.has(closestInteractableRef.current.id)) {
                setInteractedItems(prev => new Set(prev).add(closestInteractableRef.current!.id));
            }
            break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      switch(e.key) {
        case 'w': case 'W': case 'ArrowUp':
          setMoveInput(prev => ({ ...prev, forward: false }));
          break;
        case 's': case 'S': case 'ArrowDown':
          setMoveInput(prev => ({ ...prev, backward: false }));
          break;
        case 'a': case 'A': case 'ArrowLeft':
          setMoveInput(prev => ({ ...prev, left: false }));
          break;
        case 'd': case 'D': case 'ArrowRight':
          setMoveInput(prev => ({ ...prev, right: false }));
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []); // Empty dependency array = stable event listeners

  // Combine Keyboard and Gesture Input
  const combinedMoveInput = useMemo(() => ({
    forward: moveInput.forward,
    backward: moveInput.backward,
    left: moveInput.left || gestureSteer === 'LEFT',
    right: moveInput.right || gestureSteer === 'RIGHT'
  }), [moveInput, gestureSteer]);

  const isSwimming = (gestureSwimming || moveInput.forward || moveInput.backward || moveInput.left || moveInput.right);
  const isRecharging = gestureRecharging && !isSwimming;

  const handleSettingsChange = (newSettings: Partial<GameSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const handleStartIntro = () => {
    setGameState(GameState.PHOTO_MODE);
  };

  const handleTakePhoto = (webcamImage?: string) => {
    setCapturedImage(null);
    if (webcamImage) {
        setCapturedImage(webcamImage);
    } else if (captureRef.current) {
        const dataUrl = captureRef.current();
        setCapturedImage(dataUrl);
    }
  };
  
  const handleRetake = () => {
      setCapturedImage(null);
  };

  const handleAcceptLicense = () => {
    setGameState(GameState.TUTORIAL);
  };
  
  const handleTutorialComplete = () => {
    setGameState(GameState.PLAYING);
    setOxygen(100);
    setIsGameOver(false);
  };

  const handleOxygenUpdate = useCallback((newLevel: number) => {
      setOxygen(newLevel);
      if (newLevel <= 0) {
          setIsGameOver(true);
          setGameState(GameState.PLAYING); 
      }
  }, []);

  const handleRespawn = () => {
      setOxygen(100);
      setIsGameOver(false);
  };
  
  const handleScanSpecies = useCallback((species: FishSpecies | null) => {
      setScannedSpecies(species);
      if (species) {
          setCollectedSpecies(prev => {
              if (!prev.has(species.id)) {
                  // Only lock input if this is the first time collecting this species
                  setIsInputLocked(true);
                  const next = new Set(prev);
                  next.add(species.id);
                  return next;
              }
              return prev;
          });
      }
  }, []);

  const handleScanComplete = useCallback(() => {
      setIsInputLocked(false);
  }, []);

  const handleHoverInteractable = useCallback((item: InteractableItem | null) => {
      setClosestInteractable(item);
  }, []);

  return (
    <div className="w-full h-full relative bg-black">
      <div className="absolute inset-0 z-0">
        <GameScene 
            settings={settings} 
            gameState={gameState} 
            captureRef={captureRef}
            faceTextureUrl={capturedImage}
            terrainData={terrainData}
            cameraRotationRef={cameraRotationRef}
            isSwimming={isInputLocked ? false : isSwimming}
            isRecharging={isRecharging}
            moveInput={combinedMoveInput}
            onOxygenUpdate={handleOxygenUpdate}
            isGameOver={isGameOver}
            onRespawn={handleRespawn}
            onScanSpecies={handleScanSpecies}
            interactedItems={interactedItems}
            onHoverInteractable={handleHoverInteractable}
            isInputLocked={isInputLocked}
        />
      </div>

      <div className="absolute inset-0 z-10">
        <Interface 
          onSettingsChange={handleSettingsChange} 
          currentSettings={settings} 
          gameState={gameState}
          onStart={handleStartIntro}
          onTakePhoto={capturedImage ? handleRetake : handleTakePhoto}
          onAcceptLicense={handleAcceptLicense}
          onTutorialComplete={handleTutorialComplete}
          capturedImage={capturedImage}
          mapPOIs={terrainData.mapPOIs}
          cameraRotationRef={cameraRotationRef}
          isSwimming={isInputLocked ? false : isSwimming}
          isRecharging={isRecharging}
          oxygen={oxygen}
          isGameOver={isGameOver}
          onRespawn={handleRespawn}
          scannedSpecies={scannedSpecies}
          closestInteractable={closestInteractable && !interactedItems.has(closestInteractable.id) ? closestInteractable : null}
          collectedCount={collectedSpecies.size}
          totalSpeciesCount={SPECIES_DATA.length}
          collectedSpecies={collectedSpecies}
          interactedItems={interactedItems}
          onScanComplete={handleScanComplete}
        />
        
        {(gameState === GameState.PLAYING || gameState === GameState.TUTORIAL) && !isGameOver && (
            <GestureController 
              onSwimChange={setGestureSwimming} 
              onRechargeChange={setGestureRecharging}
              onSteerChange={setGestureSteer}
            />
        )}
      </div>
    </div>
  );
};

export default App;