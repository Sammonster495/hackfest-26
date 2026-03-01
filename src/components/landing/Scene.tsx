/** biome-ignore-all lint/performance/noImgElement: <TODO: MIGHT CHANGE LATER> */
"use client";

import { useTexture } from "@react-three/drei";
import { Canvas, extend, useFrame, useThree } from "@react-three/fiber";
import { useAnimationFrame } from "framer-motion";
import Lenis from "lenis";
import Link from "next/link";
import type { Session } from "next-auth";
import { Suspense, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { useDayNight } from "~/components/providers/useDayNight";
import BrochureDownload from "./Brochure";
import FAQSection from "./FAQ";
import Footer from "./Footer";
import { Navbar } from "./Navbar";
import { TransitionMaterial } from "./shader/TransitionMaterial";
import Timeline from "./Timeline";
import TracksSection from "./Tracks";

// Register the custom shader material
extend({ TransitionMaterial });

// Preload textures to avoid pop-in
useTexture.preload([
  "/images/morningnew3.webp",
  "/images/night.webp",
  "/images/underwater.webp",
]);

function Background({
  isNight,
  scrollRef,
}: {
  isNight: boolean;
  scrollRef: React.MutableRefObject<number>;
}) {
  const { viewport } = useThree();
  const meshRef = useRef<THREE.Mesh>(null);
  // biome-ignore lint/suspicious/noExplicitAny: <TODO: MIGHT CHANGE LATER>
  const materialRef = useRef<any>(null);
  const dampedProgress = useRef(0);

  const [morning, night, underwater] = useTexture([
    "/images/morningnew3.webp",
    "/images/night.webp",
    "/images/underwater.webp",
  ]) as [THREE.Texture, THREE.Texture, THREE.Texture];

  useFrame((state, delta) => {
    const time = state.clock.elapsedTime;

    // Smooth damping for "sloppy" feel
    // With Lenis controlling scroll, we can reduce this or keep it for extra "float"
    // Lambda 2.5 + Lenis smoothing = very fluid underwater feel
    dampedProgress.current = THREE.MathUtils.damp(
      dampedProgress.current,
      scrollRef.current,
      2.5,
      delta,
    );

    const progress = dampedProgress.current;

    // Boat sway effect
    if (meshRef.current) {
      // Fade out sway between scroll 0.1 (start of transition) and 0.3 (deep in water)
      // smoothstep returns 0->1 between min/max, so 1 - smoothstep gives 1->0
      const swayFactor = 1 - THREE.MathUtils.smoothstep(progress, 0.1, 0.3);

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
      // Use damped progress for smoother transition
      const transitionProgress = Math.max(
        0,
        Math.min(1, (progress - 0.05) / 0.1),
      );
      materialRef.current.uTransitionProgress = transitionProgress;
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

      // Nausea Effect Logic
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

function FixedHero({
  isNight,
  scrollRef,
}: {
  isNight: boolean;
  scrollRef: React.MutableRefObject<number>;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useAnimationFrame(() => {
    if (containerRef.current) {
      const progress = scrollRef.current;
      const opacity = 1 - THREE.MathUtils.smoothstep(progress, 0, 0.08);
      const scale = 1 - progress * 2;

      containerRef.current.style.opacity = opacity.toString();
      containerRef.current.style.transform = `scale(${Math.max(0, scale)})`;

      containerRef.current.style.visibility =
        opacity <= 0.001 ? "hidden" : "visible";
    }
  });

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-0 flex flex-col items-center justify-center pointer-events-none"
    >
      <div className="flex h-screen flex-col items-center justify-center relative p-8 text-center">
        <div className="z-10 flex flex-col items-center">
          {/* LOGO */}
          <div className="relative pointer-events-auto flex flex-col items-center">
            <div className="flex flex-col items-center mb-0">
              <img
                src="/logos/nmamit.png"
                alt="NMAMIT Logo"
                className={`w-59 md:w-60 xl:w-64 h-auto drop-shadow-md mb-1 ${isNight ? "brightness-0 invert" : ""}`}
              />
              <span className="text-white/80 font-inter tracking-[0.2em] font-semibold uppercase text-xs">
                Presents
              </span>
            </div>
            <div className="absolute -z-10" />
            <img
              src="/logo11.webp"
              alt="HF Logo"
              className="w-84 xl:w-140 h-auto drop-shadow-2xl mb-6 hover:scale-105 transition-transform duration-500"
            />
          </div>

          {/* PLANK */}
          <div className="mt-8 flex flex-col items-center pointer-events-auto">
            <div
              className="relative px-4 py-8 transform -rotate-2 animate-[float_4s_ease-in-out_infinite]"
              style={{
                filter: "drop-shadow(0 10px 10px rgba(0,0,0,0.5))",
              }}
            >
              <div
                className="absolute inset-0 bg-[#34211e] rounded-sm"
                style={{
                  clipPath: "polygon(2% 0%, 98% 5%, 100% 100%, 0% 95%)",
                  backgroundImage:
                    "repeating-linear-gradient(90deg, rgba(255,255,255,0.03) 0px, rgba(255,255,255,0.03) 1px, transparent 1px, transparent 12px), repeating-linear-gradient(0deg, rgba(0,0,0,0.1) 0px, rgba(0,0,0,0.1) 1px, transparent 1px, transparent 20px)",
                }}
              />
              <div
                className="absolute inset-0 bg-black/20"
                style={{
                  clipPath: "polygon(2% 0%, 98% 5%, 100% 100%, 0% 95%)",
                }}
              />

              <div className="absolute top-2 left-4 w-3 h-3 rounded-full bg-[#1a0f0a] shadow-[inset_1px_1px_2px_rgba(255,255,255,0.2)]" />
              <div className="absolute top-3 right-5 w-3 h-3 rounded-full bg-[#1a0f0a] shadow-[inset_1px_1px_2px_rgba(255,255,255,0.2)]" />

              <div className="relative z-10">
                <p
                  className="text-xl xl:text-3xl font-crimson font-bold italic text-[#d7ccc8] tracking-widest drop-shadow-md opacity-90"
                  style={{ transform: "rotate(1deg)" }}
                >
                  Codequest: The Grand Voyage
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* SCROLL INDICATOR */}
        <div className="absolute bottom-0 z-20 pointer-events-auto">
          <div className="flex flex-col items-center gap-2 animate-bounce">
            <p className="text-xs font-crimson tracking-[0.3em] uppercase text-white/70">
              Dive Deeper
            </p>
            <div className="text-xl xl:text-3xl font-bold text-white/70">
              Scroll Down
            </div>
            <svg
              className="w-6 h-6 text-white/70"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              role="img"
              aria-label="Scroll down arrow"
            >
              <title>Scroll down arrow</title>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M19 14l-7 7m0 0l-7-7m7 7V3"
              />
            </svg>
          </div>
        </div>
      </div>
    </div>
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [, setContentHeight] = useState<number>(0);

  useEffect(() => {
    const calculatePages = () => {
      if (ref.current) {
        const { height } = ref.current.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        // Exact pages needed for content
        const newPages = height / viewportHeight;

        // Only update if difference is significant
        if (Math.abs(newPages - pages) > 0.01) {
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
      if (target && typeof target.scrollIntoView === "function") {
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
      className="w-full text-white no-scrollbar pointer-events-none"
    >
      <section className="h-screen w-full relative z-0"></section>

      {/* SPACER FOR TRANSITION - Optional extra space before sponsors */}
      <section className="h-[10vh]"></section>

      <div className="relative pointer-events-auto z-10">
        <div className="absolute inset-0 bg-linear-to-b from-transparent via-black/20 to-black/50 pointer-events-none z-0" />

        {/* UNDERWATER SECTION (SPONSORS) */}
        <section className="flex flex-col items-center justify-start pt-12 relative px-4">
          <div className="w-full max-w-6xl">
            <h2 className="text-5xl md:text-7xl font-pirate font-bold text-center mb-16 drop-shadow-[0_0_15px_rgba(0,200,255,0.8)] text-cyan-200 tracking-wide">
              Our Sponsor
            </h2>

            <div className="flex flex-col items-center mb-4">
              <Link href="https://nitte.edu.in/nmamit/" target="_blank">
                <div className="group relative w-72 md:w-96 aspect-video bg-white/70 border-2 border-cyan-400/50 rounded-2xl flex items-center justify-center hover:border-cyan-300 transition-all duration-500 overflow-hidden hover:shadow-[0_0_40px_rgba(0,200,255,0.4)]">
                  <img
                    src="/logos/nitte.png"
                    alt="NITTE"
                    className="w-3/4 h-auto object-contain scale-90 group-hover:scale-95 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </Link>
              <span className="mt-3 text-sm font-crimson font-semibold tracking-[0.3em] uppercase text-cyan-300/80">
                Executive Sponsor
              </span>
            </div>

            {/* <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div
                  className="group relative aspect-video bg-black/30 border border-cyan-500/30 rounded-xl flex items-center justify-center hover:bg-cyan-900/40 transition-all duration-500 overflow-hidden"
                  key={i}
                >
                  <span className="text-cyan-400 font-crimson text-lg group-hover:scale-110 transition-transform">
                    Sponsor {i}
                  </span>
                  <div className="absolute inset-0 bg-linear-to-t from-cyan-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              ))}
            </div> */}
          </div>
        </section>

        <BrochureDownload />

        {/* TRACKS SECTION */}
        <TracksSection />

        {/* TIMELINE SECTION */}
        <Timeline />

        {/* DEEP SEA (PRIZE POOL) */}
        <section className="flex flex-col items-center justify-center relative px-4 py-8">
          <div className="relative z-10 flex flex-col items-center text-center w-full pt-16 pb-8">
            <h2 className="text-5xl md:text-7xl font-pirate font-black text-center mb-16 text-transparent bg-clip-text bg-linear-to-b from-yellow-200 to-yellow-600 md:drop-shadow-[0_0_15px_rgba(250,204,21,0.5)] tracking-wide">
              Prize Pool
            </h2>

            {/* ─── MASSIVE AMOUNT ─── */}
            <div className="relative mb-20 flex flex-col items-center">
              {/* Animated glow rings */}
              <div className="hidden md:block absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 md:w-96 md:h-96 rounded-full border border-yellow-500/10" />
              <div className="hidden md:block absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 md:w-72 md:h-72 rounded-full border border-yellow-500/20" />

              {/* The number */}
              <span className="text-sm md:text-lg font-crimson font-bold tracking-[0.5em] text-yellow-400/60 uppercase mb-2">
                Worth
              </span>
              <span
                className="text-7xl md:text-[12rem] font-black font-pirata leading-none tracking-tight"
                style={{
                  color: "#eab308",
                  textShadow:
                    "0 0 20px rgba(234,179,8,0.5), 0 0 40px rgba(234,179,8,0.2)",
                }}
              >
                ₹4,00,000
                <span className="text-yellow-400/70">+</span>
              </span>

              <Link href="/timeline" passHref>
                <button
                  type="button"
                  className="group relative px-10 py-4 bg-cyan-600 hover:bg-cyan-500 text-white rounded-full font-pirate font-bold text-2xl transition-all hover:scale-105 md:hover:shadow-[0_0_40px_rgba(6,182,212,0.6)] overflow-hidden focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-black tracking-wide mt-8"
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
          </div>
        </section>
        <FAQSection />

        <Footer overlayNeeded={true} />
      </div>
    </div>
  );
}

function ScrollSync({
  setUnderwater,
  scrollRef,
}: {
  setUnderwater: (v: boolean) => void;
  scrollRef: React.MutableRefObject<number>;
}) {
  const isUnderwaterRef = useRef(false);

  useFrame(() => {
    // Check raw progress for responsive state toggle
    // or we could check damped progress if passed down.
    // Using raw progress (scrollRef.current) ensures UI snaps when user scrolls past threshold quickly.
    const isNowUnderwater = scrollRef.current > 0.15;

    if (isUnderwaterRef.current !== isNowUnderwater) {
      isUnderwaterRef.current = isNowUnderwater;
      setUnderwater(isNowUnderwater);
    }
  });

  return null;
}

// Lenis updater component inside Canvas to hook into useFrame loop
function LenisUpdater({
  lenisRef,
  scrollRef,
  htmlElement,
}: {
  lenisRef: React.MutableRefObject<Lenis | null>;
  scrollRef: React.MutableRefObject<number>;
  htmlElement: HTMLDivElement | null;
}) {
  useFrame((state) => {
    if (lenisRef.current) {
      // Update Lenis
      lenisRef.current.raf(state.clock.elapsedTime * 1000);

      // Sync custom scroll ref for 3D logic
      if (htmlElement) {
        const scrollTop = htmlElement.scrollTop;
        const maxScroll = htmlElement.scrollHeight - htmlElement.clientHeight;
        const progress = maxScroll > 0 ? scrollTop / maxScroll : 0;
        scrollRef.current = progress;
      }
    }
  });

  return null;
}

export default function Scene({ session }: { session: Session | null }) {
  const [pages, setPages] = useState(3);
  const [isUnderwater, setIsUnderwater] = useState(false);

  // Refactor: Use useRef instead of useState for scroll progress to prevent re-renders
  const scrollRef = useRef(0);
  const lenisRef = useRef<Lenis | null>(null);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const htmlScrollRef = useRef<HTMLDivElement>(null);
  const { isNight } = useDayNight();

  // Initialize Lenis
  useEffect(() => {
    const htmlElement = htmlScrollRef.current;
    if (!htmlElement) return;

    // Initialize Lenis
    const lenis = new Lenis({
      wrapper: htmlElement, // The container with overflow: auto
      content: htmlElement.firstElementChild as HTMLElement, // The content inside
      duration: 1.0, // Slower duration for "stronger" smooth effect
      easing: (t) => Math.min(1, 1.001 - 2 ** (-10 * t)), // Custom easing
      smoothWheel: true,
      syncTouch: true,
      touchMultiplier: 2,
    });

    lenisRef.current = lenis;

    // Cleanup
    return () => {
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  useEffect(() => {
    document.documentElement.classList.add("scene-active");
    return () => {
      document.documentElement.classList.remove("scene-active");
    };
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

        // Also scroll Lenis to element if needed
        lenisRef.current?.scrollTo(focusableElements[nextIndex]);
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
      {/* HTML Content Layer */}
      <div
        ref={htmlScrollRef}
        className="absolute inset-0 overflow-y-auto overflow-x-hidden no-scrollbar"
        style={{ zIndex: 10, touchAction: "pan-y" }}
      >
        <FixedHero isNight={isNight} scrollRef={scrollRef} />
        <LandingContent setPages={setPages} pages={pages} />
      </div>

      <div className="absolute inset-0 pointer-events-none z-40">
        {/* The Navbar component itself handles pointer-events-auto for buttons */}
        <Navbar isUnderwater={isUnderwater} session={session} />
      </div>
      <Canvas
        className="canvas1"
        gl={{ antialias: true, alpha: false }}
        dpr={[1, 1.5]}
        camera={{ position: [0, 0, 5] }}
        eventSource={scrollContainerRef as React.RefObject<HTMLElement>}
        eventPrefix="client"
      >
        <Suspense fallback={null}>
          <LenisUpdater
            lenisRef={lenisRef}
            scrollRef={scrollRef}
            htmlElement={htmlScrollRef.current}
          />
          <ScrollSync setUnderwater={setIsUnderwater} scrollRef={scrollRef} />
          <Background isNight={isNight} scrollRef={scrollRef} />
        </Suspense>
      </Canvas>
      <style jsx global>{`
        @keyframes float {
          0%,
          100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-20px) rotate(2deg);
          }
        }

        /* Lock viewport to prevent mobile browser chrome from causing layout shifts */
        .scene-active,
        .scene-active body {
          overflow-x: hidden;
          -webkit-overflow-scrolling: touch;
          /* Prevent address bar resize from affecting layout */
          position: fixed;
          width: 100%;
          height: 100%;
        }

        /* Fix for iOS Safari */
        @supports (-webkit-touch-callout: none) {
          .scene-active,
          .scene-active body {
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
          pointer-events: none !important;
          z-index: 0 !important;
        }
      `}</style>
    </div>
  );
}
