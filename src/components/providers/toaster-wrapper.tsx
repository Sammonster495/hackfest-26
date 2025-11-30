"use client";

import dynamic from "next/dynamic";

const ToasterProvider = dynamic(
  () => import("./toaster").then((mod) => mod.ToasterProvider),
  {
    ssr: false,
    loading: () => null,
  },
);

export function ToasterWrapper() {
  try {
    // Only render on client side
    if (typeof window === "undefined") {
      return null;
    }
    return <ToasterProvider />;
  } catch {
    // Silently fail during build/SSR
    return null;
  }
}
