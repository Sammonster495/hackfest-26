"use client";

import Link from "next/link";

export const dynamic = "force-dynamic";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#0a1628]">
      <div className="absolute top-1/3 left-0 right-0 h-px bg-linear-to-r from-transparent via-slate-500/30 to-transparent" />

      <div className="absolute bottom-1/3 left-0 right-0 h-px bg-linear-to-r from-transparent via-slate-500/30 to-transparent" />

      <div className="z-10 flex flex-col items-center px-4 text-center">
        <h1 className="mb-4 text-7xl font-bold tracking-tight text-transparent bg-clip-text bg-linear-to-b from-slate-200 to-slate-400 sm:text-8xl">
          Oops!
        </h1>

        <p className="mb-2 text-sm text-slate-400 max-w-md">
          {error?.message || "Something went wrong. Please try again."}
        </p>

        {error?.digest && (
          <p className="mb-6 text-xs text-slate-500 font-mono">
            Error ID: {error.digest}
          </p>
        )}

        <div className="flex flex-col gap-3 sm:flex-row mt-4">
          <button
            onClick={() => reset()}
            type="button"
            className="rounded-md border border-slate-600 bg-slate-800/50 px-8 py-2.5 text-sm font-medium text-slate-200 transition-all hover:bg-slate-700 hover:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 focus:ring-offset-[#0a1628]"
          >
            Try Again
          </button>

          <Link
            href="/"
            className="rounded-md bg-white px-8 py-2.5 text-sm font-medium text-slate-900 transition-all hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-[#0a1628]"
          >
            Go Home
          </Link>
        </div>
      </div>

      {/* Background glow effect */}
      <div className="absolute inset-0 bg-linear-to-b from-slate-900/0 via-[#0a1628] to-slate-900/0 pointer-events-none" />
    </div>
  );
}
