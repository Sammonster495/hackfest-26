import { Compass } from "lucide-react";
import Image from "next/image";
import { Button } from "../ui/button";
import type { Event } from "./layout";
import { getEventAttributes } from "./utils";

export default function EventDetails({
  events,
  registration,
  handleCardClick,
}: {
  events: Event[];
  registration: boolean;
  handleCardClick: (id: string) => void;
}) {
  const statusLabel = {
    Published: "Set Sail Now!",
    Ongoing: "Voyage in Progress...",
    Completed: "Voyage Concluded",
  };

  return (
    <div
      data-scroll-section
      data-scroll-speed="0.7"
      className="w-full h-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 lg:gap-16 md:gap-10 gap-6 justify-center items-start"
    >
      {events.map((event) => (
        // biome-ignore lint/a11y/noStaticElementInteractions: clickable card
        // biome-ignore lint/a11y/useKeyWithClickEvents: clickable card
        <div
          key={event.id}
          onClick={() => handleCardClick(event.id)}
          className="relative cursor-pointer hover:shadow-[0_20px_40px_rgba(0,0,0,0.35)] transition-all duration-300 ease-out bg-[#0f1823] border border-[#39577c] rounded-2xl flex flex-col gap-3 w-full mx-auto p-3 overflow-hidden"
        >
          {/* Card header — logo + type badge */}
          <div>
            <div className="bg-[#133c55] rounded-tr-xl relative flex items-center justify-end px-3 pt-3">
              {/* Logo notch */}
              <div className="absolute -left-6 -top-1 -skew-x-37 bg-[#0f1823] rounded-bl-3xl rounded-br-xl px-10 pb-2">
                <Image
                  src="/logos/Logotext@3x-8.png"
                  alt="Hackfest Logo"
                  width={550}
                  height={550}
                  className="h-8 w-20 skew-x-37 scale-[1.1]"
                />
              </div>
              {/* Type badge */}
              <span className="tracking-widest uppercase font-extrabold text-md text-[#f4d35e]">
                {event.type === "Solo" ? "Individual" : "Team"}
              </span>
            </div>

            {/* Event image */}
            {event.image && (
              <div className="bg-[#133c55] px-3 py-3 rounded-b-xl rounded-tl-xl">
                <Image
                  src={event.image}
                  alt={event.title}
                  width={250}
                  height={250}
                  className="object-cover rounded-xl w-full border border-[#f4d35e]/30 shadow-inner"
                />
              </div>
            )}
          </div>

          {/* Title */}
          <h3 className="text-2xl text-[#f4d35e] text-center font-bold tracking-wide px-1">
            {event.title}
          </h3>

          {/* Attributes */}
          <div className="flex flex-col gap-2 px-1">
            {getEventAttributes(event).map((attr) => (
              <div
                key={attr.name}
                className="flex items-center gap-2 border border-[#f4d35e]/20 bg-[#1c4966]/30 rounded-xl px-3 py-2 backdrop-blur-sm"
              >
                <attr.Icon />
                <span
                  suppressHydrationWarning
                  className="text-sm text-white truncate"
                >
                  {attr.text}
                </span>
              </div>
            ))}
          </div>

          {/* CTA */}
          <Button className="cursor-pointer tracking-wider text-lg text-[#0b2545] capitalize w-full py-2 flex gap-2 items-center justify-center rounded-full bg-linear-to-r from-[#cfb536] to-[#c2a341] hover:brightness-110 hover:scale-[1.02] transition-all duration-300">
            <Compass size={20} />
            {registration
              ? event.status !== "Draft" && statusLabel[event.status]
              : "Docking soon..."}
          </Button>
        </div>
      ))}
    </div>
  );
}
