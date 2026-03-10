"use client";

import { Loader2, MoreHorizontal, ShieldMinus, ShieldPlus } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";

type Role = {
  id: string;
  name: string;
};

type DashboardUser = {
  id: string;
  name: string;
  username: string;
  email: string | null;
  isActive: boolean;
  roles: Role[];
};

export function UsersTable() {
  const [users, setUsers] = useState<DashboardUser[]>([]);
  const [allRoles, setAllRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [usersRes, rolesRes] = await Promise.all([
        fetch("/api/dashboard/users"),
        fetch("/api/dashboard/roles"),
      ]);

      if (usersRes.ok && rolesRes.ok) {
        const usersData = await usersRes.json();
        const rolesData = await rolesRes.json();
        setUsers(usersData);
        setAllRoles(rolesData);
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
      toast.error("Failed to load users data");
    } finally {
      setIsLoading(false);
    }
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: hmm
  useEffect(() => {
    fetchData();
  }, []);

  const assignRole = async (userId: string, roleId: string) => {
    try {
      const res = await fetch("/api/dashboard/user-roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dashboardUserId: userId, roleId }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to assign role");
      }

      toast.success("Role assigned successfully");
      fetchData(); // Refresh list to fetch exact roles
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to assign role",
      );
    }
  };

  const removeRole = async (userId: string, roleId: string) => {
    try {
      const res = await fetch(
        `/api/dashboard/user-roles?userId=${userId}&roleId=${roleId}`,
        {
          method: "DELETE",
        },
      );

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to remove role");
      }

      toast.success("Role removed successfully");
      fetchData();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to remove role",
      );
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Dashboard Users List</h3>
        <Button variant="outline" onClick={fetchData}>
          Refresh
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Assigned Roles</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  <Loader2 className="mr-2 inline-flex h-4 w-4 animate-spin" />
                  Loading users...
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  No users found.
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <p className="font-medium">{user.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {user.username} {user.email && `• ${user.email}`}
                    </p>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                          {user.isActive ? "Active" : "Inactive"}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() =>
                            fetch("/api/dashboard/status", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({
                                dashboardUserId: user.id,
                                isActive: !user.isActive,
                              }),
                            }).then((res) => {
                              if (res.ok) {
                                toast.success(
                                  `User ${
                                    !user.isActive ? "activated" : "deactivated"
                                  } successfully`,
                                );
                                fetchData();
                              } else {
                                toast.error("Failed to update user status");
                              }
                            })
                          }
                          className="cursor-pointer"
                        >
                          {user.isActive ? (
                            <>
                              <ShieldMinus className="mr-2 h-4 w-4" />
                              Deactivate
                            </>
                          ) : (
                            <>
                              <ShieldPlus className="mr-2 h-4 w-4" />
                              Activate
                            </>
                          )}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                  <TableCell className="max-w-[400px]">
                    <div className="flex flex-wrap gap-1">
                      {user.roles.length === 0 ? (
                        <span className="text-xs text-muted-foreground">
                          No roles assigned
                        </span>
                      ) : (
                        user.roles.map((role) => (
                          <Badge key={role.id} variant="secondary">
                            {role.name}
                          </Badge>
                        ))
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <div className="p-2 text-xs font-semibold uppercase text-muted-foreground">
                          Assign Role
                        </div>
                        {allRoles
                          .filter(
                            (r) =>
                              !user.roles.some(
                                (assigned) => assigned.id === r.id,
                              ),
                          )
                          .map((role) => (
                            <DropdownMenuItem
                              key={`assign-${role.id}`}
                              onClick={() => assignRole(user.id, role.id)}
                              className="cursor-pointer"
                            >
                              <ShieldPlus className="mr-2 h-4 w-4" />
                              {role.name}
                            </DropdownMenuItem>
                          ))}

                        {user.roles.length > 0 && (
                          <>
                            <div className="mt-2 p-2 text-xs font-semibold uppercase text-muted-foreground border-t">
                              Remove Role
                            </div>
                            {user.roles.map((role) => (
                              <DropdownMenuItem
                                key={`remove-${role.id}`}
                                onClick={() => removeRole(user.id, role.id)}
                                className="cursor-pointer text-destructive focus:text-destructive"
                              >
                                <ShieldMinus className="mr-2 h-4 w-4" />
                                {role.name}
                              </DropdownMenuItem>
                            ))}
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
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
