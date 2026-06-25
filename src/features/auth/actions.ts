"use server";

import { getAuth, getCurrentUser } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function syncUser() {
  const { userId } = await getAuth();
  if (!userId) return null;

  const clerkUser = await getCurrentUser();
  if (!clerkUser) return null;

  const email = clerkUser.email;
  if (!email) return null;

  // Check if user exists in our DB
  const [existing] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!existing) {
    // Create user in our DB
    await db.insert(users).values({
      id: userId,
      email,
      name: clerkUser.firstName
        ? `${clerkUser.firstName} ${clerkUser.lastName}`.trim()
        : email.split("@")[0],
    });
  }

  return userId;
}

export async function signOutAction() {
  // Clerk handles sign out on the client side
}
