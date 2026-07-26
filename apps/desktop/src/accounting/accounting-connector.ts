// Copyright 2024 TPT Solutions Ltd. // SPDX-License-Identifier: Apache-2.0

/**
 * Pluggable accounting-software connector interface for the Financials module.
 * Each connector exports ledger entries (and optionally input/output prices) in
 * a format the target software can import. Connectors are registered in
 * `CONNECTORS` below — add a new entry to support additional providers.
 */

export interface LedgerEntry {
  id: string;
  type: "INCOME" | "EXPENSE";
  date: Date;
  amount: number;
  category: string | null;
  moduleId: string | null;
  description: string | null;
  notes: string | null;
}

export interface InputPrice {
  id: string;
  itemName: string;
  category: string | null;
  unit: string | null;
  costPerUnit: number;
  effectiveDate: Date;
}

export interface OutputPrice {
  id: string;
  itemName: string;
  category: string | null;
  unit: string | null;
  pricePerUnit: number;
  effectiveDate: Date;
}

export interface AccountingConnector {
  id: string;
  name: string;
  description: string;
  /** File extension for the exported file (e.g. "csv", "xlsx") */
  fileExtension: string;
  /** MIME type for the download blob */
  mimeType: string;
  /** Export ledger entries to a format the target software can import */
  exportLedger(
    farmName: string,
    entries: LedgerEntry[],
    fromDate: string,
    toDate: string,
  ): Blob;
  /** Export input/output prices (optional — not all connectors support this) */
  exportPrices?(
    farmName: string,
    inputPrices: InputPrice[],
    outputPrices: OutputPrice[],
  ): Blob;
}
