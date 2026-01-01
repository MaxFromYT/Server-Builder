import { useRef, useMemo } from "react";
import * as THREE from "three";
import { useGame } from "@/lib/game-context";

interface DatacenterFloorProps {
  size: number;
  showHeatmap?: boolean;
}

export function DatacenterFloor({ size, showHeatmap = false }: DatacenterFloorProps) {
  const floorRef = useRef<THREE.Mesh>(null);
  const { racks } = useGame();
  const ceilingHeight = 22;

  const gridTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;
    
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, 128, 128);
    
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    ctx.strokeRect(32, 32, 64, 64);
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(size / 2, size / 2);
    return texture;
  }, [size]);

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
          map={gridTexture}
          color="#0f172a"
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

      {showHeatmap && racks && (
        <HeatmapOverlay size={size} racks={racks} />
      )}

      {Array.from({ length: 3 }).map((_, i) => (
        <mesh key={`ceiling-light-${i}`} position={[(i - 1) * 8, ceilingHeight - 0.1, 0]}>
          <boxGeometry args={[6, 0.1, 0.6]} />
          <meshStandardMaterial
            color="#c0d0ff"
            emissive="#c0d0ff"
            emissiveIntensity={1.5}
          />
        </mesh>
      ))}

      <mesh position={[0, ceilingHeight, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[size * 2, size * 2]} />
        <meshStandardMaterial color="#0b0f16" emissive="#070a10" emissiveIntensity={0.4} side={THREE.DoubleSide} />
      </mesh>

      <mesh position={[0, ceilingHeight - 4, 0]}>
        <sphereGeometry args={[size * 1.15, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#0a0e17" metalness={0.2} roughness={0.9} side={THREE.BackSide} />
      </mesh>
    </group>
  );
}

function HeatmapOverlay({ size, racks }: { size: number; racks: any[] }) {
  const points = useMemo(() => {
    return racks.map(r => ({
      x: r.positionX,
      z: r.positionY,
      temp: r.inletTemp,
      power: r.currentPowerDraw
    }));
  }, [racks]);

  return (
    <group position={[0, 0.02, 0]}>
      {points.map((p, i) => {
        const rackSpacing = 2.0;
        const aisleSpacing = 4.0;
        const maxCol = Math.max(...racks.map(r => r.positionX), 0);
        const maxRow = Math.max(...racks.map(r => r.positionY), 0);
        const centerX = (maxCol * rackSpacing) / 2;
        const centerZ = (maxRow * aisleSpacing) / 2;

        return (
          <mesh 
            key={i} 
            position={[p.x * rackSpacing - centerX, 0, p.z * aisleSpacing - centerZ]} 
            rotation={[-Math.PI/2, 0, 0]}
          >
            <planeGeometry args={[1.5, 3]} />
            <meshBasicMaterial 
              color={p.temp > 30 ? "#ff2200" : p.temp > 27 ? "#ffaa00" : p.temp > 25 ? "#ffcc00" : "#00ff44"}
              transparent
              opacity={0.2}
            />
          </mesh>
        );
      })}
    </group>
  );
}
