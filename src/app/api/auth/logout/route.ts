import { NextRequest, NextResponse } from "next/server";
import {
  createSessionCookieOptions,
  deleteSessionByToken,
  secureCookiesEnabled,
  SESSION_COOKIE_NAME,
} from "@/lib/auth";

export async function POST(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  if (token) {
    await deleteSessionByToken(token);
  }

  const response = NextResponse.json({ message: "Signed out" });

  response.cookies.set(SESSION_COOKIE_NAME, "", {
    ...createSessionCookieOptions(new Date(0), secureCookiesEnabled()),
    maxAge: 0,
  });

  return response;
}
