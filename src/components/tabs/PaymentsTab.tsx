import { PaymentsTable } from "~/components/dashboard/tables/payments-table";

export function PaymentsTab() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Payments</h2>
        <p className="text-muted-foreground">
          View and manage all hackathon payments
        </p>
      </div>
      <PaymentsTable />
    </div>
  );
}
