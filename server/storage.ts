import { randomUUID } from "crypto";
import type {
  Rack,
  InsertRack,
  ServerConfig,
  InsertServerConfig,
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
  GameState,
} from "@shared/schema";

export interface IStorage {
  // Game State
  getGameState(): Promise<GameState>;
  updateGameState(state: Partial<GameState>): Promise<GameState>;

  // Racks
  getRacks(): Promise<Rack[]>;
  getRack(id: string): Promise<Rack | undefined>;
  createRack(rack: InsertRack): Promise<Rack>;
  updateRack(id: string, rack: Partial<Rack>): Promise<Rack | undefined>;
  deleteRack(id: string): Promise<boolean>;

  // Servers
  getServers(): Promise<ServerConfig[]>;
  getServer(id: string): Promise<ServerConfig | undefined>;
  createServer(server: InsertServerConfig): Promise<ServerConfig>;
  updateServer(id: string, server: Partial<ServerConfig>): Promise<ServerConfig | undefined>;

  // Alerts
  getAlerts(): Promise<Alert[]>;
  acknowledgeAlert(id: string): Promise<Alert | undefined>;
  createAlert(alert: Omit<Alert, "id">): Promise<Alert>;

  // Incidents
  getIncidents(): Promise<Incident[]>;
  getIncident(id: string): Promise<Incident | undefined>;
  updateIncidentStatus(id: string, status: Incident["status"]): Promise<Incident | undefined>;

  // Network
  getNetworkNodes(): Promise<NetworkNode[]>;
  getNetworkLinks(): Promise<NetworkLink[]>;

  // Metrics
  getFacilityMetrics(): Promise<FacilityMetrics>;

  // Inventory
  getInventory(): Promise<{
    cpus: CPU[];
    rams: RAM[];
    storage: Storage[];
    nics: NIC[];
    raidControllers: RAIDController[];
  }>;
}

// Initial data
const initialInventory = {
  cpus: [
    { id: "cpu-1", name: "Intel Xeon Gold 6348", cores: 28, threads: 56, baseClock: 2.6, boostClock: 3.5, tdp: 235, architecture: "x86" as const, socket: "LGA4189", price: 3100 },
    { id: "cpu-2", name: "Intel Xeon Platinum 8380", cores: 40, threads: 80, baseClock: 2.3, boostClock: 3.4, tdp: 270, architecture: "x86" as const, socket: "LGA4189", price: 8100 },
    { id: "cpu-3", name: "AMD EPYC 7763", cores: 64, threads: 128, baseClock: 2.45, boostClock: 3.5, tdp: 280, architecture: "x86" as const, socket: "SP3", price: 7890 },
    { id: "cpu-4", name: "Ampere Altra Q80-30", cores: 80, threads: 80, baseClock: 3.0, boostClock: 3.0, tdp: 250, architecture: "ARM" as const, socket: "LGA4926", price: 5500 },
  ],
  rams: [
    { id: "ram-1", name: "Samsung DDR4-3200 ECC 32GB", capacity: 32, speed: 3200, type: "DDR4" as const, ecc: true, channels: 1, price: 180 },
    { id: "ram-2", name: "Samsung DDR4-3200 ECC 64GB", capacity: 64, speed: 3200, type: "DDR4" as const, ecc: true, channels: 1, price: 350 },
    { id: "ram-3", name: "Samsung DDR5-4800 ECC 64GB", capacity: 64, speed: 4800, type: "DDR5" as const, ecc: true, channels: 1, price: 520 },
    { id: "ram-4", name: "SK Hynix DDR5-5600 ECC 128GB", capacity: 128, speed: 5600, type: "DDR5" as const, ecc: true, channels: 1, price: 980 },
  ],
  storage: [
    { id: "stor-1", name: "Seagate Exos 10TB SAS", capacity: 10000, type: "SAS_HDD" as const, iops: 200, readSpeed: 270, writeSpeed: 250, endurance: 2500000, price: 280 },
    { id: "stor-2", name: "Intel D7-P5520 3.84TB NVMe", capacity: 3840, type: "NVMe_U2" as const, iops: 800000, readSpeed: 5300, writeSpeed: 3000, endurance: 3, price: 890 },
    { id: "stor-3", name: "Samsung PM1733 7.68TB NVMe", capacity: 7680, type: "NVMe_U2" as const, iops: 1500000, readSpeed: 7000, writeSpeed: 3800, endurance: 1, price: 1650 },
    { id: "stor-4", name: "Samsung 980 PRO 2TB M.2", capacity: 2000, type: "NVMe_M2" as const, iops: 1000000, readSpeed: 7000, writeSpeed: 5100, endurance: 1200, price: 180 },
  ],
  nics: [
    { id: "nic-1", name: "Intel X710-DA2 10GbE", speed: 10, ports: 2, type: "SFP+" as const, pcieLanes: 8, price: 380 },
    { id: "nic-2", name: "Mellanox ConnectX-6 25GbE", speed: 25, ports: 2, type: "SFP28" as const, pcieLanes: 16, price: 650 },
    { id: "nic-3", name: "Mellanox ConnectX-6 100GbE", speed: 100, ports: 2, type: "QSFP28" as const, pcieLanes: 16, price: 1200 },
    { id: "nic-4", name: "Intel I350-T4 1GbE", speed: 1, ports: 4, type: "RJ45" as const, pcieLanes: 4, price: 180 },
  ],
  raidControllers: [
    { id: "raid-1", name: "Broadcom MegaRAID 9460-8i", ports: 8, cacheSize: 2048, batteryBackup: true, supportedLevels: ["0", "1", "5", "6", "10", "50", "60"], price: 520 },
    { id: "raid-2", name: "Broadcom MegaRAID 9560-16i", ports: 16, cacheSize: 8192, batteryBackup: true, supportedLevels: ["0", "1", "5", "6", "10", "50", "60"], price: 980 },
  ],
};

