"use client";

import { ArrowRightIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";

export function TeamsTab() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Teams</h2>
        <p className="text-muted-foreground">
          View and manage all hackathon teams
        </p>
      </div>

      <Link href="/dashboard/teams" className="block">
        <Card className="cursor-pointer transition-all hover:shadow-lg hover:border-primary/50 group">
          <div className="flex items-center justify-between p-6">
            <div className="flex-1">
              <CardTitle className="text-lg group-hover:text-primary transition-colors mb-1">
                Open Teams Management
              </CardTitle>
              <CardDescription>
                View full teams table with attendance, payments, and more
              </CardDescription>
            </div>
            <div className="text-muted-foreground group-hover:text-primary transition-colors">
              <ArrowRightIcon className="h-4 w-4" />
            </div>
          </div>
        </Card>
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Team Leaderboard</CardTitle>
          <CardDescription>Teams ranked by scores</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center p-8 border border-dashed rounded-lg gap-4">
            <p className="text-sm text-muted-foreground">To be done..</p>
            <Button variant="outline" asChild>
              <Link href="/dashboard/teams">View All Teams</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
