"use client";

import {
  Scroll,
  ScrollControls,
  useScroll,
  useTexture,
} from "@react-three/drei";
import { Canvas, extend, useFrame, useThree } from "@react-three/fiber";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import type { Session } from "next-auth";
import { Suspense, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import Footer from "./Footer";
import { Navbar } from "./Navbar";
import { TransitionMaterial } from "./shader/TransitionMaterial";
import TracksSection from "./Tracks";

// Register the custom shader material
extend({ TransitionMaterial });

// Preload textures to avoid pop-in
useTexture.preload(["/sunny.jpeg", "/images/underwater.png"]);

function Background({
  loaded,
  loadingProgress,
}: {
  loaded: boolean;
  loadingProgress: number;
}) {
  const { viewport } = useThree();
  const materialRef = useRef<any>(null);
  const scroll = useScroll();
  const [sunny, underwater] = useTexture([
    "/sunny.jpeg",
    "/images/underwater.png",
  ]) as [THREE.Texture, THREE.Texture];

  useFrame((state) => {
    if (materialRef.current) {
      // Slow down time to avoid frantic repetition
      materialRef.current.uTime = state.clock.elapsedTime * 0.6;

      const progress = scroll.range(0.1, 0.25);
      materialRef.current.uTransitionProgress = progress;

      // Interaction
      materialRef.current.uHoverProgress = state.pointer.x * 0.5 + 0.5;

      // Resolution uniforms
      const sunImg = sunny.image as HTMLImageElement;
      const waterImg = underwater.image as HTMLImageElement;
      if (sunImg && waterImg) {
        materialRef.current.uPlaneRes.set(viewport.width, viewport.height);
        materialRef.current.uMediaRes1.set(sunImg.width, sunImg.height);
        materialRef.current.uMediaRes2.set(waterImg.width, waterImg.height);
      }

      // Nausea Effect Logic
      if (loaded) {
        materialRef.current.uNausea = THREE.MathUtils.lerp(
          materialRef.current.uNausea,
          0,
          0.02,
        );
      } else {
        const targetNausea = loadingProgress / 100;
        materialRef.current.uNausea = THREE.MathUtils.lerp(
          materialRef.current.uNausea,
          targetNausea,
          0.1,
        );
      }
    }
  });

  return (
    <mesh scale={[viewport.width, viewport.height, 1]}>
      <planeGeometry args={[1, 1]} />
      {/* @ts-ignore */}
      <transitionMaterial
        ref={materialRef}
        tMap1={sunny}
        tMap2={underwater}
        transparent={true}
        opacity={1}
      />
    </mesh>
  );
}

function LoadingScreen({ progress }: { progress: number }) {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950 text-amber-500 overflow-hidden"
      initial={{ opacity: 1 }}
      exit={{
        backgroundColor: "#000000",
        opacity: 0,
        transition: {
          backgroundColor: { duration: 0.5, ease: "easeInOut" },
          opacity: { duration: 0.8, delay: 0.5, ease: "easeInOut" },
        },
      }}
    >
      {/* 1. BACKGROUND: Subtle Radial Gradient for depth (Deep Sea Vibe) */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,var(--tw-gradient-stops))] from-neutral-900 via-neutral-950 to-black opacity-80" />

      {/* 2. CENTER: Big Cinematic Text to fill the void */}
      <div className="relative z-10 flex flex-col items-center space-y-4">
        <motion.img
          src="/logos/Logo@4x-8.png"
          alt="HF Logo"
          className="w-64 md:w-120 h-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1, duration: 1, ease: "easeIn" }}
          exit={{ opacity: 0, transition: { duration: 0.3 } }}
        />
      </div>

      {/* 3. TOP RIGHT: The Logo (Watermark style) */}
      <motion.div
        className="absolute top-8 right-8 z-20 md:top-12 md:right-12"
        exit={{ opacity: 0, transition: { duration: 0.3 } }}
      >
        <div className="relative w-16 h-16 md:w-20 md:h-20 opacity-90 hover:opacity-100 transition-opacity">
          <Image
            src="/logos/glowingLogo.png"
            alt="Logo"
            fill
            className="object-contain drop-shadow-[0_0_15px_rgba(245,158,11,0.5)]"
          />
        </div>
      </motion.div>

      {/* 4. BOTTOM RIGHT: The Wheel Spinner & Progress */}
      <motion.div
        className="absolute bottom-8 right-8 z-20 flex items-center gap-4 md:bottom-12 md:right-12"
        exit={{ opacity: 0, transition: { duration: 0.3 } }}
      >
        {/* Percentage Text */}
        <div className="text-right">
          <span className="block text-2xl font-bold font-mono tabular-nums leading-none">
            {Math.round(progress)}%
          </span>
          <span className="text-[10px] text-amber-500/60 font-mono tracking-widest uppercase">
            Loading Assets
          </span>
        </div>

        {/* Spinning Wheel */}
        <motion.div
          className="relative w-16 h-16 md:w-20 md:h-20"
          animate={{ rotate: 360 }}
          transition={{
            repeat: Infinity,
            duration: 8, // Slower rotation feels heavier/larger
            ease: "linear",
          }}
        >
          {/* Using standard img tag if motion.img causes issues with Next.js Image component, 
               otherwise wrap Next Image in motion.div like this */}
          <Image
            src="/steering.png"
            alt="Loading..."
            fill
            className="object-contain"
          />
        </motion.div>
      </motion.div>

      {/* OPTIONAL: Bottom Left decorative coordinates/version number */}
      <motion.div
        className="absolute bottom-10 left-10 hidden md:block text-xs font-mono text-neutral-600"
        exit={{ opacity: 0, transition: { duration: 0.3 } }}
      >
        LAT: 24.55.01 N <br /> LON: 78.12.00 W
      </motion.div>
    </motion.div>
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
          <div className="absolute inset-0 bg-linear-to-b from-transparent via-black/80 to-black/100 pointer-events-none -z-10" />

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
  const [loaded, setLoaded] = useState(false);
  const [pages, setPages] = useState(3);
  const [progress, setProgress] = useState(0);
  const [isUnderwater, setIsUnderwater] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    // Simulate loading progress
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setLoaded(true);
          return 100;
        }
        return prev + 2;
      });
    }, 50);
    return () => clearInterval(interval);
  }, []);

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
      {/* Loading Screen Overlay */}
      <AnimatePresence>
        {!loaded && <LoadingScreen progress={progress} />}
      </AnimatePresence>

      {loaded && (
        <div className="absolute inset-0 pointer-events-none z-40">
          <Navbar isUnderwater={isUnderwater} session={session} />
        </div>
      )}

      <Canvas
        gl={{ antialias: true, alpha: false }}
        dpr={[1, 1.5]}
        color="black"
      >
        <Suspense fallback={null}>
          <ScrollControls pages={pages} damping={0.2}>
            <ScrollSync setUnderwater={setIsUnderwater} />
            <Background loaded={loaded} loadingProgress={progress} />
            <Scroll
              html
              style={{
                width: "100vw",
                height: "120vh",
                opacity: loaded ? 1 : 0,
                transition: "opacity 1s ease-in-out",
              }}
            >
              <LandingContent setPages={setPages} />
            </Scroll>
          </ScrollControls>
        </Suspense>
      </Canvas>

      {/* CSS for custom keyframe animations */}
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
