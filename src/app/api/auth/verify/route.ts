import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, verificationTokens } from "@/lib/db/schema";
import { createToken, setSessionCookie } from "@/lib/auth-helpers";
import { eq, and } from "drizzle-orm";
import { Resend } from "resend";

function getResend() {
  const key = process.env.AUTH_RESEND_KEY;
  if (!key) return null;
  return new Resend(key);
}

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(req: Request) {
  try {
    const { email, code, action } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    if (action === "send") {
      // Generate and store verification code
      const verifyCode = generateCode();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Delete old codes for this email
      await db
        .delete(verificationTokens)
        .where(eq(verificationTokens.identifier, email.toLowerCase()));

      // Insert new code
      await db.insert(verificationTokens).values({
        identifier: email.toLowerCase(),
        token: verifyCode,
        expires: expiresAt,
      });

      // Send email
      try {
        const resend = getResend();
        if (!resend) {
          console.log("Resend not configured, skipping email");
          return NextResponse.json({ success: true, message: "Verification code sent" });
        }
        await resend.emails.send({
          from: "Pathways AI <onboarding@resend.dev>",
          to: email,
          subject: "Your Pathways AI Verification Code",
          html: `
            <div style="font-family: sans-serif; max-width: 400px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #1a1a1a;">Verify Your Email</h2>
              <p style="color: #555;">Your verification code is:</p>
              <div style="background: #f4f4f5; border-radius: 8px; padding: 16px; text-align: center; margin: 20px 0;">
                <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1a1a1a;">${verifyCode}</span>
              </div>
              <p style="color: #888; font-size: 14px;">This code expires in 10 minutes. If you didn't request this, ignore this email.</p>
            </div>
          `,
        });
      } catch (emailErr) {
        console.error("Email send failed:", emailErr);
        // Continue anyway — user can still use the app
      }

      return NextResponse.json({ success: true, message: "Verification code sent" });
    }

    if (action === "verify") {
      if (!code) {
        return NextResponse.json({ error: "Code is required" }, { status: 400 });
      }

      // Find valid code
      const [token] = await db
        .select()
        .from(verificationTokens)
        .where(
          and(
            eq(verificationTokens.identifier, email.toLowerCase()),
            eq(verificationTokens.token, code)
          )
        )
        .limit(1);

      if (!token) {
        return NextResponse.json({ error: "Invalid verification code" }, { status: 400 });
      }

      if (new Date(token.expires) < new Date()) {
        return NextResponse.json({ error: "Verification code has expired" }, { status: 400 });
      }

      // Delete used code
      await db
        .delete(verificationTokens)
        .where(eq(verificationTokens.identifier, email.toLowerCase()));

      // Mark user as verified
      await db
        .update(users)
        .set({ emailVerified: new Date() })
        .where(eq(users.email, email.toLowerCase()));

      // Get user and create session
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, email.toLowerCase()))
        .limit(1);

      if (user) {
        const jwtToken = await createToken(user.id, user.email);
        await setSessionCookie(jwtToken);
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("Verify error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
