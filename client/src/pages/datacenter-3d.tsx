import { useState, useEffect, useRef, type ReactNode } from "react";
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
import { PerformanceOverlay } from "@/components/3d/PerformanceOverlay";

type CameraMode = "orbit" | "auto" | "cinematic";
type SessionMode = "build" | "explore";

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

  const [sessionMode, setSessionMode] = useState<SessionMode | null>(null);
  const introVisible = sessionMode === null;
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [cameraMode, setCameraMode] = useState<CameraMode>("orbit");
  const [showEffects, setShowEffects] = useState(true);
  const [showHUD, setShowHUD] = useState(true);
  const [rackCount, setRackCount] = useState(1);
  const [sliderValue, setSliderValue] = useState(1);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [qualityMode, setQualityMode] = useState<"low" | "high">("high");
  const [showOverlays, setShowOverlays] = useState(true);
  const [focusMode, setFocusMode] = useState(false);
  const [showToolbars, setShowToolbars] = useState(true);
  const [showPerfOverlay, setShowPerfOverlay] = useState(false);
  const [perfWarning, setPerfWarning] = useState<string | null>(null);

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

  const handleUnlock = () => {
    if (isStaticMode) return;
    setIsUnlocked(true);
    localStorage.setItem("hyperscale_unlocked", "true");
  };

  const handleSelectRack = (rack: Rack | null) => {
    if (introVisible) return;
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
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.repeat) return;
      if (isTypingTarget(event.target)) return;
      if (introVisible) return;

      if (event.key === "1") setCameraMode("orbit");
      if (event.key === "2") setCameraMode("auto");
      if (event.key === "3") setCameraMode("cinematic");

      if (event.key.toLowerCase() === "h") setShowHUD((p) => !p);
      if (event.key.toLowerCase() === "e") setShowEffects((p) => !p);
      if (event.key.toLowerCase() === "g") setFocusMode((p) => !p);
      if (event.key.toLowerCase() === "f") setShowPerfOverlay((p) => !p);
      if (event.key.toLowerCase() === "o") setShowOverlays((p) => !p);
      if (event.key.toLowerCase() === "t") setShowToolbars((p) => !p);
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") {
        event.preventDefault();
        if (event.shiftKey) redo();
        else undo();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [introVisible, redo, undo]);

  if (isLoading) return <LoadingScreen />;

  const sceneCameraMode: CameraMode = introVisible ? "cinematic" : cameraMode;

  return (
    <div className="relative w-full h-screen overflow-hidden bg-background">
      <DatacenterScene
        onSelectRack={handleSelectRack}
        selectedRackId={selectedRackId}
        isUnlocked={isUnlocked}
        cameraMode={sceneCameraMode}
        showEffects={introVisible ? true : effectiveEffects}
        showHUD={introVisible ? false : showHUD}
        rackCount={rackCount}
        proceduralOptions={proceduralOptions}
        showHeatmap={showHeatmap}
        qualityMode={qualityMode}
        visibleRacks={visibleRacks}
        forceSimplified={isStaticMode && fastRamp}
        lodResetToken={lodResetToken}
      />

      <PerformanceOverlay
        visible={showPerfOverlay}
        qualityMode={qualityMode}
        onWarningChange={setPerfWarning}
      />

      <WelcomeScreen
        isVisible={introVisible}
        onStart={(mode) => {
          setSessionMode(mode);
          if (mode === "explore") {
            setFocusMode(true);
            setShowOverlays(false);
            setShowToolbars(false);
            setCameraMode("cinematic");
            setShowHUD(true);
            setShowEffects(true);
          } else {
            setFocusMode(false);
            setShowOverlays(true);
            setShowToolbars(true);
            setCameraMode("orbit");
            setShowHUD(true);
            setShowEffects(true);
          }
        }}
      />

      {!introVisible && showOverlays && !focusMode && (
        <>
          {sessionMode === "build" && showToolbars && <BuildToolbar />}
          <GameHUD
            isUnlocked={isUnlocked}
            onUnlock={handleUnlock}
            showUnlock={!isStaticMode}
            hideBottomBar={sessionMode === "build"}
          />
        </>
      )}

      {selectedRack && showOverlays && !focusMode && (
        <RackDetailPanel rack={selectedRack} onClose={clearSelection} isUnlocked={isUnlocked} />
      )}

      {showControls && perfWarning && (
        <div className="fixed bottom-28 right-4 rounded-md border border-orange-400/30 bg-orange-500/10 p-2 text-[10px] text-orange-200">
          {perfWarning}
        </div>
      )}
    </div>
  );
}
