import { useRef, useMemo } from "react";
import * as THREE from "three";
import { useGame } from "@/lib/game-context";
import { createStreamingCanvasTexture } from "@/lib/asset-manager";

interface DatacenterFloorProps {
  size: number;
  showHeatmap?: boolean;
  theme?: "dark" | "light";
}

export function DatacenterFloor({ size, showHeatmap = false, theme = "dark" }: DatacenterFloorProps) {
  const floorRef = useRef<THREE.Mesh>(null);
  const { racks } = useGame();
  const ceilingHeight = 36;
  const isLight = theme === "light";

  const gridTexture = useMemo(() => {
    return createStreamingCanvasTexture({
      lowResolution: 64,
      highResolution: 256,
      repeat: size / 2,
      draw: (ctx, dimension) => {
        const scale = dimension / 128;
        ctx.clearRect(0, 0, dimension, dimension);
        ctx.strokeStyle = isLight ? "#cbd5f5" : "#1e293b";
        ctx.lineWidth = 2 * scale;
        ctx.strokeRect(0, 0, dimension, dimension);

        ctx.strokeStyle = isLight ? "#94a3d8" : "#334155";
        ctx.lineWidth = 1 * scale;
        ctx.strokeRect(32 * scale, 32 * scale, 64 * scale, 64 * scale);

        ctx.strokeStyle = isLight ? "rgba(14, 116, 144, 0.35)" : "rgba(56, 189, 248, 0.2)";
        ctx.lineWidth = 1 * scale;
        ctx.beginPath();
        ctx.moveTo(0, 64 * scale);
        ctx.lineTo(dimension, 64 * scale);
        ctx.moveTo(64 * scale, 0);
        ctx.lineTo(64 * scale, dimension);
        ctx.stroke();
      },
    });
  }, [isLight, size]);

  const fadeTexture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext("2d")!;
    const gradient = ctx.createRadialGradient(128, 128, 10, 128, 128, 128);
    gradient.addColorStop(0, "rgba(255, 255, 255, 1)");
    gradient.addColorStop(0.7, "rgba(255, 255, 255, 0.9)");
    gradient.addColorStop(1, "rgba(255, 255, 255, 0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 256, 256);
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    return texture;
  }, []);

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
          alphaMap={fadeTexture}
          color={isLight ? "#dee7f5" : "#0b1326"}
          roughness={isLight ? 0.4 : 0.55}
          metalness={isLight ? 0.2 : 0.35}
          emissive={isLight ? "#eef4ff" : "#050a14"}
          emissiveIntensity={isLight ? 0.1 : 0.25}
          transparent
          opacity={0.98}
        />
      </mesh>

      <gridHelper
        args={[size * 2, size * 2, "#2a3040", "#1e222a"]}
        position={[0, 0.01, 0]}
      />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
        <planeGeometry args={[size * 12, size * 12]} />
        <meshBasicMaterial
          color={isLight ? "#e8eef7" : "#05070b"}
          alphaMap={fadeTexture}
          transparent
          opacity={0.5}
        />
      </mesh>

      <group>
        {[
          { position: [0, 0.02, size], args: [size * 2.05, 0.08, 0.25] },
          { position: [0, 0.02, -size], args: [size * 2.05, 0.08, 0.25] },
          { position: [size, 0.02, 0], args: [0.25, 0.08, size * 2.05] },
          { position: [-size, 0.02, 0], args: [0.25, 0.08, size * 2.05] },
        ].map((edge, i) => (
          <mesh key={`edge-${i}`} position={edge.position as [number, number, number]} castShadow receiveShadow>
            <boxGeometry args={edge.args as [number, number, number]} />
            <meshStandardMaterial
              color={isLight ? "#d5dde9" : "#0f172a"}
              metalness={isLight ? 0.4 : 0.6}
              roughness={isLight ? 0.35 : 0.3}
              emissive={isLight ? "#b8c3d6" : "#0b244a"}
              emissiveIntensity={isLight ? 0.15 : 0.3}
            />
          </mesh>
        ))}
      </group>

      {showHeatmap && racks && (
        <HeatmapOverlay size={size} racks={racks} />
      )}

      <mesh position={[0, ceilingHeight, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[size * 2, size * 2]} />
        <meshStandardMaterial
          color={isLight ? "#f1f5fb" : "#0b0f16"}
          emissive={isLight ? "#e2e8f0" : "#070a10"}
          emissiveIntensity={isLight ? 0.2 : 0.4}
          side={THREE.DoubleSide}
        />
      </mesh>

      <mesh position={[0, ceilingHeight - 4, 0]}>
        <sphereGeometry args={[size * 1.15, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial
          color={isLight ? "#e5eef9" : "#0a0e17"}
          metalness={isLight ? 0.1 : 0.2}
          roughness={isLight ? 0.6 : 0.9}
          side={THREE.BackSide}
        />
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
