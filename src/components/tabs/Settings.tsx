"use client";

import { Loader2, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";

type Track = {
  id: string;
  name: string;
  createdAt: string;
};

export function SettingsTab() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [newTrackName, setNewTrackName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);

  const [trackToDelete, setTrackToDelete] = useState<Track | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  async function fetchTracks() {
    try {
      const res = await fetch("/api/tracks");
      if (!res.ok) throw new Error("Failed to fetch tracks");
      const data = await res.json();
      setTracks(data);
    } catch (_error) {
      toast.error("Error loading tracks");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchTracks();
  });

  async function handleAddTrack(e: React.FormEvent) {
    e.preventDefault();
    if (!newTrackName.trim()) return;

    setIsAdding(true);
    try {
      const res = await fetch("/api/tracks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newTrackName }),
      });

      if (!res.ok) {
        const error = await res.text();
        throw new Error(error);
      }

      const newTrack = await res.json();
      setTracks([newTrack, ...tracks]);
      setNewTrackName("");
      toast.success("Track added successfully");
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to add track";
      toast.error(message);
    } finally {
      setIsAdding(false);
    }
  }

  const openDeleteModal = (track: Track) => {
    setTrackToDelete(track);
    setDeleteConfirmation("");
  };

  const handleDeleteTrack = async () => {
    if (!trackToDelete || deleteConfirmation !== trackToDelete.id) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/tracks?id=${trackToDelete.id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete track");

      setTracks(tracks.filter((t) => t.id !== trackToDelete.id));
      toast.success("Track deleted successfully");
      setTrackToDelete(null);
    } catch (_error) {
      toast.error("Failed to delete track");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">System settings</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tracks Management</CardTitle>
          <CardDescription>Add or remove hackfest tracks</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleAddTrack} className="flex gap-2">
            <Input
              placeholder="Enter track name (e.g. AI/ML, Web3)"
              value={newTrackName}
              onChange={(e) => setNewTrackName(e.target.value)}
              disabled={isAdding}
            />
            <Button type="submit" disabled={isAdding || !newTrackName.trim()}>
              {isAdding ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              Add Track
            </Button>
          </form>

          <div className="border rounded-lg divide-y">
            {isLoading ? (
              <div className="p-4 text-center text-muted-foreground">
                Loading tracks...
              </div>
            ) : tracks.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                No tracks added yet.
              </div>
            ) : (
              tracks.map((track) => (
                <div
                  key={track.id}
                  className="flex items-center justify-between p-3 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex flex-col">
                    <span className="font-medium">{track.name}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => openDeleteModal(track)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog
        open={!!trackToDelete}
        onOpenChange={(open) => !open && setTrackToDelete(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Track</DialogTitle>
            <DialogDescription>
              This action cannot be undone. To confirm, please type the track ID
              below.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="text-sm font-medium">
              Track Name:{" "}
              <span className="font-normal">{trackToDelete?.name}</span>
            </div>
            <div className="bg-muted p-2 rounded text-sm font-mono break-all">
              {trackToDelete?.id}{" "}
              {/* will remove as soon as the testing of this thing is done */}
            </div>
            <div className="space-y-2">
              <label
                htmlFor="delete-confirmation"
                className="text-sm font-medium"
              >
                Type Track ID to confirm:
              </label>
              <Input
                id="delete-confirmation"
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
                placeholder={trackToDelete?.id}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setTrackToDelete(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteTrack}
              disabled={deleteConfirmation !== trackToDelete?.id || isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Track"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
