import { useEffect, useState } from "react";

interface WelcomeScreenProps {
  isVisible: boolean;
}

const sceneLabels = [
  { title: "Datacenter A · Core Hall", subtitle: "Camera 01 · North aisle" },
  { title: "Datacenter A · Nano Pod", subtitle: "Camera 02 · Edge showcase" },
  { title: "CTO Office · Command Deck", subtitle: "Camera 03 · Executive view" },
];

export function WelcomeScreen({ isVisible }: WelcomeScreenProps) {
  const [sceneIndex, setSceneIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [selectedMode, setSelectedMode] = useState<"explore" | "build">("build");

  useEffect(() => {
    const interval = window.setInterval(() => {
      setSceneIndex((prev) => (prev + 1) % sceneLabels.length);
    }, 1800);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!isVisible) return;
    setProgress(0);
    const interval = window.setInterval(() => {
      setProgress((prev) => (prev >= 100 ? 100 : prev + 8));
    }, 180);
    return () => window.clearInterval(interval);
  }, [isVisible]);

  return (
    <div
      className={`pointer-events-none fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-700 ${
        isVisible ? "opacity-100" : "opacity-0"
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
        <div
          className="relative flex h-32 w-32 items-center justify-center"
          style={{ perspective: "800px" }}
        >
          <div
            className="absolute inset-0 animate-hero-float"
            style={{ transformStyle: "preserve-3d", transform: "rotateX(65deg) rotateZ(45deg)" }}
          >
            {[0, 1, 2, 3, 4].map((layer) => (
              <div
                key={layer}
                className="absolute left-1/2 top-1/2 h-6 w-28 -translate-x-1/2 -translate-y-1/2 rounded-md border border-cyan-300/40 bg-gradient-to-r from-slate-950 via-slate-800 to-slate-950 shadow-[0_0_25px_rgba(34,211,238,0.35)]"
                style={{
                  transform: `translateZ(${layer * 10}px)`,
                }}
              >
                <div className="absolute left-2 top-2 h-1.5 w-6 rounded-full bg-cyan-400/70 shadow-[0_0_10px_rgba(34,211,238,0.7)]" />
                <div className="absolute right-2 top-2 h-1.5 w-3 rounded-full bg-purple-400/70 shadow-[0_0_10px_rgba(168,85,247,0.7)]" />
                <div className="absolute bottom-2 left-2 h-1 w-12 rounded-full bg-white/10" />
              </div>
            ))}
          </div>
          <div className="absolute h-24 w-24 animate-hero-pulse rounded-full border border-cyan-400/20" />
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
            Select session mode
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { id: "build", title: "Build Mode", description: "Place racks, snap rows, duplicate bays." },
              { id: "explore", title: "Explore Mode", description: "Tour the facility and inspect systems." },
            ].map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setSelectedMode(option.id as "build" | "explore")}
                className={`rounded-xl border px-4 py-3 text-left text-[10px] font-mono transition-all ${
                  selectedMode === option.id
                    ? "border-cyan-300/60 bg-cyan-500/10 text-cyan-100 shadow-[0_0_18px_rgba(34,211,238,0.35)]"
                    : "border-white/10 bg-white/5 text-white/60 hover:border-cyan-300/40"
                }`}
              >
                <div className="uppercase tracking-[0.2em]">{option.title}</div>
                <div className="mt-2 text-[9px] text-white/50">{option.description}</div>
              </button>
            ))}
          </div>
        </div>
        <div className="w-full space-y-2">
          <div className="text-[10px] font-mono uppercase tracking-[0.3em] text-cyan-300/70">
            Live camera feeds
          </div>
          <div className="grid grid-cols-3 gap-3">
            {sceneLabels.map((scene, index) => (
              <div
                key={scene.title}
                className={`relative overflow-hidden rounded-xl border px-3 py-3 text-left text-[10px] font-mono transition-all ${
                  index === sceneIndex
                    ? "border-cyan-300/60 bg-cyan-500/10 text-cyan-100 shadow-[0_0_18px_rgba(34,211,238,0.35)]"
                    : "border-white/10 bg-white/5 text-white/60"
                }`}
              >
                <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.02),rgba(34,211,238,0.1),rgba(255,255,255,0.02))] opacity-70 animate-stream-sheen" />
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute inset-x-0 top-0 h-px bg-white/10" />
                  <div className="absolute inset-x-0 bottom-0 h-px bg-white/5" />
                </div>
                <div className="uppercase tracking-[0.2em]">{scene.title}</div>
                <div className="mt-1 text-[9px] text-white/50">{scene.subtitle}</div>
                <div className="mt-3 flex items-center gap-2 text-[9px] uppercase tracking-[0.3em] text-cyan-200/70">
                  <span className={`h-1.5 w-1.5 rounded-full ${index === sceneIndex ? "bg-emerald-400 animate-pulse" : "bg-white/20"}`} />
                  Live stream
                </div>
              </div>
            ))}
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
