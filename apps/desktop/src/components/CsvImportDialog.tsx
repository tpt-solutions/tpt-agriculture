import { useState, useRef, useCallback } from "react";
import { Button, Select } from "@tpt/ui";
import { parseCsv, autoMapHeaders } from "../utils/csv-import.js";
import type { FormFieldDef } from "../modules/module-adapter.js";

interface Props {
  open: boolean;
  onClose: () => void;
  onImport: (rows: Record<string, unknown>[]) => void;
  formFields: FormFieldDef[];
  label: string;
}

export function CsvImportDialog({ open, onClose, onImport, formFields, label }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<"pick" | "map" | "preview">("pick");
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvRows, setCsvRows] = useState<Record<string, string>[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});

  const reset = useCallback(() => {
    setStep("pick");
    setCsvHeaders([]);
    setCsvRows([]);
    setMapping({});
  }, []);

  const handleClose = useCallback(() => {
    reset();
    onClose();
  }, [reset, onClose]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result);
      const rows = parseCsv(text);
      if (rows.length === 0) return;
      const headers = Object.keys(rows[0]);
      setCsvHeaders(headers);
      setCsvRows(rows);
      setMapping(autoMapHeaders(headers, formFields.map((f) => f.key)));
      setStep("map");
    };
    reader.readAsText(file);
    // reset the input so re-selecting the same file triggers change
    e.target.value = "";
  }

  function handleImport() {
    const results: Record<string, unknown>[] = [];
    const fieldMap = new Map(formFields.map((f) => [f.key, f]));
    for (const row of csvRows) {
      const out: Record<string, unknown> = {};
      for (const [fieldKey, csvHeader] of Object.entries(mapping)) {
        if (!csvHeader) continue;
        const raw = row[csvHeader];
        if (raw === undefined || raw === "") continue;
        const field = fieldMap.get(fieldKey);
        if (!field) continue;
        if (field.type === "number") {
          out[fieldKey] = Number(raw) || 0;
        } else if (field.type === "date") {
          out[fieldKey] = new Date(raw);
        } else if (field.type === "select" && field.boolean) {
          out[fieldKey] = raw.toLowerCase() === "true" || raw === "1";
        } else {
          out[fieldKey] = raw;
        }
      }
      results.push(out);
    }
    onImport(results);
    handleClose();
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-lg rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
          <h3 className="text-sm font-semibold text-gray-800">Import CSV — {label}</h3>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">&times;</button>
        </div>

        {step === "pick" && (
          <div className="p-4">
            <p className="mb-3 text-sm text-gray-600">Select a CSV file to import. The first row should contain column headers.</p>
            <input ref={fileRef} type="file" accept=".csv" onChange={handleFileChange} className="hidden" />
            <Button onClick={() => fileRef.current?.click()}>Choose CSV File</Button>
          </div>
        )}

        {step === "map" && (
          <div className="p-4">
            <p className="mb-3 text-sm text-gray-600">
              Map CSV columns to {label.toLowerCase()} fields. Found {csvRows.length} rows.
            </p>
            <div className="max-h-64 space-y-2 overflow-y-auto">
              {formFields.map((field) => (
                <div key={field.key} className="flex items-center gap-2">
                  <label className="w-40 shrink-0 text-xs font-medium text-gray-600">
                    {field.label}{field.required ? " *" : ""}
                  </label>
                  <Select
                    value={mapping[field.key] ?? ""}
                    onChange={(e) => setMapping((m) => ({ ...m, [field.key]: e.target.value }))}
                    options={[{ value: "", label: "(skip)" }, ...csvHeaders.map((h) => ({ value: h, label: h }))]}
                  />
                </div>
              ))}
            </div>
            <div className="mt-4 flex gap-2">
              <Button onClick={handleImport} loading={false}>Import {csvRows.length} Rows</Button>
              <Button variant="secondary" onClick={reset}>Back</Button>
              <Button variant="secondary" onClick={handleClose}>Cancel</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
