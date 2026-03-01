import type { Metadata } from "next";
import { Suspense } from "react";
import { auth } from "~/auth/event-config";
import Events from "~/components/events/layout";
import { Navbar } from "~/components/landing/Navbar";

export const metadata: Metadata = {
  title: "Events",
  description: "Explore all events at Hackfest'26.",
  alternates: {
    canonical: "https://hackfest.dev/events",
  },
};

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await auth();

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <div className="fixed top-0 left-0 w-full z-50">
        <Navbar isUnderwater={true} session={session} />
      </div>
      <Events session={session} searchParams={searchParams} />
    </Suspense>
  );
}
