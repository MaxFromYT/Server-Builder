import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import type { Rack } from "@shared/schema";

interface MiniMapProps {
  racks: Rack[];
  selectedRackId: string | null;
  onSelectRack: (rack: Rack) => void;
  floorSize: number;
}

export function MiniMap({ racks, selectedRackId, onSelectRack, floorSize }: MiniMapProps) {
  const maxCol = Math.max(...racks.map(r => r.positionX), 1);
  const maxRow = Math.max(...racks.map(r => r.positionY), 1);
  
  const mapWidth = 160;
  const mapHeight = (maxRow / maxCol) * mapWidth;

  const rackDots = useMemo(() => {
    return racks.map(rack => {
      const x = (rack.positionX / maxCol) * (mapWidth - 10) + 5;
      const y = (rack.positionY / maxRow) * (mapHeight - 10) + 5;
      
      let statusColor = "bg-green-500";
      if (rack.inletTemp > 30) statusColor = "bg-red-500";
      else if (rack.inletTemp > 27) statusColor = "bg-orange-500";
      else if (rack.inletTemp > 25) statusColor = "bg-yellow-500";

      return {
        id: rack.id,
        x,
        y,
        color: statusColor,
        isSelected: rack.id === selectedRackId,
        rack
      };
    });
  }, [racks, selectedRackId, maxCol, maxRow, mapHeight]);

  return (
    <Card className="p-2 bg-black/60 backdrop-blur-md border-cyan-500/30 w-[180px] shadow-xl">
      <div className="text-[10px] text-cyan-400 font-mono uppercase mb-2 flex justify-between">
        <span>Floor Map</span>
        <span className="opacity-50">{racks.length} Nodes</span>
      </div>
      <div 
        className="relative bg-black/40 rounded border border-white/5 overflow-hidden"
        style={{ width: `${mapWidth}px`, height: `${mapHeight}px` }}
      >
        {rackDots.map(dot => (
          <button
            key={dot.id}
            onClick={() => onSelectRack(dot.rack)}
            className={`absolute w-1.5 h-1.5 rounded-full transition-all hover:scale-150 ${dot.color} ${
              dot.isSelected ? "ring-2 ring-white scale-150 z-10" : "opacity-60"
            }`}
            style={{ 
              left: `${dot.x}px`, 
              top: `${dot.y}px`,
              transform: 'translate(-50%, -50%)'
            }}
            title={`Rack ${dot.rack.name}`}
          />
        ))}
      </div>
    </Card>
  );
}
