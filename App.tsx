import React, { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import { GameScene } from './components/Scene';
import { Interface } from './components/Interface';
import { GestureController } from './components/GestureController';
import { GameSettings, TimeOfDay, GameState, MoveInput, FishSpecies } from './types';
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
  const [moveInput, setMoveInput] = useState<MoveInput>({
    forward: false,
    backward: false,
    left: false,
    right: false
  });
  
  const [oxygen, setOxygen] = useState(100);
  const [isGameOver, setIsGameOver] = useState(false);
  
  // SCANNER STATE
  const [scannedSpecies, setScannedSpecies] = useState<FishSpecies | null>(null);

  const captureRef = useRef<() => string>(() => '');
  const cameraRotationRef = useRef<number>(0);

  const terrainData = useMemo(() => generateTerrain(600, 600), []);

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
  }, []);

  const isSwimming = gestureSwimming || moveInput.forward || moveInput.backward;
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
            isSwimming={isSwimming}
            isRecharging={isRecharging}
            moveInput={moveInput}
            onOxygenUpdate={handleOxygenUpdate}
            isGameOver={isGameOver}
            onRespawn={handleRespawn}
            onScanSpecies={handleScanSpecies}
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
          isSwimming={isSwimming}
          isRecharging={isRecharging}
          oxygen={oxygen}
          isGameOver={isGameOver}
          onRespawn={handleRespawn}
          scannedSpecies={scannedSpecies}
        />
        
        {gameState === GameState.PLAYING && !isGameOver && (
            <GestureController 
              onSwimChange={setGestureSwimming} 
              onRechargeChange={setGestureRecharging}
            />
        )}
      </div>
    </div>
  );
};

export default App;