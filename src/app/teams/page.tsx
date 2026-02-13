import { Home } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "~/auth/config";
import SignOut from "~/components/auth/authButtons/signOut";
import { TeamForm } from "~/components/teams/team-form";
import { Button } from "~/components/ui/button";
import * as userData from "~/db/data/participant";

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
    // Changed: Added 'py-12' (top/bottom padding) and 'gap-8' to prevent edge crowding
    <div className="relative flex min-h-screen flex-col items-center justify-center p-6 py-12 md:p-12 overflow-hidden bg-gradient-to-b from-[#10569c] via-[#61b2e4] to-[#eef7fb] text-white">
      {/* --- DECORATIVE LAYERS (The Beach) --- */}
      <div className="absolute -bottom-[5%] left-[-20%] w-[140%] h-[25vh] md:h-[35vh] bg-[#fffac2]/40 rounded-[100%] blur-3xl z-0 pointer-events-none transition-all" />
      <div className="absolute -bottom-[12%] left-[-10%] w-[120%] h-[20vh] md:h-[30vh] bg-[#fbf6db] rounded-[50%] shadow-[0_-10px_50px_rgba(240,230,180,0.8)] z-0 pointer-events-none transition-all" />

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
              className="bg-white/10 border border-white/20 hover:bg-white/20 text-white shadow-sm backdrop-blur-sm shrink-0 rounded-xl"
            >
              <Link href="/">
                <Home className="h-5 w-5" />
              </Link>
            </Button>

            {/* Mobile Sign Out (Hidden on Desktop) */}
            <div className="md:hidden [&_button]:bg-white/10 [&_button]:border-white/20 [&_button]:text-white [&_button]:hover:bg-white/20 [&_button]:backdrop-blur-sm [&_button]:rounded-xl">
              <SignOut variant="outline" />
            </div>
          </div>

          {/* Text Content */}
          <div className="space-y-2 text-center md:flex-1 md:text-left md:pt-1">
            <h1 className="text-3xl font-bold drop-shadow-sm md:text-4xl tracking-tight">
              Team Management
            </h1>
            <p className="text-white/80 text-base md:text-lg leading-relaxed font-medium">
              Create a new team or join an existing one.
            </p>
          </div>

          {/* Desktop Sign Out (Hidden on Mobile) */}
          <div className="hidden md:block [&_button]:bg-white/10 [&_button]:border-white/20 [&_button]:text-white [&_button]:hover:bg-white/20 [&_button]:backdrop-blur-sm [&_button]:rounded-xl">
            <SignOut variant="outline" />
          </div>
        </div>

        {/* TEAM FORM */}
        <TeamForm />
      </div>
    </div>
  );
}
