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
  return <ToasterProvider />;
}
