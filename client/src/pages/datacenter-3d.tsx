import { useState, useEffect } from "react";
import { useGame } from "@/lib/game-context";
import { DatacenterScene } from "@/components/3d/DatacenterScene";
import { GameHUD } from "@/components/3d/GameHUD";
import { RackDetailPanel } from "@/components/3d/RackDetailPanel";
import { LoadingScreen } from "@/components/ui/loading-screen";
import type { Rack } from "@shared/schema";

export function DataCenter3D() {
  const { isLoading, racks } = useGame();
  const [selectedRackId, setSelectedRackId] = useState<string | null>(null);
  const [isUnlocked, setIsUnlocked] = useState(false);

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
        <h1 className="font-display text-2xl font-bold tracking-wider text-white drop-shadow-lg">
          HYPERSCALE
        </h1>
        <p className="text-center text-xs text-white/70 uppercase tracking-widest">
          Data Center Architect
        </p>
      </div>
    </div>
  );
}
