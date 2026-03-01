import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Brochure",
  description:
    "Download the official Hackfest'26 brochure. Get all the details about the 36-hour national hackathon - tracks, prizes, schedule, and how to register.",
  alternates: {
    canonical: "https://hackfest.dev/brochure",
  },
};

export default function BrochureLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
