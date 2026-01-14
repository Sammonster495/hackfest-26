"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "~/components/ui/alert-dialog";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { apiFetch } from "~/lib/fetcher";

interface DeleteTeamButtonProps {
  teamId: string;
  teamName: string;
}

export function DeleteTeamButton({ teamId, teamName }: DeleteTeamButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [confirmName, setConfirmName] = useState("");

  const isNameMatch = confirmName.trim() === teamName;

  async function handleDelete() {
    if (!isNameMatch) {
      return;
    }

    setLoading(true);
    try {
      await apiFetch(`/api/teams/${teamId}/delete`, {
        method: "DELETE",
      });
      setOpen(false);
      router.push("/teams");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" className="w-full" disabled={loading}>
          <Trash2 className="h-4 w-4 mr-2" />
          Delete Team
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Team</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the team
            and remove all members.
            <br />
            <br />
            To confirm, please type the team name <strong>{teamName}</strong>{" "}
            below:
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-2">
          <Label htmlFor="confirm-name">Team Name</Label>
          <Input
            id="confirm-name"
            value={confirmName}
            onChange={(e) => setConfirmName(e.target.value)}
            placeholder={teamName}
            disabled={loading}
            autoFocus
          />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel
            disabled={loading}
            onClick={() => setConfirmName("")}
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={loading || !isNameMatch}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {loading ? "Deleting..." : "Delete Team"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
