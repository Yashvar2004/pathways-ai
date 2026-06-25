import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";

const SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET || "pathways-ai-secret-2026-production"
);

const COOKIE_NAME = "pathways-session";

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createToken(
  userId: string,
  email: string
): Promise<string> {
  return new SignJWT({ userId, email })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(SECRET);
}

export async function getAuth(): Promise<{ userId: string | null }> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return { userId: null };

    const { payload } = await jwtVerify(token, SECRET);
    return { userId: (payload.userId as string) || null };
  } catch {
    return { userId: null };
  }
}

export async function getCurrentUser(): Promise<{
  id: string;
  email: string;
  firstName: string;
  lastName: string;
} | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;

    const { payload } = await jwtVerify(token, SECRET);
    if (!payload.userId) return null;

    return {
      id: payload.userId as string,
      email: (payload.email as string) || "",
      firstName: "",
      lastName: "",
    };
  } catch {
    return null;
  }
}

// Get full user from DB
export async function getDbUser() {
  const { userId } = await getAuth();
  if (!userId) return null;

  const { db } = await import("@/lib/db");
  const { users } = await import("@/lib/db/schema");
  const { eq } = await import("drizzle-orm");

  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  return user || null;
}

export async function requireAuth(): Promise<string> {
  const { userId } = await getAuth();
  if (!userId) throw new Error("Not authenticated");
  return userId;
}

export async function setSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
