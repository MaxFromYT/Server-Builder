"use client";

export const heroConfig = {
  seed: 42,
  baseParticleCount: 42000,
  qualityTiers: {
    low: { dpr: 0.8, particleScale: 0.4, rackCount: 120, lightCount: 4 },
    medium: { dpr: 1.1, particleScale: 0.7, rackCount: 220, lightCount: 6 },
    high: { dpr: 1.5, particleScale: 1, rackCount: 320, lightCount: 8 },
  },
  bloomIntensity: 0.6,
  fogDensity: 0.015,
  cameraSpeed: 0.18,
  interactionStrength: 0.35,
  scrollInfluence: 0.6,
} as const;

export type HeroQuality = keyof typeof heroConfig.qualityTiers;
