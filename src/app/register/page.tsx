import { auth } from "~/auth/config";
import { redirect } from "next/navigation";
import { RegisterForm } from "~/components/forms/register-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";

export default async function RegisterPage() {
  const session = await auth();
  if (!session?.user?.email) {
    redirect("/");
  }

  if (session.user.isRegistrationComplete) {
    redirect("/");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Complete Your Registration</CardTitle>
          <CardDescription>
            Please fill in all required details (marked with *) to complete your
            registration. You must complete registration before creating or
            joining a team.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RegisterForm />
        </CardContent>
      </Card>
    </div>
  );
}
