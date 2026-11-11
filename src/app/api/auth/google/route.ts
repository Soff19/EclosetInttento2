import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { google } from "googleapis";
import {
  getAuthBaseUrl,
  GOOGLE_STATE_COOKIE_NAME,
} from "@/lib/auth";

export async function GET(request: Request) {
  let base: string;
  try {
    base = getAuthBaseUrl(request);
  } catch {
    return NextResponse.json(
      { error: "NEXTAUTH_URL debe ser una URL HTTP o HTTPS válida." },
      { status: 503 },
    );
  }
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return NextResponse.redirect(`${base}/?error=google_not_configured`);
  }

  const state = randomBytes(32).toString("hex");
  const oauth2Client = new google.auth.OAuth2(
    clientId,
    clientSecret,
    `${base}/api/auth/google/callback`,
  );
  const url = oauth2Client.generateAuthUrl({
    scope: ["openid", "email", "profile"],
    prompt: "select_account",
    state,
  });
  const response = NextResponse.redirect(url);
  response.cookies.set(GOOGLE_STATE_COOKIE_NAME, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/api/auth/google",
  });
  return response;
}
