/**
 * Parse a CSV string into an array of objects, using the first row as headers.
 * Handles quoted fields, escaped quotes, and CRLF line endings.
 */
export function parseCsv(text: string): Record<string, string>[] {
  const rows = splitCsvRows(text);
  if (rows.length < 2) return [];
  const headers = rows[0];
  return rows.slice(1).map((cells) => {
    const obj: Record<string, string> = {};
    for (let i = 0; i < headers.length; i++) {
      obj[headers[i]] = cells[i] ?? "";
    }
    return obj;
  });
}

function splitCsvRows(text: string): string[][] {
  const rows: string[][] = [];
  let current: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        current.push(field);
        field = "";
      } else if (ch === "\r") {
        // skip
      } else if (ch === "\n") {
        current.push(field);
        field = "";
        rows.push(current);
        current = [];
      } else {
        field += ch;
      }
    }
  }
  // flush last field/row
  current.push(field);
  if (current.length > 1 || current[0] !== "") {
    rows.push(current);
  }
  return rows;
}

/**
 * Attempt to match CSV headers to form field keys by normalising both sides.
 * Returns a map of formFieldKey → csvHeader.
 */
export function autoMapHeaders(
  csvHeaders: string[],
  formFieldKeys: string[],
): Record<string, string> {
  const normalise = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
  const mapping: Record<string, string> = {};
  const used = new Set<string>();

  for (const key of formFieldKeys) {
    const nk = normalise(key);
    // exact match first
    const exact = csvHeaders.find((h) => normalise(h) === nk && !used.has(h));
    if (exact) {
      mapping[key] = exact;
      used.add(exact);
      continue;
    }
    // contains match
    const contains = csvHeaders.find(
      (h) => (normalise(h).includes(nk) || nk.includes(normalise(h))) && !used.has(h),
    );
    if (contains) {
      mapping[key] = contains;
      used.add(contains);
    }
  }
  return mapping;
}
