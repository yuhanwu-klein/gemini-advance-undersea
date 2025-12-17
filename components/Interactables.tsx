import React, { useRef, useMemo, useEffect, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { InteractableItem } from '../types';
import { generateChestOpenBuffer, generateMechanismBuffer } from '../utils/audioGen';

interface InteractableProps {
    item: InteractableItem;
    isInteracted: boolean;
    audioListener?: THREE.AudioListener;
}

const TreasureChest: React.FC<InteractableProps> = ({ item, isInteracted, audioListener }) => {
    const groupRef = useRef<THREE.Group>(null);
    const lidRef = useRef<THREE.Group>(null);
    const particlesRef = useRef<THREE.InstancedMesh>(null);
    const lightRef = useRef<THREE.PointLight>(null);
    const audioRef = useRef<THREE.PositionalAudio>(null);
    
    // Material Refs for animation
    const baseMatRef = useRef<THREE.MeshStandardMaterial>(null);
    const lidMatRef = useRef<THREE.MeshStandardMaterial>(null);
    const lockMatRef = useRef<THREE.MeshStandardMaterial>(null);

    const openBuffer = useMemo(() => generateChestOpenBuffer(), []);
    const { camera } = useThree();

    // Animation state
    const lidAngle = useRef(0);
    const dummy = useMemo(() => new THREE.Object3D(), []);
    const particleState = useMemo(() => new Array(15).fill(0).map(() => ({
        pos: new THREE.Vector3((Math.random()-0.5)*0.5, 0, (Math.random()-0.5)*0.5),
        vel: new THREE.Vector3((Math.random()-0.5)*0.05, Math.random()*0.1, (Math.random()-0.5)*0.05),
        life: 0
    })), []);

    // Proximity state
    const glowIntensity = useRef(0);

    useEffect(() => {
        if (isInteracted && audioRef.current && !audioRef.current.isPlaying) {
            audioRef.current.setBuffer(openBuffer);
            audioRef.current.setVolume(0.5);
            audioRef.current.play();
        }
    }, [isInteracted, openBuffer]);

    useFrame((state, delta) => {
        const t = state.clock.elapsedTime;

        // Proximity Check
        if (groupRef.current) {
            const dist = camera.position.distanceTo(groupRef.current.position);
            
            // Smooth glow transition
            const targetGlow = (dist < 8 && !isInteracted) ? 1 : 0;
            glowIntensity.current = THREE.MathUtils.lerp(glowIntensity.current, targetGlow, delta * 3);

            // Imperative Light Update
            if (lightRef.current) {
                const pulse = 1 + Math.sin(t * 3) * 0.3;
                lightRef.current.intensity = glowIntensity.current * 2 * pulse;
                lightRef.current.distance = 5;
            }

            // Imperative Material Update
            if (baseMatRef.current) baseMatRef.current.emissiveIntensity = glowIntensity.current * 0.5;
            if (lidMatRef.current) lidMatRef.current.emissiveIntensity = glowIntensity.current * 0.5;
            if (lockMatRef.current) lockMatRef.current.emissiveIntensity = 0.5 + glowIntensity.current;
        }

        // Open lid animation
        const targetAngle = isInteracted ? -Math.PI / 1.5 : 0;
        lidAngle.current = THREE.MathUtils.lerp(lidAngle.current, targetAngle, delta * 5);
        if (lidRef.current) lidRef.current.rotation.x = lidAngle.current;

        // Particle explosion when opened
        if (particlesRef.current) {
            if (isInteracted && lidAngle.current < -0.5) {
                particlesRef.current.visible = true;
                particleState.forEach((p, i) => {
                    if (p.life < 1.0) {
                        p.life += delta;
                        p.pos.add(p.vel);
                        dummy.position.copy(p.pos);
                        dummy.scale.setScalar((1 - p.life) * 0.2);
                        dummy.updateMatrix();
                        particlesRef.current!.setMatrixAt(i, dummy.matrix);
                    }
                });
                particlesRef.current.instanceMatrix.needsUpdate = true;
            } else {
                particlesRef.current.visible = false;
            }
        }
    });

    return (
        <group ref={groupRef} position={item.position} rotation={[0, item.rotation, 0]}>
            {audioListener && <positionalAudio ref={audioRef} args={[audioListener]} />}
            
            {/* Proximity Glow Light */}
            <pointLight ref={lightRef} color="#fbbf24" intensity={0} decay={2} />

            {/* Base */}
            <mesh position={[0, 0.15, 0]}>
                <boxGeometry args={[0.6, 0.3, 0.4]} />
                <meshStandardMaterial 
                    ref={baseMatRef}
                    color="#fcd34d" 
                    roughness={0.3} 
                    metalness={0.1}
                    emissive="#fbbf24"
                    emissiveIntensity={0}
                />
            </mesh>
            {/* Metal bands */}
            <mesh position={[0, 0.15, 0]}>
                <boxGeometry args={[0.62, 0.2, 0.42]} />
                <meshStandardMaterial color="#fb923c" roughness={0.4} />
            </mesh>

            {/* Lid Group */}
            <group ref={lidRef} position={[0, 0.3, -0.2]}>
                 <mesh position={[0, 0.05, 0.2]}>
                    <boxGeometry args={[0.6, 0.15, 0.4]} />
                    <meshStandardMaterial 
                        ref={lidMatRef}
                        color="#fcd34d" 
                        roughness={0.3}
                        emissive="#fbbf24"
                        emissiveIntensity={0} 
                    />
                 </mesh>
                 {/* Lock */}
                 <mesh position={[0, 0.05, 0.41]}>
                     <boxGeometry args={[0.1, 0.1, 0.05]} />
                     <meshStandardMaterial 
                        ref={lockMatRef}
                        color="#fff" 
                        emissive="#fff" 
                        emissiveIntensity={0.5} 
                    />
                 </mesh>
            </group>

            {/* Treasure Particles */}
            <instancedMesh ref={particlesRef} args={[undefined, undefined, 15]} position={[0, 0.3, 0]}>
                <boxGeometry args={[0.1, 0.1, 0.1]} />
                <meshStandardMaterial color="#fef08a" emissive="#fef08a" emissiveIntensity={1} />
            </instancedMesh>
        </group>
    );
};

const AncientMechanism: React.FC<InteractableProps> = ({ item, isInteracted, audioListener }) => {
    const groupRef = useRef<THREE.Group>(null);
    const crystalRef = useRef<THREE.Mesh>(null);
    const audioRef = useRef<THREE.PositionalAudio>(null);
    const lightRef = useRef<THREE.PointLight>(null);
    
    // Material Refs
    const runeMatRef = useRef<THREE.MeshStandardMaterial>(null);
    const crystalMatRef = useRef<THREE.MeshStandardMaterial>(null);

    const mechBuffer = useMemo(() => generateMechanismBuffer(), []);
    const { camera } = useThree();
    
    const glowIntensity = useRef(0);

    useEffect(() => {
        if (isInteracted && audioRef.current && !audioRef.current.isPlaying) {
            audioRef.current.setBuffer(mechBuffer);
            audioRef.current.setVolume(0.4);
            audioRef.current.play();
        }
    }, [isInteracted, mechBuffer]);

    useFrame((state, delta) => {
        const t = state.clock.elapsedTime;
        
        // Proximity Logic
        if (groupRef.current) {
            const dist = camera.position.distanceTo(groupRef.current.position);
            const targetGlow = (dist < 8 && !isInteracted) ? 1 : (isInteracted ? 2 : 0); // Brighter if active
            glowIntensity.current = THREE.MathUtils.lerp(glowIntensity.current, targetGlow, delta * 3);

             // Pulse the light when near
            if (lightRef.current) {
                const pulse = 1 + Math.sin(t * 4) * 0.3;
                lightRef.current.intensity = glowIntensity.current * 3 * pulse;
                lightRef.current.distance = 6;
            }

            // Update Materials
            if (runeMatRef.current) {
                runeMatRef.current.emissiveIntensity = isInteracted ? 2 : glowIntensity.current * 0.5;
                if (isInteracted) runeMatRef.current.color.setHex(0x22d3ee); // Cyan when active
                else runeMatRef.current.color.setHex(0x475569); // Slate when inactive
            }

            if (crystalMatRef.current) {
                crystalMatRef.current.emissiveIntensity = isInteracted ? 3 : 0.5 + glowIntensity.current;
                if (isInteracted) crystalMatRef.current.color.setHex(0xe879f9);
                else crystalMatRef.current.color.setHex(0xa5f3fc);
            }
        }

        if (crystalRef.current) {
            // Spin speed based on state
            const speed = isInteracted ? 5 : 1 + glowIntensity.current; // Spin faster when near
            crystalRef.current.rotation.y += delta * speed;
            crystalRef.current.rotation.x = Math.sin(t * speed * 0.5) * 0.2;
            
            // Floating
            crystalRef.current.position.y = 1 + Math.sin(t * 2) * 0.1;

            // Scale pulse when active or near
            const pulseBase = isInteracted ? 0.3 : 0.25;
            const pulseAmp = isInteracted ? 0.05 : 0.01 + (glowIntensity.current * 0.02);
            const scale = pulseBase + Math.sin(t * 10) * pulseAmp;
            crystalRef.current.scale.setScalar(scale);
        }
    });

    return (
        <group ref={groupRef} position={item.position}>
            {audioListener && <positionalAudio ref={audioRef} args={[audioListener]} />}
            
            {/* Proximity Glow Light */}
            <pointLight ref={lightRef} color="#e879f9" intensity={0} decay={2} />

            {/* Pillar Base */}
            <mesh position={[0, 0.4, 0]}>
                <cylinderGeometry args={[0.3, 0.4, 0.8, 6]} />
                <meshStandardMaterial color="#64748b" roughness={0.6} />
            </mesh>

            {/* Glowing Runes on Base */}
            <mesh position={[0, 0.4, 0]} rotation={[0, 0.5, 0]}>
                 <cylinderGeometry args={[0.31, 0.41, 0.2, 6]} />
                 <meshStandardMaterial 
                    ref={runeMatRef}
                    color="#475569"
                    emissive="#22d3ee" 
                    emissiveIntensity={0}
                    transparent opacity={0.8}
                 />
            </mesh>

            {/* Floating Crystal */}
            <mesh ref={crystalRef} position={[0, 1, 0]} rotation={[Math.PI/4, 0, Math.PI/4]}>
                <octahedronGeometry args={[0.3, 0]} />
                <meshStandardMaterial 
                    ref={crystalMatRef}
                    color="#a5f3fc"
                    emissive="#a5f3fc"
                    emissiveIntensity={0.5}
                    toneMapped={false}
                />
            </mesh>
            
            {/* Active Shockwave Ring */}
            {isInteracted && (
                <mesh rotation={[-Math.PI/2, 0, 0]} position={[0, 0.1, 0]}>
                    <ringGeometry args={[0.8, 1.0, 32]} />
                    <meshBasicMaterial color="#e879f9" transparent opacity={0.4} side={THREE.DoubleSide} />
                </mesh>
            )}
        </group>
    );
};

export const InteractablesManager: React.FC<{ 
    items: InteractableItem[], 
    interactedIds: Set<string>,
    audioListener?: THREE.AudioListener 
}> = ({ items, interactedIds, audioListener }) => {
    return (
        <group>
            {items.map(item => {
                const isInteracted = interactedIds.has(item.id);
                if (item.type === 'CHEST') {
                    return <TreasureChest key={item.id} item={item} isInteracted={isInteracted} audioListener={audioListener} />;
                } else if (item.type === 'MECHANISM') {
                    return <AncientMechanism key={item.id} item={item} isInteracted={isInteracted} audioListener={audioListener} />;
                }
                return null;
            })}
        </group>
    );
};