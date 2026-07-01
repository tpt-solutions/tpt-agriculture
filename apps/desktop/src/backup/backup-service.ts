// Copyright 2024 TPT Solutions Ltd. // SPDX-License-Identifier: Apache-2.0
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
    "users", "sessions", "farms", "farm_users",
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
  ];

  const snapshot: Record<string, unknown[]> = {};
  for (const table of allTables) {
    try {
      const rows = await db.all(`SELECT * FROM "${table}"`);
      snapshot[table] = rows;
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

  // Envelope format: version(1) + aadLen(1) + ivLen(1) + iv + ciphertext
  const envelope = new Uint8Array(1 + 1 + 1 + iv.length + encrypted.byteLength);
  envelope[0] = 1; // version
  envelope[1] = aad.byteLength; // aad length
  envelope[2] = iv.length; // iv length
  envelope.set(iv, 4);
  envelope.set(new Uint8Array(encrypted), 4 + iv.length);

  return new Blob([envelope], { type: "application/octet-stream" });
}

// ─── Import / Decrypt ────────────────────────────────────────────────────────

export async function importEncryptedBackup(data: Uint8Array, passphrase: string, farmId: string): Promise<void> {
  const entropy = mnemonicToEntropy(stringToMnemonic(passphrase));
  const version = data[0];
  if (version !== 1) throw new Error(`Unsupported backup version: ${version}`);

  const aadLen = data[1]; // AAD length (currently unused but reserved)
  const ivLen = data[2];
  const iv = data.slice(3 + aadLen, 3 + aadLen + ivLen);
  const ciphertext = data.slice(3 + aadLen + ivLen);

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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawDb = db as any;
  for (const [table, rows] of Object.entries(snapshot)) {
    if (!Array.isArray(rows) || rows.length === 0) continue;
    try {
      await rawDb.run(`DELETE FROM "${table}"`);
      for (const row of rows) {
        const rowObj = row as Record<string, unknown>;
        const cols = Object.keys(rowObj);
        const placeholders = cols.map(() => "?").join(", ");
        const values = cols.map((c) => rowObj[c]);
        await rawDb.run(
          `INSERT INTO "${table}" (${cols.map((c) => `"${c}"`).join(", ")}) VALUES (${placeholders})`,
          values,
        );
      }
    } catch {
      // table may not exist or may be empty
    }
  }
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