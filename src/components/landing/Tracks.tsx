"use client";

import { useTexture } from "@react-three/drei";
import { Canvas, extend, useFrame, useThree } from "@react-three/fiber";
import {
  AnimatePresence,
  motion,
  type PanInfo,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";
import Image from "next/image";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import type * as THREE from "three";
import { WaveTransitionMaterial } from "./shader/WaveTransitionMaterial";

// Register the custom shader material
extend({ WaveTransitionMaterial });

// Track Data
const tracks = [
  {
    id: "fintech",
    title: "FinTech",
    image: "/images/tracks/FinTech.png",
  },
  {
    id: "healthcare",
    title: "Healthcare",
    image: "/images/tracks/Healthcare.png",
  },
  {
    id: "logistics",
    title: "Logistics",
    image: "/images/tracks/Logistics.png",
  },
  {
    id: "open-innovation",
    title: "Open Innovation",
    image: "/images/tracks/OpenInnovation.png",
  },
  {
    id: "sustainable-dev",
    title: "Sustainable Dev",
    image: "/images/tracks/SustainableDev.png",
  },
];

// Preload textures
const textureUrls = tracks.map((t) => t.image);

// --- Shader Scene Component ---
// Define the material type with its custom uniforms/properties
type WaveTransitionMaterialType = THREE.ShaderMaterial & {
  uTime: number;
  uTransitionProgress: number;
  uPlaneRes: THREE.Vector2;
  uMediaRes1: THREE.Vector2;
  uMediaRes2: THREE.Vector2;
  tMap1: THREE.Texture | null;
  tMap2: THREE.Texture | null;
};

function TrackImageShader({ activeIndex }: { activeIndex: number }) {
  const { viewport } = useThree();
  const materialRef = useRef<WaveTransitionMaterialType>(null);

  // Load all textures
  const textures = useTexture(textureUrls);

  // State for transition
  const [currentTextureIndex, setCurrentTextureIndex] = useState(activeIndex);
  const [prevTextureIndex, setPrevTextureIndex] = useState(activeIndex);
  const progressRef = useRef(0);
  const targetProgressRef = useRef(0);
  const isTransitioningRef = useRef(false);

  useEffect(() => {
    if (activeIndex !== currentTextureIndex) {
      setPrevTextureIndex(currentTextureIndex);
      setCurrentTextureIndex(activeIndex);
      progressRef.current = 0;
      targetProgressRef.current = 1;
      isTransitioningRef.current = true;
    }
  }, [activeIndex, currentTextureIndex]);

  useFrame((state, delta) => {
    if (materialRef.current) {
      materialRef.current.uTime = state.clock.elapsedTime;

      // Texture assignments
      const tex1 = textures[prevTextureIndex];
      const tex2 = textures[currentTextureIndex];

      // Ensure textures are valid before assigning to avoid WebGL errors
      if (tex1 && tex2) {
        materialRef.current.tMap1 = tex1;
        materialRef.current.tMap2 = tex2;

        // Resolution uniforms need to be set from the texture images
        if (tex1.image && tex2.image) {
          materialRef.current.uMediaRes1.set(
            (tex1.image as HTMLImageElement).width,
            (tex1.image as HTMLImageElement).height,
          );
          materialRef.current.uMediaRes2.set(
            (tex2.image as HTMLImageElement).width,
            (tex2.image as HTMLImageElement).height,
          );
        }
      }

      materialRef.current.uPlaneRes.set(viewport.width, viewport.height);

      // Animate progress
      if (isTransitioningRef.current) {
        // Smoothlerp
        const speed = 2.0;
        progressRef.current +=
          (targetProgressRef.current - progressRef.current) * speed * delta;

        // Snap to 1 when close
        if (Math.abs(targetProgressRef.current - progressRef.current) < 0.01) {
          progressRef.current = targetProgressRef.current;
          isTransitioningRef.current = false;
          // After transition completion, visually we are at texture 2.
          // Effectively prev becomes current for the next expected state, but logical state handles it.
        }
      } else {
        // Ensure it stays at 0 or 1 based on state, usually 1 after transition
        progressRef.current = 1;
      }

      materialRef.current.uTransitionProgress = progressRef.current;
    }
  });

  return (
    <mesh scale={[viewport.width, viewport.height, 1]}>
      <planeGeometry args={[1, 1]} />
      {/* @ts-ignore */}
      <waveTransitionMaterial
        ref={materialRef}
        key={WaveTransitionMaterial.key}
        transparent={true}
      />
    </mesh>
  );
}

// --- Desktop 3D Card with Shader ---
function TrackCard3D({ activeIndex }: { activeIndex: number }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseX = useSpring(x, { stiffness: 150, damping: 15 });
  const mouseY = useSpring(y, { stiffness: 150, damping: 15 });

  const rotateX = useTransform(mouseY, [-0.5, 0.5], ["15deg", "-15deg"]);
  const rotateY = useTransform(mouseX, [-0.5, 0.5], ["-15deg", "15deg"]);

  function handleMouseMove(event: React.MouseEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseXVal = event.clientX - rect.left;
    const mouseYVal = event.clientY - rect.top;
    const xPct = mouseXVal / width - 0.5;
    const yPct = mouseYVal / height - 0.5;
    x.set(xPct);
    y.set(yPct);
  }

  function handleMouseLeave() {
    x.set(0);
    y.set(0);
  }

  // Get current track data
  // const track = tracks[activeIndex]; // Not currently used

  return (
    <motion.div
      className="perspective-1000 w-full max-w-md aspect-square relative"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        perspective: 1000,
      }}
    >
      <motion.div
        className="w-full h-full relative rounded-2xl shadow-2xl overflow-hidden border border-cyan-500/30 bg-black/40 backdrop-blur-md"
        style={{
          rotateX: rotateX,
          rotateY: rotateY,
          transformStyle: "preserve-3d",
        }}
      >
        {/* Shader Layer */}
        <div className="absolute inset-0 z-0">
          <Canvas>
            <TrackImageShader activeIndex={activeIndex} />
          </Canvas>

          {/* Dark Gradient Overlay for text readability */}
          <div className="absolute inset-0 bg-linear-to-t from-black/40 via-black/10 to-transparent pointer-events-none" />
        </div>

        {/* Border Glow */}
        <div
          className="absolute inset-0 border-2 border-cyan-500/20 rounded-2xl pointer-events-none"
          style={{ transform: "translateZ(20px)" }}
        />
      </motion.div>
    </motion.div>
  );
}

