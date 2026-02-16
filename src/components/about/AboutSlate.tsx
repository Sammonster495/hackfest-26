"use client";

import { Download, MapPin } from "lucide-react";
import Image from "next/image";

export default function AboutSlate() {
  return (
    <div className="w-full max-w-7xl mx-auto p-4 md:p-8">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 auto-rows-min md:auto-rows-[180px]">
        <div className="md:col-span-12 md:row-span-2">
          <div className="relative group backdrop-blur-sm bg-black/40 border border-cyan-500/30 rounded-xl overflow-hidden hover:border-cyan-400/60 transition-colors h-full flex items-center justify-center text-center">
            <div className="h-full w-full p-6 relative z-10 flex flex-col justify-center items-center">
              <div className="flex flex-col items-center">
                <div className="relative w-20 h-20 md:w-24 md:h-24 mb-4">
                  <div className="absolute inset-0 bg-cyan-400/20 blur-xl rounded-full" />
                  <Image
                    src="/logos/glowingLogo.png"
                    fill
                    alt="HF Logo"
                    className="object-contain drop-shadow-[0_0_15px_rgba(34,211,238,0.6)]"
                  />
                </div>
                <h1 className="text-4xl md:text-6xl font-pirate text-cyan-100 drop-shadow-[0_0_10px_rgba(34,211,238,0.3)] leading-tight">
                  CodeQuest <br />
                  <span className="text-transparent bg-clip-text bg-linear-to-b from-cyan-300 to-blue-500">
                    The Grand Voyage
                  </span>
                </h1>
                <p className="mt-4 text-cyan-200/60 font-pirate tracking-widest uppercase text-xs md:text-sm border-t border-cyan-500/30 pt-4 w-full max-w-md mx-auto">
                  3 Day Long Sea Voyage
                </p>
              </div>
            </div>
            <div className="absolute inset-0 bg-linear-to-b from-cyan-500/5 to-transparent pointer-events-none" />
            <div className="absolute -inset-px border border-cyan-500/20 rounded-xl opacity-50 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
          </div>
        </div>

        <div className="md:col-span-4 md:row-span-1">
          <div className="relative group backdrop-blur-sm bg-black/40 border border-cyan-500/30 rounded-xl overflow-hidden hover:border-cyan-400/60 transition-colors h-full">
            <div className="h-full w-full p-6 relative z-10 flex flex-col justify-center">
              <div className="flex flex-col items-center justify-center h-full">
                <span className="text-cyan-500/50 font-pirate text-xl mb-1">
                  April
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-stone-400">17</span>
                  <span className="text-5xl font-black text-cyan-300 drop-shadow-[0_0_15px_rgba(34,211,238,0.5)]">
                    18
                  </span>
                  <span className="text-3xl font-black text-stone-400">19</span>
                </div>
                <span className="text-stone-500 font-mono text-xs tracking-[0.3em] mt-1">
                  2026
                </span>
              </div>
            </div>
            <div className="absolute inset-0 bg-linear-to-b from-cyan-500/5 to-transparent pointer-events-none" />
            <div className="absolute -inset-px border border-cyan-500/20 rounded-xl opacity-50 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
          </div>
        </div>

        <div className="md:col-span-4 md:row-span-2">
          <div className="relative group backdrop-blur-sm bg-black/40 border border-cyan-500/30 rounded-xl overflow-hidden hover:border-cyan-400/60 transition-colors h-full justify-start! text-justify">
            <div className="h-full w-full p-6 relative z-10 flex flex-col justify-center">
              <h3 className="text-xl font-pirate text-cyan-200 mb-4 border-b border-cyan-500/30 pb-2 inline-block w-full">
                What is Hackfest?
              </h3>
              <p className="text-stone-300 font-crimson text-lg leading-relaxed">
                NMAM Institute of Technology presents a national-level tech
                fest. A 36-hour hackathon where 60 teams from across the seas
                gather to foster innovation and showcase their skills in a
                50-hour marathon of code and creativity.
              </p>
            </div>
            <div className="absolute inset-0 bg-linear-to-b from-cyan-500/5 to-transparent pointer-events-none" />
            <div className="absolute -inset-px border border-cyan-500/20 rounded-xl opacity-50 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
          </div>
        </div>

        <div className="md:col-span-4 md:row-span-1">
          <div className="relative group backdrop-blur-sm bg-black/40 border border-cyan-500/30 rounded-xl overflow-hidden hover:border-cyan-400/60 transition-colors h-full">
            <div className="h-full w-full p-6 relative z-10 flex flex-col justify-center">
              <div className="flex flex-col items-center">
                <span className="text-5xl font-pirate text-cyan-300">
                  50Hrs
                </span>
                <span className="text-xs uppercase tracking-widest text-cyan-500/70 mt-1">
                  On-Site Event
                </span>
              </div>
            </div>
            <div className="absolute inset-0 bg-linear-to-b from-cyan-500/5 to-transparent pointer-events-none" />
            <div className="absolute -inset-px border border-cyan-500/20 rounded-xl opacity-50 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
          </div>
        </div>

        <div className="md:col-span-4 md:row-span-1">
          <div className="relative group backdrop-blur-sm bg-black/40 border border-cyan-500/30 rounded-xl overflow-hidden hover:border-cyan-400/60 transition-colors h-full">
            <div className="h-full w-full p-6 relative z-10 flex flex-col justify-center">
              <div className="flex flex-col items-center">
                <span className="text-5xl font-pirate text-cyan-100">
                  36Hrs
                </span>
                <span className="text-xs uppercase tracking-widest text-stone-500 mt-1">
                  Non-Stop Coding
                </span>
              </div>
            </div>
            <div className="absolute inset-0 bg-linear-to-b from-cyan-500/5 to-transparent pointer-events-none" />
            <div className="absolute -inset-px border border-cyan-500/20 rounded-xl opacity-50 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
          </div>
        </div>

        <div className="md:col-span-4 md:row-span-1">
          <div className="relative group backdrop-blur-sm bg-black/40 border border-cyan-500/30 rounded-xl overflow-hidden hover:border-cyan-400/60 transition-colors h-full">
            <div className="h-full w-full p-6 relative z-10 flex flex-col justify-center">
              <div className="flex flex-col items-center">
                <span className="text-5xl font-pirate text-amber-200">
                  5 Tracks
                </span>
                <span className="text-xs uppercase tracking-widest text-amber-500/50 mt-1">
                  Diverse Themes
                </span>
              </div>
            </div>
            <div className="absolute inset-0 bg-linear-to-b from-cyan-500/5 to-transparent pointer-events-none" />
            <div className="absolute -inset-px border border-cyan-500/20 rounded-xl opacity-50 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
          </div>
        </div>

        <div className="md:col-span-8 md:row-span-1">
          <div className="relative group backdrop-blur-sm rounded-xl overflow-hidden hover:border-cyan-400/60 transition-colors h-full bg-cyan-950/30 border border-amber-500/20">
            <div className="h-full w-full p-6 relative z-10 flex flex-col justify-center">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6 px-4">
                <div className="text-center md:text-left">
                  <span className="block text-stone-400 font-crimson text-sm uppercase tracking-widest mb-1">
                    Total Bounty
                  </span>
                  <span className="text-5xl font-pirate text-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.5)]">
                    ₹ 3,00,000+
                  </span>
                </div>

                <a
                  href="/"
                  className="group flex items-center gap-3 px-6 py-3 rounded-lg bg-cyan-900/40 border border-cyan-500/30 hover:bg-cyan-800/40 hover:border-cyan-400/50 transition-all shrink-0"
                >
                  <span className="font-pirate text-cyan-100 text-lg group-hover:text-cyan-300">
                    Brochure
                  </span>
                  <Download className="w-5 h-5 text-cyan-400 group-hover:text-cyan-200 transition-colors" />
                </a>
              </div>
            </div>
            <div className="absolute inset-0 bg-linear-to-b from-cyan-500/5 to-transparent pointer-events-none" />
            <div className="absolute -inset-px border border-cyan-500/20 rounded-xl opacity-50 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
          </div>
        </div>

        <div className="md:col-span-4 md:row-span-1">
          <div className="relative group backdrop-blur-sm bg-black/40 border border-cyan-500/30 rounded-xl overflow-hidden hover:border-cyan-400/60 transition-colors h-full opacity-80">
            <div className="h-full w-full p-6 relative z-10 flex flex-col justify-center">
              <div className="flex items-center gap-4 h-full">
                <MapPin className="w-8 h-8 text-cyan-500/50 shrink-0" />
                <div className="flex flex-col text-left">
                  <span className="text-stone-300 font-bold text-sm">
                    NMAM Institute of Technology
                  </span>
                  <span className="text-stone-500 text-xs mt-1">
                    Nitte, Karkala, Udupi District
                    <br />
                    Karnataka, India
                  </span>
                </div>
                <div className="relative w-12 h-12 ml-auto opacity-70 hover:opacity-100 transition-opacity">
                  <Image
                    src="/logos/flc_logo_crop.png"
                    alt="FLC Logo"
                    fill
                    className="object-contain"
                  />
                </div>
              </div>
            </div>
            <div className="absolute inset-0 bg-linear-to-b from-cyan-500/5 to-transparent pointer-events-none" />
            <div className="absolute -inset-px border border-cyan-500/20 rounded-xl opacity-50 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
          </div>
        </div>
      </div>
    </div>
  );
}
