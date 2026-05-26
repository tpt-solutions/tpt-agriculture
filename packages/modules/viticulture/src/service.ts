import { db } from "@tpt/core";
import type { CreateVitBlockInput, UpdateVitBlockInput, CreateVintageRecordInput, UpdateVintageRecordInput, CreateCanopyNoteInput, UpdateCanopyNoteInput } from "./schemas.js";

export async function listBlocks(tenantId: string) {
  return db.vitBlock.findMany({
    where: { tenantId },
    include: {
      vintageRecords: { orderBy: { year: "desc" }, take: 1 },
    },
    orderBy: { name: "asc" },
  });
}

export async function getBlock(tenantId: string, blockId: string) {
  return db.vitBlock.findFirst({
    where: { id: blockId, tenantId },
    include: {
      vintageRecords: { orderBy: { year: "desc" } },
      canopyNotes: { orderBy: { date: "desc" }, take: 10 },
    },
  });
}

export async function createBlock(tenantId: string, data: CreateVitBlockInput) {
  return db.vitBlock.create({ data: { ...data, tenantId } });
}

export async function updateBlock(tenantId: string, blockId: string, data: UpdateVitBlockInput) {
  return db.vitBlock.update({ where: { id: blockId, tenantId }, data });
}

export async function deleteBlock(tenantId: string, blockId: string) {
  return db.vitBlock.delete({ where: { id: blockId, tenantId } });
}

export async function createVintageRecord(data: CreateVintageRecordInput) {
  return db.vintageRecord.create({ data });
}

export async function updateVintageRecord(recordId: string, data: UpdateVintageRecordInput) {
  return db.vintageRecord.update({ where: { id: recordId }, data });
}

export async function deleteVintageRecord(recordId: string) {
  return db.vintageRecord.delete({ where: { id: recordId } });
}

export async function createCanopyNote(data: CreateCanopyNoteInput) {
  return db.canopyNote.create({ data });
}

export async function updateCanopyNote(noteId: string, data: UpdateCanopyNoteInput) {
  return db.canopyNote.update({ where: { id: noteId }, data });
}

export async function deleteCanopyNote(noteId: string) {
  return db.canopyNote.delete({ where: { id: noteId } });
}
