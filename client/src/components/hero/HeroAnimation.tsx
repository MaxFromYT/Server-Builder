"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { PerspectiveCamera } from "@react-three/drei";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass";
import { VignetteShader } from "three/examples/jsm/shaders/VignetteShader";
import { RGBShiftShader } from "three/examples/jsm/shaders/RGBShiftShader";
import { FXAAShader } from "three/examples/jsm/shaders/FXAAShader";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { heroConfig, type HeroQuality } from "./hero-config";
import { createNoise3D } from "./hero-noise";
import { Rack3D } from "@/components/3d/Rack3D";
import { staticEquipmentCatalog } from "@/lib/static-equipment";
import type { Rack } from "@shared/schema";

type HeroAnimationProps = {
  className?: string;
  variant?: "intro" | "floor" | "build" | "network" | "noc" | "incidents" | "about";
  seed?: number;
};

const paletteMap = {
  intro: {
    base: new THREE.Color("#02060f"),
    cool: new THREE.Color("#4cc3ff"),
    teal: new THREE.Color("#38f2d6"),
    warm: new THREE.Color("#ff7aa8"),
    accent: new THREE.Color("#8b5cf6"),
  },
  floor: {
    base: new THREE.Color("#02040a"),
    cool: new THREE.Color("#3bb7ff"),
    teal: new THREE.Color("#22d3ee"),
    warm: new THREE.Color("#f97316"),
    accent: new THREE.Color("#60a5fa"),
  },
  build: {
    base: new THREE.Color("#05040a"),
    cool: new THREE.Color("#7dd3fc"),
    teal: new THREE.Color("#5eead4"),
    warm: new THREE.Color("#fb7185"),
    accent: new THREE.Color("#a855f7"),
  },
  network: {
    base: new THREE.Color("#020509"),
    cool: new THREE.Color("#38bdf8"),
    teal: new THREE.Color("#22d3ee"),
    warm: new THREE.Color("#f59e0b"),
    accent: new THREE.Color("#0ea5e9"),
  },
  noc: {
    base: new THREE.Color("#030611"),
    cool: new THREE.Color("#22c55e"),
    teal: new THREE.Color("#38bdf8"),
    warm: new THREE.Color("#fb7185"),
    accent: new THREE.Color("#8b5cf6"),
  },
  incidents: {
    base: new THREE.Color("#0b0306"),
    cool: new THREE.Color("#fb7185"),
    teal: new THREE.Color("#f97316"),
    warm: new THREE.Color("#ef4444"),
    accent: new THREE.Color("#f43f5e"),
  },
  about: {
    base: new THREE.Color("#020812"),
    cool: new THREE.Color("#38bdf8"),
    teal: new THREE.Color("#22d3ee"),
    warm: new THREE.Color("#60a5fa"),
    accent: new THREE.Color("#a855f7"),
  },
};

const createSeededRandom = (seed: number) => {
  let t = seed;
  return () => {
    t += 0x6d2b79f5;
    let r = t;
    r = Math.imul(r ^ (r >>> 15), r | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
};

const buildShowcaseRack = (index: number, positionX: number, positionY: number): Rack => {
  const slots = Array.from({ length: 42 }).map((_, slotIndex) => ({
    uPosition: slotIndex + 1,
    equipmentInstanceId: null,
  }));
  const rng = createSeededRandom(300 + index);
  const installedEquipment: Rack["installedEquipment"] = [];
  let u = 1;
  while (u <= 42) {
    const equipment = staticEquipmentCatalog[Math.floor(rng() * staticEquipmentCatalog.length)];
    const uEnd = Math.min(42, u + equipment.uHeight - 1);
    const instanceId = `showcase-${index}-${u}-${equipment.id}`;
    for (let slot = u; slot <= uEnd; slot += 1) {
      slots[slot - 1].equipmentInstanceId = instanceId;
    }
    installedEquipment.push({
      id: instanceId,
      equipmentId: equipment.id,
      uStart: u,
      uEnd,
      status: "online",
      cpuLoad: 40 + rng() * 40,
      memoryUsage: 30 + rng() * 50,
      networkActivity: 20 + rng() * 60,
    });
    u = uEnd + 1 + (rng() > 0.75 ? 1 : 0);
  }

  return {
    id: `showcase-rack-${index}`,
    name: `Showcase ${index + 1}`,
    type: "enclosed_42U",
    totalUs: 42,
    slots,
    installedEquipment,
    powerCapacity: 12000,
    currentPowerDraw: 3200,
    inletTemp: 22,
    exhaustTemp: 28,
    airflowRestriction: 0.1,
    positionX,
    positionY,
  };
};

const usePrefersReducedMotion = () => {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handler = () => setReduced(media.matches);
    handler();
    media.addEventListener("change", handler);
    return () => media.removeEventListener("change", handler);
  }, []);
  return reduced;
};

