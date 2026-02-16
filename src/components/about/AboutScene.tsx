"use client";

import { useTexture } from "@react-three/drei";
import { Canvas, extend, useFrame, useThree } from "@react-three/fiber";
import { Suspense, useRef } from "react";
import * as THREE from "three";
import { TransitionMaterial } from "~/components/landing/shader/TransitionMaterial";

extend({ TransitionMaterial });

function AboutBackground({ isNight }: { isNight: boolean }) {
  const { viewport } = useThree();
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<any>(null);

  const [morning, night, underwater] = useTexture([
    "/images/morningnew3.webp",
    "/images/night.webp",
    "/images/underwater.webp",
  ]) as [THREE.Texture, THREE.Texture, THREE.Texture];

  useFrame((state) => {
    const time = state.clock.elapsedTime;

    if (materialRef.current) {
      materialRef.current.uTime = time * 0.6;
      materialRef.current.uTransitionProgress = 1.0;
      materialRef.current.uHoverProgress = state.pointer.x * 0.5 + 0.5;

      const currentSunImg = (
        isNight ? night.image : morning.image
      ) as HTMLImageElement;

      const waterImg = underwater.image as HTMLImageElement;

      if (currentSunImg && waterImg) {
        materialRef.current.uPlaneRes.set(
          viewport.width * 1.1,
          viewport.height * 1.1,
        );
        materialRef.current.uMediaRes1.set(
          currentSunImg.width,
          currentSunImg.height,
        );
        materialRef.current.uMediaRes2.set(waterImg.width, waterImg.height);
      }

      materialRef.current.uIsNight = THREE.MathUtils.lerp(
        materialRef.current.uIsNight,
        isNight ? 1.0 : 0.0,
        0.05,
      );
    }
  });

  return (
    <mesh
      ref={meshRef}
      scale={[viewport.width * 1.1, viewport.height * 1.1, 1]}
    >
      <planeGeometry args={[1, 1]} />
      {/* @ts-ignore */}
      <transitionMaterial
        ref={materialRef}
        tMap1={isNight ? night : morning}
        tMap2={underwater}
        transparent={true}
        opacity={1}
      />
    </mesh>
  );
}

export default function AboutScene() {
  return (
    <div className="fixed inset-0 w-full h-full -z-10 bg-black/80">
      <Canvas
        className="canvas-about"
        gl={{ antialias: true, alpha: false }}
        dpr={[1, 1.25]}
      >
        <Suspense fallback={null}>
          <AboutBackground isNight={true} />
        </Suspense>
      </Canvas>

      <style jsx global>{`
        .canvas-about {
          position: fixed !important;
          top: 0;
          left: 0;
          width: 100vw !important;
          height: 100vh !important;
        }
      `}</style>
    </div>
  );
}
