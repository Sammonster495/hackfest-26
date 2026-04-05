"use client";

import { Download } from "lucide-react";
import Image from "next/image";

export default function BrochureDownload() {
  return (
    <section className="w-full py-12 mt-6 flex flex-col items-center justify-center relative overflow-visible">
      <div className="hidden md:block absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[300px] bg-cyan-900/10 blur-3xl rounded-full pointer-events-none mix-blend-screen" />

      <div className="relative z-10 max-w-5xl px-8 w-full">
        <div className="relative overflow-hidden rounded-3xl border border-cyan-500/30 bg-black/70 md:bg-black/40 md:backdrop-blur-sm shadow-[0_0_30px_rgba(6,182,212,0.15)] group">
          <div className="relative z-10 flex flex-col md:flex-row items-center p-8 md:p-12 gap-8 md:gap-12">
            <div className="relative shrink-0 w-64 md:w-76 aspect-3/4 rounded-lg overflow-hidden border border-cyan-500/20 shadow-2xl -rotate-3 hover:rotate-0 hover:scale-105 transition-transform duration-500">
              <Image
                src="/images/brochure/cover1.webp"
                alt="Brochure Cover"
                fill
                className="object-cover"
              />
            </div>
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
                <div className="absolute inset-0 bg-cyan-400/30 blur-xl md:blur-2xl rounded-full scale-75 md:animate-pulse" />
                <a
                  href="/images/brochure/Hackfest26Brochure.pdf"
                  download
                  className="relative flex items-center justify-center gap-4 px-10 py-5 bg-linear-to-b from-cyan-600 to-cyan-800 text-white rounded-xl font-pirate text-2xl tracking-wide border-t border-cyan-400 shadow-[0_10px_20px_rgba(0,0,0,0.5),0_0_20px_rgba(6,182,212,0.4)] transition-all hover:scale-105 hover:shadow-[0_0_8px_rgb(255,255,255)] active:scale-95 overflow-hidden"
                >
                  <span className="relative z-10">Acquire Map</span>
                  <Download className="w-6 h-6 relative z-10 animate-bounce" />

                  <div className="absolute inset-0 bg-linear-to-t from-black/20 to-transparent" />
                  <div className="absolute inset-0 bg-cyan-400/20 opacity-0 hover:opacity-100 transition-opacity duration-300" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
