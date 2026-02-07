import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Users, Building2, MapPin, CheckCircle2 } from "lucide-react";
import { getCollegeRankingsBySelections, getDashboardStats, getStatesStats } from "~/db/services/dashboard-stats";

type StatCardProps = {
    title: string;
    value: string | number;
    description?: string;
    icon: React.ReactNode;
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
                    <p className="text-xs text-muted-foreground">{description}</p>
                )}
            </CardContent>
        </Card>
    );
}

export async function QuickboardTab() {
    const quickStats = await getDashboardStats();
    const statesStats = await getStatesStats();
    const collegeRankings = await getCollegeRankingsBySelections();

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Quickboard</h2>
                <p className="text-muted-foreground">
                    Overview of Hackfest Stats
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title="Total Teams"
                    value={quickStats.totalTeams}
                    icon={<Users className="h-4 w-4" />}
                />
                <StatCard
                    title="Total Participants"
                    value={quickStats.totalParticipants}
                    icon={<Users className="h-4 w-4" />}
                />
                <StatCard
                    title="Unique Colleges"
                    value={quickStats.uniqueColleges}
                    icon={<Building2 className="h-4 w-4" />}
                />
                <StatCard
                    title="Unique States"
                    value={quickStats.uniqueStates}
                    icon={<MapPin className="h-4 w-4" />}
                />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <StatCard
                    title="Confirmed Teams"
                    value={quickStats.confirmedTeams}
                    description="Teams that have confirmed participation"
                    icon={<CheckCircle2 className="h-4 w-4" />}
                />
                <StatCard
                    title="Idea Submissions"
                    value={quickStats.ideaSubmissions}
                    description="Teams that have submitted their ideas"
                    icon={<CheckCircle2 className="h-4 w-4" />}
                />
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>College Analytics</CardTitle>
                    <CardDescription>
                        State-wise breakdown of registrations and colleges
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {statesStats.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b">
                                        <th className="text-left py-2 px-3 font-medium">State</th>
                                        <th className="text-right py-2 px-3 font-medium">Teams</th>
                                        <th className="text-right py-2 px-3 font-medium">Participants</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {statesStats.map((state, index) => (
                                        <tr key={index} className="border-b last:border-0">
                                            <td className="py-2 px-3">{state.state}</td>
                                            <td className="py-2 px-3 text-right">{state.totalTeams}</td>
                                            <td className="py-2 px-3 text-right">{state.totalParticipants}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center p-8 border border-dashed rounded-lg">
                            <p className="text-sm text-muted-foreground">
                                No college data available
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Top Colleges</CardTitle>
                    <CardDescription>
                        Colleges ranked by selected teams
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {collegeRankings.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b">
                                        <th className="text-left py-2 px-3 font-medium">College</th>
                                        <th className="text-right py-2 px-3 font-medium">Teams</th>
                                        <th className="text-right py-2 px-3 font-medium">Participants</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {collegeRankings.map((college, index) => (
                                        <tr key={index} className="border-b last:border-0">
                                            <td className="py-2 px-3">{college.college}</td>
                                            <td className="py-2 px-3 text-right">{college.totalTeams}</td>
                                            <td className="py-2 px-3 text-right">{college.totalParticipants}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center p-8 border border-dashed rounded-lg">
                            <p className="text-sm text-muted-foreground">
                                No college ranking data available yet
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