const initialMetrics: FacilityMetrics = {
  totalPower: 125000,
  itLoad: 98000,
  pue: 1.28,
  coolingCapacity: 150000,
  coolingLoad: 112000,
  uptime: 99.9847,
  activeAlerts: 7,
  criticalAlerts: 1,
  serverCount: 48,
  rackCount: 6,
  networkDevices: 24,
  storageCapacity: 2400000,
  storageUsed: 1680000,
};

const initialNetworkNodes: NetworkNode[] = [
  { id: "spine-1", name: "SPINE-01", type: "spine", ports: 64, usedPorts: 32, status: "online", throughput: 3200, packetLoss: 0, positionX: 200, positionY: 50 },
  { id: "spine-2", name: "SPINE-02", type: "spine", ports: 64, usedPorts: 32, status: "online", throughput: 3100, packetLoss: 0, positionX: 400, positionY: 50 },
  { id: "leaf-1", name: "LEAF-01", type: "leaf", ports: 48, usedPorts: 36, status: "online", throughput: 1800, packetLoss: 0.001, positionX: 100, positionY: 150 },
  { id: "leaf-2", name: "LEAF-02", type: "leaf", ports: 48, usedPorts: 42, status: "warning", throughput: 2100, packetLoss: 0.02, positionX: 250, positionY: 150 },
  { id: "leaf-3", name: "LEAF-03", type: "leaf", ports: 48, usedPorts: 38, status: "online", throughput: 1650, packetLoss: 0, positionX: 400, positionY: 150 },
  { id: "leaf-4", name: "LEAF-04", type: "leaf", ports: 48, usedPorts: 40, status: "online", throughput: 1900, packetLoss: 0, positionX: 550, positionY: 150 },
  { id: "tor-1", name: "ToR-R01", type: "tor", ports: 48, usedPorts: 24, status: "online", throughput: 450, packetLoss: 0, positionX: 50, positionY: 250 },
  { id: "tor-2", name: "ToR-R02", type: "tor", ports: 48, usedPorts: 28, status: "online", throughput: 520, packetLoss: 0, positionX: 150, positionY: 250 },
  { id: "tor-3", name: "ToR-R03", type: "tor", ports: 48, usedPorts: 32, status: "critical", throughput: 180, packetLoss: 2.1, positionX: 250, positionY: 250 },
  { id: "tor-4", name: "ToR-R04", type: "tor", ports: 48, usedPorts: 26, status: "online", throughput: 480, packetLoss: 0, positionX: 350, positionY: 250 },
  { id: "fw-1", name: "FW-CORE-01", type: "firewall", ports: 8, usedPorts: 6, status: "online", throughput: 8500, packetLoss: 0, positionX: 300, positionY: 350 },
  { id: "lb-1", name: "LB-PROD-01", type: "loadbalancer", ports: 8, usedPorts: 4, status: "online", throughput: 4200, packetLoss: 0, positionX: 450, positionY: 350 },
];

