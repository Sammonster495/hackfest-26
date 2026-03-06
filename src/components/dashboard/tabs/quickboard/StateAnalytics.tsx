import { useState } from "react";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Label } from "~/components/ui/label";
import { Switch } from "~/components/ui/switch";

export type StateStat = {
  state: string | null;
  totalTeams: number;
  totalParticipants: number;
};

export const StatesAnalytics = ({
  statesStatsTotal,
  statesStatsConfirmed,
}: {
  statesStatsTotal: StateStat[];
  statesStatsConfirmed: StateStat[];
}) => {
  const [showConfirmedStates, setShowConfirmedStates] = useState(true);

  const activeStatesData = showConfirmedStates
    ? statesStatsConfirmed
    : statesStatsTotal;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>State Analytics</CardTitle>
            <CardDescription>
              State-wise breakdown of registrations
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Label
              htmlFor="state-toggle"
              className="text-sm text-muted-foreground"
            >
              {showConfirmedStates ? "Confirmed" : "Total"}
            </Label>
            <Switch
              id="state-toggle"
              checked={showConfirmedStates}
              onCheckedChange={setShowConfirmedStates}
              size="sm"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {activeStatesData.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-3 font-medium">State</th>
                  <th className="text-right py-2 px-3 font-medium">Teams</th>
                  <th className="text-right py-2 px-3 font-medium">
                    Participants
                  </th>
                </tr>
              </thead>
              <tbody>
                {activeStatesData.map((state) => (
                  <tr
                    key={state.state ?? "unknown"}
                    className="border-b last:border-0"
                  >
                    <td className="py-2 px-3">{state.state}</td>
                    <td className="py-2 px-3 text-right">{state.totalTeams}</td>
                    <td className="py-2 px-3 text-right">
                      {state.totalParticipants}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex items-center justify-center p-8 border border-dashed rounded-lg">
            <p className="text-sm text-muted-foreground">
              No state data available
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
