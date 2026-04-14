"use client";

import { ScanLine } from "lucide-react";
import { useState } from "react";
import { QRScanner } from "~/components/dashboard/attendance/qr-scanner";
import { AttendanceTable } from "~/components/dashboard/attendance/attendance-table";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";

export function AttendanceTab() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [scanDialogOpen, setScanDialogOpen] = useState(false);

  const handleScanSuccess = () => {
    setRefreshKey((k) => k + 1);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Attendance</h2>
          <p className="text-muted-foreground">
            View and mark team attendance
          </p>
        </div>
        <Dialog open={scanDialogOpen} onOpenChange={setScanDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <ScanLine className="mr-2 h-4 w-4" />
              Scan QR Code
            </Button>
          </DialogTrigger>
          <DialogContent className="w-[95vw] max-w-md mx-auto">
            <DialogHeader>
              <DialogTitle>Scan Team QR Code</DialogTitle>
            </DialogHeader>
            <QRScanner onScanSuccess={handleScanSuccess} />
          </DialogContent>
        </Dialog>
      </div>

      <AttendanceTable key={refreshKey} />
    </div>
  );
}
