import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import { useEffect, useMemo, useState } from "react";
import * as React from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Cpu, Eye, Hammer, Play, Shield, Sparkles } from "lucide-react";
import { Rack3D } from "@/components/3d/Rack3D";
import { staticEquipmentCatalog } from "@/lib/static-equipment";
import type { Rack } from "@shared/schema";
import * as THREE from "three";
import { HeroAnimation } from "@/components/hero/HeroAnimation";

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
      <HeroAnimation className="absolute inset-0" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/30 via-black/60 to-black/80" />

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
            <Button
              type="button"
              variant="ghost"
              asChild
              className="text-cyan-100 border border-cyan-500/30 bg-cyan-500/10 hover:bg-cyan-500/20"
            >
              <Link href="/about">About</Link>
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
          dpr={1.4}
          gl={{ antialias: true, powerPreference: "high-performance" }}
          frameloop="always"
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
  const rigRef = React.useRef<THREE.Group>(null);
  const glowRef = React.useRef<THREE.PointLight>(null);
  const racks = useMemo(
    () =>
      Array.from({ length: 6 }).map((_, index) => {
        const row = Math.floor(index / 5);
        const col = index % 5;
        return buildIntroRack(index + (variant === "b" ? 40 : variant === "c" ? 80 : 0), col * 1.6 - 3.2, row * 1.6 - 3.2);
      }),
    [variant]
  );
  const lightPalette = useMemo(() => {
    if (variant === "a") {
      return {
        ambient: "#38bdf8",
        key: "#67e8f9",
        accent: "#22d3ee",
        fill: "#a855f7",
      };
    }
    if (variant === "b") {
      return {
        ambient: "#f472b6",
        key: "#fb7185",
        accent: "#fbbf24",
        fill: "#f97316",
      };
    }
    return {
      ambient: "#34d399",
      key: "#60a5fa",
      accent: "#22d3ee",
      fill: "#a78bfa",
    };
  }, [variant]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (rigRef.current) {
      rigRef.current.rotation.y = Math.sin(t * 0.35) * 0.08;
      rigRef.current.rotation.x = Math.cos(t * 0.3) * 0.04;
    }
    if (glowRef.current) {
      glowRef.current.intensity = 1.1 + Math.sin(t * 1.6) * 0.3;
    }
  });

  return (
    <>
      <PerspectiveCamera makeDefault position={camPos} fov={45} near={0.1} far={50} />

      <ambientLight intensity={1.0} color={lightPalette.ambient} />
      <directionalLight position={[6, 10, 6]} intensity={1.6} color={lightPalette.key} />
      <pointLight ref={glowRef} position={[-4, 6, -2]} intensity={1.4} color={lightPalette.accent} />
      <pointLight position={[4, 3, 4]} intensity={1.0} color={lightPalette.fill} />
      <pointLight position={[0, 5, 8]} intensity={0.8} color={lightPalette.key} />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial
          color="#101827"
          emissive={lightPalette.ambient}
          emissiveIntensity={0.18}
        />
      </mesh>

      <group position={[0, 0.05, 0]}>
        {Array.from({ length: 3 }).map((_, index) => (
          <mesh key={`mini-strip-${variant}-${index}`} position={[index * 3 - 3, 0, -2 + index * 2]}>
            <boxGeometry args={[2.8, 0.04, 6]} />
            <meshStandardMaterial
              color={lightPalette.accent}
              emissive={lightPalette.accent}
              emissiveIntensity={1.0}
            />
          </mesh>
        ))}
      </group>

      <group ref={rigRef} scale={0.6}>
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
        autoRotateSpeed={variant === "b" ? -0.35 : variant === "c" ? 0.5 : 0.25}
        target={target}
      />
    </>
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
