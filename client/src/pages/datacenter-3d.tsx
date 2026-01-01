import { useState, useEffect, useRef } from "react";
import { useGame } from "@/lib/game-context";
import { DatacenterScene } from "@/components/3d/DatacenterScene";
import { GameHUD } from "@/components/3d/GameHUD";
import { RackDetailPanel } from "@/components/3d/RackDetailPanel";
import { MiniMap } from "@/components/3d/MiniMap";
import { BuildToolbar } from "@/components/3d/BuildToolbar";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { WelcomeScreen } from "@/components/ui/welcome-screen";
import { Onboarding } from "@/components/ui/onboarding";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { DebugOverlay } from "@/components/ui/debug-overlay";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "@/lib/theme-provider";
import { buildSummaryText, downloadBuildSummary } from "@/lib/export";
import {
  loadAutosaveSnapshots,
  loadSaveSlots,
  rollbackAutosaveSnapshot,
  saveSlot,
} from "@/lib/save-system";
import {
  Camera,
  Play,
  Sparkles,
  Eye,
  EyeOff,
  RotateCcw,
  Info,
  Save,
  Upload,
  Undo2,
  FileText,
  Clipboard,
  ShieldCheck,
  Rocket,
  Redo2,
} from "lucide-react";
import type { Rack } from "@shared/schema";
import type { AutosaveSnapshot, SaveSlot } from "@/lib/save-system";
import { useBuild } from "@/lib/build-context";

type CameraMode = "orbit" | "auto" | "cinematic";

function isTypingTarget(target: EventTarget | null) {
  const el = target as HTMLElement | null;
  if (!el) return false;
  const tag = el.tagName?.toLowerCase();
  return tag === "input" || tag === "textarea" || el.isContentEditable;
}

