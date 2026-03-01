import {
  AlertCircle,
  BadgeCheck,
  BadgeX,
  BookUser,
  CheckCircle2,
  Clock,
  Home,
  Users,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "~/auth/config";
import SignOut from "~/components/auth/authButtons/signOut";
import PaymentButton from "~/components/razorpay/PaymentButton";
import { ConfirmTeamButton } from "~/components/teams/confirm-team-button";
import { DeleteTeamButton } from "~/components/teams/delete-team-button";
import { LeaveTeamButton } from "~/components/teams/leave-team-button";
import { TeamPageLayout } from "~/components/teams/TeamPageLayout";
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
import { calculateTotalAmount } from "~/lib/utils";

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

  const userForPayment: { id: string; name: string; email: string } = {
    id: user.id,
    name: user.name ?? "",
    email: user.email ?? "",
  };

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
    // --- STATUS: NOT SELECTED ---
    if (resultsOut) {
      switch (teamStatus) {
        case "NOT_SELECTED":
          return (
            <Card className="border-red-200 bg-white/90 backdrop-blur-md shadow-lg">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <XCircle className="h-6 w-6 text-red-500" />
                  <CardTitle className="text-red-700 font-pirate text-2xl tracking-wide">
                    Not Selected
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm md:text-base text-red-700/80 font-medium">
                  Unfortunately, your team was not selected for this edition of
                  Hackfest. We appreciate your participation and encourage you
                  to try again next time!
                </p>
              </CardContent>
            </Card>
          );

        case "PAYMENT_PENDING":
          return (
            <Card className="border-amber-200 bg-white/90 backdrop-blur-md shadow-lg">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-amber-700 font-pirate text-2xl tracking-wide">
                    Payment Pending
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm md:text-base text-amber-700/80 font-medium">
                  Congratulations! Your team has been selected! Please complete
                  the payment of{" "}
                  <b>{calculateTotalAmount(400, members.length, 2)}rs</b>{" "}
                  (including GST) to confirm your participation.
                </p>
                {team.leaderId === user.id ? (
                  paymentsOpen ? (
                    <PaymentButton
                      name="Pay Now"
                      paymentType="PARTICIPATION"
                      amountInINR={Number(
                        calculateTotalAmount(400, members.length, 2),
                      )}
                      teamId={id}
                      user={userForPayment}
                      description="Participation Fee"
                    />
                  ) : (
                    <p className="text-sm text-amber-700/80 italic font-medium">
                      Payment portal will open soon. Stay tuned!
                    </p>
                  )
                ) : (
                  <p className="text-sm text-amber-700/80 font-medium">
                    Only the team leader can complete the payment. Please
                    contact your team leader.
                  </p>
                )}
              </CardContent>
            </Card>
          );

        case "PAYMENT_PAID":
          return (
            <Card className="border-green-200 bg-white/90 backdrop-blur-md shadow-lg">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-6 w-6 text-green-500" />
                  <CardTitle className="text-green-700 font-pirate text-2xl tracking-wide">
                    Registration Complete
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm md:text-base text-green-700/80 font-medium">
                  Your team is fully registered for Hackfest! Payment has been
                  confirmed. See you there!
                </p>
              </CardContent>
            </Card>
          );

        case "PAYMENT_NOT_OPEN":
          return (
            <Card className="border-[#10569c]/20 bg-white/90 backdrop-blur-md shadow-lg">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Clock className="h-6 w-6 text-[#10569c]" />
                  <CardTitle className="text-[#10569c] font-pirate text-2xl tracking-wide">
                    Selected! Payment Opening Soon
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm md:text-base text-[#10569c]/80 font-medium">
                  Congratulations! Your team has been selected for Hackfest!
                  Payment portal will open soon. Stay tuned!
                </p>
              </CardContent>
            </Card>
          );

        case "IDEA_NOT_SUBMITTED":
          return (
            <Card className="border-orange-200 bg-white/90 backdrop-blur-md shadow-lg">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-6 w-6 text-orange-500" />
                  <CardTitle className="text-orange-700 font-pirate text-2xl tracking-wide">
                    Submission Missed
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm md:text-base text-orange-700/80 font-medium">
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
          <Card className="border-[#10569c]/20 bg-white/90 backdrop-blur-md shadow-lg">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Clock className="h-6 w-6 text-[#10569c]" />
                <CardTitle className="text-[#10569c] font-pirate text-2xl tracking-wide">
                  Awaiting Results
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm md:text-base text-[#10569c]/80 font-medium">
                Your idea has been submitted successfully! Results will be
                announced soon. Stay tuned for updates.
              </p>
            </CardContent>
          </Card>
        );
      }
      if (teamStatus === "IDEA_NOT_SUBMITTED") {
        return (
          <Card className="border-orange-200 bg-white/90 backdrop-blur-md shadow-lg">
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertCircle className="h-6 w-6 text-orange-500" />
                <CardTitle className="text-orange-700 font-pirate text-2xl tracking-wide">
                  Submission Missed
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm md:text-base text-orange-700/80 font-medium">
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
        <Card className="border-[#10569c]/20 bg-white/90 backdrop-blur-md shadow-xl">
          <CardHeader>
            <CardTitle className="text-[#10569c] font-pirate text-2xl tracking-wide">
              Team Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!team.isCompleted &&
              (team.leaderId === user.id ? (
                <div className="space-y-4">
                  <p className="text-sm md:text-base text-[#10569c]/80 font-medium">
                    As the team leader, you can confirm the team once you have
                    <span className="font-bold"> 3-4 members</span>. After
                    confirmation, members will not be able to leave the team.
                  </p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {/* Confirm Button uses primary solid blue */}
                    <div className="[&_button]:w-full [&_button]:bg-[#10569c] [&_button]:text-white [&_button]:font-bold [&_button]:hover:bg-[#10569c]/90 [&_button]:shadow-md [&_button]:transition-all [&_button]:hover:scale-[1.01] [&_button]:active:scale-[0.99] [&_button]:h-12 [&_button]:rounded-xl">
                      <ConfirmTeamButton teamId={team.id} />
                    </div>
                    {/* Delete Button uses light red */}
                    <div className="[&_button]:w-full [&_button]:bg-red-50 [&_button]:text-red-600 [&_button]:border-red-200 [&_button]:hover:bg-red-100 [&_button]:font-bold [&_button]:shadow-sm [&_button]:transition-all [&_button]:h-12 [&_button]:rounded-xl">
                      <DeleteTeamButton teamId={team.id} teamName={team.name} />
                      <p className="text-xs text-red-600/60 mt-2 text-center font-bold uppercase tracking-wider">
                        Cannot be undone
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-sm md:text-base text-[#10569c]/80 font-medium mb-4">
                    You can leave the team before it is confirmed by the leader.
                  </p>
                  {/* Leave Button */}
                  <LeaveTeamButton />
                </div>
              ))}

            {team.isCompleted && (
              <div className="space-y-6">
                <div className="p-4 bg-[#10569c]/5 border border-[#10569c]/20 rounded-xl backdrop-blur-sm">
                  <p className="text-sm md:text-base font-medium text-[#10569c]">
                    This team has been confirmed. Members cannot leave the team.
                  </p>
                </div>

                {teamStatus === "IDEA_SUBMITTED" && submission ? (
                  <div className="text-[#10569c]">
                    <TeamSubmissionForm
                      teamId={team.id}
                      submission={submission}
                    />
                  </div>
                ) : team.leaderId === user.id ? (
                  <div className="text-[#10569c]">
                    <TeamSubmissionForm teamId={team.id} />
                  </div>
                ) : (
                  <div className="p-4 bg-blue-50/80 border border-blue-200 rounded-xl backdrop-blur-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="h-5 w-5 text-blue-500" />
                      <p className="text-sm font-bold text-blue-800">
                        Awaiting Idea Submission
                      </p>
                    </div>
                    <p className="text-sm text-blue-700/80 font-medium">
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

    // Default Fallback States
    return (
      <Card className="border-[#10569c]/20 bg-white/90 backdrop-blur-md shadow-xl">
        <CardHeader>
          <CardTitle className="text-[#10569c] font-pirate text-2xl tracking-wide">
            Team Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm md:text-base text-[#10569c]/80 font-medium">
            {!team.isCompleted && !registrationsOpen && resultsOut
              ? "Registrations have closed and results are out. Your team was not registered."
              : !registrationsOpen && !team.isCompleted && !resultsOut
                ? "Registrations have closed but your team is not registered. You will not be considered for selection."
                : team.isCompleted
                  ? "Your team is registered. Check back for updates."
                  : "Complete your team registration to participate."}
          </p>
        </CardContent>
      </Card>
    );
  };

  return (
    // MAIN CONTAINER: Sky Gradient via TeamPageLayout
    <TeamPageLayout>
      {/* --- CONTENT --- */}
      <div className="relative z-10 w-full max-w-3xl space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* HEADER SECTION */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 md:gap-4 w-full">
          {/* LEFT SIDE (Desktop) / TOP ROW (Mobile) */}
          <div className="flex w-full md:w-auto items-center justify-between md:justify-start gap-4 min-w-0">
            {/* 1. Home Button */}
            <Button
              asChild
              size="icon"
              className="bg-white/90 border border-[#10569c]/30 hover:bg-white hover:border-[#10569c]/60 text-[#10569c] shadow-sm backdrop-blur-sm shrink-0 rounded-xl transition-all"
            >
              <Link href="/">
                <Home className="h-5 w-5" />
              </Link>
            </Button>

            {/* 2. DESKTOP ONLY: Title & ID */}
            <div className="hidden md:flex items-center gap-4 min-w-0">
              {/* Title */}
              <h1 className="text-4xl md:text-5xl font-pirate font-bold text-white drop-shadow-sm drop-shadow-black/50 leading-tight wrap-break-word max-w-125 tracking-wide">
                {team.name}
              </h1>

              {/* ID */}

              <div className="shrink-0">
                <TeamIdDisplay teamId={team.id} />
              </div>
            </div>

            {/* 3. MOBILE ONLY: Sign Out */}
            <div className="md:hidden shrink-0 [&_button]:!bg-white/90 [&_button]:!border-[#10569c]/30 [&_button]:!text-[#10569c] [&_button]:hover:!bg-white [&_button]:hover:!border-[#10569c]/60 [&_button]:!backdrop-blur-sm [&_button]:!rounded-xl [&_button]:!shadow-sm [&_button]:!transition-all">
              <SignOut variant="outline" />
            </div>
          </div>

          {/* CENTER CONTENT (MOBILE ONLY) - Title & ID */}
          <div className="md:hidden flex flex-col items-center space-y-4 px-4 w-full">
            <h1 className="text-4xl font-pirate font-bold text-white drop-shadow-sm drop-shadow-black/50 text-center wrap-break-word leading-tight tracking-wide">
              {team.name}
            </h1>
            {team.leaderId === user.id && (
              <div className="flex justify-center">
                <TeamIdDisplay teamId={team.id} />
              </div>
            )}
          </div>

          {/* RIGHT SIDE (DESKTOP ONLY) - Sign Out */}
          <div className="hidden md:block shrink-0 [&_button]:bg-white/90! [&_button]:border-[#10569c]/30! [&_button]:!text-[#10569c] [&_button]:hover:!bg-white [&_button]:hover:!border-[#10569c]/60 [&_button]:!backdrop-blur-sm [&_button]:!rounded-xl [&_button]:!shadow-sm [&_button]:!transition-all">
            <SignOut variant="outline" />
          </div>
        </div>

        {/* GRID: Details & Members */}
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
          {/* DETAILS CARD */}
          <Card className="border-[#10569c]/20 bg-white/90 backdrop-blur-md shadow-xl">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-[#10569c]/10 rounded-lg ring-1 ring-[#10569c]/20 shadow-sm">
                  <BookUser className="w-5 h-5 text-[#10569c]" />
                </div>
                <CardTitle className="text-[#10569c] font-pirate text-2xl tracking-wide">
                  Team Details
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center p-3 rounded-xl bg-[#10569c]/5 border border-[#10569c]/10">
                <span className="text-sm font-bold text-[#10569c]/80 uppercase tracking-wider">
                  Status
                </span>
                <span
                  className={`px-3 py-1 rounded-md text-xs font-bold tracking-wider shadow-sm ${
                    team.isCompleted
                      ? "bg-green-100 text-green-700 border border-green-200"
                      : "bg-blue-100 text-blue-700 border border-blue-200"
                  }`}
                >
                  {team.isCompleted ? "Completed" : "Incomplete"}
                </span>
              </div>
              {resultsOut &&
                (teamStatus === "PAYMENT_PENDING" ||
                  teamStatus === "PAYMENT_PAID") &&
                team.paymentStatus && (
                  <div className="flex justify-between items-center p-3 rounded-xl bg-[#10569c]/5 border border-[#10569c]/10">
                    <span className="text-sm font-bold text-[#10569c]/80 uppercase tracking-wider">
                      Payment
                    </span>
                    <span className="text-[#10569c] font-medium font-crimson text-lg">
                      {team.paymentStatus}
                    </span>
                  </div>
                )}
            </CardContent>
          </Card>

          {/* MEMBERS CARD */}
          <Card className="border-[#10569c]/20 bg-white/90 backdrop-blur-md shadow-xl">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-[#10569c]/10 rounded-lg ring-1 ring-[#10569c]/20 shadow-sm">
                  <Users className="w-5 h-5 text-[#10569c]" />
                </div>
                <div className="flex flex-1 justify-between items-center">
                  <CardTitle className="text-[#10569c] font-pirate text-2xl tracking-wide">
                    Team Members
                  </CardTitle>
                  <CardDescription className="text-[#10569c]/60 font-bold font-crimson text-lg">
                    <div className="flex items-center">
                      {members.length >= 3 ? (
                        <BadgeCheck className="w-4 h-4 mr-1 inline text-green-500" />
                      ) : (
                        <BadgeX className="w-4 h-4 mr-1 inline text-red-500" />
                      )}
                      {members.length} / 4
                    </div>
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-3 border border-[#10569c]/10 bg-white/60 hover:bg-white transition-colors rounded-xl shadow-sm"
                  >
                    <div>
                      <div className="font-bold text-[#10569c] text-sm">
                        {member.name || "Unknown"}
                      </div>
                      <div className="text-xs text-[#10569c]/70 font-crimson font-medium">
                        {member.email}
                      </div>
                    </div>
                    {team.leaderId === member.id && (
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-700 border border-amber-200 px-2 py-1 rounded-md shadow-sm">
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
    </TeamPageLayout>
  );
}
