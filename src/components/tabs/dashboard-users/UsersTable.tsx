"use client";

import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  MoreHorizontal,
  Search,
  ShieldMinus,
  ShieldPlus,
} from "lucide-react";
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
import { Input } from "~/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
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

  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      u.name.toLowerCase().includes(q) ||
      u.username.toLowerCase().includes(q) ||
      (u.email?.toLowerCase() || "").includes(q);

    const matchesRole =
      roleFilter === "all" || u.roles.some((r) => r.id === roleFilter);

    return matchesSearch && matchesRole;
  });

  useEffect(() => {
    setCurrentPage(1);
  }, []);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize));
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

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
    const roleToAdd = allRoles.find((r) => r.id === roleId);
    if (!roleToAdd) return;

    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId && !u.roles.some((r) => r.id === roleId)) {
          return { ...u, roles: [...u.roles, roleToAdd] };
        }
        return u;
      }),
    );

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
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to assign role",
      );
      fetchData();
    }
  };

  const removeRole = async (userId: string, roleId: string) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          return { ...u, roles: u.roles.filter((r) => r.id !== roleId) };
        }
        return u;
      }),
    );

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
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to remove role",
      );
      fetchData();
    }
  };

  const toggleStatus = async (user: DashboardUser) => {
    setUsers((prev) =>
      prev.map((u) =>
        u.id === user.id ? { ...u, isActive: !user.isActive } : u,
      ),
    );

    try {
      const res = await fetch("/api/dashboard/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dashboardUserId: user.id,
          isActive: !user.isActive,
        }),
      });

      if (res.ok) {
        toast.success(
          `User ${!user.isActive ? "activated" : "deactivated"} successfully`,
        );
      } else {
        throw new Error("Failed to update user status");
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update user status",
      );
      fetchData();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-4">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search by name, username, or email..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              {allRoles.map((role) => (
                <SelectItem key={role.id} value={role.id}>
                  {role.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
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
              paginatedUsers.map((user) => (
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
                          onClick={() => toggleStatus(user)}
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

      {filteredUsers.length > 0 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <span>Rows per page</span>
            <Select
              value={pageSize.toString()}
              onValueChange={(v) => {
                setPageSize(Number(v));
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="h-8 w-[70px] text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <span>
              Page {currentPage} of {totalPages} ({filteredUsers.length} rows)
            </span>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
