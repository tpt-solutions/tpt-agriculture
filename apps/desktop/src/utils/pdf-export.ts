// Copyright 2024 TPT Solutions Ltd. // SPDX-License-Identifier: Apache-2.0
/**
 * Minimal client-side PDF generator for chemical register reports.
 * Uses raw PDF primitives — no external dependencies required.
 */

function escapePdf(str: string): string {
  return str.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

interface PdfRow {
  cells: string[];
}

export function generateChemicalRegisterPdf(
  farmName: string,
  columns: string[],
  rows: PdfRow[]
): Uint8Array {
  const lines: string[] = [];
  let objectCount = 0;

  function addObj(content: string): number {
    objectCount++;
    lines.push(`${objectCount} 0 obj`);
    lines.push(content);
    lines.push("endobj");
    return objectCount;
  }

  // Build page content stream
  const pageLines: string[] = [];
  const pageWidth = 842; // A4 landscape
  const pageHeight = 595;
  const margin = 40;
  const fontSize = 9;
  const headerFontSize = 14;
  const subFontSize = 10;
  const lineHeight = 14;
  const colCount = columns.length;
  const usableWidth = pageWidth - margin * 2;
  const colWidth = usableWidth / colCount;

  let y = pageHeight - margin;
  let pageCount = 0;

  function newPage() {
    if (pageCount > 0) {
      pageLines.push("ET");
      pageLines.push("endstream");
      pageLines.push("endobj");
    }
    pageCount++;
    y = pageHeight - margin;
    pageLines.push(`${objectCount + pageCount} 0 obj`);
    pageLines.push("<< /Length 00000 >>");
    pageLines.push("stream");
    pageLines.push("BT");
    pageLines.push(`/F1 ${headerFontSize} Tf`);
    pageLines.push(`1 0 0 1 ${margin} ${y} Tm`);
    pageLines.push(`(${escapePdf(`Chemical Register — ${farmName}`)}) Tj`);
    y -= lineHeight * 1.5;

    pageLines.push(`/F2 ${subFontSize} Tf`);
    pageLines.push(`1 0 0 1 ${margin} ${y} Tm`);
    pageLines.push(`(${escapePdf(`Generated: ${new Date().toLocaleDateString()}`)}) Tj`);
    y -= lineHeight * 2;

    // Table header
    pageLines.push(`/F2 ${fontSize} Tf`);
    let hx = margin;
    for (let i = 0; i < colCount; i++) {
      pageLines.push(`1 0 0 1 ${hx} ${y} Tm`);
      pageLines.push(`(${escapePdf(columns[i])}) Tj`);
      hx += colWidth;
    }
    y -= lineHeight;

    // Header underline
    pageLines.push("ET");
    pageLines.push(`0.6 0.6 0.6 rg`);
    pageLines.push(`${margin} ${y + 4} ${usableWidth} 1 re f`);
    pageLines.push(`0 0 0 rg`);
    pageLines.push("BT");
    pageLines.push(`/F1 ${fontSize} Tf`);
  }

  newPage();

  for (const row of rows) {
    if (y < margin + lineHeight) {
      newPage();
    }
    let cx = margin;
    for (let i = 0; i < row.cells.length; i++) {
      const text = row.cells[i] ?? "";
      // Truncate to fit column width
      const maxChars = Math.floor(colWidth / (fontSize * 0.5));
      const truncated = text.length > maxChars ? text.slice(0, maxChars - 1) + "\u2026" : text;
      pageLines.push(`1 0 0 1 ${cx} ${y} Tm`);
      pageLines.push(`(${escapePdf(truncated)}) Tj`);
      cx += colWidth;
    }
    y -= lineHeight;
  }

  pageLines.push("ET");
  pageLines.push("endstream");
  pageLines.push("endobj");

  // Calculate content lengths for each page stream
  // We need to fix the /Length values
  const pageContentBlocks: string[] = [];
  for (let i = 0; i < pageLines.length; i++) {
    const line = pageLines[i];
    if (line.includes("/Length 00000")) {
      // Find the matching endstream
      let contentStart = i + 1; // after "stream"
      let contentEnd = contentStart;
      for (let j = contentStart; j < pageLines.length; j++) {
        if (pageLines[j] === "endstream") {
          contentEnd = j;
          break;
        }
      }
      const content = pageLines.slice(contentStart + 1, contentEnd).join("\n");
      pageLines[i] = `<< /Length ${content.length} >>`;
    }
    pageContentBlocks.push(pageLines[i]);
  }

  // Font objects (used later in the rebuild phase)
  addObj("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
  addObj("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>");

  // Pages content objects (we reserved objectCount+1..objectCount+pageCount)
  // Now we need to add them properly
  for (let p = 0; p < pageCount; p++) {
    objectCount++;
  }

  // Replace the page content in pageContentBlocks with proper object references
  // Actually, let's rebuild the PDF properly

  // Reset and build properly
  const objects: { id: number; content: string }[] = [];
  let nextId = 1;

  function obj(content: string): number {
    const id = nextId++;
    objects.push({ id, content });
    return id;
  }

  // Catalog and Pages placeholder IDs
  const catalogId = nextId++;
  const pagesId = nextId++;
  const f1Id = obj("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
  const f2Id = obj("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>");

  // Build page content streams
  const pageStreamIds: number[] = [];
  const pageIds: number[] = [];

  // Re-parse the page content we already generated
  // Split into individual page streams
  const pageStreams: string[] = [];
  let currentStream: string[] = [];
  let inStream = false;

  for (const line of pageContentBlocks) {
    if (line.includes("/Length") && line.includes(">>") && !inStream) {
      // Start of a stream object header - skip (we'll recalculate)
      inStream = true;
      currentStream = [];
      continue;
    }
    if (line === "stream") continue;
    if (line === "endstream") {
      inStream = false;
      pageStreams.push(currentStream.join("\n"));
      currentStream = [];
      continue;
    }
    if (line === "endobj") {
      continue;
    }
    if (inStream) {
      currentStream.push(line);
    }
  }

  for (const stream of pageStreams) {
    const streamId = obj(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);
    pageStreamIds.push(streamId);
  }

  // Page objects
  for (let i = 0; i < pageCount; i++) {
    const pageId = obj(
      `<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] ` +
      `/Contents ${pageStreamIds[i]} 0 R ` +
      `/Resources << /Font << /F1 ${f1Id} 0 R /F2 ${f2Id} 0 R >> >> >>`
    );
    pageIds.push(pageId);
  }

  // Pages object
  const pagesContent = `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pageCount} >>`;

  // Build final PDF
  const pdf: string[] = [];
  pdf.push("%PDF-1.4");

  const offsets: Record<number, number> = [];
  let bytePos = 0;

  for (const line of ["%PDF-1.4"]) {
    bytePos += line.length + 1;
  }

  // Write catalog
  offsets[catalogId] = bytePos;
  const catalogStr = `${catalogId} 0 obj\n<< /Type /Catalog /Pages ${pagesId} 0 R >>\nendobj`;
  pdf.push(catalogStr);
  bytePos += catalogStr.length + 1;

  // Write pages
  offsets[pagesId] = bytePos;
  const pagesStr = `${pagesId} 0 obj\n${pagesContent}\nendobj`;
  pdf.push(pagesStr);
  bytePos += pagesStr.length + 1;

  // Write all other objects
  for (const o of objects) {
    offsets[o.id] = bytePos;
    const str = `${o.id} 0 obj\n${o.content}\nendobj`;
    pdf.push(str);
    bytePos += str.length + 1;
  }

  // Cross-reference table
  const xrefPos = bytePos;
  pdf.push("xref");
  pdf.push(`0 ${nextId}`);
  pdf.push("0000000000 65535 f ");
  for (let i = 1; i < nextId; i++) {
    const offset = offsets[i] ?? 0;
    pdf.push(`${String(offset).padStart(10, "0")} 00000 n `);
  }

  pdf.push("trailer");
  pdf.push(`<< /Size ${nextId} /Root ${catalogId} 0 R >>`);
  pdf.push("startxref");
  pdf.push(`${xrefPos}`);
  pdf.push("%%EOF");

  const pdfString = pdf.join("\n");
  return new TextEncoder().encode(pdfString);
}

export function downloadPdf(data: Uint8Array, filename: string) {
  const blob = new Blob([data.buffer as ArrayBuffer], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}