import { useGame } from "@/lib/game-context";
import { Badge } from "@/components/ui/badge";
import { Zap, Thermometer, Clock, AlertCircle, Server, HardDrive } from "lucide-react";

export function StatusBar() {
  const { facilityMetrics, alerts } = useGame();
  const criticalCount = alerts.filter((a) => a.severity === "critical" && !a.acknowledged).length;

  return (
    <div className="flex items-center gap-4 text-sm" data-testid="status-bar">
      <div className="flex items-center gap-1.5" data-testid="status-power">
        <Zap className="w-4 h-4 text-noc-yellow" />
        <span className="font-mono text-xs">
          {(facilityMetrics.itLoad / 1000).toFixed(1)} kW
        </span>
      </div>

      <div className="flex items-center gap-1.5" data-testid="status-pue">
        <span className="text-xs text-muted-foreground">PUE</span>
        <span className="font-mono text-xs font-semibold">
          {facilityMetrics.pue.toFixed(2)}
        </span>
      </div>

      <div className="flex items-center gap-1.5" data-testid="status-uptime">
        <Clock className="w-4 h-4 text-noc-green" />
        <span className="font-mono text-xs">
          {facilityMetrics.uptime.toFixed(4)}%
        </span>
      </div>

      <div className="flex items-center gap-1.5" data-testid="status-servers">
        <Server className="w-4 h-4 text-noc-blue" />
        <span className="font-mono text-xs">{facilityMetrics.serverCount}</span>
      </div>

      <div className="flex items-center gap-1.5" data-testid="status-storage">
        <HardDrive className="w-4 h-4 text-noc-purple" />
        <span className="font-mono text-xs">
          {((facilityMetrics.storageUsed / facilityMetrics.storageCapacity) * 100).toFixed(0)}%
        </span>
      </div>

      {criticalCount > 0 && (
        <Badge variant="destructive" className="font-mono" data-testid="status-critical-alerts">
          <AlertCircle className="w-3 h-3 mr-1" />
          {criticalCount} CRITICAL
        </Badge>
      )}
    </div>
  );
}
