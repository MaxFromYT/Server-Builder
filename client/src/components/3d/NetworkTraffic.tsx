import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface DataPacket {
  progress: number;
  speed: number;
  lane: number;
}

export function NetworkTrafficStream({
  start,
  end,
  intensity = 1,
  color = "#00ffaa",
}: {
  start: [number, number, number];
  end: [number, number, number];
  intensity?: number;
  color?: string;
}) {
  const count = Math.floor(45 * intensity);
  const meshRef = useRef<THREE.Points>(null);

  const data = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const packets: DataPacket[] = [];

    for (let i = 0; i < count; i++) {
      packets.push({
        progress: Math.random(),
        speed: 0.3 + Math.random() * 0.7,
        lane: (Math.random() - 0.5) * 0.15,
      });
    sizes[i] = 0.03 + Math.random() * 0.03;
    }

    return { positions, sizes, packets };
  }, [count]);

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    const geo = meshRef.current.geometry;
    const posArray = geo.attributes.position.array as Float32Array;

    for (let i = 0; i < count; i++) {
      const packet = data.packets[i];
      packet.progress += delta * packet.speed;
      if (packet.progress > 1) {
        packet.progress = 0;
        packet.speed = 0.3 + Math.random() * 0.7;
      }

      const t = packet.progress;
      const controlY = Math.max(start[1], end[1]) + 0.5;
      
      const mt = 1 - t;
      posArray[i * 3] = mt * mt * start[0] + 2 * mt * t * ((start[0] + end[0]) / 2 + packet.lane) + t * t * end[0];
      posArray[i * 3 + 1] = mt * mt * start[1] + 2 * mt * t * controlY + t * t * end[1];
      posArray[i * 3 + 2] = mt * mt * start[2] + 2 * mt * t * ((start[2] + end[2]) / 2 + packet.lane) + t * t * end[2];
    }

    geo.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={data.positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-size"
          count={count}
          array={data.sizes}
          itemSize={1}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.06}
        color={color}
        transparent
        opacity={0.9}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

export function PowerFlowVisualization({
  source,
  targets,
  active = true,
}: {
  source: [number, number, number];
  targets: [number, number, number][];
  active?: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null);

  const lines = useMemo(() => {
    return targets.map((target) => {
      const points = [
        new THREE.Vector3(...source),
        new THREE.Vector3(source[0], source[1] + 0.3, source[2]),
        new THREE.Vector3(target[0], target[1] + 0.3, target[2]),
        new THREE.Vector3(...target),
      ];
      const curve = new THREE.CatmullRomCurve3(points);
      const curvePoints = curve.getPoints(20);
      const geometry = new THREE.BufferGeometry().setFromPoints(curvePoints);
      const material = new THREE.LineBasicMaterial({
        color: "#ffaa00",
        transparent: true,
        opacity: 0.5,
      });
      return new THREE.Line(geometry, material);
    });
  }, [source, targets]);

  useFrame((state) => {
    if (!active) return;
    lines.forEach((line, i) => {
      const mat = line.material as THREE.LineBasicMaterial;
      const pulse = Math.sin(state.clock.elapsedTime * 3 + i * 0.5) * 0.5 + 0.5;
      mat.opacity = 0.3 + pulse * 0.4;
    });
  });

  return (
    <group ref={groupRef}>
      {lines.map((line, i) => (
        <primitive key={i} object={line} />
      ))}
    </group>
  );
}

export function DataCenterNetworkMesh({
  racks,
  maxConnections = 50,
  maxStreams = 15,
  heatmapInfluence = 0,
}: {
  racks: { position: [number, number, number]; heat?: number }[];
  maxConnections?: number;
  maxStreams?: number;
  heatmapInfluence?: number;
}) {
  const connections = useMemo(() => {
    if (racks.length < 2) return [];
    const result: { start: [number, number, number]; end: [number, number, number]; intensity: number; heat?: number }[] = [];
    const targetCount = Math.min(maxConnections, racks.length * 2);
    const sorted = [...racks].sort((a, b) => {
      if (a.position[2] === b.position[2]) return a.position[0] - b.position[0];
      return a.position[2] - b.position[2];
    });

    for (let i = 0; i < targetCount; i++) {
      const startIndex = i % (sorted.length - 1);
      const endIndex = (startIndex + 1) % sorted.length;
      const startRack = sorted[startIndex];
      const endRack = sorted[endIndex];
      result.push({
        start: [startRack.position[0], startRack.position[1] + 1.5, startRack.position[2]],
        end: [endRack.position[0], endRack.position[1] + 1.5, endRack.position[2]],
        intensity: 0.35 + (i % 5) * 0.12,
        heat: ((startRack.heat || 0) + (endRack.heat || 0)) / 2,
      });
    }

    return result;
  }, [maxConnections, racks]);

  return (
    <group>
      {connections.slice(0, maxStreams).map((conn, i) => (
        <NetworkTrafficStream
          key={i}
          start={conn.start}
          end={conn.end}
          intensity={conn.intensity}
          color={
            heatmapInfluence > 0 && typeof conn.heat === "number"
              ? conn.heat > 40
                ? "#ff4d2e"
                : conn.heat > 35
                ? "#ff9f1c"
                : conn.heat > 30
                ? "#facc15"
                : "#22d3ee"
              : ["#00ffaa", "#00aaff", "#aa88ff", "#ffaa00"][i % 4]
          }
        />
      ))}
    </group>
  );
}
