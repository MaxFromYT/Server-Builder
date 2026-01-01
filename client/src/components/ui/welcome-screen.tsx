import { useEffect, useMemo, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

type SessionMode = "build" | "explore";

interface WelcomeScreenProps {
  isVisible: boolean;
  onStart: (mode: SessionMode) => void;
}

const sceneLabels = [
  { title: "Datacenter A · Core Hall", subtitle: "Camera 01 · North aisle" },
  { title: "Datacenter A · Nano Pod", subtitle: "Camera 02 · Edge showcase" },
  { title: "CTO Office · Command Deck", subtitle: "Camera 03 · Executive view" },
];

function MiniRackScene({ variant }: { variant: 0 | 1 | 2 }) {
  const group = useMemo(() => new THREE.Group(), []);
  const rack = useMemo(() => {
    const g = new THREE.Group();

    const floorGeo = new THREE.PlaneGeometry(10, 10);
    const floorMat = new THREE.MeshStandardMaterial({ color: "#0b1220", roughness: 0.9, metalness: 0.1 });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -1.2;
    floor.receiveShadow = true;
    g.add(floor);

    const rackGeo = new THREE.BoxGeometry(1.2, 2.6, 1.2);
    const rackMat = new THREE.MeshStandardMaterial({ color: "#111827", roughness: 0.35, metalness: 0.7 });
    const body = new THREE.Mesh(rackGeo, rackMat);
    body.castShadow = true;
    body.position.y = 0;
    g.add(body);

    const doorGeo = new THREE.PlaneGeometry(1.08, 2.45);
    const doorMat = new THREE.MeshPhysicalMaterial({
      color: "#0b1020",
      roughness: 0.1,
      metalness: 0.1,
      transparent: true,
      opacity: 0.28,
      transmission: 0.85,
      thickness: 0.02,
    });
    const door = new THREE.Mesh(doorGeo, doorMat);
    door.position.z = 0.61;
    door.position.y = 0;
    g.add(door);

    const ledGeo = new THREE.BoxGeometry(0.9, 0.05, 0.02);
    const ledMat = new THREE.MeshStandardMaterial({
      color: "#00e5ff",
      emissive: "#00e5ff",
      emissiveIntensity: 1.2,
      roughness: 0.2,
      metalness: 0.2,
    });
    const led = new THREE.Mesh(ledGeo, ledMat);
    led.position.set(0, 1.15, 0.62);
    g.add(led);

    const glowGeo = new THREE.SphereGeometry(0.03, 16, 16);
    const glowMat = new THREE.MeshStandardMaterial({
      color: "#22c55e",
      emissive: "#22c55e",
      emissiveIntensity: 2.2,
    });
    const indicator = new THREE.Mesh(glowGeo, glowMat);
    indicator.position.set(0.52, 1.15, 0.62);
    g.add(indicator);

    return g;
  }, []);

  useEffect(() => {
    group.add(rack);
    return () => {
      group.remove(rack);
    };
  }, [group, rack]);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    group.rotation.y = t * (0.25 + variant * 0.07);
    group.position.y = Math.sin(t * 1.2) * 0.03;
  });

  const camPos = useMemo(() => {
    if (variant === 0) return [3.8, 1.8, 3.0] as [number, number, number];
    if (variant === 1) return [2.4, 1.2, 4.2] as [number, number, number];
    return [4.4, 2.4, 1.6] as [number, number, number];
  }, [variant]);

  return (
    <>
      <ambientLight intensity={0.55} color="#9cc6ff" />
      <directionalLight position={[6, 10, 6]} intensity={1.0} color="#ffffff" castShadow />
      <pointLight position={[-4, 3, -2]} intensity={0.6} color="#7ee7ff" />
      <group position={[0, 0, 0]}>
        <primitive object={group} />
      </group>

      {/* cheap fog for “camera feed” vibe */}
      <fog attach="fog" args={["#05070c", 2.5, 12]} />

      {/* Camera */}
      <perspectiveCamera position={camPos} fov={45} near={0.1} far={50} />
    </>
  );
}

function LiveFeed({ index, active }: { index: 0 | 1 | 2; active: boolean }) {
  return (
    <div className="relative mt-2 h-20 w-full overflow-hidden rounded-lg border border-white/10 bg-black/30">
      <div className="absolute inset-0 pointer-events-none">
        <Canvas
          dpr={1}
          shadows={false}
          gl={{ antialias: false, powerPreference: "high-performance" }}
          style={{ width: "100%", height: "100%" }}
        >
          <MiniRackScene variant={index} />
        </Canvas>
      </div>

      {/* scanline overlay */}
      <div className="pointer-events-none absolute inset-0 opacity-60">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:100%_6px]" />
        <div className={`absolute left-2 top-2 h-2 w-2 rounded-full ${active ? "bg-emerald-400 animate-pulse" : "bg-white/20"}`} />
      </div>
    </div>
  );
}

