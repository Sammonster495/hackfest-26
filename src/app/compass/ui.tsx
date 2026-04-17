"use client";

import { Home, MapPinned, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import QRCode from "react-qr-code";

type TimerPayload = {
  timer?: {
    label: string;
    status: "IDLE" | "RUNNING" | "PAUSED" | "COMPLETED";
    remaining: number;
    durationSeconds: number;
  } | null;
};

type CompassClientProps = {
  teamId: string;
  teamName: string;
  teamNo: number | null;
  maleCount: number;
  femaleCount: number;
  labAssignment: string;
  announcementText: string;
  dormNote: string;
  maleDorm?: string;
  femaleDorm?: string;
};

type MapSpot = {
  id: string;
  title: string;
  x: number;
  y: number;
  order?: number;
  previewImage: string;
  previewAlt: string;
  showNumber?: boolean;
};

function formatSeconds(totalSeconds: number) {
  const safe = Math.max(0, totalSeconds);
  const h = Math.floor(safe / 3600);
  const m = Math.floor((safe % 3600) / 60);
  const s = safe % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function formatCurrentTime(date: Date) {
  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
}

export function CompassClient({
  teamId,
  teamName,
  teamNo,
  maleCount,
  femaleCount,
  labAssignment,
  dormNote,
  announcementText,
  maleDorm = "TBA",
  femaleDorm = "TBA",
}: CompassClientProps) {
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [timerStatus, setTimerStatus] = useState<
    "IDLE" | "RUNNING" | "PAUSED" | "COMPLETED" | null
  >(null);
  const [clock, setClock] = useState(new Date());
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [activeSpotId, setActiveSpotId] = useState("checkin-desk");
  const sourceRef = useRef<EventSource | null>(null);

  const mapSpots: MapSpot[] = useMemo(
    () => [
      {
        id: "ramanujan-block",
        title: "Ramanujan Block",
        x: 54,
        y: 68,
        order: 1,
        showNumber: true,
        previewImage: "/images/map/ramanujan.webp",
        previewAlt: "Ramanujan Block preview",
      },
      {
        id: "apj-block",
        title: "APJ Block",
        x: 68,
        y: 80,
        order: 2,
        showNumber: true,
        previewImage: "/images/map/apj.webp",
        previewAlt: "APJ preview",
      },
      {
        id: "sac",
        title: "SAC",
        x: 64,
        y: 48,
        showNumber: false,
        previewImage: "/images/map/sac.webp",
        previewAlt: "SAC preview",
      },

      {
        id: "smv",
        title: "SMV Block",
        x: 74,
        y: 44,
        order: 3,
        showNumber: true,
        previewImage: "/images/map/smv.webp",
        previewAlt: "SMV Block preview",
      },

      {
        id: "mechanical-workshop",
        title: "Mechanical Workshop",
        x: 106,
        y: 42,
        order: 4,
        showNumber: true,
        previewImage: "/images/map/food-area.webp",
        previewAlt: "Food Area preview",
      },
      {
        id: "cv-raman",
        title: "CV RAMAN Block",
        x: 88,
        y: 58,
        showNumber: false,
        previewImage: "/images/map/cv-raman.webp",
        previewAlt: "Location preview",
      },
      {
        id: "atal-block",
        title: "Atal Block",
        x: 28,
        y: 40,
        showNumber: false,
        previewImage: "/images/map/atal.webp",
        previewAlt: "Location preview",
      },
      {
        id: "entrance",
        title: "Enterance Point",
        x: 60,
        y: 100,
        showNumber: false,
        previewImage: "/images/map/gate.webp",
        previewAlt: "Location preview",
      },
    ],
    [],
  );

  const activeSpot = useMemo(
    () => mapSpots.find((spot) => spot.id === activeSpotId) ?? mapSpots[0],
    [mapSpots, activeSpotId],
  );

  const orderedSpots = useMemo(
    () =>
      [...mapSpots].sort(
        (a, b) => (a.order ?? Infinity) - (b.order ?? Infinity),
      ),
    [mapSpots],
  );

  useEffect(() => {
    if (!isMapOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsMapOpen(false);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isMapOpen]);

  useEffect(() => {
    if (!isMapOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isMapOpen]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const tick = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(tick);
  }, []);

  useEffect(() => {
    const connect = () => {
      sourceRef.current?.close();
      const es = new EventSource("/api/timer/stream");
      sourceRef.current = es;

      es.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data) as TimerPayload;
          setTimerStatus(payload.timer?.status ?? null);
          const next = payload.timer?.remaining;
          setRemaining(typeof next === "number" ? next : null);
        } catch {
          setTimerStatus(null);
          setRemaining(null);
        }
      };

      es.onerror = () => {
        es.close();
        sourceRef.current = null;
        setTimerStatus(null);
        setRemaining(null);
      };
    };

    connect();
    return () => sourceRef.current?.close();
  }, []);

  const timerText = useMemo(() => {
    if (remaining !== null && remaining <= 0) return "TIME UP";
    if (remaining !== null) return formatSeconds(remaining);
    if (!isMounted) return "--:--:--";
    return formatCurrentTime(clock);
  }, [remaining, clock, isMounted]);

  const timerTone = useMemo(() => {
    if (remaining !== null && remaining <= 0) {
      return {
        textClass: "text-[#ff6b6b]",
        glow: "0 0 10px rgba(255,59,59,0.95), 0 0 22px rgba(255,59,59,0.75)",
      };
    }

    if (timerStatus === "PAUSED") {
      return {
        textClass: "text-[#ffd08a]",
        glow: "0 0 8px rgba(255,153,51,0.85), 0 0 18px rgba(255,153,51,0.55)",
      };
    }

    if (
      timerStatus === "RUNNING" &&
      remaining !== null &&
      remaining <= 216000
    ) {
      return {
        textClass: "text-[#ff8b8b]",
        glow: "0 0 9px rgba(255,66,66,0.9), 0 0 20px rgba(255,66,66,0.65)",
      };
    }

    if (timerStatus === "RUNNING") {
      return {
        textClass: "text-[#8bffbf]",
        glow: "0 0 8px rgba(74,222,128,0.8), 0 0 18px rgba(74,222,128,0.55)",
      };
    }

    return {
      textClass: "text-[#eef6ff]",
      glow: "none",
      label:
        remaining === null ? (isMounted ? "CURRENT TIME" : "SYNCING") : "IDLE",
    };
  }, [remaining, timerStatus, isMounted]);

  const isNight = useMemo(() => {
    const h = clock.getHours();
    return h >= 18 || h < 6;
  }, [clock]);

  const dormMode = useMemo(() => {
    if (maleCount > 0 && femaleCount === 0) return "male-only";
    if (femaleCount > 0 && maleCount === 0) return "female-only";
    return "mixed";
  }, [maleCount, femaleCount]);

  const teamNoLabel = teamNo !== null ? String(teamNo).padStart(2, "0") : "--";

  return (
    <main
      className={`relative min-h-dvh w-full overflow-hidden ${
        isNight ? "bg-[#061b3f]" : "bg-[#5c97c6]"
      }`}
    >
      <div className="absolute inset-0 z-0">
        <Image
          src={
            isNight
              ? "/images/shipwreck/shipwreckNight.webp"
              : "/images/shipwreck/shipwreckDay.webp"
          }
          alt="Shipwreck background"
          fill
          priority
          className={`object-cover object-bottom ${isNight ? "" : "brightness-[0.82] saturate-[0.84] contrast-[0.96]"}`}
        />
      </div>

      <div
        className="absolute inset-0 z-0"
        style={{
          background: isNight
            ? "radial-gradient(120% 90% at 50% 0%, rgba(180,220,255,0.08) 0%, rgba(20,70,130,0.05) 35%, rgba(5,22,45,0.18) 100%)"
            : "radial-gradient(120% 90% at 50% 0%, rgba(255,255,255,0.07) 0%, rgba(104,164,212,0.06) 45%, rgba(34,92,148,0.16) 100%)",
        }}
      />

      <div className="pointer-events-none absolute inset-0 z-0 opacity-[0.06]">
        <div className="absolute -top-8 left-1/2 h-[80vh] w-[130vw] -translate-x-1/2 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.55),transparent_70%)]" />
      </div>

      <div className="pointer-events-none absolute left-4 top-24 z-0 flex flex-col gap-5 opacity-70">
        <span className="h-3 w-3 rounded-full border border-white/70 bg-white/20" />
        <span className="h-2.5 w-2.5 rounded-full border border-white/70 bg-white/20" />
        <span className="h-2 w-2 rounded-full border border-white/70 bg-white/20" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-dvh w-full max-w-md flex-col justify-start gap-3 px-5 pb-8 pt-14">
        <div
          className="relative w-full overflow-hidden rounded-[20px] border border-[#f3d8a7]/[0.4] bg-[#6f4a26]/[0.18] shadow-[0_10px_22px_rgba(1,10,28,0.18),inset_0_1px_0_rgba(255,246,224,0.22)] backdrop-blur-[8px]"
          style={{
            WebkitBackdropFilter: "blur(8px) saturate(120%)",
            backdropFilter: "blur(8px) saturate(120%)",
          }}
        >
          <div className="relative h-[108px] w-full">
            <Image
              src="/images/map.webp"
              alt="Campus map"
              fill
              className="object-cover blur-[1.5px] scale-[1.02]"
            />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(63,36,16,0.16)_0%,rgba(40,24,12,0.58)_100%)]" />
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_30%,rgba(255,232,189,0.16),transparent_58%)] backdrop-blur-[0.75px]" />

            <div className="absolute inset-0 flex items-center justify-center">
              <button
                type="button"
                onClick={() => setIsMapOpen(true)}
                className="inline-flex h-8 items-center gap-1.5 rounded-full border border-[#f4ddb2]/[0.62] bg-[#f4ddb2]/[0.26] px-4 font-pirate text-[10px] tracking-[0.14em] text-[#fff6e6] shadow-[0_8px_18px_rgba(20,10,4,0.28)]"
              >
                <MapPinned className="h-3.5 w-3.5" />
                CAMPUS MAP
              </button>
            </div>
          </div>
        </div>

        <div
          className="relative w-full overflow-hidden rounded-[26px] border border-white/[0.18] bg-white/[0.015] p-4 text-[#eef6ff] shadow-[0_10px_20px_rgba(1,10,28,0.12),inset_0_1px_0_rgba(255,255,255,0.2)] backdrop-blur-[8px] backdrop-saturate-[115%]"
          style={{
            WebkitBackdropFilter: "blur(8px) saturate(115%)",
            backdropFilter: "blur(8px) saturate(115%)",
          }}
        >
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(165deg,rgba(255,255,255,0.012),rgba(255,255,255,0.001)_46%,rgba(153,198,255,0.006)_75%,rgba(68,128,201,0.006))]" />
          <div className="pointer-events-none absolute -left-20 top-6 h-48 w-48 rounded-full bg-white/[0.015] blur-3xl" />
          <div className="pointer-events-none absolute -right-16 bottom-10 h-44 w-44 rounded-full bg-[#d7ebff]/[0.012] blur-3xl" />
          <div className="pointer-events-none absolute inset-x-10 top-2 h-7 rounded-full bg-white/[0.025] blur-lg" />
          <div className="mb-3 flex items-center justify-between gap-2">
            <Link
              href="/teams"
              className="inline-flex h-9 w-9 items-center justify-center rounded-[11px] border border-white/[0.3] bg-white/[0.06] text-[#f2f8ff] shadow-[inset_0_1px_0_rgba(255,255,255,0.22)]"
            >
              <Home className="h-4 w-4" />
            </Link>
          </div>

          <div className="relative z-10 p-1.5">
            <div className="relative overflow-hidden border-y border-white/[0.14] bg-white/[0.01] py-1.5">
              <div className="announcement-track flex min-w-max items-center gap-8 whitespace-nowrap px-3 text-[11px] text-[#e9f5ff]">
                <span>{announcementText}</span>
                <span className="text-[#b9d7ff]">•</span>
                <span>{announcementText}</span>
                <span className="text-[#b9d7ff]">•</span>
                <span>{announcementText}</span>
              </div>
            </div>

            <section className="px-3 pb-4 pt-5 text-center">
              <p className="font-pirate text-xs tracking-[0.22em] text-[#dbe9ff]">
                TIMER
              </p>
              <p
                className={`mt-1 font-pirate text-[52px] leading-[1] tracking-wide ${timerTone.textClass}`}
                style={{ textShadow: timerTone.glow }}
              >
                {timerText}
              </p>
              <p className="mt-1 font-pirate text-xs tracking-[0.18em] text-[#d0e2ff]">
                {timerTone.label}
              </p>
            </section>

            <div className="my-0.5 h-px bg-white/[0.12]" />

            <section className="grid grid-cols-[minmax(0,1fr)_102px] gap-3 pt-2">
              <div>
                <p className="font-pirate text-xs tracking-[0.18em] text-[#dbe9ff]">
                  TEAM NAME
                </p>
                <p className="mt-1 font-pirate text-[40px] leading-[0.95]">
                  {teamName}
                </p>

                <div className="mt-3 border-t border-white/[0.12] pt-2">
                  <div className="flex items-center justify-between">
                    <p className="font-pirate text-[30px] leading-none">Lab</p>
                    <p className="font-pirate text-[44px] leading-none">
                      {labAssignment}
                    </p>
                  </div>
                </div>

                <div className="mt-2 border-t border-white/[0.12] pt-2">
                  <p className="mb-1.5 font-pirate text-[30px] leading-none">
                    Dorm
                  </p>
                  {dormMode === "male-only" ? (
                    <div className="flex items-center justify-between">
                      <p className="font-pirate text-lg">Male Dorm</p>
                      <p className="font-pirate text-xl text-center max-w-[150px] leading-tight">
                        {maleDorm}
                      </p>
                    </div>
                  ) : null}

                  {dormMode === "female-only" ? (
                    <div className="flex items-center justify-between">
                      <p className="font-pirate text-lg">Female Dorm</p>
                      <p className="font-pirate text-xl text-center max-w-[150px] leading-tight">
                        {femaleDorm}
                      </p>
                    </div>
                  ) : null}

                  {dormMode === "mixed" ? (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="font-pirate text-base text-[#dbe9ff]">
                          Male
                        </p>
                        <p className="font-pirate text-xl leading-none">
                          {maleDorm}
                        </p>
                      </div>
                      <div>
                        <p className="font-pirate text-base text-[#dbe9ff]">
                          Female
                        </p>
                        <p className="font-pirate text-xl leading-none">
                          {femaleDorm}
                        </p>
                      </div>
                    </div>
                  ) : null}

                  <p className="mt-2 text-xs text-[#d3e5ff]">{dormNote}</p>
                </div>
              </div>

              <div className="flex h-full flex-col justify-between pb-0.5 pt-0.5">
                <div
                  className="rounded-xl border border-white/[0.18] bg-white/[0.012] px-2 py-2.5 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.16)] backdrop-blur-[6px]"
                  style={{
                    WebkitBackdropFilter: "blur(6px) saturate(115%)",
                    backdropFilter: "blur(6px) saturate(115%)",
                  }}
                >
                  <p className="font-pirate text-[9px] tracking-[0.18em] text-[#deecff]">
                    TEAM NUMBER
                  </p>
                  <p className="mt-1 font-pirate text-[52px] leading-none text-[#f7fbff]">
                    {teamNoLabel}
                  </p>
                </div>

                <div className="mt-2 flex flex-1 items-end justify-center">
                  <button
                    onClick={() => setIsQrModalOpen(true)}
                    className="rounded-2xl bg-white p-2.5 shadow-[0_8px_20px_rgba(0,0,0,0.35)] transition-transform hover:scale-105 active:scale-95"
                    aria-label="Enlarge QR Code"
                  >
                    <QRCode
                      value={teamId}
                      size={92}
                      bgColor="#ffffff"
                      fgColor="#1f2937"
                    />
                  </button>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>

      {isMapOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-4">
          <button
            type="button"
            aria-label="Close map"
            className="absolute inset-0 bg-[#040d1d]/48 backdrop-blur-[3px]"
            onClick={() => setIsMapOpen(false)}
          />

          <section
            className="relative z-10 w-full max-w-5xl overflow-hidden rounded-[24px] border border-[#f2d7a4]/[0.45] bg-[#6e4a29]/[0.16] p-3 text-[#fff6e8] shadow-[0_20px_40px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,243,220,0.28)] backdrop-blur-[12px] backdrop-saturate-[130%] md:p-4"
            style={{
              WebkitBackdropFilter: "blur(12px) saturate(135%)",
              backdropFilter: "blur(12px) saturate(135%)",
            }}
          >
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(160deg,rgba(255,236,197,0.2),rgba(223,176,112,0.08)_42%,rgba(118,77,39,0.12)_74%,rgba(52,30,14,0.18))]" />
            <div className="mb-3 flex items-start justify-between gap-2">
              <div>
                <p className="font-pirate text-sm tracking-[0.2em] text-[#ffecc7]">
                  CAMPUS MAP
                </p>
                <p className="mt-1 text-[11px] text-[#efd5ab]">
                  Tap checkpoints to preview locations.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsMapOpen(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-[10px] border border-[#f4ddb2]/[0.52] bg-[#f4ddb2]/[0.18]"
                aria-label="Close map popup"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="relative z-10 grid max-h-[78vh] gap-3 overflow-auto pr-0.5 lg:grid-cols-[1.65fr_0.95fr]">
              <div className="relative overflow-hidden rounded-2xl border border-[#f2d8aa]/[0.35] bg-[#4f351f]/[0.22] shadow-[inset_0_0_0_1px_rgba(255,236,196,0.14)] backdrop-blur-[3px]">
                <div className="relative aspect-[4/3] w-full">
                  <Image
                    src="/images/map.webp"
                    alt="Campus map"
                    fill
                    priority
                    className="object-cover"
                  />

                  <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(140%_90%_at_50%_50%,rgba(255,238,204,0.12)_0%,rgba(119,74,39,0.1)_58%,rgba(36,20,8,0.32)_100%)] backdrop-blur-[0.6px]" />
                  <div className="pointer-events-none absolute inset-0 shadow-[inset_0_0_40px_rgba(58,32,12,0.35)]" />

                  {mapSpots.map((spot) => (
                    <button
                      key={spot.id}
                      type="button"
                      onClick={() => setActiveSpotId(spot.id)}
                      className="group absolute -translate-x-1/2 -translate-y-1/2"
                      style={{ left: `${spot.x}%`, top: `${spot.y}%` }}
                      aria-label={`View ${spot.title}`}
                    >
                      <span
                        className={`map-pin grid h-5 w-5 place-items-center rounded-full border text-[10px] font-bold shadow-[0_0_0_2px_rgba(10,20,35,0.45)] transition-transform group-hover:scale-110 ${
                          activeSpotId === spot.id
                            ? "border-[#ffefcd] bg-[#db9f4d] text-[#33200f] ring-2 ring-[#ffe6b9]/60"
                            : "border-[#f0d7a6] bg-[#b57838] text-[#fff2d8]"
                        }`}
                      >
                        {spot.showNumber ? spot.order : ""}
                      </span>
                      <span
                        className={`mt-1 block whitespace-nowrap rounded bg-[#2f1c0f]/78 px-1.5 py-0.5 text-[10px] font-semibold tracking-[0.06em] text-[#ffedcb] transition-opacity ${
                          activeSpotId === spot.id
                            ? "opacity-100"
                            : spot.showNumber
                              ? "opacity-0 md:opacity-70 md:group-hover:opacity-100"
                              : "opacity-0"
                        }`}
                      >
                        {spot.title}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <aside className="rounded-2xl border border-[#f2d8aa]/[0.35] bg-[#563823]/[0.26] p-3 backdrop-blur-[3px]">
                <p className="font-pirate text-xs tracking-[0.2em] text-[#ffe7be]">
                  LOCATION PREVIEW
                </p>
                <p className="mt-1 font-pirate text-xl leading-none">
                  {activeSpot.title}
                </p>

                <div className="relative mt-2 aspect-[4/3] overflow-hidden rounded-xl border border-[#f2d8aa]/[0.4] bg-[#2e1e11]/65">
                  <Image
                    src={activeSpot.previewImage}
                    alt={activeSpot.previewAlt}
                    fill
                    className="object-cover"
                  />
                  <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,236,198,0.08),rgba(42,23,11,0.35))]" />
                </div>
                <div className="mt-2.5 grid grid-cols-2 gap-1.5 text-[11px]">
                  {orderedSpots.map((spot) => (
                    <button
                      key={`quick-${spot.id}`}
                      type="button"
                      onClick={() => setActiveSpotId(spot.id)}
                      className={`rounded-md border px-2 py-1 text-left ${
                        activeSpotId === spot.id
                          ? "border-[#ffe5b8]/70 bg-[#f0c786]/[0.26] text-[#fff3de]"
                          : "border-[#f2d8aa]/40 bg-[#8f6438]/[0.16] text-[#f3ddba]"
                      }`}
                    >
                      {spot.title}
                    </button>
                  ))}
                </div>
              </aside>
            </div>
          </section>
        </div>
      ) : null}

      {isQrModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Close QR Modal"
            className="absolute inset-0 bg-[#040d1d]/75 backdrop-blur-sm"
            onClick={() => setIsQrModalOpen(false)}
          />

          <section
            className="relative z-10 w-full max-w-sm overflow-hidden rounded-[24px] border border-[#f2d7a4]/[0.45] bg-[#6e4a29]/[0.25] p-5 text-center text-[#fff6e8] shadow-[0_20px_40px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,243,220,0.28)] backdrop-blur-[16px] backdrop-saturate-[130%]"
            style={{
              WebkitBackdropFilter: "blur(16px) saturate(135%)",
              backdropFilter: "blur(16px) saturate(135%)",
            }}
          >
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(160deg,rgba(255,236,197,0.2),rgba(223,176,112,0.08)_42%,rgba(118,77,39,0.12)_74%,rgba(52,30,14,0.18))]" />

            <button
              type="button"
              onClick={() => setIsQrModalOpen(false)}
              className="absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 z-20 transition-colors"
              aria-label="Close QR popup"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="relative z-10">
              <p className="font-pirate text-lg tracking-[0.1em] text-[#ffecc7] mb-2">
                TEAM QR
              </p>
              <h2 className="font-pirate text-3xl mb-6 truncate px-4">
                {teamName}
              </h2>

              <div className="mx-auto bg-white p-4 rounded-3xl inline-block shadow-[0_10px_30px_rgba(0,0,0,0.6)]">
                <QRCode
                  value={teamId}
                  size={240}
                  bgColor="#ffffff"
                  fgColor="#1f2937"
                />
              </div>

              <p className="mt-8 text-sm text-[#efd5ab] opacity-80">
                Show this code for check-in and meals.
              </p>
            </div>
          </section>
        </div>
      ) : null}

      <style jsx>{`
        .announcement-track {
          animation: announcement-marquee 14s linear infinite;
          will-change: transform;
        }

        .map-pin {
          animation: pin-breathe 1.9s ease-in-out infinite;
        }

        @keyframes announcement-marquee {
          0% {
            transform: translateX(0%);
          }
          100% {
            transform: translateX(-50%);
          }
        }

        @keyframes pin-breathe {
          0%,
          100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.08);
          }
        }
      `}</style>
    </main>
  );
}
