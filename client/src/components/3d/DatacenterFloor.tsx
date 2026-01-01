import { useRef } from "react";
import * as THREE from "three";

interface DatacenterFloorProps {
  size: number;
}

export function DatacenterFloor({ size }: DatacenterFloorProps) {
  const floorRef = useRef<THREE.Mesh>(null);

  return (
    <group>
      <mesh
        ref={floorRef}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.01, 0]}
        receiveShadow
      >
        <planeGeometry args={[size * 2, size * 2]} />
        <meshStandardMaterial
          color="#1a1d24"
          roughness={0.8}
          metalness={0.2}
        />
      </mesh>

      <gridHelper
        args={[size * 2, size * 2, "#2a3040", "#1e222a"]}
        position={[0, 0.01, 0]}
      />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
        <planeGeometry args={[size * 3, size * 3]} />
        <meshBasicMaterial color="#0a0c10" />
      </mesh>

      {Array.from({ length: Math.ceil(size / 10) }).map((_, i) => (
        <group key={`ceiling-light-${i}`}>
          <pointLight
            position={[(i - Math.ceil(size / 20)) * 10, 15, 0]}
            intensity={0.3}
            color="#e0e8ff"
            distance={30}
            decay={2}
          />
          <mesh position={[(i - Math.ceil(size / 20)) * 10, 14.9, 0]}>
            <boxGeometry args={[4, 0.1, 0.5]} />
            <meshStandardMaterial
              color="#ffffff"
              emissive="#ffffff"
              emissiveIntensity={0.5}
            />
          </mesh>
        </group>
      ))}

      <mesh position={[0, 15, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[size * 2, size * 2]} />
        <meshStandardMaterial color="#0d1015" side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}
