"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";

export function TeamIdDisplay({ teamId }: { teamId: string }) {
  const [copied, setCopied] = useState(false);

  // Helper to shorten the ID (e.g., "5ff1bb00...2304aa0d")
  const shortenedId = `${teamId.slice(0, 8)}...${teamId.slice(-8)}`;

  async function copyToClipboard() {
    try {
      await navigator.clipboard.writeText(teamId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("Team ID copied to clipboard");
    } catch (error) {
      toast.error("Failed to copy", {
        description: "Please try copying manually.",
      });
    }
  }

  return (
    <div className="bg-black/40 border border-white/20 rounded-lg p-3 shadow-2xl backdrop-blur-xl transition-all hover:bg-black/50 flex flex-col items-start gap-2 min-w-[280px]">
      <div className="flex items-center justify-between w-full gap-3">
        <div className="flex flex-col">
          <p className="text-[10px] text-white/50 uppercase tracking-widest font-bold">
            Team ID
          </p>
          <code className="text-sm font-mono font-bold text-white tracking-wide">
            {shortenedId}
          </code>
        </div>

        <Button
          onClick={copyToClipboard}
          size="sm"
          variant="ghost"
          className="
            h-8 px-2
            text-white/70 hover:text-white hover:bg-white/10
            transition-all
          "
        >
          {copied ? (
            <Check className="h-4 w-4 text-green-400" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
}
