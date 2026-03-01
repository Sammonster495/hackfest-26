import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "~/auth/config";
import { RegisterForm } from "~/components/forms/register-form";
import * as userData from "~/db/data/participant";

export const metadata: Metadata = {
  title: "Register",
  description:
    "Register for Hackfest'26 – the 36-hour national hackathon at NMAMIT, Nitte. Sign up with your team and compete for the prizes.",
  alternates: {
    canonical: "https://hackfest.dev/register",
  },
};

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
    <div className="min-h-dvh bg-zinc-50 dark:bg-black">
      <RegisterForm initialGithubUsername={user?.github || undefined} />
    </div>
  );
}
