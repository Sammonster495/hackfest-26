"use client";

import {
  Scroll,
  ScrollControls,
  useScroll,
  useTexture,
} from "@react-three/drei";
import { Canvas, extend, useFrame, useThree } from "@react-three/fiber";
import { motion } from "framer-motion";
import Link from "next/link";
import type { Session } from "next-auth";
import { Suspense, useEffect, useRef, useState } from "react";
import { useDayNight } from "~/components/providers/useDayNight"
import * as THREE from "three";
import Footer from "./Footer";
import { Navbar } from "./Navbar";
import { TransitionMaterial } from "./shader/TransitionMaterial";
import TracksSection from "./Tracks";

// Register the custom shader material
extend({ TransitionMaterial });

// Preload textures to avoid pop-in
useTexture.preload([
  "/images/morning.webp",
  "/images/night.webp",
  "/images/underwater.png",
]);

function Background({
  isNight,
}: {
  isNight: boolean;
}) {
  const { viewport } = useThree();
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<any>(null);
  const scroll = useScroll();
  const [morning, night, underwater] = useTexture([
    "/images/morning.webp",
    "/images/night.webp",
    "/images/underwater.png",
  ]) as [THREE.Texture, THREE.Texture, THREE.Texture];

  useFrame((state) => {
    const time = state.clock.elapsedTime;

    // Boat sway effect
    // Boat sway effect
    if (meshRef.current) {
      // Fade out sway between scroll 0.1 (start of transition) and 0.3 (deep in water)
      // smoothstep returns 0->1 between min/max, so 1 - smoothstep gives 1->0
      const swayFactor = 1 - THREE.MathUtils.smoothstep(scroll.offset, 0.1, 0.3);

      if (swayFactor > 0.001) {
        // Roll (z-axis) - faster rocking
        meshRef.current.rotation.z = (Math.sin(time * 0.8) * 0.015 + Math.sin(time * 2.3) * 0.005) * swayFactor;

        // Pitch (x-axis) - gentle forward/back movement
        meshRef.current.rotation.x = (Math.sin(time * 0.6) * 0.01 + Math.sin(time * 1.5) * 0.003) * swayFactor;

        // Yaw (y-axis) - very subtle turning to feel alive
        meshRef.current.rotation.y = (Math.sin(time * 0.4) * 0.005) * swayFactor;

        // Heave (y-axis position) - realistic bobbing on waves
        meshRef.current.position.y = (Math.sin(time * 1.2) * 0.03 + Math.sin(time * 2.5) * 0.01) * swayFactor;

        // Sway (x-axis position) - drifting
        meshRef.current.position.x = (Math.sin(time * 0.7) * 0.01) * swayFactor;
      } else {
        // Reset to neutral when scrolled down
        meshRef.current.rotation.set(0, 0, 0);
        meshRef.current.position.set(0, 0, 0);
      }
    }

    if (materialRef.current) {
      materialRef.current.uTime = time * 0.6;
      const progress = scroll.range(0.1, 0.25);
      materialRef.current.uTransitionProgress = progress;
      materialRef.current.uHoverProgress = state.pointer.x * 0.5 + 0.5;

      const currentSunImg = (isNight ? night.image : morning.image) as HTMLImageElement;

      const waterImg = underwater.image as HTMLImageElement;
      if (currentSunImg && waterImg) {
        // Use the scaled viewport for resolution to keep aspect ratio consistent
        materialRef.current.uPlaneRes.set(viewport.width * 1.1, viewport.height * 1.1);
        materialRef.current.uMediaRes1.set(currentSunImg.width, currentSunImg.height);
        materialRef.current.uMediaRes2.set(waterImg.width, waterImg.height);
      }

      // Nausea Effect Logic - always calming down now since loading is handled globally
      materialRef.current.uNausea = THREE.MathUtils.lerp(
        materialRef.current.uNausea,
        0,
        0.02,
      );

      materialRef.current.uIsNight = THREE.MathUtils.lerp(
        materialRef.current.uIsNight,
        isNight ? 1.0 : 0.0,
        0.05
      );
    }
  });

  return (
    // Scaled up to cover edges when rotating
    <mesh ref={meshRef} scale={[viewport.width * 1.1, viewport.height * 1.1, 1]}>
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

function LandingContent({ setPages }: { setPages: (pages: number) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const initialViewportHeight = useRef<number>(0);
  const hasCalculated = useRef(false);
  const [contentHeight, setContentHeight] = useState<number>(0);

  useEffect(() => {
    const calculatePages = () => {
      if (ref.current && !hasCalculated.current) {
        // Lock to initial viewport height on first calculation
        if (initialViewportHeight.current === 0) {
          initialViewportHeight.current = window.innerHeight;
        }

        const { height } = ref.current.getBoundingClientRect();
        // Always use the locked initial viewport height
        const newPages = Math.max(3, height / initialViewportHeight.current);
        setPages(newPages);

        // Set minimum content height to ensure footer stays at bottom
        const minHeight = newPages * initialViewportHeight.current;
        setContentHeight(Math.max(minHeight, height));

        hasCalculated.current = true;
      }
    };

    const observer = new ResizeObserver(() => {
      // Only calculate once on initial mount
      if (!hasCalculated.current) {
        calculatePages();
      }
    });

    if (ref.current) {
      observer.observe(ref.current);
      calculatePages();
    }

    // Only listen to actual window resize (orientation change, desktop resize)
    // Ignore mobile browser chrome changes
    const handleResize = () => {
      // Only recalculate on significant width changes (orientation/desktop resize)
      // This ignores mobile browser chrome height changes
      const widthChanged =
        Math.abs(
          window.innerWidth -
          initialViewportHeight.current *
          (window.innerWidth / window.innerHeight),
        ) > 100;

      if (widthChanged && ref.current) {
        hasCalculated.current = false;
        initialViewportHeight.current = window.innerHeight;
        calculatePages();
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", handleResize);
    };
  }, [setPages]);

  // Prevent default scroll behavior when focusing on elements
  useEffect(() => {
    const preventFocusScroll = (e: FocusEvent) => {
      e.preventDefault();
      const target = e.target as HTMLElement;
      if (target) {
        // Scroll into view without affecting the 3D scroll system
        target.scrollIntoView({
          behavior: "instant",
          block: "nearest",
          inline: "nearest",
        });
      }
    };

    document.addEventListener("focus", preventFocusScroll, true);

    return () => {
      document.removeEventListener("focus", preventFocusScroll, true);
    };
  }, []);

  return (
    <div
      ref={ref}
      className="w-full text-white no-scrollbar pointer-events-auto flex flex-col"
      style={{ minHeight: contentHeight > 0 ? `${contentHeight}px` : "100vh" }}
    >
      {/* Main content wrapper */}
      <div className="flex-1">
        {/* HERITAGE SECTION (SUNNY) */}
        <motion.section
          className="h-screen flex flex-col items-center justify-center relative p-8 text-center bg-linear-to-b from-black/20 via-transparent to-transparent"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.5 }}
          viewport={{ once: true }}
        >
          <img
            src="/logo.png"
            alt="HF Logo"
            className="w-48 md:w-64 h-auto drop-shadow-2xl z-10 mb-8 translate-x-8"
          />
          <h1 className="text-5xl md:text-8xl font-black tracking-tighter drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)] text-white">
            HACKFEST '26
          </h1>
          <p className="mt-6 text-xl md:text-2xl font-medium drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] text-white/90 max-w-2xl bg-black/20 backdrop-blur-sm p-4 rounded-xl border border-white/10">
            Embark on a voyage of innovation.
          </p>
          <div className="absolute bottom-12">
            <p className="text-sm font-semibold tracking-widest uppercase opacity-80 animate-pulse">
              Scroll to Dive
            </p>
          </div>
        </motion.section>

        {/* SPACER FOR TRANSITION */}
        <section className="h-[10vh]"></section>

        {/* UNDERWATER SECTION (SPONSORS) */}
        <motion.section
          className="flex flex-col items-center justify-start pt-12 relative px-4"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 1 }}
          viewport={{ margin: "-100px" }}
        >
          <div className="w-full max-w-6xl">
            <motion.h2
              className="text-4xl md:text-6xl font-bold text-center mb-16 drop-shadow-[0_0_15px_rgba(0,200,255,0.8)] text-cyan-200"
              initial={{ scale: 0.9, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.8 }}
            >
              Our Sponsors
            </motion.h2>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <motion.div
                  key={i}
                  className="group relative aspect-video bg-black/30 backdrop-blur-sm border border-cyan-500/30 rounded-xl flex items-center justify-center hover:bg-cyan-900/40 transition-all duration-500 overflow-hidden"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  viewport={{ once: true }}
                >
                  <span className="text-cyan-400 font-mono text-lg group-hover:scale-110 transition-transform">
                    Sponsor {i}
                  </span>
                  <div className="absolute inset-0 bg-linear-to-t from-cyan-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>

        {/* TRACKS SECTION */}
        <TracksSection />

        {/* DEEP SEA (PRIZE POOL) */}
        <motion.section
          className="min-h-[80vh] flex flex-col items-center justify-center relative px-4 py-10"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 1.5 }}
        >
          {/* Darkening overlay */}
          <div className="absolute inset-0 bg-linear-to-b from-transparent via-black/20 to-black/60 pointer-events-none -z-10" />

          <div className="relative z-10 flex flex-col items-center text-center w-full pb-16">
            <motion.h2
              className="text-4xl md:text-6xl font-black text-center mb-30 text-transparent bg-clip-text bg-linear-to-b from-yellow-200 to-yellow-600 drop-shadow-[0_0_15px_rgba(250,204,21,0.5)]"
              initial={{ opacity: 0, y: -20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              Prize Pool
            </motion.h2>

            <motion.div
              className="relative mb-30 flex w-full justify-center"
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              transition={{ type: "spring", bounce: 0.5, duration: 1.5 }}
            >
              <img
                src="/treasure.webp"
                alt="Treasure"
                className="w-[90%] h-[90%] md:w-2/3 md:h-2/3 drop-shadow-2xl relative z-10 animate-[float_4s_ease-in-out_infinite]"
              />
            </motion.div>

            <Link href="/timeline" passHref>
              <button
                type="button"
                className="group relative px-10 py-4 bg-cyan-600 hover:bg-cyan-500 text-white rounded-full font-bold text-xl transition-all hover:scale-105 hover:shadow-[0_0_40px_rgba(6,182,212,0.6)] overflow-hidden focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-black"
                // Prevent scroll on focus
                onFocus={(e) => {
                  e.preventDefault();
                }}
              >
                <span className="relative z-10">Explore Timeline</span>
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
              </button>
            </Link>
          </div>
        </motion.section>
      </div>
      <div className="mt-auto w-full">
        <Footer />
      </div>
    </div>
  );
}

