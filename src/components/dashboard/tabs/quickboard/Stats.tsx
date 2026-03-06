import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";

type StatCardProps = {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ReactNode;
};

export type QuickStats = {
  totalTeams: number;
  totalUsers: number;
  totalParticipants: number;
  uniqueTotalColleges: number;
  uniqueTotalStates: number;
  uniqueConfirmedColleges: number;
  uniqueConfirmedStates: number;
  confirmedTeams: number;
  confirmedParticipants: number;
  ideaSubmissions: number;
};

function StatCard({ title, value, description, icon }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="h-4 w-4 text-muted-foreground">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}

export function Stats({ data: quickStats }: { data: QuickStats | null }) {
  if (quickStats == null) {
    return null;
  }
  return (
    <>
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Quickboard</h2>
        <p className="text-muted-foreground">Overview of Hackfest Stats</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Total Users Accounts"
          value={quickStats?.totalUsers ?? 0}
          icon={<Users className="h-4 w-4" />}
        />
        <StatCard
          title="Total Teams registered"
          value={quickStats?.totalTeams ?? 0}
          icon={<Users className="h-4 w-4" />}
        />
        <StatCard
          title="Total Participants registered"
          value={quickStats?.totalParticipants ?? 0}
          icon={<Users className="h-4 w-4" />}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Unique Colleges (Total)"
          value={quickStats?.uniqueTotalColleges ?? 0}
          description="Colleges from which teams have registered"
          icon={<Building2 className="h-4 w-4" />}
        />
        <StatCard
          title="Unique States (Total)"
          value={quickStats?.uniqueTotalStates ?? 0}
          description="States from which teams have registered"
          icon={<MapPin className="h-4 w-4" />}
        />
        <StatCard
          title="Unique Colleges (Confirmed)"
          value={quickStats?.uniqueConfirmedColleges ?? 0}
          description="Colleges from which teams have registered"
          icon={<Building2 className="h-4 w-4" />}
        />
        <StatCard
          title="Unique States (Confirmed)"
          value={quickStats?.uniqueConfirmedStates ?? 0}
          description="States from which teams have registered"
          icon={<MapPin className="h-4 w-4" />}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Confirmed Teams"
          value={quickStats?.confirmedTeams ?? 0}
          description="Teams that have confirmed participation"
          icon={<CheckCircle2 className="h-4 w-4" />}
        />
        <StatCard
          title="Confirmed Participants"
          value={quickStats?.confirmedParticipants ?? 0}
          description="Participants that have confirmed participation"
          icon={<CheckCircle2 className="h-4 w-4" />}
        />
        <StatCard
          title="Idea Submissions"
          value={quickStats?.ideaSubmissions ?? 0}
          description="Teams that have submitted their ideas"
          icon={<CheckCircle2 className="h-4 w-4" />}
        />
      </div>
    </>
  );
}
