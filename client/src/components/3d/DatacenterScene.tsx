import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, PerspectiveCamera, Stars } from "@react-three/drei";
import { Suspense, useState, useRef, useMemo, useCallback } from "react";
import { useGame } from "@/lib/game-context";
import { Rack3D } from "./Rack3D";
import { DatacenterFloor } from "./DatacenterFloor";
import { DustMotes, HeatShimmer, AirflowParticles, VolumetricLight } from "./AtmosphericEffects";
import { RaisedFloor, CableTrays, CRACUnit, FireSuppressionSystem, EmergencyLight, StatusPanel } from "./EnvironmentElements";
import { DataCenterNetworkMesh, NetworkTrafficStream } from "./NetworkTraffic";
import { HolographicHUD, FloatingMetric } from "./HolographicHUD";
import { CameraController, CinematicFlythrough } from "./CameraController";
import { generateProceduralRacks } from "./ProceduralRacks";
import type { Rack, Equipment } from "@shared/schema";
import * as THREE from "three";

interface DatacenterSceneProps {
  onSelectRack: (rack: Rack | null) => void;
  selectedRackId: string | null;
  isUnlocked: boolean;
  showEffects?: boolean;
  cameraMode?: "orbit" | "auto" | "cinematic";
  showHUD?: boolean;
  rackCount?: number;
  showHeatmap?: boolean;
  performanceMode?: boolean;
  qualityMode?: "low" | "high";
  visibleRacks?: Rack[];
  proceduralOptions?: {
    seed?: number;
    fillRateMultiplier?: number;
    errorRate?: number;
    tempBase?: number;
  };
}

function AdvancedLights({ performanceMode = false }: { performanceMode?: boolean }) {
  return (
    <>
      <ambientLight intensity={0.15} color="#4466aa" />
      <directionalLight
        position={[60, 100, 40]}
        intensity={performanceMode ? 0.8 : 1.0}
        color="#ffffff"
        castShadow={!performanceMode}
        shadow-mapSize={performanceMode ? [1024, 1024] : [2048, 2048]}
        shadow-camera-far={200}
        shadow-camera-left={-80}
        shadow-camera-right={80}
        shadow-camera-top={80}
        shadow-camera-bottom={-80}
        shadow-bias={-0.0001}
      />
      {!performanceMode && (
        <>
          <spotLight
            position={[0, 35, 10]}
            angle={0.4}
            penumbra={0.6}
            intensity={0.6}
            color="#8bbcff"
            castShadow
            shadow-mapSize={[1024, 1024]}
          />
          <spotLight
            position={[0, 30, -12]}
            angle={0.45}
            penumbra={0.6}
            intensity={0.5}
            color="#7ee7ff"
            castShadow
            shadow-mapSize={[1024, 1024]}
          />
        </>
      )}
      <directionalLight
        position={[-40, 50, -30]}
        intensity={0.3}
        color="#6688ff"
      />
      <directionalLight
        position={[0, 20, -50]}
        intensity={0.2}
        color="#ff8844"
      />
      <hemisphereLight
        color="#88aaff"
        groundColor="#442200"
        intensity={0.15}
      />
    </>
  );
}

function LoadingFallback() {
  return (
    <mesh position={[0, 2, 0]}>
      <boxGeometry args={[2, 2, 2]} />
      <meshStandardMaterial color="#00aaff" wireframe />
    </mesh>
  );
}

interface RackGridProps {
  racks: Rack[];
  selectedRackId: string | null;
  onSelectRack: (rack: Rack | null) => void;
  equipmentCatalog: Map<string, Equipment>;
  showHeatShimmer?: boolean;
  showNetworkMesh?: boolean;
}

function RackGrid({
  racks,
  selectedRackId,
  onSelectRack,
  equipmentCatalog,
  showHeatShimmer = true,
  showNetworkMesh = true,
}: RackGridProps) {
  const rackSpacing = 2.0;
  const aisleSpacing = 4.0;

  const maxCol = Math.max(...racks.map(r => r.positionX), 0);
  const maxRow = Math.max(...racks.map(r => r.positionY), 0);
  const centerX = (maxCol * rackSpacing) / 2;
  const centerZ = (maxRow * aisleSpacing) / 2;

  const rackPositions = useMemo(() => {
    return racks.map(rack => ({
      rack,
      position: [
        rack.positionX * rackSpacing - centerX,
        0,
        rack.positionY * aisleSpacing - centerZ
      ] as [number, number, number]
    }));
  }, [racks, rackSpacing, aisleSpacing, centerX, centerZ]);

  return (
    <group>
      {rackPositions.map(({ rack, position }) => (
        <group key={rack.id}>
          <Rack3D
            rack={rack}
            position={position}
            isSelected={rack.id === selectedRackId}
            onSelect={() => onSelectRack(rack)}
            equipmentCatalog={equipmentCatalog}
          />
          
          {showHeatShimmer && rack.exhaustTemp > 35 && (
            <HeatShimmer
              position={[position[0], 2.5, position[1] - 0.5]}
              intensity={(rack.exhaustTemp - 30) / 20}
            />
          )}
        </group>
      ))}
      
      {showNetworkMesh && (
        <DataCenterNetworkMesh
          racks={rackPositions.map(({ position }) => ({ position }))}
          maxConnections={Math.min(50, rackPositions.length * 2)}
          maxStreams={15}
        />
      )}
    </group>
  );
}