export function DataCenter3D() {
  const { isLoading, racks, isStaticMode, setRacksFromSave } = useGame();
  const { selectedIds, selectRack, clearSelection, undo, redo, canUndo, canRedo } = useBuild();
  const { fontScale, setFontScale, highContrast, toggleHighContrast } = useTheme();
  const { toast } = useToast();

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

  // NEW: global toolbars toggle (T)
  const [showToolbars, setShowToolbars] = useState(true);

  const [fastRamp, setFastRamp] = useState(false);
  const fastRampTimer = useRef<number | null>(null);
  const rackUpdateTimer = useRef<number | null>(null);
  const [lodResetToken, setLodResetToken] = useState(0);

  const [proceduralOptions, setProceduralOptions] = useState({
    seed: 42,
    fillRateMultiplier: 1,
    errorRate: 1,
    tempBase: 20,
  });

  const [showControls, setShowControls] = useState(false);

  const [saveSlots, setSaveSlots] = useState<SaveSlot[]>(() => loadSaveSlots());
  const [autosaves, setAutosaves] = useState<AutosaveSnapshot[]>(() => loadAutosaveSnapshots());

  const [slotLabels, setSlotLabels] = useState<Record<string, string>>(() => {
    const slots = loadSaveSlots();
    const defaults = ["slot-1", "slot-2", "slot-3"];
    return defaults.reduce<Record<string, string>>((acc, id, index) => {
      const match = slots.find((slot) => slot.id === id);
      acc[id] = match?.label ?? `Slot ${index + 1}`;
      return acc;
    }, {});
  });

  const selectedRackId = selectedIds[0] ?? null;
  const visibleRacks = isStaticMode ? racks.slice(0, rackCount) : racks;
  const selectedRack = visibleRacks?.find((r) => r.id === selectedRackId) || null;

  const effectiveEffects = showEffects && !fastRamp;

  const validateBuild = () => {
    const powerViolations = racks.filter((rack) => rack.currentPowerDraw > rack.powerCapacity);
    const slotViolations = racks.filter((rack) => {
      const usedSlots =
        rack.installedEquipment?.reduce((acc, eq) => acc + (eq.uEnd - eq.uStart + 1), 0) || 0;
      return usedSlots > rack.totalUs;
    });

    if (powerViolations.length === 0 && slotViolations.length === 0) {
      toast({
        title: "Validation passed",
        description: "All racks are within power and capacity limits.",
      });
      return true;
    }

    toast({
      title: "Validation found issues",
      description: `${powerViolations.length} power alerts · ${slotViolations.length} capacity alerts.`,
      variant: "destructive",
    });
    return false;
  };

  useEffect(() => {
    if (isStaticMode) {
      setIsUnlocked(true);
      return;
    }
    const savedUnlock = localStorage.getItem("hyperscale_unlocked");
    if (savedUnlock === "true") setIsUnlocked(true);
  }, [isStaticMode]);

  useEffect(() => {
    if (!isStaticMode) return;
    setQualityMode("high");
    setShowEffects(true);
  }, [isStaticMode, rackCount]);

  useEffect(() => {
    const timeout = window.setTimeout(() => setShowIntro(false), 2000);
    return () => window.clearTimeout(timeout);
  }, []);

  const handleUnlock = () => {
    if (isStaticMode) return;
    setIsUnlocked(true);
    localStorage.setItem("hyperscale_unlocked", "true");
  };

  const handleSelectRack = (rack: Rack | null) => {
    if (!rack) {
      clearSelection();
      return;
    }
    selectRack(rack.id);
  };

  const handleRackCountChange = (next: number) => {
    const clamped = Math.min(500, Math.max(1, Math.round(next)));
    setSliderValue(clamped);

    if (rackUpdateTimer.current) window.clearTimeout(rackUpdateTimer.current);

    rackUpdateTimer.current = window.setTimeout(() => {
      setRackCount(clamped);
      setLodResetToken((prev) => prev + 1);
    }, 120);

    setFastRamp(true);
    if (fastRampTimer.current) window.clearTimeout(fastRampTimer.current);

    fastRampTimer.current = window.setTimeout(() => setFastRamp(false), 500);
  };

  useEffect(() => {
    return () => {
      if (fastRampTimer.current) window.clearTimeout(fastRampTimer.current);
      if (rackUpdateTimer.current) window.clearTimeout(rackUpdateTimer.current);
    };
  }, []);

  useEffect(() => {
    if (!isStaticMode) return;
    setAutosaves(loadAutosaveSnapshots());
    setSaveSlots(loadSaveSlots());
  }, [isStaticMode, racks]);

  const handleSaveSlot = (slotId: string) => {
    if (!isStaticMode) {
      toast({
        title: "Saving disabled",
        description: "Save slots are only available in the local sandbox mode.",
      });
      return;
    }

    const label = slotLabels[slotId] ?? slotId;
    const saved = saveSlot(slotId, racks, label);

    setSaveSlots(loadSaveSlots());

    toast({
      title: "Saved snapshot",
      description: `${saved.label} updated at ${new Date(saved.savedAt).toLocaleTimeString()}.`,
    });
  };

  const handleLoadSlot = (slot: SaveSlot) => {
    if (!isStaticMode) return;
    setRacksFromSave(slot.racks);
    clearSelection();
    toast({
      title: "Loaded snapshot",
      description: `${slot.label} restored.`,
    });
  };

  const handleLoadAutosave = (snapshot: AutosaveSnapshot) => {
    if (!isStaticMode) return;
    setRacksFromSave(snapshot.racks);
    clearSelection();
    toast({
      title: "Autosave loaded",
      description: `Restored ${new Date(snapshot.savedAt).toLocaleTimeString()}.`,
    });
  };

  const handleRollback = () => {
    if (!isStaticMode) return;
    const snapshot = rollbackAutosaveSnapshot();
    if (!snapshot) {
      toast({
        title: "No rollback available",
        description: "Create another autosave to enable rollback.",
      });
      return;
    }
    setRacksFromSave(snapshot.racks);
    clearSelection();
    setAutosaves(loadAutosaveSnapshots());
    toast({
      title: "Rolled back",
      description: `Returned to ${new Date(snapshot.savedAt).toLocaleTimeString()}.`,
    });
  };

  const handleQuickSave = () => {
    if (!isStaticMode) {
      toast({
        title: "Save disabled",
        description: "Save slots are only available in local sandbox mode.",
      });
      return;
    }
    handleSaveSlot("slot-1");
  };

  const handleDeploy = () => {
    const ok = validateBuild();
    if (!ok) return;
    toast({
      title: "Deployment queued",
      description: "Build handed off to operations for rollout.",
    });
  };

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.repeat) return;
      if (isTypingTarget(event.target)) return;

      if (event.key === "1") setCameraMode("orbit");
      if (event.key === "2") setCameraMode("auto");
      if (event.key === "3") setCameraMode("cinematic");

      if (event.key.toLowerCase() === "h") setShowHUD((prev) => !prev);
      if (event.key.toLowerCase() === "e") setShowEffects((prev) => !prev);
      if (event.key.toLowerCase() === "f") setFocusMode((prev) => !prev);
      if (event.key.toLowerCase() === "o") setShowOverlays((prev) => !prev);

      // NEW: T hides/shows toolbars (BuildToolbar + bottom action bar)
      if (event.key.toLowerCase() === "t") setShowToolbars((prev) => !prev);

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") {
        event.preventDefault();
        if (event.shiftKey) redo();
        else undo();
      }

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "y") {
        event.preventDefault();
        redo();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [redo, undo]);

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
        lodResetToken={lodResetToken}
      />

      {/* Top overlays */}
      {showOverlays && !focusMode && (
        <>
          {showToolbars && <BuildToolbar />}
          <div data-ui="true">
            <GameHUD isUnlocked={isUnlocked} onUnlock={handleUnlock} showUnlock={!isStaticMode} />
          </div>
        </>
      )}

      {showOverlays && !focusMode && (
        <div className="fixed top-20 right-4 z-40" data-ui="true">
          <MiniMap
            racks={visibleRacks || []}
            selectedRackId={selectedRackId}
            onSelectRack={handleSelectRack}
            floorSize={25}
          />
        </div>
      )}

      {selectedRack && showOverlays && !focusMode && (
        <div data-ui="true">
          <RackDetailPanel rack={selectedRack} onClose={clearSelection} isUnlocked={isUnlocked} />
        </div>
      )}

      <WelcomeScreen isVisible={showIntro} />
      {showOverlays && !focusMode && <div data-ui="true"><Onboarding /></div>}

      {/* Static mode console panel */}
      {isStaticMode && showOverlays && !focusMode && !selectedRack && (
        <div
          className="fixed top-20 left-4 z-40 w-[280px] bg-gradient-to-br from-cyan-500/10 via-black/70 to-purple-500/10 backdrop-blur-md rounded-lg border border-cyan-500/30 p-4 space-y-3 shadow-[0_0_25px_rgba(34,211,238,0.15)]"
          data-ui="true"
        >
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
                qualityMode === "high" ? "bg-cyan-500/20 text-cyan-200" : "text-white/50"
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

      {/* Title */}
      {showOverlays && !focusMode && (
        <div
          className="fixed top-4 left-1/2 -translate-x-1/2 z-40 pointer-events-none"
          data-testid="game-title"
        >
          <h1
            className="font-display text-2xl font-bold tracking-wider text-white drop-shadow-lg"
            style={{ fontFamily: "Orbitron, sans-serif" }}
          >
            HYPERSCALE
          </h1>
          <p className="text-center text-xs text-white/70 uppercase tracking-widest">
            Data Center Architect
          </p>
        </div>
      )}

      {/* Controls button + panel */}
      <div className="fixed bottom-4 right-4 z-40 flex flex-col gap-2 items-end" data-ui="true">
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
              <div className="flex items-center justify-between text-white/60 text-[10px] font-mono uppercase">
                <span>Camera Mode</span>
                <InlineHelp tip="Switch between free orbit, auto spin, and cinematic camera movement." />
              </div>
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
              <div className="flex items-center justify-between text-white/60 text-[10px] font-mono uppercase">
                <span>Effects</span>
                <InlineHelp tip="Toggle particle, HUD, and thermal overlays." />
              </div>
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowEffects(!showEffects)}
                  className={`text-xs ${showEffects ? "bg-cyan-500/20 text-cyan-300" : "text-white/50"}`}
                  data-testid="button-toggle-effects"
                >
                  {showEffects ? <Eye className="w-3 h-3 mr-1" /> : <EyeOff className="w-3 h-3 mr-1" />}
                  Particles
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowHUD(!showHUD)}
                  className={`text-xs ${showHUD ? "bg-cyan-500/20 text-cyan-300" : "text-white/50"}`}
                  data-testid="button-toggle-hud"
                >
                  HUD
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowHeatmap(!showHeatmap)}
                  className={`text-xs ${showHeatmap ? "bg-orange-500/20 text-orange-300" : "text-white/50"}`}
                  data-testid="button-toggle-heatmap"
                >
                  Heatmap
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-white/60 text-[10px] font-mono uppercase">
                <span>Interface</span>
                <InlineHelp tip="Show or hide panels and enter focus mode." />
              </div>
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowOverlays(!showOverlays)}
                  className={`text-xs ${showOverlays ? "bg-cyan-500/20 text-cyan-300" : "text-white/50"}`}
                  data-testid="button-toggle-overlays"
                >
                  {showOverlays ? <Eye className="w-3 h-3 mr-1" /> : <EyeOff className="w-3 h-3 mr-1" />}
                  Panels
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setFocusMode(!focusMode)}
                  className={`text-xs ${focusMode ? "bg-purple-500/20 text-purple-200" : "text-white/50"}`}
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
                  onValueChange={(v) => handleRackCountChange(v[0])}
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
                      <div className="text-cyan-400 text-[10px] font-mono">
                        {Math.round(proceduralOptions.fillRateMultiplier * 100)}%
                      </div>
                    </div>
                    <Slider
                      value={[proceduralOptions.fillRateMultiplier * 100]}
                      onValueChange={(v) =>
                        setProceduralOptions((prev) => ({ ...prev, fillRateMultiplier: v[0] / 100 }))
                      }
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
                      onValueChange={(v) => setProceduralOptions((prev) => ({ ...prev, errorRate: v[0] }))}
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
                      onValueChange={(v) => setProceduralOptions((prev) => ({ ...prev, tempBase: v[0] }))}
                      min={15}
                      max={35}
                      step={1}
                      className="w-full"
                    />
                  </div>
                </div>

                <div className="flex gap-1 mt-2">
                  <QuickRackBtn count={9} current={rackCount} onClick={handleRackCountChange} />
                  <QuickRackBtn count={50} current={rackCount} onClick={handleRackCountChange} />
                  <QuickRackBtn count={100} current={rackCount} onClick={handleRackCountChange} />
                  <QuickRackBtn count={250} current={rackCount} onClick={handleRackCountChange} />
                  <QuickRackBtn count={500} current={rackCount} onClick={handleRackCountChange} />
                </div>
              </div>
            )}

            <div className="space-y-2 pt-2 border-t border-white/10">
              <div className="flex items-center justify-between text-white/60 text-[10px] font-mono uppercase">
                <span>Accessibility</span>
                <InlineHelp tip="Scale the UI and toggle a high-contrast palette." />
              </div>
              <div className="flex items-center justify-between text-[10px] text-white/60 font-mono">
                <span>Font scale</span>
                <span className="text-cyan-300">{Math.round(fontScale * 100)}%</span>
              </div>
              <Slider
                value={[fontScale * 100]}
                onValueChange={(value) => setFontScale(value[0] / 100)}
                min={85}
                max={125}
                step={5}
                className="w-full"
                data-testid="slider-font-scale"
              />
              <Button
                size="sm"
                variant="ghost"
                onClick={toggleHighContrast}
                className={`text-xs ${highContrast ? "bg-cyan-500/20 text-cyan-200" : "text-white/50"}`}
                data-testid="button-high-contrast"
              >
                {highContrast ? "High contrast: On" : "High contrast: Off"}
              </Button>
            </div>

            <div className="space-y-2 pt-2 border-t border-white/10">
              <div className="flex items-center justify-between text-white/60 text-[10px] font-mono uppercase">
                <span>Save & Export</span>
                <InlineHelp tip="Store local snapshots and export a text summary of the racks." />
              </div>

              <div className="space-y-2 text-[10px] font-mono text-white/60">
                {["slot-1", "slot-2", "slot-3"].map((slotId, index) => {
                  const slot = saveSlots.find((item) => item.id === slotId);
                  const label = slotLabels[slotId] ?? `Slot ${index + 1}`;
                  return (
                    <div key={slotId} className="flex items-center gap-2">
                      <input
                        value={label}
                        onChange={(event) =>
                          setSlotLabels((prev) => ({ ...prev, [slotId]: event.target.value }))
                        }
                        className="flex-1 rounded border border-white/10 bg-black/40 px-2 py-1 text-[10px] text-white/70 focus:outline-none focus:border-cyan-400/60"
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleSaveSlot(slotId)}
                        className="h-7 w-7"
                        disabled={!isStaticMode}
                        data-testid={`button-save-${slotId}`}
                      >
                        <Save className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => slot && handleLoadSlot(slot)}
                        className="h-7 w-7"
                        disabled={!slot || !isStaticMode}
                        data-testid={`button-load-${slotId}`}
                      >
                        <Upload className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  );
                })}
              </div>

              <div className="space-y-1 text-[10px] font-mono text-white/60">
                <div className="flex items-center justify-between">
                  <span>Autosaves</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleRollback}
                    className="text-[10px]"
                    disabled={autosaves.length < 2 || !isStaticMode}
                    data-testid="button-rollback-autosave"
                  >
                    <Undo2 className="h-3 w-3 mr-1" />
                    Rollback
                  </Button>
                </div>

                {autosaves.slice(0, 3).map((snapshot) => (
                  <button
                    key={snapshot.id}
                    onClick={() => handleLoadAutosave(snapshot)}
                    className="w-full text-left rounded border border-white/10 bg-black/30 px-2 py-1 text-[10px] text-white/60 hover:text-white"
                    disabled={!isStaticMode}
                  >
                    {new Date(snapshot.savedAt).toLocaleTimeString()}
                  </button>
                ))}

                {autosaves.length === 0 && <p className="text-white/40">No autosaves yet.</p>}
              </div>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => downloadBuildSummary(racks)}
                  className="text-xs"
                  data-testid="button-export-summary"
                >
                  <FileText className="h-3 w-3 mr-1" />
                  Export
                </Button>

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={async () => {
                    try {
                      const summary = buildSummaryText(racks);
                      await navigator.clipboard.writeText(summary);
                      toast({
                        title: "Summary copied",
                        description: "Build summary copied to clipboard.",
                      });
                    } catch {
                      toast({
                        title: "Copy failed",
                        description: "Clipboard access is unavailable in this environment.",
                      });
                    }
                  }}
                  className="text-xs"
                  data-testid="button-copy-summary"
                >
                  <Clipboard className="h-3 w-3 mr-1" />
                  Copy
                </Button>
              </div>

              {!isStaticMode && (
                <p className="text-[10px] text-white/40">
                  Save slots are only available for local sandbox builds.
                </p>
              )}
            </div>

            <div className="space-y-2 pt-2 border-t border-white/10">
              <div className="flex items-center justify-between text-white/60 text-[10px] font-mono uppercase">
                <span>Diagnostics</span>
                <InlineHelp tip="Export debug logs to help diagnose issues." />
              </div>
              <DebugOverlay />
            </div>
          </div>
        )}
      </div>

      {/* Bottom left hint panel */}
      {showOverlays && !focusMode && (
        <div
          className="fixed bottom-4 left-4 z-40 space-y-1 rounded-lg border border-cyan-500/20 bg-black/50 px-3 py-2 font-mono text-[10px] text-white/70 shadow-[0_0_18px_rgba(34,211,238,0.2)]"
          data-ui="true"
        >
          <div className="flex items-center gap-2 text-cyan-200/80">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
            Systems nominal · Visual engine synchronized
          </div>
          <div className="text-white/50">Drag to rotate · Scroll to zoom · Click rack to inspect</div>
          {isUnlocked && !isStaticMode && (
            <div className="text-cyan-400/70">Admin suite: Use sliders to scale the simulation.</div>
          )}
          {isStaticMode && <div className="text-cyan-300/80">Operations: Select a rack to add/remove equipment.</div>}
        </div>
      )}

      {/* Bottom center action bar (NOW hides with T) */}
      {isUnlocked && !focusMode && showToolbars && (
        <div
          className="fixed bottom-4 left-1/2 z-40 flex -translate-x-1/2 items-center gap-2 rounded-full border border-cyan-500/30 bg-black/70 px-3 py-2 shadow-[0_0_20px_rgba(34,211,238,0.25)] backdrop-blur"
          data-ui="true"
        >
          <FooterButton label="Undo" onClick={undo} disabled={!canUndo}>
            <Undo2 className="h-4 w-4" />
          </FooterButton>
          <FooterButton label="Redo" onClick={redo} disabled={!canRedo}>
            <Redo2 className="h-4 w-4" />
          </FooterButton>

          <div className="mx-1 h-6 w-px bg-white/10" />

          <FooterButton label="Validate build" onClick={validateBuild}>
            <ShieldCheck className="h-4 w-4" />
          </FooterButton>

          <FooterButton label="Save to slot 1" onClick={handleQuickSave} disabled={!isStaticMode}>
            <Save className="h-4 w-4" />
          </FooterButton>

          <FooterButton label="Deploy to operations" onClick={handleDeploy}>
            <Rocket className="h-4 w-4" />
          </FooterButton>
        </div>
      )}
    </div>
  );
}

