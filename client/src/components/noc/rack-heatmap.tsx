import { useGame } from "@/lib/game-context";
import { Card } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

function getHeatColor(temp: number): string {
  if (temp < 25) return "bg-noc-blue/70";
  if (temp < 27) return "bg-noc-green/70";
  if (temp < 30) return "bg-noc-yellow/70";
  return "bg-noc-red/70";
}

function getTempLabel(temp: number): string {
  if (temp < 25) return "Cool";
  if (temp < 27) return "Normal";
  if (temp < 30) return "Warm";
  return "Hot";
}

export function RackHeatmap() {
  const { racks, setSelectedRackId } = useGame();

  if (!racks || racks.length === 0) {
    return (
      <Card className="p-4 bg-card/50 backdrop-blur-sm" data-testid="rack-heatmap-empty">
        <h3 className="font-display text-sm font-semibold uppercase tracking-wider mb-4">
          Thermal Overview
        </h3>
        <p className="text-sm text-muted-foreground text-center py-8">No racks configured</p>
      </Card>
    );
  }

  return (
    <Card className="p-4 bg-card/50 backdrop-blur-sm" data-testid="rack-heatmap">
      <h3 className="font-display text-sm font-semibold uppercase tracking-wider mb-4">
        Thermal Overview
      </h3>
      <div className="grid grid-cols-3 gap-4">
        {racks.map((rack) => (
          <Tooltip key={rack.id}>
            <TooltipTrigger asChild>
              <button
                onClick={() => setSelectedRackId(rack.id)}
                className="relative aspect-[3/4] rounded-md border border-border overflow-hidden hover-elevate active-elevate-2 transition-transform"
                data-testid={`rack-tile-${rack.id}`}
              >
                <div
                  className={`absolute inset-0 ${getHeatColor(rack.inletTemp)}`}
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                  <span className="font-mono text-xs font-medium">
                    {rack.name}
                  </span>
                  <span className="font-mono text-lg font-bold">
                    {rack.inletTemp.toFixed(1)}°C
                  </span>
                  <span className="text-[10px] uppercase opacity-80">
                    {getTempLabel(rack.inletTemp)}
                  </span>
                </div>
                {rack.airflowRestriction > 25 && (
                  <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-noc-yellow animate-pulse" />
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <div className="text-xs space-y-1">
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Inlet:</span>
                  <span className="font-mono">{rack.inletTemp.toFixed(1)}°C</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Exhaust:</span>
                  <span className="font-mono">{rack.exhaustTemp.toFixed(1)}°C</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Delta-T:</span>
                  <span className="font-mono">
                    {(rack.exhaustTemp - rack.inletTemp).toFixed(1)}°C
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Airflow Block:</span>
                  <span className="font-mono">{rack.airflowRestriction}%</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Power:</span>
                  <span className="font-mono">
                    {(rack.currentPowerDraw / 1000).toFixed(1)} kW
                  </span>
                </div>
              </div>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
      <div className="flex items-center justify-center gap-4 mt-4 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-sm bg-noc-blue/70" />
          <span className="text-muted-foreground">&lt;25°C</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-sm bg-noc-green/70" />
          <span className="text-muted-foreground">25-27°C</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-sm bg-noc-yellow/70" />
          <span className="text-muted-foreground">27-30°C</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-sm bg-noc-red/70" />
          <span className="text-muted-foreground">&gt;30°C</span>
        </div>
      </div>
    </Card>
  );
}
