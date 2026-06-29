import type { FarmRole } from "./schema/farm.js";

const WRITE_ROLES: FarmRole[] = ["OWNER", "ADMIN", "MEMBER"];
const ADMIN_ROLES: FarmRole[] = ["OWNER", "ADMIN"];

/**
 * Returns the moduleIds accessible to this user based on their role.
 * All modules are accessible to OWNER, ADMIN, MEMBER. READONLY gets read-only access.
 * The BUNDLE_MODULES mapping is used only for feature-gating (e.g. hiding modules the
 * farm hasn't set up yet), not for licensing.
 */
export function getAccessibleModules(role: FarmRole, enabledModuleIds: string[]): string[] {
  if (role === "READONLY" || WRITE_ROLES.includes(role)) {
    return enabledModuleIds;
  }
  return [];
}

/**
 * Throws if the module is not in the farm's enabled module list.
 */
export function assertModuleAccess(moduleId: string, enabledModuleIds: string[]): void {
  if (!enabledModuleIds.includes(moduleId)) {
    const err = new Error(`Module '${moduleId}' is not enabled for this farm`);
    (err as NodeJS.ErrnoException).code = "MODULE_NOT_ENABLED";
    throw err;
  }
}

/** Returns true if the role can create/edit/delete records. */
export function canWrite(role: FarmRole): boolean {
  return WRITE_ROLES.includes(role);
}

/** Returns true if the role can manage users and farm settings. */
export function canAdmin(role: FarmRole): boolean {
  return ADMIN_ROLES.includes(role);
}
