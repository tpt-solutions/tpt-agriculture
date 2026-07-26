// Copyright 2024 TPT Solutions Ltd. // SPDX-License-Identifier: Apache-2.0
import type { AccountingConnector } from "./accounting-connector.js";

/**
 * Xero CSV connector — exports ledger entries as a CSV compatible with
 * Xero's "Manual Journal" import format. This avoids the complexity of
 * OAuth2 API integration while still giving farmers a direct path to get
 * their TPT Agriculture financial data into Xero.
 *
 * Xero's Manual Journal CSV columns:
 *   Journal Date, Journal Description, Line Amount, Account Code, Tax Rate, Tracking, Reference
 *
 * Reference: https://developer.xero.com/documentation/guides/manage-accounting/xero-csv/
 */

function escapeCsv(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function formatDate(d: Date): string {
  return `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1).toString().padStart(2, "0")}/${d.getFullYear()}`;
}

function buildCsv(headers: string[], rows: string[][]): string {
  const lines = [headers.map(escapeCsv).join(",")];
  for (const row of rows) {
    lines.push(row.map(escapeCsv).join(","));
  }
  return lines.join("\r\n");
}

/**
 * Maps TPT Agriculture ledger categories to Xero account codes.
 * These are common NZ/AU defaults — farmers may need to adjust
 * to match their own Xero chart of accounts.
 */
const CATEGORY_TO_ACCOUNT: Record<string, string> = {
  "Feed": "310",
  "Chemical": "310",
  "Seed": "310",
  "Fertiliser": "310",
  "Fuel": "310",
  "Labour": "400",
  "Sales": "200",
  "Repairs & Maintenance": "420",
  "Other": "310",
};

function resolveAccountCode(category: string | null, type: string): string {
  if (category && CATEGORY_TO_ACCOUNT[category]) {
    return CATEGORY_TO_ACCOUNT[category];
  }
  return type === "INCOME" ? "200" : "310";
}

export const xeroConnector: AccountingConnector = {
  id: "xero",
  name: "Xero",
  description: "Export as Xero-compatible Manual Journal CSV",
  fileExtension: "csv",
  mimeType: "text/csv;charset=utf-8",

  exportLedger(farmName, entries) {
    const headers = [
      "Journal Date",
      "Journal Description",
      "Line Amount",
      "Account Code",
      "Tax Rate",
      "Tracking Category",
      "Reference",
    ];

    const rows = entries.map((entry) => [
      formatDate(entry.date),
      entry.description || entry.category || `${entry.type} — ${farmName}`,
      (entry.type === "EXPENSE" ? -entry.amount : entry.amount).toFixed(2),
      resolveAccountCode(entry.category, entry.type),
      "No Tax",
      entry.moduleId ?? "",
      entry.id,
    ]);

    const csv = buildCsv(headers, rows);
    // UTF-8 BOM for Excel compatibility
    return new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
  },
};

/**
 * MYOB connector — exports as CSV compatible with MYOB's "Journal" import.
 * Placeholder for future implementation.
 */
export const myobConnector: AccountingConnector = {
  id: "myob",
  name: "MYOB",
  description: "Export as MYOB-compatible Journal CSV (coming soon)",
  fileExtension: "csv",
  mimeType: "text/csv;charset=utf-8",

  exportLedger(farmName, entries) {
    const headers = [
      "Date",
      "Description",
      "Debit",
      "Credit",
      "Account",
      "Tax Code",
      "Source Journal",
    ];

    const rows = entries.map((entry) => [
      formatDate(entry.date),
      entry.description || entry.category || `${entry.type} — ${farmName}`,
      entry.type === "INCOME" ? entry.amount.toFixed(2) : "",
      entry.type === "EXPENSE" ? entry.amount.toFixed(2) : "",
      resolveAccountCode(entry.category, entry.type),
      "N-T",
      "GEN",
    ]);

    const csv = buildCsv(headers, rows);
    return new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
  },
};

export const CONNECTORS: AccountingConnector[] = [xeroConnector, myobConnector];
