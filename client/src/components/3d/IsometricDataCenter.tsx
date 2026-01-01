import { useState, useRef, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useGame } from "@/lib/game-context";
import type { Rack, Equipment, InstalledEquipment } from "@shared/schema";

interface IsometricDataCenterProps {
  onSelectRack: (rack: Rack | null) => void;
  selectedRackId: string | null;
  isUnlocked: boolean;
}

function getTemperatureColor(temp: number): string {
  if (temp < 25) return "#22c55e";
  if (temp < 30) return "#eab308";
  if (temp < 35) return "#f97316";
  return "#ef4444";
}

function MiniEquipment({ 
  equipment, 
  installed, 
  scale = 1 
}: { 
  equipment: Equipment; 
  installed: InstalledEquipment;
  scale?: number;
}) {
  const height = installed.uEnd - installed.uStart + 1;
  const statusColor = installed.status === "online" ? "#00ff00" : 
                      installed.status === "warning" ? "#ffaa00" : "#ff0000";
  
  return (
    <div
      className="w-full rounded-sm"
      style={{
        height: `${height * 2.5 * scale}px`,
        background: `linear-gradient(90deg, 
          ${equipment.color} 0%, 
          color-mix(in srgb, ${equipment.color} 80%, white) 50%,
          ${equipment.color} 100%)`,
        boxShadow: `inset 0 1px 0 rgba(255,255,255,0.15), 
                    inset 0 -1px 0 rgba(0,0,0,0.3)`,
        position: 'relative',
      }}
    >
      {equipment.ledColor && (
        <div
          className="absolute right-0.5 top-1/2 -translate-y-1/2 rounded-full"
          style={{
            width: `${Math.max(2, 3 * scale)}px`,
            height: `${Math.max(2, 3 * scale)}px`,
            background: statusColor,
            boxShadow: `0 0 ${4 * scale}px ${statusColor}`,
          }}
        />
      )}
    </div>
  );
}

