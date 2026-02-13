import {
  AlertCircle,
  CheckCircle2,
  Clock,
  CreditCard,
  Home,
  Info,
  Users,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "~/auth/config";
import SignOut from "~/components/auth/authButtons/signOut";
import { ConfirmTeamButton } from "~/components/teams/confirm-team-button";
import { DeleteTeamButton } from "~/components/teams/delete-team-button";
import { LeaveTeamButton } from "~/components/teams/leave-team-button";
import { TeamIdDisplay } from "~/components/teams/team-id-display";
import { TeamSubmissionForm } from "~/components/teams/team-submission-form";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import * as userData from "~/db/data/participant";
import { getSiteSettings } from "~/db/data/siteSettings";
import * as teamData from "~/db/data/teams";
import { getIdeaSubmission } from "~/db/services/idea-services";
import { getFormStatus } from "~/db/services/team-services";

type TeamStatus =
  | "NOT_FOUND"
  | "NOT_COMPLETED"
  | "NOT_SELECTED"
  | "PAYMENT_PENDING"
  | "PAYMENT_PAID"
  | "PAYMENT_NOT_OPEN"
  | "IDEA_SUBMITTED"
  | "IDEA_NOT_SUBMITTED";

export default async function TeamDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/");
  }

  if (!session.user.isRegistrationComplete) {
    redirect("/register");
  }

  const user = await userData.findByEmail(session.user.email);
  if (!user) {
    redirect("/register");
  }

  const team = await teamData.findById(id);
  if (!team) {
    redirect("/teams");
  }

  if (user.teamId !== team.id) {
    redirect("/teams");
  }

  const members = await teamData.listMembers(id);
  const siteSettingsData = await getSiteSettings();
  const teamStatus = (await getFormStatus(id)) as TeamStatus;
  const submission = await getIdeaSubmission(id);

  const siteSettings = Array.isArray(siteSettingsData)
    ? siteSettingsData[0]
    : siteSettingsData;

  const resultsOut = siteSettings?.resultsOut ?? false;
  const registrationsOpen = siteSettings?.registrationsOpen ?? false;
  const paymentsOpen = siteSettings?.paymentsOpen ?? false;

  const renderStatusContent = () => {
    // --- STATUS: NOT SELECTED (Red Glass) ---
    if (resultsOut) {
      switch (teamStatus) {
        case "NOT_SELECTED":
          return (
            <Card className="border-red-500/30 bg-red-900/30 backdrop-blur-md shadow-lg">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <XCircle className="h-5 w-5 text-red-300" />
                  <CardTitle className="text-red-100">Not Selected</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-red-200">
                  Unfortunately, your team was not selected for this edition of
                  Hackfest. We appreciate your participation and encourage you
                  to try again next time!
                </p>
              </CardContent>
            </Card>
          );

        case "PAYMENT_PENDING":
          return (
            <Card className="border-yellow-500/30 bg-yellow-900/30 backdrop-blur-md shadow-lg">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-yellow-300" />
                  <CardTitle className="text-yellow-100">
                    Payment Pending
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-yellow-200">
                  Congratulations! Your team has been selected! Please complete
                  the payment to confirm your participation.
                </p>
                {user.isLeader ? (
                  paymentsOpen ? (
                    <Button
                      asChild
                      className="bg-yellow-400 text-yellow-950 hover:bg-yellow-300 font-bold border-none"
                    >
                      <Link href={`/teams/${id}/payment`}>
                        Complete Payment
                      </Link>
                    </Button>
                  ) : (
                    <p className="text-sm text-yellow-200 italic">
                      Payment portal will open soon. Stay tuned!
                    </p>
                  )
                ) : (
                  <p className="text-sm text-yellow-200">
                    Only the team leader can complete the payment. Please
                    contact your team leader.
                  </p>
                )}
              </CardContent>
            </Card>
          );

        case "PAYMENT_PAID":
          return (
            <Card className="border-green-500/30 bg-green-900/30 backdrop-blur-md shadow-lg">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-300" />
                  <CardTitle className="text-green-100">
                    Registration Complete
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-green-200">
                  Your team is fully registered for Hackfest! Payment has been
                  confirmed. See you there!
                </p>
              </CardContent>
            </Card>
          );

        case "PAYMENT_NOT_OPEN":
          return (
            <Card className="border-blue-500/30 bg-blue-900/30 backdrop-blur-md shadow-lg">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-blue-300" />
                  <CardTitle className="text-blue-100">
                    Selected! Payment Opening Soon
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-blue-200">
                  Congratulations! Your team has been selected for Hackfest!
                  Payment portal will open soon. Stay tuned!
                </p>
              </CardContent>
            </Card>
          );

        case "IDEA_NOT_SUBMITTED":
          return (
            <Card className="border-orange-500/30 bg-orange-900/30 backdrop-blur-md shadow-lg">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-orange-300" />
                  <CardTitle className="text-orange-100">
                    Submission Missed
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-orange-200">
                  Results are out but your team did not submit an idea.
                  Unfortunately, you were not considered for selection.
                </p>
              </CardContent>
            </Card>
          );
      }
    }

    if (!resultsOut && !registrationsOpen && team.isCompleted) {
      if (teamStatus === "IDEA_SUBMITTED") {
        return (
          <Card className="border-blue-500/30 bg-blue-900/30 backdrop-blur-md shadow-lg">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-300" />
                <CardTitle className="text-blue-100">
                  Awaiting Results
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-blue-200">
                Your idea has been submitted successfully! Results will be
                announced soon. Stay tuned for updates.
              </p>
            </CardContent>
          </Card>
        );
      }
      if (teamStatus === "IDEA_NOT_SUBMITTED") {
        return (
          <Card className="border-orange-500/30 bg-orange-900/30 backdrop-blur-md shadow-lg">
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-orange-300" />
                <CardTitle className="text-orange-100">
                  Submission Missed
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-orange-200">
                Registrations have closed but no idea was submitted for your
                team. Unfortunately, you will not be considered for selection.
              </p>
            </CardContent>
          </Card>
        );
      }
    }

    if (!resultsOut && registrationsOpen) {
      return (
        <Card className="border-white/30 bg-black/20 backdrop-blur-xl shadow-2xl">
          <CardHeader>
            <CardTitle className="text-white">Team Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!team.isCompleted &&
              (user.isLeader ? (
                <div className="space-y-4">
                  <p className="text-sm text-white/70">
                    As the team leader, you can confirm the team once you have
                    3-4 members. After confirmation, members will not be able to
                    leave the team.
                  </p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="[&_button]:w-full [&_button]:bg-white [&_button]:text-[#10569c] [&_button]:font-bold [&_button]:hover:bg-white/90">
                      <ConfirmTeamButton teamId={team.id} />
                    </div>
                    <div className="[&_button]:w-full [&_button]:bg-red-500/20 [&_button]:text-red-200 [&_button]:border-red-500/30 [&_button]:hover:bg-red-500/40">
                      <DeleteTeamButton teamId={team.id} teamName={team.name} />
                      <p className="text-xs text-white/40 mt-2 text-center">
                        Cannot be undone
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-sm text-white/70 mb-4">
                    You can leave the team before it is confirmed by the leader.
                  </p>
                  <div className="[&_button]:w-full [&_button]:bg-white/10 [&_button]:border-white/20 [&_button]:text-white [&_button]:hover:bg-white/20">
                    <LeaveTeamButton />
                  </div>
                </div>
              ))}

            {team.isCompleted && (
              <div className="space-y-6">
                <div className="p-4 bg-white/10 border border-white/20 rounded-lg backdrop-blur-sm">
                  <p className="text-sm font-medium text-white/90">
                    This team has been confirmed. Members cannot leave the team.
                  </p>
                </div>

                {teamStatus === "IDEA_SUBMITTED" && submission ? (
                  <div className="text-white">
                    <TeamSubmissionForm
                      teamId={team.id}
                      submission={submission}
                    />
                  </div>
                ) : user.isLeader ? (
                  <div className="text-white">
                    <TeamSubmissionForm teamId={team.id} />
                  </div>
                ) : (
                  <div className="p-4 bg-blue-900/30 border border-blue-500/30 rounded-lg backdrop-blur-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="h-5 w-5 text-blue-300" />
                      <p className="text-sm font-medium text-blue-100">
                        Awaiting Idea Submission
                      </p>
                    </div>
                    <p className="text-sm text-blue-200">
                      Your team leader is responsible for submitting the idea.
                      Please coordinate with them.
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      );
    }

    if (!team.isCompleted && !registrationsOpen && resultsOut) {
      return (
        <Card className="border-white/20 bg-black/20 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-white">Team Status</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-white/60">
              Registrations have closed and results are out. Your team was not
              registered.
            </p>
          </CardContent>
        </Card>
      );
    }

    if (!registrationsOpen && !team.isCompleted && !resultsOut) {
      return (
        <Card className="border-white/20 bg-black/20 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-white">Team Status</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-white/60">
              Registrations have closed but your team is not registered. You
              will not be considered for selection.
            </p>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card className="border-white/20 bg-black/20 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="text-white">Team Status</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-white/60">
            {team.isCompleted
              ? "Your team is registered. Check back for updates."
              : "Complete your team registration to participate."}
          </p>
        </CardContent>
      </Card>
    );
  };

  return (
    // MAIN CONTAINER: Sky Gradient
    <div className="relative flex min-h-screen flex-col items-center justify-center p-6 py-12 md:p-12 overflow-hidden bg-gradient-to-b from-[#10569c] via-[#61b2e4] to-[#eef7fb] text-white">
      {/* --- DECORATIVE LAYERS (The Beach) --- */}
      <div className="absolute -bottom-[5%] left-[-20%] w-[140%] h-[25vh] md:h-[35vh] bg-[#fffac2]/40 rounded-[100%] blur-3xl z-0 pointer-events-none" />
      <div className="absolute -bottom-[12%] left-[-10%] w-[120%] h-[20vh] md:h-[30vh] bg-[#fbf6db] rounded-[50%] shadow-[0_-10px_50px_rgba(240,230,180,0.8)] z-0 pointer-events-none" />

      {/* --- CONTENT --- */}
      <div className="relative z-10 w-full max-w-3xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* HEADER SECTION */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 md:gap-4 w-full">
          {/* LEFT SIDE (Desktop) / TOP ROW (Mobile) */}
          <div className="flex w-full md:w-auto items-center justify-between md:justify-start gap-4 min-w-0">
            {/* 1. Home Button */}
            <Button
              asChild
              size="icon"
              className="bg-white/10 border border-white/20 hover:bg-white/20 text-white shadow-sm backdrop-blur-sm shrink-0 rounded-xl"
            >
              <Link href="/">
                <Home className="h-5 w-5" />
              </Link>
            </Button>

            {/* 2. DESKTOP ONLY: Title & ID */}
            <div className="hidden md:flex items-center gap-4 min-w-0">
              {/* Title: Allows wrapping for long names */}
              <h1 className="text-3xl font-bold drop-shadow-sm leading-tight break-words max-w-[500px]">
                {team.name}
              </h1>

              {/* ID: Sits 'Left Beside' the name (to the right of name, but grouped left) */}
              {user.isLeader && (
                <div className="shrink-0">
                  <TeamIdDisplay teamId={team.id} />
                </div>
              )}
            </div>

            {/* 3. MOBILE ONLY: Sign Out */}
            <div className="md:hidden shrink-0 [&_button]:bg-white/10 [&_button]:border-white/20 [&_button]:text-white [&_button]:hover:bg-white/20 [&_button]:backdrop-blur-sm [&_button]:rounded-xl">
              <SignOut variant="outline" />
            </div>
          </div>

          {/* CENTER CONTENT (MOBILE ONLY) - Title & ID */}
          <div className="md:hidden flex flex-col items-center space-y-4 px-4 w-full">
            <h1 className="text-3xl font-bold drop-shadow-sm text-center break-words leading-tight">
              {team.name}
            </h1>
            {user.isLeader && (
              <div className="flex justify-center">
                <TeamIdDisplay teamId={team.id} />
              </div>
            )}
          </div>

          {/* RIGHT SIDE (DESKTOP ONLY) - Sign Out */}
          <div className="hidden md:block shrink-0 [&_button]:bg-white/10 [&_button]:border-white/20 [&_button]:text-white [&_button]:hover:bg-white/20 [&_button]:backdrop-blur-sm [&_button]:rounded-xl">
            <SignOut variant="outline" />
          </div>
        </div>

        {/* GRID: Details & Members */}
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
          {/* DETAILS CARD */}
          <Card className="border-white/30 bg-black/20 backdrop-blur-xl shadow-xl">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Info className="w-5 h-5 text-white/80" />
                <CardTitle className="text-white">Team Details</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center p-2 rounded-lg bg-white/5 border border-white/10">
                <span className="text-sm font-medium text-white/70">
                  Status
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-sm font-bold ${team.isCompleted ? "bg-green-500/20 text-green-200" : "bg-yellow-500/20 text-yellow-200"}`}
                >
                  {team.isCompleted ? "Completed" : "Active"}
                </span>
              </div>
              {resultsOut &&
                (teamStatus === "PAYMENT_PENDING" ||
                  teamStatus === "PAYMENT_PAID") &&
                team.paymentStatus && (
                  <div className="flex justify-between items-center p-2 rounded-lg bg-white/5 border border-white/10">
                    <span className="text-sm font-medium text-white/70">
                      Payment
                    </span>
                    <span className="text-white font-mono">
                      {team.paymentStatus}
                    </span>
                  </div>
                )}
            </CardContent>
          </Card>

          {/* MEMBERS CARD */}
          <Card className="border-white/30 bg-black/20 backdrop-blur-xl shadow-xl">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-white/80" />
                <div className="flex flex-1 justify-between items-center">
                  <CardTitle className="text-white">Team Members</CardTitle>
                  <CardDescription className="text-white/60">
                    {members.length} / 4
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-3 border border-white/10 bg-white/5 hover:bg-white/10 transition-colors rounded-xl"
                  >
                    <div>
                      <div className="font-bold text-white text-sm">
                        {member.name || "Unknown"}
                      </div>
                      <div className="text-xs text-white/60 font-mono">
                        {member.email}
                      </div>
                    </div>
                    {member.isLeader && (
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-yellow-500/20 text-yellow-200 border border-yellow-500/30 px-2 py-1 rounded-full shadow-[0_0_10px_rgba(234,179,8,0.2)]">
                        Leader
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Dynamic Status Section */}
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 delay-100">
          {renderStatusContent()}
        </div>
      </div>
    </div>
  );
}
