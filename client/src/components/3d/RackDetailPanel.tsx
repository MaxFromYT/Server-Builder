import { X, Thermometer, Zap, Server, HardDrive, Cpu, MemoryStick, Network } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useGame } from "@/lib/game-context";
import type { Rack } from "@shared/schema";

interface RackDetailPanelProps {
  rack: Rack;
  onClose: () => void;
  isUnlocked: boolean;
}

function getStatusColor(value: number, thresholds: { good: number; warning: number }) {
  if (value < thresholds.good) return "text-noc-green";
  if (value < thresholds.warning) return "text-noc-yellow";
  return "text-noc-red";
}

export function RackDetailPanel({ rack, onClose, isUnlocked }: RackDetailPanelProps) {
  const { servers, inventory } = useGame();
  
  const rackServers = servers.filter(s => s.name.includes(rack.name.replace("RACK-", "R")));
  const powerPercent = (rack.currentPowerDraw / rack.powerCapacity) * 100;
  const usedSlots = rack.slots.filter(s => s.serverId !== null).length;
  const slotPercent = (usedSlots / rack.totalUs) * 100;

  return (
    <div className="fixed right-0 top-0 h-full w-96 bg-background/95 backdrop-blur-md border-l border-border z-50 flex flex-col" data-testid="rack-detail-panel">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-noc-blue/20">
            <Server className="w-5 h-5 text-noc-blue" />
          </div>
          <div>
            <h2 className="font-display font-bold text-lg">{rack.name}</h2>
            <p className="text-sm text-muted-foreground">{rack.type.replace("_", " ")}</p>
          </div>
        </div>
        <Button size="icon" variant="ghost" onClick={onClose} data-testid="button-close-panel">
          <X className="w-5 h-5" />
        </Button>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-6">
          <Card className="p-4 bg-card/50">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Thermal Status
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Thermometer className="w-4 h-4 text-noc-blue" />
                  <span className="text-xs text-muted-foreground">Inlet</span>
                </div>
                <p className={`font-mono text-xl ${getStatusColor(rack.inletTemp, { good: 25, warning: 28 })}`}>
                  {rack.inletTemp.toFixed(1)}°C
                </p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Thermometer className="w-4 h-4 text-noc-red" />
                  <span className="text-xs text-muted-foreground">Exhaust</span>
                </div>
                <p className={`font-mono text-xl ${getStatusColor(rack.exhaustTemp, { good: 35, warning: 40 })}`}>
                  {rack.exhaustTemp.toFixed(1)}°C
                </p>
              </div>
            </div>
            <div className="mt-3">
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>Airflow Restriction</span>
                <span>{rack.airflowRestriction}%</span>
              </div>
              <Progress value={rack.airflowRestriction} className="h-2" />
            </div>
          </Card>

          <Card className="p-4 bg-card/50">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Power Consumption
            </h3>
            <div className="flex items-baseline gap-2 mb-2">
              <Zap className={`w-5 h-5 ${getStatusColor(powerPercent, { good: 70, warning: 85 })}`} />
              <span className="font-mono text-2xl">{rack.currentPowerDraw.toLocaleString()}</span>
              <span className="text-sm text-muted-foreground">/ {rack.powerCapacity.toLocaleString()}W</span>
            </div>
            <Progress value={powerPercent} className="h-3" />
            <p className="text-xs text-muted-foreground mt-2">
              {powerPercent.toFixed(1)}% of capacity
            </p>
          </Card>

          <Card className="p-4 bg-card/50">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Rack Capacity
            </h3>
            <div className="flex items-baseline gap-2 mb-2">
              <HardDrive className="w-5 h-5 text-noc-cyan" />
              <span className="font-mono text-2xl">{usedSlots}</span>
              <span className="text-sm text-muted-foreground">/ {rack.totalUs}U used</span>
            </div>
            <Progress value={slotPercent} className="h-3" />
          </Card>

          {isUnlocked && (
            <>
              <Separator />
              <Card className="p-4 bg-noc-purple/10 border-noc-purple/30">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-noc-purple mb-3">
                  Edit Mode Unlocked
                </h3>
                <div className="space-y-2">
                  <Button variant="outline" className="w-full justify-start gap-2" data-testid="button-add-server">
                    <Cpu className="w-4 h-4" />
                    Add Server
                  </Button>
                  <Button variant="outline" className="w-full justify-start gap-2" data-testid="button-add-storage">
                    <HardDrive className="w-4 h-4" />
                    Add Storage
                  </Button>
                  <Button variant="outline" className="w-full justify-start gap-2" data-testid="button-add-network">
                    <Network className="w-4 h-4" />
                    Add Network Switch
                  </Button>
                </div>
              </Card>
            </>
          )}

          <Card className="p-4 bg-card/50">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Installed Equipment
            </h3>
            <div className="space-y-2">
              {rackServers.length > 0 ? (
                rackServers.map((server) => (
                  <div key={server.id} className="flex items-center justify-between p-2 rounded-md bg-background/50">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${server.status === "online" ? "bg-noc-green" : "bg-noc-red"}`} />
                      <span className="text-sm">{server.name}</span>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {server.chassisType}
                    </Badge>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No servers installed
                </p>
              )}
            </div>
          </Card>
        </div>
      </ScrollArea>

      {!isUnlocked && (
        <div className="p-4 border-t border-border bg-muted/30">
          <p className="text-xs text-center text-muted-foreground">
            Enter secret code to unlock editing
          </p>
        </div>
      )}
    </div>
  );
}
