import { IncidentPanel } from "@/components/incident/incident-panel";
import { AlertStream } from "@/components/noc/alert-stream";

export function IncidentMode() {
  return (
    <div className="h-full overflow-auto p-4" data-testid="page-incident-mode">
      <div className="grid grid-cols-12 gap-4 h-full min-h-[600px]">
        <div className="col-span-12 lg:col-span-8">
          <h2 className="font-display text-lg font-semibold uppercase tracking-wider mb-4">
            Active Incidents
          </h2>
          <IncidentPanel />
        </div>

        <div className="col-span-12 lg:col-span-4 h-full">
          <AlertStream />
        </div>
      </div>
    </div>
  );
}
