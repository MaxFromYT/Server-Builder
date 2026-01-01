import { Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef, useState } from "react";

interface PerformanceOverlayProps {
  visible?: boolean;
  onQualityChange?: (quality: "high" | "low", reason: string) => void;
  targetFps?: number;
}

const UPDATE_INTERVAL = 0.5;
const DEGRADE_FRAME_MS = 28;
const RECOVER_FRAME_MS = 21;
const REQUIRED_STREAK = 3;

export function PerformanceOverlay({
  visible = true,
  onQualityChange,
  targetFps = 50,
}: PerformanceOverlayProps) {
  const [stats, setStats] = useState({ fps: 0, frameMs: 0, quality: "high" as "high" | "low" });
  const rolling = useRef({
    time: 0,
    frames: 0,
    lastUpdate: 0,
    degradeStreak: 0,
    recoverStreak: 0,
    quality: "high" as "high" | "low",
  });

  useFrame((state, delta) => {
    const data = rolling.current;
    data.time += delta;
    data.frames += 1;

    const elapsed = state.clock.elapsedTime;
    if (elapsed - data.lastUpdate < UPDATE_INTERVAL) return;

    const avgFrameMs = (data.time / data.frames) * 1000;
    const fps = data.frames / data.time;

    if (avgFrameMs > DEGRADE_FRAME_MS || fps < targetFps) {
      data.degradeStreak += 1;
      data.recoverStreak = Math.max(0, data.recoverStreak - 1);
    } else if (avgFrameMs < RECOVER_FRAME_MS && fps > targetFps + 5) {
      data.recoverStreak += 1;
      data.degradeStreak = Math.max(0, data.degradeStreak - 1);
    }

    if (data.quality === "high" && data.degradeStreak >= REQUIRED_STREAK) {
      data.quality = "low";
      data.degradeStreak = 0;
      onQualityChange?.("low", "frame-time");
    }

    if (data.quality === "low" && data.recoverStreak >= REQUIRED_STREAK + 1) {
      data.quality = "high";
      data.recoverStreak = 0;
      onQualityChange?.("high", "recovered");
    }

    setStats({ fps: Math.round(fps), frameMs: Math.round(avgFrameMs), quality: data.quality });

    data.time = 0;
    data.frames = 0;
    data.lastUpdate = elapsed;
  });

  if (!visible) return null;

  return (
    <Html fullscreen>
      <div className="pointer-events-none absolute top-4 right-4 rounded-md border border-cyan-500/30 bg-black/60 px-3 py-2 font-mono text-[10px] text-cyan-200 shadow-[0_0_16px_rgba(0,255,255,0.15)]">
        <div className="flex items-center justify-between gap-4">
          <span className="uppercase text-cyan-400">Performance</span>
          <span className={stats.quality === "low" ? "text-amber-300" : "text-emerald-300"}>
            {stats.quality.toUpperCase()}
          </span>
        </div>
        <div className="mt-1 flex items-center justify-between gap-4">
          <span>FPS</span>
          <span>{stats.fps}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span>Frame</span>
          <span>{stats.frameMs} ms</span>
        </div>
      </div>
    </Html>
  );
}
