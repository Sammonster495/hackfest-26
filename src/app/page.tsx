import type { Metadata } from "next";
import { auth } from "~/auth/config";
import Scene from "~/components/landing/Scene";

export const metadata: Metadata = {
  title: "Home",
  description:
    "Join Hackfest'26, a 36-hour National Level Hackathon by Finite Loop Club, NMAMIT, Nitte. ₹4,00,000+ prize pool. April 17-19, 2026. Register now!",
  alternates: {
    canonical: "https://hackfest.dev",
  },
};

export default async function Home() {
  const session = await auth();

  return (
    <main className="relative h-screen w-full overflow-hidden bg-black">
      <div className="sr-only">
        <h1>Hackfest&apos;26 - 36-Hour National Level Hackathon</h1>
        <p>
          Hackfest is a 36-hour National Level Hackathon organised by Finite
          Loop Club at NMAM Institute of Technology (NMAMIT), Nitte, Karnataka,
          India. Theme: Codequest - The Grand Voyage.
        </p>
        <p>
          Dates: April 17-19, 2026. Prize Pool: ₹4,00,000+. Open to all college
          students across India.
        </p>
        <h2>Hackathon Tracks</h2>
        <ul>
          <li>FinTech</li>
          <li>HealthCare</li>
          <li>Logistics</li>
          <li>Open Innovation</li>
          <li>Sustainable Dev</li>
        </ul>
        <h2>Why Participate?</h2>
        <ul>
          <li>36 hours of non-stop coding and innovation</li>
          <li>Mentorship from industry experts</li>
          <li>Networking with 200+ developers</li>
          <li>Exciting prizes and swag</li>
        </ul>
      </div>

      {/* 3D Scene Background & Scroll Content */}
      <Scene session={session} />
    </main>
  );
}