function Isometric3DRack({ 
  rack, 
  position, 
  isSelected, 
  isHovered,
  equipmentCatalog,
  onHover,
  onClick,
  scale = 1,
}: { 
  rack: Rack; 
  position: { x: number; z: number };
  isSelected: boolean;
  isHovered: boolean;
  equipmentCatalog: Equipment[];
  onHover: (hovered: boolean) => void;
  onClick: () => void;
  scale?: number;
}) {
  const tempColor = getTemperatureColor(rack.exhaustTemp);
  
  const rackWidth = 50 * scale;
  const rackHeight = 120 * scale;
  const rackDepth = 20 * scale;
  
  const spacing = 90 * scale;
  const isoX = (position.x - position.z) * spacing;
  const isoY = (position.x + position.z) * (spacing * 0.5);

  const getEquipmentBySlot = useCallback(() => {
    const equipmentMap: { equipment: Equipment; installed: InstalledEquipment }[] = [];
    rack.installedEquipment?.forEach((installed) => {
      const equipment = equipmentCatalog.find((eq) => eq.id === installed.equipmentId);
      if (equipment) {
        equipmentMap.push({ equipment, installed });
      }
    });
    return equipmentMap.sort((a, b) => b.installed.uStart - a.installed.uStart);
  }, [rack.installedEquipment, equipmentCatalog]);

  const installedEquipment = getEquipmentBySlot();

  return (
    <div
      className="absolute cursor-pointer transition-all duration-200"
      style={{
        left: `calc(50% + ${isoX}px)`,
        top: `calc(50% + ${isoY}px)`,
        transform: `translateX(-50%) translateY(-50%) ${isHovered ? 'translateY(-6px) scale(1.02)' : ''}`,
        zIndex: Math.floor((position.x + position.z) * 10) + (isHovered ? 100 : 0),
        transformStyle: 'preserve-3d',
      }}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
      onClick={onClick}
      data-testid={`rack-3d-${rack.id}`}
    >
      <div
        className="relative transition-all duration-200"
        style={{
          filter: isHovered ? 'brightness(1.15)' : 'brightness(1)',
          transformStyle: 'preserve-3d',
        }}
      >
        <div
          className="absolute"
          style={{
            width: `${rackWidth}px`,
            height: `${rackHeight}px`,
            background: `linear-gradient(180deg, 
              ${isSelected ? '#1a2d4a' : '#0c0f14'} 0%,
              ${isSelected ? '#142238' : '#080a0e'} 100%)`,
            transform: 'skewY(-20deg)',
            transformOrigin: 'bottom',
            borderRadius: `${4 * scale}px ${4 * scale}px 0 0`,
            boxShadow: isSelected 
              ? '0 0 25px rgba(0, 180, 255, 0.4), inset 0 0 30px rgba(0, 180, 255, 0.1)'
              : 'inset 0 0 20px rgba(0, 0, 0, 0.6)',
            border: isSelected 
              ? '1px solid rgba(0, 180, 255, 0.5)' 
              : '1px solid rgba(255, 255, 255, 0.05)',
            overflow: 'hidden',
          }}
        >
          <div
            className="absolute inset-x-1 top-1 bottom-1 flex flex-col-reverse gap-px p-0.5 overflow-hidden"
            style={{
              background: 'rgba(0,0,0,0.3)',
              borderRadius: `${2 * scale}px`,
            }}
          >
            {installedEquipment.length > 0 ? (
              installedEquipment.map(({ equipment, installed }) => (
                <MiniEquipment
                  key={installed.id}
                  equipment={equipment}
                  installed={installed}
                  scale={scale}
                />
              ))
            ) : (
              Array.from({ length: 10 }).map((_, i) => (
                <div
                  key={i}
                  className="w-full rounded-sm"
                  style={{
                    height: `${3 * scale}px`,
                    background: 'linear-gradient(90deg, #0a0a12 0%, #15151f 50%, #0a0a12 100%)',
                  }}
                />
              ))
            )}
          </div>
        </div>

        <div
          className="absolute"
          style={{
            width: `${rackDepth}px`,
            height: `${rackHeight}px`,
            left: `${rackWidth}px`,
            background: `linear-gradient(180deg, 
              ${isSelected ? '#0f1a2e' : '#060809'} 0%,
              ${isSelected ? '#0a1320' : '#040506'} 100%)`,
            transform: 'skewY(20deg)',
            transformOrigin: 'bottom',
            borderRadius: `0 ${4 * scale}px 0 0`,
          }}
        >
          <div className="absolute inset-x-1 inset-y-2 flex flex-col justify-between">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="w-full rounded-full"
                style={{
                  height: `${4 * scale}px`,
                  background: 'radial-gradient(circle, #1a1a1a 40%, #0a0a0a 100%)',
                }}
              />
            ))}
          </div>
        </div>

        <div
          className="absolute"
          style={{
            width: `${rackWidth}px`,
            height: `${rackDepth * 0.7}px`,
            top: `${-rackDepth * 0.35}px`,
            background: `linear-gradient(90deg, 
              ${isSelected ? '#152a42' : '#0a0d12'} 0%,
              ${isSelected ? '#1a3550' : '#0c1016'} 50%,
              ${isSelected ? '#152a42' : '#0a0d12'} 100%)`,
            transform: 'skewY(-20deg) skewX(-45deg)',
          }}
        >
          <div
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-sm"
            style={{
              width: `${6 * scale}px`,
              height: `${4 * scale}px`,
              background: tempColor,
              boxShadow: `0 0 ${10 * scale}px ${tempColor}`,
            }}
          />
        </div>

        {isSelected && (
          <div
            className="absolute rounded-full"
            style={{
              width: `${rackWidth * 1.5}px`,
              height: `${rackWidth * 0.5}px`,
              left: '50%',
              bottom: `${-10 * scale}px`,
              transform: 'translateX(-50%)',
              background: 'radial-gradient(ellipse at center, rgba(0, 180, 255, 0.3) 0%, transparent 70%)',
              animation: 'pulse 2s ease-in-out infinite',
            }}
          />
        )}

        <div
          className="absolute text-center font-mono font-bold text-white/90"
          style={{
            fontSize: `${10 * scale}px`,
            left: '50%',
            top: `${-20 * scale}px`,
            transform: 'translateX(-50%)',
            textShadow: '0 2px 4px rgba(0,0,0,0.9)',
            whiteSpace: 'nowrap',
          }}
        >
          {rack.name}
        </div>

        {isHovered && (
          <div
            className="absolute text-center space-y-0.5 bg-background/95 backdrop-blur-sm p-2 rounded-md border border-border/50"
            style={{
              left: '50%',
              top: `${-55 * scale}px`,
              transform: 'translateX(-50%)',
              whiteSpace: 'nowrap',
              zIndex: 1000,
              fontSize: `${10 * scale}px`,
            }}
          >
            <p className="font-mono" style={{ color: tempColor }}>
              {rack.exhaustTemp.toFixed(1)}°C
            </p>
            <p className="font-mono text-noc-cyan">
              {((rack.currentPowerDraw / rack.powerCapacity) * 100).toFixed(0)}% Power
            </p>
            <p className="font-mono text-muted-foreground">
              {rack.installedEquipment?.length || 0} devices
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export function IsometricDataCenter({ onSelectRack, selectedRackId, isUnlocked }: IsometricDataCenterProps) {
  const { racks } = useGame();
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredRack, setHoveredRack] = useState<string | null>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);

  const { data: equipmentCatalog = [] } = useQuery<Equipment[]>({
    queryKey: ["/api/equipment"],
  });

  const displayRacks = racks || [];
  
  const gridSize = Math.ceil(Math.sqrt(displayRacks.length));
  const isLargeDatacenter = displayRacks.length > 50;
  const scale = isLargeDatacenter ? 0.4 : 1;

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('[data-testid^="rack-3d"]')) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom((prev) => Math.max(0.2, Math.min(2, prev * delta)));
  };

  return (
    <div
      ref={containerRef}
      className="w-full h-full overflow-hidden cursor-move select-none"
      style={{
        background: 'radial-gradient(ellipse at center, #0a0a1a 0%, #050508 100%)',
        perspective: '1500px',
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
      data-testid="isometric-datacenter"
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0, 180, 255, 0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 180, 255, 0.02) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
          transform: 'rotateX(60deg) scale(2.5)',
          transformOrigin: 'center center',
        }}
      />

      <div
        className="relative w-full h-full"
        style={{
          transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
          transformOrigin: 'center center',
        }}
      >
        {displayRacks.map((rack, index) => {
          const col = rack.positionX ?? (index % gridSize);
          const row = rack.positionY ?? Math.floor(index / gridSize);
          
          return (
            <Isometric3DRack
              key={rack.id}
              rack={rack}
              position={{ x: col, z: row }}
              isSelected={selectedRackId === rack.id}
              isHovered={hoveredRack === rack.id}
              equipmentCatalog={equipmentCatalog}
              onHover={(hovered) => setHoveredRack(hovered ? rack.id : null)}
              onClick={() => onSelectRack(rack)}
              scale={scale}
            />
          );
        })}
      </div>

      <div className="absolute inset-x-0 bottom-0 h-24 pointer-events-none"
        style={{
          background: 'linear-gradient(to top, rgba(0, 180, 255, 0.03) 0%, transparent 100%)',
        }}
      />
      
      <div className="absolute inset-x-0 top-0 h-24 pointer-events-none"
        style={{
          background: 'linear-gradient(to bottom, rgba(0, 0, 0, 0.6) 0%, transparent 100%)',
        }}
      />

      <div className="absolute bottom-4 left-4 text-xs font-mono text-muted-foreground bg-background/50 backdrop-blur-sm px-2 py-1 rounded">
        {displayRacks.length} racks | Scroll to zoom | Drag to pan
      </div>
    </div>
  );
}
