import { entropyToMnemonic, mnemonicToEntropy, stringToMnemonic } from "./bip39.js";

function isTauri(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

const STORAGE_KEY = "tpt-backup-key";
const CLIENT_NAME = "tpt-backup";
const STORE_KEY = "encryption-key";

export interface BackupKey {
  raw: Uint8Array;
  mnemonic: string[];
}

export async function generateBackupKey(): Promise<BackupKey> {
  const entropy = new Uint8Array(32);
  crypto.getRandomValues(entropy);
  const mnemonic = entropyToMnemonic(entropy);
  return { raw: entropy, mnemonic };
}

export async function storeBackupKey(key: Uint8Array): Promise<void> {
  if (isTauri()) {
    await storeKeyTauri(key);
  } else {
    await storeKeyWeb(key);
  }
}

export async function retrieveBackupKey(): Promise<Uint8Array | null> {
  if (isTauri()) {
    return retrieveKeyTauri();
  }
  return retrieveKeyWeb();
}

export async function hasBackupKey(): Promise<boolean> {
  if (isTauri()) {
    return hasKeyTauri();
  }
  return hasKeyWeb();
}

export async function storeKeyFromMnemonic(phrase: string): Promise<void> {
  const words = stringToMnemonic(phrase);
  const entropy = mnemonicToEntropy(words);
  await storeBackupKey(entropy);
}

// ─── Tauri (Stronghold Store) ───────────────────────────────────────────────

async function loadStronghold() {
  const { Stronghold } = await import("@tauri-apps/plugin-stronghold");
  const stronghold = await Stronghold.load(CLIENT_NAME, "tpt-backup-snapshot");
  const client = await stronghold.createClient(CLIENT_NAME);
  return { stronghold, store: client.getStore() };
}

async function storeKeyTauri(key: Uint8Array): Promise<void> {
  const { stronghold, store } = await loadStronghold();
  const keyBytes = Array.from(key);
  await store.insert(STORE_KEY, keyBytes);
  await stronghold.save();
}

async function retrieveKeyTauri(): Promise<Uint8Array | null> {
  try {
    const { store } = await loadStronghold();
    const value = await store.get(STORE_KEY);
    if (!value) return null;
    return new Uint8Array(value);
  } catch {
    return null;
  }
}

async function hasKeyTauri(): Promise<boolean> {
  try {
    const { store } = await loadStronghold();
    const value = await store.get(STORE_KEY);
    return value !== null;
  } catch {
    return false;
  }
}

// ─── Web (localStorage as fallback) ─────────────────────────────────────────

async function storeKeyWeb(key: Uint8Array): Promise<void> {
  const keyBase64 = uint8ToBase64(key);
  localStorage.setItem(STORAGE_KEY, keyBase64);
}

async function retrieveKeyWeb(): Promise<Uint8Array | null> {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return null;
  return base64ToUint8(stored);
}

async function hasKeyWeb(): Promise<boolean> {
  return localStorage.getItem(STORAGE_KEY) !== null;
}

// ─── Base64 helpers ──────────────────────────────────────────────────────────

function uint8ToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

function base64ToUint8(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}
