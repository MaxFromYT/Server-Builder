import { useGame } from "@/lib/game-context";
import { MetricCard } from "@/components/noc/metric-card";
import { AlertStream } from "@/components/noc/alert-stream";
import { RackHeatmap } from "@/components/noc/rack-heatmap";
import { PowerGauge } from "@/components/noc/power-gauge";
import { CoolingGauge } from "@/components/noc/cooling-gauge";
import { TopologyView } from "@/components/network/topology-view";
import { Zap, Thermometer, Clock, Server, HardDrive, Network, AlertTriangle } from "lucide-react";

export function NocDashboard() {
  const { facilityMetrics, alerts, networkNodes } = useGame();
  const criticalAlerts = alerts.filter((a) => a.severity === "critical" && !a.acknowledged).length;
  const warningAlerts = alerts.filter((a) => a.severity === "warning" && !a.acknowledged).length;
  const onlineNodes = networkNodes.filter((n) => n.status === "online").length;

  return (
    <div className="h-full overflow-auto p-4" data-testid="page-noc-dashboard">
      <div className="grid grid-cols-12 gap-4 h-full min-h-[800px]">
        <div className="col-span-12 lg:col-span-3 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <MetricCard
              label="Uptime"
              value={facilityMetrics.uptime.toFixed(4)}
              unit="%"
              trend="stable"
              trendValue="30d avg"
              status="normal"
              icon={<Clock className="w-5 h-5" />}
              testId="metric-uptime"
            />
            <MetricCard
              label="PUE"
              value={facilityMetrics.pue.toFixed(2)}
              trend="down"
              trendValue="-0.02"
              status="normal"
              icon={<Zap className="w-5 h-5" />}
              testId="metric-pue"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <MetricCard
              label="Servers"
              value={facilityMetrics.serverCount}
              trend="up"
              trendValue="+3"
              status="normal"
              icon={<Server className="w-5 h-5" />}
              testId="metric-servers"
            />
            <MetricCard
              label="Network"
              value={`${onlineNodes}/${networkNodes.length}`}
              status={onlineNodes < networkNodes.length ? "warning" : "normal"}
              icon={<Network className="w-5 h-5" />}
              testId="metric-network"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <MetricCard
              label="Critical"
              value={criticalAlerts}
              status={criticalAlerts > 0 ? "critical" : "normal"}
              icon={<AlertTriangle className="w-5 h-5" />}
              testId="metric-critical"
            />
            <MetricCard
              label="Warnings"
              value={warningAlerts}
              status={warningAlerts > 2 ? "warning" : "normal"}
              icon={<AlertTriangle className="w-5 h-5" />}
              testId="metric-warnings"
            />
          </div>

          <RackHeatmap />
        </div>

        <div className="col-span-12 lg:col-span-6 space-y-4">
          <div className="h-[450px]">
            <TopologyView />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <MetricCard
              label="IT Load"
              value={(facilityMetrics.itLoad / 1000).toFixed(1)}
              unit="kW"
              trend="up"
              trendValue="+2.3kW"
              status="normal"
              icon={<Zap className="w-5 h-5" />}
              testId="metric-it-load"
            />
            <MetricCard
              label="Storage Used"
              value={((facilityMetrics.storageUsed / facilityMetrics.storageCapacity) * 100).toFixed(0)}
              unit="%"
              trend="up"
              trendValue="+120TB"
              status={facilityMetrics.storageUsed / facilityMetrics.storageCapacity > 0.85 ? "warning" : "normal"}
              icon={<HardDrive className="w-5 h-5" />}
              testId="metric-storage"
            />
          </div>
        </div>

        <div className="col-span-12 lg:col-span-3 space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-1 gap-4">
            <PowerGauge />
            <CoolingGauge />
          </div>
          <div className="h-[300px]">
            <AlertStream />
          </div>
        </div>
      </div>
    </div>
  );
}
