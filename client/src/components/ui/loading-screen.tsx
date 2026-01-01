import { Building2, Loader2 } from "lucide-react";

export function LoadingScreen() {
  return (
    <div className="flex flex-col items-center justify-center h-screen w-full bg-background" data-testid="loading-screen">
      <div className="flex flex-col items-center gap-6">
        <div className="relative">
          <Building2 className="w-16 h-16 text-noc-blue" />
          <div className="absolute -bottom-2 -right-2">
            <Loader2 className="w-6 h-6 text-noc-cyan animate-spin" />
          </div>
        </div>
        <div className="text-center">
          <h1 className="font-display text-2xl font-bold tracking-wider mb-2">
            HYPERSCALE
          </h1>
          <p className="text-sm text-muted-foreground">
            Initializing data center systems...
          </p>
        </div>
        <div className="flex gap-1">
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-noc-blue animate-pulse"
              style={{ animationDelay: `${i * 150}ms` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
