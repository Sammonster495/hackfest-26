"use client";

export const dynamic = "force-dynamic";

import Link from "next/link";
import { useDayNight } from "~/components/providers/useDayNight";

export default function NotFound() {
  const { isNight } = useDayNight();

  const desktopSrc = isNight
    ? "/images/404-dark.webp"
    : "/images/404-light.webp";
  const mobileSrc = isNight
    ? "/images/404-dark-mobile.webp"
    : "/images/404-light-mobile.webp";

  return (
    <main className="relative min-h-screen w-full overflow-hidden bg-black">
      {/* ── DESKTOP background (md+) ── */}
      {/* biome-ignore lint/performance/noImgElement: static 404 page */}
      <img
        src={desktopSrc}
        alt=""
        aria-hidden="true"
        className="hidden md:block absolute inset-0 w-full h-full object-cover object-center opacity-90 transition-opacity duration-700"
      />
      {/* Desktop gradient: heavy on the right so right-side text is readable */}
      <div className="hidden md:block absolute inset-0 bg-linear-to-l from-black/90 via-black/50 to-black/10 pointer-events-none" />
      <div className="hidden md:block absolute bottom-0 left-0 right-0 h-1/3 bg-linear-to-t from-black/60 to-transparent pointer-events-none" />

      {/* ── MOBILE background (below md) ── */}
      {/* biome-ignore lint/performance/noImgElement: static 404 page */}
      <img
        src={mobileSrc}
        alt=""
        aria-hidden="true"
        className="block md:hidden absolute inset-0 w-full h-full object-cover object-bottom opacity-90 transition-opacity duration-700"
      />
      {/* Mobile gradient: heavy at the top so top-text is readable, fades out toward the submarine */}
      <div className="block md:hidden absolute inset-0 bg-linear-to-b from-black/90 via-black/50 to-black/10 pointer-events-none" />
      <div className="block md:hidden absolute bottom-0 left-0 right-0 h-1/4 bg-linear-to-t from-black/40 to-transparent pointer-events-none" />

      {/* ── DESKTOP content — right-aligned, vertically centered ── */}
      <div className="hidden md:flex relative z-10 min-h-screen items-center justify-end px-8 md:px-20">
        <div className="flex flex-col items-start gap-6 max-w-lg">
          <span className="text-sm font-mono font-bold tracking-[0.5em] text-cyan-400/80 uppercase">
            Error 404
          </span>

          <h1 className="text-6xl md:text-8xl font-pirate font-black tracking-wider text-white drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)] leading-tight">
            Lost at
            <br />
            <span className="text-transparent bg-clip-text bg-linear-to-r from-cyan-300 to-cyan-500">
              Sea
            </span>
          </h1>

          <p className="text-xl md:text-2xl font-crimson text-white/75 italic leading-relaxed">
            Our submarine took a wrong turn. The page you&apos;re navigating to
            has sunk to the ocean floor.
          </p>

          <Link href="/" passHref>
            <button
              type="button"
              className="group relative px-10 py-4 bg-cyan-600 hover:bg-cyan-500 text-white rounded-full font-pirate font-bold text-2xl transition-all hover:scale-105 hover:shadow-[0_0_40px_rgba(6,182,212,0.6)] overflow-hidden focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-black tracking-wide mt-2"
            >
              <span className="relative z-10">Return to Surface</span>
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
            </button>
          </Link>
        </div>
      </div>

      {/* ── MOBILE content — top-aligned, centered ── */}
      <div className="flex md:hidden relative z-10 min-h-screen items-start justify-center px-6 pt-16">
        <div className="flex flex-col items-center text-center gap-5 max-w-sm">
          <span className="text-xs font-mono font-bold tracking-[0.5em] text-cyan-400/80 uppercase">
            Error 404
          </span>

          <h1 className="text-6xl font-pirate font-black tracking-wider text-white drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)] leading-tight">
            Lost at
            <br />
            <span className="text-transparent bg-clip-text bg-linear-to-r from-cyan-300 to-cyan-500">
              Sea
            </span>
          </h1>

          <p className="text-lg font-crimson text-white/75 italic leading-relaxed">
            Our submarine took a wrong turn. The page you&apos;re navigating to
            has sunk to the ocean floor.
          </p>

          <Link href="/" passHref>
            <button
              type="button"
              className="group relative px-8 py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-full font-pirate font-bold text-xl transition-all hover:scale-105 hover:shadow-[0_0_40px_rgba(6,182,212,0.6)] overflow-hidden focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-black tracking-wide mt-1"
            >
              <span className="relative z-10">Return to Surface</span>
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
            </button>
          </Link>
        </div>
      </div>
    </main>
  );
}
