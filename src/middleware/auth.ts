import type { NextFunction, Request, Response } from "express";
import { eq } from "drizzle-orm";
import { db } from "../db/index.ts";
import { users } from "../db/schema.ts";
import { adminAuth } from "../lib/firebase-admin.ts";
import { verifySessionToken } from "../lib/riskMath.ts";

export interface AuthenticatedUser {
  id: number;
  uid: string | null;
  firstName: string;
  lastName: string;
  email: string;
  roles: string[];
  department: string | null;
  zone: string | null;
  phone: string | null;
  isActive: boolean;
}

export interface AuthRequest extends Request {
  user?: AuthenticatedUser;
}

const OWNER_ADMIN_EMAIL = "aymen.pharm980@gmail.com";

export function toSafeUser(row: typeof users.$inferSelect): AuthenticatedUser {
  return {
    id: row.id,
    uid: row.uid ?? null,
    firstName: row.firstName,
    lastName: row.lastName,
    email: row.email,
    roles: Array.isArray(row.roles) ? row.roles : ["employee"],
    department: row.department ?? null,
    zone: row.zone ?? null,
    phone: row.phone ?? null,
    isActive: row.isActive,
  };
}

/**
 * Safely synchronize a Firebase Auth user into PostgreSQL using Drizzle upsert.
 */
export async function syncFirebaseUser(params: {
  uid: string;
  email: string;
  name?: string;
}): Promise<AuthenticatedUser> {
  const email = params.email.toLowerCase().trim();
  const nameParts = (params.name || email.split("@")[0] || "PROSAFE User").trim().split(/\s+/);
  const firstName = nameParts[0] || "PROSAFE";
  const lastName = nameParts.slice(1).join(" ") || "User";
  const defaultRoles = email === OWNER_ADMIN_EMAIL ? ["admin"] : ["sst_manager"];

  try {
    // Check if an existing user with this email exists (link UID)
    const byEmail = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (byEmail.length > 0) {
      const existing = byEmail[0];
      if (!existing.uid) {
        const [updated] = await db
          .update(users)
          .set({ uid: params.uid })
          .where(eq(users.id, existing.id))
          .returning();
        return toSafeUser(updated);
      }
      return toSafeUser(existing);
    }

    const [upserted] = await db
      .insert(users)
      .values({
        uid: params.uid,
        email,
        firstName,
        lastName,
        roles: defaultRoles,
        department: "HSE Operations",
        zone: "Headquarters",
        isActive: true,
      })
      .onConflictDoUpdate({
        target: users.uid,
        set: { email },
      })
      .returning();

    return toSafeUser(upserted);
  } catch (error) {
    console.error("Failed to synchronize Firebase user:", error);
    throw new Error("Unable to load user profile.", { cause: error });
  }
}

export async function resolveUserFromToken(token: string): Promise<AuthenticatedUser | null> {
  // 1. Check server-signed HMAC session token first
  const session = verifySessionToken(token);
  if (session) {
    try {
      const rows = await db
        .select()
        .from(users)
        .where(eq(users.id, session.sub))
        .limit(1);
      if (rows.length > 0 && rows[0].isActive) {
        return toSafeUser(rows[0]);
      }
      return null;
    } catch (error) {
      console.error("Session user lookup failed:", error);
      return null;
    }
  }

  // 2. Verify Firebase Auth ID token
  try {
    const decoded = await adminAuth.verifyIdToken(token);
    if (!decoded.email) return null;
    return await syncFirebaseUser({
      uid: decoded.uid,
      email: decoded.email,
      name: decoded.name,
    });
  } catch {
    return null;
  }
}

export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized: Missing token" });
  }
  const token = header.slice("Bearer ".length).trim();
  if (!token) {
    return res.status(401).json({ error: "Unauthorized: Empty token" });
  }

  const user = await resolveUserFromToken(token);
  if (!user) {
    return res.status(401).json({ error: "Unauthorized: Invalid or expired token" });
  }

  req.user = user;
  next();
};

export const requireManager = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const roles = req.user?.roles ?? [];
  if (!roles.includes("admin") && !roles.includes("sst_manager")) {
    return res.status(403).json({ error: "Forbidden: Manager access required" });
  }
  next();
};

export const requireAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const roles = req.user?.roles ?? [];
  if (!roles.includes("admin")) {
    return res.status(403).json({ error: "Forbidden: Administrator access required" });
  }
  next();
};
