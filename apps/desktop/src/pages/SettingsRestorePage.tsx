// Copyright 2024 TPT Solutions Ltd. // SPDX-License-Identifier: Apache-2.0
import { useRef, useState } from "react";
import { useNavigate } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { DashboardShell } from "@tpt/ui";
import { Button } from "@tpt/ui";
import { FormField } from "@tpt/ui";
import { toast } from "sonner";
import { useAuth } from "../auth/AuthContext.js";
import { importEncryptedBackup, listBackups, downloadBackup } from "../backup/backup-service.js";

export function SettingsRestorePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [passphrase, setPassphrase] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { data: backups = [] } = useQuery({
    queryKey: ["backups", user?.farmId],
    queryFn: () => listBackups(user!.farmId),
    enabled: !!user,
  });

  // Validate BIP39 phrase format before attempting restore
  function validatePhrase(phrase: string): boolean {
    const words = phrase.trim().split(/\s+/);
    if (words.length !== 24) {
      throw new Error("Recovery phrase must have exactly 24 words");
    }
    // Additional validation is done in stringToMnemonic which checks for valid BIP39 words
    return true;
  }

  async function handleRestore(file: File | null, cloudBackupId?: string) {
    setError("");
    setLoading(true);

    try {
      // Validate the recovery phrase before attempting restore
      validatePhrase(passphrase);

      let data: Uint8Array;

      if (cloudBackupId) {
        const blob = await downloadBackup(cloudBackupId);
        data = new Uint8Array(await blob.arrayBuffer());
      } else if (file) {
        data = new Uint8Array(await file.arrayBuffer());
      } else {
        setError("Select a backup file or cloud backup.");
        setLoading(false);
        return;
      }

      // Import backup with farmId as AAD for security
      await importEncryptedBackup(data, passphrase, user!.farmId);
      toast.success("Backup restored successfully");
      navigate("/", { replace: true });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Restore failed. Check your recovery phrase.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleRestore(file);
  }

  if (user?.role !== "OWNER") {
    return (
      <DashboardShell title="Restore">
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <p className="text-sm text-gray-500">Only the farm owner can restore backups.</p>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell title="Restore Backup">
      <div className="flex flex-col gap-6 max-w-lg">
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h3 className="mb-3 text-sm font-semibold text-gray-700">Recovery Phrase</h3>
          <FormField label="Enter your 24-word recovery phrase" error={error || undefined}>
            <textarea
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500"
              rows={3}
              value={passphrase}
              onChange={(e) => setPassphrase(e.target.value)}
              placeholder="word1 word2 word3 …"
            />
          </FormField>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h3 className="mb-3 text-sm font-semibold text-gray-700">Restore from File</h3>
          <p className="mb-3 text-xs text-gray-500">Import a .bin backup file from your device.</p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".bin"
            className="hidden"
            onChange={handleFileChange}
          />
          <Button
            variant="secondary"
            onClick={() => fileInputRef.current?.click()}
            disabled={!passphrase}
          >
            Choose File
          </Button>
        </div>

        {backups.length > 0 && (
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h3 className="mb-3 text-sm font-semibold text-gray-700">Cloud Backups</h3>
            <div className="flex flex-col gap-2">
              {backups.map((b) => (
                <div key={b.backupId} className="flex items-center justify-between rounded border border-gray-100 p-3">
                  <div>
                    <p className="text-sm text-gray-700">
                      {new Date(b.createdAt).toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-400">
                      {(b.sizeBytes / 1024).toFixed(1)} KB
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    loading={loading}
                    disabled={!passphrase}
                    onClick={() => handleRestore(null, b.backupId)}
                  >
                    Restore
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}