import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export function DustMotes({ count = 500, size = 15 }: { count?: number; size?: number }) {
  const meshRef = useRef<THREE.Points>(null);
  
  const particles = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);
    const opacities = new Float32Array(count);
    
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * size * 2;
      positions[i * 3 + 1] = Math.random() * 12;
      positions[i * 3 + 2] = (Math.random() - 0.5) * size * 2;
      
      velocities[i * 3] = (Math.random() - 0.5) * 0.002;
      velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.001;
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.002;
      
      opacities[i] = Math.random() * 0.4 + 0.1;
    }
    
    return { positions, velocities, opacities };
  }, [count, size]);

  useFrame((state) => {
    if (!meshRef.current) return;
    const geo = meshRef.current.geometry;
    const posArray = geo.attributes.position.array as Float32Array;
    
    for (let i = 0; i < count; i++) {
      posArray[i * 3] += particles.velocities[i * 3] + Math.sin(state.clock.elapsedTime * 0.5 + i) * 0.001;
      posArray[i * 3 + 1] += particles.velocities[i * 3 + 1];
      posArray[i * 3 + 2] += particles.velocities[i * 3 + 2] + Math.cos(state.clock.elapsedTime * 0.3 + i) * 0.001;
      
      if (posArray[i * 3 + 1] > 12) posArray[i * 3 + 1] = 0;
      if (posArray[i * 3 + 1] < 0) posArray[i * 3 + 1] = 12;
      if (posArray[i * 3] > size) posArray[i * 3] = -size;
      if (posArray[i * 3] < -size) posArray[i * 3] = size;
      if (posArray[i * 3 + 2] > size) posArray[i * 3 + 2] = -size;
      if (posArray[i * 3 + 2] < -size) posArray[i * 3 + 2] = size;
    }
    
    geo.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={particles.positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.03}
        color="#ffffff"
        transparent
        opacity={0.3}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

export function HeatShimmer({ position, intensity = 1 }: { position: [number, number, number]; intensity?: number }) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (!meshRef.current) return;
    const mat = meshRef.current.material as THREE.ShaderMaterial;
    mat.uniforms.uTime.value = state.clock.elapsedTime;
  });

  const shaderMaterial = useMemo(() => new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uIntensity: { value: intensity },
    },
    vertexShader: `
      varying vec2 vUv;
      varying vec3 vPosition;
      uniform float uTime;
      uniform float uIntensity;
      
      void main() {
        vUv = uv;
        vPosition = position;
        vec3 pos = position;
        pos.x += sin(position.y * 10.0 + uTime * 2.0) * 0.02 * uIntensity;
        pos.z += cos(position.y * 8.0 + uTime * 1.5) * 0.02 * uIntensity;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
      }
    `,
    fragmentShader: `
      varying vec2 vUv;
      varying vec3 vPosition;
      uniform float uTime;
      uniform float uIntensity;
      
      void main() {
        float alpha = (1.0 - vUv.y) * 0.15 * uIntensity;
        alpha *= sin(vUv.y * 20.0 + uTime * 3.0) * 0.5 + 0.5;
        vec3 color = mix(vec3(1.0, 0.4, 0.1), vec3(1.0, 0.8, 0.3), vUv.y);
        gl_FragColor = vec4(color, alpha);
      }
    `,
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  }), [intensity]);

  return (
    <mesh ref={meshRef} position={position} material={shaderMaterial}>
      <planeGeometry args={[0.8, 3, 8, 32]} />
    </mesh>
  );
}

export function AirflowParticles({ 
  start, 
  end, 
  count = 50, 
  color = "#00aaff" 
}: { 
  start: [number, number, number]; 
  end: [number, number, number]; 
  count?: number;
  color?: string;
}) {
  const meshRef = useRef<THREE.Points>(null);
  
  const particles = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const progress = new Float32Array(count);
    const speeds = new Float32Array(count);
    
    for (let i = 0; i < count; i++) {
      progress[i] = Math.random();
      speeds[i] = 0.5 + Math.random() * 0.5;
      
      const t = progress[i];
      positions[i * 3] = start[0] + (end[0] - start[0]) * t + (Math.random() - 0.5) * 0.3;
      positions[i * 3 + 1] = start[1] + (end[1] - start[1]) * t + (Math.random() - 0.5) * 0.1;
      positions[i * 3 + 2] = start[2] + (end[2] - start[2]) * t + (Math.random() - 0.5) * 0.3;
    }
    
    return { positions, progress, speeds };
  }, [count, start, end]);

  useFrame((state, delta) => {
    if (!meshRef.current) return;
    const geo = meshRef.current.geometry;
    const posArray = geo.attributes.position.array as Float32Array;
    
    for (let i = 0; i < count; i++) {
      particles.progress[i] += delta * particles.speeds[i];
      if (particles.progress[i] > 1) {
        particles.progress[i] = 0;
        particles.speeds[i] = 0.5 + Math.random() * 0.5;
      }
      
      const t = particles.progress[i];
      posArray[i * 3] = start[0] + (end[0] - start[0]) * t + Math.sin(t * 10 + i) * 0.1;
      posArray[i * 3 + 1] = start[1] + (end[1] - start[1]) * t;
      posArray[i * 3 + 2] = start[2] + (end[2] - start[2]) * t + Math.cos(t * 10 + i) * 0.1;
    }
    
    geo.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={particles.positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.04}
        color={color}
        transparent
        opacity={0.6}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

export function VolumetricLight({ 
  position, 
  color = "#4488ff",
  intensity = 1 
}: { 
  position: [number, number, number]; 
  color?: string;
  intensity?: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (!meshRef.current) return;
    const mat = meshRef.current.material as THREE.ShaderMaterial;
    mat.uniforms.uTime.value = state.clock.elapsedTime;
  });

  const shaderMaterial = useMemo(() => new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uPosition: { value: new THREE.Vector3(...position) },
      uColor: { value: new THREE.Color(color) },
      uIntensity: { value: intensity },
    },
    vertexShader: `
      varying vec2 vUv;
      uniform vec3 uPosition;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position + uPosition, 1.0);
      }
    `,
    fragmentShader: `
      varying vec2 vUv;
      uniform float uTime;
      uniform vec3 uColor;
      uniform float uIntensity;
      
      void main() {
        float dist = length(vUv - 0.5) * 2.0;
        float alpha = (1.0 - dist) * 0.2 * uIntensity;
        alpha *= 0.8 + sin(uTime * 0.5) * 0.2;
        alpha = max(0.0, alpha);
        gl_FragColor = vec4(uColor, alpha);
      }
    `,
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  }), [color, intensity]);

  return (
    <mesh ref={meshRef} position={position} rotation={[-Math.PI / 2, 0, 0]} material={shaderMaterial}>
      <planeGeometry args={[4, 4]} />
    </mesh>
  );
}
