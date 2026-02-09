import {
  AlertCircle,
  CheckCircle2,
  Clock,
  CreditCard,
  Home,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "~/auth/config";
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
    if (resultsOut) {
      switch (teamStatus) {
        case "NOT_SELECTED":
          return (
            <Card className="border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <XCircle className="h-5 w-5 text-red-500" />
                  <CardTitle className="text-red-700 dark:text-red-400">
                    Not Selected
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-red-600 dark:text-red-400">
                  Unfortunately, your team was not selected for this edition of
                  Hackfest. We appreciate your participation and encourage you
                  to try again next time!
                </p>
              </CardContent>
            </Card>
          );

        case "PAYMENT_PENDING":
          return (
            <Card className="border-yellow-200 dark:border-yellow-900 bg-yellow-50 dark:bg-yellow-950/30">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-yellow-500" />
                  <CardTitle className="text-yellow-700 dark:text-yellow-400">
                    Payment Pending
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-yellow-600 dark:text-yellow-400">
                  Congratulations! Your team has been selected! Please complete
                  the payment to confirm your participation.
                </p>
                {user.isLeader ? (
                  paymentsOpen ? (
                    <Button asChild>
                      <Link href={`/teams/${id}/payment`}>
                        Complete Payment
                      </Link>
                    </Button>
                  ) : (
                    <p className="text-sm text-yellow-600 dark:text-yellow-400">
                      Payment portal will open soon. Stay tuned!
                    </p>
                  )
                ) : (
                  <p className="text-sm text-yellow-600 dark:text-yellow-400">
                    Only the team leader can complete the payment. Please
                    contact your team leader.
                  </p>
                )}
              </CardContent>
            </Card>
          );

        case "PAYMENT_PAID":
          return (
            <Card className="border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-950/30">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <CardTitle className="text-green-700 dark:text-green-400">
                    Registration Complete
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-green-600 dark:text-green-400">
                  Your team is fully registered for Hackfest! Payment has been
                  confirmed. See you there!
                </p>
              </CardContent>
            </Card>
          );

        case "PAYMENT_NOT_OPEN":
          return (
            <Card className="border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/30">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-blue-500" />
                  <CardTitle className="text-blue-700 dark:text-blue-400">
                    Selected! Payment Opening Soon
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-blue-600 dark:text-blue-400">
                  Congratulations! Your team has been selected for Hackfest!
                  Payment portal will open soon. Stay tuned!
                </p>
              </CardContent>
            </Card>
          );

        case "IDEA_NOT_SUBMITTED":
          return (
            <Card className="border-orange-200 dark:border-orange-900 bg-orange-50 dark:bg-orange-950/30">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-orange-500" />
                  <CardTitle className="text-orange-700 dark:text-orange-400">
                    Submission Missed
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-orange-600 dark:text-orange-400">
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
          <Card className="border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/30">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-500" />
                <CardTitle className="text-blue-700 dark:text-blue-400">
                  Awaiting Results
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-blue-600 dark:text-blue-400">
                Your idea has been submitted successfully! Results will be
                announced soon. Stay tuned for updates.
              </p>
            </CardContent>
          </Card>
        );
      }
      if (teamStatus === "IDEA_NOT_SUBMITTED") {
        return (
          <Card className="border-orange-200 dark:border-orange-900 bg-orange-50 dark:bg-orange-950/30">
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-orange-500" />
                <CardTitle className="text-orange-700 dark:text-orange-400">
                  Submission Missed
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-orange-600 dark:text-orange-400">
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
        <Card>
          <CardHeader>
            <CardTitle>Team Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!team.isCompleted &&
              (user.isLeader ? (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    As the team leader, you can confirm the team once you have
                    3-4 members. After confirmation, members will not be able to
                    leave the team.
                  </p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <ConfirmTeamButton teamId={team.id} />
                    </div>
                    <div>
                      <DeleteTeamButton teamId={team.id} teamName={team.name} />
                      <p className="text-sm text-muted-foreground mt-2">
                        Delete team (cannot be undone)
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">
                    You can leave the team before it is confirmed by the leader.
                  </p>
                  <LeaveTeamButton />
                </div>
              ))}

            {team.isCompleted && (
              <div className="space-y-6">
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm font-medium">
                    This team has been confirmed. Members cannot leave the team.
                  </p>
                </div>

                {teamStatus === "IDEA_SUBMITTED" && submission ? (
                  <TeamSubmissionForm
                    teamId={team.id}
                    submission={submission}
                  />
                ) : user.isLeader ? (
                  <TeamSubmissionForm teamId={team.id} />
                ) : (
                  <div className="p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="h-5 w-5 text-blue-500" />
                      <p className="text-sm font-medium text-blue-700 dark:text-blue-400">
                        Awaiting Idea Submission
                      </p>
                    </div>
                    <p className="text-sm text-blue-600 dark:text-blue-400">
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
        <Card>
          <CardHeader>
            <CardTitle>Team Status</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Registrations have closed and results are out. Your team was not
              registered.
            </p>
          </CardContent>
        </Card>
      );
    }

    if (!registrationsOpen && !team.isCompleted && !resultsOut) {
      return (
        <Card>
          <CardHeader>
            <CardTitle>Team Status</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Registrations have closed but your team is not registered. You
              will not be considered for selection.
            </p>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card>
        <CardHeader>
          <CardTitle>Team Status</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {team.isCompleted
              ? "Your team is registered. Check back for updates."
              : "Complete your team registration to participate."}
          </p>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black p-4">
      <div className="w-full max-w-3xl space-y-6">
        <div className="flex items-center gap-4">
          <Button asChild variant="outline" size="icon">
            <Link href="/">
              <Home className="h-4 w-4" />
            </Link>
          </Button>
          <div className="flex-1 flex items-center justify-between">
            <h1 className="text-3xl font-bold">{team.name}</h1>
            {user.isLeader && <TeamIdDisplay teamId={team.id} />}
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Team Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <span className="text-sm font-medium text-muted-foreground">
                  Status:
                </span>{" "}
                <span>{team.isCompleted ? "Completed" : "Active"}</span>
              </div>
              {resultsOut &&
                (teamStatus === "PAYMENT_PENDING" ||
                  teamStatus === "PAYMENT_PAID") &&
                team.paymentStatus && (
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">
                      Payment Status:
                    </span>{" "}
                    <span>{team.paymentStatus}</span>
                  </div>
                )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Team Members</CardTitle>
              <CardDescription>{members.length} / 4 members</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-2 border rounded-lg"
                  >
                    <div>
                      <div className="font-medium">
                        {member.name || "Unknown"}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {member.email}
                      </div>
                    </div>
                    {member.isLeader && (
                      <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                        Leader
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {renderStatusContent()}
      </div>
    </div>
  );
}
