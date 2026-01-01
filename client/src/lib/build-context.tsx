import { createContext, useContext, useMemo, useReducer } from "react";

export type BuildMode = "select" | "place" | "rotate" | "delete" | "duplicate";

interface BuildSnapshot {
  mode: BuildMode;
  selectedIds: string[];
}

interface BuildState {
  mode: BuildMode;
  selectedIds: string[];
  snapEnabled: boolean;
  multiSelectEnabled: boolean;
  clipboard: string[];
  history: BuildSnapshot[];
  historyIndex: number;
}

type BuildAction =
  | { type: "SET_MODE"; mode: BuildMode }
  | { type: "SELECT"; id: string }
  | { type: "CLEAR_SELECTION" }
  | { type: "TOGGLE_SNAP" }
  | { type: "TOGGLE_MULTI" }
  | { type: "COPY" }
  | { type: "PASTE" }
  | { type: "DUPLICATE" }
  | { type: "DELETE" }
  | { type: "UNDO" }
  | { type: "REDO" };

const initialSnapshot: BuildSnapshot = { mode: "select", selectedIds: [] };

const initialState: BuildState = {
  mode: "select",
  selectedIds: [],
  snapEnabled: true,
  multiSelectEnabled: false,
  clipboard: [],
  history: [initialSnapshot],
  historyIndex: 0,
};

const arraysEqual = (a: string[], b: string[]) =>
  a.length === b.length && a.every((value, index) => value === b[index]);

const recordSnapshot = (state: BuildState, nextSnapshot: BuildSnapshot): BuildState => {
  const currentSnapshot = state.history[state.historyIndex];
  if (
    currentSnapshot &&
    currentSnapshot.mode === nextSnapshot.mode &&
    arraysEqual(currentSnapshot.selectedIds, nextSnapshot.selectedIds)
  ) {
    return state;
  }
  const nextHistory = state.history.slice(0, state.historyIndex + 1).concat(nextSnapshot);
  return {
    ...state,
    mode: nextSnapshot.mode,
    selectedIds: nextSnapshot.selectedIds,
    history: nextHistory,
    historyIndex: nextHistory.length - 1,
  };
};

const reducer = (state: BuildState, action: BuildAction): BuildState => {
  switch (action.type) {
    case "SET_MODE":
      return recordSnapshot(state, { mode: action.mode, selectedIds: state.selectedIds });
    case "SELECT": {
      const nextSelection = state.multiSelectEnabled
        ? state.selectedIds.includes(action.id)
          ? state.selectedIds.filter((value) => value !== action.id)
          : [...state.selectedIds, action.id]
        : [action.id];
      return recordSnapshot(state, { mode: state.mode, selectedIds: nextSelection });
    }
    case "CLEAR_SELECTION":
      return recordSnapshot(state, { mode: state.mode, selectedIds: [] });
    case "TOGGLE_SNAP":
      return { ...state, snapEnabled: !state.snapEnabled };
    case "TOGGLE_MULTI":
      return { ...state, multiSelectEnabled: !state.multiSelectEnabled };
    case "COPY":
      return { ...state, clipboard: [...state.selectedIds] };
    case "PASTE": {
      if (state.clipboard.length === 0) return state;
      const nextSelection = Array.from(new Set([...state.selectedIds, ...state.clipboard]));
      return recordSnapshot(state, { mode: state.mode, selectedIds: nextSelection });
    }
    case "DUPLICATE":
      return { ...state, clipboard: [...state.selectedIds] };
    case "DELETE":
      return recordSnapshot(state, { mode: state.mode, selectedIds: [] });
    case "UNDO": {
      if (state.historyIndex === 0) return state;
      const nextIndex = state.historyIndex - 1;
      const snapshot = state.history[nextIndex];
      return {
        ...state,
        mode: snapshot.mode,
        selectedIds: snapshot.selectedIds,
        historyIndex: nextIndex,
      };
    }
    case "REDO": {
      if (state.historyIndex >= state.history.length - 1) return state;
      const nextIndex = state.historyIndex + 1;
      const snapshot = state.history[nextIndex];
      return {
        ...state,
        mode: snapshot.mode,
        selectedIds: snapshot.selectedIds,
        historyIndex: nextIndex,
      };
    }
    default:
      return state;
  }
};

interface BuildContextValue {
  mode: BuildMode;
  selectedIds: string[];
  snapEnabled: boolean;
  multiSelectEnabled: boolean;
  clipboard: string[];
  canUndo: boolean;
  canRedo: boolean;
  setMode: (mode: BuildMode) => void;
  selectRack: (id: string) => void;
  clearSelection: () => void;
  toggleSnap: () => void;
  toggleMultiSelect: () => void;
  copySelection: () => void;
  pasteSelection: () => void;
  duplicateSelection: () => void;
  deleteSelection: () => void;
  undo: () => void;
  redo: () => void;
}

const BuildContext = createContext<BuildContextValue | undefined>(undefined);

export function BuildProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const value = useMemo<BuildContextValue>(
    () => ({
      mode: state.mode,
      selectedIds: state.selectedIds,
      snapEnabled: state.snapEnabled,
      multiSelectEnabled: state.multiSelectEnabled,
      clipboard: state.clipboard,
      canUndo: state.historyIndex > 0,
      canRedo: state.historyIndex < state.history.length - 1,
      setMode: (mode) => dispatch({ type: "SET_MODE", mode }),
      selectRack: (id) => dispatch({ type: "SELECT", id }),
      clearSelection: () => dispatch({ type: "CLEAR_SELECTION" }),
      toggleSnap: () => dispatch({ type: "TOGGLE_SNAP" }),
      toggleMultiSelect: () => dispatch({ type: "TOGGLE_MULTI" }),
      copySelection: () => dispatch({ type: "COPY" }),
      pasteSelection: () => dispatch({ type: "PASTE" }),
      duplicateSelection: () => dispatch({ type: "DUPLICATE" }),
      deleteSelection: () => dispatch({ type: "DELETE" }),
      undo: () => dispatch({ type: "UNDO" }),
      redo: () => dispatch({ type: "REDO" }),
    }),
    [state]
  );

  return <BuildContext.Provider value={value}>{children}</BuildContext.Provider>;
}

export function useBuild() {
  const context = useContext(BuildContext);
  if (!context) {
    throw new Error("useBuild must be used within a BuildProvider");
  }
  return context;
}
