import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import Image from "next/image";
import { redirect } from "next/navigation";
import { useSession } from "next-auth/react";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";
import { Button } from "../ui/button";
import { Drawer, DrawerContent, DrawerTitle } from "../ui/drawer";
import type { Event } from "./layout";
import { getDate, getTeamSize } from "./utils";

export default function EventDrawer({
  event,
  drawerOpen,
  setDrawerOpen,
  drawerDirection,
}: {
  event: Event | null;
  drawerOpen: boolean;
  setDrawerOpen: (open: boolean) => void;
  drawerDirection: "right" | "bottom";
}) {
  const { data: session } = useSession();
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
          className={`flex flex-col gap-6 px-4 pb-8 overflow-y-auto flex-1 ${
            drawerDirection === "bottom" ? "pt-2" : "pt-6"
          }`}
        >
          <h2 className="text-4xl lg:text-5xl font-bold text-[#f4d35e] wrap-break-word text-center">
            {event?.title}
          </h2>
          {event?.image && (
            <div className="flex justify-center relative">
              <Image
                // TODO: Update to dynamic image path when available
                src="/images/tracks/FinTech.png"
                alt={event.title}
                width={500}
                height={500}
                className="rounded-xl w-full max-w-md object-contain border border-[#f4d35e]/30 shadow"
              />
            </div>
          )}
          <div className="text-white prose prose-headings:text-white prose-li:text-white min-w-full">
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
                  value: "Free",
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
          <div>
            {session ? (
              <Button
                onClick={() => alert("Registration functionality coming soon!")}
                className="w-full py-6 text-xl text-[#0b2545] cursor-pointer capitalize shrink-0 flex gap-2 items-center justify-center bg-linear-to-r from-[#cfb536] to-[#c2a341] hover:brightness-110 transition-all duration-300"
              >
                Register Now
              </Button>
            ) : (
              <>
                <div className="mb-4 p-3 rounded-md bg-amber-50 border border-amber-300 text-amber-900 text-xs sm:text-sm">
                  <p className="font-bold">Note for Hackfest Participants:</p>
                  <p>
                    If you previously registered for Hackfest, please log in
                    using the same email address used during that registration.
                    If this does not apply to you, you may ignore this message
                    and continue normally.
                  </p>
                </div>
                <Button
                  onClick={() => redirect("/api/auth/event/signin")}
                  className="w-full py-6 text-xl text-[#0b2545] cursor-pointer capitalize shrink-0 flex gap-2 items-center justify-center bg-linear-to-r from-[#cfb536] to-[#c2a341] hover:brightness-110 transition-all duration-300"
                >
                  Log in to Register
                </Button>
              </>
            )}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
