import { chemicals } from "./schema/index.js";
import { STANDARD_CHEMICALS } from "./chemical-seed-data.js";
import type { DrizzleDb } from "./db-types.js";
import { eq } from "drizzle-orm";

/** Inserts the standard chemical list for a farm, skipping names that already
 * exist so this is safe to call more than once (new farm setup, or the
 * "Load standard chemical list" button on an existing farm). */
export async function seedStandardChemicals(db: DrizzleDb, farmId: string): Promise<number> {
  const existing = await db.select({ name: chemicals.name }).from(chemicals).where(eq(chemicals.farmId, farmId));
  const existingNames = new Set(existing.map((r) => r.name.toLowerCase()));

  const toInsert = STANDARD_CHEMICALS.filter((c) => !existingNames.has(c.name.toLowerCase()));
  if (toInsert.length === 0) return 0;

  await db.insert(chemicals).values(
    toInsert.map((c) => ({
      farmId,
      name: c.name,
      activeIngredient: c.activeIngredient,
    }))
  );
  return toInsert.length;
}