const initialNetworkLinks: NetworkLink[] = [
  { id: "link-1", sourceId: "spine-1", targetId: "leaf-1", bandwidth: 100, utilization: 45, latency: 0.1, status: "active" },
  { id: "link-2", sourceId: "spine-1", targetId: "leaf-2", bandwidth: 100, utilization: 72, latency: 0.1, status: "active" },
  { id: "link-3", sourceId: "spine-1", targetId: "leaf-3", bandwidth: 100, utilization: 38, latency: 0.1, status: "active" },
  { id: "link-4", sourceId: "spine-1", targetId: "leaf-4", bandwidth: 100, utilization: 52, latency: 0.1, status: "active" },
  { id: "link-5", sourceId: "spine-2", targetId: "leaf-1", bandwidth: 100, utilization: 43, latency: 0.1, status: "active" },
  { id: "link-6", sourceId: "spine-2", targetId: "leaf-2", bandwidth: 100, utilization: 68, latency: 0.15, status: "degraded" },
  { id: "link-7", sourceId: "spine-2", targetId: "leaf-3", bandwidth: 100, utilization: 35, latency: 0.1, status: "active" },
  { id: "link-8", sourceId: "spine-2", targetId: "leaf-4", bandwidth: 100, utilization: 48, latency: 0.1, status: "active" },
  { id: "link-9", sourceId: "leaf-1", targetId: "tor-1", bandwidth: 25, utilization: 60, latency: 0.05, status: "active" },
  { id: "link-10", sourceId: "leaf-1", targetId: "tor-2", bandwidth: 25, utilization: 75, latency: 0.05, status: "active" },
  { id: "link-11", sourceId: "leaf-2", targetId: "tor-3", bandwidth: 25, utilization: 95, latency: 2.5, status: "degraded" },
  { id: "link-12", sourceId: "leaf-3", targetId: "tor-4", bandwidth: 25, utilization: 55, latency: 0.05, status: "active" },
];

const initialAlerts: Alert[] = [
  { id: "alert-1", timestamp: new Date(Date.now() - 120000).toISOString(), severity: "critical", source: "ToR-R03", sourceType: "network", message: "High packet loss detected: 2.1% on uplink port 49", acknowledged: false },
  { id: "alert-2", timestamp: new Date(Date.now() - 300000).toISOString(), severity: "warning", source: "RACK-03", sourceType: "cooling", message: "Inlet temperature elevated: 28.5°C (threshold: 27°C)", acknowledged: false },
  { id: "alert-3", timestamp: new Date(Date.now() - 450000).toISOString(), severity: "warning", source: "SRV-R03-U12", sourceType: "server", message: "RAID rebuild in progress: 34% complete", acknowledged: true },
  { id: "alert-4", timestamp: new Date(Date.now() - 600000).toISOString(), severity: "info", source: "PDU-A-03", sourceType: "power", message: "Phase imbalance: L1=18.2A, L2=22.1A, L3=19.8A", acknowledged: true },
  { id: "alert-5", timestamp: new Date(Date.now() - 900000).toISOString(), severity: "warning", source: "LEAF-02", sourceType: "network", message: "Port channel degraded: 2/4 members active", acknowledged: false },
  { id: "alert-6", timestamp: new Date(Date.now() - 1200000).toISOString(), severity: "info", source: "SAN-01", sourceType: "storage", message: "Snapshot retention: 45 snapshots, 2.1TB consumed", acknowledged: true },
  { id: "alert-7", timestamp: new Date(Date.now() - 1800000).toISOString(), severity: "info", source: "CRAC-02", sourceType: "cooling", message: "Filter maintenance due in 14 days", acknowledged: true },
];