// --- Mobile Swipe Stack ---
function MobileTrackStack() {
  const [activeIndex, setActiveIndex] = useState(0);

  const handleDragEnd = (
    _event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo,
  ) => {
    if (info.offset.x > 100) {
      // Swipe Right (Previous)
      setActiveIndex((prev) => (prev - 1 + tracks.length) % tracks.length);
    } else if (info.offset.x < -100) {
      // Swipe Left (Next)
      setActiveIndex((prev) => (prev + 1) % tracks.length);
    }
  };

  const activeTrack = tracks[activeIndex];

  return (
    <div className="flex flex-col items-center justify-center p-4 w-full h-[45vh] relative">
      <div className="relative w-full max-w-xs aspect-square">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeIndex}
            className="absolute inset-0 w-full h-full bg-black/40 backdrop-blur-md border border-cyan-500/30 rounded-2xl overflow-hidden shadow-2xl"
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            onDragEnd={handleDragEnd}
            initial={{ opacity: 0, x: 50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1, rotate: 0 }}
            exit={{ opacity: 0, x: -50, scale: 0.9, rotate: -5 }}
            transition={{ duration: 0.3 }}
            whileDrag={{ scale: 1.05, cursor: "grabbing" }}
          >
            <Image
              src={activeTrack.image}
              alt={activeTrack.title}
              fill
              className="object-cover opacity-80"
              draggable={false}
            />
            <div className="absolute inset-0 bg-linear-to-t from-black via-transparent to-transparent" />

            <div className="absolute bottom-0 left-0 w-full p-6">
              <h3 className="text-2xl font-bold font-crimson text-cyan-400 mb-2 tracking-wide">
                {activeTrack.title}
              </h3>
              <div className="mt-4 flex gap-1 justify-center">
                {tracks.map((track, i) => (
                  <div
                    key={track.id}
                    className={`h-1 rounded-full transition-all duration-300 ${i === activeIndex ? "w-6 bg-cyan-400" : "w-1 bg-cyan-800"}`}
                  />
                ))}
              </div>
            </div>

            {/* Swipe Hint */}
            <div className="absolute top-4 right-4 bg-black/50 backdrop-blur rounded-full px-3 py-1 text-xs text-cyan-400 border border-cyan-500/30">
              Swipe &harr;
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

// --- Main Component ---
export default function TracksSection() {
  const [activeTab, setActiveTab] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  // Preload textures on mount
  useEffect(() => {
    useTexture.preload(textureUrls);
  }, []);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return (
    <section className="relative w-full py-32 px-4 flex flex-col items-center justify-center overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-1/4 left-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="container mx-auto max-w-6xl z-10">
        <motion.h2
          className="text-5xl md:text-7xl font-pirate font-black text-center mb-8 text-transparent bg-clip-text bg-linear-to-b from-yellow-300 to-yellow-600 drop-shadow-[0_4px_10px_rgba(0,0,0,0.5)] tracking-wider"
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          Tracks
        </motion.h2>

        {isMobile ? (
          <MobileTrackStack />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center h-[600px]">
            {/* Left Side: Fixed List with Animated Selection */}
            <div
              className="md:col-span-5 flex flex-col items-start justify-center relative h-full"
              style={{ perspective: "1000px" }}
            >
              <div
                className="relative flex flex-col items-start gap-2 w-full"
                style={{ transformStyle: "preserve-3d" }}
              >
                {tracks.map((track, index) => {
                  const isActive = activeTab === index;

                  return (
                    <motion.button
                      key={track.id}
                      onClick={() => setActiveTab(index)}
                      className="relative group text-left px-6 py-3 rounded-xl w-full"
                      style={{
                        transformStyle: "preserve-3d",
                      }}
                      animate={{
                        scale: isActive ? 1.08 : 1,
                        x: isActive ? 15 : 0,
                        z: isActive ? 30 : 0,
                      }}
                      transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 30,
                      }}
                      whileHover={{
                        scale: isActive ? 1.08 : 1.03,
                        x: isActive ? 15 : 5,
                      }}
                    >
                      {/* Glow background for active item */}
                      <motion.div
                        className="absolute inset-0 rounded-xl bg-gradient-to-r from-cyan-500/30 via-cyan-400/20 to-transparent"
                        animate={{
                          opacity: isActive ? 1 : 0,
                          boxShadow: isActive
                            ? "inset 0 0 20px rgba(34, 211, 238, 0.1)"
                            : "inset 0 0 0px rgba(34, 211, 238, 0)",
                        }}
                        transition={{ duration: 0.3 }}
                      />

                      {/* Active indicator bar */}
                      <motion.div
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-cyan-400 rounded-full"
                        animate={{
                          opacity: isActive ? 1 : 0,
                          scaleY: isActive ? 1 : 0,
                          boxShadow: isActive
                            ? "0 0 10px rgba(34, 211, 238, 0.8)"
                            : "0 0 0px rgba(34, 211, 238, 0)",
                        }}
                        transition={{ duration: 0.2 }}
                      />

                      {/* Track title */}
                      <motion.span
                        className="relative z-10 text-xl md:text-4xl font-crimson font-bold tracking-wide whitespace-nowrap pl-4"
                        animate={{
                          color: isActive ? "#67e8f9" : "#9ca3af",
                          textShadow: isActive
                            ? "0 0 20px rgba(103, 232, 249, 0.6), 0 0 40px rgba(103, 232, 249, 0.3)"
                            : "0 0 0px rgba(103, 232, 249, 0), 0 0 0px rgba(103, 232, 249, 0)",
                        }}
                        transition={{ duration: 0.3 }}
                      >
                        {track.title}
                      </motion.span>
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Right Side: 3D Display used to have AnimatePresence, now manages state internally */}
            <div className="md:col-span-7 flex justify-center items-center perspective-1000">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full flex justify-center"
              >
                <TrackCard3D activeIndex={activeTab} />
              </motion.div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
