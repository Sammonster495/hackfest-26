"use client";

import { ArrowLeft, Loader2, UserPlus, Users } from "lucide-react";
import { useState } from "react";
import { apiFetch } from "~/lib/fetcher";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogTitle } from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import type { EventTeam } from "./layout";

type View = "choose" | "create" | "join";

export default function TeamRegistrationDialog({
  eventId,
  fetchEvents,
  open,
  onOpenChange,
  setTeamDialogOpen,
}: {
  eventId: string;
  fetchEvents: () => Promise<void>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  setTeamDialogOpen: (open: boolean) => void;
}) {
  const [view, setView] = useState<View>("choose");
  const [direction, setDirection] = useState<"forward" | "back">("forward");
  const [animating, setAnimating] = useState(false);

  const [teamName, setTeamName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const navigate = (to: View, dir: "forward" | "back") => {
    if (animating) return;
    setDirection(dir);
    setAnimating(true);
    setError(null);
    setTimeout(() => {
      setView(to);
      setAnimating(false);
    }, 220);
  };

  const handleCreate = async () => {
    if (!teamName.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const res = await apiFetch<{ team: EventTeam | null }>(
        `/api/events/${eventId}/teams/create`,
        {
          method: "POST",
          body: JSON.stringify({ teamName: teamName.trim() }),
        },
      );

      if (res?.team) {
        await fetchEvents();
        onOpenChange(false);
        resetState();
        setTeamDialogOpen(true);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to create team. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!joinCode.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const res = await apiFetch<{ team: EventTeam | null }>(
        `/api/events/${eventId}/teams/join`,
        {
          method: "POST",
          body: JSON.stringify({ teamId: joinCode.trim() }),
        },
      );
      if (res?.team) {
        await fetchEvents();
        onOpenChange(false);
        resetState();
        setTeamDialogOpen(true);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to join team. Please check the code and try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const resetState = () => {
    setView("choose");
    setTeamName("");
    setJoinCode("");
    setError(null);
    setAnimating(false);
  };

  const slideClass = animating
    ? direction === "forward"
      ? "opacity-0 -translate-x-4"
      : "opacity-0 translate-x-4"
    : "opacity-100 translate-x-0";

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) resetState();
      }}
    >
      <DialogContent className="bg-[#0f1823] border border-[#39577c] text-white p-0 overflow-y-auto max-h-[90vh] max-w-sm w-[95%] sm:w-full rounded-2xl">
        <DialogTitle className="sr-only">Team Registration</DialogTitle>

        {/* Header strip */}
        <div className="flex items-center gap-3 px-5 pt-5 pb-3 border-b border-[#39577c]/50">
          {view !== "choose" && (
            <button
              type="button"
              onClick={() => navigate("choose", "back")}
              className="text-[#f4d35e]/70 hover:text-[#f4d35e] transition-colors"
              disabled={loading}
            >
              <ArrowLeft size={18} />
            </button>
          )}
          <span className="text-sm font-semibold tracking-widest uppercase text-[#f4d35e]/60">
            {view === "choose" && "Join the Battle"}
            {view === "create" && "Create a Team"}
            {view === "join" && "Join a Team"}
          </span>
        </div>

        {/* Sliding content */}
        <div
          className={`transition-all duration-200 ease-in-out ${slideClass} px-5 py-6 min-h-[220px]`}
        >
          {view === "choose" && (
            <div className="flex flex-col gap-3">
              <p className="text-white/50 text-sm mb-2">
                Start a new team or jump into an existing one.
              </p>
              <p className="text-[#f4d35e] font-bold text-[12px] uppercase tracking-wider mb-2 leading-relaxed italic border border-[#f4d35e]/20 p-2 rounded-lg bg-[#f4d35e]/5">
                * All team members must be added and the full payment must be
                completed before confirming the team. Once confirmed, no changes
                will be allowed. *
              </p>
              <button
                type="button"
                onClick={() => navigate("create", "forward")}
                className="group flex items-center gap-4 w-full rounded-xl p-4 border border-[#f4d35e]/20 bg-[#133c55]/40 hover:bg-[#133c55]/80 hover:border-[#f4d35e]/50 transition-all duration-200"
              >
                <div className="p-2 rounded-lg bg-[#f4d35e]/10 group-hover:bg-[#f4d35e]/20 transition-colors">
                  <Users size={20} className="text-[#f4d35e]" />
                </div>
                <div className="text-left">
                  <div className="font-semibold text-white text-sm">
                    Create a Team
                  </div>
                  <div className="text-white/40 text-xs mt-0.5">
                    You'll get a code to share with teammates
                  </div>
                </div>
                <ArrowLeft
                  size={14}
                  className="ml-auto rotate-180 text-white/30 group-hover:text-[#f4d35e]/60 transition-colors"
                />
              </button>

              <button
                type="button"
                onClick={() => navigate("join", "forward")}
                className="group flex items-center gap-4 w-full rounded-xl p-4 border border-[#f4d35e]/20 bg-[#133c55]/40 hover:bg-[#133c55]/80 hover:border-[#f4d35e]/50 transition-all duration-200"
              >
                <div className="p-2 rounded-lg bg-[#f4d35e]/10 group-hover:bg-[#f4d35e]/20 transition-colors">
                  <UserPlus size={20} className="text-[#f4d35e]" />
                </div>
                <div className="text-left">
                  <div className="font-semibold text-white text-sm">
                    Join a Team
                  </div>
                  <div className="text-white/40 text-xs mt-0.5">
                    Enter the code your team leader shared
                  </div>
                </div>
                <ArrowLeft
                  size={14}
                  className="ml-auto rotate-180 text-white/30 group-hover:text-[#f4d35e]/60 transition-colors"
                />
              </button>
            </div>
          )}

          {view === "create" && (
            <div className="flex flex-col gap-4">
              <p className="text-white/50 text-sm">
                Pick a name for your team. You can share the join code with
                teammates after registering.
              </p>
              <div className="flex flex-col gap-2">
                <Label className="text-xs font-semibold uppercase tracking-widest text-[#f4d35e]/60">
                  Team Name
                </Label>
                <Input
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                  placeholder="e.g. The Recursion Gang"
                  className="bg-[#133c55]/50 border-[#39577c] text-white placeholder:text-white/30 focus-visible:ring-[#f4d35e]/40"
                  autoFocus
                  disabled={loading}
                />
              </div>
              {error && <p className="text-red-400 text-xs">{error}</p>}
              <Button
                onClick={handleCreate}
                disabled={!teamName.trim() || loading}
                className="w-full bg-[#f4d35e] text-[#0b2545] font-bold hover:brightness-110 transition-all"
              >
                {loading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  "Create Team"
                )}
              </Button>
            </div>
          )}

          {view === "join" && (
            <div className="flex flex-col gap-4">
              <p className="text-white/50 text-sm">
                Ask your team leader for the join code and paste it below.
              </p>
              <div className="flex flex-col gap-2">
                <Label className="text-xs font-semibold uppercase tracking-widest text-[#f4d35e]/60">
                  Join Code
                </Label>
                <Input
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleJoin()}
                  placeholder="e.g. ABC123"
                  className="bg-[#133c55]/50 border-[#39577c] text-white placeholder:text-white/30 focus-visible:ring-[#f4d35e]/40 tracking-widest font-mono"
                  autoFocus
                  disabled={loading}
                />
              </div>
              {error && <p className="text-red-400 text-xs">{error}</p>}
              <Button
                onClick={handleJoin}
                disabled={!joinCode.trim() || loading}
                className="w-full bg-[#f4d35e] text-[#0b2545] font-bold hover:brightness-110 transition-all"
              >
                {loading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  "Join Team"
                )}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
