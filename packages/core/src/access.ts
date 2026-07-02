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
