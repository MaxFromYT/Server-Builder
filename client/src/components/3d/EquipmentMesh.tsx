import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { Equipment, InstalledEquipment } from "@shared/schema";

interface EquipmentMeshProps {
  equipment: Equipment;
  installed: InstalledEquipment;
  position: [number, number, number];
  rackWidth: number;
  rackDepth: number;
  uHeight: number;
}

function LEDIndicator({ 
  position, 
  color, 
  intensity = 1,
  blinkSpeed = 0
}: { 
  position: [number, number, number]; 
  color: string; 
  intensity?: number;
  blinkSpeed?: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (blinkSpeed > 0 && meshRef.current) {
      const blink = Math.sin(state.clock.elapsedTime * blinkSpeed) > 0 ? 1 : 0.2;
      (meshRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = intensity * blink * 2;
    }
  });

  return (
    <mesh ref={meshRef} position={position}>
      <sphereGeometry args={[0.006, 6, 6]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={intensity * 2}
      />
    </mesh>
  );
}

function NetworkPort({ position, isActive }: { position: [number, number, number]; isActive: boolean }) {
  return (
    <group position={position}>
      <mesh>
        <boxGeometry args={[0.012, 0.008, 0.004]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.5} roughness={0.5} />
      </mesh>
      {isActive && (
        <LEDIndicator
          position={[0, 0.006, 0.003]}
          color="#00ff44"
          intensity={0.8}
          blinkSpeed={Math.random() * 10 + 5}
        />
      )}
    </group>
  );
}

function FanGrill({ position, size, isSpinning }: { position: [number, number, number]; size: number; isSpinning: boolean }) {
  const fanRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (fanRef.current && isSpinning) {
      fanRef.current.rotation.z += 0.3;
    }
  });

  return (
    <group position={position}>
      <mesh>
        <circleGeometry args={[size / 2, 16]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.3} roughness={0.7} />
      </mesh>
      <mesh ref={fanRef} position={[0, 0, 0.001]}>
        <circleGeometry args={[size / 2.5, 6]} />
        <meshStandardMaterial color="#333333" metalness={0.5} roughness={0.5} />
      </mesh>
    </group>
  );
}

function DriveBay({ position, hasActivity }: { position: [number, number, number]; hasActivity: boolean }) {
  return (
    <group position={position}>
      <mesh>
        <boxGeometry args={[0.025, 0.015, 0.003]} />
        <meshStandardMaterial color="#2a2a2a" metalness={0.6} roughness={0.4} />
      </mesh>
      <LEDIndicator
        position={[0.008, 0.004, 0.002]}
        color={hasActivity ? "#00aaff" : "#004488"}
        intensity={hasActivity ? 1 : 0.3}
        blinkSpeed={hasActivity ? Math.random() * 20 + 10 : 0}
      />
    </group>
  );
}

