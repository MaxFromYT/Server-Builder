import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Mesh } from "three";
import { useBuild } from "@/lib/build-context";

interface Rack3DProps {
  id: string;
  position: [number, number, number];
  isSelected?: boolean;
  onSelect?: () => void;
}

export function Rack3D({ id, position, isSelected, onSelect }: Rack3DProps) {
  const meshRef = useRef<Mesh>(null);
  const { mode } = useBuild();

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    // Optional: slow idle rotation or visual pulse
    if (mode === "rotate" && isSelected) {
      meshRef.current.rotation.y += delta * 0.5;
    }
  });

  return (
    <group position={position}>
      {/* Main rack body */}
      <mesh ref={meshRef}>
        <boxGeometry args={[1.4, 3.2, 2.2]} />
        <meshStandardMaterial
          color={isSelected ? "#00ffff" : "#202830"}
          emissive={isSelected ? "#00ffff" : "#000000"}
          emissiveIntensity={isSelected ? 0.6 : 0}
        />
      </mesh>

      {/* Hitbox (invisible click collider) */}
      <mesh
        position={[0, 1.4, 0]}
        onPointerDown={(e) => {
          e.stopPropagation();
          const native = e.nativeEvent as PointerEvent;
          const isPrimary =
            native.pointerType !== "mouse" ||
            native.button === 0 ||
            native.buttons === 1;
          if (isPrimary && onSelect) onSelect();
        }}
      >
        <boxGeometry args={[1.5, 3.5, 2.3]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
  );
}
