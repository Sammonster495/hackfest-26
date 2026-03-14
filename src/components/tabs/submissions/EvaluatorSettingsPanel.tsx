"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";

type EvaluatorCandidate = {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  hasEvaluatorAccess: boolean;
};

type EvaluatorSettingsResponse = {
  evaluatorPermissionKey: string;
  roles: EvaluatorCandidate[];
};

export function EvaluatorSettingsPanel() {
  const [isLoading, setIsLoading] = useState(true);
  const [roles, setRoles] = useState<EvaluatorCandidate[]>([]);
  const [evaluatorPermissionKey, setEvaluatorPermissionKey] = useState("");
  const [savingRoleId, setSavingRoleId] = useState<string | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/dashboard/submissions/settings", {
        cache: "no-store",
      });
      if (!res.ok) {
        throw new Error("Failed to fetch evaluator settings");
      }

      const data: EvaluatorSettingsResponse = await res.json();
      setRoles(data.roles);
      setEvaluatorPermissionKey(data.evaluatorPermissionKey);
    } catch {
      toast.error("Failed to load evaluator settings");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchData();
  }, []);

  const toggleEvaluatorAccess = async (roleId: string, enabled: boolean) => {
    try {
      setSavingRoleId(roleId);
      const res = await fetch("/api/dashboard/submissions/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ roleId, enabled }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(
          err.description || err.message || "Failed to update evaluator access",
        );
      }

      setRoles((prev) =>
        prev.map((role) =>
          role.id === roleId
            ? {
                ...role,
                hasEvaluatorAccess: enabled,
              }
            : role,
        ),
      );

      toast.success(
        enabled
          ? "Evaluator access enabled for role"
          : "Evaluator access removed from role",
      );
      void fetchData();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to update evaluator access",
      );
    } finally {
      setSavingRoleId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">Evaluator Access By Role</h3>
        <p className="text-sm text-muted-foreground">
          Roles with{" "}
          <span className="font-mono">
            {evaluatorPermissionKey || "submission:score"}
          </span>{" "}
          can evaluate submissions.
        </p>
      </div>

      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Evaluator Access</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="py-8 text-center text-muted-foreground"
                >
                  Loading roles...
                </TableCell>
              </TableRow>
            ) : roles.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="py-8 text-center text-muted-foreground"
                >
                  No roles found.
                </TableCell>
              </TableRow>
            ) : (
              roles.map((role) => (
                <TableRow key={role.id}>
                  <TableCell>
                    <p className="font-medium">{role.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {role.description || "No description"}
                    </p>
                  </TableCell>
                  <TableCell>
                    <Badge variant={role.isActive ? "success" : "outline"}>
                      {role.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={role.hasEvaluatorAccess ? "success" : "outline"}
                    >
                      {role.hasEvaluatorAccess ? "Enabled" : "Disabled"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {role.hasEvaluatorAccess ? (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={savingRoleId === role.id}
                        onClick={() => toggleEvaluatorAccess(role.id, false)}
                      >
                        Disable
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        disabled={savingRoleId === role.id}
                        onClick={() => toggleEvaluatorAccess(role.id, true)}
                      >
                        Enable
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
