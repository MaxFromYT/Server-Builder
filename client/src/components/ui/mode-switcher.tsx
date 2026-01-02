import { useLocation } from "wouter";
import { useGame } from "@/lib/game-context";
import { Button } from "@/components/ui/button";
import type { GameMode } from "@shared/schema";
import { Wrench, LayoutGrid, Network, Activity, AlertTriangle, User } from "lucide-react";

const modes: { id: GameMode; label: string; icon: typeof Wrench }[] = [
  { id: "build", label: "BUILD", icon: Wrench },
  { id: "floor", label: "FLOOR", icon: LayoutGrid },
  { id: "network", label: "NETWORK", icon: Network },
  { id: "noc", label: "NOC", icon: Activity },
  { id: "incident", label: "INCIDENTS", icon: AlertTriangle },
];

const modeRoutes: Record<GameMode, string> = {
  build: "/build",
  floor: "/",
  network: "/network",
  noc: "/noc",
  incident: "/incidents",
};

const extraTabs = [
  { label: "ABOUT", icon: User, path: "/about" },
] as const;

export function ModeSwitcher() {
  const { gameState, setGameMode } = useGame();
  const [location, setLocation] = useLocation();

  return (
    <div className="flex gap-1" data-testid="mode-switcher">
      {modes.map((mode) => {
        const Icon = mode.icon;
        const isActive =
          location === modeRoutes[mode.id] || (location === "/" && mode.id === "floor");
        return (
          <Button
            key={mode.id}
            variant={isActive ? "default" : "ghost"}
            size="sm"
            onClick={() => {
              setGameMode(mode.id);
              setLocation(modeRoutes[mode.id]);
            }}
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
      {extraTabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = location === tab.path;
        return (
          <Button
            key={tab.path}
            variant={isActive ? "default" : "ghost"}
            size="sm"
            onClick={() => setLocation(tab.path)}
            className={`font-mono text-xs tracking-wide ${
              isActive ? "" : "text-muted-foreground"
            }`}
            data-testid={`button-mode-${tab.label.toLowerCase()}`}
          >
            <Icon className="w-4 h-4 mr-1.5" />
            {tab.label}
          </Button>
        );
      })}
    </div>
  );
}
