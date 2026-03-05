"use client";

import { type ClassValue, clsx } from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import { LogOut } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Session } from "next-auth";
import { useEffect, useRef, useState } from "react";
import { twMerge } from "tailwind-merge";
import { signOutOfGitHub } from "~/lib/auth/userLogin";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const NAV_LINKS = [
  { name: "Home", href: "/" },
  { name: "About", href: "/about" },
  { name: "Events", href: "/events" },
  { name: "Timeline", href: "/timeline" },
  { name: "Contact", href: "/contact" },
];

export function Navbar({
  isUnderwater,
  session,
}: {
  isUnderwater: boolean;
  session: Session | null;
}) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);

  // Shrink logic
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close menu on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setIsMobileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, []);

  return (
    <motion.nav
      ref={navRef}
      layout // This enables the smooth height expansion
      className={cn(
        "fixed left-1/2 -translate-x-1/2 z-100 w-[85%] md:w-[75%] lg:w-[85%] max-w-5xl pointer-events-auto",
        "transition-all duration-500 ease-out",
        // Disable shrinking if menu is open so it doesn't look cramped
        scrolled && !isMobileMenuOpen ? "top-2 scale-[0.98]" : "top-6",
      )}
    >
      {/* LEATHER BACKGROUND */}
      <motion.div
        layoutId="nav-bg"
        className="absolute inset-0 w-full h-full shadow-2xl drop-shadow-xl rounded-lg overflow-hidden -z-10 bg-black/10"
      >
        <Image
          src="/teal-leather.webp"
          alt="Leather Background"
          fill
          className="object-cover scale-[1.3]"
          priority
        />
        <div
          className={cn(
            "absolute inset-0 transition-all duration-700 ease-in-out pointer-events-none",
            isUnderwater ? "bg-black/40" : "bg-black/10",
          )}
        />
        <div className="absolute inset-0 bg-black/20 pointer-events-none" />
        <div className="absolute inset-1.5 border-2 border-dashed border-amber-100/30 rounded-md pointer-events-none" />
        <div className="absolute inset-0.5 border border-white/10 rounded-lg pointer-events-none" />
      </motion.div>

      {/* NAVBAR CONTENT */}
      <div className="relative flex items-center justify-between px-6 py-3 md:px-8 lg:px-12 xl:px-20 md:py-3 xl:py-4">
        <Link
          href="/"
          className="group relative shrink-0 transition-transform hover:scale-105 active:scale-95"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          {/* Logo Glow */}
          <div className="absolute inset-0 -z-10 flex items-center justify-center overflow">
            <div
              className={cn(
                "w-16 h-16 md:w-16 md:h-16 xl:w-20 xl:h-5 rounded-full blur-3xl opacity-100 transition-colors duration-700",
                isUnderwater
                  ? "bg-linear-to-r from-cyan-400 via-blue-300 to-cyan-500"
                  : "bg-linear-to-r from-amber-400 via-yellow-300 to-amber-500",
              )}
            />
          </div>

          <div className="relative w-12 h-12 md:w-12 md:h-12 xl:w-14 xl:h-14">
            <Image
              src="/logos/logowithglow.webp"
              alt="Hackfest Logo"
              fill
              className="object-contain drop-shadow-[0_0_12px_rgba(255,191,0,0.7)]"
            />
          </div>
        </Link>

        {/* DESKTOP LINKS (Hidden on Mobile) */}
        <div className="hidden md:flex items-center gap-4 lg:gap-6 xl:gap-8">
          {NAV_LINKS.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.name}
                href={link.href}
                className={cn(
                  "relative font-pirate text-lg xl:text-xl font-bold tracking-wide transition-colors duration-500",
                  isActive
                    ? isUnderwater
                      ? "text-cyan-400 shadow-cyan-500/50 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]"
                      : "text-amber-400 shadow-amber-500/50 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]"
                    : isUnderwater
                      ? "text-cyan-100/70 hover:text-white"
                      : "text-amber-100/80 hover:text-white",
                )}
              >
                {link.name}
                <span
                  className={cn(
                    "absolute -bottom-1 left-0 h-0.5 w-full transition-transform duration-300 origin-left scale-x-0 rounded-full opacity-100",
                    isUnderwater
                      ? "bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)]"
                      : "bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.8)]",
                    isActive && "scale-x-100",
                    "group-hover:scale-x-100",
                  )}
                />
              </Link>
            );
          })}
        </div>

        {/* DESKTOP SIGN IN (Hidden on Mobile) */}
        <div className="hidden md:flex items-center gap-4">
          <AuthButton session={session} isUnderwater={isUnderwater} />
        </div>

        {/* MOBILE MENU TOGGLE (Visible on Mobile) */}
        <button
          type="button"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="md:hidden relative z-20 p-2 focus:outline-none"
        >
          <div className="flex flex-col gap-1.5 justify-center items-center w-8">
            <span
              className={cn(
                "block h-0.5 w-full rounded-full transition-all duration-300",
                isUnderwater ? "bg-cyan-400" : "bg-amber-400",
                isMobileMenuOpen ? "rotate-45 translate-y-2" : "",
              )}
            />
            <span
              className={cn(
                "block h-0.5 w-full rounded-full transition-all duration-300",
                isUnderwater ? "bg-cyan-400" : "bg-amber-400",
                isMobileMenuOpen ? "opacity-0" : "",
              )}
            />
            <span
              className={cn(
                "block h-0.5 w-full rounded-full transition-all duration-300",
                isUnderwater ? "bg-cyan-400" : "bg-amber-400",
                isMobileMenuOpen ? "-rotate-45 -translate-y-2" : "",
              )}
            />
          </div>
        </button>
      </div>

      {/* MOBILE MENU CONTENT (Expandable Pouch) */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="md:hidden overflow-hidden border-t border-white/10"
          >
            <div className="flex flex-col items-center gap-6 pb-8 pt-4">
              {NAV_LINKS.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={cn(
                      "text-xl lg:text-2xl font-pirate font-bold tracking-widest uppercase transition-colors",
                      isActive
                        ? isUnderwater
                          ? "text-cyan-400"
                          : "text-amber-400"
                        : isUnderwater
                          ? "text-cyan-100/70"
                          : "text-amber-100/80",
                    )}
                  >
                    {link.name}
                  </Link>
                );
              })}

              <div className="mt-2 flex flex-col items-center gap-4">
                <AuthButton
                  session={session}
                  isUnderwater={isUnderwater}
                  onNavigate={() => setIsMobileMenuOpen(false)}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}

