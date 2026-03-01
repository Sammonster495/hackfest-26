import { Home } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "~/auth/config";
import SignOut from "~/components/auth/authButtons/signOut";
import { TeamPageLayout } from "~/components/teams/TeamPageLayout";
import { TeamForm } from "~/components/teams/team-form";
import { Button } from "~/components/ui/button";
import * as userData from "~/db/data/participant";

export const metadata: Metadata = {
  title: "Teams",
  description:
    "Manage your team for Hackfest'26. Create a new team or join an existing one for the 36-hour national hackathon at NMAMIT, Nitte.",
  alternates: {
    canonical: "https://hackfest.dev/teams",
  },
};

export default async function TeamsPage() {
  const session = await auth();
  if (!session?.user?.email) {
    redirect("/");
  }

  if (!session.user.isRegistrationComplete) {
    redirect("/register");
  }

  const user = await userData.findByEmail(session.user.email);

  if (user?.teamId) {
    redirect(`/teams/${user.teamId}`);
  }

  return (
    // MAIN CONTAINER
    <TeamPageLayout>
      {/* --- CONTENT CONTAINER --- */}
      <div className="relative z-10 w-full max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-700 flex flex-col gap-8">
        {/* RESPONSIVE HEADER SECTION */}
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between md:gap-4">
          {/* Top Row (Mobile): Home Button & Sign Out */}
          <div className="flex w-full items-center justify-between md:w-auto md:justify-start md:gap-4">
            {/* Home Button */}
            <Button
              asChild
              size="icon"
              className="bg-white/90 border border-[#10569c]/30 hover:bg-white hover:border-[#10569c]/60 text-[#10569c] shadow-sm backdrop-blur-sm shrink-0 rounded-xl transition-all"
            >
              <Link href="/">
                <Home className="h-5 w-5" />
              </Link>
            </Button>

            {/* Mobile Sign Out */}
            <div className="md:hidden [&_button]:!bg-white/90 [&_button]:!border-[#10569c]/30 [&_button]:!text-[#10569c] [&_button]:hover:!bg-white [&_button]:hover:!border-[#10569c]/60 [&_button]:!backdrop-blur-sm [&_button]:!rounded-xl [&_button]:!shadow-sm [&_button]:!transition-all">
              <SignOut className="font-pirate" variant="outline" />
            </div>
          </div>

          {/* Text Content */}
          <div className="space-y-2 text-center md:flex-1 md:text-left md:pt-1">
            <h1 className="text-3xl font-pirate font-bold drop-shadow-sm md:text-4xl tracking-wide">
              Team Management
            </h1>
            <p className="font-crimson text-base md:text-xl leading-relaxed font-medium opacity-90">
              Create a new team or join an existing one.
            </p>
          </div>

          {/* Desktop Sign Out */}
          <div className="hidden md:block [&_button]:!bg-white/90 [&_button]:!border-[#10569c]/30 [&_button]:!text-[#10569c] [&_button]:hover:!bg-white [&_button]:hover:!border-[#10569c]/60 [&_button]:!backdrop-blur-sm [&_button]:!rounded-xl [&_button]:!shadow-sm [&_button]:!transition-all">
            <SignOut variant="outline" />
          </div>
        </div>

        {/* TEAM FORM */}
        <TeamForm />
      </div>
    </TeamPageLayout>
  );
}
