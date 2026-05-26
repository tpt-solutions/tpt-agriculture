export { db } from "./db.js";
export { createServerSupabaseClient, createAdminSupabaseClient, createBrowserSupabaseClient } from "./supabase/index.js";
export { getAccessibleModules, assertModuleAccess, invalidateAccessCache, isSubscriptionActive } from "./access.js";
export { BUNDLE_MODULES, MODULE_REGISTRY } from "./config/index.js";
export type { ModuleMeta, ModuleCategory } from "./config/index.js";
