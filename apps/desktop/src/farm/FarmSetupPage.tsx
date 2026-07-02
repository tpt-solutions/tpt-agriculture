// Copyright 2024 TPT Solutions Ltd. // SPDX-License-Identifier: Apache-2.0
import type { FormEvent } from "react";
import { useState } from "react";
import { useNavigate } from "react-router";
import { getDb } from "@tpt/core";
import { farms } from "@tpt/core/schema";
import { generateBackupKey, storeBackupKey } from "../backup/keygen.js";
import { useFarm } from "./FarmContext.js";
import { ModulePicker } from "../modules/ModulePicker.js";
import { Button } from "@tpt/ui";
import { Input } from "@tpt/ui";
import { FormField } from "@tpt/ui";

export function FarmSetupPage() {
  const navigate = useNavigate();
  const { refresh } = useFarm();
  const [step, setStep] = useState<"name" | "modules">("name");
  const [farmName, setFarmName] = useState("");
  const [enabledModuleIds, setEnabledModuleIds] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleNameSubmit(e: FormEvent) {
    e.preventDefault();
    setStep("modules");
  }

  async function handleModulesSubmit() {
    setError("");
    setLoading(true);
    try {
      const db = await getDb();
      const now = new Date();
      await db.insert(farms).values({
        id: crypto.randomUUID(),
        name: farmName,
        settingsJson: { enabledModuleIds },
        createdAt: now,
        updatedAt: now,
      });
      await refresh();

      const key = await generateBackupKey();
      await storeBackupKey(key.raw);

      navigate("/recovery-phrase", { replace: true });
    } catch (err: any) {
      setError(err.message ?? "Setup failed");
    } finally {
      setLoading(false);
    }
  }

  if (step === "modules") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-8">
        <div className="w-full max-w-2xl">
          <h1 className="mb-2 text-center text-2xl font-bold text-green-700">
            TPT Agriculture
          </h1>
          <p className="mb-8 text-center text-sm text-gray-500">
            Which parts of the farm do you want to track? You can change this later in Settings.
          </p>
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            {error && (
              <div className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}

            <ModulePicker selected={enabledModuleIds} onChange={setEnabledModuleIds} />

            <div className="mt-4 flex gap-2">
              <Button
                type="button"
                disabled={loading || enabledModuleIds.length === 0}
                onClick={handleModulesSubmit}
              >
                {loading ? "Setting up…" : "Continue"}
              </Button>
              <Button type="button" variant="secondary" onClick={() => setStep("name")}>
                Back
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <h1 className="mb-2 text-center text-2xl font-bold text-green-700">
          TPT Agriculture
        </h1>
        <p className="mb-8 text-center text-sm text-gray-500">
          Set up your farm to get started
        </p>
        <form
          onSubmit={handleNameSubmit}
          className="flex flex-col gap-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
        >
          <h2 className="text-lg font-semibold text-gray-800">
            Name your farm
          </h2>

          <FormField label="Farm name" error={undefined}>
            <Input
              value={farmName}
              onChange={(e) => setFarmName(e.target.value)}
              required
              placeholder="e.g. Sunrise Pastures"
              autoFocus
            />
          </FormField>

          <Button type="submit">Continue</Button>
        </form>
      </div>
    </div>
  );
}
