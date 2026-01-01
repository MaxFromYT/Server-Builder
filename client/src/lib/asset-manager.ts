import * as THREE from "three";

interface StreamingCanvasOptions {
  lowResolution: number;
  highResolution: number;
  repeat: number;
  draw: (ctx: CanvasRenderingContext2D, size: number) => void;
}

const scheduleIdle = (callback: () => void) => {
  if (typeof window === "undefined") return;
  if ("requestIdleCallback" in window) {
    window.requestIdleCallback(callback, { timeout: 500 });
  } else {
    window.setTimeout(callback, 120);
  }
};

export function createStreamingCanvasTexture({
  lowResolution,
  highResolution,
  repeat,
  draw,
}: StreamingCanvasOptions): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("2D canvas context unavailable for streaming texture.");
  }

  const render = (size: number) => {
    canvas.width = size;
    canvas.height = size;
    draw(ctx, size);
  };

  render(lowResolution);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(repeat, repeat);

  scheduleIdle(() => {
    render(highResolution);
    texture.needsUpdate = true;
  });

  return texture;
}

export function precompileSceneMaterials(
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene,
  camera: THREE.Camera
) {
  renderer.compile(scene, camera);
}
