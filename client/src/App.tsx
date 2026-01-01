import { useEffect } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/lib/theme-provider";
import { GameProvider } from "@/lib/game-context";
import { BuildProvider } from "@/lib/build-context";
import { DataCenter3D } from "@/pages/datacenter-3d";
import { disposePooledAssets } from "@/lib/asset-pool";

export default function App() {
  useEffect(() => {
    const handleUnload = () => disposePooledAssets();
    window.addEventListener("beforeunload", handleUnload);
    return () => {
      window.removeEventListener("beforeunload", handleUnload);
      disposePooledAssets();
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ThemeProvider defaultTheme="dark" storageKey="hyperscale-theme">
          <GameProvider>
            <BuildProvider>
              <DataCenter3D />
            </BuildProvider>
          </GameProvider>
          <Toaster />
        </ThemeProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
