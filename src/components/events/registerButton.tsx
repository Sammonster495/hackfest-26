import type { Session } from "next-auth";
import { useState } from "react";
import { toast } from "sonner";
import { apiFetch } from "~/lib/fetcher";
import PaymentButton from "../razorpay/PaymentButton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";
import { Button } from "../ui/button";
import type { Event } from "./layout";
import { TeamDetailsDialog } from "./teamDetails";
import TeamRegistrationDialog from "./teamRegistrationDialog";

export default function RegisterButton({
  event,
  session,
  fetchEvents,
  setDrawerOpen,
}: {
  event: Event;
  session: Session | null;
  fetchEvents: () => Promise<void>;
  setDrawerOpen: (open: boolean) => void;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [teamDialogOpen, setTeamDialogOpen] = useState(false);
  const isAvailable =
    event.status === "Published" && new Date(event.deadline) > new Date();

  const baseClass =
    "w-full py-6 text-xl text-[#0b2545] cursor-pointer capitalize shrink-0 flex gap-2 items-center justify-center bg-linear-to-r from-[#cfb536] to-[#c2a341] hover:brightness-110 transition-all duration-300";

  const handleRegisterClick = () => {
    if (event.amount === 0) {
      setConfirmOpen(true);
    } else {
      onRegister();
    }
  };

  const onRegister = async () => {
    try {
      await apiFetch(`/api/events/${event.id}/solo/register`, {
        method: "POST",
      });
      await fetchEvents();
    } catch (error) {
      console.error("Registration error:", error);
    }
  };

  const onCancel = async () => {
    try {
      await apiFetch(`/api/events/${event.id}/solo/cancel`, { method: "POST" });
      await fetchEvents();
    } catch (error) {
      console.error("Cancel error:", error);
    }
  };

  const user: { id: string; name: string; email: string } = {
    id: session?.user.id ?? "",
    name: session?.user.name ?? "",
    email: session?.user.email ?? "",
  };

  // SOLO EVENT
  if (event.type === "Solo") {
    return (
      <>
        {event.userStatus === "registered" ? (
          <Button className={baseClass}>Registered</Button>
        ) : event.userStatus === "not_confirmed" ? (
          isAvailable && (
            <div className="flex flex-col gap-2 w-full">
              <Button onClick={onCancel} className={baseClass}>
                Cancel Registration
              </Button>
              <PaymentButton
                user={user}
                amountInINR={event.amount}
                eventId={event.id}
                teamId={event.team?.id ?? ""}
                paymentType="EVENT"
                description="Event Participation Fee"
                className={baseClass}
                onStart={() => setDrawerOpen(false)}
                onEnd={async () => {
                  await fetchEvents();
                  setDrawerOpen(true);
                }}
                onSuccess={() =>
                  toast.success(
                    "Payment successful! You are now registered for the event.",
                  )
                }
                onFailure={(error) => toast.error(error)}
              >
                Pay to Confirm
              </PaymentButton>
            </div>
          )
        ) : (
          isAvailable && (
            <Button onClick={handleRegisterClick} className={baseClass}>
              Register Now
            </Button>
          )
        )}
        <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <AlertDialogContent className="bg-[#0f1823] border border-[#39577c] text-white p-0 overflow-hidden max-w-sm w-full rounded-2xl">
            {/* Header strip */}
            <AlertDialogHeader className="flex items-center gap-3 px-5 pt-5 pb-3 border-b border-[#39577c]/50">
              <AlertDialogTitle className="text-xl font-bold text-[#f4d35e]">
                Confirm Registration
              </AlertDialogTitle>
            </AlertDialogHeader>

            {/* Body */}
            <div className="px-5 py-6 flex flex-col gap-6">
              <AlertDialogDescription className="text-white/50 text-sm leading-relaxed">
                This event is free to join, but{" "}
                <span className="font-semibold text-white">
                  your registration cannot be cancelled or undone
                </span>{" "}
                once confirmed. Are you sure you want to proceed?
              </AlertDialogDescription>

              <AlertDialogFooter className="flex flex-col gap-2 sm:flex-col">
                <AlertDialogAction
                  onClick={async () => {
                    setConfirmOpen(false);
                    await onRegister();
                  }}
                  className="w-full bg-[#f4d35e] text-[#0b2545] font-bold hover:brightness-110 transition-all"
                >
                  Yes, Register Me
                </AlertDialogAction>
                <AlertDialogCancel className="w-full bg-transparent border border-[#39577c] text-white/60 hover:bg-[#133c55]/50 hover:text-white hover:border-[#39577c] transition-all">
                  Go Back
                </AlertDialogCancel>
              </AlertDialogFooter>
            </div>
          </AlertDialogContent>
        </AlertDialog>
      </>
    );
  }

  // TEAM EVENT
  return (
    <>
      {event.userStatus === "not_registered" ? (
        isAvailable && (
          <Button onClick={() => setDialogOpen(true)} className={baseClass}>
            Register Now
          </Button>
        )
      ) : (
        <Button onClick={() => setTeamDialogOpen(true)} className={baseClass}>
          Team Details
        </Button>
      )}

      <TeamRegistrationDialog
        eventId={event.id}
        fetchEvents={fetchEvents}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        setTeamDialogOpen={setTeamDialogOpen}
      />
      {event.team && (
        <TeamDetailsDialog
          event={event}
          session={session}
          team={event.team}
          amount={event.amount}
          members={event.teamMembers ?? []}
          isLeader={event.isLeader ?? false}
          open={teamDialogOpen}
          onOpenChange={setTeamDialogOpen}
          setDrawerOpen={setDrawerOpen}
          fetchEvents={fetchEvents}
        />
      )}
    </>
  );
}
