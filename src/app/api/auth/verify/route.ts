import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, verificationTokens } from "@/lib/db/schema";
import { createToken, setSessionCookie } from "@/lib/auth-helpers";
import { eq, and } from "drizzle-orm";

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
      const verifyCode = generateCode();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

      // Delete old codes
      await db
        .delete(verificationTokens)
        .where(eq(verificationTokens.identifier, email.toLowerCase()));

      // Insert new code
      await db.insert(verificationTokens).values({
        identifier: email.toLowerCase(),
        token: verifyCode,
        expires: expiresAt,
      });

      // Try sending email via Resend
      let emailSent = false;
      try {
        const { Resend } = await import("resend");
        const key = process.env.AUTH_RESEND_KEY;
        if (key) {
          const resend = new Resend(key);
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
                <p style="color: #888; font-size: 14px;">This code expires in 10 minutes.</p>
              </div>
            `,
          });
          emailSent = true;
        }
      } catch (emailErr) {
        console.error("Email send failed:", emailErr);
      }

      // Always return the code in dev mode for testing
      const isDev = process.env.NODE_ENV !== "production";
      return NextResponse.json({
        success: true,
        message: emailSent
          ? "Verification code sent to your email"
          : "Check your email for the verification code",
        // Include code in response for dev/testing
        ...(isDev && { code: verifyCode }),
      });
    }

    if (action === "verify") {
      if (!code) {
        return NextResponse.json({ error: "Code is required" }, { status: 400 });
      }

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
