import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import {
  Check,
  Copy,
  Crown,
  Loader2,
  Shield,
  UserMinus,
  Users,
} from "lucide-react";
import type { Session } from "next-auth";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "~/components/ui/dialog";
import { apiFetch } from "~/lib/fetcher";
import { EventPaymentModal } from "./EventPaymentModal";
import type { Event, EventMember, EventTeam } from "./layout";

export function TeamDetailsDialog({
  team,
  event,
  amount,
  session,
  members,
  isLeader,
  open,
  onOpenChange,
  fetchEvents,
}: {
  event: Event;
  team: EventTeam;
  amount: number;
  session: Session | null;
  members: EventMember[];
  isLeader: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  setDrawerOpen: (open: boolean) => void;
  fetchEvents: () => Promise<void>;
}) {
  const [kickingId, setKickingId] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [leaving, setLeaving] = useState(false);

  const [copied, setCopied] = useState(false);
  const isConfirmed = team.isComplete;
  const isAvailable =
    event.status === "Published" && new Date(event.deadline) > new Date();

  const maskedId = (() => {
    const id = team.id;
    if (id.length <= 8) return id;
    return `${id.slice(0, 4)}${"•".repeat(6)}${id.slice(-4)}`;
  })();

  const handleCopy = () => {
    navigator.clipboard.writeText(team.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleKick = async (memberId: string) => {
    setKickingId(memberId);
    try {
      const res = await apiFetch<{ team: EventTeam }>(
        `/api/events/${team.eventId}/teams/kick`,
        {
          method: "POST",
          body: JSON.stringify({ memberId }),
        },
      );
      if (res?.team) await fetchEvents();
    } catch (err) {
      console.error(err);
    } finally {
      setKickingId(null);
    }
  };

  const handleConfirm = async () => {
    setConfirming(true);
    try {
      const res = await apiFetch<{ team: EventTeam }>(
        `/api/events/${team.eventId}/teams/confirm`,
        {
          method: "POST",
        },
      );

      if (res?.team) {
        await fetchEvents();
        onOpenChange(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setConfirming(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await apiFetch<{ team: EventTeam }>(
        `/api/events/${team.eventId}/teams/delete`,
        {
          method: "DELETE",
        },
      );
      if (res?.team) {
        await fetchEvents();
        onOpenChange(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDeleting(false);
    }
  };

  const handleLeave = async () => {
    setLeaving(true);
    try {
      await apiFetch(`/api/events/${team.eventId}/teams/leave`, {
        method: "POST",
      });
      await fetchEvents();
      onOpenChange(false);
    } catch (err) {
      console.error(err);
    } finally {
      setLeaving(false);
    }
  };

  const allMembers = [
    { ...members.find((m) => m.isLeader) },
    ...members.filter((m) => !m.isLeader),
  ];

  const _user: { id: string; name: string; email: string } = {
    id: session?.user?.id ?? "",
    name: session?.user?.name ?? "",
    email: session?.user?.email ?? "",
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="bg-[#0f1823] border border-[#39577c] text-white p-0 overflow-hidden max-w-md w-full rounded-2xl"
        showCloseButton={false}
      >
        <VisuallyHidden>
          <DialogTitle>Team Details</DialogTitle>
        </VisuallyHidden>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-[#39577c]/50">
          <div className="flex items-center gap-2">
            <Users size={14} className="text-[#f4d35e]/60" />
            <span className="text-sm font-semibold tracking-widest uppercase text-[#f4d35e]/60">
              Team Details
            </span>
          </div>
          {isConfirmed ? (
            <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-emerald-400 bg-emerald-400/10 border border-emerald-400/25 rounded-full px-2.5 py-0.5">
              <Shield size={11} />
              Confirmed
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-yellow-400 bg-yellow-400/10 border border-yellow-400/25 rounded-full px-2.5 py-0.5">
              <Shield size={11} />
              Not Confirmed
            </span>
          )}
        </div>

        <div className="px-5 py-5 flex flex-col gap-5">
          {/* Team name */}
          <div className="text-center">
            <p className="text-xs uppercase tracking-widest text-white/30 mb-1">
              Team Name
            </p>
            <h2 className="text-2xl font-bold text-white">{team.name}</h2>
          </div>

          {/* Team ID */}

          {isLeader && (
            <div className="flex items-center justify-between rounded-xl px-4 py-3 bg-[#133c55]/40 border border-[#39577c]/60">
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-semibold uppercase tracking-widest text-[#f4d35e]/60">
                  Team ID
                </span>
                <span className="text-sm font-mono text-white/70 tracking-wider">
                  {maskedId}
                </span>
              </div>
              <button
                type="button"
                onClick={handleCopy}
                className="shrink-0 p-2 rounded-lg text-white/30 hover:text-[#f4d35e] hover:bg-[#f4d35e]/10 border border-transparent hover:border-[#f4d35e]/20 transition-all duration-150"
                title="Copy Team ID"
              >
                {copied ? (
                  <Check size={15} className="text-emerald-400" />
                ) : (
                  <Copy size={15} />
                )}
              </button>
            </div>
          )}

          {/* Members list */}
          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#f4d35e]/60 mb-1">
              Members · {allMembers.length}
            </p>

            {allMembers.map((member) => (
              <div
                key={member.id}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 border transition-colors ${
                  member.isLeader
                    ? "bg-[#f4d35e]/8 border-[#f4d35e]/30"
                    : "bg-[#133c55]/40 border-[#39577c]/60"
                }`}
              >
                {/* Avatar */}
                <div
                  className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold ${
                    member.isLeader
                      ? "bg-[#f4d35e]/20 text-[#f4d35e]"
                      : "bg-[#133c55] text-white/60"
                  }`}
                >
                  {member.name?.charAt(0).toUpperCase()}
                </div>

                {/* Info */}
                <div className="flex flex-col min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-white truncate">
                      {member.name}
                    </span>
                    {member.isLeader && (
                      <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[#f4d35e] bg-[#f4d35e]/15 border border-[#f4d35e]/30 rounded-full px-2 py-0.5 shrink-0">
                        <Crown size={9} />
                        Leader
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-white/40 truncate">
                    {member.email}
                  </span>
                </div>

                {/* Kick button — only for non-leaders, only if leader viewing, only if not confirmed */}
                {isLeader &&
                  !member.isLeader &&
                  !isConfirmed &&
                  !team.payment &&
                  isAvailable && (
                    <Button
                      onClick={() => handleKick(member.id ?? "")}
                      disabled={kickingId === member.id}
                      className="shrink-0 p-2 rounded-lg text-white/30 hover:text-red-400 bg-transparent hover:bg-red-400/10 border border-transparent hover:border-red-400/20 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Remove from team"
                    >
                      {kickingId === member.id ? (
                        <Loader2 size={15} className="animate-spin" />
                      ) : (
                        <UserMinus size={15} />
                      )}
                    </Button>
                  )}
              </div>
            ))}
          </div>

          {/* Leave team — only for non-leaders when not confirmed */}
          {!isLeader && !isConfirmed && !team.payment && isAvailable && (
            <Button
              onClick={handleLeave}
              disabled={leaving}
              variant="outline"
              className="w-full border-red-500/40 text-red-400 bg-red-500/5 hover:bg-red-500/15 hover:border-red-500/60 hover:text-red-300 transition-all duration-200 cursor-pointer"
            >
              {leaving ? (
                <span className="flex items-center gap-2">
                  <Loader2 size={14} className="animate-spin" />
                  Leaving...
                </span>
              ) : (
                "Leave Team"
              )}
            </Button>
          )}

          {/* Action buttons — only for leader */}
          {isLeader && isAvailable && (
            <div className="flex gap-3 pt-1">
              {!isConfirmed && !team.payment && (
                <Button
                  onClick={handleDelete}
                  disabled={deleting || confirming}
                  variant="outline"
                  className="flex-1 border-red-500/40 text-red-400 bg-red-500/5 hover:bg-red-500/15 hover:border-red-500/60 hover:text-red-300 transition-all duration-200 cursor-pointer"
                >
                  {deleting ? (
                    <span className="flex items-center gap-2">
                      <Loader2 size={14} className="animate-spin" />
                      Deleting...
                    </span>
                  ) : (
                    "Delete Team"
                  )}
                </Button>
              )}

              {!isConfirmed &&
                (amount === 0 ? (
                  <Button
                    onClick={handleConfirm}
                    disabled={
                      confirming ||
                      deleting ||
                      members.length < event.minTeamSize ||
                      members.length > event.maxTeamSize
                    }
                    className="flex-1 bg-[#f4d35e] text-[#0b2545] font-bold hover:brightness-110 transition-all duration-200 cursor-pointer"
                  >
                    {confirming ? (
                      <span className="flex items-center gap-2">
                        <Loader2 size={14} className="animate-spin" />
                        Confirming...
                      </span>
                    ) : (
                      "Confirm Team"
                    )}
                  </Button>
                ) : team.payment ? (
                  <Button
                    disabled
                    className="flex-1 bg-[#f4d35e] opacity-50 text-[#0b2545] font-bold"
                  >
                    Payment Under Review
                  </Button>
                ) : (
                  <EventPaymentModal
                    teamId={team.id}
                    eventId={team.eventId}
                    amount={amount}
                    disabled={
                      confirming ||
                      deleting ||
                      members.length < event.minTeamSize ||
                      members.length > event.maxTeamSize
                    }
                    onSuccess={async () => {
                      toast.success(
                        "Payment proof submitted! Your registration is under verification.",
                      );
                      await fetchEvents();
                      onOpenChange(false);
                    }}
                  />
                ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
