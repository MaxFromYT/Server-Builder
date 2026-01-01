import type { Equipment } from "@shared/schema";

export type EquipmentCatalogItem = Equipment & {
  categories: string[];
  tags: string[];
  searchTokens: string[];
};

const CATEGORY_BY_TYPE: Record<string, string> = {
  server_1u: "servers",
  server_2u: "servers",
  server_4u: "servers",
  switch_1u: "switches",
  switch_2u: "switches",
  storage_2u: "storage",
  storage_4u: "storage",
  router_1u: "network",
  router_2u: "network",
  firewall_1u: "network",
  firewall_2u: "network",
  pdu_1u: "power",
  ups_2u: "power",
  ups_4u: "power",
  patch_panel_1u: "infrastructure",
  kvm_1u: "infrastructure",
  console_1u: "infrastructure",
  blank_1u: "infrastructure",
  cable_management_1u: "infrastructure",
};

const normalizeToken = (token: string) => token.trim().toLowerCase();

const uniqueList = (items: Array<string | null | undefined>) =>
  Array.from(new Set(items.filter(Boolean).map((item) => item!.trim()))).filter(Boolean);

const deriveTags = (equipment: Equipment) => {
  const tags: string[] = [];
  if (equipment.type.startsWith("server")) tags.push("compute");
  if (equipment.type.startsWith("switch")) tags.push("switching");
  if (equipment.type.startsWith("storage")) tags.push("storage");
  if (equipment.type.startsWith("router")) tags.push("routing");
  if (equipment.type.startsWith("firewall")) tags.push("security");
  if (equipment.type.startsWith("ups") || equipment.type.startsWith("pdu")) tags.push("power");
  if (equipment.type.includes("patch_panel")) tags.push("cabling");
  if (equipment.type.includes("blank")) tags.push("blank");
  if (equipment.type.includes("kvm")) tags.push("console");
  if (equipment.type.includes("cable_management")) tags.push("cable");
  tags.push(`${equipment.uHeight}u`);
  return tags;
};

export const enhanceEquipmentCatalogItem = (
  equipment: Equipment,
  options?: { categories?: string[]; tags?: string[] }
): EquipmentCatalogItem => {
  const categories = options?.categories?.length
    ? options.categories
    : [CATEGORY_BY_TYPE[equipment.type] ?? "misc"];
  const derivedTags = deriveTags(equipment);
  const tags = uniqueList([...(options?.tags ?? []), ...derivedTags]);
  const searchTokens = uniqueList([
    equipment.name,
    equipment.manufacturer,
    equipment.model,
    equipment.type,
    ...categories,
    ...tags,
  ]).map(normalizeToken);

  return {
    ...equipment,
    categories,
    tags,
    searchTokens,
  };
};

