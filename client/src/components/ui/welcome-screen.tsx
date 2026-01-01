import { Canvas } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Cpu, Eye, Hammer, Play, Shield, Sparkles } from "lucide-react";

type StartMode = "build" | "explore";

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
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm">
      <div className="mx-auto flex h-full max-w-6xl flex-col justify-center px-6 py-10">
        <div className="mb-6 flex items-center justify-between">
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
            body="If FPS drops, the engine auto-throttles effects. Press H to toggle HUD."
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
    if (variant === "a") return [6, 4, 6] as [number, number, number];
    if (variant === "b") return [0, 3.5, 7] as [number, number, number];
    return [-6, 4, 6] as [number, number, number];
  }, [variant]);

  const target = useMemo(() => [0, 1.5, 0] as [number, number, number], []);

  return (
    <>
      <PerspectiveCamera makeDefault position={camPos} fov={45} near={0.1} far={50} />

      <ambientLight intensity={0.7} />
      <directionalLight position={[6, 10, 6]} intensity={1.0} />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="#0b1220" />
      </mesh>

      <group position={[0, 0, 0]}>
        <mesh position={[0, 1.2, 0]}>
          <boxGeometry args={[1.3, 2.4, 0.9]} />
          <meshStandardMaterial color="#1f2a44" />
        </mesh>

        <mesh position={[0, 0.7, 1.2]}>
          <boxGeometry args={[0.9, 0.4, 0.1]} />
          <meshStandardMaterial color="#00aaff" emissive="#00aaff" emissiveIntensity={0.6} />
        </mesh>
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
