import { useGame } from "@/lib/game-context";
import { Card } from "@/components/ui/card";

export function CoolingGauge() {
  const { facilityMetrics } = useGame();
  const utilizationPercent = (facilityMetrics.coolingLoad / facilityMetrics.coolingCapacity) * 100;
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (utilizationPercent / 100) * circumference;

  const getStrokeColor = () => {
    if (utilizationPercent < 65) return "stroke-noc-cyan";
    if (utilizationPercent < 85) return "stroke-noc-yellow";
    return "stroke-noc-red";
  };

  return (
    <Card className="p-4 bg-card/50 backdrop-blur-sm" data-testid="cooling-gauge">
      <h3 className="font-display text-sm font-semibold uppercase tracking-wider mb-4">
        Cooling Capacity
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
            <span className="text-xs text-muted-foreground">Used</span>
          </div>
        </div>
        <div className="mt-4 w-full space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Current Load</span>
            <span className="font-mono">{(facilityMetrics.coolingLoad / 1000).toFixed(0)} kW</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Capacity</span>
            <span className="font-mono">{(facilityMetrics.coolingCapacity / 1000).toFixed(0)} kW</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Headroom</span>
            <span className="font-mono text-noc-cyan">
              {((facilityMetrics.coolingCapacity - facilityMetrics.coolingLoad) / 1000).toFixed(0)} kW
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}
