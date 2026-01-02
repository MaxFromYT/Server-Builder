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
    const sorted = [...racks].sort((a, b) => {
      if (a.position[2] === b.position[2]) return a.position[0] - b.position[0];
      return a.position[2] - b.position[2];
    });

    const baseLinks = sorted.flatMap((rack, index) => {
      const next = sorted[(index + 1) % sorted.length];
      const skip = sorted[(index + 3) % sorted.length];
      return [
        { start: rack, end: next, intensity: 0.45 },
        { start: rack, end: skip, intensity: 0.35 },
      ];
    });

    const targetCount = Math.min(maxConnections, sorted.length * 6);
    const randomLinks = Array.from({ length: Math.max(0, targetCount - baseLinks.length) }).map(() => {
      const start = sorted[Math.floor(Math.random() * sorted.length)];
      let end = sorted[Math.floor(Math.random() * sorted.length)];
      if (end === start) {
        end = sorted[(sorted.indexOf(start) + 2) % sorted.length];
      }
      return {
        start,
        end,
        intensity: 0.3 + Math.random() * 0.4,
      };
    });

    [...baseLinks, ...randomLinks].forEach((link, i) => {
      result.push({
        start: [link.start.position[0], link.start.position[1] + 1.5, link.start.position[2]],
        end: [link.end.position[0], link.end.position[1] + 1.5, link.end.position[2]],
        intensity: link.intensity + (i % 4) * 0.05,
        heat: ((link.start.heat || 0) + (link.end.heat || 0)) / 2,
      });
    });

    return result;
  }, [maxConnections, racks]);

  return (
    <group>
      {connections.slice(0, Math.min(maxStreams, connections.length)).map((conn, i) => (
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
