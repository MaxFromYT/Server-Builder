import { useState, useEffect } from "react";
import { useGame } from "@/lib/game-context";
import { IsometricDataCenter } from "@/components/3d/IsometricDataCenter";
import { GameHUD } from "@/components/3d/GameHUD";
import { RackDetailPanel } from "@/components/3d/RackDetailPanel";
import { LoadingScreen } from "@/components/ui/loading-screen";
import type { Rack } from "@shared/schema";

export function DataCenter3D() {
  const { isLoading } = useGame();
  const [selectedRack, setSelectedRack] = useState<Rack | null>(null);
  const [isUnlocked, setIsUnlocked] = useState(false);

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

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="relative w-full h-screen overflow-hidden bg-background" data-testid="datacenter-3d-page">
      <IsometricDataCenter
        onSelectRack={setSelectedRack}
        selectedRackId={selectedRack?.id || null}
        isUnlocked={isUnlocked}
      />
      
      <GameHUD isUnlocked={isUnlocked} onUnlock={handleUnlock} />
      
      {selectedRack && (
        <RackDetailPanel
          rack={selectedRack}
          onClose={() => setSelectedRack(null)}
          isUnlocked={isUnlocked}
        />
      )}

      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-40" data-testid="game-title">
        <h1 className="font-display text-2xl font-bold tracking-wider text-foreground/90 drop-shadow-lg">
          HYPERSCALE
        </h1>
        <p className="text-center text-xs text-muted-foreground uppercase tracking-widest">
          Data Center Architect
        </p>
      </div>
    </div>
  );
}
