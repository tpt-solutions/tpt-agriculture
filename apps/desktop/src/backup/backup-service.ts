// Copyright 2024 TPT Solutions Ltd. // SPDX-License-Identifier: Apache-2.0
import { sql } from "drizzle-orm";
import { retrieveBackupKey } from "./keygen.js";
import { stringToMnemonic, mnemonicToEntropy } from "./bip39.js";

const BACKUP_API = "https://backup.tptsolutions.co.nz";

/**
 * Derive an HMAC token from the encryption key for API authentication.
 * Uses the first 16 bytes of the key hashed with SHA-256 for the HMAC secret.
 */
async function deriveHmacToken(farmId: string, key: Uint8Array): Promise<string> {
  // Import the key as a raw HMAC key
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    key.slice(0, 16), // Use first 16 bytes as HMAC secret
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  
  // Sign the farmId to create a token
  const sig = await crypto.subtle.sign("HMAC", cryptoKey, new TextEncoder().encode(farmId));
  const hashArray = Array.from(new Uint8Array(sig));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Create AES-GCM additional authenticated data from farmId.
 */
function createAad(farmId: string): ArrayBuffer {
  return new TextEncoder().encode(farmId).buffer;
}

// ─── Export / Encrypt ────────────────────────────────────────────────────────

export async function exportEncryptedBackup(farmId: string): Promise<Blob> {
  const db = await getDb();
  const allTables = [
    "farms",
    "fields", "plots", "crop_plans", "planting_tasks",
    "harvest_batches", "harvest_records", "chemicals", "spray_events",
    "vit_blocks", "vintage_records", "canopy_notes",
    "orchard_blocks", "tree_inventory", "orchard_harvest_bins",
    "veg_beds", "veg_successions",
    "microgreen_batches", "microgreen_trays",
    "structures", "climate_logs", "fertigation_events",
    "aqua_systems", "fish_stocks", "water_quality_logs", "aqua_feeding_events", "aqua_plant_yields",
    "dairy_cows", "dairy_milk_records", "dairy_health_events",
    "beef_mobs", "beef_weight_records", "beef_draftings",
    "sheep_flocks", "sheep_lambing_records", "sheep_drenching_records", "sheep_shearing_records",
    "goat_herds", "goat_milk_records", "goat_fibre_records",
    "deer_herds", "deer_velvet_records", "deer_venison_records",
    "pig_sows", "pig_litters", "pig_feed_records",
    "poultry_flocks", "poultry_egg_records", "poultry_mortality",
    "bee_hives", "bee_inspections", "bee_honey_harvests",
    "paddocks", "paddock_rotations", "pasture_cover_records",
    "custom_options",
    "ledger_entries", "input_prices", "output_prices",
    "soil_tests",
    "inventory_items", "inventory_movements",
    "equipment_assets",
    "compliance_checks",
    "staff_members",
  ];

  const snapshot: Record<string, unknown[]> = {};
  for (const table of allTables) {
    try {
      // Raw `db.all()` queries have no field metadata, so drizzle returns
      // positional arrays rather than column-keyed objects — look up the
      // column order via PRAGMA so the snapshot stores real column names
      // (needed for `importEncryptedBackup` to rebuild INSERT statements).
      const columnInfo = (await db.all(sql`PRAGMA table_info(${sql.identifier(table)})`)) as unknown[][];
      const columns = columnInfo.map((col) => String(col[1]));
      const rawRows = (await db.all(sql`SELECT * FROM ${sql.identifier(table)}`)) as unknown[][];
      snapshot[table] = rawRows.map((row) => Object.fromEntries(columns.map((c, i) => [c, row[i]])));
    } catch {
      snapshot[table] = [];
    }
  }

  const plaintext = new TextEncoder().encode(JSON.stringify(snapshot));
  const key = await retrieveBackupKey();
  if (!key) throw new Error("No encryption key found. Set up backup first.");

  const iv = crypto.getRandomValues(new Uint8Array(12));
  const aad = createAad(farmId);
  const cryptoKey = await importAesKey(key);
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv, additionalData: aad },
    cryptoKey,
    plaintext,
  );

  // Envelope format: version(1) + ivLen(1) + iv + ciphertext
  // (AAD itself is never stored — only used at encrypt/decrypt time, recomputed
  // from farmId on import — so no aadLen byte is needed in the header.)
  const envelope = new Uint8Array(1 + 1 + iv.length + encrypted.byteLength);
  envelope[0] = 1; // version
  envelope[1] = iv.length; // iv length
  envelope.set(iv, 2);
  envelope.set(new Uint8Array(encrypted), 2 + iv.length);

  return new Blob([envelope], { type: "application/octet-stream" });
}

