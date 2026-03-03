import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Mail, Phone, User } from "lucide-react";
import Image from "next/image";
import { redirect } from "next/navigation";
import type { Session } from "next-auth";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";
import { Button } from "../ui/button";
import { Drawer, DrawerContent, DrawerTitle } from "../ui/drawer";
import type { Event, EventOrganizer } from "./layout";
import RegisterButton from "./registerButton";
import { getDate, getTeamSize } from "./utils";

export default function EventDrawer({
  event,
  session,
  drawerOpen,
  setDrawerOpen,
  fetchEvents,
  registrationOpen,
  drawerDirection,
}: {
  event: Event | null;
  session: Session | null;
  drawerOpen: boolean;
  setDrawerOpen: (open: boolean) => void;
  fetchEvents: () => Promise<void>;
  registrationOpen: boolean;
  drawerDirection: "right" | "bottom";
}) {
  if (!event) return null;

  return (
    <Drawer
      open={drawerOpen}
      onOpenChange={setDrawerOpen}
      direction={drawerDirection}
    >
      <DrawerContent className="bg-[#0f1823] w-full sm:min-w-3/5 xl:min-w-2/5 p-0 rounded-l-xl border border-[#39577c]">
        <DrawerTitle className="text-3xl font-bold text-[#133c55] mb-4" asChild>
          <VisuallyHidden>Event Details</VisuallyHidden>
        </DrawerTitle>
        <div
          className={`flex flex-col gap-6 px-4 pb-8 overflow-y-auto flex-1 no-scrollbar ${
            drawerDirection === "bottom" ? "pt-2" : "pt-6"
          }`}
        >
          <h2 className="text-4xl lg:text-5xl font-bold text-[#f4d35e] wrap-break-word text-center">
            {event?.title}
          </h2>
          {event?.image && (
            <div className="flex justify-center relative">
              <Image
                src={event.image}
                alt={event.title}
                width={500}
                height={500}
                className="rounded-xl w-full max-w-md object-contain border border-[#f4d35e]/30 shadow"
              />
            </div>
          )}
          <div className="text-white prose prose-headings:text-white prose-li:text-white prose-strong:text-white min-w-full">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeRaw]}
            >
              {event?.description}
            </ReactMarkdown>
          </div>
          <div className="w-full mt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 md:gap-4 text-md lg:text-lg justify-center items-center">
              {[
                {
                  label: "Venue",
                  value: event?.venue || "TBA",
                },
                {
                  label: "Format",
                  value: event?.type,
                },
                {
                  label: "Team Size",
                  value:
                    getTeamSize(
                      event?.minTeamSize ?? 0,
                      event?.maxTeamSize ?? 0,
                    ) || "N/A",
                },
                {
                  label: "Entry Fee",
                  value: session
                    ? event?.amount !== 0
                      ? `${event.amount}${event.type === "Solo" ? "" : " per member"}`
                      : "Free"
                    : "To be announced",
                },
                {
                  label: "Date",
                  value: getDate(event?.date ?? "") || "TBA",
                },
                {
                  label: "Deadline",
                  value: (
                    <>
                      {new Date(event?.deadline ?? "").toLocaleDateString(
                        "en-US",
                        {
                          month: "short",
                          day: "numeric",
                        },
                      )}{" "}
                      at{" "}
                      {new Date(event?.deadline ?? "").toLocaleTimeString(
                        "en-US",
                        {
                          hour: "2-digit",
                          minute: "2-digit",
                        },
                      )}
                    </>
                  ),
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-xl p-2 flex flex-col items-center justify-center w-full h-full bg-linear-to-br from-[#133c55] to-[#0f1823] border border-[#f4d35e]/30 shadow-[0_0_15px_rgba(244,211,94,0.15)]"
                >
                  <span className="font-bold text-purple-900 dark:text-purple-100 truncate">
                    {item.label}
                  </span>
                  <span className="font-normal text-purple-900 dark:text-purple-100 truncate flex">
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
          {event?.organizers && event.organizers.length > 0 && (
            <div className="mt-2">
              <h3 className="lg:text-2xl md:text-xl text-[#f4d35e] lg:mb-2 mb-1">
                Organizers
              </h3>

              <div className="grid sm:grid-cols-2 lg:gap-4 gap-4">
                {event.organizers.map((organizer: EventOrganizer) => (
                  <div
                    key={organizer.id}
                    className="rounded-2xl lg:p-4 p-2 bg-linear-to-br from-[#133c55] to-[#0f1823] border border-[#f4d35e]/30 shadow-[0_0_20px_rgba(244,211,94,0.12)]"
                  >
                    <div className="flex flex-col lg:gap-2 gap-1 text-purple-100">
                      {/* Name */}
                      <div className="flex items-center lg:gap-3 gap-2">
                        <User className="w-5 h-5 text-[#f4d35e]" />
                        <span className="font-semibold lg:text-lg text-md">
                          {organizer.name ?? "TBA"}
                        </span>
                      </div>

                      {/* Email */}
                      {organizer.email && (
                        <div className="flex items-center lg:gap-3 gap-2">
                          <Mail className="w-5 h-5 text-[#f4d35e]" />
                          <a
                            href={`mailto:${organizer.email}`}
                            className="hover:underline break-all"
                          >
                            {organizer.email}
                          </a>
                        </div>
                      )}

                      {/* Phone */}
                      {organizer.phone && (
                        <div className="flex items-center lg:gap-3 gap-2">
                          <Phone className="w-5 h-5 text-[#f4d35e]" />
                          <a
                            href={`tel:${organizer.phone}`}
                            className="hover:underline"
                          >
                            {organizer.phone}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="w-full flex flex-col gap-4">
            {registrationOpen &&
              (session ? (
                <RegisterButton
                  event={event}
                  session={session}
                  fetchEvents={fetchEvents}
                  setDrawerOpen={setDrawerOpen}
                />
              ) : (
                <>
                  <div className="mb-4 p-3 rounded-md bg-amber-50 border border-amber-300 text-amber-900 text-xs sm:text-sm">
                    <p className="font-bold">Note for Hackfest Participants:</p>
                    <p>
                      If you previously registered for Hackfest, please log in
                      using the same email address used during that
                      registration. If this does not apply to you, you may
                      ignore this message and continue normally.
                    </p>
                  </div>
                  <Button
                    onClick={() => redirect("/api/auth/event/signin")}
                    className="w-full py-6 text-xl text-[#0b2545] cursor-pointer capitalize shrink-0 flex gap-2 items-center justify-center bg-linear-to-r from-[#cfb536] to-[#c2a341] hover:brightness-110 transition-all duration-300"
                  >
                    Log in to Register
                  </Button>
                </>
              ))}
            {registrationOpen &&
              (event.status === "Published" &&
              new Date(event.deadline) < new Date() ? (
                <div className="p-4 rounded-md bg-red-900 border border-red-500 text-xl font-semibold text-red-50 text-center">
                  Registrations for this event have closed
                </div>
              ) : event.status === "Ongoing" ? (
                <div className="p-4 rounded-md bg-green-900 border border-green-500 text-xl font-semibold text-green-50 text-center">
                  Event is currently ongoing
                </div>
              ) : event.status === "Completed" ? (
                <div className="p-4 rounded-md bg-gray-800 border border-gray-500 text-xl font-semibold text-gray-50 text-center">
                  Event has concluded
                </div>
              ) : null)}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
