import { useState, useEffect, useRef } from "react";
import { useGame } from "@/lib/game-context";
import { DatacenterScene } from "@/components/3d/DatacenterScene";
import { GameHUD } from "@/components/3d/GameHUD";
import { RackDetailPanel } from "@/components/3d/RackDetailPanel";
import { MiniMap } from "@/components/3d/MiniMap";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { WelcomeScreen } from "@/components/ui/welcome-screen";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Camera, Play, Sparkles, Grid3X3, Eye, EyeOff, RotateCcw } from "lucide-react";
import type { Rack } from "@shared/schema";

type CameraMode = "orbit" | "auto" | "cinematic";

export function DataCenter3D() {
  const { isLoading, racks, isStaticMode } = useGame();
  const [selectedRackId, setSelectedRackId] = useState<string | null>(null);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [cameraMode, setCameraMode] = useState<CameraMode>("orbit");
  const [showEffects, setShowEffects] = useState(true);
  const [showHUD, setShowHUD] = useState(true);
  const [rackCount, setRackCount] = useState(1);
  const [sliderValue, setSliderValue] = useState(1);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [qualityMode, setQualityMode] = useState<"low" | "high">("low");
  const [showIntro, setShowIntro] = useState(true);
  const [showOverlays, setShowOverlays] = useState(true);
  const [focusMode, setFocusMode] = useState(false);
  const [fastRamp, setFastRamp] = useState(false);
  const fastRampTimer = useRef<number | null>(null);
  const [proceduralOptions, setProceduralOptions] = useState({
    seed: 42,
    fillRateMultiplier: 1,
    errorRate: 1,
    tempBase: 20
  });
  const [showControls, setShowControls] = useState(false);

  const visibleRacks = isStaticMode ? racks.slice(0, rackCount) : racks;
  const selectedRack = visibleRacks?.find(r => r.id === selectedRackId) || null;
  const effectiveEffects = showEffects && !fastRamp;

  useEffect(() => {
    if (isStaticMode) {
      setIsUnlocked(true);
      return;
    }
    const savedUnlock = localStorage.getItem("hyperscale_unlocked");
    if (savedUnlock === "true") {
      setIsUnlocked(true);
    }
  }, [isStaticMode]);

  useEffect(() => {
    if (!isStaticMode) return;
    setQualityMode("high");
    setShowEffects(true);
  }, [isStaticMode, rackCount]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setShowIntro(false);
    }, 2000);
    return () => window.clearTimeout(timeout);
  }, []);

  const handleUnlock = () => {
    if (isStaticMode) return;
    setIsUnlocked(true);
    localStorage.setItem("hyperscale_unlocked", "true");
  };

  const handleSelectRack = (rack: Rack | null) => {
    setSelectedRackId(rack?.id || null);
  };

  const handleRackCountChange = (next: number) => {
    setSliderValue(next);
    setRackCount(next);
    setFastRamp(true);
    if (fastRampTimer.current) {
      window.clearTimeout(fastRampTimer.current);
    }
    fastRampTimer.current = window.setTimeout(() => {
      setFastRamp(false);
    }, 500);
  };

  useEffect(() => {
    return () => {
      if (fastRampTimer.current) {
        window.clearTimeout(fastRampTimer.current);
      }
    };
  }, []);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="relative w-full h-screen overflow-hidden bg-background" data-testid="datacenter-3d-page">
      <DatacenterScene
        onSelectRack={handleSelectRack}
        selectedRackId={selectedRackId}
        isUnlocked={isUnlocked}
        cameraMode={cameraMode}
        showEffects={effectiveEffects}
        showHUD={showHUD}
        rackCount={rackCount}
        proceduralOptions={proceduralOptions}
        showHeatmap={showHeatmap}
        performanceMode={isStaticMode && (qualityMode === "low" || fastRamp)}
        qualityMode={qualityMode}
        visibleRacks={visibleRacks}
        forceSimplified={isStaticMode && fastRamp}
      />
      
      {showOverlays && !focusMode && (
        <GameHUD isUnlocked={isUnlocked} onUnlock={handleUnlock} showUnlock={!isStaticMode} />
      )}
      
      {showOverlays && !focusMode && (
        <div className="fixed top-20 right-4 z-40">
          <MiniMap 
            racks={visibleRacks || []} 
            selectedRackId={selectedRackId}
            onSelectRack={handleSelectRack}
            floorSize={25} 
          />
        </div>
      )}
      
      {selectedRack && showOverlays && !focusMode && (
        <RackDetailPanel
          rack={selectedRack}
          onClose={() => setSelectedRackId(null)}
          isUnlocked={isUnlocked}
        />
      )}

      <WelcomeScreen isVisible={showIntro} />

      {isStaticMode && showOverlays && !focusMode && !selectedRack && (
        <div className="fixed top-20 left-4 z-40 w-[280px] bg-gradient-to-br from-cyan-500/10 via-black/70 to-purple-500/10 backdrop-blur-md rounded-lg border border-cyan-500/30 p-4 space-y-3 shadow-[0_0_25px_rgba(34,211,238,0.15)]">
          <div className="text-cyan-300 text-xs font-mono uppercase tracking-wider flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            Operations Console
          </div>
          <p className="text-[11px] text-white/70 leading-relaxed">
            Select a rack to open the editor. Add equipment by selecting empty slots and remove items with the trash icon.
          </p>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] text-white/60 font-mono">
              <span>Active racks</span>
              <span className="text-cyan-300">{rackCount}</span>
            </div>
            <input
              type="number"
              min={1}
              max={500}
              value={sliderValue}
              onChange={(event) => {
                const parsed = Number(event.target.value);
                const clamped = Number.isFinite(parsed) ? Math.min(500, Math.max(1, parsed)) : 1;
                handleRackCountChange(clamped);
              }}
              className="w-full rounded-md border border-cyan-500/30 bg-black/40 px-2 py-1 text-xs text-white/80 focus:border-cyan-400/60 focus:outline-none"
              data-testid="input-static-rack-count"
            />
            <Slider
              value={[sliderValue]}
              onValueChange={(v) => handleRackCountChange(v[0])}
              min={1}
              max={500}
              step={1}
              className="w-full"
              data-testid="slider-static-rack-count"
            />
            <div className="flex justify-between text-[9px] text-white/40 font-mono">
              <span>1</span>
              <span>500</span>
            </div>
          </div>
          <div className="flex items-center justify-between text-[11px] text-white/60 font-mono">
            <span>Visual fidelity</span>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                const next = qualityMode === "high" ? "low" : "high";
                setQualityMode(next);
                setShowEffects(next === "high");
              }}
              className={`text-[10px] px-2 py-1 ${
                qualityMode === "high"
                  ? "bg-cyan-500/20 text-cyan-200"
                  : "text-white/50"
              }`}
              data-testid="button-quality-mode"
            >
              {qualityMode === "high" ? "Studio" : "Fast"}
            </Button>
          </div>
          {rackCount > 100 && (
            <div className="rounded-md border border-orange-400/30 bg-orange-500/10 p-2 text-[10px] text-orange-200">
              Rendering more than 100 racks can slow down loading on some devices.
            </div>
          )}
          {rackCount > 100 && qualityMode === "high" && (
            <div className="rounded-md border border-red-400/30 bg-red-500/10 p-2 text-[10px] text-red-200">
              High quality + 100+ racks may cause long load times.
            </div>
          )}
          {selectedRack && (
            <div className="text-[11px] text-white/60 font-mono">
              Editing: <span className="text-cyan-300">{selectedRack.name}</span>
            </div>
          )}
        </div>
      )}

      {showOverlays && !focusMode && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-40 pointer-events-none" data-testid="game-title">
          <h1 className="font-display text-2xl font-bold tracking-wider text-white drop-shadow-lg" style={{ fontFamily: 'Orbitron, sans-serif' }}>
            HYPERSCALE
          </h1>
          <p className="text-center text-xs text-white/70 uppercase tracking-widest">
            Data Center Architect
          </p>
        </div>
      )}

      <div className="fixed bottom-4 right-4 z-40 flex flex-col gap-2 items-end">
        <Button
          size="icon"
          variant="ghost"
          onClick={() => setShowControls(!showControls)}
          className="bg-black/50 backdrop-blur-sm border border-white/10 text-white/70 hover:text-white"
          data-testid="button-toggle-controls"
        >
          <Sparkles className="w-4 h-4" />
        </Button>

        {showControls && (
          <div className="bg-black/70 backdrop-blur-md rounded-lg border border-cyan-500/20 p-4 min-w-[200px] space-y-4">
            <div className="text-cyan-400 text-xs font-mono uppercase tracking-wider mb-3">
              View Controls
            </div>

            <div className="space-y-2">
              <div className="text-white/60 text-[10px] font-mono uppercase">Camera Mode</div>
              <div className="flex gap-1">
                <CameraModeBtn 
                  active={cameraMode === "orbit"} 
                  onClick={() => setCameraMode("orbit")}
                  icon={<Camera className="w-3 h-3" />}
                  label="Free"
                />
                <CameraModeBtn 
                  active={cameraMode === "auto"} 
                  onClick={() => setCameraMode("auto")}
                  icon={<RotateCcw className="w-3 h-3" />}
                  label="Auto"
                />
                <CameraModeBtn 
                  active={cameraMode === "cinematic"} 
                  onClick={() => setCameraMode("cinematic")}
                  icon={<Play className="w-3 h-3" />}
                  label="Cine"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-white/60 text-[10px] font-mono uppercase">Effects</div>
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowEffects(!showEffects)}
                  className={`text-xs ${showEffects ? 'bg-cyan-500/20 text-cyan-300' : 'text-white/50'}`}
                  data-testid="button-toggle-effects"
                >
                  {showEffects ? <Eye className="w-3 h-3 mr-1" /> : <EyeOff className="w-3 h-3 mr-1" />}
                  Particles
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowHUD(!showHUD)}
                  className={`text-xs ${showHUD ? 'bg-cyan-500/20 text-cyan-300' : 'text-white/50'}`}
                  data-testid="button-toggle-hud"
                >
                  HUD
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowHeatmap(!showHeatmap)}
                  className={`text-xs ${showHeatmap ? 'bg-orange-500/20 text-orange-300' : 'text-white/50'}`}
                  data-testid="button-toggle-heatmap"
                >
                  Heatmap
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-white/60 text-[10px] font-mono uppercase">Interface</div>
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowOverlays(!showOverlays)}
                  className={`text-xs ${showOverlays ? 'bg-cyan-500/20 text-cyan-300' : 'text-white/50'}`}
                  data-testid="button-toggle-overlays"
                >
                  {showOverlays ? <Eye className="w-3 h-3 mr-1" /> : <EyeOff className="w-3 h-3 mr-1" />}
                  Panels
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setFocusMode(!focusMode)}
                  className={`text-xs ${focusMode ? 'bg-purple-500/20 text-purple-200' : 'text-white/50'}`}
                  data-testid="button-toggle-focus"
                >
                  {focusMode ? <Eye className="w-3 h-3 mr-1" /> : <EyeOff className="w-3 h-3 mr-1" />}
                  Focus
                </Button>
              </div>
            </div>

            {isUnlocked && !isStaticMode && (
              <div className="space-y-2 pt-2 border-t border-white/10">
                <div className="flex justify-between items-center">
                  <div className="text-white/60 text-[10px] font-mono uppercase">Rack Count</div>
                  <div className="text-cyan-400 text-sm font-mono">{rackCount}</div>
                </div>
                <Slider
                  value={[rackCount]}
                  onValueChange={(v) => setRackCount(v[0])}
                  min={9}
                  max={500}
                  step={1}
                  className="w-full"
                  data-testid="slider-rack-count"
                />
                <div className="flex justify-between text-[9px] text-white/40 font-mono">
                  <span>9</span>
                  <span>500</span>
                </div>

                <div className="space-y-3 pt-2 border-t border-white/10">
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <div className="text-white/60 text-[10px] font-mono uppercase">Fill Rate</div>
                      <div className="text-cyan-400 text-[10px] font-mono">{Math.round(proceduralOptions.fillRateMultiplier * 100)}%</div>
                    </div>
                    <Slider
                      value={[proceduralOptions.fillRateMultiplier * 100]}
                      onValueChange={(v) => setProceduralOptions(prev => ({ ...prev, fillRateMultiplier: v[0] / 100 }))}
                      min={10}
                      max={150}
                      step={5}
                      className="w-full"
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <div className="text-white/60 text-[10px] font-mono uppercase">Fault Prop</div>
                      <div className="text-red-400 text-[10px] font-mono">{proceduralOptions.errorRate}x</div>
                    </div>
                    <Slider
                      value={[proceduralOptions.errorRate]}
                      onValueChange={(v) => setProceduralOptions(prev => ({ ...prev, errorRate: v[0] }))}
                      min={0}
                      max={10}
                      step={0.5}
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <div className="text-white/60 text-[10px] font-mono uppercase">Base Temp</div>
                      <div className="text-orange-400 text-[10px] font-mono">{proceduralOptions.tempBase}°C</div>
                    </div>
                    <Slider
                      value={[proceduralOptions.tempBase]}
                      onValueChange={(v) => setProceduralOptions(prev => ({ ...prev, tempBase: v[0] }))}
                      min={15}
                      max={35}
                      step={1}
                      className="w-full"
                    />
                  </div>
                </div>

                <div className="flex gap-1 mt-2">
                  <QuickRackBtn count={9} current={rackCount} onClick={setRackCount} />
                  <QuickRackBtn count={50} current={rackCount} onClick={setRackCount} />
                  <QuickRackBtn count={100} current={rackCount} onClick={setRackCount} />
                  <QuickRackBtn count={250} current={rackCount} onClick={setRackCount} />
                  <QuickRackBtn count={500} current={rackCount} onClick={setRackCount} />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {showOverlays && !focusMode && (
        <div className="fixed bottom-4 left-4 z-40 space-y-1 rounded-lg border border-cyan-500/20 bg-black/50 px-3 py-2 font-mono text-[10px] text-white/70 shadow-[0_0_18px_rgba(34,211,238,0.2)]">
          <div className="flex items-center gap-2 text-cyan-200/80">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
            Systems nominal · Visual engine synchronized
          </div>
          <div className="text-white/50">Drag to rotate · Scroll to zoom · Click rack to inspect</div>
          {isUnlocked && !isStaticMode && (
            <div className="text-cyan-400/70">Admin suite: Use sliders to scale the simulation.</div>
          )}
          {isStaticMode && (
            <div className="text-cyan-300/80">Operations: Select a rack to add/remove equipment.</div>
          )}
        </div>
      )}
    </div>
  );
}

function CameraModeBtn({ 
  active, 
  onClick, 
  icon, 
  label 
}: { 
  active: boolean; 
  onClick: () => void; 
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <Button
      size="sm"
      variant="ghost"
      onClick={onClick}
      className={`text-xs gap-1 ${active ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' : 'text-white/50'}`}
      data-testid={`button-camera-${label.toLowerCase()}`}
    >
      {icon}
      {label}
    </Button>
  );
}

function QuickRackBtn({ 
  count, 
  current, 
  onClick 
}: { 
  count: number; 
  current: number; 
  onClick: (n: number) => void; 
}) {
  const isActive = current === count;
  return (
    <button
      onClick={() => onClick(count)}
      className={`px-2 py-1 text-[10px] font-mono rounded ${
        isActive 
          ? 'bg-cyan-500/30 text-cyan-300' 
          : 'bg-white/5 text-white/40 hover:bg-white/10 hover:text-white/60'
      }`}
      data-testid={`button-quick-rack-${count}`}
    >
      {count}
    </button>
  );
}
