import crypto from "node:crypto";
import { UserRole } from "@prisma/client";
import type { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export const SESSION_COOKIE_NAME = "em_session";
const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 7;

function hashSessionToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function normalizeRoles(role: UserRole | UserRole[]): UserRole[] {
  return Array.isArray(role) ? role : [role];
}

export function createSessionCookieOptions(expiresAt: Date, secure = false) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure,
    path: "/",
    expires: expiresAt,
  };
}

export function secureCookiesEnabled() {
  return process.env.COOKIE_SECURE === "true";
}

export async function createSession(userId: string) {
  const token = crypto.randomBytes(48).toString("hex");
  const tokenHash = hashSessionToken(token);
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  await prisma.session.create({
    data: {
      tokenHash,
      userId,
      expiresAt,
    },
  });

  return { token, expiresAt };
}

export async function deleteSessionByToken(token: string) {
  const tokenHash = hashSessionToken(token);

  await prisma.session.deleteMany({
    where: {
      tokenHash,
    },
  });
}

export async function getUserFromSessionToken(token: string | null | undefined) {
  if (!token) {
    return null;
  }

  const tokenHash = hashSessionToken(token);

  const session = await prisma.session.findUnique({
    where: {
      tokenHash,
    },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          role: true,
          fullName: true,
          clientId: true,
        },
      },
    },
  });

  if (!session) {
    return null;
  }

  if (session.expiresAt <= new Date()) {
    await prisma.session
      .delete({
        where: {
          id: session.id,
        },
      })
      .catch(() => undefined);

    return null;
  }

  return session.user;
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  return getUserFromSessionToken(token);
}

export async function getCurrentUserFromRequest(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  return getUserFromSessionToken(token);
}

export async function requireRole(role: UserRole | UserRole[], nextPath = "/admin") {
  const allowedRoles = normalizeRoles(role);
  const user = await getCurrentUser();

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  }

  if (!allowedRoles.includes(user.role)) {
    redirect(`/login?next=${encodeURIComponent(nextPath)}&reason=forbidden`);
  }

  return user;
}

export async function requireRoleFromRequest(request: NextRequest, role: UserRole | UserRole[]) {
  const allowedRoles = normalizeRoles(role);
  const user = await getCurrentUserFromRequest(request);

  if (!user) {
    return null;
  }

  if (!allowedRoles.includes(user.role)) {
    return null;
  }

  return user;
}
