import { eq, and, asc, desc } from "drizzle-orm";
import { getDb } from "@tpt/core";
import { vitBlocks, vintageRecords, canopyNotes } from "@tpt/core/schema";
import type { CreateVitBlockInput, UpdateVitBlockInput, CreateVintageRecordInput, UpdateVintageRecordInput, CreateCanopyNoteInput, UpdateCanopyNoteInput } from "./schemas.js";

export async function listBlocks(farmId: string) {
  const db = getDb();
  return db.select().from(vitBlocks).where(eq(vitBlocks.farmId, farmId)).orderBy(asc(vitBlocks.name));
}

export async function getBlock(farmId: string, blockId: string) {
  const db = getDb();
  const [block] = await db.select().from(vitBlocks)
    .where(and(eq(vitBlocks.id, blockId), eq(vitBlocks.farmId, farmId)))
    .limit(1);
  if (!block) return null;
  const vintages = await db.select().from(vintageRecords).where(eq(vintageRecords.blockId, blockId)).orderBy(desc(vintageRecords.year));
  const notes = await db.select().from(canopyNotes).where(eq(canopyNotes.blockId, blockId)).orderBy(desc(canopyNotes.date)).limit(10);
  return { ...block, vintageRecords: vintages, canopyNotes: notes };
}

export async function createBlock(farmId: string, data: CreateVitBlockInput) {
  const db = getDb();
  const [row] = await db.insert(vitBlocks).values({ ...data, farmId }).returning();
  return row;
}

export async function updateBlock(farmId: string, blockId: string, data: UpdateVitBlockInput) {
  const db = getDb();
  const [row] = await db.update(vitBlocks).set(data)
    .where(and(eq(vitBlocks.id, blockId), eq(vitBlocks.farmId, farmId)))
    .returning();
  return row;
}

export async function deleteBlock(farmId: string, blockId: string) {
  const db = getDb();
  await db.delete(vitBlocks).where(and(eq(vitBlocks.id, blockId), eq(vitBlocks.farmId, farmId)));
}

export async function createVintageRecord(data: CreateVintageRecordInput) {
  const db = getDb();
  const [row] = await db.insert(vintageRecords).values(data).returning();
  return row;
}

export async function updateVintageRecord(recordId: string, data: UpdateVintageRecordInput) {
  const db = getDb();
  const [row] = await db.update(vintageRecords).set(data).where(eq(vintageRecords.id, recordId)).returning();
  return row;
}

export async function deleteVintageRecord(recordId: string) {
  const db = getDb();
  await db.delete(vintageRecords).where(eq(vintageRecords.id, recordId));
}

export async function createCanopyNote(data: CreateCanopyNoteInput) {
  const db = getDb();
  const [row] = await db.insert(canopyNotes).values(data).returning();
  return row;
}

export async function updateCanopyNote(noteId: string, data: UpdateCanopyNoteInput) {
  const db = getDb();
  const [row] = await db.update(canopyNotes).set(data).where(eq(canopyNotes.id, noteId)).returning();
  return row;
}

export async function deleteCanopyNote(noteId: string) {
  const db = getDb();
  await db.delete(canopyNotes).where(eq(canopyNotes.id, noteId));
}
