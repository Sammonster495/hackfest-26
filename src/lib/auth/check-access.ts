import { auth } from "~/auth/dashboard-config";
import { SYSTEM_ROLES } from "~/lib/validation/role";

export async function requireAdmin() {
    const session = await auth();

    if (!session?.dashboardUser) {
        throw new Error("Unauthorized: Not logged in");
    }

    const hasAdminRole = session.dashboardUser.roles.some(
        (role) => role.name === SYSTEM_ROLES.ADMIN
    );

    if (!hasAdminRole) {
        throw new Error("Unauthorized: ADMIN role required");
    }

    return session.dashboardUser;
}

export function isAdmin(dashboardUser: {
    roles: Array<{ name: string }>;
}): boolean {
    return dashboardUser.roles.some((role) => role.name === SYSTEM_ROLES.ADMIN);
}

export async function requireRole(roleName: string) {
    const session = await auth();

    if (!session?.dashboardUser) {
        throw new Error("Unauthorized: Not logged in");
    }
    const hasRole = session.dashboardUser.roles.some(
        (role) => role.name === roleName
    );

    if (!hasRole) {
        throw new Error(`Unauthorized: ${roleName} role required`);
    }

    return session.dashboardUser;
}

export async function hasPermission(
    permissionKey: string | RegExp
): Promise<boolean> {
    const session = await auth();

    if (!session?.dashboardUser) {
        return false;
    }

    const { dashboardUser } = session;
    if (isAdmin(dashboardUser)) {
        return true;
    }

    const matchesPermission = (key: string): boolean => {
        if (permissionKey instanceof RegExp) {
            return permissionKey.test(key);
        }
        return key === permissionKey;
    };

    for (const role of dashboardUser.roles) {
        if (role.permissions.some((perm) => matchesPermission(perm.key))) {
            return true;
        }
    }
    return false;
}
