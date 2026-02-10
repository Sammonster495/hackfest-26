"use client";

import {
  CalendarDays,
  Compass,
  MapPin,
  TriangleAlert,
  User,
  Users,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const generateEventUrl = (eventName: string, eventID: string) => {
  return `/event/${eventName.toLowerCase().replaceAll(" ", "-")}-${eventID}`;
};
//
const baseImageUrl = "/images/tracks/FinTech.png";

const Event = ({
  data,
}: {
  data: {
    id: string;
    name: string;
    category: string;
    eventType: string;
    minTeamSize: number;
    maxTeamSize: number;
    venue: string;
    rounds: { date: string }[];
    image?: string;
  };
}) => {
  const getEventAttributes = () => {
    let teamSizeText = "",
      eventTypeText = "";
    if (data.minTeamSize === data.maxTeamSize) {
      if (data.minTeamSize === 1)
        teamSizeText += `${data.minTeamSize} member per team`;
      else teamSizeText += `${data.minTeamSize} members per team`;
      if (data.minTeamSize === 0) teamSizeText = "";
    } else {
      teamSizeText = `${data.minTeamSize} - ${data.maxTeamSize} members per team`;
    }

    if (data.eventType.includes("MULTIPLE")) {
      eventTypeText =
        data.eventType.split("_")[0][0] +
        data.eventType.split("_")[0].slice(1).toLowerCase() +
        " (Multiple Entry)";
    } else
      eventTypeText = data.eventType[0] + data.eventType.slice(1).toLowerCase();

    eventTypeText = eventTypeText.replaceAll("Individual", "Solo");
    eventTypeText = eventTypeText.replaceAll("Team", "Multiplayer");

    return [
      {
        name: "Date",
        text: data.rounds[0]?.date
          ? new Date(data.rounds[0]?.date).toLocaleString("en-IN", {
              day: "numeric",
              month: "short",
              hour: "numeric",
              minute: "numeric",
              hour12: true,
            })
          : "TBD",
        Icon: CalendarDays,
      },
      {
        name: "Type",
        text: eventTypeText,
        Icon: User,
      },
      {
        name: "Venue",
        text: data.venue,
        Icon: MapPin,
      },
      {
        name: "Team Size",
        text: teamSizeText,
        Icon: Users,
      },
    ];
  };

  return (
    <div
      data-scroll
      className={`relative hover:scale-[1.01] hover:shadow-[0_20px_40px_rgba(0,0,0,0.35)] transition-all duration-300 ease-out cursor-pointer bg-[#0f1823] border border-[#39577c] px-2 rounded-2xl flex flex-col gap-2 w-full mx-auto py-2`}
    >
      <div>
        <div className=" bg-[#133c55]  rounded-t-xl">
          <div className="w-full">
            <div className="-skew-x-37 py-[0.015rem] bg-[#0f1823] absolute rounded-bl-3xl rounded-br-xl left-0 w-1/2 flex justify-start px-4 -translate-y-1">
              <Image
                src={`/logo.png`}
                alt={"Hackfest Logo"}
                width={550}
                height={550}
                className="object-fill h-8 w-8 z-0 text-white skew-x-37 "
              />
            </div>
            <div
              className={`tracking-widest uppercase font-extrabold flex justify-end pt-1 pr-2 text-[#f4d35e]`}
            >
              {data.category?.toLowerCase() === "non_technical"
                ? "Non Tech"
                : data.category?.toLocaleLowerCase()}
            </div>
          </div>
        </div>
        <div className=" bg-[#133c55]  rounded-b-xl rounded-tl-xl justify-end items-end right-0">
          <div className={`rounded-xl object-fill p-2`}>
            {data.image && (
              <Image
                // src={`https://res.cloudinary.com/dqy4wpxhn/image/upload/v1682653090/Events/VOCAL_TWIST_%28WESTERN%29_1682653088345.jpg`}
                src={data.image}
                alt={data.name}
                width={250}
                height={250}
                className="object-cover rounded-xl h-full w-full border border-[#f4d35e]/30 shadow-inner"
              />
            )}
          </div>
        </div>
      </div>
      <div className="text-2xl text-[#f4d35e] text-center font-VikingHell tracking-wide">
        {data.name}
      </div>
      <div className="flex flex-col w-full gap-2 text-white px-1 py-3 justify-center items-start md:w-full h-[9rem]">
        {getEventAttributes().map((attr) =>
          attr.name ? (
            <div
              className="w-full flex items-center border border-[#f4d35e]/20 gap-2 text-left bg-[#1c4966]/30 p-1 rounded-xl backdrop-blur-sm px-2"
              key={attr.name}
            >
              <attr.Icon />
              {/* hyd warning due to toLocaleString()
                safe to ignore - https://nextjs.org/docs/messages/react-hydration-error#solution-3-using-suppresshydrationwarning */}
              <span suppressHydrationWarning className="text-sm truncate">
                {attr.text}
              </span>
            </div>
          ) : null,
        )}
      </div>
      <div className="w-full mt-2">
        <Link href={generateEventUrl(data.name, data.id)}>
          <button
            type="button"
            className="font-VikingHell tracking-wider text-lg text-[#0b2545] capitalize shrink-0 w-full py-2 flex gap-2 items-center justify-center rounded-full bg-linear-to-r from-[#cfb536] to-[#c2a341] hover:brightness-110 hover:scale-[1.02] transition-all duration-300"
          >
            <Compass size={20} />
            Set Sail
          </button>
        </Link>
      </div>
    </div>
  );
};

const Events = () => {
  const events = [
    {
      id: "123",
      name: "Vocal Twist (Western)",
      image: baseImageUrl,
      category: "Non_Technical",
      eventType: "INDIVIDUAL",
      minTeamSize: 1,
      maxTeamSize: 1,
      venue: "Auditorium",
      rounds: [
        {
          date: "2024-11-15T18:30:00.000Z",
        },
      ],
    },
    {
      id: "124",
      name: "Code Sprint",
      image: baseImageUrl,
      category: "Technical",
      eventType: "TEAM",
      minTeamSize: 2,
      maxTeamSize: 4,
      venue: "Lab 1",
      rounds: [
        {
          date: "2024-11-16T10:00:00.000Z",
        },
      ],
    },
    {
      id: "125",
      name: "Design Challenge",
      image: baseImageUrl,
      category: "Non_Technical",
      eventType: "INDIVIDUAL",
      minTeamSize: 1,
      maxTeamSize: 1,
      venue: "Room 101",
      rounds: [
        {
          date: "2024-11-17T14:00:00.000Z",
        },
      ],
    },
  ];
  return (
    <div
      data-scroll-section
      data-scroll-speed="0.7"
      className={
        events.length > 0
          ? `pt-20 max-w-7xl w-full h-full mx-auto grid justify-center grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 mb-20`
          : "flex justify-center items-center w-full h-full"
      }
    >
      <Image
        src={`/images/underwater.png`}
        alt={"Sea Background"}
        width={1920}
        height={1080}
        className="absolute top-0 left-0 w-full h-full object-cover "
      />
      {events.length > 0 ? (
        events.map((event) => <Event key={event.id} data={event} />)
      ) : (
        <div
          data-scroll
          className={`w-full flex flex-col bg-black/30 p-10 rounded-xl gap-5 justify-center items-center text-center text-white text-xl border border-primary-200/80`}
        >
          <TriangleAlert size={50} />
          No events found
        </div>
      )}
    </div>
  );
};

export default Events;
