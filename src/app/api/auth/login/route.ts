import { compare } from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  createSession,
  createSessionCookieOptions,
  SESSION_COOKIE_NAME,
  getCurrentUserFromRequest,
  secureCookiesEnabled,
} from "@/lib/auth";
import { loginInputSchema } from "@/lib/validators";

export async function POST(request: NextRequest) {
  const existingUser = await getCurrentUserFromRequest(request);

  if (existingUser) {
    return NextResponse.json({ message: "Already authenticated", user: existingUser }, { status: 200 });
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const parsed = loginInputSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Validation failed",
        details: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  const username = parsed.data.username.trim().toLowerCase();

  const user = await prisma.user.findUnique({
    where: {
      username,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const passwordMatches = await compare(parsed.data.password, user.passwordHash);

  if (!passwordMatches) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const session = await createSession(user.id);

  const response = NextResponse.json(
    {
      message: "Authenticated",
      user: {
        username: user.username,
        role: user.role,
      },
    },
    { status: 200 },
  );

  response.cookies.set(
    SESSION_COOKIE_NAME,
    session.token,
    createSessionCookieOptions(session.expiresAt, secureCookiesEnabled()),
  );

  return response;
}
