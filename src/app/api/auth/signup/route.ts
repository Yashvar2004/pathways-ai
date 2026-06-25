import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { hashPassword } from "@/lib/auth-helpers";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    const existing = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    const userId = randomUUID();
    const hashedPassword = await hashPassword(password);

    await db.insert(users).values({
      id: userId,
      name: name || email.split("@")[0],
      email: email.toLowerCase(),
      password: hashedPassword,
      emailVerified: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Store in marketing subscribers
    try {
      const { marketingSubscribers } = await import("@/lib/db/schema");
      await db.insert(marketingSubscribers).values({
        email: email.toLowerCase(),
        name: name || email.split("@")[0],
        source: "signup",
        optedIn: true,
        createdAt: new Date(),
      }).onConflictDoNothing();
    } catch (e) {
      console.log("Marketing subscriber save skipped:", e);
    }

    return NextResponse.json({
      success: true,
      userId,
      email: email.toLowerCase(),
    });
  } catch (error: any) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
