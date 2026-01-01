import { Sliders, RotateCw, Accessibility, Monitor, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { useSettings } from "@/lib/settings";

interface SettingsPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const qualityOptions = [
  { value: "low", label: "Low" },
  { value: "balanced", label: "Balanced" },
  { value: "ultra", label: "Ultra" },
] as const;

export function SettingsPanel({ open, onOpenChange }: SettingsPanelProps) {
  const {
    graphicsQuality,
    uiScale,
    invertYAxis,
    mouseSensitivity,
    highContrast,
    setGraphicsQuality,
    setUiScale,
    setInvertYAxis,
    setMouseSensitivity,
    setHighContrast,
    resetSettings,
  } = useSettings();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Sliders className="h-5 w-5 text-cyan-400" />
            Settings
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4">
          <Card className="space-y-3 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Monitor className="h-4 w-4 text-cyan-400" />
              Graphics
            </div>
            <div className="flex flex-wrap gap-2">
              {qualityOptions.map((option) => (
                <Button
                  key={option.value}
                  size="sm"
                  variant="outline"
                  onClick={() => setGraphicsQuality(option.value)}
                  className={
                    graphicsQuality === option.value
                      ? "border-cyan-400 text-cyan-300"
                      : "text-muted-foreground"
                  }
                >
                  {option.label}
                </Button>
              ))}
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/40 px-3 py-2 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <ShieldCheck className="h-4 w-4" />
                High contrast UI
              </div>
              <Switch checked={highContrast} onCheckedChange={setHighContrast} />
            </div>
          </Card>

          <Card className="space-y-4 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <RotateCw className="h-4 w-4 text-cyan-400" />
              Controls
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/40 px-3 py-2 text-sm">
              <span className="text-muted-foreground">Invert Y-Axis</span>
              <Switch checked={invertYAxis} onCheckedChange={setInvertYAxis} />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Mouse sensitivity</span>
                <span>{mouseSensitivity.toFixed(1)}x</span>
              </div>
              <Slider
                value={[mouseSensitivity]}
                onValueChange={(value) => setMouseSensitivity(value[0])}
                min={0.5}
                max={2}
                step={0.1}
              />
            </div>
          </Card>

          <Card className="space-y-4 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Accessibility className="h-4 w-4 text-cyan-400" />
              Interface
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>UI scale</span>
                <span>{Math.round(uiScale * 100)}%</span>
              </div>
              <Slider
                value={[uiScale]}
                onValueChange={(value) => setUiScale(value[0])}
                min={0.8}
                max={1.2}
                step={0.05}
              />
            </div>
          </Card>

          <div className="flex justify-end">
            <Button variant="outline" onClick={resetSettings}>
              Reset to defaults
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
