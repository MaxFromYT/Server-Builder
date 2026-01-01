import { useGame } from "@/lib/game-context";
import { Button } from "@/components/ui/button";
import type { GameMode } from "@shared/schema";
import { Wrench, LayoutGrid, Network, Activity, AlertTriangle } from "lucide-react";

const modes: { id: GameMode; label: string; icon: typeof Wrench }[] = [
  { id: "build", label: "BUILD", icon: Wrench },
  { id: "floor", label: "FLOOR", icon: LayoutGrid },
  { id: "network", label: "NETWORK", icon: Network },
  { id: "noc", label: "NOC", icon: Activity },
  { id: "incident", label: "INCIDENTS", icon: AlertTriangle },
];

export function ModeSwitcher() {
  const { gameState, setGameMode } = useGame();

  return (
    <div className="flex gap-1" data-testid="mode-switcher">
      {modes.map((mode) => {
        const Icon = mode.icon;
        const isActive = gameState.currentMode === mode.id;
        return (
          <Button
            key={mode.id}
            variant={isActive ? "default" : "ghost"}
            size="sm"
            onClick={() => setGameMode(mode.id)}
            className={`font-mono text-xs tracking-wide ${
              isActive ? "" : "text-muted-foreground"
            }`}
            data-testid={`button-mode-${mode.id}`}
          >
            <Icon className="w-4 h-4 mr-1.5" />
            {mode.label}
          </Button>
        );
      })}
    </div>
  );
}
