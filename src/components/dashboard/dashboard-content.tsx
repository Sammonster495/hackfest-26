"use client";

import { ArrowRightIcon } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { DashboardTabs } from "~/components/dashboard/dashboard-tabs";
import { OrganiserDashboard } from "~/components/dashboard/organiser";
import { Card, CardDescription, CardTitle } from "~/components/ui/card";

type DashboardContentProps = {
  permissions: {
    // Role-based checks
    isAdmin: boolean;
    // Permission-based checks
    canManageSettings: boolean;
    canManageRoles: boolean;
    canViewAllTeams: boolean;
    canViewTop60: boolean;
    canScoreSubmissions: boolean;
    canRemarkSubmissions: boolean;
    canPromoteSelection: boolean;
    canViewSelection: boolean;
    canMarkAttendance: boolean;
    canViewResults: boolean;
  };
};

function AdminTab() {
  return <OrganiserDashboard />;
}

function TeamsTab() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Teams</h2>
        <p className="text-muted-foreground">View and manage hackathon teams</p>
      </div>

      <Link href="/dashboard/teams" className="block">
        <Card className="cursor-pointer transition-all hover:shadow-lg hover:border-primary/50 group">
          <div className="flex items-center justify-between p-6">
            <div className="flex-1">
              <CardTitle className="text-lg group-hover:text-primary transition-colors mb-1">
                Open Teams Table
              </CardTitle>
              <CardDescription>
                View all teams, attendance, and payment status
              </CardDescription>
            </div>
            <div className="text-muted-foreground group-hover:text-primary transition-colors">
              <ArrowRightIcon className="h-4 w-4" />
            </div>
          </div>
        </Card>
      </Link>
    </div>
  );
}

function EvaluatorTab() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Evaluator</h2>
        <p className="text-muted-foreground">
          Score and review idea submissions before the hackathon
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <div className="p-6">
            <CardTitle className="mb-2">Score Submissions</CardTitle>
            <CardDescription>
              Rate team idea submissions with criteria-based scoring
            </CardDescription>
            <div className="mt-4 p-8 border border-dashed rounded-lg text-center text-muted-foreground text-sm">
              Scoring interface coming soon...
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <CardTitle className="mb-2">Add Remarks</CardTitle>
            <CardDescription>
              Provide feedback and remarks on submissions
            </CardDescription>
            <div className="mt-4 p-8 border border-dashed rounded-lg text-center text-muted-foreground text-sm">
              Remarks interface coming soon...
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

function SelectorTab() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Selection</h2>
        <p className="text-muted-foreground">
          Shortlist teams for Top 60 and Top 10 selection
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <div className="p-6">
            <CardTitle className="mb-2">Selection Window</CardTitle>
            <CardDescription>
              Promote or demote teams through selection stages
            </CardDescription>
            <div className="mt-4 p-8 border border-dashed rounded-lg text-center text-muted-foreground text-sm">
              Selection interface coming soon...
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <CardTitle className="mb-2">View Status</CardTitle>
            <CardDescription>
              Current selection status and team rankings
            </CardDescription>
            <div className="mt-4 p-8 border border-dashed rounded-lg text-center text-muted-foreground text-sm">
              Status view coming soon...
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

function JudgeTab() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Judge</h2>
        <p className="text-muted-foreground">
          Live judging during the hackathon
        </p>
      </div>

      <Card>
        <div className="p-6">
          <CardTitle className="mb-2">Score Teams</CardTitle>
          <CardDescription>
            Judge Top 60 teams with criteria-based scoring
          </CardDescription>
          <div className="mt-4 p-8 border border-dashed rounded-lg text-center text-muted-foreground text-sm">
            Judging interface coming soon...
          </div>
        </div>
      </Card>
    </div>
  );
}

function FinalJudgeTab() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Final Judge</h2>
        <p className="text-muted-foreground">
          Final scoring and results after the hackathon
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <div className="p-6">
            <CardTitle className="mb-2">Final Scoring</CardTitle>
            <CardDescription>
              Complete final scores for all judged teams
            </CardDescription>
            <div className="mt-4 p-8 border border-dashed rounded-lg text-center text-muted-foreground text-sm">
              Final scoring interface coming soon...
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <CardTitle className="mb-2">View Results</CardTitle>
            <CardDescription>
              See aggregated scores and rankings
            </CardDescription>
            <div className="mt-4 p-8 border border-dashed rounded-lg text-center text-muted-foreground text-sm">
              Results view coming soon...
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

function MentorTab() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Mentor</h2>
        <p className="text-muted-foreground">
          Provide remarks and feedback to teams (no scoring)
        </p>
      </div>

      <Card>
        <div className="p-6">
          <CardTitle className="mb-2">Add Remarks</CardTitle>
          <CardDescription>
            Provide helpful feedback to Top 60 teams
          </CardDescription>
          <div className="mt-4 p-8 border border-dashed rounded-lg text-center text-muted-foreground text-sm">
            Remarks interface coming soon...
          </div>
        </div>
      </Card>
    </div>
  );
}

export function DashboardContent({ permissions }: DashboardContentProps) {
  const {
    isAdmin,
    canViewAllTeams,
    canScoreSubmissions,
    canRemarkSubmissions,
    canPromoteSelection,
    canViewSelection,
    canViewTop60,
    canViewResults,
  } = permissions;

  const tabs = [
    {
      id: "admin",
      label: "Admin",
      hasAccess: isAdmin,
      content: <AdminTab />,
    },
    {
      id: "teams",
      label: "Teams",
      hasAccess: isAdmin || canViewAllTeams,
      content: <TeamsTab />,
    },
    {
      id: "evaluator",
      label: "Evaluator",
      hasAccess: isAdmin || (canScoreSubmissions && canViewAllTeams),
      content: <EvaluatorTab />,
    },
    {
      id: "selector",
      label: "Selection",
      hasAccess: isAdmin || (canPromoteSelection && canViewSelection),
      content: <SelectorTab />,
    },
    {
      id: "judge",
      label: "Judge",
      hasAccess: isAdmin || (canScoreSubmissions && canViewTop60),
      content: <JudgeTab />,
    },
    {
      id: "finalJudge",
      label: "Final Judge",
      hasAccess: isAdmin || (canScoreSubmissions && canViewResults),
      content: <FinalJudgeTab />,
    },
    {
      id: "mentor",
      label: "Mentor",
      hasAccess: isAdmin || canRemarkSubmissions,
      content: <MentorTab />,
    },
  ];

  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center p-8">
          <div className="h-8 w-32 animate-pulse rounded bg-muted" />
        </div>
      }
    >
      <DashboardTabs tabs={tabs} defaultTab={isAdmin ? "admin" : undefined} />
    </Suspense>
  );
}