const initialIncidents: Incident[] = [
  {
    id: "inc-1",
    title: "Network connectivity issues - Rack 03",
    severity: "P2",
    status: "investigating",
    affectedSystems: ["ToR-R03", "LEAF-02", "SRV-R03-U08", "SRV-R03-U12"],
    createdAt: new Date(Date.now() - 180000).toISOString(),
    updatedAt: new Date(Date.now() - 60000).toISOString(),
    description: "Multiple servers in Rack 03 experiencing intermittent connectivity. ToR switch showing elevated packet loss on uplink.",
    timeline: [
      { timestamp: new Date(Date.now() - 180000).toISOString(), action: "Incident created from alert correlation", actor: "System" },
      { timestamp: new Date(Date.now() - 120000).toISOString(), action: "Acknowledged by NOC operator", actor: "Operator" },
      { timestamp: new Date(Date.now() - 60000).toISOString(), action: "Investigating ToR-R03 uplink ports", actor: "Operator" },
    ],
  },
];

const initialRacks: Rack[] = [
  {
    id: "rack-1",
    name: "RACK-01",
    type: "enclosed_42U",
    totalUs: 42,
    slots: Array.from({ length: 42 }, (_, i) => ({ uPosition: i + 1, serverId: null })),
    powerCapacity: 20000,
    currentPowerDraw: 14500,
    inletTemp: 22.3,
    exhaustTemp: 35.1,
    airflowRestriction: 12,
    positionX: 0,
    positionY: 0,
  },
  {
    id: "rack-2",
    name: "RACK-02",
    type: "enclosed_42U",
    totalUs: 42,
    slots: Array.from({ length: 42 }, (_, i) => ({ uPosition: i + 1, serverId: null })),
    powerCapacity: 20000,
    currentPowerDraw: 16200,
    inletTemp: 23.1,
    exhaustTemp: 36.8,
    airflowRestriction: 18,
    positionX: 1,
    positionY: 0,
  },
  {
    id: "rack-3",
    name: "RACK-03",
    type: "enclosed_42U",
    totalUs: 42,
    slots: Array.from({ length: 42 }, (_, i) => ({ uPosition: i + 1, serverId: null })),
    powerCapacity: 20000,
    currentPowerDraw: 17800,
    inletTemp: 28.5,
    exhaustTemp: 42.1,
    airflowRestriction: 35,
    positionX: 2,
    positionY: 0,
  },
];

const initialServers: ServerConfig[] = [
  {
    id: "srv-1",
    name: "SRV-R01-U01",
    chassisType: "2U",
    cpuSlots: 2,
    maxRam: 2048,
    driveBays: 24,
    pciSlots: 8,
    installedCpus: ["cpu-2", "cpu-2"],
    installedRam: ["ram-3", "ram-3", "ram-3", "ram-3", "ram-3", "ram-3", "ram-3", "ram-3"],
    installedStorage: ["stor-2", "stor-2", "stor-2", "stor-2"],
    installedNics: ["nic-2"],
    raidController: "raid-1",
    raidLevel: "10",
    powerDraw: 850,
    inletTemp: 22.1,
    exhaustTemp: 34.5,
    status: "online",
  },
];

const initialGameState: GameState = {
  currentMode: "noc",
  money: 500000,
  reputation: 75,
  tier: "tier2",
  contracts: [
    {
      id: "contract-1",
      name: "Enterprise VM Cluster",
      requirements: { vms: 20, iops: 100000, uptime: 99.99 },
      reward: 25000,
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      status: "active",
    },
  ],
};

export class MemStorage implements IStorage {
  private gameState: GameState;
  private racks: Map<string, Rack>;
  private servers: Map<string, ServerConfig>;
  private alerts: Map<string, Alert>;
  private incidents: Map<string, Incident>;
  private networkNodes: NetworkNode[];
  private networkLinks: NetworkLink[];
  private facilityMetrics: FacilityMetrics;
  private inventory: typeof initialInventory;

