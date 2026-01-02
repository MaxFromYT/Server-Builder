import { useMemo } from "react";
import { useLocation } from "wouter";

const backgroundPresets = {
  floor: {
    base: "#030712",
    gradients: [
      "radial-gradient(circle at 15% 20%, rgba(56,189,248,0.35), transparent 55%)",
      "radial-gradient(circle at 80% 25%, rgba(168,85,247,0.35), transparent 60%)",
      "radial-gradient(circle at 35% 80%, rgba(34,211,238,0.35), transparent 55%)",
      "radial-gradient(circle at 75% 75%, rgba(14,165,233,0.3), transparent 60%)",
    ],
  },
  build: {
    base: "#05040f",
    gradients: [
      "radial-gradient(circle at 20% 20%, rgba(147,51,234,0.4), transparent 55%)",
      "radial-gradient(circle at 80% 30%, rgba(236,72,153,0.35), transparent 55%)",
      "radial-gradient(circle at 40% 80%, rgba(59,130,246,0.35), transparent 55%)",
    ],
  },
  network: {
    base: "#02040f",
    gradients: [
      "radial-gradient(circle at 20% 30%, rgba(34,211,238,0.4), transparent 55%)",
      "radial-gradient(circle at 75% 25%, rgba(14,165,233,0.35), transparent 55%)",
      "radial-gradient(circle at 60% 70%, rgba(59,130,246,0.35), transparent 55%)",
    ],
  },
  noc: {
    base: "#040611",
    gradients: [
      "radial-gradient(circle at 25% 25%, rgba(34,197,94,0.35), transparent 55%)",
      "radial-gradient(circle at 80% 25%, rgba(14,165,233,0.3), transparent 55%)",
      "radial-gradient(circle at 60% 80%, rgba(168,85,247,0.3), transparent 55%)",
    ],
  },
  incidents: {
    base: "#0a0306",
    gradients: [
      "radial-gradient(circle at 20% 30%, rgba(239,68,68,0.35), transparent 55%)",
      "radial-gradient(circle at 80% 35%, rgba(249,115,22,0.3), transparent 55%)",
      "radial-gradient(circle at 50% 80%, rgba(236,72,153,0.25), transparent 55%)",
    ],
  },
  about: {
    base: "#030712",
    gradients: [
      "radial-gradient(circle at 20% 20%, rgba(56,189,248,0.35), transparent 55%)",
      "radial-gradient(circle at 80% 35%, rgba(34,211,238,0.3), transparent 55%)",
      "radial-gradient(circle at 45% 80%, rgba(59,130,246,0.25), transparent 60%)",
    ],
  },
  fallback: {
    base: "#05060f",
    gradients: [
      "radial-gradient(circle at 25% 25%, rgba(56,189,248,0.3), transparent 55%)",
      "radial-gradient(circle at 75% 30%, rgba(168,85,247,0.25), transparent 55%)",
    ],
  },
} as const;

const resolvePreset = (path: string) => {
  if (path === "/" || path === "/floor") return backgroundPresets.floor;
  if (path.startsWith("/build")) return backgroundPresets.build;
  if (path.startsWith("/network")) return backgroundPresets.network;
  if (path.startsWith("/noc")) return backgroundPresets.noc;
  if (path.startsWith("/incidents")) return backgroundPresets.incidents;
  if (path.startsWith("/about")) return backgroundPresets.about;
  return backgroundPresets.fallback;
};

export function PageBackground() {
  const [location] = useLocation();
  const preset = useMemo(() => resolvePreset(location), [location]);

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <style>{`
        @keyframes page-pan {
          0% { background-position: 0% 0%; }
          50% { background-position: 120% 80%; }
          100% { background-position: 0% 0%; }
        }
        @keyframes page-grid {
          0% { background-position: 0px 0px; opacity: 0.35; }
          50% { background-position: 180px 140px; opacity: 0.6; }
          100% { background-position: 0px 0px; opacity: 0.35; }
        }
      `}</style>
      <div className="absolute inset-0" style={{ backgroundColor: preset.base }} />
      <div
        className="absolute inset-0 opacity-80"
        style={{
          backgroundImage: preset.gradients.join(", "),
          backgroundSize: "160% 160%",
          animation: "page-pan 26s ease-in-out infinite",
        }}
      />
      <div
        className="absolute inset-0 mix-blend-screen"
        style={{
          backgroundImage:
            "conic-gradient(from 90deg at 50% 50%, rgba(59,130,246,0.15), rgba(34,211,238,0.12), rgba(168,85,247,0.16), rgba(59,130,246,0.15))",
          filter: "blur(80px)",
          animation: "page-pan 36s linear infinite",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(148,163,184,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.06) 1px, transparent 1px)",
          backgroundSize: "160px 160px",
          animation: "page-grid 22s linear infinite",
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/40 to-black/70" />
    </div>
  );
}
