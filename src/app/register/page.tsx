import { redirect } from "next/navigation";
import { auth } from "~/auth/config";
import { RegisterForm } from "~/components/forms/register-form";
import * as userData from "~/db/data/participant";

export default async function RegisterPage() {
  const session = await auth();
  if (!session?.user?.email) {
    redirect("/api/auth/signin");
  }

  if (session.user.isRegistrationComplete) {
    redirect("/teams");
  }

  const user = await userData.findByEmail(session.user.email);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <RegisterForm initialGithubUsername={user?.github || undefined} />
    </div>
  );
}
