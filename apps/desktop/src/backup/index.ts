// Copyright 2024 TPT Solutions Ltd. // SPDX-License-Identifier: Apache-2.0
export { generateBackupKey, storeBackupKey, retrieveBackupKey, hasBackupKey, storeKeyFromMnemonic } from "./keygen.js";
export type { BackupKey } from "./keygen.js";
export { entropyToMnemonic, mnemonicToEntropy, mnemonicToString, stringToMnemonic } from "./bip39.js";
export { exportEncryptedBackup, importEncryptedBackup, uploadBackup, listBackups, downloadBackup } from "./backup-service.js";
export type { BackupMeta } from "./backup-service.js";