export function WelcomeScreen({ isVisible, onStart }: WelcomeScreenProps) {
  const [sceneIndex, setSceneIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [selectedMode, setSelectedMode] = useState<SessionMode>("build");

  useEffect(() => {
    if (!isVisible) return;
    const interval = window.setInterval(() => {
      setSceneIndex((prev) => (prev + 1) % sceneLabels.length);
    }, 1800);
    return () => window.clearInterval(interval);
  }, [isVisible]);

  useEffect(() => {
    if (!isVisible) return;
    setProgress(0);
    const interval = window.setInterval(() => {
      setProgress((prev) => (prev >= 100 ? 100 : prev + 8));
    }, 180);
    return () => window.clearInterval(interval);
  }, [isVisible]);

  useEffect(() => {
    if (!isVisible) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        onStart(selectedMode);
      }
      if (e.key === "1") setSelectedMode("build");
      if (e.key === "2") setSelectedMode("explore");
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isVisible, onStart, selectedMode]);

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-700 ${
        isVisible ? "opacity-100" : "pointer-events-none opacity-0"
      }`}
      data-testid="welcome-screen"
    >
      <div className="absolute inset-0 bg-black/90" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.25),_transparent_55%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,_rgba(99,102,241,0.18),_transparent_60%)]" />

      <div className="relative mx-6 flex max-w-2xl flex-col items-center gap-6 rounded-3xl border border-cyan-400/30 bg-gradient-to-br from-black/90 via-slate-900/80 to-black/90 px-12 py-12 text-center shadow-[0_0_60px_rgba(34,211,238,0.35)] backdrop-blur-2xl">
        <div className="text-[10px] font-mono uppercase tracking-[0.35em] text-cyan-300/70">
          Welcome to Hyperscale Studio
        </div>

        <div className="relative">
          <div className="text-4xl font-display font-bold tracking-[0.45em] text-white drop-shadow-[0_0_30px_rgba(34,211,238,0.6)]">
            HYPERSCALE
          </div>
          <div className="mt-3 text-[11px] font-mono uppercase tracking-[0.35em] text-cyan-200/80">
            Datacenter builder · Max Doubin
          </div>
        </div>

        <div className="w-full space-y-2">
          <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-[0.3em] text-cyan-300/70">
            <span>Boot sequence</span>
            <span>{progress}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full border border-cyan-300/30 bg-white/5">
            <div
              className="h-full bg-gradient-to-r from-cyan-400 via-cyan-200 to-purple-400 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="text-xs font-mono uppercase tracking-[0.25em] text-cyan-200/70">
            {progress < 60 ? "Calibrating thermal grids…" : "Finalizing multi-site sync…"}
          </div>
        </div>

        <div className="w-full space-y-3">
          <div className="text-[10px] font-mono uppercase tracking-[0.3em] text-cyan-300/70">
            Select game mode
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              { id: "build", title: "Build Mode", description: "Place racks, snap rows, duplicate bays. (Press 1)" },
              { id: "explore", title: "Explore Mode", description: "Tour the facility and inspect systems. (Press 2)" },
            ].map((option) => {
              const id = option.id as SessionMode;
              const active = selectedMode === id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => {
                    setSelectedMode(id);
                    onStart(id);
                  }}
                  className={`rounded-xl border px-4 py-3 text-left text-[10px] font-mono transition-all ${
                    active
                      ? "border-cyan-300/60 bg-cyan-500/10 text-cyan-100 shadow-[0_0_18px_rgba(34,211,238,0.35)]"
                      : "border-white/10 bg-white/5 text-white/60 hover:border-cyan-300/40"
                  }`}
                >
                  <div className="uppercase tracking-[0.2em]">{option.title}</div>
                  <div className="mt-2 text-[9px] text-white/50">{option.description}</div>
                </button>
              );
            })}
          </div>

          <div className="text-[9px] font-mono uppercase tracking-[0.25em] text-white/35">
            Tip: press Enter to launch the selected mode
          </div>
        </div>

        <div className="w-full space-y-2">
          <div className="text-[10px] font-mono uppercase tracking-[0.3em] text-cyan-300/70">
            Live camera feeds
          </div>

          <div className="grid grid-cols-3 gap-3">
            {sceneLabels.map((scene, index) => {
              const active = index === sceneIndex;
              return (
                <div
                  key={scene.title}
                  className={`relative overflow-hidden rounded-xl border px-3 py-3 text-left text-[10px] font-mono transition-all ${
                    active
                      ? "border-cyan-300/60 bg-cyan-500/10 text-cyan-100 shadow-[0_0_18px_rgba(34,211,238,0.35)]"
                      : "border-white/10 bg-white/5 text-white/60"
                  }`}
                >
                  <div className="uppercase tracking-[0.2em]">{scene.title}</div>
                  <div className="mt-1 text-[9px] text-white/50">{scene.subtitle}</div>
                  <LiveFeed index={index as 0 | 1 | 2} active={active} />
                  <div className="mt-2 flex items-center gap-2 text-[9px] uppercase tracking-[0.3em] text-cyan-200/70">
                    <span className={`h-1.5 w-1.5 rounded-full ${active ? "bg-emerald-400 animate-pulse" : "bg-white/20"}`} />
                    Live stream
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-2 text-[10px] font-mono text-white/40">
          <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
          Building the future of hyperscale design
        </div>
      </div>
    </div>
  );
}
