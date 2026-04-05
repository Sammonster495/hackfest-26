"use client";

import { useEffect } from "react";

export default function BrochureRedirect() {
  useEffect(() => {
    window.location.replace("/images/brochure/Hackfest26Brochure.pdf");
  }, []);

  return (
    <div className="w-screen h-screen flex items-center justify-center bg-black">
      <div className="text-cyan-400 font-pirate text-2xl animate-pulse">
        Opening Brochure...
      </div>
    </div>
  );
}