// Helper to keep code clean - uses your exact button styling
function AuthButton({
  session,
  isUnderwater,
  onNavigate,
}: {
  session: Session | null;
  isUnderwater: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const isLoggedIn = !!session?.user && !session?.eventUser;
  const href = isLoggedIn
    ? session.user.isRegistrationComplete
      ? "/teams"
      : "/register"
    : "/register";
  const label = isLoggedIn
    ? session.user.isRegistrationComplete
      ? "Your Team"
      : "Register Now"
    : "Register Now";

  // Base button styles
  const buttonClass = cn(
    "group relative px-4 py-1.5 xl:px-6 xl:py-2 font-pirate text-base xl:text-lg font-bold transition-all duration-500 cursor-pointer",
    isUnderwater
      ? "text-cyan-100 hover:text-white"
      : "text-amber-100 hover:text-white",
  );

  const borderContent = (
    <>
      {/* Button Border / Inset Look */}
      <div
        className={cn(
          "absolute inset-0 border rounded-md transition-all duration-500",
          isUnderwater
            ? "border-cyan-400/40 bg-cyan-900/20 group-hover:bg-cyan-900/40"
            : "border-amber-200/40 bg-white/5 group-hover:bg-white/10",
        )}
      />
      {/* Inner faint border for depth */}
      <div
        className={cn(
          "absolute inset-0.75 border rounded-sm opacity-50 transition-colors duration-500",
          isUnderwater ? "border-cyan-200/20" : "border-amber-200/20",
        )}
      />
    </>
  );

  return (
    <>
      <Link href={href} onClick={onNavigate}>
        <button type="button" className={buttonClass}>
          {borderContent}
          <span className="relative z-10 drop-shadow-sm">{label}</span>
        </button>
      </Link>

      {isLoggedIn && (
        <button
          type="button"
          onClick={() => signOutOfGitHub(pathname)}
          className={cn(
            "p-2 rounded-md transition-colors duration-300",
            isUnderwater
              ? "text-cyan-400 hover:text-cyan-100 hover:bg-cyan-900/20"
              : "text-amber-400 hover:text-amber-100 hover:bg-amber-900/20",
          )}
          title="Logout"
        >
          <LogOut className="w-5 h-5" />
        </button>
      )}
    </>
  );
}
