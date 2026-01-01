import type { Rack } from "@shared/schema";

const formatTimestamp = (timestamp: number) =>
  new Date(timestamp).toLocaleString();

export const buildSummaryText = (racks: Rack[]): string => {
  const timestamp = formatTimestamp(Date.now());
  const lines: string[] = [
    "HYPERSCALE BUILD SUMMARY",
    `Generated: ${timestamp}`,
    `Total Racks: ${racks.length}`,
    "",
  ];

  racks.forEach((rack) => {
    lines.push(`Rack ${rack.name} (${rack.type.replace(/_/g, " ")})`);
    lines.push(`Power: ${(rack.currentPowerDraw / 1000).toFixed(1)}kW / ${(rack.powerCapacity / 1000).toFixed(1)}kW`);
    lines.push(`Inlet Temp: ${rack.inletTemp.toFixed(1)}°C · Exhaust Temp: ${rack.exhaustTemp.toFixed(1)}°C`);
    if (rack.installedEquipment?.length) {
      rack.installedEquipment.forEach((installed) => {
        lines.push(`  - ${installed.equipmentId} @ U${installed.uStart}-${installed.uEnd} (${installed.status})`);
      });
    } else {
      lines.push("  - No installed equipment");
    }
    lines.push("");
  });

  return lines.join("\n");
};

export const downloadBuildSummary = (racks: Rack[]) => {
  if (typeof window === "undefined") return;
  const blob = new Blob([buildSummaryText(racks)], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `hyperscale-build-summary-${Date.now()}.txt`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
