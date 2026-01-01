import { useGame } from "@/lib/game-context";
import { Card } from "@/components/ui/card";

export function PowerGauge() {
  const { facilityMetrics } = useGame();
  const utilizationPercent = (facilityMetrics.itLoad / facilityMetrics.totalPower) * 100;
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (utilizationPercent / 100) * circumference;

  const getStrokeColor = () => {
    if (utilizationPercent < 60) return "stroke-noc-green";
    if (utilizationPercent < 80) return "stroke-noc-yellow";
    return "stroke-noc-red";
  };

  return (
    <Card className="p-4 bg-card/50 backdrop-blur-sm" data-testid="power-gauge">
      <h3 className="font-display text-sm font-semibold uppercase tracking-wider mb-4">
        Power Utilization
      </h3>
      <div className="flex flex-col items-center">
        <div className="relative w-32 h-32">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              className="text-muted/30"
            />
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              strokeWidth="8"
              strokeLinecap="round"
              className={getStrokeColor()}
              style={{
                strokeDasharray: circumference,
                strokeDashoffset,
                transition: "stroke-dashoffset 0.5s ease-in-out",
              }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-mono text-2xl font-bold">
              {utilizationPercent.toFixed(0)}%
            </span>
            <span className="text-xs text-muted-foreground">Load</span>
          </div>
        </div>
        <div className="mt-4 w-full space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-muted-foreground">IT Load</span>
            <span className="font-mono">{(facilityMetrics.itLoad / 1000).toFixed(1)} kW</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total Capacity</span>
            <span className="font-mono">{(facilityMetrics.totalPower / 1000).toFixed(0)} kW</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Available</span>
            <span className="font-mono text-noc-green">
              {((facilityMetrics.totalPower - facilityMetrics.itLoad) / 1000).toFixed(1)} kW
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}