  constructor() {
    this.gameState = { ...initialGameState };
    this.racks = new Map(initialRacks.map((r) => [r.id, r]));
    this.servers = new Map(initialServers.map((s) => [s.id, s]));
    this.alerts = new Map(initialAlerts.map((a) => [a.id, a]));
    this.incidents = new Map(initialIncidents.map((i) => [i.id, i]));
    this.networkNodes = [...initialNetworkNodes];
    this.networkLinks = [...initialNetworkLinks];
    this.facilityMetrics = { ...initialMetrics };
    this.inventory = initialInventory;
  }

  // Game State
  async getGameState(): Promise<GameState> {
    return { ...this.gameState };
  }

  async updateGameState(state: Partial<GameState>): Promise<GameState> {
    this.gameState = { ...this.gameState, ...state };
    return { ...this.gameState };
  }

  // Racks
  async getRacks(): Promise<Rack[]> {
    return Array.from(this.racks.values());
  }

  async getRack(id: string): Promise<Rack | undefined> {
    return this.racks.get(id);
  }

  async createRack(rack: InsertRack): Promise<Rack> {
    const id = randomUUID();
    const newRack: Rack = { ...rack, id };
    this.racks.set(id, newRack);
    return newRack;
  }

  async updateRack(id: string, rack: Partial<Rack>): Promise<Rack | undefined> {
    const existing = this.racks.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...rack };
    this.racks.set(id, updated);
    return updated;
  }

  async deleteRack(id: string): Promise<boolean> {
    return this.racks.delete(id);
  }

  // Servers
  async getServers(): Promise<ServerConfig[]> {
    return Array.from(this.servers.values());
  }

  async getServer(id: string): Promise<ServerConfig | undefined> {
    return this.servers.get(id);
  }

  async createServer(server: InsertServerConfig): Promise<ServerConfig> {
    const id = randomUUID();
    const newServer: ServerConfig = { ...server, id };
    this.servers.set(id, newServer);
    return newServer;
  }

  async updateServer(id: string, server: Partial<ServerConfig>): Promise<ServerConfig | undefined> {
    const existing = this.servers.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...server };
    this.servers.set(id, updated);
    return updated;
  }

  // Alerts
  async getAlerts(): Promise<Alert[]> {
    return Array.from(this.alerts.values());
  }

  async acknowledgeAlert(id: string): Promise<Alert | undefined> {
    const existing = this.alerts.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, acknowledged: true };
    this.alerts.set(id, updated);
    return updated;
  }

  async createAlert(alert: Omit<Alert, "id">): Promise<Alert> {
    const id = randomUUID();
    const newAlert: Alert = { ...alert, id };
    this.alerts.set(id, newAlert);
    return newAlert;
  }

  // Incidents
  async getIncidents(): Promise<Incident[]> {
    return Array.from(this.incidents.values());
  }

  async getIncident(id: string): Promise<Incident | undefined> {
    return this.incidents.get(id);
  }

  async updateIncidentStatus(id: string, status: Incident["status"]): Promise<Incident | undefined> {
    const existing = this.incidents.get(id);
    if (!existing) return undefined;
    const updated: Incident = {
      ...existing,
      status,
      updatedAt: new Date().toISOString(),
      timeline: [
        ...existing.timeline,
        {
          timestamp: new Date().toISOString(),
          action: `Status changed to ${status}`,
          actor: "Operator",
        },
      ],
    };
    this.incidents.set(id, updated);
    return updated;
  }

  // Network
  async getNetworkNodes(): Promise<NetworkNode[]> {
    return [...this.networkNodes];
  }

  async getNetworkLinks(): Promise<NetworkLink[]> {
    return [...this.networkLinks];
  }

  // Metrics
  async getFacilityMetrics(): Promise<FacilityMetrics> {
    return { ...this.facilityMetrics };
  }

  // Inventory
  async getInventory(): Promise<typeof initialInventory> {
    return this.inventory;
  }
}

export const storage = new MemStorage();
