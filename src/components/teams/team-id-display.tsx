"use client";

import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Copy, Check } from "lucide-react";
import { toast } from "sonner";

export function TeamIdDisplay({ teamId }: { teamId: string }) {
  const [copied, setCopied] = useState(false);

  async function copyToClipboard() {
    try {
      await navigator.clipboard.writeText(teamId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error("Failed to copy", {
        description:
          error instanceof Error
            ? error.message
            : "Something went wrong. Please try again.",
      });
    }
  }

  return (
    <div className="mt-2 p-3 bg-muted rounded-lg">
      <p className="text-sm font-medium text-muted-foreground mb-2">
        Team ID (share this to invite members):
      </p>
      <div className="flex items-center gap-2">
        <p className="text-lg font-mono font-bold flex-1">{teamId}</p>
        <Button
          onClick={copyToClipboard}
          size="sm"
          variant="outline"
          className="shrink-0"
        >
          {copied ? (
            <>
              <Check className="h-4 w-4 mr-1" />
              Copied
            </>
          ) : (
            <>
              <Copy className="h-4 w-4 mr-1" />
              Copy
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
