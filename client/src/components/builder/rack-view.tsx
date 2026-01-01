import { useGame } from "@/lib/game-context";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Server, Plus, Thermometer, Zap } from "lucide-react";

export function RackView() {
  const { racks, selectedRackId, setSelectedRackId, servers } = useGame();
  const selectedRack = racks.find((r) => r.id === selectedRackId);

  if (!selectedRack) {
    return (
      <Card className="flex flex-col items-center justify-center h-full bg-card/50 backdrop-blur-sm p-8" data-testid="rack-view-empty">
        <Server className="w-16 h-16 text-muted-foreground mb-4" />
        <h3 className="font-display text-lg font-semibold">Select a Rack</h3>
        <p className="text-sm text-muted-foreground mt-2 text-center">
          Choose a rack from the thermal overview to view and edit its contents.
        </p>
        <div className="grid grid-cols-3 gap-2 mt-6">
          {racks.map((rack) => (
            <Button
              key={rack.id}
              variant="outline"
              onClick={() => setSelectedRackId(rack.id)}
              className="font-mono"
              data-testid={`button-select-rack-${rack.id}`}
            >
              {rack.name}
            </Button>
          ))}
        </div>
      </Card>
    );
  }

  const usSlots = Array.from({ length: selectedRack.totalUs }, (_, i) => i + 1).reverse();

  return (
    <Card className="flex flex-col h-full bg-card/50 backdrop-blur-sm" data-testid="rack-view">
      <div className="flex items-center justify-between p-4 border-b border-border gap-2">
        <div className="flex items-center gap-3">
          <h3 className="font-display text-sm font-semibold uppercase tracking-wider">
            {selectedRack.name}
          </h3>
          <Badge variant="outline" className="font-mono">
            {selectedRack.type.replace("_", " ")}
          </Badge>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1">
            <Thermometer className="w-3 h-3 text-noc-yellow" />
            <span className="font-mono">{selectedRack.inletTemp.toFixed(1)}°C</span>
          </div>
          <div className="flex items-center gap-1">
            <Zap className="w-3 h-3 text-noc-green" />
            <span className="font-mono">
              {(selectedRack.currentPowerDraw / 1000).toFixed(1)} kW
            </span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <div className="flex gap-2">
          <div className="flex flex-col gap-1 text-[10px] font-mono text-muted-foreground">
            {usSlots.map((u) => (
              <div
                key={u}
                className="h-8 flex items-center justify-end pr-1 w-6"
              >
                {u}U
              </div>
            ))}
          </div>

          <div className="flex-1 border border-border rounded-md bg-background/30 overflow-hidden">
            {usSlots.map((u) => {
              const slot = selectedRack.slots.find((s) => s.uPosition === u);
              const server = slot?.serverId
                ? servers.find((s) => s.id === slot.serverId)
                : null;

              if (server) {
                const serverHeight =
                  server.chassisType === "1U"
                    ? 1
                    : server.chassisType === "2U"
                    ? 2
                    : 4;
                if (u !== parseInt(server.name.split("-U")[1])) return null;

                return (
                  <Tooltip key={u}>
                    <TooltipTrigger asChild>
                      <div
                        className={`h-${serverHeight * 8} border-b border-border px-2 flex items-center gap-2 bg-muted/50 hover-elevate cursor-pointer`}
                        style={{ height: serverHeight * 32 }}
                        data-testid={`rack-slot-${u}`}
                      >
                        <div className="flex flex-col gap-0.5">
                          {Array.from({ length: 4 }).map((_, i) => (
                            <div
                              key={i}
                              className={`w-1.5 h-1.5 rounded-full ${
                                i === 0
                                  ? server.status === "online"
                                    ? "bg-noc-green"
                                    : server.status === "warning"
                                    ? "bg-noc-yellow"
                                    : "bg-noc-red"
                                  : "bg-muted-foreground/30"
                              }`}
                            />
                          ))}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-mono truncate">
                            {server.name}
                          </p>
                          <p className="text-[10px] text-muted-foreground truncate">
                            {server.chassisType} • {server.installedCpus.length}×CPU • {server.installedRam.length}×RAM
                          </p>
                        </div>
                        <div className="text-[10px] font-mono text-muted-foreground">
                          {server.powerDraw}W
                        </div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      <div className="text-xs space-y-1">
                        <p className="font-semibold">{server.name}</p>
                        <div className="flex justify-between gap-4">
                          <span className="text-muted-foreground">Power:</span>
                          <span className="font-mono">{server.powerDraw}W</span>
                        </div>
                        <div className="flex justify-between gap-4">
                          <span className="text-muted-foreground">Temp:</span>
                          <span className="font-mono">
                            {server.inletTemp.toFixed(1)}°C → {server.exhaustTemp.toFixed(1)}°C
                          </span>
                        </div>
                        <div className="flex justify-between gap-4">
                          <span className="text-muted-foreground">RAID:</span>
                          <span className="font-mono">
                            {server.raidLevel ? `RAID ${server.raidLevel}` : "None"}
                          </span>
                        </div>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                );
              }

              return (
                <div
                  key={u}
                  className="h-8 border-b border-border/50 px-2 flex items-center justify-center hover-elevate cursor-pointer"
                  data-testid={`rack-slot-${u}`}
                >
                  <Plus className="w-4 h-4 text-muted-foreground/30" />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-border">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-4">
            <div>
              <span className="text-muted-foreground">Power: </span>
              <span className="font-mono">
                {(selectedRack.currentPowerDraw / 1000).toFixed(1)} / {(selectedRack.powerCapacity / 1000).toFixed(0)} kW
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Airflow Block: </span>
              <span className={`font-mono ${selectedRack.airflowRestriction > 25 ? "text-noc-yellow" : ""}`}>
                {selectedRack.airflowRestriction}%
              </span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedRackId(null)}
            data-testid="button-close-rack"
          >
            Close
          </Button>
        </div>
      </div>
    </Card>
  );
}
