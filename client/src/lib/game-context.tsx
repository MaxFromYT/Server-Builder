import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
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
  RAIDController
} from "@shared/schema";

interface GameContextType {
  isLoading: boolean;
  gameState: GameState;
  setGameMode: (mode: GameMode) => void;
  
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
  
  selectedRackId: string | null;
  setSelectedRackId: (id: string | null) => void;
  selectedServerId: string | null;
  setSelectedServerId: (id: string | null) => void;
  
  acknowledgeAlert: (id: string) => void;
  updateIncidentStatus: (id: string, status: Incident["status"]) => void;
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

  // Fetch initial game data
  const { data, isLoading } = useQuery<InitData>({
    queryKey: ["/api/init"],
    staleTime: 30000,
  });

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

  const contextValue: GameContextType = {
    isLoading,
    gameState: {
      ...(data?.gameState ?? defaultGameState),
      currentMode: localGameMode,
    },
    setGameMode,
    racks: data?.racks ?? [],
    servers: data?.servers ?? [],
    alerts: data?.alerts ?? [],
    incidents: data?.incidents ?? [],
    networkNodes: data?.networkNodes ?? [],
    networkLinks: data?.networkLinks ?? [],
    facilityMetrics: data?.facilityMetrics ?? defaultMetrics,
    inventory: data?.inventory ?? defaultInventory,
    selectedRackId,
    setSelectedRackId,
    selectedServerId,
    setSelectedServerId,
    acknowledgeAlert,
    updateIncidentStatus,
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
