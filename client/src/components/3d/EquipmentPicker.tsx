import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { X, Server, HardDrive, Network, Cpu, Shield, Router, Plug, Cable } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Equipment, Rack } from "@shared/schema";

interface EquipmentPickerProps {
  rack: Rack;
  selectedSlot: number;
  onClose: () => void;
  onSuccess: () => void;
}

const categoryConfig: Record<string, { label: string; icon: typeof Server; types: string[] }> = {
  servers: {
    label: "Servers",
    icon: Server,
    types: ["server_1u", "server_2u", "server_4u"],
  },
  switches: {
    label: "Switches",
    icon: Network,
    types: ["switch_1u", "switch_2u"],
  },
  storage: {
    label: "Storage",
    icon: HardDrive,
    types: ["storage_2u", "storage_4u"],
  },
  network: {
    label: "Network",
    icon: Router,
    types: ["router_1u", "router_2u", "firewall_1u", "firewall_2u"],
  },
  power: {
    label: "Power",
    icon: Plug,
    types: ["pdu_1u", "ups_2u", "ups_4u"],
  },
  infrastructure: {
    label: "Infrastructure",
    icon: Cable,
    types: ["patch_panel_1u", "kvm_1u", "console_1u", "blank_1u", "cable_management_1u"],
  },
};

export function EquipmentPicker({ rack, selectedSlot, onClose, onSuccess }: EquipmentPickerProps) {
  const [selectedCategory, setSelectedCategory] = useState("servers");
  
  const { data: equipmentCatalog = [] } = useQuery<Equipment[]>({
    queryKey: ["/api/equipment"],
  });

  const addEquipmentMutation = useMutation({
    mutationFn: async ({ equipmentId, uStart }: { equipmentId: string; uStart: number }) => {
      const response = await apiRequest("POST", `/api/racks/${rack.id}/equipment`, {
        equipmentId,
        uStart,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/racks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/racks", rack.id] });
      onSuccess();
    },
  });

  const getAvailableEquipment = (category: string) => {
    const types = categoryConfig[category]?.types || [];
    return equipmentCatalog.filter((eq) => types.includes(eq.type));
  };

  const canFitEquipment = (equipment: Equipment) => {
    const endSlot = selectedSlot + equipment.uHeight - 1;
    if (endSlot > 42) return false;
    
    for (let u = selectedSlot; u <= endSlot; u++) {
      const slot = rack.slots.find((s) => s.uPosition === u);
      if (slot?.equipmentInstanceId) return false;
    }
    return true;
  };

  const handleAddEquipment = (equipment: Equipment) => {
    if (!canFitEquipment(equipment)) return;
    addEquipmentMutation.mutate({ equipmentId: equipment.id, uStart: selectedSlot });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <Card className="w-[600px] max-h-[80vh] flex flex-col bg-background/95 border-border">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div>
            <h2 className="font-display font-bold text-lg">Add Equipment</h2>
            <p className="text-sm text-muted-foreground">
              {rack.name} - Starting at U{selectedSlot}
            </p>
          </div>
          <Button size="icon" variant="ghost" onClick={onClose} data-testid="button-close-picker">
            <X className="w-5 h-5" />
          </Button>
        </div>

        <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="flex-1 flex flex-col">
          <div className="px-4 pt-2">
            <TabsList className="w-full grid grid-cols-6">
              {Object.entries(categoryConfig).map(([key, config]) => (
                <TabsTrigger key={key} value={key} className="text-xs gap-1">
                  <config.icon className="w-3 h-3" />
                  <span className="hidden sm:inline">{config.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <ScrollArea className="flex-1 p-4">
            {Object.entries(categoryConfig).map(([key, config]) => (
              <TabsContent key={key} value={key} className="mt-0 space-y-2">
                {getAvailableEquipment(key).map((equipment) => {
                  const canFit = canFitEquipment(equipment);
                  return (
                    <Card
                      key={equipment.id}
                      className={`p-3 cursor-pointer transition-all ${
                        canFit
                          ? "hover-elevate border-border"
                          : "opacity-50 cursor-not-allowed border-destructive/30"
                      }`}
                      onClick={() => canFit && handleAddEquipment(equipment)}
                      data-testid={`equipment-option-${equipment.id}`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <div
                              className="w-3 h-3 rounded-sm"
                              style={{ background: equipment.color }}
                            />
                            <span className="font-semibold text-sm">{equipment.name}</span>
                            <Badge variant="outline" className="text-xs">
                              {equipment.uHeight}U
                            </Badge>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {equipment.manufacturer} {equipment.model}
                          </div>
                          <div className="flex gap-4 mt-2 text-xs">
                            <span className="text-noc-yellow">
                              {equipment.powerDraw}W
                            </span>
                            <span className="text-noc-cyan">
                              {equipment.portCount} ports
                            </span>
                            <span className="text-noc-green">
                              ${equipment.price.toLocaleString()}
                            </span>
                          </div>
                        </div>
                        {!canFit && (
                          <Badge variant="destructive" className="text-xs">
                            No Space
                          </Badge>
                        )}
                      </div>
                    </Card>
                  );
                })}
                {getAvailableEquipment(key).length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No equipment available in this category
                  </div>
                )}
              </TabsContent>
            ))}
          </ScrollArea>
        </Tabs>

        {addEquipmentMutation.isPending && (
          <div className="p-4 border-t border-border bg-muted/30">
            <p className="text-sm text-center text-muted-foreground">Adding equipment...</p>
          </div>
        )}

        {addEquipmentMutation.isError && (
          <div className="p-4 border-t border-destructive/30 bg-destructive/10">
            <p className="text-sm text-center text-destructive">
              Failed to add equipment. Please try again.
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}
