import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export function RaisedFloor({ size = 30 }: { size?: number }) {
  const tileSize = 0.6;
  const tilesPerSide = Math.ceil(size / tileSize);
  
  const tiles = useMemo(() => {
    const result = [];
    for (let x = -tilesPerSide; x <= tilesPerSide; x++) {
      for (let z = -tilesPerSide; z <= tilesPerSide; z++) {
        const isVent = Math.random() < 0.08;
        result.push({ x: x * tileSize, z: z * tileSize, isVent });
      }
    }
    return result;
  }, [tilesPerSide, tileSize]);

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
        <planeGeometry args={[size * 2.5, size * 2.5]} />
        <meshStandardMaterial color="#1a1d24" roughness={0.7} metalness={0.3} />
      </mesh>
      
      {tiles.map((tile, i) => (
        <group key={i} position={[tile.x, 0, tile.z]}>
          <mesh position={[0, 0.001, 0]} receiveShadow>
            <boxGeometry args={[tileSize - 0.02, 0.015, tileSize - 0.02]} />
            <meshStandardMaterial
              color={tile.isVent ? "#0a0c10" : "#22262e"}
              roughness={tile.isVent ? 0.9 : 0.6}
              metalness={tile.isVent ? 0.1 : 0.4}
            />
          </mesh>
          
          {tile.isVent && (
            <>
              {Array.from({ length: 8 }).map((_, j) => (
                <mesh key={j} position={[0, 0.02, (j - 3.5) * (tileSize / 10)]}>
                  <boxGeometry args={[tileSize - 0.08, 0.005, 0.015]} />
                  <meshStandardMaterial color="#1a1d24" metalness={0.8} roughness={0.3} />
                </mesh>
              ))}
            </>
          )}
        </group>
      ))}
      
      <gridHelper
        args={[size * 2.2, size * 2.2 / tileSize, "#2a3040", "#1e222a"]}
        position={[0, 0.025, 0]}
      />
    </group>
  );
}

export function CableTrays({ length = 20, rows = 3 }: { length?: number; rows?: number }) {
  const trayHeight = 12;
  
  return (
    <group>
      {Array.from({ length: rows }).map((_, i) => (
        <group key={i} position={[0, trayHeight, (i - (rows - 1) / 2) * 5]}>
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[length, 0.05, 0.6]} />
            <meshStandardMaterial color="#3a3a3a" metalness={0.7} roughness={0.4} />
          </mesh>
          
          <mesh position={[0, 0, -0.28]}>
            <boxGeometry args={[length, 0.15, 0.04]} />
            <meshStandardMaterial color="#444444" metalness={0.8} roughness={0.3} />
          </mesh>
          <mesh position={[0, 0, 0.28]}>
            <boxGeometry args={[length, 0.15, 0.04]} />
            <meshStandardMaterial color="#444444" metalness={0.8} roughness={0.3} />
          </mesh>
          
          {Array.from({ length: 5 }).map((_, j) => (
            <CableBundle 
              key={j}
              position={[(j - 2) * (length / 6), 0.1, (Math.random() - 0.5) * 0.3]}
              radius={0.03 + Math.random() * 0.04}
              length={length * 0.8}
              color={["#222222", "#0055aa", "#aa5500", "#00aa55"][j % 4]}
            />
          ))}
        </group>
      ))}
    </group>
  );
}

function CableBundle({ 
  position, 
  radius, 
  length, 
  color 
}: { 
  position: [number, number, number]; 
  radius: number; 
  length: number; 
  color: string;
}) {
  return (
    <mesh position={position} rotation={[0, 0, Math.PI / 2]}>
      <cylinderGeometry args={[radius, radius, length, 8]} />
      <meshStandardMaterial color={color} roughness={0.8} metalness={0.1} />
    </mesh>
  );
}

