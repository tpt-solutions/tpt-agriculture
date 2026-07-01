// Copyright 2024 TPT Solutions Ltd. // SPDX-License-Identifier: Apache-2.0
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardShell } from "@tpt/ui";
import { Button } from "@tpt/ui";
import { Input } from "@tpt/ui";
import { FormField } from "@tpt/ui";
import { toast } from "sonner";
import { useAuth } from "../auth/AuthContext.js";
import { verifyPassword } from "../auth/auth-service.js";
import { retrieveBackupKey } from "../backup/keygen.js";
import { entropyToMnemonic, mnemonicToString } from "../backup/bip39.js";
import { exportEncryptedBackup, uploadBackup, listBackups } from "../backup/backup-service.js";

export function SettingsBackupPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [phraseWords, setPhraseWords] = useState("");
  const [password, setPassword] = useState("");
  const [passError, setPassError] = useState("");

  const { data: backups = [], isLoading: backupsLoading } = useQuery({
    queryKey: ["backups", user?.farmId],
    queryFn: () => listBackups(user!.farmId),
    enabled: !!user,
  });

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not logged in");
      const blob = await exportEncryptedBackup(user.farmId);
      return uploadBackup(blob, user.farmId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["backups", user?.farmId] });
      toast.success("Backup uploaded successfully");
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Backup upload failed");
    },
  });

  async function handleViewPhrase(e: React.FormEvent) {
    e.preventDefault();
    setPassError("");
    setPhraseWords("");

    if (!user) {
      setPassError("Not logged in.");
      return;
    }

    const valid = await verifyPassword(user.email, password);
    if (!valid) {
      setPassError("Incorrect password.");
      return;
    }

    try {
      const key = await retrieveBackupKey();
      if (!key) {
        setPassError("No recovery phrase found.");
        return;
      }
      const words = entropyToMnemonic(key);
      setPhraseWords(mnemonicToString(words));
    } catch {
      setPassError("Failed to retrieve recovery phrase.");
    }
  }

  if (user?.role !== "OWNER") {
    return (
      <DashboardShell title="Backup">
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <p className="text-sm text-gray-500">Only the farm owner can manage backups.</p>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell title="Backup">
      <div className="flex flex-col gap-6">
        <div className="max-w-lg rounded-lg border border-gray-200 bg-white p-6">
          <h3 className="mb-3 text-sm font-semibold text-gray-700">Recovery Phrase</h3>
          <p className="mb-4 text-xs text-gray-500">
            Your recovery phrase can restore encrypted backups. Keep it in a safe place.
          </p>

          {phraseWords ? (
            <div className="rounded border border-green-200 bg-green-50 p-3 font-mono text-sm text-gray-800">
              {phraseWords}
            </div>
          ) : (
            <form onSubmit={handleViewPhrase} className="flex flex-col gap-3">
              <FormField label="Enter your password to view" error={passError || undefined}>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  required
                />
              </FormField>
              <Button type="submit" variant="secondary" size="sm">
                Reveal Recovery Phrase
              </Button>
            </form>
          )}
        </div>

        <div className="max-w-lg rounded-lg border border-gray-200 bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-700">Cloud Backups</h3>
            <Button
              size="sm"
              onClick={() => uploadMutation.mutate()}
              loading={uploadMutation.isPending}
            >
              + Backup Now
            </Button>
          </div>
          <p className="mb-4 text-xs text-gray-500">
            Backups are encrypted with your recovery phrase before upload.
          </p>

          {backupsLoading ? (
            <p className="text-xs text-gray-400">Loading…</p>
          ) : backups.length === 0 ? (
            <p className="text-xs text-gray-400">No backups yet.</p>
          ) : (
            <div className="overflow-x-auto rounded border border-gray-200">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-gray-200 bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 font-medium text-gray-600">Date</th>
                    <th className="px-3 py-2 font-medium text-gray-600">Size</th>
                    <th className="px-3 py-2 font-medium text-gray-600">ID</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {backups.map((b) => (
                    <tr key={b.backupId}>
                      <td className="px-3 py-2 text-gray-700">
                        {new Date(b.createdAt).toLocaleString()}
                      </td>
                      <td className="px-3 py-2 text-gray-500">
                        {(b.sizeBytes / 1024).toFixed(1)} KB
                      </td>
                      <td className="px-3 py-2 font-mono text-gray-400">
                        {b.backupId.slice(0, 8)}…
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}