export function EquipmentMesh({ equipment, installed, position, rackWidth, rackDepth, uHeight }: EquipmentMeshProps) {
  const groupRef = useRef<THREE.Group>(null);

  const equipmentHeight = equipment.uHeight * uHeight;
  const equipmentWidth = rackWidth - 0.08;
  const equipmentDepth = rackDepth - 0.1;

  const equipmentColor = useMemo(() => {
    return equipment.color || "#2a2a2a";
  }, [equipment.color]);

  const statusColor = useMemo(() => {
    switch (installed.status) {
      case "critical": return "#ff2200";
      case "warning": return "#ffaa00";
      case "offline": return "#444444";
      default: return equipment.ledColor || "#00ff44";
    }
  }, [installed.status, equipment.ledColor]);

  const isServer = equipment.type.startsWith("server");
  const isSwitch = equipment.type.startsWith("switch");
  const isStorage = equipment.type.startsWith("storage");
  const isNetwork = equipment.type.startsWith("router") || equipment.type.startsWith("firewall");
  const isPDU = equipment.type.startsWith("pdu");
  const isUPS = equipment.type.startsWith("ups");

  const portCount = equipment.portCount || 0;
  const networkActivity = installed.networkActivity || 0;

  return (
    <group ref={groupRef} position={position}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[equipmentWidth, equipmentHeight - 0.003, equipmentDepth]} />
        <meshStandardMaterial
          color={equipmentColor}
          metalness={0.7}
          roughness={0.3}
        />
      </mesh>

      <mesh position={[0, 0, equipmentDepth / 2 + 0.001]}>
        <planeGeometry args={[equipmentWidth, equipmentHeight - 0.005]} />
        <meshStandardMaterial
          color="#0a0a0a"
          metalness={0.5}
          roughness={0.5}
        />
      </mesh>

      <LEDIndicator
        position={[-equipmentWidth / 2 + 0.02, equipmentHeight / 2 - 0.015, equipmentDepth / 2 + 0.005]}
        color={statusColor}
        intensity={1}
        blinkSpeed={installed.status === "warning" ? 4 : 0}
      />

      {isServer && (
        <>
          {Array.from({ length: Math.min(4, Math.floor(portCount / 2)) }).map((_, i) => (
            <NetworkPort
              key={`port-${i}`}
              position={[
                equipmentWidth / 2 - 0.03 - i * 0.018,
                -equipmentHeight / 2 + 0.015,
                equipmentDepth / 2 + 0.003
              ]}
              isActive={networkActivity > 20 + i * 15}
            />
          ))}

          {equipment.hasFans && (
            <>
              {Array.from({ length: equipment.uHeight >= 2 ? 4 : 2 }).map((_, i) => (
                <FanGrill
                  key={`fan-${i}`}
                  position={[
                    -equipmentWidth / 2 + 0.04 + i * 0.06,
                    0,
                    -equipmentDepth / 2 - 0.001
                  ]}
                  size={0.04}
                  isSpinning={installed.status !== "offline"}
                />
              ))}
            </>
          )}

          <mesh position={[0, equipmentHeight / 2 - 0.012, equipmentDepth / 2 + 0.003]}>
            <planeGeometry args={[equipmentWidth * 0.3, 0.008]} />
            <meshStandardMaterial
              color="#ffffff"
              emissive="#ffffff"
              emissiveIntensity={0.1}
            />
          </mesh>
        </>
      )}

      {isSwitch && (
        <>
          {Array.from({ length: Math.min(portCount, 24) }).map((_, i) => {
            const row = Math.floor(i / 12);
            const col = i % 12;
            return (
              <NetworkPort
                key={`switch-port-${i}`}
                position={[
                  -equipmentWidth / 2 + 0.03 + col * 0.04,
                  equipmentHeight / 2 - 0.015 - row * 0.018,
                  equipmentDepth / 2 + 0.003
                ]}
                isActive={Math.random() > 0.3}
              />
            );
          })}

          {Array.from({ length: Math.min(8, portCount) }).map((_, i) => (
            <LEDIndicator
              key={`status-led-${i}`}
              position={[
                equipmentWidth / 2 - 0.02,
                equipmentHeight / 2 - 0.01 - i * 0.008,
                equipmentDepth / 2 + 0.005
              ]}
              color={Math.random() > 0.2 ? "#00ff44" : "#ffaa00"}
              intensity={0.6}
              blinkSpeed={Math.random() * 15 + 5}
            />
          ))}
        </>
      )}

      {isStorage && (
        <>
          {Array.from({ length: Math.min(12, equipment.uHeight * 6) }).map((_, i) => {
            const row = Math.floor(i / 6);
            const col = i % 6;
            return (
              <DriveBay
                key={`drive-${i}`}
                position={[
                  -equipmentWidth / 2 + 0.05 + col * 0.07,
                  equipmentHeight / 2 - 0.02 - row * 0.022,
                  equipmentDepth / 2 + 0.003
                ]}
                hasActivity={Math.random() > 0.5}
              />
            );
          })}

          <LEDIndicator
            position={[equipmentWidth / 2 - 0.02, 0, equipmentDepth / 2 + 0.005]}
            color={equipment.ledColor || "#0088ff"}
            intensity={1}
          />
        </>
      )}

      {isNetwork && (
        <>
          {Array.from({ length: Math.min(portCount, 8) }).map((_, i) => (
            <NetworkPort
              key={`net-port-${i}`}
              position={[
                -equipmentWidth / 2 + 0.04 + i * 0.055,
                0,
                equipmentDepth / 2 + 0.003
              ]}
              isActive={Math.random() > 0.4}
            />
          ))}

          <mesh position={[equipmentWidth / 2 - 0.05, 0, equipmentDepth / 2 + 0.003]}>
            <planeGeometry args={[0.06, equipmentHeight * 0.6]} />
            <meshStandardMaterial
              color="#111111"
              metalness={0.8}
              roughness={0.2}
            />
          </mesh>
        </>
      )}

      {isPDU && (
        <>
          {Array.from({ length: Math.min(portCount, 12) }).map((_, i) => (
            <group
              key={`outlet-${i}`}
              position={[
                -equipmentWidth / 2 + 0.04 + i * 0.04,
                0,
                equipmentDepth / 2 + 0.003
              ]}
            >
              <mesh>
                <boxGeometry args={[0.02, 0.015, 0.003]} />
                <meshStandardMaterial color="#1a1a1a" />
              </mesh>
              <LEDIndicator
                position={[0, 0.01, 0.002]}
                color={equipment.ledColor || "#ffaa00"}
                intensity={0.5}
              />
            </group>
          ))}
        </>
      )}

      {isUPS && (
        <>
          <mesh position={[0, equipmentHeight / 2 - 0.02, equipmentDepth / 2 + 0.003]}>
            <planeGeometry args={[0.08, 0.02]} />
            <meshStandardMaterial
              color="#00ff44"
              emissive="#00ff44"
              emissiveIntensity={0.5}
            />
          </mesh>

          {Array.from({ length: 4 }).map((_, i) => (
            <LEDIndicator
              key={`battery-led-${i}`}
              position={[
                -0.03 + i * 0.02,
                equipmentHeight / 2 - 0.04,
                equipmentDepth / 2 + 0.005
              ]}
              color="#00ff44"
              intensity={0.8}
            />
          ))}
        </>
      )}
    </group>
  );
}
