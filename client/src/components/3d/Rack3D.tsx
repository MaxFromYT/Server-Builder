import { useRef, useState, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
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

function RackFrame({ isSelected, thermalStatus }: { isSelected: boolean; thermalStatus: string }) {
  const frameColor = isSelected ? "#4488ff" : "#1a1d24";
  const emissiveColor = isSelected ? "#2244aa" : "#000000";
  const emissiveIntensity = isSelected ? 0.3 : 0;

  const statusGlowColor = useMemo(() => {
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
        [-RACK_WIDTH / 2, RACK_HEIGHT / 2, -RACK_DEPTH / 2],
        [RACK_WIDTH / 2, RACK_HEIGHT / 2, -RACK_DEPTH / 2],
        [-RACK_WIDTH / 2, RACK_HEIGHT / 2, RACK_DEPTH / 2],
        [RACK_WIDTH / 2, RACK_HEIGHT / 2, RACK_DEPTH / 2],
      ].map((pos, i) => (
        <mesh key={`post-${i}`} position={pos as [number, number, number]} castShadow>
          <boxGeometry args={[0.04, RACK_HEIGHT, 0.04]} />
          <meshStandardMaterial
            color={frameColor}
            metalness={0.8}
            roughness={0.2}
            emissive={emissiveColor}
            emissiveIntensity={emissiveIntensity}
          />
        </mesh>
      ))}

      {[0, RACK_HEIGHT].map((y, i) => (
        <group key={`rails-${i}`}>
          <mesh position={[0, y, -RACK_DEPTH / 2]} castShadow>
            <boxGeometry args={[RACK_WIDTH, 0.03, 0.03]} />
            <meshStandardMaterial color={frameColor} metalness={0.8} roughness={0.2} />
          </mesh>
          <mesh position={[0, y, RACK_DEPTH / 2]} castShadow>
            <boxGeometry args={[RACK_WIDTH, 0.03, 0.03]} />
            <meshStandardMaterial color={frameColor} metalness={0.8} roughness={0.2} />
          </mesh>
          <mesh position={[-RACK_WIDTH / 2, y, 0]} castShadow>
            <boxGeometry args={[0.03, 0.03, RACK_DEPTH]} />
            <meshStandardMaterial color={frameColor} metalness={0.8} roughness={0.2} />
          </mesh>
          <mesh position={[RACK_WIDTH / 2, y, 0]} castShadow>
            <boxGeometry args={[0.03, 0.03, RACK_DEPTH]} />
            <meshStandardMaterial color={frameColor} metalness={0.8} roughness={0.2} />
          </mesh>
        </group>
      ))}

      <mesh position={[0, RACK_HEIGHT / 2, RACK_DEPTH / 2 + 0.01]}>
        <planeGeometry args={[RACK_WIDTH - 0.08, RACK_HEIGHT - 0.06]} />
        <meshStandardMaterial
          color="#0a0c10"
          transparent
          opacity={0.6}
          side={THREE.DoubleSide}
        />
      </mesh>

      <pointLight
        position={[0, 0.1, RACK_DEPTH / 2 + 0.1]}
        intensity={0.15}
        color={statusGlowColor}
        distance={1.5}
        decay={2}
      />

      <mesh position={[0, 0.05, RACK_DEPTH / 2 + 0.02]}>
        <boxGeometry args={[RACK_WIDTH - 0.1, 0.02, 0.01]} />
        <meshStandardMaterial
          color={statusGlowColor}
          emissive={statusGlowColor}
          emissiveIntensity={0.8}
        />
      </mesh>
    </group>
  );
}

export function Rack3D({ rack, position, isSelected, onSelect, equipmentCatalog }: Rack3DProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);

  const thermalStatus = useMemo(() => {
    if (rack.inletTemp > 30) return "critical";
    if (rack.inletTemp > 27) return "warning";
    if (rack.inletTemp > 25) return "elevated";
    return "normal";
  }, [rack.inletTemp]);

  useFrame((state) => {
    if (groupRef.current) {
      const targetY = hovered || isSelected ? 0.1 : 0;
      groupRef.current.position.y = THREE.MathUtils.lerp(
        groupRef.current.position.y,
        targetY,
        0.1
      );
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

      {hovered && !isSelected && (
        <mesh position={[0, RACK_HEIGHT + 0.3, 0]}>
          <boxGeometry args={[0.4, 0.15, 0.01]} />
          <meshBasicMaterial color="#1a1d24" transparent opacity={0.9} />
        </mesh>
      )}
    </group>
  );
}
