import { HardwarePalette } from "@/components/builder/hardware-palette";
import { RackView } from "@/components/builder/rack-view";
import { RackHeatmap } from "@/components/noc/rack-heatmap";

export function BuildMode() {
  return (
    <div className="h-full overflow-hidden p-4" data-testid="page-build-mode">
      <div className="grid grid-cols-12 gap-4 h-full">
        <div className="col-span-12 lg:col-span-3 h-full overflow-hidden">
          <HardwarePalette />
        </div>

        <div className="col-span-12 lg:col-span-6 h-full overflow-hidden">
          <RackView />
        </div>

        <div className="col-span-12 lg:col-span-3 space-y-4 overflow-auto">
          <RackHeatmap />
        </div>
      </div>
    </div>
  );
}
