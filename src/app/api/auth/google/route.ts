import { NextResponse } from "next/server";
import { google } from "googleapis";

export async function GET() {
  const base = process.env.NEXTAUTH_URL || "http://localhost:3000";
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return NextResponse.redirect(`${base}/?error=google_not_configured`);
  }
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${base}/api/auth/google/callback`
  );
  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: ["email", "profile"],
    prompt: "select_account",
  });
  return NextResponse.redirect(url);
}
