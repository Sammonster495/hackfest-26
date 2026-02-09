"use client";

import { shaderMaterial } from "@react-three/drei";
import { extend } from "@react-three/fiber";
import * as THREE from "three";

const fragmentShader = `
uniform vec2 uPlaneRes;
uniform vec2 uMediaRes1;
uniform vec2 uMediaRes2;
uniform vec2 uMediaRes3;
uniform vec2 uCanvasRes;
uniform vec2 uMouse2D;
uniform sampler2D tMap1;
uniform sampler2D tMap2;
uniform sampler2D tMap3;
uniform float uTime;
uniform float uTransitionProgress;
uniform float uHoverProgress;
uniform float uNausea; // Nausea intensity (0.0 to 1.0)
uniform float uVar1;
uniform float uVar2;
uniform float uVar3;

varying vec2 vUv;

#define PI 3.14159265359

vec2 getUvs(vec2 planeRes, vec2 mediaRes, vec2 uv) {
    vec2 ratio = vec2(
        min((planeRes.x / planeRes.y) / (mediaRes.x / mediaRes.y), 1.0),
        min((planeRes.y / planeRes.x) / (mediaRes.y / mediaRes.x), 1.0)
    );
    vec2 finalUv = vec2(
        uv.x * ratio.x + (1.0 - ratio.x) * 0.5,
        uv.y * ratio.y + (1.0 - ratio.y) * 0.5
    );
    return finalUv;
}

float parabola( float x, float k ) {
    return pow( 4. * x * ( 1. - x ), k );
}

vec2 mirrored(vec2 v) {
    vec2 m = mod(v,2.0);
    return mix(m, 2.0-m, step(1.0, m));
}

//https://www.shadertoy.com/view/ldfSDj
float udRoundBox( vec2 p, vec2 b, float r ){
    return length(max(abs(p)-b+r,0.0))-r;
}
float roundCorners(vec2 planeRes, vec2 uv, float radius) {
    float iRadius = min(planeRes.x, planeRes.y) * radius;
    vec2 halfRes = 0.5 * planeRes.xy;
    float b = udRoundBox( (uv * planeRes) - halfRes, halfRes, iRadius );
    return clamp(1.0 - b, 0.0, 1.0);
}

float tri(float v) {
    return mix(v, 1.0 - v, step(0.5, v)) * 2.0;
}

float remap01 (float a, float b, float t){
    return (t-a) / (b-a);
}

float remap(float a, float b, float c, float d, float t){
    return remap01(a, b, t) * (d-c) + c;
}

float paintCircle (vec2 uv, vec2 center, float rad, float width, float distortion) {
    vec2 diff = center-uv;
    float len = length(diff);

    float circle = smoothstep(rad-width, rad, len - distortion) ;
    return circle;
}

//Avener Random FBM
mat2 rot2d (in float angle) {
        return mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
}

float r(in float a, in float b) { return fract(sin(dot(vec2(a, b), vec2(12.9898, 78.233))) * 43758.5453); }
float h(in float a) { return fract(sin(dot(a, dot(12.9898, 78.233))) * 43758.5453); }

float noise(in vec3 x) {
    vec3 p = floor(x);
    vec3 f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    float n = p.x + p.y * 57.0 + 113.0 * p.z;
    return mix(mix(mix(h(n + 0.0), h(n + 1.0), f.x),
        mix(h(n + 57.0), h(n + 58.0), f.x), f.y),
    mix(mix(h(n + 113.0), h(n + 114.0), f.x),
        mix(h(n + 170.0), h(n + 171.0), f.x), f.y), f.z);
}

// http://www.iquilezles.org/www/articles/morenoise/morenoise.htm
// http://www.pouet.net/topic.php?post=401468
vec3 dnoise2f(in vec2 p) {
    float i = floor(p.x), j = floor(p.y);
    float u = p.x - i, v = p.y - j;
    float du = 30. * u * u * (u * (u - 2.) + 1.);
    float dv = 30. * v * v * (v * (v - 2.) + 1.);
    u = u * u * u * (u * (u * 6. - 15.) + 10.);
    v = v * v * v * (v * (v * 6. - 15.) + 10.);
    float a = r(i, j);
    float b = r(i + 1.0, j);
    float c = r(i, j + 1.0);
    float d = r(i + 1.0, j + 1.0);
    float k0 = a;
    float k1 = b - a;
    float k2 = c - a;
    float k3 = a - b - c + d;
    return vec3(k0 + k1 * u + k2 * v + k3 * u * v,
    du * (k1 + k3 * v),
    dv * (k2 + k3 * u));
}

float fbm(in vec2 uv) {
    vec2 p = uv;
    float f, dx, dz, w = 0.5;
    f = dx = dz = 0.0;
    for (int i = 0; i < 3; ++i) {
    vec3 n = dnoise2f(uv);
    dx += n.y;
    dz += n.z;
    f += w * n.x / (1.0 + dx * dx + dz * dz);
    w *= 0.86;
    uv *= vec2(1.36);
    uv *= rot2d(1.25 * noise(vec3(p * 0.1, 0.12 * uTime)) +
        0.75 * noise(vec3(p * 0.1, 0.20 * uTime)));
    }
    return f;
}

float fbmLow(in vec2 uv) {
    float f, dx, dz, w = 0.5;
    f = dx = dz = 0.0;
    for (int i = 0; i < 3; ++i) {
    vec3 n = dnoise2f(uv);
    dx += n.y;
    dz += n.z;
    f += w * n.x / (1.0 + dx * dx + dz * dz);
    w *= 0.95;
    uv *= vec2(3);
    }
    return f;
}


vec2 zoom (in vec2 uv_1, in float zoom) {
    return (uv_1 - vec2(0.5)) / vec2(zoom) + vec2(0.5);
}

// Noise functions included above...

void main() {
    vec2 uv = vUv;

    // --- NAUSEA EFFECT START ---
    // Minecraft wobble:
    // x += sin(y * freq + time) * amp
    // y += cos(x * freq + time) * amp
    if (uNausea > 0.0) {
        float freq = 3.0; // Wobbly frequency
        float amp = 0.05 * uNausea; // Amplitude scales with nausea intensity
        float timeScale = uTime * 2.0;
        
        uv.x += sin(uv.y * freq + timeScale) * amp;
        uv.y += cos(uv.x * freq + timeScale) * amp;
    }
    // --- NAUSEA EFFECT END ---

    vec2 uv1 = getUvs(uPlaneRes, uMediaRes1, uv);
    vec2 uv2 = getUvs(uPlaneRes, uMediaRes2, uv);

    float progress = uTransitionProgress;
    
    // Create a wavy water surface line
    // The 'level' moves from -0.1 to 1.1 based on progress
    float level = mix(-0.1, 1.7, progress); 

    // Wave distortion
    float wave = sin(uv.x * 10.0 + uTime * 2.0) * 0.02;
    wave += sin(uv.x * 23.0 - uTime * 3.5) * 0.01;
    wave += noise(vec3(uv.x * 5.0, uTime, 0.0)) * 0.02;

    float surfaceY = level + wave;

    // Soft edge for the water surface
    float mixVal = smoothstep(surfaceY + 0.01, surfaceY - 0.01, uv.y);

    // Distortion near surface (refraction)
    float distortStrength = smoothstep(0.1, 0.0, abs(uv.y - surfaceY)) * 0.05;
    vec2 distortedUv2 = uv2 + vec2(
        sin(uv.y * 50.0 + uTime) * distortStrength, 
        cos(uv.x * 50.0 + uTime) * distortStrength
    );

    vec4 tex1 = texture2D(tMap1, uv1);
    vec4 tex2 = texture2D(tMap2, distortedUv2);

    // Underwater color correction (blulish tint and darkness)
    tex2.rgb *= vec3(0.8, 0.9, 1.0) * 0.6; // Keep the darkening from previous step

    // Chromatic aberration at the surface line
    float aberr = smoothstep(0.02, 0.0, abs(uv.y - surfaceY));
    if(aberr > 0.0) {
        float r = texture2D(tMap2, distortedUv2 + vec2(0.005 * aberr, 0.0)).r;
        float b = texture2D(tMap2, distortedUv2 - vec2(0.005 * aberr, 0.0)).b;
        tex2.r = mix(tex2.r, r, aberr);
        tex2.b = mix(tex2.b, b, aberr);
        // Add a bright "foam" line
        mixVal += aberr * 0.5 * (1.0 - progress); // Flash only during transition
    }

    // Final mix
    vec4 finalColor = mix(tex1, tex2, clamp(mixVal, 0.0, 1.0));

    // Deep ocean darkness at bottom when fully submerged
    float depth = smoothstep(0.8, 0.0, uv.y);
    float darkStrength = smoothstep(0.8, 1.0, progress); // Only apply darkness as we finish transition
    finalColor.rgb *= 1.0 - (depth * 0.3 * darkStrength);

    // --- NAUSEA PURPLE TINT START ---
    if (uNausea > 0.0) {
        // Minecraft Nether portal purple: vec3(0.3, 0.0, 0.5) roughly
        vec3 portalColor = vec3(0.35, 0.05, 0.6); 
        // Pulsate the tint strength slightly
        float pulse = 0.8 + 0.2 * sin(uTime * 4.0);
        // Mix heavily based on nausea, but preserve some original image
        finalColor.rgb = mix(finalColor.rgb, portalColor, uNausea * 0.6 * pulse);
        
        // Add a vignette for more portal feel
        float dist = length(vUv - 0.5);
        finalColor.rgb *= 1.0 - (dist * 0.8 * uNausea);
    }
    // --- NAUSEA PURPLE TINT END ---

    gl_FragColor = finalColor;
}
`;

const vertexShader = `
varying vec2 vUv;

void main()
{
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    vUv = uv;
}
`;

export const TransitionMaterial = shaderMaterial(
  {
    uTime: 0,
    uTransitionProgress: 0,
    uHoverProgress: 0,
    uVar1: 0,
    uVar2: 0,
    uVar3: 0,
    uPlaneRes: new THREE.Vector2(1, 1),
    uMediaRes1: new THREE.Vector2(1, 1),
    uMediaRes2: new THREE.Vector2(1, 1),
    uCanvasRes: new THREE.Vector2(1, 1),
    uMouse2D: new THREE.Vector2(0, 0),
    tMap1: null,
    tMap2: null,
    tMap3: null, // Unused but in uniforms
    uNausea: 0,
  },
  vertexShader,
  fragmentShader,
);

extend({ TransitionMaterial });

declare global {
  namespace JSX {
    interface IntrinsicElements {
      transitionMaterial: any;
    }
  }
}
