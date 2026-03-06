import { redirect } from "next/navigation";
import { auth } from "~/auth/config";
import SignOut from "~/components/auth/authButtons/signOut";
import { TeamDetailsClient } from "~/components/teams/TeamDetailsClient";

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

  return (
    <TeamDetailsClient id={id} signOutButton={<SignOut variant="outline" />} />
  );
}
