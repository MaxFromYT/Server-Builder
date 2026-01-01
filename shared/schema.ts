import { z } from "zod";

// ============ HARDWARE COMPONENTS ============

export const cpuSchema = z.object({
  id: z.string(),
  name: z.string(),
  cores: z.number(),
  threads: z.number(),
  baseClock: z.number(),
  boostClock: z.number(),
  tdp: z.number(),
  architecture: z.enum(["x86", "ARM"]),
  socket: z.string(),
  price: z.number(),
});
export type CPU = z.infer<typeof cpuSchema>;

export const ramSchema = z.object({
  id: z.string(),
  name: z.string(),
  capacity: z.number(),
  speed: z.number(),
  type: z.enum(["DDR4", "DDR5"]),
  ecc: z.boolean(),
  channels: z.number(),
  price: z.number(),
});
export type RAM = z.infer<typeof ramSchema>;

export const storageSchema = z.object({
  id: z.string(),
  name: z.string(),
  capacity: z.number(),
  type: z.enum(["SAS_HDD", "SATA_HDD", "NVMe_M2", "NVMe_U2"]),
  iops: z.number(),
  readSpeed: z.number(),
  writeSpeed: z.number(),
  endurance: z.number(),
  price: z.number(),
});
export type Storage = z.infer<typeof storageSchema>;

export const nicSchema = z.object({
  id: z.string(),
  name: z.string(),
  speed: z.number(),
  ports: z.number(),
  type: z.enum(["RJ45", "SFP+", "SFP28", "QSFP28"]),
  pcieLanes: z.number(),
  price: z.number(),
});
export type NIC = z.infer<typeof nicSchema>;

export const raidControllerSchema = z.object({
  id: z.string(),
  name: z.string(),
  ports: z.number(),
  cacheSize: z.number(),
  batteryBackup: z.boolean(),
  supportedLevels: z.array(z.string()),
  price: z.number(),
});
export type RAIDController = z.infer<typeof raidControllerSchema>;

// ============ SERVER CONFIGURATION ============

export const serverConfigSchema = z.object({
  id: z.string(),
  name: z.string(),
  chassisType: z.enum(["1U", "2U", "4U"]),
  cpuSlots: z.number(),
  maxRam: z.number(),
  driveBays: z.number(),
  pciSlots: z.number(),
  installedCpus: z.array(z.string()),
  installedRam: z.array(z.string()),
  installedStorage: z.array(z.string()),
  installedNics: z.array(z.string()),
  raidController: z.string().nullable(),
  raidLevel: z.string().nullable(),
  powerDraw: z.number(),
  inletTemp: z.number(),
  exhaustTemp: z.number(),
  status: z.enum(["online", "warning", "critical", "offline"]),
});
export type ServerConfig = z.infer<typeof serverConfigSchema>;

export const insertServerConfigSchema = serverConfigSchema.omit({ id: true });
export type InsertServerConfig = z.infer<typeof insertServerConfigSchema>;

// ============ RACK ============

export const rackSlotSchema = z.object({
  uPosition: z.number(),
  serverId: z.string().nullable(),
});
export type RackSlot = z.infer<typeof rackSlotSchema>;

export const rackSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(["open_2post", "open_4post", "enclosed_42U", "enclosed_48U", "liquid_cooled"]),
  totalUs: z.number(),
  slots: z.array(rackSlotSchema),
  powerCapacity: z.number(),
  currentPowerDraw: z.number(),
  inletTemp: z.number(),
  exhaustTemp: z.number(),
  airflowRestriction: z.number(),
  positionX: z.number(),
  positionY: z.number(),
});
export type Rack = z.infer<typeof rackSchema>;

export const insertRackSchema = rackSchema.omit({ id: true });
export type InsertRack = z.infer<typeof insertRackSchema>;

// ============ NETWORK ============

export const networkNodeSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(["spine", "leaf", "tor", "server", "storage", "firewall", "loadbalancer"]),
  ports: z.number(),
  usedPorts: z.number(),
  status: z.enum(["online", "warning", "critical", "offline"]),
  throughput: z.number(),
  packetLoss: z.number(),
  positionX: z.number(),
  positionY: z.number(),
});
export type NetworkNode = z.infer<typeof networkNodeSchema>;

export const networkLinkSchema = z.object({
  id: z.string(),
  sourceId: z.string(),
  targetId: z.string(),
  bandwidth: z.number(),
  utilization: z.number(),
  latency: z.number(),
  status: z.enum(["active", "degraded", "down"]),
});
export type NetworkLink = z.infer<typeof networkLinkSchema>;

export const vlanSchema = z.object({
  id: z.string(),
  vlanId: z.number(),
  name: z.string(),
  subnet: z.string(),
  gateway: z.string(),
  purpose: z.enum(["management", "storage", "tenant", "oob"]),
});
export type VLAN = z.infer<typeof vlanSchema>;

// ============ ALERTS & INCIDENTS ============

export const alertSchema = z.object({
  id: z.string(),
  timestamp: z.string(),
  severity: z.enum(["info", "warning", "critical"]),
  source: z.string(),
  sourceType: z.enum(["server", "network", "storage", "power", "cooling"]),
  message: z.string(),
  acknowledged: z.boolean(),
});
export type Alert = z.infer<typeof alertSchema>;

export const incidentSchema = z.object({
  id: z.string(),
  title: z.string(),
  severity: z.enum(["P1", "P2", "P3", "P4"]),
  status: z.enum(["open", "investigating", "mitigating", "resolved"]),
  affectedSystems: z.array(z.string()),
  createdAt: z.string(),
  updatedAt: z.string(),
  description: z.string(),
  timeline: z.array(z.object({
    timestamp: z.string(),
    action: z.string(),
    actor: z.string(),
  })),
});
export type Incident = z.infer<typeof incidentSchema>;

// ============ FACILITY METRICS ============

export const facilityMetricsSchema = z.object({
  totalPower: z.number(),
  itLoad: z.number(),
  pue: z.number(),
  coolingCapacity: z.number(),
  coolingLoad: z.number(),
  uptime: z.number(),
  activeAlerts: z.number(),
  criticalAlerts: z.number(),
  serverCount: z.number(),
  rackCount: z.number(),
  networkDevices: z.number(),
  storageCapacity: z.number(),
  storageUsed: z.number(),
});
export type FacilityMetrics = z.infer<typeof facilityMetricsSchema>;

// ============ GAME STATE ============

export const gameModeSchema = z.enum(["build", "floor", "network", "noc", "incident"]);
export type GameMode = z.infer<typeof gameModeSchema>;

export const gameStateSchema = z.object({
  currentMode: gameModeSchema,
  money: z.number(),
  reputation: z.number(),
  tier: z.enum(["garage", "tier1", "tier2", "tier3", "tier4"]),
  contracts: z.array(z.object({
    id: z.string(),
    name: z.string(),
    requirements: z.object({
      vms: z.number(),
      iops: z.number(),
      uptime: z.number(),
    }),
    reward: z.number(),
    deadline: z.string(),
    status: z.enum(["active", "completed", "failed"]),
  })),
});
export type GameState = z.infer<typeof gameStateSchema>;

// ============ LEGACY USER (keeping for compatibility) ============

export interface User {
  id: string;
  username: string;
  password: string;
}

export interface InsertUser {
  username: string;
  password: string;
}