const usePageVisibility = () => {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const handler = () => setVisible(!document.hidden);
    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  }, []);
  return visible;
};

const useAdaptiveQuality = (baseCount: number) => {
  const [quality, setQuality] = useState<HeroQuality>("high");
  const [dpr, setDpr] = useState(heroConfig.qualityTiers.high.dpr);
  const targetRef = useRef({
    avg: 16,
    tier: "high" as HeroQuality,
    samples: 0,
    lastSwitch: 0,
    pending: null as HeroQuality | null,
    pendingSamples: 0,
  });

  const update = useCallback((delta: number) => {
    const ms = delta * 1000;
    const nextAvg = targetRef.current.avg * 0.92 + ms * 0.08;
    targetRef.current.avg = nextAvg;
    targetRef.current.samples += 1;
    const now = performance.now();
    if (now - targetRef.current.lastSwitch < 12000) return;
    if (targetRef.current.samples < 240) return;

    let nextTier = targetRef.current.tier;
    if (nextAvg > 32) nextTier = "low";
    else if (nextAvg > 24) nextTier = "medium";
    else if (nextAvg < 17) nextTier = "high";

    if (nextTier !== targetRef.current.tier) {
      if (targetRef.current.pending !== nextTier) {
        targetRef.current.pending = nextTier;
        targetRef.current.pendingSamples = 0;
        return;
      }
      targetRef.current.pendingSamples += 1;
      if (targetRef.current.pendingSamples < 120) return;
      targetRef.current.tier = nextTier;
      setQuality(nextTier);
      setDpr(heroConfig.qualityTiers[nextTier].dpr);
      targetRef.current.lastSwitch = now;
      targetRef.current.samples = 0;
      targetRef.current.pending = null;
      targetRef.current.pendingSamples = 0;
    } else {
      targetRef.current.pending = null;
      targetRef.current.pendingSamples = 0;
    }
  }, []);

  const particleCount = Math.floor(
    baseCount * heroConfig.qualityTiers[quality].particleScale
  );

  return { quality, dpr, update, particleCount };
};

function GridFloor({ palette }: { palette: (typeof paletteMap)[keyof typeof paletteMap] }) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -20]}>
      <planeGeometry args={[140, 140, 50, 50]} />
      <meshStandardMaterial
        color={palette.base}
        emissive={palette.teal}
        emissiveIntensity={0.18}
        metalness={0.35}
        roughness={0.35}
        wireframe
      />
    </mesh>
  );
}

