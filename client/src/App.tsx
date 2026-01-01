import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/lib/theme-provider";
import { GameProvider, useGame } from "@/lib/game-context";
import { GameHeader } from "@/components/layout/game-header";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { NocDashboard } from "@/pages/noc-dashboard";
import { BuildMode } from "@/pages/build-mode";
import { NetworkMode } from "@/pages/network-mode";
import { IncidentMode } from "@/pages/incident-mode";
import { FloorMode } from "@/pages/floor-mode";

function GameView() {
  const { gameState, isLoading } = useGame();

  if (isLoading) {
    return <LoadingScreen />;
  }

  switch (gameState.currentMode) {
    case "noc":
      return <NocDashboard />;
    case "build":
      return <BuildMode />;
    case "network":
      return <NetworkMode />;
    case "incident":
      return <IncidentMode />;
    case "floor":
      return <FloorMode />;
    default:
      return <NocDashboard />;
  }
}

function GameLayout() {
  return (
    <div className="flex flex-col h-screen w-full bg-background">
      <GameHeader />
      <main className="flex-1 overflow-hidden">
        <GameView />
      </main>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <GameProvider>
            <GameLayout />
            <Toaster />
          </GameProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
