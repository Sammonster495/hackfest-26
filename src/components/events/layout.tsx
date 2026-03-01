"use client";

import { TriangleAlert } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import type { Session } from "next-auth";
import { use, useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { apiFetch } from "~/lib/fetcher";
import { useDayNight } from "../providers/useDayNight";
import { Card, CardContent, CardHeader } from "../ui/card";
import { Skeleton } from "../ui/skeleton";
import EventDetails from "./details";
import EventDrawer from "./drawer";
import { UserDetailsForm } from "./userDetails";

export type EventTeam = {
  id: string;
  name: string;
  eventId: string;
  attended: boolean;
  isComplete: boolean;
  paymentStatus: "Pending" | "Paid" | "Refunded";
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
  teamId: string;
  userId: string;
  eventId: string;
  attended: boolean;
};

export type Event = {
  id: string;
  title: string;
  description: string;
  date: string;
  venue: string;
  priority: number;
  type: "Solo" | "Team";
  status: "Draft" | "Published" | "Ongoing" | "Completed";
  audience: "Participants" | "Non-Participants" | "Both";
  maxTeams: number;
  minTeamSize: number;
  maxTeamSize: number;
  image?: string;
  deadline: string;
  team?: EventTeam;
  isLeader?: boolean;
  isComplete?: boolean;
  organizers?: EventOrganizer[];
  teamMembers?: EventMember[];
};

const GRID_CLASSES =
  "w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 lg:gap-16 md:gap-10 gap-6 items-start";

const Events = ({
  session,
  searchParams,
}: {
  session: Session | null;
  searchParams: Promise<{ error?: string }>;
}) => {
  const { isNight } = useDayNight();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [registration, setRegistration] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [drawerDirection, setDrawerDirection] = useState<"right" | "bottom">(
    "right",
  );
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  const router = useRouter();
  const error = use(searchParams).error;
  // const { data: session, update } = useSession();

  const selectedEvent = Array.isArray(events)
    ? (events.find((e) => e.id === selectedEventId) ?? null)
    : null;

  const fetchEvents = useCallback(async () => {
    try {
      const response = await apiFetch<{
        events: Event[];
        registrationsOpen: boolean;
      }>("/api/events/getAll", { method: "GET" });

      setRegistration(response.registrationsOpen ?? false);
      if (response) setEvents(response.events);
    } catch {
      toast.error("Failed to load events. Please refresh.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  useEffect(() => {
    if (error === "email-mismatch") {
      router.replace("/events");
      setTimeout(() => {
        toast.error("Email mismatch. Please log in with the correct account.");
      }, 2000);
    }
  }, [error, router]);

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

      {session?.eventUser && !session.eventUser.collegeId && (
        <UserDetailsForm />
      )}

      <EventDrawer
        session={session}
        event={selectedEvent}
        drawerOpen={drawerOpen}
        fetchEvents={fetchEvents}
        setDrawerOpen={setDrawerOpen}
        registrationOpen={registration}
        drawerDirection={drawerDirection}
      />

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