export default function Scene({ session }: { session: Session | null }) {
  const [pages, setPages] = useState(3);
  const [isUnderwater, setIsUnderwater] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { isNight } = useDayNight();

  function ScrollSync({
    setUnderwater,
  }: {
    setUnderwater: (v: boolean) => void;
  }) {
    const scroll = useScroll();

    useFrame(() => {
      const offset = scroll.offset; // 0 → 1
      setUnderwater(offset > 0.15);
    });

    return null;
  }

  // Prevent keyboard navigation from breaking scroll sync
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent tab key from causing scroll jumps
      if (e.key === "Tab") {
        e.preventDefault();

        // Manually handle tab navigation
        const focusableElements = Array.from(
          document.querySelectorAll<HTMLElement>(
            'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
          ),
        );

        const currentIndex = focusableElements.indexOf(
          document.activeElement as HTMLElement,
        );

        let nextIndex: number;
        if (e.shiftKey) {
          nextIndex =
            currentIndex <= 0 ? focusableElements.length - 1 : currentIndex - 1;
        } else {
          nextIndex =
            currentIndex >= focusableElements.length - 1 ? 0 : currentIndex + 1;
        }

        focusableElements[nextIndex]?.focus({ preventScroll: true });
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <div
      ref={scrollContainerRef}
      className="fixed top-0 left-0 w-full h-screen bg-black"
      style={{
        zIndex: 0,
        // Use dvh (dynamic viewport height) for better mobile support
        height: "100dvh",
      }}
    >
      <div className="absolute inset-0 pointer-events-none z-40">
        {/* The Navbar component itself handles pointer-events-auto for buttons */}
        <Navbar
          isUnderwater={isUnderwater}
          session={session}
        />
      </div>

      <Canvas
        gl={{ antialias: true, alpha: false }}
        dpr={[1, 1.5]}
        color="black"
      >
        <Suspense fallback={null}>
          <ScrollControls key={pages} pages={pages} damping={0.2}>
            <ScrollSync setUnderwater={setIsUnderwater} />
            <Background
              isNight={isNight}
            />
            {/* Scroll content */}
            <Scroll
              html
              style={{
                width: "100vw",
                height: "120vh",
              }}
            >
              <LandingContent setPages={setPages} />
            </Scroll>
          </ScrollControls>
        </Suspense>
      </Canvas>
      <style jsx global>{`
        @keyframes float {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            50% { transform: translateY(-20px) rotate(2deg); }
        }
        
        /* Lock viewport to prevent mobile browser chrome from causing layout shifts */
        html, body {
          overflow-x: hidden;
          -webkit-overflow-scrolling: touch;
          /* Prevent address bar resize from affecting layout */
          position: fixed;
          width: 100%;
          height: 100%;
        }
        
        /* Fix for iOS Safari */
        @supports (-webkit-touch-callout: none) {
          html, body {
            height: -webkit-fill-available;
          }
        }
        
        /* Ensure the canvas container uses fixed dimensions */
        canvas {
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
