import { ChevronLeft, ChevronRight, Filter } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Switch } from "~/components/ui/switch";

type CollegeBreakdown = {
  college: string | null;
  state: string | null;
  totalTeams: number;
  confirmedTeams: number;
  ideaSubmissions: number;
};

export const CollegeAnalytics = () => {
  const [collegeBreakdownTotal, setCollegeBreakdownTotal] = useState(0);
  const [uniqueStates, setUniqueStates] = useState<string[]>([]);
  const [isCollegeLoading, setIsCollegeLoading] = useState(false);

  const [collegeStateFilter, setCollegeStateFilter] = useState("all");
  const [showOnlyWithIdeas, setShowOnlyWithIdeas] = useState(false);
  const [collegePage, setCollegePage] = useState(0);

  const [collegesBreakdown, setCollegesBreakdown] = useState<
    CollegeBreakdown[]
  >([]);
  const COLLEGES_PER_PAGE = 10;

  useEffect(() => {
    async function fetchCollegeBreakdown() {
      setIsCollegeLoading(true);
      try {
        const params = new URLSearchParams({
          page: String(collegePage),
          limit: String(COLLEGES_PER_PAGE),
        });
        if (collegeStateFilter !== "all") {
          params.set("state", collegeStateFilter);
        }
        if (showOnlyWithIdeas) {
          params.set("ideaOnly", "true");
        }

        const response = await fetch(
          `/api/dashboard/stats/college-breakdown?${params.toString()}`,
        );
        if (!response.ok) {
          throw new Error("Failed to fetch college breakdown");
        }
        const result = await response.json();
        setCollegesBreakdown(result.data);
        setCollegeBreakdownTotal(result.total);
        setUniqueStates(result.states);
      } catch (error) {
        console.error(error);
        toast.error("Failed to load college breakdown");
      } finally {
        setIsCollegeLoading(false);
      }
    }

    fetchCollegeBreakdown();
  }, [collegePage, collegeStateFilter, showOnlyWithIdeas]);

  const totalCollegePages = Math.ceil(
    collegeBreakdownTotal / COLLEGES_PER_PAGE,
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>College Analytics</CardTitle>
            <CardDescription className="mt-2">
              College-wise breakdown of team registrations
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select
                value={collegeStateFilter}
                onValueChange={(val) => {
                  setCollegeStateFilter(val);
                  setCollegePage(0);
                }}
              >
                <SelectTrigger className="w-45" size="sm">
                  <SelectValue placeholder="Filter by state" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All States</SelectItem>
                  {uniqueStates.map((state) => (
                    <SelectItem key={state} value={state}>
                      {state}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Label
                htmlFor="idea-toggle"
                className="text-sm text-muted-foreground"
              >
                Idea Submitted
              </Label>
              <Switch
                id="idea-toggle"
                checked={showOnlyWithIdeas}
                onCheckedChange={(val) => {
                  setShowOnlyWithIdeas(val);
                  setCollegePage(0);
                }}
                size="sm"
              />
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isCollegeLoading ? (
          <div className="flex items-center justify-center p-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : collegesBreakdown.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-3 font-medium">College</th>
                  <th className="text-right py-2 px-3 font-medium">
                    Confirmed Teams
                  </th>
                  <th className="text-right py-2 px-3 font-medium">
                    Unconfirmed Teams
                  </th>
                  <th className="text-right py-2 px-3 font-medium">
                    Idea Submissions
                  </th>
                </tr>
              </thead>
              <tbody>
                {collegesBreakdown.map((entry) => (
                  <tr
                    key={entry.college ?? "unknown"}
                    className="border-b last:border-0"
                  >
                    <td className="py-2 px-3">{entry.college}</td>
                    <td className="py-2 px-3 text-right">
                      {entry.confirmedTeams}
                    </td>
                    <td className="py-2 px-3 text-right">
                      {entry.totalTeams - entry.confirmedTeams}
                    </td>
                    <td className="py-2 px-3 text-right">
                      {entry.ideaSubmissions}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {totalCollegePages > 1 && (
              <div className="flex items-center justify-between pt-4 border-t mt-2">
                <p className="text-sm text-muted-foreground">
                  Showing {collegePage * COLLEGES_PER_PAGE + 1}–
                  {Math.min(
                    (collegePage + 1) * COLLEGES_PER_PAGE,
                    collegeBreakdownTotal,
                  )}{" "}
                  of {collegeBreakdownTotal} colleges
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCollegePage((p) => Math.max(0, p - 1))}
                    disabled={collegePage === 0}
                    className="inline-flex items-center justify-center rounded-md border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-accent disabled:opacity-50 disabled:pointer-events-none"
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Prev
                  </button>
                  <span className="text-sm text-muted-foreground">
                    {collegePage + 1} / {totalCollegePages}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setCollegePage((p) =>
                        Math.min(totalCollegePages - 1, p + 1),
                      )
                    }
                    disabled={collegePage >= totalCollegePages - 1}
                    className="inline-flex items-center justify-center rounded-md border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-accent disabled:opacity-50 disabled:pointer-events-none"
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center p-8 border border-dashed rounded-lg">
            <p className="text-sm text-muted-foreground">
              No college data available
              {collegeStateFilter !== "all" && " for this state"}
              {showOnlyWithIdeas && " with idea submissions"}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
