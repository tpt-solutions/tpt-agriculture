import { db } from "@tpt/core";
import type { CreateVegBedInput, UpdateVegBedInput, CreateVegSuccessionInput, UpdateVegSuccessionInput } from "./schemas.js";

export async function listBeds(tenantId: string) {
  return db.vegBed.findMany({
    where: { tenantId },
    include: {
      successions: {
        where: { actualHarvestDate: null },
        orderBy: { plantDate: "asc" },
      },
    },
    orderBy: { name: "asc" },
  });
}

export async function getBed(tenantId: string, bedId: string) {
  return db.vegBed.findFirst({
    where: { id: bedId, tenantId },
    include: { successions: { orderBy: { plantDate: "desc" } } },
  });
}

export async function createBed(tenantId: string, data: CreateVegBedInput) {
  return db.vegBed.create({ data: { ...data, tenantId } });
}

export async function updateBed(tenantId: string, bedId: string, data: UpdateVegBedInput) {
  return db.vegBed.update({ where: { id: bedId, tenantId }, data });
}

export async function deleteBed(tenantId: string, bedId: string) {
  return db.vegBed.delete({ where: { id: bedId, tenantId } });
}

export async function createSuccession(data: CreateVegSuccessionInput) {
  return db.vegSuccession.create({ data });
}

export async function updateSuccession(successionId: string, data: UpdateVegSuccessionInput) {
  return db.vegSuccession.update({ where: { id: successionId }, data });
}

export async function deleteSuccession(successionId: string) {
  return db.vegSuccession.delete({ where: { id: successionId } });
}

export async function getUpcomingHarvests(tenantId: string, days = 14) {
  const until = new Date();
  until.setDate(until.getDate() + days);
  return db.vegSuccession.findMany({
    where: {
      bed: { tenantId },
      actualHarvestDate: null,
      expectedHarvestDate: { lte: until },
    },
    include: { bed: { select: { name: true } } },
    orderBy: { expectedHarvestDate: "asc" },
  });
}
