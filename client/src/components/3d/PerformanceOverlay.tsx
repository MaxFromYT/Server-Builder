import { Html } from "@react-three/drei";
import { useEffect, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";

interface PerformanceOverlayProps {
  visible: boolean;
  onQualityChange?: (quality: "low" | "high", reason: string) => void;
}

export function PerformanceOverlay({ visible, onQualityChange }: PerformanceOverlayProps) {
  const [fps, setFps] = useState(60);
  const [frameTime, setFrameTime] = useState(16.7);
  const [quality, setQuality] = useState<"low" | "high">("high");
  const frameCount = useRef(0);
  const lastTime = useRef(performance.now());
  const lastFrameTime = useRef(performance.now());
  const lowPerformanceCount = useRef(0);

  useFrame(() => {
    if (!visible) return;

    frameCount.current++;
    const now = performance.now();
    const deltaTime = now - lastFrameTime.current;
    lastFrameTime.current = now;

    if (frameCount.current % 30 === 0) {
      const elapsed = now - lastTime.current;
      const currentFps = Math.round((30 * 1000) / elapsed);
      const currentFrameTime = Math.round(deltaTime * 10) / 10;

      setFps(currentFps);
      setFrameTime(currentFrameTime);

      if (currentFps < 30 && quality === "high") {
        lowPerformanceCount.current++;
        if (lowPerformanceCount.current > 3) {
          setQuality("low");
          onQualityChange?.("low", `FPS dropped to ${currentFps}`);
          lowPerformanceCount.current = 0;
        }
      } else if (currentFps > 45 && quality === "low") {
        setQuality("high");
        onQualityChange?.("high", `FPS improved to ${currentFps}`);
      } else {
        lowPerformanceCount.current = 0;
      }

      lastTime.current = now;
    }
  });

  useEffect(() => {
    if (!visible) {
      lowPerformanceCount.current = 0;
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Html fullscreen>
      <div className="pointer-events-none fixed top-4 right-4 z-50 select-none">
        <div
          className={`rounded-lg border px-3 py-2 backdrop-blur-md ${
            quality === "low"
              ? "border-orange-400/30 bg-orange-500/10 text-orange-200"
              : "border-cyan-500/30 bg-black/60 text-cyan-200"
          }`}
        >
          <div className="text-xs font-mono space-y-1">
            <div className="flex justify-between gap-4">
              <span>FPS:</span>
              <span className={fps < 30 ? "text-orange-300" : ""}>{fps}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span>Frame:</span>
              <span className={frameTime > 33 ? "text-orange-300" : ""}>{frameTime}ms</span>
            </div>
            <div className="flex justify-between gap-4">
              <span>Quality:</span>
              <span className={quality === "low" ? "text-orange-300" : "text-cyan-300"}>
                {quality.toUpperCase()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Html>
  );
}
