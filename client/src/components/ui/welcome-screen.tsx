interface WelcomeScreenProps {
  isVisible: boolean;
}

export function WelcomeScreen({ isVisible }: WelcomeScreenProps) {
  return (
    <div
      className={`pointer-events-none fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-700 ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
      data-testid="welcome-screen"
    >
      <div className="absolute inset-0 bg-black/90" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.25),_transparent_55%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,_rgba(99,102,241,0.18),_transparent_60%)]" />
      <div className="relative mx-6 flex max-w-xl flex-col items-center gap-6 rounded-3xl border border-cyan-400/30 bg-gradient-to-br from-black/90 via-slate-900/80 to-black/90 px-12 py-12 text-center shadow-[0_0_60px_rgba(34,211,238,0.35)] backdrop-blur-2xl">
        <div className="text-[10px] font-mono uppercase tracking-[0.35em] text-cyan-300/70">
          Initializing Hyperscale Systems
        </div>
        <div className="relative">
          <div className="text-4xl font-display font-bold tracking-[0.45em] text-white drop-shadow-[0_0_30px_rgba(34,211,238,0.6)]">
            HYPERSCALE
          </div>
          <div className="mt-3 text-[11px] font-mono uppercase tracking-[0.35em] text-cyan-200/80">
            by Max Doubin
          </div>
        </div>
        <div
          className="relative flex h-32 w-32 items-center justify-center"
          style={{ perspective: "800px" }}
        >
          <div
            className="absolute inset-0 animate-hero-float"
            style={{ transformStyle: "preserve-3d", transform: "rotateX(65deg) rotateZ(45deg)" }}
          >
            {[0, 1, 2, 3, 4].map((layer) => (
              <div
                key={layer}
                className="absolute left-1/2 top-1/2 h-6 w-28 -translate-x-1/2 -translate-y-1/2 rounded-md border border-cyan-300/40 bg-gradient-to-r from-slate-950 via-slate-800 to-slate-950 shadow-[0_0_25px_rgba(34,211,238,0.35)]"
                style={{
                  transform: `translateZ(${layer * 10}px)`,
                }}
              >
                <div className="absolute left-2 top-2 h-1.5 w-6 rounded-full bg-cyan-400/70 shadow-[0_0_10px_rgba(34,211,238,0.7)]" />
                <div className="absolute right-2 top-2 h-1.5 w-3 rounded-full bg-purple-400/70 shadow-[0_0_10px_rgba(168,85,247,0.7)]" />
                <div className="absolute bottom-2 left-2 h-1 w-12 rounded-full bg-white/10" />
              </div>
            ))}
          </div>
          <div className="absolute h-24 w-24 animate-hero-pulse rounded-full border border-cyan-400/20" />
        </div>
        <div className="text-xs font-mono uppercase tracking-[0.25em] text-cyan-200/70">
          Spinning up server matrix…
        </div>
        <div className="flex items-center gap-2 text-[10px] font-mono text-white/40">
          <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
          Building the future of hyperscale design
        </div>
      </div>
    </div>
  );
}