function NetworkBubbles({
  count,
  seed,
  paused,
  motionFactor,
}: {
  count: number;
  seed: number;
  paused: boolean;
  motionFactor: number;
}) {
  const instancedRef = useRef<THREE.InstancedMesh>(null);
  const noise = useMemo(() => createNoise3D(seed + 77), [seed]);
  const speeds = useMemo(() => new Float32Array(count), [count]);
  const offsets = useMemo(() => new Float32Array(count * 3), [count]);

  useEffect(() => {
    if (!instancedRef.current) return;
    const dummy = new THREE.Object3D();
    const color = new THREE.Color();
    for (let i = 0; i < count; i += 1) {
      const x = (Math.random() - 0.5) * 30;
      const y = 1 + Math.random() * 8;
      const z = -Math.random() * 80;
      offsets[i * 3] = x;
      offsets[i * 3 + 1] = y;
      offsets[i * 3 + 2] = z;
      speeds[i] = 0.3 + Math.random() * 0.8;
      dummy.position.set(x, y, z);
      const scale = 0.15 + Math.random() * 0.45;
      dummy.scale.set(scale, scale, scale);
      dummy.updateMatrix();
      instancedRef.current.setMatrixAt(i, dummy.matrix);
      color.setHSL(0.55 + Math.random() * 0.1, 0.7, 0.6);
      instancedRef.current.setColorAt(i, color);
    }
    instancedRef.current.instanceMatrix.needsUpdate = true;
    if (instancedRef.current.instanceColor) {
      instancedRef.current.instanceColor.needsUpdate = true;
    }
  }, [count, offsets, speeds]);

  useFrame(({ clock }, delta) => {
    if (paused || !instancedRef.current) return;
    const t = clock.getElapsedTime() * motionFactor;
    const dummy = new THREE.Object3D();
    for (let i = 0; i < count; i += 1) {
      const idx = i * 3;
      offsets[idx + 2] += delta * speeds[i] * motionFactor;
      offsets[idx] += noise(offsets[idx] * 0.08, offsets[idx + 1] * 0.08, t * 0.12) * 0.08;
      if (offsets[idx + 2] > 6) offsets[idx + 2] = -90;
      dummy.position.set(offsets[idx], offsets[idx + 1], offsets[idx + 2]);
      const scale = 0.18 + Math.abs(Math.sin(t + i)) * 0.25;
      dummy.scale.set(scale, scale, scale);
      dummy.updateMatrix();
      instancedRef.current.setMatrixAt(i, dummy.matrix);
    }
    instancedRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={instancedRef} args={[undefined, undefined, count]}>
      <sphereGeometry args={[1, 10, 10]} />
      <meshStandardMaterial
        transparent
        opacity={0.5}
        emissive="#38bdf8"
        emissiveIntensity={0.6}
      />
    </instancedMesh>
  );
}

function LedField({
  count,
  seed,
  motionFactor,
}: {
  count: number;
  seed: number;
  motionFactor: number;
}) {
  const geometryRef = useRef<THREE.InstancedBufferGeometry>(null);
  const offsets = useMemo(() => new Float32Array(count * 3), [count]);
  const scales = useMemo(() => new Float32Array(count * 2), [count]);
  const phases = useMemo(() => new Float32Array(count), [count]);
  const noise = useMemo(() => createNoise3D(seed + 31), [seed]);

  useMemo(() => {
    for (let i = 0; i < count; i += 1) {
      const col = i % 20;
      const row = Math.floor(i / 20) % 10;
      offsets[i * 3] = (col - 10) * 1.6;
      offsets[i * 3 + 1] = 1.2 + (row % 3) * 0.4;
      offsets[i * 3 + 2] = -row * 3.2 + noise(col * 0.2, row * 0.3, 0.4);
      scales[i * 2] = 0.6;
      scales[i * 2 + 1] = 0.08;
      phases[i] = Math.random() * Math.PI * 2;
    }
  }, [count, noise, offsets, phases, scales]);

  useFrame(({ clock }) => {
    if (!geometryRef.current) return;
    const t = clock.getElapsedTime() * motionFactor;
    for (let i = 0; i < count; i += 1) {
      phases[i] = t + i * 0.3;
    }
    geometryRef.current.attributes.aPhase.needsUpdate = true;
  });

  return (
    <mesh>
      <instancedBufferGeometry ref={geometryRef}>
        <planeGeometry args={[1, 1]} />
        <instancedBufferAttribute
          attach="attributes-aOffset"
          array={offsets}
          count={count}
          itemSize={3}
        />
        <instancedBufferAttribute
          attach="attributes-aScale"
          array={scales}
          count={count}
          itemSize={2}
        />
        <instancedBufferAttribute
          attach="attributes-aPhase"
          array={phases}
          count={count}
          itemSize={1}
        />
      </instancedBufferGeometry>
      <shaderMaterial
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        vertexShader={ledVertex}
        fragmentShader={ledFragment}
      />
    </mesh>
  );
}

function LightVolumes({ palette }: { palette: (typeof paletteMap)[keyof typeof paletteMap] }) {
  const beams = useMemo(
    () => [
      { position: new THREE.Vector3(-12, 5, -12), color: palette.teal },
      { position: new THREE.Vector3(12, 6, -14), color: palette.cool },
      { position: new THREE.Vector3(0, 7, -24), color: palette.accent },
    ],
    [palette]
  );

  return (
    <group>
      {beams.map((beam, index) => (
        <mesh key={index} position={beam.position} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.4, 3.2, 24, 16, 1, true]} />
          <meshStandardMaterial
            color={beam.color}
            emissive={beam.color}
            emissiveIntensity={0.4}
            transparent
            opacity={0.12}
          />
        </mesh>
      ))}
    </group>
  );
}