function EnvironmentalDetails({ size }: { size: number }) {
  const cracPositions = useMemo(() => {
    const positions: [number, number, number][] = [];
    const count = Math.ceil(size / 15);
    for (let i = 0; i < count; i++) {
      positions.push([-size * 0.8, 0, (i - count / 2) * 8]);
      positions.push([size * 0.8, 0, (i - count / 2) * 8]);
    }
    return positions;
  }, [size]);

  const emergencyLightPositions = useMemo(() => {
    const positions: [number, number, number][] = [];
    for (let x = -2; x <= 2; x++) {
      for (let z = -2; z <= 2; z++) {
        if (Math.random() > 0.7) {
          positions.push([x * 6, 20, z * 6]);
        }
      }
    }
    return positions;
  }, []);

  return (
    <group>
      <CableTrays length={size * 1.5} rows={3} />
      
      {cracPositions.map((pos, i) => (
        <CRACUnit key={`crac-${i}`} position={pos} />
      ))}
      
      <FireSuppressionSystem position={[-size * 0.6, 0, -size * 0.6]} />
      <FireSuppressionSystem position={[size * 0.6, 0, -size * 0.6]} />
      <FireSuppressionSystem position={[-size * 0.6, 0, size * 0.6]} />
      <FireSuppressionSystem position={[size * 0.6, 0, size * 0.6]} />
      
      {emergencyLightPositions.map((pos, i) => (
        <EmergencyLight key={`emergency-${i}`} position={pos} />
      ))}
      
      <StatusPanel position={[-size * 0.9, 1.5, 0]} />
      <StatusPanel position={[size * 0.9, 1.5, 0]} />
    </group>
  );
}

function AtmosphericLayer({ size, intensity = 1 }: { size: number; intensity?: number }) {
  return (
    <group>
      <DustMotes count={Math.floor(300 * intensity)} size={size} />
      
      <VolumetricLight position={[0, 13, 0]} color="#4488ff" intensity={0.5} />
      <VolumetricLight position={[-8, 13, 0]} color="#4488ff" intensity={0.3} />
      <VolumetricLight position={[8, 13, 0]} color="#4488ff" intensity={0.3} />
      
      <AirflowParticles
        start={[-size * 0.7, 0.5, 0]}
        end={[0, 0.5, 0]}
        count={30}
        color="#00aaff"
      />
      <AirflowParticles
        start={[size * 0.7, 0.5, 0]}
        end={[0, 0.5, 0]}
        count={30}
        color="#00aaff"
      />
    </group>
  );
}

const CINEMATIC_WAYPOINTS = [
  { position: [30, 20, 30] as [number, number, number], target: [0, 2, 0] as [number, number, number] },
  { position: [20, 5, 20] as [number, number, number], target: [0, 2, 0] as [number, number, number] },
  { position: [0, 3, 15] as [number, number, number], target: [0, 2, 0] as [number, number, number] },
  { position: [-20, 8, 10] as [number, number, number], target: [0, 2, 0] as [number, number, number] },
  { position: [-30, 15, -10] as [number, number, number], target: [0, 2, 0] as [number, number, number] },
  { position: [0, 25, -25] as [number, number, number], target: [0, 2, 0] as [number, number, number] },
  { position: [30, 20, 30] as [number, number, number], target: [0, 2, 0] as [number, number, number] },
];

