import { Home } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "~/auth/config";
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
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black p-4">
      <div className="w-full max-w-2xl">
        <div className="mb-6 flex items-center gap-4">
          <Button asChild variant="outline" size="icon">
            <Link href="/">
              <Home className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Team Management</h1>
            <p className="text-muted-foreground mt-2">
              Create a new team or join an existing one.
            </p>
          </div>
        </div>
        <TeamForm />
      </div>
    </div>
  );
}
