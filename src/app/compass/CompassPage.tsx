"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CompassClient } from "./ui";

interface CompassData {
  teamId: string;
  teamName: string;
  teamNo: number | null;
  maleCount: number;
  femaleCount: number;
  labAssignment: string;
  maleDorm?: string;
  femaleDorm?: string;
  error?: string;
}

export default function CompassPageClient() {
  const [data, setData] = useState<CompassData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function init() {
      try {
        const res = await fetch("/api/compass");
        const json = await res.json();

        if (json.error === "NOT_IN_TEAM" || json.error === "TEAM_NOT_FOUND") {
          router.replace("/teams");
          return;
        }
        if (json.error === "NOT_SELECTED") {
          setError("NOT_SELECTED");
          setData({ teamId: json.teamId } as any);
          return;
        }

        setData(json);
      } catch (err) {
        console.error("Failed to fetch compass data", err);
      }
    }
    void init();
  }, [router]);

  if (error === "NOT_SELECTED") {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-[#0e2b56] px-6">
        <div className="w-full max-w-md rounded-2xl border border-[#6f9de0]/55 bg-[#284a86]/55 p-6 text-center text-[#eef6ff]">
          <h1 className="font-pirate text-2xl">You don't have access.</h1>
          <Link
            href={`/teams/${data?.teamId}`}
            className="mt-5 inline-flex rounded-lg border border-[#87b7ff]/45 bg-[#1a3c72]/45 px-4 py-2 text-sm"
          >
            Back to Team
          </Link>
        </div>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-[#061b3f]">
        <div className="flex flex-col items-center gap-4 animate-pulse">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
          <p className="font-pirate text-2xl tracking-widest text-amber-400">
            Fetching Map...
          </p>
        </div>
      </main>
    );
  }

  return (
    <CompassClient
      teamId={data.teamId}
      teamName={data.teamName}
      teamNo={data.teamNo}
      maleCount={data.maleCount}
      femaleCount={data.femaleCount}
      labAssignment={data.labAssignment}
      maleDorm={data.maleDorm ?? "TBA"}
      femaleDorm={data.femaleDorm ?? "TBA"}
      announcementText="Announcement will be shown here. Stay tuned for updates."
      dormNote="Dorm assignment depends on final allocation and check-in confirmation."
    />
  );
}
