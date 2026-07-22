// Copyright 2024 TPT Solutions Ltd. // SPDX-License-Identifier: Apache-2.0

/**
 * Downscales an image file to a max dimension and re-encodes as JPEG before it's
 * stored as a base64 blob in SQLite — a full-resolution phone photo (3-8 MB) would
 * otherwise bloat every farm's DB and backup export. Non-image files pass through
 * unchanged (just base64-encoded) since there's nothing to resize.
 */
const MAX_DIMENSION = 1600;
const JPEG_QUALITY = 0.8;
const MAX_NON_IMAGE_BYTES = 10 * 1024 * 1024; // 10 MB

export interface ProcessedFile {
  fileName: string;
  mimeType: string;
  fileSize: number;
  dataBase64: string;
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function dataUrlToBase64(dataUrl: string): string {
  const comma = dataUrl.indexOf(",");
  return comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl;
}

async function resizeImage(file: File): Promise<ProcessedFile> {
  const dataUrl = await readFileAsDataUrl(file);
  const img = new Image();
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error("Failed to decode image"));
    img.src = dataUrl;
  });

  const scale = Math.min(1, MAX_DIMENSION / Math.max(img.width, img.height));
  const width = Math.round(img.width * scale);
  const height = Math.round(img.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");
  ctx.drawImage(img, 0, 0, width, height);

  const resizedDataUrl = canvas.toDataURL("image/jpeg", JPEG_QUALITY);
  const base64 = dataUrlToBase64(resizedDataUrl);
  return {
    fileName: file.name.replace(/\.\w+$/, "") + ".jpg",
    mimeType: "image/jpeg",
    fileSize: Math.round((base64.length * 3) / 4),
    dataBase64: base64,
  };
}

export async function processAttachmentFile(file: File): Promise<ProcessedFile> {
  if (file.type.startsWith("image/")) {
    return resizeImage(file);
  }
  if (file.size > MAX_NON_IMAGE_BYTES) {
    throw new Error(`File too large (max ${MAX_NON_IMAGE_BYTES / 1024 / 1024} MB)`);
  }
  const dataUrl = await readFileAsDataUrl(file);
  return {
    fileName: file.name,
    mimeType: file.type || "application/octet-stream",
    fileSize: file.size,
    dataBase64: dataUrlToBase64(dataUrl),
  };
}
