import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type GraphicsQuality = "low" | "balanced" | "ultra";

export interface SettingsState {
  graphicsQuality: GraphicsQuality;
  uiScale: number;
  invertYAxis: boolean;
  mouseSensitivity: number;
  highContrast: boolean;
}

interface SettingsContextValue extends SettingsState {
  setGraphicsQuality: (quality: GraphicsQuality) => void;
  setUiScale: (scale: number) => void;
  setInvertYAxis: (value: boolean) => void;
  setMouseSensitivity: (value: number) => void;
  setHighContrast: (value: boolean) => void;
  resetSettings: () => void;
}

const defaultSettings: SettingsState = {
  graphicsQuality: "balanced",
  uiScale: 1,
  invertYAxis: false,
  mouseSensitivity: 1,
  highContrast: false,
};

const SettingsContext = createContext<SettingsContextValue | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<SettingsState>(() => {
    if (typeof window === "undefined") return defaultSettings;
    const saved = window.localStorage.getItem("hyperscale_settings");
    if (!saved) return defaultSettings;
    try {
      const parsed = JSON.parse(saved) as Partial<SettingsState>;
      return { ...defaultSettings, ...parsed };
    } catch {
      return defaultSettings;
    }
  });

  useEffect(() => {
    window.localStorage.setItem("hyperscale_settings", JSON.stringify(settings));
  }, [settings]);

  const value = useMemo<SettingsContextValue>(
    () => ({
      ...settings,
      setGraphicsQuality: (graphicsQuality) =>
        setSettings((prev) => ({ ...prev, graphicsQuality })),
      setUiScale: (uiScale) => setSettings((prev) => ({ ...prev, uiScale })),
      setInvertYAxis: (invertYAxis) =>
        setSettings((prev) => ({ ...prev, invertYAxis })),
      setMouseSensitivity: (mouseSensitivity) =>
        setSettings((prev) => ({ ...prev, mouseSensitivity })),
      setHighContrast: (highContrast) =>
        setSettings((prev) => ({ ...prev, highContrast })),
      resetSettings: () => setSettings(defaultSettings),
    }),
    [settings]
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
}
