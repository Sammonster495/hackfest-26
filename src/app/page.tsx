import Image from "next/image";
import Link from "next/link";
import { auth } from "~/auth/config";
import SignIn from "~/components/auth/authButtons/signIn";
import SignOut from "~/components/auth/authButtons/signOut";
import { Button } from "~/components/ui/button";
import * as userData from "~/db/data/users";

export default async function Home() {
  const session = await auth();
  // Only query for teamId if registration is complete
  const user =
    session?.user?.email && session.user.isRegistrationComplete
      ? await userData.findByEmail(session.user.email)
      : null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
        {session?.user ? (
          <div className="w-full space-y-4">
            <div className="flex items-center gap-4">
              {session.user.image && (
                <Image
                  src={session.user.image}
                  alt="Profile Picture"
                  width={64}
                  height={64}
                  className="rounded-full"
                />
              )}
              <div>
                <h1 className="text-2xl font-bold">
                  Welcome, {session.user.name || session.user.email || "there"}!
                </h1>
                {user && (
                  <p className="text-muted-foreground">
                    {user.teamId
                      ? "You are in a team"
                      : "You are not in a team yet"}
                  </p>
                )}
              </div>
            </div>

            {!session.user.isRegistrationComplete ? (
              <div className="space-y-2">
                <p className="text-muted-foreground">
                  Please complete your registration to continue.
                </p>
                <Button asChild>
                  <Link href="/register">Complete Registration</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {user && !user.teamId && (
                  <Button asChild>
                    <Link href="/teams">Create or Join Team</Link>
                  </Button>
                )}
                {user && user.teamId && (
                  <Button asChild>
                    <Link href={`/teams/${user.teamId}`}>Team</Link>
                  </Button>
                )}
                <SignOut />
              </div>
            )}
          </div>
        ) : (
          <div>
            <h1 className="text-2xl font-bold">Welcome!</h1>
            <p className="text-muted-foreground mb-4">
              Please sign in to continue.
            </p>
            <SignIn />
          </div>
        )}
      </main>
    </div>
  );
}
