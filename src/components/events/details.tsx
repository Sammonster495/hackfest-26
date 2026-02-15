import { Compass } from "lucide-react";
import Image from "next/image";
import { Button } from "../ui/button";
import type { Event } from "./layout";
import { getEventAttributes } from "./utils";

export default function EventDetails({
  events,
  handleCardClick,
}: {
  events: Event[];
  handleCardClick: (id: string) => void;
}) {
  return (
    <div
      data-scroll-section
      data-scroll-speed="0.7"
      className="w-full h-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 lg:gap-16 md:gap-10 gap-6 justify-center items-start"
    >
      {events.map((event) => (
        <div
          key={event.id}
          className={`relative hover:scale-[1.01] hover:shadow-[0_20px_40px_rgba(0,0,0,0.35)] transition-all duration-300 ease-out cursor-pointer bg-[#0f1823] border border-[#39577c] px-2 rounded-2xl flex flex-col gap-2 w-full mx-auto py-2`}
        >
          <div>
            <div className=" bg-[#133c55]  rounded-t-xl">
              <div className="w-full">
                <div className="-skew-x-37 bg-[#0f1823] absolute rounded-bl-3xl rounded-br-xl left-0 w-1/3 justify-start px-4">
                  <Image
                    src={"/logos/glowingLogo.png"}
                    alt={"Hackfest Logo"}
                    width={550}
                    height={550}
                    className="object-fill -translate-y-1 translate-x-1 h-8 w-10 scale-[1.2] skew-x-37 drop-shadow-[0_0_12px_rgba(255,191,0,0.8)]"
                  />
                </div>
                <div
                  className={`tracking-widest uppercase font-extrabold flex justify-end pt-1 pr-2 text-[#f4d35e]`}
                >
                  {event.type === "Solo" ? "Individual" : "Team"}
                </div>
              </div>
            </div>
            <div className=" bg-[#133c55]  rounded-b-xl rounded-tl-xl justify-end items-end right-0">
              <div className={`rounded-xl object-fill p-2`}>
                {event.image && (
                  <Image
                    // TODO: Update to dynamic image path when available
                    src={"/images/tracks/FinTech.png"}
                    alt={event.title}
                    width={250}
                    height={250}
                    className="object-cover rounded-xl h-full w-full border border-[#f4d35e]/30 shadow-inner"
                  />
                )}
              </div>
            </div>
          </div>
          <div className="text-2xl text-[#f4d35e] text-center font-bold tracking-wide">
            {event.title}
          </div>
          <div className="flex flex-col w-full gap-2 text-white px-1 py-3 justify-center items-start md:w-full h-36 mt-1">
            {getEventAttributes(event).map((attr) => (
              <div
                className="w-full flex items-center border border-[#f4d35e]/20 gap-2 text-left bg-[#1c4966]/30 p-1 rounded-xl backdrop-blur-sm px-2"
                key={attr.name}
              >
                <attr.Icon />
                <span suppressHydrationWarning className="text-sm truncate">
                  {attr.text}
                </span>
              </div>
            ))}
          </div>
          <div className="w-full mt-2">
            <Button
              onClick={() => handleCardClick(event.id)}
              className="cursor-pointer tracking-wider text-lg text-[#0b2545] capitalize shrink-0 w-full py-2 flex gap-2 items-center justify-center rounded-full bg-linear-to-r from-[#cfb536] to-[#c2a341] hover:brightness-110 hover:scale-[1.02] transition-all duration-300"
            >
              <Compass size={20} />
              Set Sail
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
