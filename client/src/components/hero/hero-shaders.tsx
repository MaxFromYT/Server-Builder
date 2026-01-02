"use client";

export const trafficVertex = `
  attribute float aScale;
  attribute float aSpeed;
  attribute float aLane;
  varying float vSpeed;
  varying float vLane;
  void main() {
    vSpeed = aSpeed;
    vLane = aLane;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = aScale * (120.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

export const trafficFragment = `
  precision highp float;
  varying float vSpeed;
  varying float vLane;
  void main() {
    vec2 uv = gl_PointCoord - 0.5;
    float d = length(uv);
    float core = smoothstep(0.5, 0.0, d);
    float ring = smoothstep(0.5, 0.15, d) - smoothstep(0.15, 0.0, d);
    vec3 cool = vec3(0.2, 0.8, 1.0);
    vec3 warm = vec3(1.0, 0.35, 0.6);
    vec3 laneTint = mix(cool, warm, vLane);
    float pulse = 0.4 + vSpeed * 0.6;
    vec3 color = laneTint * (core * 1.2 + ring * 0.6) * pulse;
    gl_FragColor = vec4(color, core * 0.9);
  }
`;
