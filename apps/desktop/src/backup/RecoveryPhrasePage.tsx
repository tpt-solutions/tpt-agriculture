// Copyright 2024 TPT Solutions Ltd. // SPDX-License-Identifier: Apache-2.0
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Button } from "@tpt/ui";
import { generateBackupKey, storeBackupKey } from "./keygen.js";
import { mnemonicToString } from "./bip39.js";

export function RecoveryPhrasePage() {
  const navigate = useNavigate();
  const [words, setWords] = useState<string[]>([]);
  const [checked, setChecked] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    generateBackupKey().then((key) => {
      storeBackupKey(key.raw);
      setWords(key.mnemonic);
      setLoading(false);
    });
  }, []);

  async function handleCopy() {
    await navigator.clipboard.writeText(mnemonicToString(words));
  }

  function handleEmail() {
    const phrase = mnemonicToString(words);
    const subject = encodeURIComponent("TPT Agriculture — Recovery Phrase");
    const body = encodeURIComponent(
      `Keep this recovery phrase safe. It can restore your backup data.\n\n${phrase}\n\nDo NOT share this with anyone.`,
    );
    window.open(`mailto:?subject=${subject}&body=${body}`, "_blank");
  }

  function handleContinue() {
    navigate("/", { replace: true });
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-sm text-gray-500">Generating recovery phrase…</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-lg">
        <h1 className="mb-2 text-center text-2xl font-bold text-green-700">
          Save Your Recovery Phrase
        </h1>
        <p className="mb-6 text-center text-sm text-gray-500">
          This 24-word phrase is the only way to restore a backup. Write it down and keep it safe.
        </p>

        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 mb-4">
          <div className="grid grid-cols-3 gap-2 font-mono text-sm">
            {words.map((word, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <span className="w-5 text-right text-xs text-gray-400">{i + 1}.</span>
                <span className="text-gray-800">{word}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-2 mb-4">
          <Button variant="secondary" onClick={handleCopy}>
            Copy to Clipboard
          </Button>
          <Button variant="secondary" onClick={handleEmail}>
            Email to Myself
          </Button>
        </div>

        <label className="flex items-start gap-2 mb-4 cursor-pointer">
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-gray-300"
          />
          <span className="text-sm text-gray-700">
            I have saved my recovery phrase and understand it cannot be recovered if lost.
          </span>
        </label>

        <Button
          disabled={!checked}
          onClick={handleContinue}
          className="w-full"
        >
          Continue to Dashboard
        </Button>
      </div>
    </div>
  );
}

