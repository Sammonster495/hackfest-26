"use client";

import { motion } from "framer-motion";
import { Mail, Phone } from "lucide-react";
import { useState } from "react";

const organizers = [
  {
    name: "Sampanna",
    phone: "+91 83105 56184",
  },
  {
    name: "Omkar G Prabhu",
    phone: "+91 94488 46524",
  },
  {
    name: "Paripoorna Bhat",
    phone: "+91 73386 52017",
  },
  {
    name: "Rahul N Bangera",
    phone: "+91 80503 38576",
  },
];

export default function OrganizerRing() {
  return (
    <div className="w-full max-w-7xl mx-auto py-12 md:py-16 flex flex-col items-center">
      <motion.div
        className="mb-24 flex flex-col items-center justify-center p-8 bg-black/40 backdrop-blur-md rounded-2xl border border-cyan-500/20 max-w-3xl w-full mx-auto text-center relative overflow-hidden"
        initial={{ opacity: 0, y: -30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1 bg-cyan-500/50 shadow-[0_0_20px_rgba(34,211,238,0.8)]" />

        <Mail className="w-12 h-12 text-cyan-400 mb-4" />
        <h3 className="text-3xl font-pirate text-cyan-100 mb-4">
          Send a Raven
        </h3>
        <p className="text-cyan-200/70 mb-8 font-crimson text-xl max-w-lg">
          Have queries about the voyage? Reach out to us directly. We are always
          listening to the waves.
        </p>

        <div className="flex flex-col md:flex-row gap-8 items-center justify-center relative z-10">
          <div className="flex flex-col items-center gap-2">
            <span className="text-cyan-200/60 font-crimson uppercase tracking-widest text-sm font-semibold">
              General Inquiries
            </span>
            <div className="relative group">
              <div className="absolute inset-0 bg-cyan-400/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <a
                href="mailto:admin@hackfest.dev"
                className="text-center relative z-10 block px-8 py-3 bg-cyan-900/40 hover:bg-cyan-800/60 text-cyan-50 border border-cyan-500/50 rounded-lg transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(34,211,238,0.3)] font-pirate text-xl tracking-wider min-w-[280px]"
              >
                admin@hackfest.dev
              </a>
            </div>
          </div>

          <div className="flex flex-col items-center gap-2">
            <span className="text-cyan-200/60 font-crimson uppercase tracking-widest text-sm font-semibold">
              For Sponsors
            </span>
            <div className="relative group">
              <div className="absolute inset-0 bg-cyan-400/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <a
                href="mailto:sponsor@hackfest.dev"
                className="text-center relative z-10 block px-8 py-3 bg-cyan-900/40 hover:bg-cyan-800/60 text-cyan-50 border border-cyan-500/50 rounded-lg transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(34,211,238,0.3)] font-pirate text-xl tracking-wider min-w-[280px]"
              >
                sponsor@hackfest.dev
              </a>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.h2
        className="text-4xl md:text-6xl font-pirate text-center mb-16 text-cyan-200 drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]"
        initial={{ opacity: 0, scale: 0.9 }}
        whileInView={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8 }}
      >
        The Crew
      </motion.h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full px-4">
        {organizers.map((org, i) => (
          <OrganizerCard key={org.name} organizer={org} index={i} />
        ))}
      </div>
    </div>
  );
}

function OrganizerCard({
  organizer,
  index,
}: {
  organizer: any;
  index: number;
}) {
  return (
    <motion.div
      className="group relative w-full h-64 bg-black/40 backdrop-blur-sm border border-cyan-500/30 rounded-xl overflow-hidden flex flex-col items-center justify-center gap-4 transition-all hover:border-cyan-400 hover:shadow-[0_0_30px_rgba(34,211,238,0.15)] hover:-translate-y-2 p-6"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.15, duration: 0.5 }}
    >
      <div className="text-center z-10">
        <h3 className="font-pirate text-3xl text-cyan-100 tracking-wide mb-2 group-hover:text-cyan-300 transition-colors">
          {organizer.name}
        </h3>
        <p className="font-crimson text-cyan-400/80 font-bold tracking-widest text-sm uppercase mb-6">
          {organizer.role}
        </p>

        <a
          href={`tel:${organizer.phone}`}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-950/50 border border-cyan-500/30 text-cyan-200 hover:text-white hover:bg-cyan-900/60 hover:border-cyan-400 transition-all group-hover:scale-105"
        >
          <Phone className="w-4 h-4" />
          <span className="font-mono text-lg">{organizer.phone}</span>
        </a>
      </div>

      <div className="absolute inset-0 bg-linear-to-t from-cyan-900/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

      <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-cyan-500/0 group-hover:border-cyan-400/50 transition-all duration-500 rounded-tl-xl" />
      <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-cyan-500/0 group-hover:border-cyan-400/50 transition-all duration-500 rounded-br-xl" />
    </motion.div>
  );
}
