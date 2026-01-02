"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Line, PerspectiveCamera } from "@react-three/drei";
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
import { glyphFragment, glyphVertex, ledFragment, ledVertex } from "./hero-shaders";

type HeroAnimationProps = {
  className?: string;
  variant?: "intro" | "floor" | "build" | "network" | "noc" | "incidents" | "about";
  seed?: number;
};

const paletteMap = {
  intro: {
    base: new THREE.Color("#03050d"),
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
  const targetRef = useRef({ avg: 16, tier: "high" as HeroQuality });

  const update = useCallback((delta: number) => {
    const ms = delta * 1000;
    const nextAvg = targetRef.current.avg * 0.9 + ms * 0.1;
    targetRef.current.avg = nextAvg;
    let nextTier = targetRef.current.tier;
    if (nextAvg > 28) nextTier = "low";
    else if (nextAvg > 20) nextTier = "medium";
    else nextTier = "high";
    if (nextTier !== targetRef.current.tier) {
      targetRef.current.tier = nextTier;
      setQuality(nextTier);
      setDpr(heroConfig.qualityTiers[nextTier].dpr);
    }
  }, []);

  const particleCount = Math.floor(
    baseCount * heroConfig.qualityTiers[quality].particleScale
  );

  return { quality, dpr, update, particleCount };
};

const buildLanes = (seed: number) => {
  const rng = createNoise3D(seed);
  const lanes: THREE.CatmullRomCurve3[] = [];
  for (let i = 0; i < 6; i += 1) {
    const points: THREE.Vector3[] = [];
    for (let j = 0; j < 9; j += 1) {
      const x = (i - 2.5) * 2.3 + rng(i * 0.1, j * 0.2, 0.2) * 1.4;
      const y = 1.2 + Math.abs(rng(i * 0.2, j * 0.3, 0.4)) * 1.6;
      const z = -j * 6.2 + rng(i * 0.3, j * 0.2, 0.6) * 2.4;
      points.push(new THREE.Vector3(x, y, z));
    }
    const curve = new THREE.CatmullRomCurve3(points);
    curve.curveType = "catmullrom";
    curve.tension = 0.4;
    lanes.push(curve);
  }
  return lanes;
};

function GlyphTraffic({
  count,
  seed,
  paused,
  scrollState,
}: {
  count: number;
  seed: number;
  paused: boolean;
  scrollState: number;
}) {
  const geometryRef = useRef<THREE.InstancedBufferGeometry>(null);
  const offsets = useMemo(() => new Float32Array(count * 3), [count]);
  const scales = useMemo(() => new Float32Array(count * 2), [count]);
  const rotations = useMemo(() => new Float32Array(count), [count]);
  const glyphs = useMemo(() => new Float32Array(count), [count]);
  const lanes = useMemo(() => new Float32Array(count), [count]);
  const pulses = useMemo(() => new Float32Array(count), [count]);
  const progress = useMemo(() => new Float32Array(count), [count]);
  const speeds = useMemo(() => new Float32Array(count), [count]);
  const laneCurves = useMemo(() => buildLanes(seed + 13), [seed]);

  useMemo(() => {
    for (let i = 0; i < count; i += 1) {
      const lane = i % laneCurves.length;
      const t = Math.random();
      const point = laneCurves[lane].getPointAt(t);
      offsets[i * 3] = point.x;
      offsets[i * 3 + 1] = point.y;
      offsets[i * 3 + 2] = point.z;
      scales[i * 2] = 0.35 + Math.random() * 0.6;
      scales[i * 2 + 1] = 0.16 + Math.random() * 0.35;
      rotations[i] = Math.random() * Math.PI;
      glyphs[i] = Math.floor(Math.random() * 5);
      lanes[i] = lane / laneCurves.length;
      pulses[i] = Math.random();
      progress[i] = t;
      speeds[i] = 0.08 + Math.random() * 0.2;
    }
  }, [count, glyphs, laneCurves, lanes, offsets, progress, pulses, rotations, scales, speeds]);

  useFrame(({ clock }, delta) => {
    if (paused || !geometryRef.current) return;
    const time = clock.getElapsedTime();
    const ramp = 0.4 + scrollState * 1.3;
    for (let i = 0; i < count; i += 1) {
      progress[i] += delta * speeds[i] * ramp;
      if (progress[i] > 1) progress[i] -= 1;
      const laneIndex = Math.min(
        laneCurves.length - 1,
        Math.floor(lanes[i] * laneCurves.length)
      );
      const curve = laneCurves[laneIndex];
      const point = curve.getPointAt(progress[i]);
      offsets[i * 3] = point.x;
      offsets[i * 3 + 1] = point.y + Math.sin(time * 2 + i) * 0.04;
      offsets[i * 3 + 2] = point.z;
      pulses[i] = 0.6 + 0.4 * Math.sin(time * 5 + i * 0.3);
    }
    geometryRef.current.attributes.aOffset.needsUpdate = true;
    geometryRef.current.attributes.aPulse.needsUpdate = true;
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
          attach="attributes-aRotation"
          array={rotations}
          count={count}
          itemSize={1}
        />
        <instancedBufferAttribute
          attach="attributes-aGlyph"
          array={glyphs}
          count={count}
          itemSize={1}
        />
        <instancedBufferAttribute
          attach="attributes-aLane"
          array={lanes}
          count={count}
          itemSize={1}
        />
        <instancedBufferAttribute
          attach="attributes-aPulse"
          array={pulses}
          count={count}
          itemSize={1}
        />
      </instancedBufferGeometry>
      <shaderMaterial
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        vertexShader={glyphVertex}
        fragmentShader={glyphFragment}
      />
    </mesh>
  );
}

function RackField({
  count,
  palette,
  seed,
}: {
  count: number;
  palette: (typeof paletteMap)[keyof typeof paletteMap];
  seed: number;
}) {
  const instancedRef = useRef<THREE.InstancedMesh>(null);
  const noise = useMemo(() => createNoise3D(seed + 11), [seed]);

  useEffect(() => {
    if (!instancedRef.current) return;
    const dummy = new THREE.Object3D();
    const color = new THREE.Color();
    for (let i = 0; i < count; i += 1) {
      const col = i % 16;
      const row = Math.floor(i / 16) % 12;
      const x = (col - 8) * 1.6;
      const z = -row * 3.2;
      const h = 1.6 + Math.abs(noise(col * 0.3, row * 0.2, 0.2)) * 3;
      dummy.position.set(x, h / 2, z);
      dummy.scale.set(0.8, h, 1.2);
      dummy.updateMatrix();
      instancedRef.current.setMatrixAt(i, dummy.matrix);
      color.copy(palette.cool).lerp(palette.accent, (i % 4) / 4);
      instancedRef.current.setColorAt(i, color);
    }
    instancedRef.current.instanceMatrix.needsUpdate = true;
    if (instancedRef.current.instanceColor) {
      instancedRef.current.instanceColor.needsUpdate = true;
    }
  }, [count, noise, palette.accent, palette.cool]);

  return (
    <instancedMesh ref={instancedRef} args={[undefined, undefined, count]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial
        color={palette.cool}
        metalness={0.5}
        roughness={0.3}
        emissive={palette.cool}
        emissiveIntensity={0.25}
      />
    </instancedMesh>
  );
}

function LedField({ count, seed }: { count: number; seed: number }) {
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
    const t = clock.getElapsedTime();
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

function GridFloor({ palette }: { palette: (typeof paletteMap)[keyof typeof paletteMap] }) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -18]}>
      <planeGeometry args={[120, 120, 40, 40]} />
      <meshStandardMaterial
        color={palette.base}
        emissive={palette.teal}
        emissiveIntensity={0.2}
        metalness={0.3}
        roughness={0.4}
        wireframe
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
            emissiveIntensity={0.5}
            transparent
            opacity={0.15}
          />
        </mesh>
      ))}
    </group>
  );
}