// ─── Import / Decrypt ────────────────────────────────────────────────────────

export async function importEncryptedBackup(data: Uint8Array, passphrase: string, farmId: string): Promise<void> {
  const entropy = mnemonicToEntropy(stringToMnemonic(passphrase));
  const version = data[0];
  if (version !== 1) throw new Error(`Unsupported backup version: ${version}`);

  const ivLen = data[1];
  const iv = data.slice(2, 2 + ivLen);
  const ciphertext = data.slice(2 + ivLen);

  const aad = createAad(farmId);
  const cryptoKey = await importAesKey(entropy);
  
  let plaintext: ArrayBuffer;
  try {
    plaintext = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv, additionalData: aad },
      cryptoKey,
      ciphertext,
    );
  } catch (e) {
    throw new Error("Decryption failed. The backup may not belong to this farm.");
  }

  const snapshot: Record<string, unknown[]> = JSON.parse(
    new TextDecoder().decode(plaintext),
  );

  const db = await getDb();
  await db.transaction(async (tx) => {
    for (const [table, rows] of Object.entries(snapshot)) {
      if (!Array.isArray(rows)) continue;
      try {
        await tx.run(sql`DELETE FROM ${sql.identifier(table)}`);
        for (const row of rows) {
          const rowObj = row as Record<string, unknown>;
          const cols = Object.keys(rowObj);
          if (cols.length === 0) continue;
          const columnsSql = sql.join(cols.map((c) => sql.identifier(c)), sql.raw(", "));
          const valuesSql = sql.join(cols.map((c) => sql`${rowObj[c]}`), sql.raw(", "));
          await tx.run(sql`INSERT INTO ${sql.identifier(table)} (${columnsSql}) VALUES (${valuesSql})`);
        }
      } catch {
        // table may not exist in this schema version
      }
    }
  });
}

// ─── Upload to backup server ─────────────────────────────────────────────────

export async function uploadBackup(blob: Blob, farmId: string): Promise<{ backupId: string }> {
  const key = await retrieveBackupKey();
  if (!key) throw new Error("No encryption key found");
  
  const hmacToken = await deriveHmacToken(farmId, key);
  
  const formData = new FormData();
  formData.append("backup", blob, `backup-${farmId}-${Date.now()}.bin`);
  formData.append("farmId", farmId);

  const resp = await fetch(`${BACKUP_API}/upload`, {
    method: "POST",
    headers: {
      "Authorization": `HMAC ${hmacToken}`,
    },
    body: formData,
  });

  if (!resp.ok) throw new Error(`Upload failed: ${resp.statusText}`);
  return resp.json();
}

// ─── Download backup list ────────────────────────────────────────────────────

export async function listBackups(farmId: string): Promise<BackupMeta[]> {
  const key = await retrieveBackupKey();
  if (!key) throw new Error("No encryption key found");
  
  const hmacToken = await deriveHmacToken(farmId, key);
  
  const resp = await fetch(`${BACKUP_API}/list?farmId=${encodeURIComponent(farmId)}`, {
    headers: {
      "Authorization": `HMAC ${hmacToken}`,
    },
  });
  if (!resp.ok) throw new Error(`Failed to list backups: ${resp.statusText}`);
  return resp.json();
}

export async function downloadBackup(backupId: string): Promise<Blob> {
  const resp = await fetch(`${BACKUP_API}/download/${encodeURIComponent(backupId)}`);
  if (!resp.ok) throw new Error(`Download failed: ${resp.statusText}`);
  return resp.blob();
}

export interface BackupMeta {
  backupId: string;
  farmId: string;
  createdAt: string;
  sizeBytes: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function getDb() {
  const { getDb: coreGetDb } = await import("@tpt/core");
  return coreGetDb();
}

async function importAesKey(raw: Uint8Array): Promise<CryptoKey> {
  const keyBytes = raw.slice(0, 32);
  return crypto.subtle.importKey(
    "raw",
    keyBytes,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}