import { createContext, useContext, useEffect, useMemo, useState } from "react";

type Theme = "dark" | "light";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  fontScale: number;
  setFontScale: (scale: number) => void;
  highContrast: boolean;
  toggleHighContrast: () => void;
}

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
  fontScaleKey?: string;
  highContrastKey?: string;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

/*
  Storage is reached through these two rather than directly.

  A browser set to block site data does not hand back null, it throws
  SecurityError on the property access itself. This provider wraps the whole
  app and reads three keys during its first render, so one unguarded throw
  took the entire site to a blank page: React had already replaced the
  prerendered HTML by the time the error reached the root, and there is no
  boundary above this to catch it. The content was legible until the moment
  the app booted, and then it was gone.

  Every other store here already wraps its access, five of them with a
  comment saying why. This one did not.
*/
function readStored(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStored(key: string, value: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* The preference holds for this page view and is not remembered. */
  }
}

export function ThemeProvider({
  children,
  defaultTheme = "dark",
  storageKey = "hyperscale-theme",
  fontScaleKey = "hyperscale-font-scale",
  highContrastKey = "hyperscale-high-contrast",
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(
    () => (readStored(storageKey) as Theme) || defaultTheme,
  );
  const [fontScale, setFontScaleState] = useState<number>(() => {
    const stored = readStored(fontScaleKey);
    const parsed = stored ? Number.parseFloat(stored) : NaN;
    return Number.isNaN(parsed) ? 1 : parsed;
  });
  const [highContrast, setHighContrast] = useState<boolean>(
    () => readStored(highContrastKey) === "true",
  );

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
    root.classList.toggle("high-contrast", highContrast);
    root.style.setProperty("--font-scale", `${fontScale}`);
    writeStored(storageKey, theme);
    writeStored(fontScaleKey, `${fontScale}`);
    writeStored(highContrastKey, String(highContrast));
  }, [theme, storageKey, fontScaleKey, highContrastKey, fontScale, highContrast]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  const setFontScale = (scale: number) => {
    setFontScaleState(scale);
  };

  const contextValue = useMemo(
    () => ({
      theme,
      toggleTheme,
      // The legacy navbar picks a theme directly rather than toggling. It
      // was destructuring setTheme from here, which was undefined, so every
      // click threw and the theme never changed.
      setTheme,
      fontScale,
      setFontScale,
      highContrast,
      toggleHighContrast: () => setHighContrast((prev) => !prev),
    }),
    [theme, fontScale, highContrast]
  );

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
