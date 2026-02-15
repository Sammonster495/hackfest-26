"use client";

import {
  Scroll,
  ScrollControls,
  useScroll,
  useTexture,
} from "@react-three/drei";
import { Canvas, extend, useFrame, useThree } from "@react-three/fiber";
import { motion } from "framer-motion";
import type { Session } from "next-auth";
import { Suspense, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { useDayNight } from "~/components/providers/useDayNight";
import Footer from "./Footer";
import { Navbar } from "./Navbar";
import { TransitionMaterial } from "./shader/TransitionMaterial";
import Timeline from "./Timeline";
import TracksSection from "./Tracks";

// Register the custom shader material
extend({ TransitionMaterial });

// Preload textures to avoid pop-in
useTexture.preload([
  "/images/morning.webp",
  "/images/night.webp",
  "/images/underwater.png",
]);

function Background({ isNight }: { isNight: boolean }) {
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
      const swayFactor =
        1 - THREE.MathUtils.smoothstep(scroll.offset, 0.1, 0.3);

      if (swayFactor > 0.001) {
        // Roll (z-axis) - faster rocking
        meshRef.current.rotation.z =
          (Math.sin(time * 0.8) * 0.015 + Math.sin(time * 2.3) * 0.005) *
          swayFactor;

        // Pitch (x-axis) - gentle forward/back movement
        meshRef.current.rotation.x =
          (Math.sin(time * 0.6) * 0.01 + Math.sin(time * 1.5) * 0.003) *
          swayFactor;

        // Yaw (y-axis) - very subtle turning to feel alive
        meshRef.current.rotation.y = Math.sin(time * 0.4) * 0.005 * swayFactor;

        // Heave (y-axis position) - realistic bobbing on waves
        meshRef.current.position.y =
          (Math.sin(time * 1.2) * 0.03 + Math.sin(time * 2.5) * 0.01) *
          swayFactor;

        // Sway (x-axis position) - drifting
        meshRef.current.position.x = Math.sin(time * 0.7) * 0.01 * swayFactor;
      } else {
        // Reset to neutral when scrolled down
        meshRef.current.rotation.set(0, 0, 0);
        meshRef.current.position.set(0, 0, 0);
      }
    }

    if (materialRef.current) {
      materialRef.current.uTime = time * 0.6;
      const progress = scroll.range(0.05, 0.14);
      materialRef.current.uTransitionProgress = progress;
      materialRef.current.uHoverProgress = state.pointer.x * 0.5 + 0.5;

      const currentSunImg = (
        isNight ? night.image : morning.image
      ) as HTMLImageElement;

      const waterImg = underwater.image as HTMLImageElement;
      if (currentSunImg && waterImg) {
        // Use the scaled viewport for resolution to keep aspect ratio consistent
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

      // Nausea Effect Logic - always calming down now since loading is handled globally
      materialRef.current.uNausea = THREE.MathUtils.lerp(
        materialRef.current.uNausea,
        0,
        0.02,
      );

      materialRef.current.uIsNight = THREE.MathUtils.lerp(
        materialRef.current.uIsNight,
        isNight ? 1.0 : 0.0,
        0.05,
      );
    }
  });

  return (
    // Scaled up to cover edges when rotating
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

function LandingContent({
  setPages,
  pages,
}: {
  setPages: (pages: number) => void;
  pages: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [, setContentHeight] = useState<number>(0);

  useEffect(() => {
    const calculatePages = () => {
      if (ref.current) {
        const { height } = ref.current.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        // Exact pages needed for content
        const newPages = Math.max(3, height / viewportHeight);

        // Only update if difference is significant
        if (Math.abs(newPages - pages) > 0.02) {
          setPages(newPages);
        }
        setContentHeight(height);
      }
    };

    const observer = new ResizeObserver(() => {
      calculatePages();
    });

    if (ref.current) {
      observer.observe(ref.current);
      calculatePages();
    }

    window.addEventListener("resize", calculatePages);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", calculatePages);
    };
  }, [setPages, pages]);

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
      style={{
        minHeight: "100dvh",
      }}
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
          <h1 className="text-5xl md:text-8xl font-pirate font-black tracking-wider drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)] text-white">
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
        <div className="relative">
          <div className="absolute inset-0 bg-linear-to-b from-transparent via-black/20 to-black/50 pointer-events-none z-0" />

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
                className="text-5xl md:text-7xl font-pirate font-bold text-center mb-16 drop-shadow-[0_0_15px_rgba(0,200,255,0.8)] text-cyan-200 tracking-wide"
                initial={{ scale: 0.9, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.8 }}
              >
                Our Sponsors
              </motion.h2>

              <motion.div
                className="flex flex-col items-center mb-12"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
              >
                <div className="group relative w-72 md:w-96 aspect-video bg-white/70 backdrop-blur-sm border-2 border-cyan-400/50 rounded-2xl flex items-center justify-center hover:border-cyan-300 transition-all duration-500 overflow-hidden shadow-[0_0_25px_rgba(0,200,255,0.2)] hover:shadow-[0_0_40px_rgba(0,200,255,0.4)]">
                  <img
                    src="/logos/nitte.png"
                    alt="NITTE"
                    className="w-3/4 h-auto object-contain group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <span className="mt-3 text-sm font-mono font-semibold tracking-[0.3em] uppercase text-cyan-300/80">
                  Executive Sponsor
                </span>
              </motion.div>

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

          {/* TIMELINE SECTION */}
          <Timeline />

          {/* DEEP SEA (PRIZE POOL) */}
          <motion.section
            className="flex flex-col items-center justify-center relative px-4 py-8"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 1.5 }}
          >
            <div className="relative z-10 flex flex-col items-center text-center w-full pt-16 pb-8">
              <motion.h2
                className="text-5xl md:text-7xl font-pirate font-black text-center mb-16 text-transparent bg-clip-text bg-linear-to-b from-yellow-200 to-yellow-600 drop-shadow-[0_0_15px_rgba(250,204,21,0.5)] tracking-wide"
                initial={{ opacity: 0, y: -20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
              >
                Prize Pool
              </motion.h2>

              {/* ─── MASSIVE AMOUNT ─── */}
              <motion.div
                className="relative mb-20 flex flex-col items-center"
                initial={{ scale: 0.8, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", bounce: 0.4, duration: 1.2 }}
              >
                {/* Animated glow rings */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 md:w-96 md:h-96 rounded-full border border-yellow-500/10 animate-[ping_4s_ease-in-out_infinite]" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 md:w-72 md:h-72 rounded-full border border-yellow-500/20 animate-[ping_3s_ease-in-out_infinite_0.5s]" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 md:w-[28rem] md:h-[28rem] rounded-full bg-yellow-500/5 blur-3xl" />

                {/* The number */}
                <span className="text-sm md:text-lg font-mono font-bold tracking-[0.5em] text-yellow-400/60 uppercase mb-2">
                  Worth Over
                </span>
                <span
                  className="text-8xl md:text-[12rem] font-black font-sans leading-none tracking-tight"
                  style={{
                    color: "#eab308",
                    textShadow:
                      "0 0 40px rgba(234,179,8,0.5), 0 0 80px rgba(234,179,8,0.3), 0 0 120px rgba(234,179,8,0.15)",
                  }}
                >
                  ₹3L
                  <span className="text-yellow-400/70">+</span>
                </span>
                <span className="text-lg md:text-2xl font-pirate text-yellow-300/50 tracking-[0.3em] mt-2">
                  IN PRIZES
                </span>
              </motion.div>

              {/* <Link href="/timeline" passHref>
              <button
                type="button"
                className="group relative px-10 py-4 bg-cyan-600 hover:bg-cyan-500 text-white rounded-full font-pirate font-bold text-2xl transition-all hover:scale-105 hover:shadow-[0_0_40px_rgba(6,182,212,0.6)] overflow-hidden focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-black tracking-wide"
                // Prevent scroll on focus
                onFocus={(e) => {
                  e.preventDefault();
                }}
              >
                <span className="relative z-10">Explore Timeline</span>
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
              </button>
            </Link> */}
            </div>
          </motion.section>
        </div>
        <div className="mt-auto w-full">
          <Footer />
        </div>
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
        <Navbar isUnderwater={isUnderwater} session={session} />
      </div>

      <Canvas
        className="canvas1"
        gl={{ antialias: true, alpha: false }}
        dpr={[1, 1.5]}
        color="black"
      >
        <Suspense fallback={null}>
          <ScrollControls pages={pages} damping={0.2}>
            <ScrollSync setUnderwater={setIsUnderwater} />
            <Background isNight={isNight} />
            {/* Scroll content */}
            <Scroll
              html
              style={{
                width: "100%",
                height: "100%",
              }}
            >
              <LandingContent setPages={setPages} pages={pages} />
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
        .canvas1 {
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