function RackShowcase({
  count,
  motionFactor,
}: {
  count: number;
  motionFactor: number;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const equipmentMap = useMemo(
    () => new Map(staticEquipmentCatalog.map((item) => [item.id, item])),
    []
  );
  const racks = useMemo(() => {
    const ring: Rack[] = [];
    const radius = 9;
    for (let i = 0; i < count; i += 1) {
      const angle = (i / count) * Math.PI * 2;
      ring.push(buildShowcaseRack(i, Math.cos(angle) * radius, Math.sin(angle) * radius));
    }
    return ring;
  }, [count]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime() * motionFactor;
    if (groupRef.current) {
      groupRef.current.rotation.y = t * 0.08;
      groupRef.current.position.y = Math.sin(t * 0.4) * 0.25;
    }
  });

  return (
    <group ref={groupRef} position={[0, 0, -24]}>
      {racks.map((rack, index) => (
        <Rack3D
          key={rack.id}
          rack={rack}
          position={[rack.positionX, 0, rack.positionY]}
          isSelected={false}
          onSelect={() => {}}
          equipmentCatalog={equipmentMap}
          lodIndex={index}
          detailBudget={racks.length}
          showHud={false}
        />
      ))}
    </group>
  );
}

function PostEffects() {
  const { gl, scene, camera, size } = useThree();
  const composerRef = useRef<EffectComposer | null>(null);
  const fxaaRef = useRef<ShaderPass | null>(null);

  useEffect(() => {
    const previousAutoClear = gl.autoClear;
    gl.autoClear = false;
    const composer = new EffectComposer(gl);
    const renderPass = new RenderPass(scene, camera);
    const bloom = new UnrealBloomPass(
      new THREE.Vector2(size.width, size.height),
      heroConfig.bloomIntensity,
      0.6,
      0.2
    );
    const vignette = new ShaderPass(VignetteShader);
    vignette.uniforms.offset.value = 0.4;
    vignette.uniforms.darkness.value = 1.2;
    const rgbShift = new ShaderPass(RGBShiftShader);
    rgbShift.uniforms.amount.value = 0.0012;
    const fxaa = new ShaderPass(FXAAShader);

    composer.addPass(renderPass);
    composer.addPass(bloom);
    composer.addPass(vignette);
    composer.addPass(rgbShift);
    composer.addPass(fxaa);
    composerRef.current = composer;
    fxaaRef.current = fxaa;

    return () => {
      composer.dispose();
      gl.autoClear = previousAutoClear;
      composerRef.current = null;
      fxaaRef.current = null;
    };
  }, [camera, gl, scene, size.height, size.width]);

  useEffect(() => {
    if (!composerRef.current || !fxaaRef.current) return;
    composerRef.current.setSize(size.width, size.height);
    fxaaRef.current.material.uniforms.resolution.value.set(
      1 / size.width,
      1 / size.height
    );
  }, [size.height, size.width]);

  useFrame(() => {
    if (!composerRef.current) return;
    composerRef.current.render();
  }, 1);

  return null;
}

