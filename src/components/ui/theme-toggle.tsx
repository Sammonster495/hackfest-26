"use client";

import { motion } from "framer-motion";
import { Moon, Sun } from "lucide-react";
import { usePathname } from "next/navigation";
import { useDayNight } from "~/components/providers/useDayNight";

export function ThemeToggle() {
  const { isNight, toggleTheme } = useDayNight();
  const pathname = usePathname();

  if (pathname === "/contact" || pathname === "/about") return null;

  return (
    <motion.button
      className="fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white shadow-[0_0_20px_rgba(0,0,0,0.3)] hover:bg-black/60 transition-colors"
      onClick={toggleTheme}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      aria-label="Toggle theme"
    >
      <motion.div
        initial={false}
        animate={{ rotate: isNight ? 0 : 180 }}
        transition={{ type: "spring", stiffness: 200, damping: 10 }}
      >
        {isNight ? (
          <Moon className="h-6 w-6 text-cyan-300 drop-shadow-[0_0_8px_rgba(103,232,249,0.5)]" />
        ) : (
          <Sun className="h-6 w-6 text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]" />
        )}
      </motion.div>
    </motion.button>
  );
}
