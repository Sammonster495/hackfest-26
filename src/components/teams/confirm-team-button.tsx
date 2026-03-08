"use client";

import { CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import { apiFetch } from "~/lib/fetcher";

export function ConfirmTeamButton({
  refreshTeam,
  teamId,
}: {
  refreshTeam: () => void;
  teamId: string;
}) {
  const [loading, setLoading] = useState(false);

  async function handleConfirm() {
    setLoading(true);
    try {
      await apiFetch(`/api/teams/${teamId}/complete`, {
        method: "POST",
      });
      refreshTeam();
    } catch {
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      onClick={handleConfirm}
      disabled={loading}
      className="w-full"
      variant="default"
    >
      <CheckCircle2 className="h-4 w-4 mr-2" />
      {loading ? "Confirming..." : "Confirm Team"}
    </Button>
  );
}
