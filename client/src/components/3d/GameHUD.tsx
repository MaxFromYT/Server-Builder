import { useEffect, useState } from "react";
import {
  Lock,
  Unlock,
  DollarSign,
  Star,
  Activity,
  AlertTriangle,
  Thermometer,
  Zap,
  Server,
  Loader2,
  Maximize2,
  Minimize2,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useGame } from "@/lib/game-context";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { SettingsPanel } from "@/components/ui/settings-panel";
import { useToast } from "@/hooks/use-toast";

interface GameHUDProps {
  isUnlocked: boolean;
  onUnlock: () => void;
  showUnlock?: boolean;
}

export function GameHUD({ isUnlocked, onUnlock, showUnlock = true }: GameHUDProps) {
  const { gameState, facilityMetrics, alerts, racks, generateMaxedDatacenter, isGeneratingMaxed } = useGame();
  const { toast } = useToast();
  const [showCodeDialog, setShowCodeDialog] = useState(false);
  const [codeInput, setCodeInput] = useState("");
  const [codeError, setCodeError] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const criticalAlerts = alerts?.filter(a => a.severity === "critical" && !a.acknowledged).length || 0;
  const warningAlerts = alerts?.filter(a => a.severity === "warning" && !a.acknowledged).length || 0;

  const handleCodeSubmit = () => {
    if (codeInput.toLowerCase() === "doubin") {
      onUnlock();
      setShowCodeDialog(false);
      setCodeInput("");
      setCodeError(false);
    } else {
      setCodeError(true);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    handleFullscreenChange();
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const handleFullscreenToggle = async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
        return;
      }
      await document.documentElement.requestFullscreen();
    } catch {
      setIsFullscreen(Boolean(document.fullscreenElement));
    }
  };

  return (
    <>
      <div className="fixed top-4 left-4 z-40 flex flex-col gap-3" data-testid="game-hud-left">
        <Card className="p-3 bg-background/80 backdrop-blur-md border-border/50">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-noc-green" />
              <span className="font-mono font-bold text-lg">${(gameState?.money || 0).toLocaleString()}</span>
            </div>
            <div className="w-px h-6 bg-border" />
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-noc-yellow" />
              <span className="font-mono">{gameState?.reputation || 0}</span>
            </div>
            <div className="w-px h-6 bg-border" />
            <Badge variant="outline" className="font-display uppercase">
              {gameState?.tier?.replace("tier", "Tier ") || "Garage"}
            </Badge>
          </div>
        </Card>

        <Card className="p-3 bg-background/80 backdrop-blur-md border-border/50">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-noc-green" />
              <span className="font-mono text-sm">{facilityMetrics?.uptime?.toFixed(3) || 99.99}%</span>
            </div>
            <div className="flex items-center gap-2">
              <Thermometer className="w-4 h-4 text-noc-cyan" />
              <span className="font-mono text-sm">PUE {facilityMetrics?.pue?.toFixed(2) || 1.2}</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-noc-yellow" />
              <span className="font-mono text-sm">{((facilityMetrics?.itLoad || 0) / 1000).toFixed(0)}kW</span>
            </div>
          </div>
        </Card>
      </div>

      <div className="fixed top-4 right-4 z-40 flex items-center gap-3" data-testid="game-hud-right">
        {criticalAlerts > 0 && (
          <Card className="p-3 bg-noc-red/20 border-noc-red/50 backdrop-blur-md animate-pulse">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-noc-red" />
              <span className="font-mono text-sm text-noc-red">{criticalAlerts} Critical</span>
            </div>
          </Card>
        )}
        
        {warningAlerts > 0 && (
          <Card className="p-3 bg-noc-yellow/20 border-noc-yellow/50 backdrop-blur-md">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-noc-yellow" />
              <span className="font-mono text-sm text-noc-yellow">{warningAlerts} Warning</span>
            </div>
          </Card>
        )}

        <ThemeToggle />

        <Button
          size="icon"
          variant="outline"
          onClick={() => setShowSettings(true)}
          data-testid="button-settings"
        >
          <Settings className="h-4 w-4" />
        </Button>

        <Button
          size="icon"
          variant="outline"
          onClick={handleFullscreenToggle}
          data-testid="button-fullscreen"
        >
          {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
        </Button>

        {showUnlock && (
          <Button
            size="icon"
            variant={isUnlocked ? "default" : "outline"}
            onClick={() => setShowCodeDialog(true)}
            data-testid="button-unlock"
            className={isUnlocked ? "bg-noc-purple hover:bg-noc-purple/80" : ""}
          >
            {isUnlocked ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
          </Button>
        )}
      </div>

      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40" data-testid="game-hud-bottom">
        <Card className="flex items-center gap-6 p-3 bg-background/80 backdrop-blur-md border-border/50">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>Drag to rotate</span>
            <div className="w-px h-4 bg-border" />
            <span>Scroll to zoom</span>
            <div className="w-px h-4 bg-border" />
            <span>Click rack to inspect</span>
          </div>
          <div className="ml-auto flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
            <span className="rounded-full bg-cyan-400/20 px-2 py-1 text-cyan-300">Max Doubin</span>
          </div>
        </Card>
      </div>

      <SettingsPanel open={showSettings} onOpenChange={setShowSettings} />

      {showUnlock && (
        <Dialog open={showCodeDialog} onOpenChange={setShowCodeDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5" />
              {isUnlocked ? "Admin Mode Active" : "Enter Access Code"}
            </DialogTitle>
            <DialogDescription>
              {isUnlocked 
                ? "You have full access to the maxed-out datacenter. All editing features are enabled."
                : "Enter the secret code to unlock the fully configured datacenter with editing capabilities."
              }
            </DialogDescription>
          </DialogHeader>
          
          {!isUnlocked ? (
            <div className="space-y-4">
              <Input
                type="password"
                placeholder="Enter code..."
                value={codeInput}
                onChange={(e) => {
                  setCodeInput(e.target.value);
                  setCodeError(false);
                }}
                onKeyDown={(e) => e.key === "Enter" && handleCodeSubmit()}
                className={codeError ? "border-noc-red" : ""}
                data-testid="input-secret-code"
              />
              {codeError && (
                <p className="text-sm text-noc-red">Invalid code. Try again.</p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2">
                  <Server className="w-5 h-5 text-noc-cyan" />
                  <span className="font-mono">{racks?.length || 0} Racks</span>
                </div>
                <Badge variant="outline" className="text-noc-purple border-noc-purple">
                  Editing Enabled
                </Badge>
              </div>
              
              <Button
                className="w-full bg-noc-purple hover:bg-noc-purple/80"
                onClick={async () => {
                  const ok = await generateMaxedDatacenter();
                  if (!ok) {
                    toast({
                      title: "Generation failed",
                      description: "The service is unavailable. Please retry shortly.",
                      variant: "destructive",
                    });
                    return;
                  }
                  setShowCodeDialog(false);
                }}
                disabled={isGeneratingMaxed}
                data-testid="button-generate-maxed"
              >
                {isGeneratingMaxed ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating 500 Racks...
                  </>
                ) : (
                  <>
                    <Server className="w-4 h-4 mr-2" />
                    Generate Maxed Datacenter (500 Racks)
                  </>
                )}
              </Button>
              
              <p className="text-xs text-muted-foreground text-center">
                This will replace the current datacenter with 500 fully-equipped racks, each with different equipment configurations.
              </p>
            </div>
          )}

          <DialogFooter>
            {isUnlocked ? (
              <Button variant="outline" onClick={() => setShowCodeDialog(false)}>
                Close
              </Button>
            ) : (
              <>
                <Button variant="outline" onClick={() => setShowCodeDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCodeSubmit} data-testid="button-submit-code">
                  Unlock
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
      )}
    </>
  );
}
