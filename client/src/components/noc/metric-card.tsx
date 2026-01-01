import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface MetricCardProps {
  label: string;
  value: string | number;
  unit?: string;
  trend?: "up" | "down" | "stable";
  trendValue?: string;
  status?: "normal" | "warning" | "critical";
  icon?: React.ReactNode;
  testId?: string;
}

export function MetricCard({
  label,
  value,
  unit,
  trend,
  trendValue,
  status = "normal",
  icon,
  testId,
}: MetricCardProps) {
  const statusColors = {
    normal: "border-l-noc-green",
    warning: "border-l-noc-yellow",
    critical: "border-l-noc-red",
  };

  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
  const trendColor = trend === "up" ? "text-noc-green" : trend === "down" ? "text-noc-red" : "text-muted-foreground";

  return (
    <Card
      className={`p-4 border-l-4 ${statusColors[status]} bg-card/50 backdrop-blur-sm`}
      data-testid={testId}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground uppercase tracking-wide truncate">
            {label}
          </p>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-bold font-mono tabular-nums">
              {value}
            </span>
            {unit && (
              <span className="text-sm text-muted-foreground">{unit}</span>
            )}
          </div>
          {trend && trendValue && (
            <div className={`flex items-center gap-1 mt-1 text-xs ${trendColor}`}>
              <TrendIcon className="w-3 h-3" />
              <span>{trendValue}</span>
            </div>
          )}
        </div>
        {icon && (
          <div className="text-muted-foreground">{icon}</div>
        )}
      </div>
    </Card>
  );
}