function RoutedLanes({ seed }: { seed: number }) {
  const curves = useMemo(() => buildLanes(seed + 17), [seed]);
  return (
    <group>
      {curves.map((curve, index) => (
        <Line
          key={index}
          points={curve.getPoints(40)}
          color={index % 2 === 0 ? "#22d3ee" : "#a855f7"}
          lineWidth={1}
          transparent
          opacity={0.35}
        />
      ))}
    </group>
  );
}

function PostEffects() {
  const { gl, scene, camera, size } = useThree();
  const composerRef = useRef<EffectComposer | null>(null);

  useEffect(() => {
    const composer = new EffectComposer(gl);
    const renderPass = new RenderPass(scene, camera);
    const bloom = new UnrealBloomPass(
      new THREE.Vector2(size.width, size.height),
      heroConfig.bloomIntensity,
      0.5,
      0.15
    );
    const vignette = new ShaderPass(VignetteShader);
    vignette.uniforms.offset.value = 0.4;
    vignette.uniforms.darkness.value = 1.1;
    const rgbShift = new ShaderPass(RGBShiftShader);
    rgbShift.uniforms.amount.value = 0.0015;
    const fxaa = new ShaderPass(FXAAShader);
    fxaa.material.uniforms.resolution.value.set(1 / size.width, 1 / size.height);

    composer.addPass(renderPass);
    composer.addPass(bloom);
    composer.addPass(vignette);
    composer.addPass(rgbShift);
    composer.addPass(fxaa);
    composerRef.current = composer;

    return () => {
      composer.dispose();
      composerRef.current = null;
    };
  }, [camera, gl, scene, size.height, size.width]);

  useEffect(() => {
    if (composerRef.current) {
      composerRef.current.setSize(size.width, size.height);
    }
  }, [size]);

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
}: {
  palette: (typeof paletteMap)[keyof typeof paletteMap];
  particleCount: number;
  seed: number;
  paused: boolean;
  reducedMotion: boolean;
  onPerfTick: (delta: number) => void;
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
    const sway = Math.sin(t * heroConfig.cameraSpeed) * 0.6;
    const lift = Math.cos(t * heroConfig.cameraSpeed * 0.7) * 0.35;
    const drift = noise(t * 0.05, 0.2, 0.4) * 0.6;
    camera.position.x = sway + pointer.current.x * heroConfig.interactionStrength * 2;
    camera.position.y = 4.5 + lift + scrollLift * 2 + pointer.current.y * heroConfig.interactionStrength;
    camera.position.z = 14 + drift * 2 + scrollLift * 8;
    camera.lookAt(0, 2.5 + scrollLift, -18 - scrollLift * 8);
  });

  return (
    <>
      <color attach="background" args={[palette.base]} />
      <fog attach="fog" args={[palette.base, 10, 60]} />
      <PerspectiveCamera makeDefault fov={45} position={[0, 5, 16]} />

      <ambientLight intensity={0.6} color={palette.cool} />
      <directionalLight position={[10, 10, 8]} intensity={1.2} color={palette.cool} />
      <directionalLight position={[-8, 12, -6]} intensity={0.9} color={palette.accent} />
      <pointLight position={[0, 6, 6]} intensity={1.4} color={palette.teal} />
      <pointLight position={[8, 4, -12]} intensity={1.1} color={palette.warm} />
      <pointLight position={[-8, 5, -18]} intensity={1.1} color={palette.cool} />

      <group position={[0, 0, -12]}>
        <GridFloor palette={palette} />
        <RackField count={particleCount > 20000 ? 260 : 140} palette={palette} seed={seed} />
        <LedField count={particleCount > 20000 ? 240 : 140} seed={seed} />
        <RoutedLanes seed={seed} />
        <LightVolumes palette={palette} />
      </group>

      <GlyphTraffic
        count={particleCount}
        seed={seed}
        paused={paused || reducedMotion}
        scrollState={scrollRef.current}
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
          particleCount={particleCount}
          seed={seed}
          paused={paused}
          reducedMotion={reducedMotion}
          onPerfTick={update}
        />
      </Canvas>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/20 via-black/20 to-black/70" />
    </div>
  );
}
