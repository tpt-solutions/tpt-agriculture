import { retrieveBackupKey } from "./keygen.js";
import { stringToMnemonic, mnemonicToEntropy } from "./bip39.js";

const BACKUP_API = "https://backup.tptsolutions.co.nz";

// ─── Export / Encrypt ────────────────────────────────────────────────────────

export async function exportEncryptedBackup(_farmId: string): Promise<Blob> {
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
  const cryptoKey = await importAesKey(key);
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    cryptoKey,
    plaintext,
  );

  const envelope = new Uint8Array(4 + iv.length + encrypted.byteLength);
  envelope[0] = 1; // version
  envelope[1] = iv.length;
  envelope.set(iv, 4);
  envelope.set(new Uint8Array(encrypted), 4 + iv.length);

  return new Blob([envelope], { type: "application/octet-stream" });
}

// ─── Import / Decrypt ────────────────────────────────────────────────────────

export async function importEncryptedBackup(data: Uint8Array, passphrase: string): Promise<void> {
  const entropy = mnemonicToEntropy(stringToMnemonic(passphrase));
  const version = data[0];
  if (version !== 1) throw new Error(`Unsupported backup version: ${version}`);

  const ivLen = data[1];
  const iv = data.slice(4, 4 + ivLen);
  const ciphertext = data.slice(4 + ivLen);

  const cryptoKey = await importAesKey(entropy);
  const plaintext = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    cryptoKey,
    ciphertext,
  );

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
  const formData = new FormData();
  formData.append("backup", blob, `backup-${farmId}-${Date.now()}.bin`);
  formData.append("farmId", farmId);

  const resp = await fetch(`${BACKUP_API}/upload`, {
    method: "POST",
    body: formData,
  });

  if (!resp.ok) throw new Error(`Upload failed: ${resp.statusText}`);
  return resp.json();
}

// ─── Download backup list ────────────────────────────────────────────────────

export async function listBackups(farmId: string): Promise<BackupMeta[]> {
  const resp = await fetch(`${BACKUP_API}/list?farmId=${encodeURIComponent(farmId)}`);
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
