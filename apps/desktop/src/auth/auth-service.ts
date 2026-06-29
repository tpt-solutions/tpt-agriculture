import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { getDb } from "@tpt/core";
import { users, sessions, farms, farmUsers } from "@tpt/core/schema";
import type { FarmRole } from "@tpt/core/schema";

const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;
const SESSION_KEY = "tpt-session-id";

export interface CurrentUser {
  userId: string;
  name: string;
  email: string;
  farmId: string;
  farmName: string;
  role: FarmRole;
}

export function getStoredSessionId(): string | null {
  return localStorage.getItem(SESSION_KEY);
}

export function setStoredSessionId(id: string) {
  localStorage.setItem(SESSION_KEY, id);
}

export function clearStoredSession() {
  localStorage.removeItem(SESSION_KEY);
}

export async function createFarmSetup(data: {
  farmName: string;
  ownerName: string;
  email: string;
  password: string;
}): Promise<CurrentUser> {
  const db = getDb();
  const passwordHash = await bcrypt.hash(data.password, 10);

  const userId = crypto.randomUUID();
  const farmId = crypto.randomUUID();
  const now = new Date();

  await db.insert(users).values({
    id: userId,
    name: data.ownerName,
    email: data.email.toLowerCase(),
    passwordHash,
    createdAt: now,
    updatedAt: now,
  });

  await db.insert(farms).values({
    id: farmId,
    name: data.farmName,
    createdAt: now,
    updatedAt: now,
  });

  await db.insert(farmUsers).values({
    id: crypto.randomUUID(),
    farmId,
    userId,
    role: "OWNER",
  });

  return createSession(
    userId,
    farmId,
    data.farmName,
    "OWNER",
    data.ownerName,
    data.email
  );
}

export async function login(
  email: string,
  password: string
): Promise<CurrentUser> {
  const db = getDb();
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email.toLowerCase()))
    .limit(1);

  if (!user) throw new Error("No account found with that email");

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw new Error("Incorrect password");

  const [membership] = await db
    .select({ farmId: farmUsers.farmId, role: farmUsers.role })
    .from(farmUsers)
    .where(eq(farmUsers.userId, user.id))
    .limit(1);

  if (!membership)
    throw new Error("User is not associated with any farm");

  const [farm] = await db
    .select({ name: farms.name })
    .from(farms)
    .where(eq(farms.id, membership.farmId))
    .limit(1);

  return createSession(
    user.id,
    membership.farmId,
    farm?.name ?? "",
    membership.role,
    user.name,
    user.email
  );
}

async function createSession(
  userId: string,
  farmId: string,
  farmName: string,
  role: FarmRole,
  name: string,
  email: string
): Promise<CurrentUser> {
  const db = getDb();
  const sessionId = crypto.randomUUID();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SESSION_DURATION_MS);

  await db.insert(sessions).values({
    id: sessionId,
    userId,
    expiresAt,
    createdAt: now,
  });

  setStoredSessionId(sessionId);

  return { userId, name, email, farmId, farmName, role };
}

export async function validateSession(): Promise<CurrentUser | null> {
  const sessionId = getStoredSessionId();
  if (!sessionId) return null;

  const db = getDb();
  const [session] = await db
    .select()
    .from(sessions)
    .where(eq(sessions.id, sessionId))
    .limit(1);

  if (!session || session.expiresAt < new Date()) {
    clearStoredSession();
    return null;
  }

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, session.userId))
    .limit(1);

  if (!user) {
    clearStoredSession();
    return null;
  }

  const [membership] = await db
    .select({ farmId: farmUsers.farmId, role: farmUsers.role })
    .from(farmUsers)
    .where(eq(farmUsers.userId, user.id))
    .limit(1);

  if (!membership) {
    clearStoredSession();
    return null;
  }

  const [farm] = await db
    .select({ name: farms.name })
    .from(farms)
    .where(eq(farms.id, membership.farmId))
    .limit(1);

  return {
    userId: user.id,
    name: user.name,
    email: user.email,
    farmId: membership.farmId,
    farmName: farm?.name ?? "",
    role: membership.role,
  };
}

export async function logout() {
  const sessionId = getStoredSessionId();
  if (sessionId) {
    const db = getDb();
    await db.delete(sessions).where(eq(sessions.id, sessionId));
  }
  clearStoredSession();
}

export async function hasAnyFarms(): Promise<boolean> {
  const db = getDb();
  const [farm] = await db.select().from(farms).limit(1);
  return !!farm;
}
