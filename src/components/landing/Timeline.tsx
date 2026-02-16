"use client";

import { motion } from "framer-motion";
import { Anchor, Scroll, Ship, Telescope, Trophy } from "lucide-react";

const timelineEvents = [
  {
    day: "16",
    month: "FEB",
    year: "2026",
    title: "The Voyage Begins",
    description: "Registration Opens - Hoist the sails and gather your crew!",
    icon: Ship,
    accent: "#facc15",
    accentRgb: "250,204,21",
  },
  {
    day: "16",
    month: "MAR",
    year: "2026",
    title: "Port Closed",
    description: "Registration Ends - The docks are sealed, no more crews.",
    icon: Scroll,
    accent: "#f87171",
    accentRgb: "248,113,113",
  },
  {
    day: "26",
    month: "MAR",
    year: "2026",
    title: "The Captain's Call",
    description: "Shortlist Announced - Only the worthiest ships proceed.",
    icon: Telescope,
    accent: "#22d3ee",
    accentRgb: "34,211,238",
  },
  {
    day: "17-19",
    month: "APR",
    year: "2026",
    title: "The Deep Dive",
    label: "36 HOURS",
    description: "36 Hours of Hackathon - Code through the stormy seas!",
    icon: Anchor,
    accent: "#60a5fa",
    accentRgb: "96,165,250",
  },
  {
    day: "19",
    month: "APR",
    year: "2026",
    title: "Treasure Found",
    description:
      "Results Announced - The chest is cracked open, legends are crowned!",
    icon: Trophy,
    accent: "#eab308",
    accentRgb: "234,179,8",
  },
];

export default function Timeline() {
  return (
    <section className="relative w-full py-4 md:py-1 overflow-hidden">
      {/* Ambient glows */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-900/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-900/5 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-24"
        >
          <h2 className="text-5xl md:text-7xl font-pirate font-black text-transparent bg-clip-text bg-linear-to-b from-cyan-200 to-blue-600 drop-shadow-[0_4px_10px_rgba(0,0,0,0.5)] tracking-wider">
            Voyage Logs
          </h2>
          <p className="mt-4 text-lg md:text-xl text-cyan-200/60 font-pirate tracking-wide">
            Chart your course through the treacherous waters
          </p>
        </motion.div>

        <div className="relative max-w-5xl mx-auto">
          {/* Central rope — Desktop */}
          <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px -translate-x-1/2">
            <div className="w-full h-full bg-linear-to-b from-transparent via-cyan-500/40 to-transparent" />
            <div className="absolute inset-0 w-full bg-linear-to-b from-transparent via-cyan-400/20 to-transparent animate-pulse" />
          </div>

          {/* Left rope — Mobile */}
          <div className="md:hidden absolute left-6 top-0 bottom-0 w-px">
            <div className="w-full h-full bg-linear-to-b from-transparent via-cyan-500/40 to-transparent" />
          </div>

          <div className="flex flex-col gap-20 md:gap-28">
            {timelineEvents.map((event, index) => (
              <TimelineItem key={event.title} event={event} index={index} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function TimelineItem({
  event,
  index,
}: {
  event: (typeof timelineEvents)[number];
  index: number;
}) {
  const isEven = index % 2 === 0;
  const Icon = event.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ margin: "-80px" }}
      transition={{ duration: 0.6, delay: index * 0.08 }}
      className={`relative flex items-center flex-row ${
        isEven ? "md:flex-row" : "md:flex-row-reverse"
      }`}
    >
      <div className="hidden md:block w-1/2" />

      {/* Node on the rope */}
      <div className="absolute left-6 md:left-1/2 -translate-x-1/2 z-20 flex items-center justify-center">
        <div
          className="absolute w-20 h-20 rounded-full opacity-10"
          style={{ backgroundColor: event.accent, filter: "blur(20px)" }}
        />
        <div
          className="w-14 h-14 rounded-full bg-black/80 border-2 backdrop-blur-xl flex items-center justify-center z-10 shadow-lg"
          style={{ borderColor: event.accent }}
        >
          <Icon className="w-6 h-6" style={{ color: event.accent }} />
        </div>
      </div>

      {/* Card */}
      <div
        className={`w-full md:w-1/2 pl-20 md:pl-0 pr-2 ${
          isEven ? "md:pr-14 md:pl-0" : "md:pl-14 md:pr-0"
        }`}
      >
        <motion.div
          initial={{ x: isEven ? -20 : 20, opacity: 0 }}
          whileInView={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 + index * 0.08 }}
          className="relative group"
        >
          {/* biome-ignore lint/a11y/noStaticElementInteractions: Hover effect only */}
          <div
            className="relative overflow-hidden bg-black/40 border rounded-2xl transition-all duration-500"
            style={{
              borderColor: `rgba(${event.accentRgb}, 0.2)`,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = `rgba(${event.accentRgb}, 0.5)`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = `rgba(${event.accentRgb}, 0.2)`;
            }}
          >
            <div
              className={`flex items-center gap-4 p-6 md:p-8 pb-2 md:pb-3 ${
                isEven ? "md:flex-row-reverse md:text-right" : ""
              }`}
            >
              {/* Big day number */}
              <div className="relative shrink-0">
                <span
                  className={`${event.label ? "text-5xl md:text-6xl lg:text-7xl xl:text-8xl" : "text-7xl md:text-8xl"} font-black font-sans leading-none tracking-tight block`}
                  style={{
                    color: event.accent,
                    textShadow: `0 0 40px rgba(${event.accentRgb}, 0.4), 0 0 80px rgba(${event.accentRgb}, 0.2)`,
                  }}
                >
                  {event.day}
                </span>
              </div>

              {/* Month + year stacked */}
              <div
                className={`flex ${
                  event.label
                    ? "flex-row items-center gap-2 flex-wrap min-w-0"
                    : "flex-col"
                } ${isEven ? "md:items-end md:flex-col" : "md:flex-col md:items-start"}`}
              >
                <span
                  className={`${event.label ? "text-xl md:text-3xl" : "text-2xl md:text-3xl"} font-pirate font-bold tracking-[0.15em] leading-tight min-w-0`}
                  style={{ color: event.accent }}
                >
                  {event.month}
                </span>
                <span className="text-sm font-mono text-white/30 tracking-widest self-center md:self-auto min-w-0">
                  {event.year}
                </span>
                {/* Optional label (e.g. "36 HOURS") */}
                {event.label && (
                  <span
                    className="text-[10px] font-mono font-bold tracking-[0.3em] px-2 py-0.5 rounded border md:mt-1"
                    style={{
                      color: event.accent,
                      borderColor: `rgba(${event.accentRgb}, 0.3)`,
                      backgroundColor: `rgba(${event.accentRgb}, 0.08)`,
                    }}
                  >
                    {event.label}
                  </span>
                )}
              </div>
            </div>

            <div
              className="mx-6 md:mx-8 h-px"
              style={{ backgroundColor: `rgba(${event.accentRgb}, 0.15)` }}
            />

            <div
              className={`p-6 md:p-8 pt-4 md:pt-5 ${
                isEven ? "md:text-right" : "text-left"
              }`}
            >
              <h3 className="text-xl md:text-2xl font-pirate font-bold text-white mb-2 drop-shadow-md">
                {event.title}
              </h3>
              <p className="text-gray-400 text-sm md:text-base leading-relaxed">
                {event.description}
              </p>
            </div>

            <div
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-2xl"
              style={{
                background: `radial-gradient(ellipse at ${
                  isEven ? "100% 30%" : "0% 30%"
                }, rgba(${event.accentRgb}, 0.06), transparent 70%)`,
              }}
            />
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