function HeroScene({
  palette,
  particleCount,
  seed,
  paused,
  reducedMotion,
  onPerfTick,
  motionFactor,
}: {
  palette: (typeof paletteMap)[keyof typeof paletteMap];
  particleCount: number;
  seed: number;
  paused: boolean;
  reducedMotion: boolean;
  onPerfTick: (delta: number) => void;
  motionFactor: number;
}) {
  const { camera } = useThree();
  const pointer = useRef(new THREE.Vector2());
  const scrollRef = useRef(0);
  const noise = useMemo(() => createNoise3D(seed + 4), [seed]);

  useEffect(() => {
    const onMove = (event: PointerEvent) => {
      pointer.current.x = (event.clientX / window.innerWidth) * 2 - 1;
      pointer.current.y = -(event.clientY / window.innerHeight) * 2 + 1;
    };
    const onScroll = () => {
      const scrollTop = window.scrollY;
      const max = Math.max(1, document.body.scrollHeight - window.innerHeight);
      scrollRef.current = Math.min(1, scrollTop / max);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  useFrame(({ clock }, delta) => {
    if (paused) return;
    onPerfTick(delta);
    if (reducedMotion) return;
    const t = clock.getElapsedTime();
    const scrollLift = scrollRef.current * heroConfig.scrollInfluence;
    const sway = Math.sin(t * heroConfig.cameraSpeed * 0.4) * 0.3;
    const lift = Math.cos(t * heroConfig.cameraSpeed * 0.3) * 0.25;
    const drift = noise(t * 0.03, 0.2, 0.4) * 0.4;
    camera.position.x = sway + pointer.current.x * heroConfig.interactionStrength * 0.5;
    camera.position.y = 3.4 + lift + scrollLift * 1.1 + pointer.current.y * heroConfig.interactionStrength * 0.4;
    camera.position.z = 9 + drift * 1.4 + scrollLift * 6;
    camera.lookAt(0, 2.2 + scrollLift * 0.6, -26 - scrollLift * 12);
  });

  return (
    <>
      <color attach="background" args={[palette.base]} />
      <fog attach="fog" args={[palette.base, 12, 70]} />
      <PerspectiveCamera makeDefault fov={40} position={[0, 4, 10]} />

      <ambientLight intensity={0.7} color={palette.cool} />
      <directionalLight position={[10, 12, 8]} intensity={1.2} color={palette.cool} />
      <directionalLight position={[-8, 10, -6]} intensity={0.8} color={palette.accent} />
      <pointLight position={[0, 6, 4]} intensity={1.2} color={palette.teal} />
      <pointLight position={[8, 4, -14]} intensity={1.0} color={palette.warm} />
      <pointLight position={[-8, 4, -20]} intensity={1.0} color={palette.cool} />

      <group position={[0, 0, -16]}>
        <GridFloor palette={palette} />
        <LedField
          count={particleCount > 20000 ? 180 : 120}
          seed={seed}
          motionFactor={motionFactor}
        />
        <LightVolumes palette={palette} />
      </group>
      <RackShowcase count={24} motionFactor={motionFactor} />
      <NetworkBubbles
        count={Math.max(120, Math.floor(particleCount / 120))}
        seed={seed}
        paused={paused}
        motionFactor={motionFactor}
      />

      <PostEffects />
    </>
  );
}

export function HeroAnimation({
  className,
  variant = "intro",
  seed = heroConfig.seed,
}: HeroAnimationProps) {
  const reducedMotion = usePrefersReducedMotion();
  const visible = usePageVisibility();
  const { dpr, update, particleCount } = useAdaptiveQuality(heroConfig.baseParticleCount);
  const palette = paletteMap[variant];
  const paused = !visible;
  const motionFactor = Math.max(
    reducedMotion ? heroConfig.reducedMotionFactor : 1,
    0.35
  );
  const ensuredTraffic = Math.max(heroConfig.minParticleCount, particleCount);

  return (
    <div className={className}>
      <Canvas
        dpr={dpr}
        gl={{ antialias: true, powerPreference: "high-performance" }}
        frameloop={paused ? "never" : "always"}
        className="h-full w-full"
      >
        <HeroScene
          palette={palette}
          particleCount={ensuredTraffic}
          seed={seed}
          paused={paused}
          reducedMotion={reducedMotion}
          onPerfTick={update}
          motionFactor={motionFactor}
        />
      </Canvas>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/10 via-black/30 to-black/70" />
    </div>
  );
}
