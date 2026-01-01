import type { Rack } from "@shared/schema";

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
  return safeParse<SaveSlot[]>(localStorage.getItem(SAVE_SLOTS_KEY), []);
};

export const saveSlot = (id: string, racks: Rack[], label?: string): SaveSlot => {
  if (typeof window === "undefined") {
    return { id, label: label ?? id, savedAt: Date.now(), racks };
  }
  const slots = loadSaveSlots();
  const savedAt = Date.now();
  const nextSlot: SaveSlot = {
    id,
    label: label ?? id,
    savedAt,
    racks,
  };
  const nextSlots = [
    nextSlot,
    ...slots.filter((slot) => slot.id !== id),
  ];
  localStorage.setItem(SAVE_SLOTS_KEY, JSON.stringify(nextSlots));
  return nextSlot;
};

export const loadSlot = (id: string): SaveSlot | null => {
  const slots = loadSaveSlots();
  return slots.find((slot) => slot.id === id) ?? null;
};

export const deleteSlot = (id: string) => {
  if (typeof window === "undefined") return;
  const slots = loadSaveSlots().filter((slot) => slot.id !== id);
  localStorage.setItem(SAVE_SLOTS_KEY, JSON.stringify(slots));
};

export const loadAutosaveSnapshots = (): AutosaveSnapshot[] => {
  if (typeof window === "undefined") return [];
  return safeParse<AutosaveSnapshot[]>(
    localStorage.getItem(AUTOSAVE_KEY),
    []
  );
};

export const addAutosaveSnapshot = (racks: Rack[]): AutosaveSnapshot[] => {
  if (typeof window === "undefined") return [];
  const snapshots = loadAutosaveSnapshots();
  const next: AutosaveSnapshot = {
    id: getSnapshotId(),
    savedAt: Date.now(),
    racks,
  };
  const nextSnapshots = [next, ...snapshots].slice(0, MAX_AUTOSAVES);
  localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(nextSnapshots));
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
