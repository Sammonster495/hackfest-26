import { useCallback, useEffect, useState } from "react";
import { PaymentsTable } from "~/components/dashboard/tables/payments-table";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Skeleton } from "~/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";

interface StatsData {
  numberOfHFPaymentsConfirmed: number;
  numberOfHFPaymentsPending: number;
  numberOfEventPaymentsConfirmed: number;
  numberOfEventPaymentsPending: number;
  totalConfirmedHackfestPayments: number;
  totalPendingHackfestPayments: number;
  totalConfirmedEventPayments: number;
  totalPendingEventPayments: number;
}

function PaymentStats() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/dashboard/payments/stats");
      if (res.ok) {
        const data = (await res.json()) as StatsData;
        setStats(data);
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchStats();
  }, [fetchStats]);

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((id) => (
          <Card key={`skeleton-card-${id}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-[100px]" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-[60px] mb-1" />
              <Skeleton className="h-3 w-[120px]" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const statItems = [
    {
      title: "Verified Hackfest Payments",
      value: stats?.totalConfirmedHackfestPayments ?? 0,
      count: stats?.numberOfHFPaymentsConfirmed ?? 0,
      description: "Total verified hackfest payments",
    },
    {
      title: "Unverified Hackfest Payments",
      value: stats?.totalPendingHackfestPayments ?? 0,
      count: stats?.numberOfHFPaymentsPending ?? 0,
      description: "Total unverified hackfest payments",
    },
    {
      title: "Verified Event Payments",
      value: stats?.totalConfirmedEventPayments ?? 0,
      count: stats?.numberOfEventPaymentsConfirmed ?? 0,
      description: "Total verified event payments",
    },
    {
      title: "Unverified Event Payments",
      value: stats?.totalPendingEventPayments ?? 0,
      count: stats?.numberOfEventPaymentsPending ?? 0,
      description: "Total unverified event payments",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {statItems.map((item) => (
        <Card key={item.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{item.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₹{item.value.toLocaleString("en-IN")}
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              {item.count} payments
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {item.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function PaymentsTab() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Payments</h2>
          <p className="text-muted-foreground">
            View and manage all hackathon payments
          </p>
        </div>
      </div>

      <Tabs defaultValue="payments" className="space-y-4">
        <TabsList>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="stats">Stats</TabsTrigger>
        </TabsList>
        <TabsContent value="payments" className="space-y-4">
          <PaymentsTable />
        </TabsContent>
        <TabsContent value="stats" className="space-y-4">
          <PaymentStats />
        </TabsContent>
      </Tabs>
    </div>
  );
}
