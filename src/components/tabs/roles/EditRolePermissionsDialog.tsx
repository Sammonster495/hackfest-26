"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Label } from "~/components/ui/label";

type Permission = {
  id: string;
  key: string;
  description: string | null;
};

type Role = {
  id: string;
  name: string;
  permissions: Permission[];
};

type EditRolePermissionsDialogProps = {
  role: Role | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPermissionsUpdated: () => void;
};

export function EditRolePermissionsDialog({
  role,
  open,
  onOpenChange,
  onPermissionsUpdated,
}: EditRolePermissionsDialogProps) {
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<
    Set<string>
  >(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);

  useEffect(() => {
    async function fetchPermissions() {
      setIsFetching(true);
      try {
        const res = await fetch("/api/dashboard/permissions");
        if (res.ok) {
          const data = await res.json();
          setAllPermissions(data);
        }
      } catch (error) {
        console.error("Failed to load permissions list:", error);
      } finally {
        setIsFetching(false);
      }
    }

    if (open) {
      fetchPermissions();
      if (role) {
        setSelectedPermissionIds(new Set(role.permissions.map((p) => p.id)));
      }
    }
  }, [open, role]);

  const handleToggle = (permissionId: string) => {
    setSelectedPermissionIds((prev) => {
      const next = new Set(prev);
      if (next.has(permissionId)) {
        next.delete(permissionId);
      } else {
        next.add(permissionId);
      }
      return next;
    });
  };

  const handleSave = async () => {
    if (!role) return;
    setIsLoading(true);

    try {
      const res = await fetch(`/api/dashboard/roles/${role.id}/permissions`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          permissionIds: Array.from(selectedPermissionIds),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to update permissions");
      }

      toast.success("Permissions updated successfully");
      onOpenChange(false);
      onPermissionsUpdated();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update permissions",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Permissions</DialogTitle>
          <DialogDescription>
            Grant or revoke permissions for the <strong>{role?.name}</strong>{" "}
            role.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 max-h-[60vh] overflow-y-auto">
          {isFetching ? (
            <div className="flex justify-center p-4">
              Loading permissions...
            </div>
          ) : allPermissions.length === 0 ? (
            <div className="text-muted-foreground text-center">
              No permissions available in the system.
            </div>
          ) : (
            <div className="grid gap-4">
              {allPermissions.map((permission) => (
                <div
                  key={permission.id}
                  className="flex items-start space-x-3 rounded-md border p-4 shadow-sm"
                >
                  <Checkbox
                    id={`permission-${permission.id}`}
                    checked={selectedPermissionIds.has(permission.id)}
                    onCheckedChange={() => handleToggle(permission.id)}
                  />
                  <div className="space-y-1 leading-none">
                    <Label
                      htmlFor={`permission-${permission.id}`}
                      className="font-medium cursor-pointer"
                    >
                      {permission.key}
                    </Label>
                    {permission.description && (
                      <p className="text-sm text-muted-foreground">
                        {permission.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isLoading || isFetching}>
            {isLoading ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
