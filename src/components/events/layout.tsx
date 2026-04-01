"use client";

import { TriangleAlert, Trophy } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import type { Session } from "next-auth";
import { use, useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { apiFetch } from "~/lib/fetcher";
import { useLoader } from "../providers/loader-context";
import { useDayNight } from "../providers/useDayNight";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader } from "../ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Skeleton } from "../ui/skeleton";
import EventDetails from "./details";
import EventDrawer from "./drawer";
import { UserDetailsForm } from "./userDetails";

export type Payment = {
  id: string;
  paymentName: string;
  amount: string;
  paymentType: "HACKFEST" | "EVENT";
  paymentStatus: "Pending" | "Paid" | "Refunded" | null;
  paymentScreenshotUrl: string | null;
  paymentTransactionId: string | null;
  userId: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
};
export type EventTeam = {
  id: string;
  name: string;
  eventId: string;
  isComplete: boolean;
  payment: Payment | null;
};

export type EventOrganizer = {
  id: string;
  name: string;
  email: string;
  phone: string;
};

export type EventMember = {
  id: string;
  name: string;
  email: string;
  isLeader: boolean;
};

export type Event = {
  id: string;
  title: string;
  description: string;
  from: string;
  to: string;
  venue: string;
  type: "Solo" | "Team";
  status: "Draft" | "Published" | "Ongoing" | "Completed";
  audience: "Participants" | "Non-Participants" | "Both";
  amount: number;
  maxTeams: number;
  minTeamSize: number;
  maxTeamSize: number;
  registrationsOpen: boolean;
  image: string;
  deadline: string;
  userStatus?: "registered" | "not_registered" | "not_confirmed";
  team?: EventTeam | null;
  isLeader?: boolean;
  organizers: EventOrganizer[];
  teamMembers?: EventMember[];
};

const GRID_CLASSES =
  "w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 lg:gap-16 md:gap-10 gap-6 items-start";

