"use client";

import { motion } from "framer-motion";
import { Download } from "lucide-react";
import Image from "next/image";

export default function BrochureDownload() {
  return (
    <motion.section
      className="w-full py-26 mt-6 flex flex-col items-center justify-center relative overflow-visible"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      transition={{ duration: 1 }}
      viewport={{ margin: "-100px" }}
    >
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[300px] bg-cyan-900/10 blur-3xl rounded-full pointer-events-none mix-blend-screen" />

      <motion.div
        className="relative z-10 max-w-5xl px-8 w-full"
        initial={{ y: 50, scale: 0.9 }}
        whileInView={{ y: 0, scale: 1 }}
        transition={{ type: "spring", bounce: 0.4, duration: 1.2 }}
      >
        <div className="relative overflow-hidden rounded-3xl border border-cyan-500/30 bg-black/40 backdrop-blur-sm shadow-[0_0_50px_rgba(6,182,212,0.15)] group pl-6">
          <div className="relative z-10 flex flex-col md:flex-row items-center p-8 md:p-12 gap-8 md:gap-12">
            <motion.div
              className="relative shrink-0 w-64 md:w-76 aspect-3/4 rounded-lg overflow-hidden border border-cyan-500/20 shadow-2xl -rotate-3 group-hover:rotate-0 transition-transform duration-500"
              whileHover={{ scale: 1.05, rotate: 0 }}
            >
              <Image
                src="/images/brochure/cover1.webp"
                alt="Brochure Cover"
                fill
                className="object-cover"
              />
            </motion.div>
            <div className="flex flex-col gap-4">
              <div className="flex-1 text-center md:text-left">
                <h3 className="text-4xl md:text-5xl font-pirate text-transparent bg-clip-text bg-linear-to-b from-cyan-100 to-cyan-400 drop-shadow-sm mb-3">
                  Captain's Log
                </h3>
                <p className="text-cyan-200/70 font-crimson text-lg md:text-xl leading-relaxed max-w-md mx-auto md:mx-0">
                  The complete map to the treasure. Uncover the schedule, rules,
                  and secrets of the voyage.
                </p>
              </div>

              <div className="relative shrink-0">
                <div className="absolute inset-0 bg-cyan-400/30 blur-2xl rounded-full scale-75 animate-pulse" />
                <motion.a
                  href="/"
                  whileHover={{
                    scale: 1.05,
                    textShadow: "0 0 8px rgb(255,255,255)",
                  }}
                  whileTap={{ scale: 0.95 }}
                  className="relative flex items-center justify-center gap-4 px-10 py-5 bg-linear-to-b from-cyan-600 to-cyan-800 text-white rounded-xl font-pirate text-2xl tracking-wide border-t border-cyan-400 shadow-[0_10px_20px_rgba(0,0,0,0.5),0_0_20px_rgba(6,182,212,0.4)] transition-all overflow-hidden"
                >
                  <span className="relative z-10">Acquire Map</span>
                  <Download className="w-6 h-6 relative z-10 animate-bounce" />

                  <div className="absolute inset-0 bg-linear-to-t from-black/20 to-transparent" />
                  <div className="absolute inset-0 bg-cyan-400/20 opacity-0 hover:opacity-100 transition-opacity duration-300" />
                </motion.a>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.section>
  );
}