export function CRACUnit({ position }: { position: [number, number, number] }) {
  const fanRef = useRef<THREE.Mesh>(null);
  
  useFrame((_, delta) => {
    if (fanRef.current) {
      fanRef.current.rotation.z += delta * 8;
    }
  });

  return (
    <group position={position}>
      <mesh position={[0, 1.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.2, 3, 0.8]} />
        <meshStandardMaterial color="#e8e8e8" roughness={0.5} metalness={0.3} />
      </mesh>
      
      <mesh position={[0.61, 1.5, 0]}>
        <boxGeometry args={[0.02, 2.8, 0.7]} />
        <meshStandardMaterial color="#2a4a6a" roughness={0.3} metalness={0.6} />
      </mesh>
      
      <mesh position={[-0.61, 2.2, 0]}>
        <boxGeometry args={[0.02, 0.6, 0.5]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.9} />
      </mesh>
      
      <group position={[-0.61, 2.2, 0]}>
        <mesh ref={fanRef}>
          <cylinderGeometry args={[0.15, 0.15, 0.03, 6]} />
          <meshStandardMaterial color="#333333" roughness={0.5} />
        </mesh>
      </group>
      
      <mesh position={[0, 0.15, 0.41]}>
        <planeGeometry args={[0.2, 0.1]} />
        <meshStandardMaterial
          color="#00ff00"
          emissive="#00ff00"
          emissiveIntensity={2}
        />
      </mesh>
      
      <mesh position={[0, 3.1, 0]}>
        <boxGeometry args={[0.8, 0.15, 0.6]} />
        <meshStandardMaterial color="#cccccc" roughness={0.4} metalness={0.5} />
      </mesh>
    </group>
  );
}

export function FireSuppressionSystem({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 2, 0]}>
        <cylinderGeometry args={[0.15, 0.15, 1.5, 16]} />
        <meshStandardMaterial color="#cc0000" roughness={0.4} metalness={0.6} />
      </mesh>
      
      <mesh position={[0, 2.8, 0]}>
        <cylinderGeometry args={[0.08, 0.12, 0.15, 12]} />
        <meshStandardMaterial color="#333333" metalness={0.8} roughness={0.3} />
      </mesh>
      
      <mesh position={[0, 2.5, 0.16]}>
        <boxGeometry args={[0.08, 0.15, 0.02]} />
        <meshStandardMaterial color="#333333" metalness={0.7} roughness={0.4} />
      </mesh>
      
      <mesh position={[0, 1, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 0.5, 8]} />
        <meshStandardMaterial color="#333333" metalness={0.8} roughness={0.3} />
      </mesh>
      
      <mesh position={[0.2, 0.75, 0]}>
        <boxGeometry args={[0.15, 0.08, 0.08]} />
        <meshStandardMaterial color="#555555" metalness={0.7} roughness={0.4} />
      </mesh>
    </group>
  );
}

export function EmergencyLight({ position }: { position: [number, number, number] }) {
  const lightRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (lightRef.current) {
      const mat = lightRef.current.material as THREE.MeshStandardMaterial;
      const pulse = Math.sin(state.clock.elapsedTime * 2) > 0.8 ? 3 : 0.5;
      mat.emissiveIntensity = pulse;
    }
  });

  return (
    <group position={position}>
      <mesh>
        <boxGeometry args={[0.2, 0.1, 0.08]} />
        <meshStandardMaterial color="#333333" metalness={0.6} roughness={0.4} />
      </mesh>
      
      <mesh ref={lightRef} position={[0, -0.06, 0]}>
        <boxGeometry args={[0.12, 0.02, 0.05]} />
        <meshStandardMaterial
          color="#ff0000"
          emissive="#ff0000"
          emissiveIntensity={0.5}
        />
      </mesh>
    </group>
  );
}

export function StatusPanel({ position }: { position: [number, number, number] }) {
  const screenRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (screenRef.current) {
      const mat = screenRef.current.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = 0.8 + Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
    }
  });

  return (
    <group position={position}>
      <mesh>
        <boxGeometry args={[0.8, 0.5, 0.05]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.5} roughness={0.6} />
      </mesh>
      
      <mesh ref={screenRef} position={[0, 0, 0.03]}>
        <planeGeometry args={[0.7, 0.4]} />
        <meshStandardMaterial
          color="#001830"
          emissive="#003366"
          emissiveIntensity={0.8}
        />
      </mesh>
      
      {Array.from({ length: 4 }).map((_, i) => (
        <mesh key={i} position={[-0.25 + i * 0.17, 0.12, 0.031]}>
          <planeGeometry args={[0.12, 0.06]} />
          <meshStandardMaterial
            color={i === 2 ? "#442200" : "#002244"}
            emissive={i === 2 ? "#ff8800" : "#00aaff"}
            emissiveIntensity={1.5}
          />
        </mesh>
      ))}
      
      <mesh position={[0.3, -0.1, 0.031]}>
        <circleGeometry args={[0.03, 16]} />
        <meshStandardMaterial
          color="#003300"
          emissive="#00ff00"
          emissiveIntensity={2}
        />
      </mesh>
    </group>
  );
}