const Events = ({
  session,
  searchParams,
}: {
  session: Session | null;
  searchParams: Promise<{ error?: string; id?: string }>;
}) => {
  const { isNight } = useDayNight();
  const { loaderDone } = useLoader();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [registration, setRegistration] = useState(false);
  const [hackfestSelected, setHackfestSelected] = useState(
    session?.user?.isHackathonSelected ?? false,
  );
  const [modalType, setModalType] = useState<
    "selected" | "awaiting" | "nothing" | null
  >(null);
  const [hasCheckedModal, setHasCheckedModal] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [drawerDirection, setDrawerDirection] = useState<"right" | "bottom">(
    "right",
  );
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  const router = useRouter();
  const error = use(searchParams).error;
  const eventIdFromParams = use(searchParams).id;

  const selectedEvent = Array.isArray(events)
    ? (events.find((e) => e.id === selectedEventId) ?? null)
    : null;

  // biome-ignore lint/correctness/useExhaustiveDependencies: hmm
  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiFetch<{
        events: Event[];
        registrationsOpen: boolean;
        isHackathonSelected?: boolean;
        hasSubmittedIdea?: boolean;
        resultsOut?: boolean;
      }>("/api/events/getAll", { method: "GET" });

      setRegistration(response.registrationsOpen ?? false);
      if (response) {
        setEvents(response.events);
        if (
          response.isHackathonSelected &&
          hackfestSelected &&
          response.resultsOut
        ) {
          setHackfestSelected(true);
          setModalType("selected");
        } else if (
          response.hasSubmittedIdea &&
          !response.isHackathonSelected &&
          !response.resultsOut
        ) {
          setModalType("awaiting");
        }
      }
    } catch {
      toast.error("Failed to load events. Please refresh.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: hmm
  useEffect(() => {
    if (!hasCheckedModal && loaderDone) {
      if (!session) {
        setModalType("nothing");
      }
      setHasCheckedModal(true);
    }
  }, []);

  useEffect(() => {
    if (error === "email-mismatch") {
      router.replace("/events");
      setTimeout(() => {
        toast.error("Email mismatch. Please log in with the correct account.");
      }, 2000);
    }
  }, [error, router]);

  useEffect(() => {
    if (!loading && loaderDone && eventIdFromParams) {
      router.replace("/events");

      setTimeout(() => {
        const card = document.getElementById(`event-card-${eventIdFromParams}`);
        card?.scrollIntoView({ behavior: "smooth", block: "center" });
        setTimeout(() => {
          setSelectedEventId(eventIdFromParams);
          setDrawerOpen(true);
        }, 800);
      }, 100);
    }
  }, [loading, loaderDone, eventIdFromParams, router]);

  useEffect(() => {
    const checkMobile = () => {
      setDrawerDirection(
        window.matchMedia("(max-width: 767px)").matches ? "bottom" : "right",
      );
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handleCardClick = (id: string) => {
    setSelectedEventId(id);
    setDrawerOpen(true);
  };

  return (
    <div className="relative w-full min-h-screen overflow-hidden bg-cover bg-center bg-no-repeat bg-fixed">
      <div className="fixed inset-0 w-full max-h-screen z-0 pointer-events-none">
        <Image
          src={
            isNight
              ? "/images/shipwreck/shipwreckNight.webp"
              : "/images/shipwreck/shipwreckDay.webp"
          }
          alt="Shipwreck background"
          fill
          className="object-cover object-center"
          priority
        />
      </div>

      {session?.user && !session.user.collegeId && <UserDetailsForm />}

      <EventDrawer
        session={session}
        event={selectedEvent}
        drawerOpen={drawerOpen}
        fetchEvents={fetchEvents}
        setDrawerOpen={setDrawerOpen}
        registrationOpen={registration}
        drawerDirection={drawerDirection}
        hackfestSelected={hackfestSelected}
      />

      <Dialog
        open={modalType !== null}
        onOpenChange={(open) => {
          if (!open) setModalType(null);
        }}
      >
        <DialogContent className="bg-[#0f1823] border border-[#39577c] text-white p-6 max-w-sm md:max-w-md w-full rounded-2xl">
          {modalType === "selected" && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl font-bold text-[#f4d35e] flex items-center gap-2">
                  <Trophy className="w-5 h-5" />
                  Congratulations!
                </DialogTitle>
                <DialogDescription className="text-white/60 pt-2">
                  You have been selected for Hackfest! As a participant of the
                  main hackathon, you are not eligible to register for side
                  events.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="mt-4">
                <Button
                  onClick={() => setModalType(null)}
                  className="w-full bg-[#f4d35e] text-[#0b2545] font-bold hover:brightness-110 transition-all cursor-pointer"
                >
                  Ok
                </Button>
              </DialogFooter>
            </>
          )}

          {modalType === "awaiting" && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl font-bold text-[#f4d35e] flex items-center gap-2">
                  <TriangleAlert className="w-5 h-5 text-yellow-500" />
                  Awaiting Results
                </DialogTitle>
                <DialogDescription className="text-white/60 pt-2 text-md leading-relaxed">
                  You have registered for the main Hackfest and are awaiting
                  results. <br />
                  <br />
                  <span className="text-white/80 font-semibold">
                    Please note:
                  </span>{" "}
                  if you get selected for the hackathon, you won't be able to
                  register for any side events.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="mt-4">
                <Button
                  onClick={() => setModalType(null)}
                  className="w-full bg-[#f4d35e] text-[#0b2545] font-bold hover:brightness-110 transition-all cursor-pointer"
                >
                  Got It
                </Button>
              </DialogFooter>
            </>
          )}

          {modalType === "nothing" && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl font-bold text-[#f4d35e] flex items-center gap-2">
                  <Trophy className="w-5 h-5" />
                  Important Notice
                </DialogTitle>
                <DialogDescription className="text-white/60 pt-2 text-md leading-relaxed">
                  If you have registered for Hackfest through GitHub before,
                  please use the <b className="text-white">same email</b> for
                  event login to automatically sync your profile.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="mt-4">
                <Button
                  onClick={() => setModalType(null)}
                  className="w-full bg-[#f4d35e] text-[#0b2545] font-bold hover:brightness-110 transition-all cursor-pointer"
                >
                  Understood
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-14">
        <div className="text-center mb-16">
          <h2 className="text-5xl md:text-7xl mt-20 font-pirate text-transparent bg-clip-text bg-linear-to-b from-[#0f1823] to-[#133c88] drop-shadow-[0_0_12px_rgba(255,191,0,0.8)] tracking-wider">
            Events
          </h2>
        </div>

        {loading ? (
          <div className={GRID_CLASSES}>
            {Array.from({ length: 6 }, (_, i) => i).map((i) => (
              <Card
                key={`event-skeleton-${i}`}
                className="w-full bg-[#0f1823] border border-[#39577c]"
              >
                <CardHeader className="gap-2">
                  <Skeleton className="h-4 w-2/3 bg-[#133c55]" />
                  <Skeleton className="h-4 w-1/2 bg-[#133c55]" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="aspect-video w-full bg-[#133c55]" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : events?.length > 0 ? (
          <EventDetails
            events={events}
            registration={registration}
            handleCardClick={handleCardClick}
          />
        ) : (
          <div className="flex justify-center items-center py-20">
            <div className="flex flex-col gap-4 items-center text-center text-white">
              <TriangleAlert size={48} className="text-[#f4d35e]/60" />
              <p className="text-xl font-semibold">No events found</p>
              <p className="text-sm text-white/40">
                Check back soon for upcoming events.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Events;
