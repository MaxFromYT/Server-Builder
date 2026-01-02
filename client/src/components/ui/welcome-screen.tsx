import { Canvas } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera, Sparkles as DreiSparkles } from "@react-three/drei";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Cpu, Eye, Hammer, Play, Shield, Sparkles } from "lucide-react";
import { Rack3D } from "@/components/3d/Rack3D";
import { staticEquipmentCatalog } from "@/lib/static-equipment";
import type { Rack } from "@shared/schema";
import * as THREE from "three";

type StartMode = "build" | "explore";

const createSeededRandom = (seed: number) => {
  let t = seed;
  return () => {
    t += 0x6d2b79f5;
    let r = t;
    r = Math.imul(r ^ (r >>> 15), r | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
};

const buildIntroRack = (
  index: number,
  positionX: number,
  positionY: number
): Rack => {
  const slots = Array.from({ length: 42 }).map((_, slotIndex) => ({
    uPosition: slotIndex + 1,
    equipmentInstanceId: null,
  }));
  const rng = createSeededRandom(100 + index);
  const installedEquipment: Rack["installedEquipment"] = [];
  let u = 1;
  while (u <= 42) {
    const equipment = staticEquipmentCatalog[Math.floor(rng() * staticEquipmentCatalog.length)];
    const uEnd = Math.min(42, u + equipment.uHeight - 1);
    const instanceId = `intro-${index}-${u}-${equipment.id}`;
    for (let slot = u; slot <= uEnd; slot += 1) {
      slots[slot - 1].equipmentInstanceId = instanceId;
    }
    installedEquipment.push({
      id: instanceId,
      equipmentId: equipment.id,
      uStart: u,
      uEnd,
      status: "online",
      cpuLoad: 40 + rng() * 40,
      memoryUsage: 30 + rng() * 50,
      networkActivity: 20 + rng() * 60,
    });
    u = uEnd + 1 + (rng() > 0.8 ? 1 : 0);
  }

  return {
    id: `intro-rack-${index}`,
    name: `R${index + 1}`,
    type: "enclosed_42U",
    totalUs: 42,
    slots,
    installedEquipment,
    powerCapacity: 12000,
    currentPowerDraw: 3200,
    inletTemp: 22,
    exhaustTemp: 28,
    airflowRestriction: 0.1,
    positionX,
    positionY,
  };
};

export function WelcomeScreen({
  isVisible,
  onStart,
  defaultMode = "build",
}: {
  isVisible: boolean;
  onStart?: (mode: StartMode) => void;
  defaultMode?: StartMode;
}) {
  const [mode, setMode] = useState<StartMode>(defaultMode);

  useEffect(() => {
    setMode(defaultMode);
  }, [defaultMode]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[100] overflow-hidden bg-black">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.35),_transparent_45%),radial-gradient(circle_at_70%_20%,_rgba(168,85,247,0.3),_transparent_45%),radial-gradient(circle_at_20%_80%,_rgba(20,184,166,0.35),_transparent_40%)] opacity-90" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/20 via-black/10 to-black/70" />
      <div className="pointer-events-none absolute inset-0 animate-[pulse_6s_ease-in-out_infinite] bg-[radial-gradient(circle_at_50%_50%,_rgba(14,165,233,0.18),_transparent_60%)]" />
      <div className="pointer-events-none absolute -inset-24 bg-[conic-gradient(from_90deg_at_50%_50%,rgba(34,211,238,0.15),rgba(59,130,246,0.05),rgba(168,85,247,0.2),rgba(34,211,238,0.15))] blur-2xl opacity-60" />

      <div className="absolute inset-0 z-0">
        <Canvas
          dpr={1}
          gl={{ antialias: false, powerPreference: "high-performance" }}
          frameloop="demand"
          className="h-full w-full pointer-events-auto"
        >
          <IntroScene />
        </Canvas>
      </div>

      <div className="mx-auto flex h-full max-w-6xl flex-col justify-center px-6 py-10 relative z-10 pointer-events-auto">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-cyan-300" />
              <h1 className="text-3xl font-bold tracking-wide text-white" style={{ fontFamily: "Orbitron, sans-serif" }}>
                HYPERSCALE
              </h1>
              <Badge className="bg-cyan-500/20 text-cyan-200 border border-cyan-500/30">Alpha</Badge>
            </div>
            <p className="text-sm text-white/70">
              Pick a mode. Build is interactive editing. Explore is cinematic flythrough.
            </p>
            <p className="text-xs text-cyan-200/70 uppercase tracking-[0.3em]">
              Created by Max Doubin
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant={mode === "build" ? "default" : "ghost"}
              onClick={() => setMode("build")}
              className={mode === "build" ? "bg-cyan-500/20 text-cyan-100 border border-cyan-500/30" : "text-white/70"}
            >
              <Hammer className="mr-2 h-4 w-4" />
              Build
            </Button>
            <Button
              type="button"
              variant={mode === "explore" ? "default" : "ghost"}
              onClick={() => setMode("explore")}
              className={mode === "explore" ? "bg-purple-500/20 text-purple-100 border border-purple-500/30" : "text-white/70"}
            >
              <Eye className="mr-2 h-4 w-4" />
              Explore
            </Button>
            <Button
              type="button"
              onClick={() => onStart?.(mode)}
              className="bg-white/10 text-white hover:bg-white/15 border border-white/10"
            >
              <Play className="mr-2 h-4 w-4" />
              Start
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <LiveFeed title="Cam A" subtitle="Aisle sweep" variant="a" />
          <LiveFeed title="Cam B" subtitle="Cold side" variant="b" />
          <LiveFeed title="Cam C" subtitle="Hot aisle" variant="c" />
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <InfoCard
            icon={<Cpu className="h-4 w-4 text-cyan-200" />}
            title="Performance"
            body="Use the Quality toggle to tune visuals. Press H to toggle the HUD."
          />
          <InfoCard
            icon={<Shield className="h-4 w-4 text-cyan-200" />}
            title="Controls"
            body="Click racks to select. Drag to orbit. Scroll to zoom. Press T to toggle toolbars."
          />
          <InfoCard
            icon={<Sparkles className="h-4 w-4 text-cyan-200" />}
            title="Modes"
            body="Build mode shows editing toolbars. Explore mode can default to cinematic camera."
          />
          <InfoCard
            icon={<Sparkles className="h-4 w-4 text-cyan-200" />}
            title="How to Play"
            body="Design your datacenter: place racks, add servers, and watch live traffic. Explore for cinematic tours."
          />
          <InfoCard
            icon={<Shield className="h-4 w-4 text-cyan-200" />}
            title="Help & Credits"
            body="Use the Control Dock to switch modes, set rack density, and open diagnostics. Created by Max Doubin."
          />
        </div>
      </div>
    </div>
  );
}

function IntroScene() {
  const fogColor = new THREE.Color("#05070f");
  const equipmentMap = useMemo(
    () => new Map(staticEquipmentCatalog.map((item) => [item.id, item])),
    []
  );

  const rackGrid = useMemo(() => {
    const positions: [number, number, number, number][] = [];
    for (let x = -8; x <= 8; x += 2) {
      for (let z = -8; z <= 8; z += 2) {
        const height = 2.4 + Math.random() * 0.8;
        positions.push([x * 2.2, height / 2, z * 2.4, height]);
      }
    }
    return positions;
  }, []);
  const introRacks = useMemo(
    () =>
      rackGrid.map(([x, _y, z], index) =>
        buildIntroRack(index, x, z)
      ),
    [rackGrid]
  );

  return (
    <>
      <fog attach="fog" args={[fogColor, 8, 40]} />
      <color attach="background" args={["#02030a"]} />
      <PerspectiveCamera makeDefault position={[0, 8, 18]} fov={40} />

      <ambientLight intensity={0.6} color="#4dd6ff" />
      <directionalLight position={[10, 15, 10]} intensity={1.6} color="#b9e9ff" />
      <directionalLight position={[-10, 10, -8]} intensity={0.9} color="#9b5cff" />
      <pointLight position={[0, 8, 0]} intensity={1.5} color="#22d3ee" />
      <pointLight position={[0, 4, 12]} intensity={1.2} color="#38bdf8" />
      <pointLight position={[-12, 6, -8]} intensity={1.0} color="#c084fc" />

      <group>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
          <planeGeometry args={[120, 120]} />
          <meshStandardMaterial color="#070b18" metalness={0.5} roughness={0.3} />
        </mesh>

        <group scale={0.9}>
          {introRacks.map((rack, index) => (
            <Rack3D
              key={rack.id}
              rack={rack}
              position={[rack.positionX, 0, rack.positionY]}
              isSelected={false}
              onSelect={() => {}}
              equipmentCatalog={equipmentMap}
              forceSimplified
              lodIndex={index}
              detailBudget={introRacks.length}
              showHud={false}
            />
          ))}
        </group>

        <IntroSweep />
        <IntroSweep offset={6} color="#a855f7" />
      </group>

      <DreiSparkles count={80} speed={0.2} size={1.2} color="#22d3ee" scale={[40, 20, 40]} />
    </>
  );
}

function LiveFeed({
  title,
  subtitle,
  variant,
}: {
  title: string;
  subtitle: string;
  variant: "a" | "b" | "c";
}) {
  return (
    <div className="rounded-xl border border-cyan-500/20 bg-black/40 p-3">
      <div className="mb-2 flex items-center justify-between">
        <div className="text-xs font-mono text-white/70">
          <div className="text-white/90">{title}</div>
          <div className="text-white/50">{subtitle}</div>
        </div>
        <Badge className="bg-black/50 border border-white/10 text-white/70">LIVE</Badge>
      </div>

      <div className="h-40 overflow-hidden rounded-lg border border-white/10">
        <Canvas
          dpr={1}
          gl={{ antialias: false }}
          className="pointer-events-none"
        >
          <MiniRackScene variant={variant} />
        </Canvas>
      </div>
    </div>
  );
}

function MiniRackScene({ variant }: { variant: "a" | "b" | "c" }) {
  const camPos = useMemo(() => {
    if (variant === "a") return [8, 5, 9] as [number, number, number];
    if (variant === "b") return [0, 6, 10] as [number, number, number];
    return [-9, 4.5, 7] as [number, number, number];
  }, [variant]);

  const target = useMemo(() => [0, 1.5, 0] as [number, number, number], []);

  const equipmentMap = useMemo(
    () => new Map(staticEquipmentCatalog.map((item) => [item.id, item])),
    []
  );
  const racks = useMemo(
    () =>
      Array.from({ length: 20 }).map((_, index) => {
        const row = Math.floor(index / 5);
        const col = index % 5;
        return buildIntroRack(index + (variant === "b" ? 40 : variant === "c" ? 80 : 0), col * 1.6 - 3.2, row * 1.6 - 3.2);
      }),
    [variant]
  );

  return (
    <>
      <PerspectiveCamera makeDefault position={camPos} fov={45} near={0.1} far={50} />

      <ambientLight intensity={0.7} />
      <directionalLight position={[6, 10, 6]} intensity={1.2} />
      <pointLight position={[-4, 6, -2]} intensity={1.2} color="#5eead4" />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="#0b1220" />
      </mesh>

      <group scale={0.6}>
        {racks.map((rack, index) => (
          <Rack3D
            key={`${variant}-${rack.id}`}
            rack={rack}
            position={[rack.positionX, 0, rack.positionY]}
            isSelected={false}
            onSelect={() => {}}
            equipmentCatalog={equipmentMap}
            forceSimplified
            lodIndex={index}
            detailBudget={racks.length}
            showHud={false}
          />
        ))}
      </group>

      <OrbitControls
        enablePan={false}
        enableZoom={false}
        enableRotate={true}
        autoRotate
        autoRotateSpeed={variant === "b" ? 1.0 : 0.7}
        target={target}
      />
    </>
  );
}

function IntroRack({
  position,
  height,
}: {
  position: [number, number, number];
  height: number;
}) {
  const [hovered, setHovered] = useState(false);
  const rackRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const lights = useMemo(
    () =>
      Array.from({ length: 6 }).map((_, index) => ({
        y: 0.2 + index * (height / 7),
        hue: Math.random() > 0.5 ? "#22d3ee" : "#a855f7",
      })),
    [height]
  );

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (rackRef.current) {
      rackRef.current.rotation.y = Math.sin(t * 0.6 + position[0]) * 0.15;
    }
    if (glowRef.current) {
      glowRef.current.scale.y = 1 + Math.sin(t * 1.6 + position[2]) * 0.06;
    }
  });

  return (
    <group
      position={position}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      <mesh ref={rackRef} position={[0, height / 2, 0]}>
        <boxGeometry args={[1.2, height, 1.8]} />
        <meshStandardMaterial
          color={hovered ? "#0ea5e9" : "#1f2937"}
          emissive={hovered ? "#38bdf8" : "#0b1220"}
          emissiveIntensity={hovered ? 0.8 : 0.3}
          metalness={0.6}
          roughness={0.3}
        />
      </mesh>
      {lights.map((light, index) => (
        <mesh key={index} position={[0, light.y, 0.92]}>
          <boxGeometry args={[0.9, 0.08, 0.05]} />
          <meshStandardMaterial
            color={light.hue}
            emissive={light.hue}
            emissiveIntensity={hovered ? 1.4 : 0.6}
          />
        </mesh>
      ))}
      <mesh ref={glowRef} position={[0, height / 2, 0]}>
        <boxGeometry args={[1.4, height * 1.05, 2]} />
        <meshStandardMaterial color="#38bdf8" emissive="#38bdf8" emissiveIntensity={0.4} transparent opacity={0.15} />
      </mesh>
      <mesh position={[0, height * 0.25, 0.92]}>
        <boxGeometry args={[0.8, 0.35, 0.05]} />
        <meshStandardMaterial color="#0ea5e9" emissive="#0ea5e9" emissiveIntensity={0.9} />
      </mesh>
    </group>
  );
}

function IntroSweep({
  offset = 0,
  color = "#22d3ee",
}: {
  offset?: number;
  color?: string;
}) {
  const sweepRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (!sweepRef.current) return;
    const t = clock.getElapsedTime();
    sweepRef.current.position.z = ((t * 2 + offset) % 24) - 12;
  });

  return (
    <mesh ref={sweepRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, -12]}>
      <planeGeometry args={[80, 6]} />
      <meshBasicMaterial color={color} transparent opacity={0.08} />
    </mesh>
  );
}

function InfoCard({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/40 p-4">
      <div className="mb-2 flex items-center gap-2">
        {icon}
        <div className="text-sm font-semibold text-white/90">{title}</div>
      </div>
      <p className="text-xs text-white/60 leading-relaxed">{body}</p>
    </div>
  );
}
