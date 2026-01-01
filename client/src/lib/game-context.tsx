import { createContext, useContext, useState, useCallback, useEffect, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { generateProceduralRacks } from "@/components/3d/ProceduralRacks";
import { staticEquipmentCatalog } from "@/lib/static-equipment";
import type { 
  GameMode, 
  GameState, 
  Rack, 
  ServerConfig, 
  Alert, 
  Incident,
  NetworkNode,
  NetworkLink,
  FacilityMetrics,
  CPU,
  RAM,
  Storage,
  NIC,
  RAIDController,
  Equipment
} from "@shared/schema";

interface GameContextType {
  isLoading: boolean;
  isStaticMode: boolean;
  gameState: GameState;
  setGameMode: (mode: GameMode) => void;
  
  racks: Rack[];
  servers: ServerConfig[];
  alerts: Alert[];
  incidents: Incident[];
  networkNodes: NetworkNode[];
  networkLinks: NetworkLink[];
  facilityMetrics: FacilityMetrics;
  equipmentCatalog: Equipment[];
  
  inventory: {
    cpus: CPU[];
    rams: RAM[];
    storage: Storage[];
    nics: NIC[];
    raidControllers: RAIDController[];
  };
  
  selectedRackId: string | null;
  setSelectedRackId: (id: string | null) => void;
  selectedServerId: string | null;
  setSelectedServerId: (id: string | null) => void;
  
  acknowledgeAlert: (id: string) => void;
  updateIncidentStatus: (id: string, status: Incident["status"]) => void;
  
  generateMaxedDatacenter: () => Promise<void>;
  isGeneratingMaxed: boolean;
  refetchRacks: () => void;
  addEquipmentToRack: (rackId: string, equipmentId: string, uStart: number) => boolean;
  removeEquipmentFromRack: (rackId: string, equipmentInstanceId: string) => boolean;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

interface InitData {
  gameState: GameState;
  racks: Rack[];
  servers: ServerConfig[];
  alerts: Alert[];
  incidents: Incident[];
  networkNodes: NetworkNode[];
  networkLinks: NetworkLink[];
  facilityMetrics: FacilityMetrics;
  inventory: {
    cpus: CPU[];
    rams: RAM[];
    storage: Storage[];
    nics: NIC[];
    raidControllers: RAIDController[];
  };
}

const defaultGameState: GameState = {
  currentMode: "noc",
  money: 0,
  reputation: 0,
  tier: "garage",
  contracts: [],
};

const defaultMetrics: FacilityMetrics = {
  totalPower: 0,
  itLoad: 0,
  pue: 1,
  coolingCapacity: 0,
  coolingLoad: 0,
  uptime: 0,
  activeAlerts: 0,
  criticalAlerts: 0,
  serverCount: 0,
  rackCount: 0,
  networkDevices: 0,
  storageCapacity: 0,
  storageUsed: 0,
};

const defaultInventory = {
  cpus: [],
  rams: [],
  storage: [],
  nics: [],
  raidControllers: [],
};

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [selectedRackId, setSelectedRackId] = useState<string | null>(null);
  const [selectedServerId, setSelectedServerId] = useState<string | null>(null);
  const useStaticData = true;
  const staticRacks = useMemo(
    () =>
      generateProceduralRacks(500, staticEquipmentCatalog, {
        seed: 42,
        fillRateMultiplier: 2,
        errorRate: 1,
        tempBase: 20,
        dense: true,
      }),
    []
  );
  const [staticRacksState, setStaticRacksState] = useState<Rack[]>(staticRacks);

  // Fetch initial game data
  const { data, isLoading, refetch: refetchInit } = useQuery<InitData>({
    queryKey: ["/api/init"],
    staleTime: 30000,
    enabled: !useStaticData,
  });

  // Separate racks query for more granular updates
  const { data: racksData, refetch: refetchRacksQuery } = useQuery<Rack[]>({
    queryKey: ["/api/racks"],
    staleTime: 5000,
    enabled: !useStaticData,
  });

  // Equipment catalog query
  const { data: equipmentData } = useQuery<Equipment[]>({
    queryKey: ["/api/equipment"],
    staleTime: 60000,
    enabled: !useStaticData,
  });

  const refetchRacks = useCallback(() => {
    refetchRacksQuery();
    refetchInit();
  }, [refetchRacksQuery, refetchInit]);

  // Generate maxed datacenter
  const [isGeneratingMaxed, setIsGeneratingMaxed] = useState(false);
  
  const generateMaxedDatacenter = useCallback(async () => {
    if (useStaticData) {
      return;
    }
    setIsGeneratingMaxed(true);
    try {
      await apiRequest("POST", "/api/datacenter/generate-maxed", {});
      await refetchRacks();
    } finally {
      setIsGeneratingMaxed(false);
    }
  }, [refetchRacks]);

  // Local game mode state for immediate UI updates
  const [localGameMode, setLocalGameMode] = useState<GameMode>("noc");

  // Sync local state when data loads
  useEffect(() => {
    if (data?.gameState?.currentMode) {
      setLocalGameMode(data.gameState.currentMode);
    }
  }, [data?.gameState?.currentMode]);

  // Update game mode mutation
  const gameModeMutation = useMutation({
    mutationFn: async (mode: GameMode) => {
      const result = await apiRequest("PATCH", "/api/game-state", { currentMode: mode });
      return result.json();
    },
    onMutate: async (newMode) => {
      // Optimistic update
      setLocalGameMode(newMode);
    },
    onError: (_error, _newMode, _context) => {
      // Revert on error
      if (data?.gameState?.currentMode) {
        setLocalGameMode(data.gameState.currentMode);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/init"] });
    },
  });

  const setGameMode = useCallback((mode: GameMode) => {
    gameModeMutation.mutate(mode);
  }, [gameModeMutation]);

  // Acknowledge alert mutation
  const acknowledgeAlertMutation = useMutation({
    mutationFn: async (id: string) => {
      const result = await apiRequest("PATCH", `/api/alerts/${id}/acknowledge`, {});
      return result.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/init"] });
    },
  });

  const acknowledgeAlert = useCallback((id: string) => {
    acknowledgeAlertMutation.mutate(id);
  }, [acknowledgeAlertMutation]);

  // Update incident status mutation
  const updateIncidentMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: Incident["status"] }) => {
      const result = await apiRequest("PATCH", `/api/incidents/${id}/status`, { status });
      return result.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/init"] });
    },
  });

  const updateIncidentStatus = useCallback((id: string, status: Incident["status"]) => {
    updateIncidentMutation.mutate({ id, status });
  }, [updateIncidentMutation]);

  const addEquipmentToRack = useCallback(
    (rackId: string, equipmentId: string, uStart: number) => {
      if (!useStaticData) return false;
      const equipment = staticEquipmentCatalog.find((item) => item.id === equipmentId);
      if (!equipment) return false;
      const uEnd = uStart + equipment.uHeight - 1;
      let didAdd = false;
      setStaticRacksState((prev) =>
        prev.map((rack) => {
          if (rack.id !== rackId) return rack;
          if (uEnd > rack.totalUs) return rack;
          const isOccupied = rack.slots.some(
            (slot) =>
              slot.uPosition >= uStart &&
              slot.uPosition <= uEnd &&
              slot.equipmentInstanceId
          );
          if (isOccupied) return rack;
          didAdd = true;
          const instanceId = `inst-${equipment.id}-${uStart}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
          const updatedSlots = rack.slots.map((slot) =>
            slot.uPosition >= uStart && slot.uPosition <= uEnd
              ? { ...slot, equipmentInstanceId: instanceId }
              : slot
          );
          return {
            ...rack,
            slots: updatedSlots,
            installedEquipment: [
              ...rack.installedEquipment,
              {
                id: instanceId,
                equipmentId: equipment.id,
                uStart,
                uEnd,
                status: "online",
                cpuLoad: Math.random() * 80 + 10,
                memoryUsage: Math.random() * 70 + 20,
                networkActivity: Math.random() * 90 + 5,
              },
            ],
            currentPowerDraw: rack.currentPowerDraw + equipment.powerDraw,
          };
        })
      );
      return didAdd;
    },
    [useStaticData]
  );

  const removeEquipmentFromRack = useCallback(
    (rackId: string, equipmentInstanceId: string) => {
      if (!useStaticData) return false;
      const equipmentById = new Map(staticEquipmentCatalog.map((item) => [item.id, item]));
      let didRemove = false;
      setStaticRacksState((prev) =>
        prev.map((rack) => {
          if (rack.id !== rackId) return rack;
          const installed = rack.installedEquipment.find((item) => item.id === equipmentInstanceId);
          if (!installed) return rack;
          didRemove = true;
          const equipment = equipmentById.get(installed.equipmentId);
          const updatedSlots = rack.slots.map((slot) =>
            slot.equipmentInstanceId === equipmentInstanceId
              ? { ...slot, equipmentInstanceId: null }
              : slot
          );
          return {
            ...rack,
            slots: updatedSlots,
            installedEquipment: rack.installedEquipment.filter(
              (item) => item.id !== equipmentInstanceId
            ),
            currentPowerDraw: Math.max(
              0,
              rack.currentPowerDraw - (equipment?.powerDraw ?? 0)
            ),
          };
        })
      );
      return didRemove;
    },
    [useStaticData]
  );

  const contextValue: GameContextType = {
    isLoading,
    isStaticMode: useStaticData,
    gameState: {
      ...(data?.gameState ?? defaultGameState),
      currentMode: localGameMode,
    },
    setGameMode,
    racks: useStaticData ? staticRacksState : racksData ?? data?.racks ?? [],
    servers: data?.servers ?? [],
    alerts: data?.alerts ?? [],
    incidents: data?.incidents ?? [],
    networkNodes: data?.networkNodes ?? [],
    networkLinks: data?.networkLinks ?? [],
    facilityMetrics: data?.facilityMetrics ?? defaultMetrics,
    equipmentCatalog: useStaticData ? staticEquipmentCatalog : equipmentData ?? [],
    inventory: data?.inventory ?? defaultInventory,
    selectedRackId,
    setSelectedRackId,
    selectedServerId,
    setSelectedServerId,
    acknowledgeAlert,
    updateIncidentStatus,
    generateMaxedDatacenter,
    isGeneratingMaxed,
    refetchRacks,
    addEquipmentToRack,
    removeEquipmentFromRack,
  };

  return (
    <GameContext.Provider value={contextValue}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error("useGame must be used within a GameProvider");
  }
  return context;
}
