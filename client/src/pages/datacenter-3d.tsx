import { useState, useEffect } from "react";
import { useGame } from "@/lib/game-context";
import { DatacenterScene } from "@/components/3d/DatacenterScene";
import { GameHUD } from "@/components/3d/GameHUD";
import { RackDetailPanel } from "@/components/3d/RackDetailPanel";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Camera, Play, Sparkles, Grid3X3, Eye, EyeOff, RotateCcw } from "lucide-react";
import type { Rack } from "@shared/schema";

type CameraMode = "orbit" | "auto" | "cinematic";

export function DataCenter3D() {
  const { isLoading, racks } = useGame();
  const [selectedRackId, setSelectedRackId] = useState<string | null>(null);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [cameraMode, setCameraMode] = useState<CameraMode>("orbit");
  const [showEffects, setShowEffects] = useState(true);
  const [showHUD, setShowHUD] = useState(true);
  const [rackCount, setRackCount] = useState(9);
  const [proceduralOptions, setProceduralOptions] = useState({
    seed: 42,
    fillRateMultiplier: 1,
    errorRate: 1,
    tempBase: 20
  });
  const [showControls, setShowControls] = useState(false);

  const selectedRack = racks?.find(r => r.id === selectedRackId) || null;

  useEffect(() => {
    const savedUnlock = localStorage.getItem("hyperscale_unlocked");
    if (savedUnlock === "true") {
      setIsUnlocked(true);
    }
  }, []);

  const handleUnlock = () => {
    setIsUnlocked(true);
    localStorage.setItem("hyperscale_unlocked", "true");
  };

  const handleSelectRack = (rack: Rack | null) => {
    setSelectedRackId(rack?.id || null);
  };

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
        showEffects={showEffects}
        showHUD={showHUD}
        rackCount={rackCount}
        proceduralOptions={proceduralOptions}
      />
      
      <GameHUD isUnlocked={isUnlocked} onUnlock={handleUnlock} />
      
      {selectedRack && (
        <RackDetailPanel
          rack={selectedRack}
          onClose={() => setSelectedRackId(null)}
          isUnlocked={isUnlocked}
        />
      )}

      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-40 pointer-events-none" data-testid="game-title">
        <h1 className="font-display text-2xl font-bold tracking-wider text-white drop-shadow-lg" style={{ fontFamily: 'Orbitron, sans-serif' }}>
          HYPERSCALE
        </h1>
        <p className="text-center text-xs text-white/70 uppercase tracking-widest">
          Data Center Architect
        </p>
      </div>

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
              </div>
            </div>

            {isUnlocked && (
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

      <div className="fixed bottom-4 left-4 z-40 text-[10px] text-white/30 font-mono space-y-0.5">
        <div>Drag to rotate | Scroll to zoom | Click rack to inspect</div>
        {isUnlocked && <div className="text-cyan-500/50">Admin mode: Use slider to scale datacenter</div>}
      </div>
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