function InlineHelp({ tip }: { tip: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button className="text-white/40 hover:text-white/70" type="button" data-ui="true">
          <Info className="h-3 w-3" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="left" className="max-w-xs text-[10px]">
        {tip}
      </TooltipContent>
    </Tooltip>
  );
}

function FooterButton({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          size="icon"
          variant="ghost"
          onClick={onClick}
          disabled={disabled}
          className="h-9 w-9 text-white/70 hover:text-white"
          aria-label={label}
          data-ui="true"
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="top" className="text-[10px]">
        {label}
      </TooltipContent>
    </Tooltip>
  );
}

function CameraModeBtn({
  active,
  onClick,
  icon,
  label,
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
      className={`text-xs gap-1 ${
        active ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/30" : "text-white/50"
      }`}
      data-testid={`button-camera-${label.toLowerCase()}`}
      data-ui="true"
    >
      {icon}
      {label}
    </Button>
  );
}

function QuickRackBtn({
  count,
  current,
  onClick,
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
          ? "bg-cyan-500/30 text-cyan-300"
          : "bg-white/5 text-white/40 hover:bg-white/10 hover:text-white/60"
      }`}
      data-testid={`button-quick-rack-${count}`}
      type="button"
      data-ui="true"
    >
      {count}
    </button>
  );
}
