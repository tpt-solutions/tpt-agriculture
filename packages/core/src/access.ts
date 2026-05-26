import type { Subscription } from "@prisma/client";
import { db } from "./db.js";
import { BUNDLE_MODULES } from "./config/bundle-modules.js";

const cache = new Map<string, { moduleIds: string[]; cachedAt: number }>();
const CACHE_TTL_MS = 60_000;

/**
 * Returns the list of moduleIds accessible to the tenant based on their
 * active/trialing subscription. Returns [] if no active subscription.
 */
export async function getAccessibleModules(tenantId: string): Promise<string[]> {
  const cached = cache.get(tenantId);
  if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) return cached.moduleIds;

  const sub = await db.subscription.findFirst({
    where: { tenantId },
    orderBy: { createdAt: "desc" },
  });

  if (!sub || !isSubscriptionActive(sub)) {
    cache.set(tenantId, { moduleIds: [], cachedAt: Date.now() });
    return [];
  }

  const moduleIds = BUNDLE_MODULES[sub.bundleTier] ?? [];
  cache.set(tenantId, { moduleIds, cachedAt: Date.now() });
  return moduleIds;
}

/**
 * Throws a 402-style error if the tenant's active subscription does not
 * cover the requested moduleId.
 */
export async function assertModuleAccess(moduleId: string, tenantId: string): Promise<void> {
  const modules = await getAccessibleModules(tenantId);
  if (!modules.includes(moduleId)) {
    const err = new Error(`Module '${moduleId}' is not included in your current subscription`);
    (err as NodeJS.ErrnoException).code = "MODULE_NOT_LICENCED";
    throw err;
  }
}

/** Clears the cache entry for a tenant — call after a subscription change webhook. */
export function invalidateAccessCache(tenantId: string): void {
  cache.delete(tenantId);
}

export function isSubscriptionActive(sub: Pick<Subscription, "status" | "currentPeriodEnd">): boolean {
  if (sub.status !== "ACTIVE" && sub.status !== "TRIALING") return false;
  return sub.currentPeriodEnd > new Date();
}
