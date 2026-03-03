"use client";

import { useEffect } from "react";
import { signInWithGoogle } from "~/lib/auth/userLogin";

export default function EventsLoginPage() {
  useEffect(() => {
    signInWithGoogle();
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-black">
      <div className="flex flex-col items-center gap-4 animate-pulse">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent" />
        <p className="font-pirate text-2xl tracking-widest text-cyan-400">
          Redirecting to Google...
        </p>
      </div>
    </div>
  );
}