export const staticEquipmentCatalog: EquipmentCatalogItem[] = [
  enhanceEquipmentCatalogItem(
    {
      id: "eq-srv-1u-dell",
      name: "Dell PowerEdge R650",
      type: "server_1u",
      uHeight: 1,
      manufacturer: "Dell",
      model: "R650",
      powerDraw: 450,
      heatOutput: 1535,
      price: 8500,
      color: "#2a2a2a",
      ledColor: "#00ff00",
      hasFans: true,
      portCount: 4,
    },
    { categories: ["servers"], tags: ["enterprise", "rackmount"] }
  ),
  enhanceEquipmentCatalogItem(
    {
      id: "eq-srv-1u-hp",
      name: "HPE ProLiant DL360",
      type: "server_1u",
      uHeight: 1,
      manufacturer: "HPE",
      model: "DL360 Gen10+",
      powerDraw: 500,
      heatOutput: 1706,
      price: 9200,
      color: "#1a1a1a",
      ledColor: "#00ff00",
      hasFans: true,
      portCount: 4,
    },
    { categories: ["servers"], tags: ["enterprise", "rackmount"] }
  ),
  enhanceEquipmentCatalogItem(
    {
      id: "eq-srv-1u-supermicro",
      name: "Supermicro SYS-1029U",
      type: "server_1u",
      uHeight: 1,
      manufacturer: "Supermicro",
      model: "SYS-1029U",
      powerDraw: 400,
      heatOutput: 1365,
      price: 6800,
      color: "#333333",
      ledColor: "#00ff00",
      hasFans: true,
      portCount: 2,
    },
    { categories: ["servers"], tags: ["rackmount", "dense"] }
  ),
  enhanceEquipmentCatalogItem(
    {
      id: "eq-srv-2u-dell",
      name: "Dell PowerEdge R750",
      type: "server_2u",
      uHeight: 2,
      manufacturer: "Dell",
      model: "R750",
      powerDraw: 800,
      heatOutput: 2729,
      price: 15000,
      color: "#2a2a2a",
      ledColor: "#00ff00",
      hasFans: true,
      portCount: 8,
    },
    { categories: ["servers"], tags: ["enterprise", "rackmount"] }
  ),
  enhanceEquipmentCatalogItem(
    {
      id: "eq-srv-2u-hp",
      name: "HPE ProLiant DL380",
      type: "server_2u",
      uHeight: 2,
      manufacturer: "HPE",
      model: "DL380 Gen10+",
      powerDraw: 850,
      heatOutput: 2900,
      price: 16500,
      color: "#1a1a1a",
      ledColor: "#00ff00",
      hasFans: true,
      portCount: 8,
    },
    { categories: ["servers"], tags: ["enterprise", "rackmount"] }
  ),
  enhanceEquipmentCatalogItem(
    {
      id: "eq-srv-2u-lenovo",
      name: "Lenovo ThinkSystem SR650",
      type: "server_2u",
      uHeight: 2,
      manufacturer: "Lenovo",
      model: "SR650 V2",
      powerDraw: 750,
      heatOutput: 2558,
      price: 14200,
      color: "#222222",
      ledColor: "#00ff00",
      hasFans: true,
      portCount: 6,
    },
    { categories: ["servers"], tags: ["enterprise", "rackmount"] }
  ),
  enhanceEquipmentCatalogItem(
    {
      id: "eq-srv-4u-dell",
      name: "Dell PowerEdge R940xa",
      type: "server_4u",
      uHeight: 4,
      manufacturer: "Dell",
      model: "R940xa",
      powerDraw: 1600,
      heatOutput: 5458,
      price: 45000,
      color: "#2a2a2a",
      ledColor: "#00ff00",
      hasFans: true,
      portCount: 8,
    },
    { categories: ["servers"], tags: ["enterprise", "high-density"] }
  ),
  enhanceEquipmentCatalogItem(
    {
      id: "eq-srv-4u-hp",
      name: "HPE ProLiant DL580",
      type: "server_4u",
      uHeight: 4,
      manufacturer: "HPE",
      model: "DL580 Gen10",
      powerDraw: 1800,
      heatOutput: 6141,
      price: 52000,
      color: "#1a1a1a",
      ledColor: "#00ff00",
      hasFans: true,
      portCount: 8,
    },
    { categories: ["servers"], tags: ["enterprise", "high-density"] }
  ),
  enhanceEquipmentCatalogItem(
    {
      id: "eq-sw-1u-cisco",
      name: "Cisco Nexus 9336C",
      type: "switch_1u",
      uHeight: 1,
      manufacturer: "Cisco",
      model: "Nexus 9336C-FX2",
      powerDraw: 350,
      heatOutput: 1194,
      price: 22000,
      color: "#0d274d",
      ledColor: "#00ff00",
      hasFans: true,
      portCount: 36,
    },
    { categories: ["switches"], tags: ["datacenter", "leaf"] }
  ),
  enhanceEquipmentCatalogItem(
    {
      id: "eq-sw-1u-arista",
      name: "Arista 7050X3",
      type: "switch_1u",
      uHeight: 1,
      manufacturer: "Arista",
      model: "7050X3-48YC12",
      powerDraw: 320,
      heatOutput: 1092,
      price: 18500,
      color: "#1a365d",
      ledColor: "#00ff00",
      hasFans: true,
      portCount: 48,
    },
    { categories: ["switches"], tags: ["datacenter", "leaf"] }
  ),
  enhanceEquipmentCatalogItem(
    {
      id: "eq-sw-1u-juniper",
      name: "Juniper QFX5120",
      type: "switch_1u",
      uHeight: 1,
      manufacturer: "Juniper",
      model: "QFX5120-48Y",
      powerDraw: 280,
      heatOutput: 955,
      price: 16000,
      color: "#2d3748",
      ledColor: "#00ff00",
      hasFans: true,
      portCount: 48,
    },
    { categories: ["switches"], tags: ["datacenter", "leaf"] }
  ),
  enhanceEquipmentCatalogItem(
    {
      id: "eq-sw-2u-cisco",
      name: "Cisco Nexus 9504",
      type: "switch_2u",
      uHeight: 2,
      manufacturer: "Cisco",
      model: "Nexus 9504",
      powerDraw: 1200,
      heatOutput: 4094,
      price: 85000,
      color: "#0d274d",
      ledColor: "#00ff00",
      hasFans: true,
      portCount: 96,
    },
    { categories: ["switches"], tags: ["datacenter", "core"] }
  ),
  enhanceEquipmentCatalogItem(
    {
      id: "eq-stor-2u-netapp",
      name: "NetApp AFF A250",
      type: "storage_2u",
      uHeight: 2,
      manufacturer: "NetApp",
      model: "AFF A250",
      powerDraw: 600,
      heatOutput: 2047,
      price: 35000,
      color: "#1e3a5f",
      ledColor: "#0088ff",
      hasFans: true,
      portCount: 4,
    },
    { categories: ["storage"], tags: ["flash", "array"] }
  ),
  enhanceEquipmentCatalogItem(
    {
      id: "eq-stor-2u-dell",
      name: "Dell PowerStore 500T",
      type: "storage_2u",
      uHeight: 2,
      manufacturer: "Dell",
      model: "PowerStore 500T",
      powerDraw: 650,
      heatOutput: 2218,
      price: 42000,
      color: "#2a2a2a",
      ledColor: "#0088ff",
      hasFans: true,
      portCount: 8,
    },
    { categories: ["storage"], tags: ["flash", "array"] }
  ),
  enhanceEquipmentCatalogItem(
    {
      id: "eq-stor-4u-netapp",
      name: "NetApp AFF A800",
      type: "storage_4u",
      uHeight: 4,
      manufacturer: "NetApp",
      model: "AFF A800",
      powerDraw: 1400,
      heatOutput: 4777,
      price: 120000,
      color: "#1e3a5f",
      ledColor: "#0088ff",
      hasFans: true,
      portCount: 8,
    },
    { categories: ["storage"], tags: ["flash", "array", "high-performance"] }
  ),
  enhanceEquipmentCatalogItem(
    {
      id: "eq-stor-4u-pure",
      name: "Pure Storage FlashArray",
      type: "storage_4u",
      uHeight: 4,
      manufacturer: "Pure",
      model: "FlashArray//X90",
      powerDraw: 1200,
      heatOutput: 4094,
      price: 150000,
      color: "#ff6600",
      ledColor: "#ff6600",
      hasFans: true,
      portCount: 16,
    },
    { categories: ["storage"], tags: ["flash", "array", "high-performance"] }
  ),
  enhanceEquipmentCatalogItem(
    {
      id: "eq-pdu-1u",
      name: "APC Switched PDU",
      type: "pdu_1u",
      uHeight: 1,
      manufacturer: "APC",
      model: "AP8959",
      powerDraw: 0,
      heatOutput: 50,
      price: 2500,
      color: "#444444",
      ledColor: "#ffaa00",
      hasFans: false,
      portCount: 24,
    },
    { categories: ["power"], tags: ["distribution", "power"] }
  ),
  enhanceEquipmentCatalogItem(
    {
      id: "eq-patch-1u",
      name: "CAT6A Patch Panel",
      type: "patch_panel_1u",
      uHeight: 1,
      manufacturer: "Panduit",
      model: "CP48BLY",
      powerDraw: 0,
      heatOutput: 0,
      price: 450,
      color: "#333333",
      ledColor: null,
      hasFans: false,
      portCount: 48,
    },
    { categories: ["infrastructure"], tags: ["cabling", "connectivity"] }
  ),
  enhanceEquipmentCatalogItem(
    {
      id: "eq-ups-2u",
      name: "APC Smart-UPS 3000",
      type: "ups_2u",
      uHeight: 2,
      manufacturer: "APC",
      model: "SMT3000RM2U",
      powerDraw: 0,
      heatOutput: 200,
      price: 3200,
      color: "#1a1a1a",
      ledColor: "#00ff00",
      hasFans: true,
      portCount: 8,
    },
    { categories: ["power"], tags: ["battery", "backup"] }
  ),
  enhanceEquipmentCatalogItem(
    {
      id: "eq-ups-4u",
      name: "Eaton 9PX 6000",
      type: "ups_4u",
      uHeight: 4,
      manufacturer: "Eaton",
      model: "9PX6K",
      powerDraw: 0,
      heatOutput: 450,
      price: 8500,
      color: "#2d2d2d",
      ledColor: "#00ff00",
      hasFans: true,
      portCount: 12,
    },
    { categories: ["power"], tags: ["battery", "backup"] }
  ),
  enhanceEquipmentCatalogItem(
    {
      id: "eq-router-1u-cisco",
      name: "Cisco ASR 1001-X",
      type: "router_1u",
      uHeight: 1,
      manufacturer: "Cisco",
      model: "ASR 1001-X",
      powerDraw: 200,
      heatOutput: 682,
      price: 28000,
      color: "#0d274d",
      ledColor: "#00ff00",
      hasFans: true,
      portCount: 8,
    },
    { categories: ["network"], tags: ["edge", "routing"] }
  ),
  enhanceEquipmentCatalogItem(
    {
      id: "eq-router-2u-juniper",
      name: "Juniper MX204",
      type: "router_2u",
      uHeight: 2,
      manufacturer: "Juniper",
      model: "MX204",
      powerDraw: 450,
      heatOutput: 1535,
      price: 45000,
      color: "#2d3748",
      ledColor: "#00ff00",
      hasFans: true,
      portCount: 8,
    },
    { categories: ["network"], tags: ["edge", "routing"] }
  ),
  enhanceEquipmentCatalogItem(
    {
      id: "eq-fw-1u-paloalto",
      name: "Palo Alto PA-3260",
      type: "firewall_1u",
      uHeight: 1,
      manufacturer: "Palo Alto",
      model: "PA-3260",
      powerDraw: 300,
      heatOutput: 1023,
      price: 32000,
      color: "#cc3300",
      ledColor: "#00ff00",
      hasFans: true,
      portCount: 12,
    },
    { categories: ["network"], tags: ["security", "perimeter"] }
  ),
  enhanceEquipmentCatalogItem(
    {
      id: "eq-fw-2u-fortinet",
      name: "Fortinet FG-3700D",
      type: "firewall_2u",
      uHeight: 2,
      manufacturer: "Fortinet",
      model: "FortiGate 3700D",
      powerDraw: 550,
      heatOutput: 1877,
      price: 65000,
      color: "#cc0000",
      ledColor: "#00ff00",
      hasFans: true,
      portCount: 16,
    },
    { categories: ["network"], tags: ["security", "perimeter"] }
  ),
  enhanceEquipmentCatalogItem(
    {
      id: "eq-kvm-1u",
      name: "Raritan Dominion KX III",
      type: "kvm_1u",
      uHeight: 1,
      manufacturer: "Raritan",
      model: "DKX3-864",
      powerDraw: 50,
      heatOutput: 170,
      price: 4500,
      color: "#333333",
      ledColor: "#ffff00",
      hasFans: false,
      portCount: 64,
    },
    { categories: ["infrastructure"], tags: ["management", "console"] }
  ),
  enhanceEquipmentCatalogItem(
    {
      id: "eq-console-1u",
      name: "Opengear Console Server",
      type: "console_1u",
      uHeight: 1,
      manufacturer: "Opengear",
      model: "OM2248",
      powerDraw: 35,
      heatOutput: 119,
      price: 3800,
      color: "#1a1a1a",
      ledColor: "#00ff00",
      hasFans: false,
      portCount: 48,
    },
    { categories: ["infrastructure"], tags: ["management", "console"] }
  ),
  enhanceEquipmentCatalogItem(
    {
      id: "eq-blank-1u",
      name: "Blank Panel 1U",
      type: "blank_1u",
      uHeight: 1,
      manufacturer: "Generic",
      model: "BP-1U",
      powerDraw: 0,
      heatOutput: 0,
      price: 25,
      color: "#1a1a1a",
      ledColor: null,
      hasFans: false,
      portCount: 0,
    },
    { categories: ["infrastructure"], tags: ["airflow", "filler"] }
  ),
  enhanceEquipmentCatalogItem(
    {
      id: "eq-cable-1u",
      name: "Cable Management 1U",
      type: "cable_management_1u",
      uHeight: 1,
      manufacturer: "CyberPower",
      model: "CRA30001",
      powerDraw: 0,
      heatOutput: 0,
      price: 75,
      color: "#2a2a2a",
      ledColor: null,
      hasFans: false,
      portCount: 0,
    },
    { categories: ["infrastructure"], tags: ["cabling", "organization"] }
  ),
];
