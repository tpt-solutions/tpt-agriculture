export * from "./schema/index.js";
export type { DrizzleDb } from "./db-types.js";
export { getAccessibleModules, assertModuleAccess, canWrite } from "./access.js";
export { BUNDLE_MODULES, MODULE_REGISTRY } from "./config/index.js";
export type { ModuleMeta, ModuleCategory } from "./config/index.js";
export { getDb, setDb } from "./db.js";
