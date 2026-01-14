import { Home } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "~/auth/config";
import { ConfirmTeamButton } from "~/components/teams/confirm-team-button";
import { DeleteTeamButton } from "~/components/teams/delete-team-button";
import { LeaveTeamButton } from "~/components/teams/leave-team-button";
import { TeamIdDisplay } from "~/components/teams/team-id-display";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import * as teamData from "~/db/data/teams";
import * as userData from "~/db/data/users";

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
              {team.teamStatus && (
                <div>
                  <span className="text-sm font-medium text-muted-foreground">
                    Team Status:
                  </span>{" "}
                  <span>{team.teamStatus}</span>
                </div>
              )}
              {team.paymentStatus && (
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

        <Card>
          <CardHeader>
            <CardTitle>Team Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {user.isLeader && !team.isCompleted && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  As the team leader, you can confirm the team once you have 3-4
                  members. After confirmation, members will not be able to leave
                  the team.
                </p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <ConfirmTeamButton teamId={team.id} />
                  </div>
                  <div>
                    <DeleteTeamButton teamId={team.id} teamName={team.name} />
                    <p className="text-sm text-muted-foreground mb-2">
                      Delete team (cannot be undone)
                    </p>
                  </div>
                </div>
              </div>
            )}

            {!user.isLeader && !team.isCompleted && (
              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  You can leave the team before it is confirmed by the leader.
                </p>
                <LeaveTeamButton />
              </div>
            )}

            {team.isCompleted && (
              <div className="space-y-4">
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm font-medium">
                    This team has been confirmed. Members cannot leave the team.
                  </p>
                </div>
                {user.isLeader && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">
                      As the team leader, you can delete the team. This will
                      remove all members and cannot be undone.
                    </p>
                    <DeleteTeamButton teamId={team.id} teamName={team.name} />
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
