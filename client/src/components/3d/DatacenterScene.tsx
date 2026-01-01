import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, PerspectiveCamera, Grid, Text } from "@react-three/drei";
import { Suspense, useState, useCallback, useRef, useMemo } from "react";
import { useGame } from "@/lib/game-context";
import { Rack3D } from "./Rack3D";
import { DatacenterFloor } from "./DatacenterFloor";
import type { Rack } from "@shared/schema";
import * as THREE from "three";

interface DatacenterSceneProps {
  onSelectRack: (rack: Rack | null) => void;
  selectedRackId: string | null;
  isUnlocked: boolean;
}

function Lights() {
  return (
    <>
      <ambientLight intensity={0.15} color="#4488ff" />
      <directionalLight
        position={[50, 80, 30]}
        intensity={0.8}
        color="#ffffff"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={200}
        shadow-camera-left={-100}
        shadow-camera-right={100}
        shadow-camera-top={100}
        shadow-camera-bottom={-100}
      />
      <directionalLight
        position={[-30, 40, -20]}
        intensity={0.3}
        color="#88aaff"
      />
      <pointLight position={[0, 20, 0]} intensity={0.5} color="#ffffff" distance={100} />
    </>
  );
}

function LoadingFallback() {
  return (
    <mesh>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#333" />
    </mesh>
  );
}

interface RackGridProps {
  racks: Rack[];
  selectedRackId: string | null;
  onSelectRack: (rack: Rack | null) => void;
  equipmentCatalog: Map<string, any>;
}

function RackGrid({ racks, selectedRackId, onSelectRack, equipmentCatalog }: RackGridProps) {
  const rackSpacing = 3;
  const aisleSpacing = 5;

  const maxCol = Math.max(...racks.map(r => r.positionX), 0);
  const maxRow = Math.max(...racks.map(r => r.positionY), 0);
  const centerX = (maxCol * rackSpacing) / 2;
  const centerZ = (maxRow * aisleSpacing) / 2;

  return (
    <group position={[-centerX, 0, -centerZ]}>
      {racks.map((rack) => {
        const x = rack.positionX * rackSpacing;
        const z = rack.positionY * aisleSpacing;
        
        return (
          <Rack3D
            key={rack.id}
            rack={rack}
            position={[x, 0, z]}
            isSelected={rack.id === selectedRackId}
            onSelect={() => onSelectRack(rack)}
            equipmentCatalog={equipmentCatalog}
          />
        );
      })}
    </group>
  );
}

export function DatacenterScene({ onSelectRack, selectedRackId, isUnlocked }: DatacenterSceneProps) {
  const { racks, equipmentCatalog } = useGame();
  const controlsRef = useRef<any>(null);

  const equipmentMap = useMemo(() => {
    const map = new Map<string, any>();
    if (equipmentCatalog) {
      equipmentCatalog.forEach((eq: any) => map.set(eq.id, eq));
    }
    return map;
  }, [equipmentCatalog]);

  const maxCol = Math.max(...(racks || []).map(r => r.positionX), 2);
  const maxRow = Math.max(...(racks || []).map(r => r.positionY), 2);
  const floorSize = Math.max(maxCol * 3 + 20, maxRow * 5 + 20, 30);

  return (
    <div className="w-full h-full" data-testid="datacenter-scene-3d">
      <Canvas
        shadows
        gl={{ 
          antialias: true, 
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.2
        }}
        style={{ background: "linear-gradient(180deg, #0a0a12 0%, #0d1117 50%, #161b22 100%)" }}
      >
        <fog attach="fog" args={["#0a0a12", 30, 150]} />
        
        <PerspectiveCamera
          makeDefault
          position={[25, 20, 25]}
          fov={50}
          near={0.1}
          far={500}
        />
        
        <OrbitControls
          ref={controlsRef}
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={5}
          maxDistance={200}
          minPolarAngle={0.2}
          maxPolarAngle={Math.PI / 2.2}
          target={[0, 5, 0]}
        />

        <Suspense fallback={<LoadingFallback />}>
          <Lights />
          
          <DatacenterFloor size={floorSize} />
          
          {racks && racks.length > 0 && (
            <RackGrid
              racks={racks}
              selectedRackId={selectedRackId}
              onSelectRack={onSelectRack}
              equipmentCatalog={equipmentMap}
            />
          )}
        </Suspense>
      </Canvas>
    </div>
  );
}
