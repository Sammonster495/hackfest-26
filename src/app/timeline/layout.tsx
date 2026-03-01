import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Timeline",
  description:
    "Explore the complete schedule and timeline of Hackfest'26. Key dates, milestones, registration deadlines and more about the 36-hour hackathon.",
  alternates: {
    canonical: "https://hackfest.dev/timeline",
  },
};

export default function TimelineLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
