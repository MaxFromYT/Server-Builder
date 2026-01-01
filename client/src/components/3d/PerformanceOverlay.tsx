import { useEffect, useRef, useState } from "react";
import { Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";

export type QualityMode = "low" | "high";

type PerformanceOverlayProps = {
  // Keep mounted for sampling, just hide the UI until user toggles it.
  visible?: boolean;

  // Display only. We do NOT auto change quality anymore.
  qualityMode?: QualityMode;

  // Used to show a warning in diagnostics instead of spamming toasts.
  onWarningChange?: (warning: string | null) => void;

  // Optional positioning override
  positionClassName?: string;
};

export function PerformanceOverlay({
  visible = false,
  qualityMode = "high",
  onWarningChange,
  positionClassName = "fixed top-20 right-72",
}: PerformanceOverlayProps) {
  const [stats, setStats] = useState({ fps: 0, frameMs: 0 });

  const accRef = useRef({ t: 0, frames: 0 });

  // “Low FPS” warning gating so we do not spam.
  const warnRef = useRef({
    isLow: false,
    lowStreakSeconds: 0,
    recoverStreakSeconds: 0,
    lastEmitted: null as string | null,
  });

  useFrame((_, delta) => {
    // Aggregate for about 1 second so numbers are stable.
    accRef.current.t += delta;
    accRef.current.frames += 1;
    if (accRef.current.t < 1) return;

    const fps = accRef.current.frames / accRef.current.t;
    const frameMs = (accRef.current.t / accRef.current.frames) * 1000;

    accRef.current.t = 0;
    accRef.current.frames = 0;

    setStats({ fps, frameMs });

    // Warning thresholds (tweak if you want)
    const LOW_FPS = 35;
    const RECOVER_FPS = 50;

    if (fps < LOW_FPS) {
      warnRef.current.lowStreakSeconds += 1;
      warnRef.current.recoverStreakSeconds = 0;
    } else if (fps > RECOVER_FPS) {
      warnRef.current.recoverStreakSeconds += 1;
      warnRef.current.lowStreakSeconds = 0;
    } else {
      // In-between, decay slowly so it is not jumpy.
      warnRef.current.lowStreakSeconds = Math.max(0, warnRef.current.lowStreakSeconds - 1);
      warnRef.current.recoverStreakSeconds = Math.max(0, warnRef.current.recoverStreakSeconds - 1);
    }

    // Emit warning only after sustained low FPS
    if (!warnRef.current.isLow && warnRef.current.lowStreakSeconds >= 3) {
      warnRef.current.isLow = true;
      const msg =
        "Low FPS detected. Quality is locked to your selection (no auto downgrade). Consider reducing rack count or toggling effects.";
      if (warnRef.current.lastEmitted !== msg) {
        warnRef.current.lastEmitted = msg;
        onWarningChange?.(msg);
      }
    }

    // Clear warning only after sustained recovery
    if (warnRef.current.isLow && warnRef.current.recoverStreakSeconds >= 3) {
      warnRef.current.isLow = false;
      if (warnRef.current.lastEmitted !== null) {
        warnRef.current.lastEmitted = null;
        onWarningChange?.(null);
      }
    }
  });

  useEffect(() => {
    return () => {
      // Clear warning on unmount
      onWarningChange?.(null);
    };
  }, [onWarningChange]);

  const fpsRounded = Math.round(stats.fps);
  const frameRounded = stats.frameMs ? stats.frameMs.toFixed(1) : "0.0";

  const isLowNow = warnRef.current.isLow;
  const qualityText = qualityMode.toUpperCase();

  return (
    <Html fullscreen>
      {visible ? (
        <div className={`pointer-events-none select-none z-50 ${positionClassName}`}>
          <div className="rounded-lg border border-cyan-500/30 bg-black/60 px-3 py-2 backdrop-blur-md shadow-[0_0_18px_rgba(34,211,238,0.15)]">
            <div className="text-[10px] font-mono text-cyan-300 uppercase tracking-widest">Performance</div>
            <div className="mt-1 grid grid-cols-3 gap-2 text-[10px] font-mono">
              <div>
                <div className="text-white/40">FPS</div>
                <div className={isLowNow ? "text-orange-300" : "text-cyan-200"}>{fpsRounded}</div>
              </div>
              <div>
                <div className="text-white/40">Frame</div>
                <div className={isLowNow ? "text-orange-300" : "text-cyan-200"}>{frameRounded}ms</div>
              </div>
              <div>
                <div className="text-white/40">Quality</div>
                <div className={qualityMode === "high" ? "text-cyan-200" : "text-white/60"}>{qualityText}</div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </Html>
  );
}
