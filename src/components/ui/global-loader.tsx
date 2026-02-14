"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";

export function GlobalLoader() {
    const pathname = usePathname();
    const [loading, setLoading] = useState(true);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        if (pathname?.startsWith("/dashboard")) {
            setLoading(false);
            return;
        }

        setLoading(true);
        setProgress(0);

        const interval = setInterval(() => {
            setProgress((prev) => {
                if (prev >= 100) {
                    clearInterval(interval);
                    setTimeout(() => setLoading(false), 200);
                    return 100;
                }
                return prev + 2;
            });
        }, 30);

        return () => clearInterval(interval);
    }, [pathname]);

    return (
        <AnimatePresence>
            {loading && (
                <motion.div
                    className="fixed inset-0 z-100 flex items-center justify-center bg-neutral-950 text-amber-500 overflow-hidden"
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
            )}
        </AnimatePresence>
    );
}
