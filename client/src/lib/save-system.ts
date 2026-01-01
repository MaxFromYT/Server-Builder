import { rackSchema, type Rack } from "@shared/schema";
import { logError, logWarning } from "@/lib/error-log";

export interface SaveSlot {
  id: string;
  label: string;
  savedAt: number;
  racks: Rack[];
}

export interface AutosaveSnapshot {
  id: string;
  savedAt: number;
  racks: Rack[];
}

const SAVE_SLOTS_KEY = "hyperscale-save-slots";
const AUTOSAVE_KEY = "hyperscale-autosave-snapshots";
const MAX_AUTOSAVES = 5;

const cloneRacks = (racks: Rack[]) => {
  try {
    return structuredClone(racks);
  } catch {
    return JSON.parse(JSON.stringify(racks)) as Rack[];
  }
};

const normalizeRack = (rack: Rack): Rack => {
  const totalUs = Number.isFinite(rack.totalUs) && rack.totalUs > 0 ? rack.totalUs : 42;
  const installed = rack.installedEquipment.filter((item) => {
    const validRange = item.uStart >= 1 && item.uEnd <= totalUs && item.uStart <= item.uEnd;
    return Boolean(item.id && item.equipmentId && validRange);
  });
  const installedIds = new Set(installed.map((item) => item.id));
  const slots = Array.from({ length: totalUs }).map((_, index) => {
    const position = index + 1;
    const existing = rack.slots.find((slot) => slot.uPosition === position);
    const equipmentInstanceId =
      existing?.equipmentInstanceId && installedIds.has(existing.equipmentInstanceId)
        ? existing.equipmentInstanceId
        : null;
    return { uPosition: position, equipmentInstanceId };
  });

  return {
    ...rack,
    totalUs,
    slots,
    installedEquipment: installed,
    currentPowerDraw: Math.max(0, rack.currentPowerDraw),
    inletTemp: Number.isFinite(rack.inletTemp) ? rack.inletTemp : 22,
    exhaustTemp: Number.isFinite(rack.exhaustTemp) ? rack.exhaustTemp : 24,
    airflowRestriction: Math.max(0, rack.airflowRestriction),
    positionX: Number.isFinite(rack.positionX) ? rack.positionX : 0,
    positionY: Number.isFinite(rack.positionY) ? rack.positionY : 0,
  };
};

export const sanitizeRacks = (value: unknown): Rack[] => {
  if (!Array.isArray(value)) return [];
  const sanitized: Rack[] = [];
  value.forEach((entry, index) => {
    const parsed = rackSchema.safeParse(entry);
    if (!parsed.success) {
      logWarning("Invalid rack data skipped during load.", parsed.error, { index });
      return;
    }
    sanitized.push(normalizeRack(parsed.data));
  });
  return sanitized;
};

const safeParse = <T,>(value: string | null, fallback: T): T => {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
};

const getSnapshotId = () =>
  `snap-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export const loadSaveSlots = (): SaveSlot[] => {
  if (typeof window === "undefined") return [];
  const raw = safeParse<SaveSlot[]>(localStorage.getItem(SAVE_SLOTS_KEY), []);
  return raw
    .map((slot) => ({ ...slot, racks: sanitizeRacks(slot.racks) }))
    .filter((slot) => slot.racks.length > 0 || slot.racks.length === 0);
};

export const saveSlot = (id: string, racks: Rack[], label?: string): SaveSlot => {
  if (typeof window === "undefined") {
    return { id, label: label ?? id, savedAt: Date.now(), racks: cloneRacks(racks) };
  }
  const slots = loadSaveSlots();
  const savedAt = Date.now();
  const nextSlot: SaveSlot = {
    id,
    label: label ?? id,
    savedAt,
    racks: cloneRacks(sanitizeRacks(racks)),
  };
  const nextSlots = [
    nextSlot,
    ...slots.filter((slot) => slot.id !== id),
  ];
  try {
    localStorage.setItem(SAVE_SLOTS_KEY, JSON.stringify(nextSlots));
  } catch (error) {
    logError("Failed to persist save slot.", error);
  }
  return nextSlot;
};

export const loadSlot = (id: string): SaveSlot | null => {
  const slots = loadSaveSlots();
  return slots.find((slot) => slot.id === id) ?? null;
};

export const deleteSlot = (id: string) => {
  if (typeof window === "undefined") return;
  const slots = loadSaveSlots().filter((slot) => slot.id !== id);
  try {
    localStorage.setItem(SAVE_SLOTS_KEY, JSON.stringify(slots));
  } catch (error) {
    logError("Failed to delete save slot.", error);
  }
};

export const loadAutosaveSnapshots = (): AutosaveSnapshot[] => {
  if (typeof window === "undefined") return [];
  const snapshots = safeParse<AutosaveSnapshot[]>(
    localStorage.getItem(AUTOSAVE_KEY),
    []
  );
  return snapshots
    .map((snapshot) => ({ ...snapshot, racks: sanitizeRacks(snapshot.racks) }))
    .filter((snapshot) => snapshot.racks.length > 0 || snapshot.racks.length === 0);
};

export const addAutosaveSnapshot = (racks: Rack[]): AutosaveSnapshot[] => {
  if (typeof window === "undefined") return [];
  const snapshots = loadAutosaveSnapshots();
  const next: AutosaveSnapshot = {
    id: getSnapshotId(),
    savedAt: Date.now(),
    racks: cloneRacks(sanitizeRacks(racks)),
  };
  const nextSnapshots = [next, ...snapshots].slice(0, MAX_AUTOSAVES);
  try {
    localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(nextSnapshots));
  } catch (error) {
    logError("Failed to persist autosave snapshot.", error);
  }
  return nextSnapshots;
};

export const rollbackAutosaveSnapshot = (): AutosaveSnapshot | null => {
  if (typeof window === "undefined") return null;
  const snapshots = loadAutosaveSnapshots();
  if (snapshots.length < 2) {
    return snapshots[0] ?? null;
  }
  const [, ...rest] = snapshots;
  localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(rest));
  return rest[0] ?? null;
};
