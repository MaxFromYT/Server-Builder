"use client";

export const glyphVertex = `
  attribute vec3 aOffset;
  attribute vec2 aScale;
  attribute float aRotation;
  attribute float aGlyph;
  attribute float aLane;
  attribute float aPulse;
  varying float vGlyph;
  varying float vLane;
  varying float vPulse;
  varying vec2 vUv;
  void main() {
    vGlyph = aGlyph;
    vLane = aLane;
    vPulse = aPulse;
    vUv = uv;
    vec2 centered = (uv - 0.5) * aScale;
    float c = cos(aRotation);
    float s = sin(aRotation);
    vec2 rotated = vec2(
      centered.x * c - centered.y * s,
      centered.x * s + centered.y * c
    );
    vec3 pos = aOffset + vec3(rotated, 0.0);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

const sdfChip = `
  float box = sdBox(p, vec2(0.36, 0.28));
  float inner = sdBox(p, vec2(0.18, 0.12));
  float pins = sdBox(p + vec2(0.0, 0.3), vec2(0.28, 0.03));
  float body = max(box, -inner);
  return min(body, pins);
`;

const sdfPacket = `
  float frame = sdBox(p, vec2(0.38, 0.24));
  float header = sdBox(p + vec2(0.0, 0.12), vec2(0.24, 0.04));
  return min(frame, header);
`;

const sdfBracket = `
  float left = sdBox(p + vec2(-0.28, 0.0), vec2(0.06, 0.34));
  float top = sdBox(p + vec2(-0.1, 0.32), vec2(0.18, 0.04));
  float bottom = sdBox(p + vec2(-0.1, -0.32), vec2(0.18, 0.04));
  float right = sdBox(p + vec2(0.28, 0.0), vec2(0.06, 0.34));
  return min(min(left, top), min(bottom, right));
`;

const sdfBit = `
  float circ = length(p) - 0.28;
  float bar = sdBox(p, vec2(0.06, 0.28));
  return min(circ, bar);
`;

const sdfTrace = `
  float main = sdBox(p, vec2(0.38, 0.04));
  float node = length(p - vec2(-0.22, 0.0)) - 0.08;
  float node2 = length(p - vec2(0.22, 0.0)) - 0.08;
  return min(main, min(node, node2));
`;

export const glyphFragment = `
  precision highp float;
  varying float vGlyph;
  varying float vLane;
  varying float vPulse;
  varying vec2 vUv;

  float sdBox(vec2 p, vec2 b) {
    vec2 d = abs(p) - b;
    return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
  }

  float renderGlyph(vec2 p, float glyph) {
    if (glyph < 0.5) {
      ${sdfChip}
    }
    if (glyph < 1.5) {
      ${sdfPacket}
    }
    if (glyph < 2.5) {
      ${sdfBracket}
    }
    if (glyph < 3.5) {
      ${sdfBit}
    }
    ${sdfTrace}
  }

  void main() {
    vec2 p = vUv * 2.0 - 1.0;
    float sdf = renderGlyph(p, vGlyph);
    float edge = smoothstep(0.08, -0.02, sdf);
    float glow = smoothstep(0.3, -0.1, sdf) * 0.6;
    vec3 cool = vec3(0.2, 0.8, 1.0);
    vec3 warm = vec3(1.0, 0.35, 0.6);
    vec3 color = mix(cool, warm, vLane);
    float alpha = edge + glow * 0.6;
    alpha *= 0.7 + vPulse * 0.6;
    gl_FragColor = vec4(color * (edge * 1.2 + glow), alpha);
    if (gl_FragColor.a < 0.02) discard;
  }
`;

export const ledVertex = `
  attribute vec3 aOffset;
  attribute vec2 aScale;
  attribute float aPhase;
  varying float vPhase;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    vPhase = aPhase;
    vec2 centered = (uv - 0.5) * aScale;
    vec3 pos = aOffset + vec3(centered, 0.0);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

export const ledFragment = `
  precision highp float;
  varying float vPhase;
  varying vec2 vUv;
  void main() {
    float line = smoothstep(0.2, 0.0, abs(vUv.y - 0.5));
    float pulse = 0.6 + 0.4 * sin(vPhase);
    vec3 color = mix(vec3(0.1, 0.6, 1.0), vec3(0.9, 0.2, 0.5), vPhase * 0.15);
    gl_FragColor = vec4(color * pulse, line * 0.8);
    if (gl_FragColor.a < 0.02) discard;
  }
`;
