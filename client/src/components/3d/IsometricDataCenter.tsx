import { useState, useRef, useEffect } from "react";
import { useGame } from "@/lib/game-context";
import type { Rack } from "@shared/schema";

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

function IsometricRack({ 
  rack, 
  position, 
  isSelected, 
  isHovered,
  onHover,
  onClick 
}: { 
  rack: Rack; 
  position: { x: number; z: number };
  isSelected: boolean;
  isHovered: boolean;
  onHover: (hovered: boolean) => void;
  onClick: () => void;
}) {
  const tempColor = getTemperatureColor(rack.exhaustTemp);
  const powerPercent = (rack.currentPowerDraw / rack.powerCapacity) * 100;
  const serverCount = Math.floor(powerPercent / 10);

  const isoX = (position.x - position.z) * 70;
  const isoY = (position.x + position.z) * 35;

  return (
    <div
      className="absolute cursor-pointer transition-all duration-300"
      style={{
        left: `calc(50% + ${isoX}px)`,
        top: `calc(50% + ${isoY}px)`,
        transform: `translateX(-50%) translateY(-50%) ${isHovered ? 'translateY(-8px)' : ''}`,
        zIndex: Math.floor((position.x + position.z) * 10),
      }}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
      onClick={onClick}
      data-testid={`rack-3d-${rack.id}`}
    >
      <div
        className={`relative transition-all duration-300 ${isSelected ? 'scale-105' : ''}`}
        style={{
          filter: isHovered ? 'brightness(1.2)' : 'brightness(1)',
        }}
      >
        <div
          className="absolute w-16 h-32"
          style={{
            background: `linear-gradient(to bottom, 
              ${isSelected ? '#1e3a5f' : '#0f1419'} 0%,
              ${isSelected ? '#1a2f4a' : '#0a0d12'} 100%)`,
            transform: 'skewY(-20deg)',
            transformOrigin: 'bottom',
            borderRadius: '4px 4px 0 0',
            boxShadow: isSelected 
              ? '0 0 20px rgba(0, 212, 255, 0.5), inset 0 0 30px rgba(0, 212, 255, 0.1)'
              : 'inset 0 0 20px rgba(0, 0, 0, 0.5)',
            border: isSelected ? '1px solid rgba(0, 212, 255, 0.5)' : '1px solid rgba(255, 255, 255, 0.05)',
          }}
        >
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-12 left-2"
              style={{
                height: '10px',
                bottom: `${i * 12 + 8}px`,
                background: i < serverCount 
                  ? 'linear-gradient(to right, #1a1a2e 0%, #252538 50%, #1a1a2e 100%)'
                  : 'linear-gradient(to right, #0d0d15 0%, #15151f 50%, #0d0d15 100%)',
                borderRadius: '2px',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)',
              }}
            >
              {i < serverCount && (
                <>
                  <div
                    className="absolute right-1 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full animate-pulse"
                    style={{
                      background: '#22c55e',
                      boxShadow: '0 0 6px #22c55e',
                      animationDelay: `${i * 0.1}s`,
                    }}
                  />
                  <div
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full"
                    style={{
                      background: '#3b82f6',
                      boxShadow: '0 0 4px #3b82f6',
                    }}
                  />
                </>
              )}
            </div>
          ))}
        </div>

        <div
          className="absolute w-4 h-32"
          style={{
            left: '64px',
            background: `linear-gradient(to bottom, 
              ${isSelected ? '#0f1f35' : '#080a0e'} 0%,
              ${isSelected ? '#0a1828' : '#050608'} 100%)`,
            transform: 'skewY(20deg)',
            transformOrigin: 'bottom',
            borderRadius: '0 4px 0 0',
          }}
        />

        <div
          className="absolute w-16 h-4"
          style={{
            top: '-12px',
            background: `linear-gradient(to right, 
              ${isSelected ? '#152a45' : '#0c0f14'} 0%,
              ${isSelected ? '#1a3552' : '#0e1218'} 50%,
              ${isSelected ? '#152a45' : '#0c0f14'} 100%)`,
            transform: 'skewY(-20deg) skewX(-45deg)',
          }}
        >
          <div
            className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-2 rounded-sm"
            style={{
              background: tempColor,
              boxShadow: `0 0 8px ${tempColor}`,
            }}
          />
        </div>

        {isSelected && (
          <div
            className="absolute w-20 h-20 rounded-full"
            style={{
              left: '50%',
              bottom: '-10px',
              transform: 'translateX(-50%) rotateX(60deg)',
              background: 'radial-gradient(circle, rgba(0, 212, 255, 0.3) 0%, transparent 70%)',
              animation: 'pulse 2s ease-in-out infinite',
            }}
          />
        )}

        <div
          className="absolute text-center font-mono text-xs font-bold text-white/90"
          style={{
            left: '50%',
            top: '-24px',
            transform: 'translateX(-50%)',
            textShadow: '0 2px 4px rgba(0,0,0,0.8)',
          }}
        >
          {rack.name}
        </div>

        {isHovered && (
          <div
            className="absolute text-center space-y-1 bg-background/95 backdrop-blur-sm p-2 rounded-md border border-border/50"
            style={{
              left: '50%',
              top: '-70px',
              transform: 'translateX(-50%)',
              whiteSpace: 'nowrap',
              zIndex: 1000,
            }}
          >
            <p className="font-mono text-xs" style={{ color: tempColor }}>
              {rack.exhaustTemp.toFixed(1)}°C
            </p>
            <p className="font-mono text-xs text-noc-cyan">
              {powerPercent.toFixed(0)}% Power
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

  const displayRacks = racks || [];
  const cols = 3;

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

  return (
    <div
      ref={containerRef}
      className="w-full h-full overflow-hidden cursor-move"
      style={{
        background: 'radial-gradient(ellipse at center, #0a0a1a 0%, #050508 100%)',
        perspective: '1000px',
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      data-testid="isometric-datacenter"
    >
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0, 212, 255, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 212, 255, 0.03) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
          transform: 'rotateX(60deg) scale(2)',
          transformOrigin: 'center center',
        }}
      />

      <div
        className="relative w-full h-full"
        style={{
          transform: `translate(${offset.x}px, ${offset.y}px)`,
        }}
      >
        {displayRacks.map((rack, index) => {
          const col = index % cols;
          const row = Math.floor(index / cols);
          
          return (
            <IsometricRack
              key={rack.id}
              rack={rack}
              position={{ x: col, z: row }}
              isSelected={selectedRackId === rack.id}
              isHovered={hoveredRack === rack.id}
              onHover={(hovered) => setHoveredRack(hovered ? rack.id : null)}
              onClick={() => onSelectRack(rack)}
            />
          );
        })}
      </div>

      <div className="absolute inset-x-0 bottom-0 h-32 pointer-events-none"
        style={{
          background: 'linear-gradient(to top, rgba(0, 212, 255, 0.05) 0%, transparent 100%)',
        }}
      />
      
      <div className="absolute inset-x-0 top-0 h-32 pointer-events-none"
        style={{
          background: 'linear-gradient(to bottom, rgba(0, 0, 0, 0.5) 0%, transparent 100%)',
        }}
      />
    </div>
  );
}