export function DatacenterScene({ 
  onSelectRack, 
  selectedRackId, 
  isUnlocked,
  showEffects = true,
  cameraMode = "orbit",
  showHUD = true,
  rackCount = 9,
  showHeatmap = false,
  performanceMode = false,
  qualityMode = "high",
  visibleRacks,
  proceduralOptions
}: DatacenterSceneProps) {
  const { racks, equipmentCatalog } = useGame();
  const controlsRef = useRef<any>(null);
  const [autoOrbit, setAutoOrbit] = useState(cameraMode === "auto");

  const equipmentMap = useMemo(() => {
    const map = new Map<string, Equipment>();
    if (equipmentCatalog) {
      equipmentCatalog.forEach((eq: Equipment) => map.set(eq.id, eq));
    }
    return map;
  }, [equipmentCatalog]);

  // Fix: Move proceduralOptions check inside useMemo where it's used
  const displayRacks = useMemo(() => {
    if (visibleRacks) {
      return visibleRacks;
    }
    if (isUnlocked && rackCount > 9 && equipmentCatalog?.length > 0) {
      return generateProceduralRacks(rackCount, equipmentCatalog, proceduralOptions);
    }
    return racks || [];
  }, [equipmentCatalog, isUnlocked, rackCount, racks, proceduralOptions, visibleRacks]);

  const maxCol = Math.max(...(displayRacks).map(r => r.positionX), 2);
  const maxRow = Math.max(...(displayRacks).map(r => r.positionY), 2);
  const floorSize = Math.max(maxCol * 2 + 15, maxRow * 4 + 15, 25);
  const useLowEffects = performanceMode || qualityMode === "low" || displayRacks.length > 200;

  const cinematicWaypoints = useMemo(() => [
    { position: [floorSize * 0.8, floorSize * 0.5, floorSize * 0.8] as [number, number, number], target: [0, 2, 0] as [number, number, number] },
    { position: [floorSize * 0.5, 5, floorSize * 0.5] as [number, number, number], target: [0, 2, 0] as [number, number, number] },
    { position: [0, 3, floorSize * 0.4] as [number, number, number], target: [0, 2, 0] as [number, number, number] },
    { position: [-floorSize * 0.5, 8, floorSize * 0.3] as [number, number, number], target: [0, 2, 0] as [number, number, number] },
    { position: [-floorSize * 0.8, 15, -floorSize * 0.3] as [number, number, number], target: [0, 2, 0] as [number, number, number] },
    { position: [0, 25, -floorSize * 0.7] as [number, number, number], target: [0, 2, 0] as [number, number, number] },
    { position: [floorSize * 0.8, floorSize * 0.5, floorSize * 0.8] as [number, number, number], target: [0, 2, 0] as [number, number, number] },
  ], [floorSize]);

  const handlePointerMissed = useCallback(() => {
    onSelectRack(null);
  }, [onSelectRack]);

  return (
    <div className="w-full h-full relative" data-testid="datacenter-scene-3d">
      <Canvas
        shadows={!performanceMode}
        dpr={performanceMode ? 1 : [1, 2]}
        gl={{ 
          antialias: !performanceMode, 
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.0,
          powerPreference: "high-performance"
        }}
        style={{ background: "linear-gradient(180deg, #050508 0%, #0a0c12 30%, #0d1117 70%, #101520 100%)" }}
        onPointerMissed={handlePointerMissed}
      >
        <fog attach="fog" args={["#080a10", 20, 120]} />
        
        <PerspectiveCamera
          makeDefault
          position={[25, 18, 25]}
          fov={50}
          near={0.1}
          far={500}
        />
        
        {cameraMode === "orbit" && (
          <OrbitControls
            ref={controlsRef}
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            minDistance={3}
            maxDistance={80}
            minPolarAngle={0.1}
            maxPolarAngle={Math.PI / 2.1}
            target={[0, 3, 0]}
            enableDamping
            dampingFactor={0.05}
          />
        )}
        
        {cameraMode === "auto" && (
          <CameraController autoOrbit orbitSpeed={0.08} />
        )}
        
        {cameraMode === "cinematic" && (
          <CinematicFlythrough
            waypoints={cinematicWaypoints}
            speed={0.5}
            loop
            active
          />
        )}

        <Suspense fallback={<LoadingFallback />}>
          <AdvancedLights performanceMode={useLowEffects} />
          
          {!useLowEffects && (
            <Stars
              radius={200}
              depth={100}
              count={1000}
              factor={2}
              saturation={0.5}
              fade
              speed={0.5}
            />
          )}
          
          <RaisedFloor size={floorSize} showHeatmap={showHeatmap} />
          
          {displayRacks.length > 0 && (
            <RackGrid
              racks={displayRacks}
              selectedRackId={selectedRackId}
              onSelectRack={onSelectRack}
              equipmentCatalog={equipmentMap}
              showHeatShimmer={showEffects && !useLowEffects}
              showNetworkMesh={!useLowEffects}
            />
          )}
          
          {!useLowEffects && <EnvironmentalDetails size={floorSize} />}
          
          {showEffects && !useLowEffects && (
            <AtmosphericLayer size={floorSize} intensity={displayRacks.length > 50 ? 0.5 : 1} />
          )}
          
          {showHUD && (
            <HolographicHUD
              position={[0, 10, -floorSize * 0.7]}
              visible={true}
            />
          )}
        </Suspense>
      </Canvas>
      
      {isUnlocked && (
        <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md rounded-md px-3 py-2 border border-cyan-500/30">
          <div className="text-cyan-400 text-xs font-mono flex items-center gap-2">
            <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
            ADMIN MODE ACTIVE
          </div>
          <div className="text-cyan-600 text-[10px] font-mono mt-1">
            {displayRacks.length} RACKS ONLINE
          </div>
        </div>
      )}
      
    </div>
  );
}

function CameraModeButton({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded text-xs font-mono transition-all ${
        active 
          ? "bg-cyan-500/30 text-cyan-300 border border-cyan-500/50" 
          : "bg-black/40 text-gray-400 border border-gray-700/50 hover:bg-gray-800/50"
      }`}
      data-testid={`button-camera-${label.toLowerCase().replace(' ', '-')}`}
    >
      {label}
    </button>
  );
}
