import { useRef, useState, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { Rack, Equipment, InstalledEquipment } from "@shared/schema";
import { EquipmentMesh } from "./EquipmentMesh";

interface Rack3DProps {
  rack: Rack;
  position: [number, number, number];
  isSelected: boolean;
  onSelect: () => void;
  equipmentCatalog: Map<string, Equipment>;
}

const RACK_WIDTH = 0.6;
const RACK_DEPTH = 1.0;
const RACK_HEIGHT = 2.0;
const U_HEIGHT = RACK_HEIGHT / 42;
const FRAME_THICKNESS = 0.025;
const POST_SIZE = 0.04;

function RackFrame({ isSelected, thermalStatus }: { isSelected: boolean; thermalStatus: string }) {
  const frameColor = "#1a1d24";
  const highlightColor = isSelected ? "#4488ff" : "#2a2d34";

  const statusGlowColor = useMemo(() => {
    switch (thermalStatus) {
      case "critical": return new THREE.Color("#ff2200");
      case "warning": return new THREE.Color("#ffaa00");
      case "elevated": return new THREE.Color("#ffcc00");
      default: return new THREE.Color("#00ff44");
    }
  }, [thermalStatus]);

  const statusGlowHex = useMemo(() => {
    switch (thermalStatus) {
      case "critical": return "#ff2200";
      case "warning": return "#ffaa00";
      case "elevated": return "#ffcc00";
      default: return "#00ff44";
    }
  }, [thermalStatus]);

  return (
    <group>
      {[
        [-RACK_WIDTH / 2 + POST_SIZE / 2, RACK_HEIGHT / 2, -RACK_DEPTH / 2 + POST_SIZE / 2],
        [RACK_WIDTH / 2 - POST_SIZE / 2, RACK_HEIGHT / 2, -RACK_DEPTH / 2 + POST_SIZE / 2],
        [-RACK_WIDTH / 2 + POST_SIZE / 2, RACK_HEIGHT / 2, RACK_DEPTH / 2 - POST_SIZE / 2],
        [RACK_WIDTH / 2 - POST_SIZE / 2, RACK_HEIGHT / 2, RACK_DEPTH / 2 - POST_SIZE / 2],
      ].map((pos, i) => (
        <mesh key={`post-${i}`} position={pos as [number, number, number]} castShadow>
          <boxGeometry args={[POST_SIZE, RACK_HEIGHT, POST_SIZE]} />
          <meshStandardMaterial
            color={highlightColor}
            metalness={0.85}
            roughness={0.15}
          />
        </mesh>
      ))}

      {[0, RACK_HEIGHT].map((y, i) => (
        <group key={`rails-${i}`}>
          <mesh position={[0, y, -RACK_DEPTH / 2 + FRAME_THICKNESS / 2]} castShadow>
            <boxGeometry args={[RACK_WIDTH - POST_SIZE * 2, FRAME_THICKNESS, FRAME_THICKNESS]} />
            <meshStandardMaterial color={frameColor} metalness={0.8} roughness={0.2} />
          </mesh>
          <mesh position={[0, y, RACK_DEPTH / 2 - FRAME_THICKNESS / 2]} castShadow>
            <boxGeometry args={[RACK_WIDTH - POST_SIZE * 2, FRAME_THICKNESS, FRAME_THICKNESS]} />
            <meshStandardMaterial color={frameColor} metalness={0.8} roughness={0.2} />
          </mesh>
          <mesh position={[-RACK_WIDTH / 2 + FRAME_THICKNESS / 2, y, 0]} castShadow>
            <boxGeometry args={[FRAME_THICKNESS, FRAME_THICKNESS, RACK_DEPTH - POST_SIZE * 2]} />
            <meshStandardMaterial color={frameColor} metalness={0.8} roughness={0.2} />
          </mesh>
          <mesh position={[RACK_WIDTH / 2 - FRAME_THICKNESS / 2, y, 0]} castShadow>
            <boxGeometry args={[FRAME_THICKNESS, FRAME_THICKNESS, RACK_DEPTH - POST_SIZE * 2]} />
            <meshStandardMaterial color={frameColor} metalness={0.8} roughness={0.2} />
          </mesh>
        </group>
      ))}

      <mesh position={[-RACK_WIDTH / 2 + 0.015, RACK_HEIGHT / 2, 0]}>
        <boxGeometry args={[0.008, RACK_HEIGHT - 0.05, RACK_DEPTH - 0.15]} />
        <meshStandardMaterial color="#0a0c10" metalness={0.3} roughness={0.7} />
      </mesh>
      <mesh position={[RACK_WIDTH / 2 - 0.015, RACK_HEIGHT / 2, 0]}>
        <boxGeometry args={[0.008, RACK_HEIGHT - 0.05, RACK_DEPTH - 0.15]} />
        <meshStandardMaterial color="#0a0c10" metalness={0.3} roughness={0.7} />
      </mesh>

      <mesh position={[0, RACK_HEIGHT / 2, RACK_DEPTH / 2 + 0.003]}>
        <planeGeometry args={[RACK_WIDTH - 0.06, RACK_HEIGHT - 0.04]} />
        <meshPhysicalMaterial
          color="#1a2030"
          transparent
          opacity={0.3}
          metalness={0.1}
          roughness={0.1}
          transmission={0.7}
          thickness={0.01}
          side={THREE.DoubleSide}
        />
      </mesh>

      <mesh position={[0, RACK_HEIGHT / 2, RACK_DEPTH / 2 + 0.004]}>
        <planeGeometry args={[RACK_WIDTH - 0.08, RACK_HEIGHT - 0.06]} />
        <meshBasicMaterial
          color="#ffffff"
          transparent
          opacity={0.02}
        />
      </mesh>

      <mesh position={[0, RACK_HEIGHT / 2, RACK_DEPTH / 2 + 0.002]}>
        <boxGeometry args={[RACK_WIDTH - 0.04, 0.01, 0.002]} />
        <meshStandardMaterial color={frameColor} metalness={0.9} roughness={0.1} />
      </mesh>

      <mesh position={[0, 0.02, RACK_DEPTH / 2 + 0.005]}>
        <boxGeometry args={[RACK_WIDTH - 0.08, 0.015, 0.003]} />
        <meshStandardMaterial
          color={statusGlowHex}
          emissive={statusGlowHex}
          emissiveIntensity={2.5}
        />
      </mesh>

      <mesh position={[0, RACK_HEIGHT - 0.02, RACK_DEPTH / 2 + 0.005]}>
        <boxGeometry args={[RACK_WIDTH - 0.08, 0.015, 0.003]} />
        <meshStandardMaterial
          color={statusGlowHex}
          emissive={statusGlowHex}
          emissiveIntensity={2.5}
        />
      </mesh>

      {[0.2, 0.4, 0.6, 0.8].map((y, i) => (
        <mesh key={`vent-${i}`} position={[0, y * RACK_HEIGHT + 0.1, -RACK_DEPTH / 2 + 0.02]}>
          <boxGeometry args={[RACK_WIDTH - 0.1, 0.02, 0.005]} />
          <meshStandardMaterial color="#0a0c10" />
        </mesh>
      ))}

      {isSelected && (
        <mesh position={[0, RACK_HEIGHT / 2, RACK_DEPTH / 2 + 0.006]}>
          <planeGeometry args={[RACK_WIDTH - 0.04, RACK_HEIGHT - 0.02]} />
          <meshBasicMaterial
            color="#4488ff"
            transparent
            opacity={0.15}
          />
        </mesh>
      )}
    </group>
  );
}

function SimplifiedRack({ thermalStatus }: { thermalStatus: string }) {
  const statusGlowHex = useMemo(() => {
    switch (thermalStatus) {
      case "critical": return "#ff2200";
      case "warning": return "#ffaa00";
      case "elevated": return "#ffcc00";
      default: return "#00ff44";
    }
  }, [thermalStatus]);

  return (
    <group>
      <mesh position={[0, RACK_HEIGHT / 2, 0]} castShadow>
        <boxGeometry args={[RACK_WIDTH - 0.02, RACK_HEIGHT, RACK_DEPTH - 0.02]} />
        <meshStandardMaterial
          color="#1a1d24"
          metalness={0.6}
          roughness={0.4}
        />
      </mesh>
      <mesh position={[0, 0.02, RACK_DEPTH / 2 + 0.01]}>
        <boxGeometry args={[RACK_WIDTH - 0.1, 0.015, 0.003]} />
        <meshStandardMaterial
          color={statusGlowHex}
          emissive={statusGlowHex}
          emissiveIntensity={1}
        />
      </mesh>
    </group>
  );
}

export function Rack3D({ rack, position, isSelected, onSelect, equipmentCatalog }: Rack3DProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const { camera } = useThree();

  const thermalStatus = useMemo(() => {
    if (rack.inletTemp > 30) return "critical";
    if (rack.inletTemp > 27) return "warning";
    if (rack.inletTemp > 25) return "elevated";
    return "normal";
  }, [rack.inletTemp]);

  const [isDetailedView, setIsDetailedView] = useState(true);

  useFrame(() => {
    if (groupRef.current) {
      const targetY = hovered || isSelected ? 0.05 : 0;
      groupRef.current.position.y = THREE.MathUtils.lerp(
        groupRef.current.position.y,
        targetY,
        0.15
      );

      const distance = camera.position.distanceTo(
        new THREE.Vector3(position[0], position[1] + RACK_HEIGHT / 2, position[2])
      );
      const shouldBeDetailed = distance < 20 || isSelected || hovered;
      if (shouldBeDetailed !== isDetailedView) {
        setIsDetailedView(shouldBeDetailed);
      }
    }
  });

  const sortedEquipment = useMemo(() => {
    return [...rack.installedEquipment].sort((a, b) => a.uStart - b.uStart);
  }, [rack.installedEquipment]);

  return (
    <group
      ref={groupRef}
      position={position}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        setHovered(false);
        document.body.style.cursor = "auto";
      }}
    >
      {isDetailedView ? (
        <>
          <RackFrame isSelected={isSelected} thermalStatus={thermalStatus} />

          {sortedEquipment.map((installed) => {
            const equipment = equipmentCatalog.get(installed.equipmentId);
            if (!equipment) return null;

            const yPos = (installed.uStart - 1) * U_HEIGHT + (equipment.uHeight * U_HEIGHT) / 2;

            return (
              <EquipmentMesh
                key={installed.id}
                equipment={equipment}
                installed={installed}
                position={[0, yPos, 0]}
                rackWidth={RACK_WIDTH}
                rackDepth={RACK_DEPTH}
                uHeight={U_HEIGHT}
              />
            );
          })}
        </>
      ) : (
        <SimplifiedRack thermalStatus={thermalStatus} />
      )}

      {(hovered || isSelected) && (
        <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[RACK_WIDTH + 0.1, RACK_DEPTH + 0.1]} />
          <meshBasicMaterial
            color={isSelected ? "#4488ff" : "#ffffff"}
            transparent
            opacity={0.15}
          />
        </mesh>
      )}
    </group>
  );
}
