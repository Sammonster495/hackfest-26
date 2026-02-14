import { auth } from "~/auth/dashboard-config";
import { CommandMenu } from "~/components/ui/command-menu";
import { isAdmin } from "~/lib/auth/check-access";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const userIsAdmin = session?.dashboardUser
    ? isAdmin(session.dashboardUser)
    : false;

  return (
    <div className="dashboard-theme font-sans">
      <CommandMenu
        isAdmin={userIsAdmin}
        dashboardUser={session?.dashboardUser}
      />
      {children}
    </div>
  );
}
